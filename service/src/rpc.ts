import ws from 'ws';
import express from 'express';
import { WebSocketMessageReader, WebSocketMessageWriter, createMessageConnection, ConsoleLogger } from 'vscode-ws-jsonrpc';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

/** normal method */
type RpcFunc = (cxt: DispContext, ...args: any[]) => any;

/** rpc module */
interface RpcModule {
  [key: string]: RpcFunc;
}

type RpcModuleFunc = (app: express.Express) => RpcModule;

export interface RpcDeclaration {
  /** use file name as service name */
  name?: string;
  instance: RpcModule | RpcModuleFunc;
  /** 流式接口 */
  streaming?: Array<string>;
  /** 可公开结构（如访客可调度,只支持非流式） */
  public?: Array<string>;
}

export interface RpcFacade {
  instance: RpcModule;
  /** 普通接口 */
  methods: Record<string, RpcFunc>;
}

// create the web socket
const wss = new ws.Server({
  noServer: true,
  perMessageDeflate: false,
});

function handleIncoming(app: express.Express, modules: Record<string, RpcFacade>, url: string) {
  (app as any).onUpgrade(url, (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const accContext: DispContext = {};
    const cookie = request.headers.cookie || '';
    const cookies: any = {};
    cookie.split('; ').forEach((e) => {
      const [k, v] = e.split('=');
      cookies[k] = v;
    });
    accContext.cookies = cookies;
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      const socket = {
        send: (content: any) => webSocket.send(content, (error) => {
          if (error) {
            throw error;
          }
        }),
        onMessage: (cb: (this: ws, data: ws.Data) => void) => webSocket.on('message', cb),
        onError: (cb: (this: ws, err: Error) => void) => webSocket.on('error', cb),
        onClose: (cb: (this: ws, code: number, reason: string) => void) => {
          webSocket.on('close', cb);
        },
        dispose: () => {
          webSocket.close();
        },
      };

      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);

      const newConnection = createMessageConnection(reader, writer, new ConsoleLogger());

      webSocket.on('close', () => {
        accContext.connection = undefined;
        console.log(`${url} closed`);
      });
      const methodHandler = (method: string, params: any[]) => {
        const [, name, methodName] = /^([^.]+)\.(.+)$/.exec(method) || [];
        const mo = modules[name.toLowerCase()];
        if (!mo) {
          throw `module ${name} not found`;
        }
        const me = mo.methods[methodName.toLowerCase()];
        if (!me) {
          throw `method ${name}.${methodName} not found`;
        }
        return me.call(mo.instance, accContext, ...(params || []));
      };
      newConnection.onRequest(methodHandler as any);

      accContext.connection = newConnection;
      newConnection.listen();

      console.log(`connected to ${url}`);
    });
  });
}

export default {
  init(uri: string, app: express.Express, modules: Record<string, RpcFacade>) {
    handleIncoming(app, modules, uri);
  },
};
