/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import express from 'express';
import { Module, Model } from 'egg/speech';
import { env } from '../environment';

const absRoot = env.options.root;
const modelRoot = path.join(absRoot, 'assets/models/speech');

export class Class implements Module {
  [key: string]: (cxt: DispContext, ...args: any[]) => any;
  async models(cxt: DispContext): Promise<Model[]> {
    return fs.readdirSync(modelRoot).map(e => {
      const data = JSON.parse(fs.readFileSync(path.join(modelRoot, e, 'metadata.json'), 'utf-8'));
      const model: Model = {
        name: e,
        words: data.words
      };
      const transferPath = path.join(modelRoot, e, 'transfer');
      if (fs.existsSync(transferPath)) {
        const transferFile = path.join(transferPath, 'metadata.json');
        const meta = JSON.parse(fs.readFileSync(transferFile, 'utf-8'));
        model.transfer = {
          time: fs.statSync(transferFile).mtimeMs,
          words: meta.wordLabels,
        };
      }
      return model;
    });
  }
  async saveTransferMeta(cxt: DispContext, name: string, data: any): Promise<void> {
    const modelPath = path.join(modelRoot, name);
    if (!fs.existsSync(modelPath)) {
      throw new Error(`model ${name} not found`);
    }
    const transferPath = path.join(modelPath, 'transfer');
    if (!fs.existsSync(transferPath)) {
      fs.mkdirSync(transferPath);
    }
    const filePath = path.join(transferPath, 'metadata.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

export default function (expr: express.Express) {
  expr.post('/__egg__/uploadmodel', async (req, rsp) => {
    try {
      const rs = await uploadModel(req);
      rsp.json({
        code: 0,
        result: rs
      }).end();
    } catch (err: any) {
      rsp.status(510).end(err.message);
    }
  });
  return new Class();
}

export async function uploadModel(req: express.Request): Promise<boolean> {
  if (!req.files) {
    throw 'No files or more than one files were uploaded.';
  }
  const name = req.query.name as string;
  if (!name) {
    throw 'No model name was specified.';
  }
  const modelPath = path.join(modelRoot, name);
  if (!fs.existsSync(modelPath)) {
    throw new Error(`model ${name} not found`);
  }
  const transferPath = path.join(modelPath, 'transfer');
  if (!fs.existsSync(transferPath)) {
    fs.mkdirSync(transferPath);
  }

  for (const [name, file] of Object.entries(req.files)) {
    const filePath = path.join(transferPath, name);
    if (!fs.existsSync(filePath)) {
      fs.renameSync((file as any).path, filePath);
    }
  }

  return true;
}
