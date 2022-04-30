import { BlockConstructor, Egg, Property, runtime, Unit, } from "egg";
import { gclsids } from "egg/src/clsids";
import { DevRuntime, DevUnit } from "egg/src/devs/base";
import { ActionBase } from "egg/src/unit";
import { makeEvent, makeProperty, } from "egg/src/utils";
import { rpc } from '../../rpc';

const btnsNames = {
  'a': 'A',
  'b': 'B',
  'x': 'X',
  'y': 'Y',
  'back': 'back',
  'forward': 'forward',
  'back-2': 'back-2',
  'forward-2': 'forward-2',
  'select': 'select',
  'start': 'start',
  'mode': 'mode',
};

const axisNames = {
  'joy-x': 'joy-x',
  'joy-y': 'joy-y',
  'back-2': 'back-2',
  'joy-x-2': 'joy-x-2',
  'joy-y-2': 'joy-y-2',
  'forward-2': 'forward-2',
  'axis-x': 'axis-x',
  'axis-y': 'axis-y',
  // axis-x|y
  'up': 'up',
  'down': 'down',
  'left': 'left',
  'right': 'right',
  // joy-x|y
  'joy-up': 'joy-up',
  'joy-down': 'joy-down',
  'joy-left': 'joy-left',
  'joy-right': 'joy-right',
};

export class Runtime extends DevRuntime {
  static type: UnitType = 'joystick';
  static clsname: ClsName = 'joystick';
  static clsid = gclsids.joystick;
  async open(): Promise<void> {
    rpc.describe('joystick', ({ type, name, value }) => {
      if (type === 'button') {
        this.emit(value ? 'down' : 'up', { name, value });
      } else if (type === 'axis') {
        this.emit('axis', { name, value });
        if (Math.abs(value) == 32767) {
          if (name === 'axis-x') {
            this.emit('axis', { name: value > 0 ? 'right' : 'left', value });
          } else if (name === 'axis-y') {
            this.emit('axis', { name: value < 0 ? 'up' : 'down', value });
          } else if (name === 'joy-x') {
            this.emit('axis', { name: value > 0 ? 'joy-right' : 'joy-left', value });
          } else if (name === 'joy-y') {
            this.emit('axis', { name: value < 0 ? 'joy-up' : 'joy-down', value });
          } else if (name === 'back-2' || name === 'forward-2') {
            this.emit(value === 32767 ? 'down' : 'up', { name, value });
          }
        }
      }
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
            values: Object.keys(btnsNames),
          },
        }
      }),
      up: makeEvent({
        name: 'up',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: Object.keys(btnsNames),
          },
        }
      }),
      axis: makeEvent({
        name: 'axis',
        params: {
          name: {
            type: 'string',
            name: 'name',
            values: Object.keys(axisNames),
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

