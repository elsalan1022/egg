import EventEmitter from 'events';

type MemItem<T> = {
  event: EventEmitter;
  locked: boolean;
  expired: number;
  expiredInterval: number;
  accessed: number;
  value: T;
  fetch?(): T;
};

export class MemCache {
  items: Record<string, MemItem<any>> = {};
  constructor(private expired: number) {

  }
  async get<T>(key: string): Promise<T | undefined> {
    const now = Date.now();
    const it = this.items[key];
    if (!it) {
      return undefined;
    } if (it.fetch && it.expired <= now && !it.locked) {
      it.locked = true;
      it.value = await it.fetch();
      it.expired = Date.now() + it.expiredInterval;
      it.locked = false;
    }
    it.accessed = now;
    return it.value;
  }
  async set<T>(key: string, value: T) {
    const it = this.items[key];
    if (it) {
      it.value = value;
    } else {
      return this.reg(key, value);
    }
  }
  async reg<T>(key: string, value: (() => T) | T | undefined, expired?: number) {
    const fetch = typeof value === 'function' ? value : undefined;
    const now = Date.now();
    if (typeof value === 'function') {
      value = undefined as any;
    }
    let it = this.items[key];
    if (it) {
      throw 'conflicted';
    }
    const expiredInterval = expired || this.expired;
    it = {
      event: new EventEmitter,
      locked: false,
      expired: fetch ? (now + expiredInterval) : 0,
      expiredInterval,
      accessed: 0,
      value,
      fetch: fetch as any,
    };
    this.items[key] = it;
    if (it.fetch) {
      it.locked = true;
      it.value = await it.fetch();
      it.expired = Date.now() + this.expired;
      it.locked = false;
    }
  }
  on<T>(key: string, handler: (value: T) => void) {
    const it = this.items[key];
    if (!it) {
      throw 'not exists';
    }
    it.event.on('change', handler);
  }
  fire(key: string) {
    const it = this.items[key];
    if (!it) {
      throw 'not exists';
    }
    it.event.emit('change', it.value);
  }
}

export const gCached = new MemCache(60000);
