import { Egg, Field, NativeData, runtime, Unit } from "egg";
import { gclsids } from "../clsids";
import { DataBase, } from "../unit";
import { makeEvent } from "../utils";
import { DevRuntime, DevUnit } from "./base";

class Runtime extends DevRuntime {
  static type: DeviceType = 'timer';
  static clsname = 'timer';
  static clsid = gclsids.timer;
  enable = true;
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
    };
    const events = {
      change: makeEvent({
        name: 'change',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: ['second', 'millisecond'],
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
