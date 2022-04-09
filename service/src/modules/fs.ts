import fs from 'fs';
import path from 'path';
import { Module, } from 'egg/fs';
import { env } from '../environment';

export class Class implements Module {
  async readFile(cxt: DispContext, filepath: string): Promise<Buffer> {
    if (/\.\//.test(filepath)) {
      throw new Error('illegal filepath with \'./\'');
    }
    const absPath = path.resolve(env.options.root, filepath);
    return fs.readFileSync(absPath);
  }
  async writeFile(cxt: DispContext, filepath: string, data: Buffer): Promise<void> {
    if (/\.\//.test(filepath)) {
      throw new Error('illegal filepath with \'./\'');
    }
    const absPath = path.resolve(env.options.root, filepath);
    return fs.writeFileSync(absPath, data);
  }
  [key: string]: (cxt: DispContext, ...args: any[]) => any;
}

export default {
  instance: new Class(),
};
