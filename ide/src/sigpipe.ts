import Vue from 'vue';

type TyMap<T> = Record<string, T>;

export declare type TySigHandler = (...params: any[]) => any;

const signame = 'signame';
const keymap = {
  alt: '⎇',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  ctrl: '⌃',
  meta: '→',
  shift: '⇧',
};

type TySigOptions = {
  name: string,
  owner: any,
  func: TySigHandler,
  options: TyMap<any>,
  singleton?: boolean,
  pending?: boolean,
};
type TySigHook = {
  owner: any,
  before?: TySigHandler,
  after?: TySigHandler,
};
export const sig: TyMap<TySigHandler> = ((window as any).$sig = {});
export const sigpipe = ((window as any).$sigpipe = {
  sig,
  hooks: [] as any[],
  el: undefined as any,
  visible: false,
  sigmap: {},
  register(owner: any, name: string, options: TyMap<any> | TySigHandler, func?: TySigHandler) {
    if (typeof options == 'function') {
      func = options as TySigHandler;
      options = {};
    }
    sig[name] = (...args: any[]) => {
      const i = (sigpipe.sigmap as any)[name] as TySigOptions;
      return sigpipe.exec(i, args);
    };
    this.sigmap[name] = { name, owner, func, options };
  },
  remove(name: string) {
    delete sig[name];
    delete this.sigmap[name];
  },
  clear(owner: any) {
    // @ts-ignore
    const entries = Object.entries(this.sigmap).filter(e => e[1].owner == owner);
    entries.forEach(entry => {
      delete sig[entry[0]];
      delete this.sigmap[entry[0]];
    });
  },

  exec(i: TySigOptions, args: any[] = []) {
    if (i.singleton && i.pending) {
      throw `singleton function trapped!`;
    }
    for (const iterator of this.hooks) {
      if (iterator.before && !iterator.before.call(iterator.owner, i, ...args)) {
        console.log(`function[${i.name}] call has been blocked by SIGHOOK!`);
        return;
      }
    }
    let excep = undefined;
    let r = undefined;
    try {
      if (i.singleton) i.pending = true;
      r = i.func.call(i.owner, ...args);
    } catch (e) {
      excep = e;
    } finally {
      if (i.singleton) i.pending = false;
    }
    for (const iterator of this.hooks) {
      if (iterator.after) {
        iterator.after.call(iterator.owner, i, ...args);
      }
    }
    if (excep) throw excep;
    return r;
  },

  updateContent() {
    if (!this.el) return;
    let src = `<div style='position: relative; '>`;
    const items = document.querySelectorAll(`[${signame}]`) as any;
    for (const item of items) {
      const name = item.getAttribute(signame);
      if (!name || item.getAttribute('disabled') === 'true') continue;
      const i = (sigpipe.sigmap as any)[name] as TySigOptions;
      if (!i) continue;
      const rt = item.getBoundingClientRect();
      src += `<div style='position: absolute; text-align: center; line-height: ${rt.height}px; left: ${rt.left}px; top: ${rt.top}px; width: ${rt.width}px; height: ${rt.height}px'>`;
      if (i.options.key) {
        src += `<kbd class='kbd-on-meta`;
        if (i.options.shiftKey) {
          src += ` kbd-on-shift`;
        }
        // @ts-ignore
        src += `'>${keymap[i.options.key.toLocaleLowerCase()] || i.options.key}</kbd>`;
      }
      src += `</div>`;
    }
    this.el.innerHTML = src + '</div>';
  },

  onkeydown(e: KeyboardEvent) {
    if (this.visible && (e.ctrlKey || e.metaKey)) {
      for (const key in this.sigmap) {
        const element = this.sigmap[key];
        if (!element.options) {
          continue;
        }
        if (element.options.key === e.key && !!element.options.shiftKey == !!e.shiftKey) {
          const el = document.querySelector(`[${signame}=${key}]`);
          if (!el || el.getAttribute('disabled') === 'true') {
            e.preventDefault();
            return false;
          }
          e.preventDefault();
          sigpipe.exec(element);
          return false;
        }
      }
    } else if (['Control', 'Meta'].indexOf(e.key) != -1) {
      if (this.visible) return true;
      this.visible = true;
      this.updateContent();
      this.el.style.display = 'block';
    }
  },

  onkeyup(e: KeyboardEvent) {
    if (['Control', 'Meta'].indexOf(e.key) === -1) {
      return true;
    }
    if (this.visible) {
      this.visible = false;
      this.el.style.display = 'none';
    } else {
      return true;
    }
  },

  hideKeys() {
    if (this.visible) {
      this.visible = false;
      this.el.style.display = 'none';
    }
  },

  use(doc: Document) {
    doc = doc || document;
    doc.onkeydown = this.onkeydown.bind(this);
    doc.onkeyup = this.onkeyup.bind(this);
    if (!this.el) {
      this.el = document.getElementById('shortcutKeyBoard');
    }
  },

  unuse(doc: Document) {
    doc = doc || document;
    doc.onkeydown = null;
    doc.onkeyup = null;
  },

  hook({ owner, before, after }: TySigHook) {
    this.hooks.push({ owner, before, after });
  },

  unhook(owner: any) {
    this.hooks = this.hooks.filter((e: TySigHook) => e.owner != owner);
  },

  getFocuArea(name: string) {
    return ((this.sigmap[name] || {}).owner || {}).$el;
  },
});

export function setup(vue: any) {
  vue.mixin({
    computed: {
      $sig() {
        return sig;
      },
      $sigpipe() {
        return sigpipe;
      },
    },
    methods: {
      $regsig(name: string, options: TyMap<any> | TySigHandler, func?: TySigHandler): any {
        return sigpipe.register(this, name, options, func);
      },
    },
    destroyed() {
      sigpipe.clear(this);
    },
  });

  window.addEventListener("resize", () => {
    sigpipe.hideKeys();
  });

  sigpipe.use(document);
}

export default sigpipe;
