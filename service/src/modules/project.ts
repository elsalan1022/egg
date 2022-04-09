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
const absPath = path.resolve(absRoot, 'egg.json');

export class Class implements Module {
  load(_cxt: DispContext): Promise<config.Project> {
    return JSON.parse(fs.readFileSync(absPath, 'utf8'));
  }
  async save(cxt: DispContext, cfg: config.Project): Promise<void> {
    fs.writeFileSync(absPath, JSON.stringify(cfg, null, 2));
  }
  [key: string]: (cxt: DispContext, ...args: any[]) => any;
}

function parseHttpDate(date: string) {
  const timestamp = date && Date.parse(date);

  return typeof timestamp === 'number'
    ? timestamp
    : NaN;
}

export default {
  instance(expr: express.Express) {
    expr.use('/__egg__/*', async (request, response, next) => {
      const filePathRel = request.originalUrl.split('?')[0].replace(/^\/+/, '');
      if (!filePathRel) {
        return next();
      }
      const filePath = path.resolve(absRoot, filePathRel);
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
          const newPath = lookupModule(absRoot, filePathRel.substring(14));
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
      let mimeType = mime.lookup(filePath);
      if (!/\.(ts)$/i.test(filePath) && !/^text|application/.test(mimeType)) {
        return next();
      }
      let src = '';
      const secFetchDest = request.header('Sec-Fetch-Dest');
      const importType = request.query.import?.toString() || '';
      const moduleType = request.query.type?.toString() || '';
      const scoped = request.query.scoped?.toString() || '';
      if (/\.(js|ts)$/i.test(filePath)) {
        src = fs.readFileSync(filePath, 'utf-8');
        mimeType = 'application/javascript';
        if (moduleType === 'wx-component') {
          src = xs(absRoot, filePathRel, src, importType, `window.__FILE__='${filePathRel}';`);
        } else {
          src = xs(absRoot, filePathRel, src, importType);
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
    expr.use('/__egg__/', express.static(absRoot));
    expr.use('/__egg__/assets/', (request, response, next) => {
      const filePath = path.resolve(absRoot, request.originalUrl.split('?')[0].replace(/^\/__egg__\//, ''));
      if (!fs.existsSync(filePath)) {
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
      const mimeType = mime.lookup(filePath);
      const fileContents = fs.readFileSync(filePath);
      const readStream = new stream.PassThrough();
      readStream.end(fileContents);

      if (!/^text\//.test(mimeType)) {
        response.set('Content-disposition', `attachment; filename=${path.basename(filePath)}`);
      }
      response.set('Content-Type', `${mimeType}; charset=UTF-8`);
      response.set('Last-Modified', stats.mtime.toUTCString());
      response.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidate', 'max-age=0']);
      readStream.pipe(response);
    });
    return new Class();
  }
};
