/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import path from 'path';
import rpio from 'rpio';
import { Module } from 'egg/rasp';

rpio.open(15, rpio.INPUT);
console.log('Pin 15 is currently ' + (rpio.read(15) ? 'high' : 'low'));

export class Class implements Module {
  async cameraOpen(_cxt: DispContext): Promise<string> {
    return '';
  }
  [key: string]: (cxt: DispContext, ...args: any[]) => any;
}

export default new Class();
