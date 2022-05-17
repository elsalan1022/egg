import { Egg, Field, NativeData, runtime, Slot, Unit } from "egg";
import { gclsids } from "../clsids";
import { ActionBase, DataBase, } from "../unit";
import { makeEvent, makeNamesSlotData, makeSlot } from "../utils";
import { DevRuntime, DevUnit } from "./base";

class Runtime extends DevRuntime {
  static type: DeviceType = 'timer';
  static clsname = 'timer';
  static clsid = gclsids.timer;
  enable = true;
  counter: Record<string, number> = {};
  constructor(uuid?: string, parent?: runtime.Unit) {
    super(uuid, parent);
  }
  async start(): Promise<void> {
    if (!this.parent) {
      throw new Error("No parent.");
    }
    const chick = this.parent as runtime.Chick;
    this.enable = true;
    const { change, } = this.events;
    const tickMs = change.filter(e => e.filter === 'millisecond');
    if (tickMs?.length) {
      const tick = async () => {
        if (!this.enable || !chick.isRunning()) {
          return;
        }
        await this.emit('change', { name: 'millisecond', now: Date.now() });
        setTimeout(tick, 1);
      };
      setTimeout(tick, 0);
    }
    const tickS = change.filter(e => e.filter !== 'millisecond');
    if (tickS?.length) {
      const tick = async () => {
        if (!this.enable || !chick.isRunning()) {
          return;
        }
        await this.emit('change', { name: 'second', now: Date.now() });
        setTimeout(tick, 1000);
      };
      setTimeout(tick, 0);
    }
  }
  async stop(): Promise<void> {
    this.enable = false;
  }
  async time(): Promise<number> {
    return Date.now();
  }
  async timeBegin({ name }: { name: string }) {
    this.counter[name] = Date.now();
  }
  async timeElapsed({ name }: { name: string }): Promise<string> {
    const begin = this.counter[name];
    if (!begin) {
      throw new Error("No begin.");
    }
    let diff = Date.now() - begin;
    diff = Math.floor(diff / 1000);
    const s = diff % 60; diff = Math.floor(diff / 60);
    const m = diff % 60; diff = Math.floor(diff / 60);
    const h = diff % 24; diff = Math.floor(diff / 24);
    const fixed = (n: number) => n < 10 ? `0${n}` : `${n}`;
    return `${fixed(h)}:${fixed(m)}:${fixed(s)}`;
  }
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
}

export class Timer extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    this.actions = {
      time: class extends DataBase {
        output: Record<string, Field> | NativeData = {
          type: 'number',
          name: '.',
          label: 'timestamp',
          description: 'timestamp-desc',
        };
        constructor(callee: Unit) {
          super(callee, 'time');
        }
      },
      timeBegin: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: {
              type: 'string',
            },
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'timeBegin');
        }
      },
      timeElapsed: class extends ActionBase {
        output: Record<string, Field> | NativeData = {
          type: 'string',
          name: '.',
          label: 'timeElapsed',
          description: 'timeElapsed-desc',
        };
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: {
              type: 'string',
            },
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'timeElapsed');
        }
      },
    };
    const events = {
      change: makeEvent({
        name: 'change',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: [{
              value: 'second',
              label: 'time.second'
            },
            {
              value: 'millisecond',
              label: 'time.millisecond'
            }],
          },
          now: {
            type: 'number',
            name: 'now',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}
