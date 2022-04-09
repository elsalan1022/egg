import { Egg, Property, runtime, } from "egg";
import { gclsids } from "../clsids";
import { makeEvent, makeNames4Event, makeProperty, } from "../utils";
import { DevRuntime, DevUnit } from "./base";

class Runtime extends DevRuntime {
  static type: DeviceType = 'storage';
  static clsname = 'storage';
  static clsid = gclsids.storage;
  /** set value */
  set({ name, value }: { name: string, value: any }): void {
    if (this.properties[name] === value) {
      return;
    }
    super.set({ name, value });
    this.emit('change', { name, value });
  }
}

export class Storage extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // events
    const events = {
      change: makeEvent({
        name: 'change',
        params: {
          name: makeNames4Event(self, {
            type: 'string',
            name: 'name',
          }),
          value: {
            type: 'unknown',
            name: 'value',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
  addProperty(type: DataType, name: string, value: any): void {
    if (this.properties[name]) {
      throw new Error(`property ${name} already exists`);
    }
    this.properties[name] = makeProperty(this.instance, {
      type,
      name,
    });
    this.properties[name].value = value;
  }
  editProperty(name: string, detail: Partial<Property>): void {
    const property = this.properties[name] as any;
    if (!property) {
      throw new Error(`property ${name} does not exists`);
    }
    for (const [k, v] of Object.entries(detail)) {
      property[k] = v;
    }
  }
  removeProperty(name: string): void {
    if (!this.properties[name]) {
      throw new Error(`property ${name} does not exists`);
    }
    delete this.properties[name];
    delete this.instance.properties[name];
  }
}
