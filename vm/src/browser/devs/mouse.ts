import { Egg, runtime, } from "egg";
import { gclsids } from "../../clsids";
import { DevRuntime, DevUnit } from "../../devs/base";
import { makeEvent, } from "../../utils";

const names = ['left', 'middle', 'right'];

export class Runtime extends DevRuntime {
  static type: UnitType = 'mouse';
  static clsname: ClsName = 'mouse';
  static clsid = gclsids.mouse;

  constructor(uuid?: UUID, parent?: runtime.Unit) {
    super(uuid, parent);
    document.addEventListener('mousedown', (ev: MouseEvent) => {
      this.emit('mousedown', { name: names[ev.button] });
    });
    document.addEventListener('mouseup', (ev: MouseEvent) => {
      this.emit('mouseup', { name: names[ev.button] });
    });
  }

  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    // events
    const events = {
      mousedown: makeEvent({
        name: 'mousedown',
        params: {
          name: {
            name: 'name',
            type: 'string',
            values: names,
          },
        }
      }),
      mouseup: makeEvent({
        name: 'mouseup',
        params: {
          name: {
            name: 'name',
            type: 'string',
            values: names,
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}

