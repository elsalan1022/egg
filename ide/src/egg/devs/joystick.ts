import { BlockConstructor, Egg, Property, runtime, Unit, } from "egg";
import { gclsids } from "egg/src/clsids";
import { DevRuntime, DevUnit } from "egg/src/devs/base";
import { ActionBase } from "egg/src/unit";
import { makeEvent, makeProperty, } from "egg/src/utils";
import { rpc } from '../../rpc';

export class Runtime extends DevRuntime {
  static type: UnitType = 'joystick';
  static clsname: ClsName = 'joystick';
  static clsid = gclsids.joystick;
  async open(): Promise<void> {
    rpc.describe('joystick', (args) => {
      console.log(args);
    }, this);
  }
  async close(): Promise<void> {
    rpc.undescribe(this);
  }
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    // actions
    const actions: Record<string, BlockConstructor> = {
      open: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'open');
        }
      },
      close: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'close');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }

    delete this.actions.get;
    delete this.actions.set;

    // events
    const events = {
      down: makeEvent({
        name: 'down',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: ['a', 'b', 'x', 'y', 'lb', 'rb', 'select', 'start', 'mode', 'lx', 'ly', 'lb', 'rx', 'ry', 'rb', 'lb_x', 'lb_y'],
          },
          value: {
            type: 'number',
            name: 'value',
          },
        }
      }),
      up: makeEvent({
        name: 'up',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: ['a', 'b', 'x', 'y', 'lb', 'rb', 'select', 'start', 'mode', 'lx', 'ly', 'lb', 'rx', 'ry', 'rb', 'lb_x', 'lb_y'],
          },
          value: {
            type: 'number',
            name: 'value',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}

