/* eslint-disable no-restricted-syntax */
import fs from 'fs';
import crypto from 'crypto';
export { default as Logger } from './logger';
export { default as Sys } from './sys';
export { default as Encoding } from './encoding';
export { default as Net } from './net';
export { default as Time } from './time';

const BUFFER_SIZE = 8192;

export const Utils = {
  md5File(file: string): string {
    const fd = fs.openSync(file, 'r');
    const hash = crypto.createHash('md5');
    const buffer = Buffer.alloc(BUFFER_SIZE);

    try {
      let bytesRead;

      do {
        bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE, null);
        hash.update(buffer.slice(0, bytesRead));
      } while (bytesRead === BUFFER_SIZE);
    } finally {
      fs.closeSync(fd);
    }

    return hash.digest('hex');
  },
  sqlValuesFmt(obj: Record<string, any>): Array<{ k: string; value: any }> {
    return Object.entries(obj).map(([k, v]) => {
      if (typeof v === 'object') {
        return { k: `\`${k}\``, value: v };
      } if (/^ts/.test(k) && typeof v === 'number') {
        return { k: `\`${k}\``, value: this.timeFormat(new Date(v), 'yyyyMMddhhmmss') };
      } if (typeof v === 'string') {
        return { k: `\`${k}\``, value: v };
      }
      return { k: `\`${k}\``, value: v };
    });
  },
  sqlObjectFmt(obj: Record<string, any>): Record<string, any> {
    if (!obj) {
      return obj;
    }
    Object.entries(obj).forEach(([k, v]) => {
      if (typeof v === 'string') {
        if (/^"?[[{]/.test(v)) {
          try {
            const vv = JSON.parse(v);
            obj[k] = typeof vv === 'string' ? JSON.parse(vv) : vv;
          } catch (e) {
            // do nothings
          }
        } else if (/^ts/.test(k)) {
          obj[k] = (new Date(v)).getTime();
        }
      }
      return v;
    });
    return obj;
  },
  sqlTimeFmt(v: number): string {
    return this.timeFormat(new Date(v), 'yyyyMMddhhmmss');
  },
  timestamp(): string {
    return this.timeFormat(new Date(), 'yyyyMMddhhmmss');
  },
  timeFormat(date: Date, fmt: string) {
    const o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds(), // 毫秒
    } as any;
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (`${date.getFullYear()}`).substr(4 - RegExp.$1.length));
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
      }
    }
    return fmt;
  },
  verionUp(ver: string) {
    if (!ver) {
      return '0.0.1';
    }
    const values = ver.split('.');
    let v = parseInt(values[2], 10) + 1;
    if (v >= 100) {
      values[2] = '1';
      v = parseInt(values[1], 10) + 1;
      if (v >= 100) {
        values[0] = (parseInt(values[0], 10) + 1).toString();
        values[1] = '1';
      } else {
        values[1] = v.toString();
      }
    } else {
      values[2] = v.toString();
    }
    return values.join('.');
  },
  merge(dst: Record<string, any>, src: Record<string, any>): boolean {
    let merged = false;
    for (const [k, v] of Object.entries(src)) {
      if (dst[k] !== v) {
        dst[k] = v;
        merged = true;
      }
    }
    return merged;
  },
  shortNum(value: number): string {
    if (value === 0) {
      return '';
    }
    if (value < 1000) {
      const b = Math.floor(value / 100);
      const s = Math.floor((value % 100) / 10);
      const g = value % 10;
      const vs = [];
      if (b) {
        vs.push(`${b}百`);
      }
      if (s) {
        vs.push(`${s}十`);
      } else if (g) {
        vs.push('零');
      }
      if (g) {
        vs.push(`${g}`);
      }
      return vs.join('');
    } if (value < 1000000) {
      const v = (value / 1000);
      const t = value % 1000;
      return `${Math.floor(v)}K${this.shortNum(t)}`;
    } if (value < 1000000000) {
      const v = (value / 1000000);
      const t = value % 1000000;
      return `${Math.floor(v)}M${this.shortNum(t)}`;
    } if (value < 1000000000000) {
      const v = (value / 1000000000);
      const t = value % 1000000000;
      return `${Math.floor(v)}G${this.shortNum(t)}`;
    }
    const v = (value / 1000000000000);
    const t = value % 1000000000000;
    return `${Math.floor(v)}T${this.shortNum(t)}`;
  },
  shortCnNum(value: number): string {
    if (value === 0) {
      return '';
    }
    if (value < 1000) {
      return value.toString();
    } if (value < 10000) {
      const v = (value / 1000);
      return `${Math.round(v)}千`;
    } if (value < 1000000) {
      const v = (value / 10000);
      const t = value % 10000;
      return `${Math.floor(v)}万${this.shortNum(t)}`;
    } if (value < 100000000) {
      const v = (value / 1000000);
      const t = value % 1000000;
      return `${Math.floor(v)}百万${this.shortNum(t)}`;
    }
    const v = (value / 100000000);
    const t = value % 100000000;
    return `${Math.floor(v)}亿${this.shortNum(t)}`;
  },
};
