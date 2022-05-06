/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import express from 'express';
import mime from 'mime';
import stream from 'stream';
import { config, } from 'egg';
import { Module } from 'egg/project';
import { env } from '../environment';
import { lookupModule } from '../transformer/lookup';
import xs from '../transformer/xs';

const absRoot = env.options.root;
const absProjectsRoot = path.join(absRoot, 'projects');
const absShare = path.join(absRoot, 'share');

export class Class implements Module {
  list(cxt: DispContext): RecSet<string> {
    const items = fs.readdirSync(absProjectsRoot).filter(e => fs.statSync(path.resolve(absProjectsRoot, e)).isDirectory());
    return {
      total: items.length,
      items,
    };
  }
  create(cxt: DispContext, name: string): config.Project {
    const dir = path.resolve(absProjectsRoot, name);
    if (fs.existsSync(dir)) {
      throw new Error(`project ${name} already exists`);
    }
    fs.mkdirSync(dir);
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.mkdirSync(path.join(dir, 'extensions'));
    const cfg = {
      version: '0.0.1',
      units: {},
      variables: {}
    };
    const file = path.resolve(absProjectsRoot, name, 'egg.json');
    fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
    return cfg;
  }
  load(_cxt: DispContext, name: string): config.Project {
    const file = path.resolve(absProjectsRoot, name, 'egg.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  save(cxt: DispContext, name: string, cfg: config.Project): void {
    const file = path.resolve(absProjectsRoot, name, 'egg.json');
    fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
  }
  remove(cxt: DispContext, name: string): void {
    const dir = path.resolve(absProjectsRoot, name);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  [key: string]: (cxt: DispContext, ...args: any[]) => any;
}

function parseHttpDate(date: string) {
  const timestamp = date && Date.parse(date);

  return typeof timestamp === 'number'
    ? timestamp
    : NaN;
}

function resolvePath(originalUrl: string): [string, string] {
  let orgPath = originalUrl.split('?')[0].replace(/^\/__egg__\//, '');
  let filePath = '';
  if (fs.existsSync(filePath = path.resolve(absProjectsRoot, orgPath))) {
    return [filePath, orgPath];
  } else if (fs.existsSync(filePath = path.resolve(absShare, orgPath))) {
    return [filePath, orgPath];
  }
  orgPath = orgPath.replace(/^[^/]+\//, '');
  if (fs.existsSync(filePath = path.resolve(absProjectsRoot, orgPath))) {
    return [filePath, orgPath];
  } else if (fs.existsSync(filePath = path.resolve(absShare, orgPath))) {
    return [filePath, orgPath];
  }
  return ['', ''];
}

export default function (expr: express.Express) {
  expr.use('/__egg__/*/extensions', async (request, response, next) => {
    const [filePath, filePathRel] = resolvePath(request.originalUrl);
    if (!filePath) {
      return next();
    }
    const exists = fs.existsSync(filePath);
    if (exists && fs.statSync(filePath).isDirectory()) {
      return response.redirect(`/${request.path}/index`.replace(/\/\/+/, '/'));
    } if (!exists) {
      for (const it of ['.ts', '.js']) {
        if (fs.existsSync(filePath + it)) {
          return response.redirect(302, `/${filePathRel}${it}${request.url.substring(1)}`);
          // break;
        }
      }
      if (/^\/node_modules\//.test(filePathRel)) {
        const newPath = lookupModule(absProjectsRoot, filePathRel.substring(14));
        if (newPath) {
          return response.redirect(302, `/${newPath}${request.url.substring(1)}`);
        }
      }
      return next();
    }

    const stats = fs.statSync(filePath);
    const unmodifiedSince = parseHttpDate(request.header('if-modified-since') || '');
    // if-unmodified-since
    if (!isNaN(unmodifiedSince) && stats.mtimeMs > unmodifiedSince) {
      response.statusCode = 304;
      return response.end();
    }
    let mimeType = mime.getType(filePath) || '';
    if (!/\.(ts)$/i.test(filePath) && !/^text|application/.test(mimeType)) {
      return next();
    }
    let src = '';
    const importType = request.query.import?.toString() || '';
    const moduleType = request.query.type?.toString() || '';
    if (/\.(js|ts)$/i.test(filePath)) {
      src = fs.readFileSync(filePath, 'utf-8');
      mimeType = 'application/javascript';
      if (moduleType === 'wx-component') {
        src = xs(absProjectsRoot, filePathRel, src, importType, `window.__FILE__='${filePathRel}';`);
      } else {
        src = xs(absProjectsRoot, filePathRel, src, importType);
      }
    } else {
      src = fs.readFileSync(filePath, 'utf-8');
    }
    const fileContents = Buffer.from(src, 'utf-8');
    const readStream = new stream.PassThrough();
    readStream.end(fileContents);

    if (!/^text\//.test(mimeType)) {
      response.set('Content-disposition', `attachment; filename=${path.basename(filePath)}`);
    }
    response.set('Content-Type', `${mimeType}; charset=UTF-8`);
    response.set('Last-Modified', stats.mtime.toUTCString());
    if (/^\/node_modules\//.test(filePathRel)) {
      response.set('Cache-Control', 'max-age=100000');
    } else {
      response.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidate', 'max-age=0']);
    }
    readStream.pipe(response);
  });
  expr.use('/__egg__/*/assets/', (request, response, next) => {
    const [filePath, orgPath] = resolvePath(request.originalUrl);
    if (!filePath) {
      return next();
    }
    const stats = fs.statSync(filePath);
    const unmodifiedSince = parseHttpDate(request.header('if-modified-since') || '');
    // if-unmodified-since
    if (!isNaN(unmodifiedSince) && stats.mtimeMs > unmodifiedSince) {
      response.statusCode = 304;
      return response.end();
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      return response.json(files);
    }
    const mimeType = mime.getType(filePath);
    const fileContents = fs.readFileSync(filePath);
    const readStream = new stream.PassThrough();
    readStream.end(fileContents);

    if (mimeType && !/^text\//.test(mimeType)) {
      response.set('Content-disposition', `attachment; filename=${path.basename(filePath)}`);
    }
    if (mimeType) {
      response.set('Content-Type', `${mimeType}; charset=UTF-8`);
    }
    response.set('Last-Modified', stats.mtime.toUTCString());
    response.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidate', 'max-age=0']);
    readStream.pipe(response);
  });
  return new Class();
}
