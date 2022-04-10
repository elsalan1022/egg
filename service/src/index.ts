/* eslint-disable @typescript-eslint/consistent-type-assertions */
import os from 'os';
import url from 'url';
import express from 'express';
import bodyParser from 'body-parser';
import form from 'express-formidable';
import env from './environment';
import { logger } from './utils/logger';
import rpc, { RpcInstance, RpcFacade } from './rpc';
import modules from './modules/index';

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: ', err.toString());
  if (err.stack) {
    logger.error(err.stack);
  }
});

/** express */
const expr = express();

/** config express */
expr.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.end('OK');
  } else {
    next();
  }
});

expr.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
expr.use(bodyParser.json({ limit: '20mb' }));
expr.use(form());

async function loadModules(app: any) {
  const facades: Record<string, RpcFacade> = {};
  for (const [name, ins] of Object.entries(modules as any as Record<string, RpcInstance>)) {
    const instance = typeof ins === 'function' ? (await ins(expr)) : ins;
    const facade: RpcFacade = {
      instance,
      methods: new Set(),
    };
    let keys = Object.keys(instance);
    if (!keys.length) {
      keys = Object.getOwnPropertyNames(instance);
    }
    if (!keys.length) {
      keys = Object.getOwnPropertyNames(instance.__proto__);
    }
    for (const mn of keys) {
      if (mn === 'constructor' || !/^[\w\d]+$/i.test(mn)) {
        continue;
      }
      const v = instance[mn];
      if (typeof v !== 'function') {
        continue;
      }
      facade.methods.add(mn);
    }
    facades[name] = facade;
    logger.info(`Module ${name} loaded!`);
  }
  rpc.init('/__rpc__/connection', app, facades);
}

// lsof -i:3080
logger.info('sps deamon initializing...');
const upgradeEvents: any = {};
const app = expr.listen(env.options.port || 0, () => {
  /** init express upgrade hook */
  (app as any).onUpgrade = function (name: string | number, cb: any) {
    upgradeEvents[name] = cb;
  };
  (app as any).downUpgrade = (name: string | number) => delete upgradeEvents[name];

  app.on('upgrade', (request, socket, head) => {
    const pathInfo = request.url ? url.parse(request.url) : { pathname: undefined };
    const { pathname } = pathInfo;
    const cb = upgradeEvents[pathname || ''];
    if (cb) cb(request, socket, head);
  });

  loadModules(app);

  const { port } = app.address() as any;

  env.net.port = port;

  process.stdout.write(`[port=${port}]\n`);

  app.setTimeout(120000);
  const interfaces: any = [];
  Object.values(os.networkInterfaces()).forEach((e) => {
    if (!e) {
      return;
    }
    e.filter(detail => detail.family === 'IPv4').forEach((detail) => {
      interfaces.push(detail);
    });
  });

  logger.info(`sps started, open link to access : ${interfaces.map((e: { address: any; }) => `http://${e.address}:${port}/`).join(', ')}`);
});
