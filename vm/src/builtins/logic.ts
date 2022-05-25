/* eslint-disable @typescript-eslint/ban-ts-comment */
import { runtime, Egg, Slot, Unit, ExecuteFunc, BlockType } from "egg";
import { BlockBase } from "../block";
import { gclsids } from "../clsids";
import { UnitImpl, UnitRuntime } from "../unit";
import { excuteBlocks, makeSlot } from "../utils";

class Runtime extends UnitRuntime {
  static type: UnitType = 'virtual-device';
  static clsname: ClsName = 'logic';
  static clsid = gclsids.logic;
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  async if({ condiction, action }: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> {
    const rs = condiction ? await excuteBlocks(condiction, {}, event) : false;
    if (rs && action) {
      await excuteBlocks(action, {}, event);
    }
  }
  async ifElse({ condiction, alternative, action }: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> {
    const rs = condiction ? await excuteBlocks(condiction, {}, event) : false;
    if (rs) {
      if (action) {
        await excuteBlocks(action, {}, event);
      }
    } else if (alternative) {
      await excuteBlocks(alternative, {}, event);
    }
  }
  async switch(blocks: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> {
    const { target, star } = blocks;
    const rs = target ? await excuteBlocks(target, {}, event) : false;
    const ca = blocks[rs];
    if (ca) {
      await excuteBlocks(ca, {}, event);
    }
    if (star) {
      await excuteBlocks(star, {}, event);
    }
  }
  async loop({ action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    const chick = this.parent as runtime.Chick;
    while ((chick as runtime.Chick).isRunning()) {
      await excuteBlocks(action, {}, event);
    }
  }
  async loopUntill({ condiction, action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    while (!await excuteBlocks(condiction, {}, event)) {
      await excuteBlocks(action, {}, event);
    }
  }
  async repeat({ times, action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    const count = await excuteBlocks(times, {}, event);
    for (let i = 0; i < count; i++) {
      await excuteBlocks(action, {}, event);
    }
  }
}

export abstract class LogicBase extends BlockBase {
  static type: BlockType = 'logic';
  constructor(callee: Unit, name: string, execute?: ExecuteFunc, label?: string) {
    super(callee, name, execute, label);
  }
}

export class Switch extends LogicBase {
  slots: Record<string, Slot> = {};
  cases: Record<string, Slot> = {};
  constructor(callee: Unit) {
    super(callee, 'switch');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.slots = {
      target: new Proxy({
        name: 'target',
        data: {
          type: 'unknown',
        },
        required: true,
      }, {
        set(target: any, p: string | symbol, value: any, receiver: any): boolean {
          const rs = Reflect.set(target, p, value, receiver);
          if (rs && p === 'block' && typeof value === 'object') {
            self.updateSlots();
          }
          return rs;
        },
      }),
      star: makeSlot({
        name: 'star',
      }),
    };
  }
  updateSlots(): boolean {
    const { block } = this.slots.target as any;
    if (!block) {
      return false;
    }
    const { output } = block;
    let { values } = output || {} as any;
    if (!values) {
      return false;
    }
    const keys = values.map((e: any) => typeof e === 'string' ? e : e.value || e.value);
    if (keys.includes('star') || keys.includes('target')) {
      throw new Error('Invalid value.');
    }
    const labels: any = {};
    values.forEach((e: any) => {
      if (e.label) {
        labels[e.value] = e.label;
      }
    });
    const oldKeys = Object.keys(this.slots).filter(k => k !== 'star' && k !== 'target');
    let changed = false;
    for (const key of oldKeys) {
      if (!keys.includes(key)) {
        changed = true;
        delete this.slots[key];
      }
    }
    for (const key of keys) {
      if (oldKeys.includes(key)) {
        continue;
      }
      const label = labels[key] || key;
      changed = true;
      let slot = this.cases[key];
      if (slot) {
        this.slots[key] = slot;
        if (!slot.prefix) {
          slot.prefix = `vs.${label}`;
        }
      } else {
        slot = makeSlot({
          name: key,
          prefix: `vs.${label}`,
        });
        this.slots[key] = slot;
        this.cases[key] = slot;
      }
    }
    return changed;
  }
  /** load user data */
  async loadUserData(data: Record<string, any>): Promise<void> {
    for (const [key, it] of Object.entries(this.slots)) {
      if (it.prefix) {
        continue;
      }
      const prefix = data[key];
      if (prefix) {
        it.prefix = prefix;
      }
    }
  }
  /** pack user data */
  packUserData(data?: Record<string, any>): Record<string, any> {
    const names = data || {};
    for (const [key, it] of Object.entries(this.slots)) {
      if (!it.prefix) {
        continue;
      }
      names[key] = it.prefix;
    }
    return names;
  }
}

export class Decoration extends UnitImpl {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance, egg);
    this.actions = {
      if: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            required: true,
            suffix: 'se.logic.then',
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'if');
        }
      },
      ifElse: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            suffix: 'se.logic.then',
            required: true,
          }),
          action: makeSlot({
            name: 'action'
          }),
          alternative: makeSlot({
            name: 'alternative',
            prefix: 'se.logic.else',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'ifElse');
        }
      },
      switch: Switch,
      loop: class extends LogicBase {
        ending = true;
        slots: Record<string, Slot> = {
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'loop');
        }
      },
      loopUntill: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            required: true,
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'loopUntill');
        }
      },
      repeat: class extends LogicBase {
        slots: Record<string, Slot> = {
          times: makeSlot({
            name: 'times',
            data: {
              type: 'number',
            },
            required: true,
            suffix: 'se.logic.times',
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'repeat');
        }
      },
    };
  }
}
