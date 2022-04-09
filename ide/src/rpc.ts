/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-plusplus */
import './polyfill';
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import normalizeUrl from 'normalize-url';
import ReconnectingWebSocket from 'reconnecting-websocket';

export type TyUrl = string;

/** 消息处理函数 */
export declare type TyRpcHandler = (...params: any[]) => any;

/** rpc 通道 */
export interface TyRpcConnection {
  // 示例
  //  const s = await rpc.request('Account.List', {
  //    key: 'asd', owner: 'asd1', offset: 1, count: 2,
  //  });
  /** 发送请求 */
  request(method: string, ...args: any[]): Promise<any>,

  /** 订阅事件 */
  describe(method: string, handler: TyRpcHandler, target: any): void,
  /** 取消订阅 */
  undescribe(target: any): void,
}

type RpcObserver = {
  onPending(count: number): void;
  onAlert(error: Error): void;
  onConnected(): void;
};

/** rpc 服务 */
export interface RpcService {
  setupObserver(ovserver: Partial<RpcObserver>): void;
  start(): Promise<void>;
}

type Task = {
  /** 方法 */
  method: string;
  /** 请求携带的数据 */
  args?: any[]
  /** 是否独占模式，默认为true */
  exclusive?: boolean;
  /** 用于promise */
  resolve: any;
  /** 用于promise */
  reject: any
};

export const rpc = new class implements TyRpcConnection, RpcService {
  /** 事件监听 */
  private obserer: RpcObserver = { onPending: () => { }, onAlert: () => { }, onConnected: () => { } };
  /** 装载中计数 */
  private loadingCount = 0;
  /** 请求中的任务（队列中的也算） */
  private pendings: Set<string> = new Set<string>();
  /** 队列中的任务 */
  private reqQueue: Array<Task> = [];
  /** rpc 消息通道 */
  private rawConnection: MessageConnection | undefined;
  /** 订阅清单 */
  private handlers: Record<string, Array<{ target: any, handler: TyRpcHandler }>> = {};
  /** 发送请求 */
  request(method: string | Omit<Task, 'resolve' | 'reject'>, ...args: any[]): Promise<any> {
    const task: Task = typeof method === 'string' ? {
      method,
      args,
      resolve: null,
      reject: null,
    } : method as any;
    const isExclusive = typeof task.exclusive === 'undefined' || task.exclusive;
    if (isExclusive) {
      if (this.pendings.has(task.method)) {
        /** 请求已存在 */
        throw `previous request[${task.method}] is pending`;
      }
      this.pendings.add(task.method);
    }

    this.loadingCount++;
    this.obserer.onPending(this.loadingCount);
    if (!this.rawConnection) {
      this.reqQueue.push(task);
      return new Promise((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
      });
    }
    return this.processTask(this.rawConnection, task);
  }
  /** 订阅事件 */
  describe(method: string, handler: TyRpcHandler, target: any): void {
    const ls = this.handlers[method] || (this.handlers[method] = []);
    ls.push({
      handler,
      target,
    });
  }
  /** 取消订阅 */
  undescribe(target: any): void {
    for (const [method, ls] of Object.entries(this.handlers)) {
      const nls = ls.filter(e => e.target !== target);
      if (nls.length !== ls.length) {
        this.handlers[method] = nls;
      }
    }
  }
  setupObserver(ovserver: Partial<RpcObserver>): void {
    Object.assign(this.obserer, ovserver);
  }
  async start() {
    const url = '/__rpc__/connection';

    const webSocket = await this.createWebSocket(url);

    listen({
      webSocket,
      onConnection: ((connection: MessageConnection) => {
        connection.listen();
        connection.onNotification((method: string, ...params: any[]): void => {
          const ls = rpc.handlers[method];
          if (ls) {
            ls.forEach((it) => {
              it.handler.call(it.target, ...(params || []));
            });
          }
        });
        connection.onRequest((method: string, ...params: any[]): any => {
          const ls = rpc.handlers[method];
          if (ls) {
            // only return first result
            for (const it of ls) {
              return it.handler.call(it.target, ...(params || []));
            }
          }
        });
        rpc.rawConnection = connection;
        connection.onClose(() => {
          rpc.rawConnection = undefined;
        });
        this.obserer.onConnected();
        console.log('rpc connected!');
        rpc.processQueue();
      }).bind(this),
    });
  }
  private processQueue() {
    if (!rpc.rawConnection) {
      return;
    }
    for (const task of this.reqQueue) {
      rpc.rawConnection.sendRequest(task.method, ...(task.args || [])).then((e) => {
        this.pendings.delete(task.method);
        task.resolve(e);
        this.obserer.onPending(this.loadingCount - 1);
        this.loadingCount--;
      })
        .catch((e) => {
          this.pendings.delete(task.method);
          task.reject(e);
          this.obserer.onPending(this.loadingCount - 1);
          this.loadingCount--;
          this.obserer.onAlert(e);
        });
    }
    this.reqQueue.length = 0;
  }
  private processTask(cnn: MessageConnection, task: Task) {
    const promise = cnn.sendRequest(task.method, ...(task.args || []));
    return promise.then((e) => {
      this.pendings.delete(task.method);
      this.obserer.onPending(this.loadingCount - 1);
      this.loadingCount--;
      return e;
    })
      .catch((e) => {
        this.pendings.delete(task.method);
        this.obserer.onPending(this.loadingCount - 1);
        this.loadingCount--;
        this.obserer.onAlert(e);
        throw e;
      });
  }
  private createUrl(path: TyUrl): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${location.host}${path}`);
  }
  private async createWebSocket(url: TyUrl): Promise<WebSocket> {
    const socketOptions = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: Infinity,
      debug: false,
    };
    const webSocket = new ReconnectingWebSocket(this.createUrl(url), [], socketOptions);
    webSocket.binaryType = 'arraybuffer';
    return webSocket as WebSocket;
  }
};

export default rpc as RpcService;
