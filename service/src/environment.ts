import os from 'os';
import fs from 'fs';
import minimist from 'minimist';
import pkg from '../package.json';
import { Property } from 'egg';

export const argsAnno: { [key: string]: Omit<Property, 'name'> & { alias: string } } = {
  root: {
    type: 'string',
    alias: 'r',
    description: '指定项目路径',
  },
  port: {
    type: 'number',
    alias: 'p',
    description: '指定服务器端口，默认为随机端口',
  },
};

const entries = Object.entries(argsAnno);

const args = minimist(process.argv.slice(2), {
  alias: Object.fromEntries(entries.map(([k, v]) => [k, v.alias])
    .filter(([, v]) => v)),
  string: entries.filter(([, v]) => v.type === 'string')
    .map(kv => kv[0]),
  boolean: entries.filter(([, v]) => v.type === 'boolean')
    .map(kv => kv[0]),
  default: Object.fromEntries(entries.map(([k, v]) => [k, v.default])
    .filter(([, v]) => v !== undefined)),
});

// alias hyphen args in camel case
Object.keys(args).forEach((key) => {
  const camelKey = key.replace(/-([a-z])/g, ($0, $1) => $1.toUpperCase());
  if (camelKey !== key) args[camelKey] = args[key];
});

export interface Environment {
  /** in debug mode */
  debug: boolean;
  /** vide version */
  version: string;
  /** platform name */
  platform: 'windows' | 'darwin' | 'linux' | string;
  /** relative paths */
  paths: {
    /** where the service app is located */
    bin: string;
  },
  options: {
    root: any;
    port: number;
  };
  net: {
    port: number;
  };
}

export const env: Environment = {
  debug: process.env.NODE_ENV !== 'production',
  version: pkg.version,
  platform: os.platform as any,
  paths: {
    bin: args.bin || process.cwd() || __dirname,
  },
  options: {
    root: args.root || process.cwd() || __dirname,
    port: args.port || 0,
  },
  net: {
    port: args.port,
  },
};

if (!fs.existsSync(env.options.root)) {
  fs.mkdirSync(env.options.root, { recursive: true });
}

export default env;
