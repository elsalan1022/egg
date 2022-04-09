import { Block, BlockChain, config, Egg, Field, NativeData, runtime, Slot, Unit, UnitConstructor } from "egg";
import { ActionBase, DataBase, UnitImpl, UnitRuntime } from "./unit";
import { version } from "./version";
import { excuteBlocks, makeEvent, makeNamesSlotData, makeSlot } from "./utils";
import { Storage } from './devs/storage';
import devices from './devs';
import builtins from "./builtins/index";
import { gclsids } from './clsids';

/** chick */
export class ChickRuntime extends UnitRuntime implements runtime.Chick {
  static readonly type = 'object';
  static readonly clsname = 'chick';
  static readonly clsid = gclsids.egg;
  protected running = false;
  readonly classes: Record<ClsName, runtime.UnitConstructor> = {};
  readonly devices: Record<string, runtime.Unit> = {};
  readonly builtins: Record<ClsName, runtime.Unit> = {};
  readonly allUnits: Record<UUID, runtime.Unit> = {};
  readonly message: string = '';
  readonly uuid = gclsids.egg;
  reset(): void {
    this.setMessage('system reset');
    this.stop();

    this.setMessage('clear all units');
    (this as any).allUnits = {};
    this.children = {};

    this.allUnits[this.uuid] = this;

    // now reappend devices and builtins to children, and reset their properties
    this.setMessage('reset devices and builtins');
    for (const iterator of Object.values(this.devices)) {
      this.appendChild(iterator);
      this.allUnits[iterator.uuid] = iterator;
      for (const [name, value] of Object.entries(iterator.properties)) {
        iterator.set({ name, value });
      }
    }
    for (const iterator of Object.values(this.builtins)) {
      this.appendChild(iterator);
      this.allUnits[iterator.uuid] = iterator;
      for (const [name, value] of Object.entries(iterator.properties)) {
        iterator.set({ name, value });
      }
    }
  }
  async init(classes: Array<runtime.UnitConstructor>, additionalDevices?: Array<runtime.UnitConstructor>, additionalBuiltins?: Array<runtime.UnitConstructor>): Promise<ChickRuntime> {
    this.setMessage('system init');

    this.allUnits[this.uuid] = this;

    for (const cls of devices.map(e => e.runtime).concat(additionalDevices as any || [])) {
      this.setMessage(`init device: ${cls.clsname}.`);
      const ins = await cls.create(cls.clsid);
      this.devices[cls.clsname as BuiltinDeviceType] = ins;
      this.allUnits[ins.uuid] = ins;
      this.appendChild(ins);
    }
    for (const cls of builtins.map(e => e.runtime).concat(additionalBuiltins as any || [])) {
      this.setMessage(`init builtin object: ${cls.clsname}.`);
      const ins = await cls.create(cls.clsid);
      this.builtins[cls.clsname] = ins;
      this.allUnits[ins.uuid] = ins;
      this.appendChild(ins);
    }
    for (const cls of classes) {
      if (this.classes[cls.clsname]) {
        throw 'duplicate class name';
      }
      this.classes[cls.clsname] = cls;
    }
    return this;
  }
  async run(params: Record<string, any>): Promise<void> {
    this.setMessage('system start to run');
    Object.assign(this.properties, params);
    this.running = true;
    const { timer } = this.devices;
    (timer as any).start();
    await this.emit('start', params);
  }
  stop(): void {
    this.setMessage('system going to stop');
    this.running = false;
    const { timer } = this.devices;
    (timer as any).stop();
    this.emit('stop', {});
  }
  isRunning(): boolean {
    return this.running;
  }
  findUnit({ uuid }: { uuid: UUID }): runtime.Unit | undefined {
    return this.allUnits[uuid];
  }
  valueFromEvent({ name }: { name: string }, event?: runtime.Event) {
    if (!event) {
      return undefined;
    }
    return event.params[name];
  }
  async delayExecute({ milliseconds, action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    setTimeout(() => {
      excuteBlocks(action, {}, event);
    }, milliseconds);
  }
  setMessage(message: string): void {
    (this as any).message = message;
  }
}

/** Project */
export class Project extends UnitImpl implements Egg {
  static runtime = ChickRuntime;
  classes: Record<string, UnitConstructor> = {};
  devices: Record<BuiltinDeviceType, Unit> = {} as any;
  builtins: Record<ClsName, Unit> = {};
  allUnits: Record<UUID, Unit> = {};
  chains: Record<GUID, BlockChain> = {};
  private storage: Storage = null as any;
  constructor(runtime: runtime.UnitConstructor = ChickRuntime) {
    super(null as any, new (runtime || ChickRuntime)(), null as any);

    this.allUnits[this.uuid] = this;

    const unit = this as any;

    this.actions = {
      findUnit: class extends DataBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}, () => {
              return Object.keys(unit.allUnits);
            }),
            required: true,
          }),
        };
        output: Record<string, Field> | NativeData = {
          type: 'unit',
          name: '.',
        };
        constructor(callee: Unit) {
          super(callee, 'findUnit');
        }
      },
      stop: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'stop');
        }
      },
      valueFromEvent: class extends DataBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: {
              type: 'string',
            },
            required: true,
          }),
        };
        output: Record<string, Field> | NativeData = {
          type: 'unknown',
          name: '.',
        };
        constructor(callee: Unit) {
          super(callee, 'valueFromEvent', undefined, 'valueFromEvent');
        }
      },
      delayExecute: class extends ActionBase {
        slots: Record<string, Slot> = {
          milliseconds: makeSlot({
            name: 'milliseconds',
            data: {
              type: 'number',
            },
            required: true,
            suffix: 'milliseconds',
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'delayExecute');
        }
      },
    };
    const events = {
      start: makeEvent({
        name: 'start',
      }),
      stop: makeEvent({
        name: 'stop',
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });

    delete this.actions['clone'];
    delete this.actions['die'];
    delete this.events['clone'];
  }
  run(params: Record<string, any>): Promise<void> {
    return (this.instance as ChickRuntime).run(params);
  }
  stop(): void {
    return (this.instance as ChickRuntime).stop();
  }
  isRunning(): boolean {
    return (this.instance as ChickRuntime).isRunning();
  }
  async createUnit(cls: string, parent: Unit, uuid?: string, properties?: Json): Promise<Unit> {
    if (this.builtins[cls]) {
      throw 'builtin unit';
    }
    const clsObj = this.classes[cls];
    if (!clsObj) {
      throw 'unknown class';
    }
    const instance = await clsObj.runtime.create(uuid, parent.instance, properties);
    if (this.allUnits[instance.uuid]) {
      throw 'duplicate unit';
    }
    const unit = new clsObj(this, instance, parent);
    parent.appendChild(unit);
    this.allUnits[instance.uuid] = unit;
    (this.instance as ChickRuntime).allUnits[instance.uuid] = unit.instance;
    return unit;
  }
  destroyUnit(unit: Unit): void {
    unit.clearChains();
    delete this.allUnits[unit.uuid];
    delete (this.instance as ChickRuntime).allUnits[unit.uuid];
    if (unit.parent) {
      unit.parent.removeChild(unit);
    }
  }
  async init(classes: Array<UnitConstructor>, additionalDevices?: Array<UnitConstructor>, additionalBuiltins?: Array<UnitConstructor>): Promise<Egg> {
    const args = [
      Object.values(classes).map(v => v.runtime),
      additionalDevices ? Object.values(additionalDevices).map(v => v.runtime) : undefined,
      additionalBuiltins ? Object.values(additionalBuiltins).map(v => v.runtime) : undefined,
    ];
    await (this.instance as any).init(...args);

    const chick = this.instance as ChickRuntime;

    for (const dec of devices.concat(additionalDevices as any || [])) {
      const cls = dec.runtime;
      const ins = chick.devices[cls.clsname];
      const unit = new dec(this, ins as any);
      this.devices[cls.clsname as BuiltinDeviceType] = unit;
      this.allUnits[unit.uuid] = unit;
      this.appendChild(unit);
    }

    for (const dec of builtins.concat(additionalBuiltins as any || [])) {
      const cls = dec.runtime;
      const ins = chick.builtins[cls.clsname];
      const unit = new dec(this, ins as any);
      this.builtins[cls.clsname] = unit;
      this.allUnits[unit.uuid] = unit;
      this.appendChild(unit);
    }

    this.storage = this.devices['storage'] as Storage;

    for (const cls of classes) {
      if (this.classes[cls.runtime.clsname]) {
        throw 'duplicate class name';
      }
      this.classes[cls.runtime.clsname] = cls;
    }

    return this;
  }
  serialize(): config.Project {
    /** traverse block */
    const traverseBlock = (block: Block): config.BlockData => {
      const slots: Record<string, Array<config.BlockData> | config.SlotData> = {};
      for (const [name, slot] of Object.entries(block.slots)) {
        if (slot.block) {
          const ls: Array<config.BlockData> = [];
          let b = slot.block;
          while (b) {
            ls.push(traverseBlock(b));
            b = b.next as any;
          }
          slots[name] = ls;
        } else {
          slots[name] = {
            type: 'data',
            value: slot.data?.value,
          };
        }
      }
      return {
        id: block.id,
        type: 'block',
        unit: block.callee.uuid,
        action: block.name,
        slots,
      };
    };
    /* pack chain */
    const packBlocks = (chain: BlockChain): Array<config.BlockData> => {
      const blocks: Array<config.BlockData> = [];
      let block = chain.head;
      while (block) {
        blocks.push(traverseBlock(block));
        block = block.next;
      }
      return blocks;
    };
    /** pack instance */
    const packInstance = (unit: Unit): config.Unit => {
      const ins = unit.instance as runtime.Unit;
      const con = ins.constructor as runtime.UnitConstructor;
      const userData = ins.packUserData ? ins.packUserData() : {};
      return {
        cls: con.clsname,
        clsid: con.clsid,
        properties: Object.fromEntries(Object.entries(unit.properties).map(([k, v]) => [k, v.value])),
        events: Object.fromEntries(Object.entries(unit.events).map(([k, v]) => [k, v.chains.map(e => ({ unit: e.unit.uuid, chain: e.id }))])),
        chains: Object.values(unit.chains).map(chain => ({
          id: chain.id,
          unit: chain.unit.uuid,
          blocks: packBlocks(chain),
          bound: chain.bound ? { unit: chain.bound.unit.uuid, event: chain.bound.event, filter: chain.bound.filter } : undefined,
        })),
        children: Object.keys(unit.children),
        userData,
      };
    };
    return {
      version,
      units: Object.fromEntries(Object.entries(this.allUnits).map(([k, v]) => [k, packInstance(v)])),
      variables: Object.fromEntries(Object.entries(this.storage.properties).map(([k, v]) => [k, v.type])),
    };
  }
  async unserialize(config: config.Project): Promise<void> {
    this.reset();

    /** traverse block */
    const traverseBlock = (cfg: config.BlockData): Block => {
      const callee = this.allUnits[cfg.unit];
      if (!callee) {
        throw 'unknown unit';
      }
      const action = callee.createAction(cfg.action);
      (action as any).id = cfg.id;
      for (const [name, slotCfg] of Object.entries(cfg.slots)) {
        const slot = action.slots[name];
        if (!slot) {
          throw 'unknown slot';
        }
        if (!Array.isArray(slotCfg)) {
          if (slotCfg.type === 'data') {
            if (slot.data) {
              slot.data.value = slotCfg.value;
            }
          } else if ((slotCfg as any).type === 'block') {
            // ver compitable
            slot.block = traverseBlock(slotCfg as any);
          }
        } else {
          const firstCfg = slotCfg[0];
          const calleeSlot = this.allUnits[firstCfg.unit];
          if (!calleeSlot) {
            throw 'unknown unit';
          }
          let tail = traverseBlock(firstCfg);
          slot.block = tail;
          const count = slotCfg.length;
          for (let i = 1; i < count; i++) {
            const cfg = slotCfg[i];
            const unit = this.allUnits[cfg.unit];
            if (!unit) {
              throw 'unknown unit';
            }
            (tail as any).next = traverseBlock(cfg);
            tail = tail.next as any;
          }
        }
      }
      return action as Block;
    };

    // unpack user properties for storage first
    for (const [k, v] of Object.entries(config.variables)) {
      this.storage.addProperty(v, k, undefined);
    }

    const sysUnits = Object.fromEntries(Object.entries({ chick: this as Unit })
      .concat(Object.entries(this.devices))
      .concat(Object.entries(this.builtins)));

    // unpack devices and builtins
    await Promise.all(Object.entries(config.units).map(async ([uuid, cfg]) => {
      const unit = sysUnits[cfg.cls];
      if (!unit) {
        return;
      }
      (unit.instance as any).uuid = uuid;
      // unpack user data
      if (unit.instance.loadUserData && cfg.userData) {
        await unit.instance.loadUserData(cfg.userData);
      }
    })).catch(e => {
      console.error(e);
    });

    // unpack user units
    await Promise.all(Object.entries(config.units).map(async ([uuid, cfg]) => {
      if (sysUnits[cfg.cls]) {
        return;
      }
      const unit = await this.createUnit(cfg.cls, this, uuid);
      // unpack user data
      if (unit.instance.loadUserData && cfg.userData) {
        await unit.instance.loadUserData(cfg.userData);
      }
    })).catch(e => {
      console.error(e);
    });

    /* unpack chain */
    const unpackChain = (unit: Unit, cfg: config.BlockChain): BlockChain => {
      let head: Block | undefined;
      let tail: Block | undefined;
      cfg.blocks.forEach(b => {
        const block = traverseBlock(b);
        if (!head) {
          head = block;
        }
        if (tail) {
          tail.attach(block);
        }
        tail = block;
      });
      return {
        id: cfg.id,
        unit,
        head,
        bound: cfg.bound ? { unit: this.allUnits[cfg.bound.unit], event: cfg.bound.event, filter: cfg.bound.filter } : undefined,
      };
    };

    // unpack properties and chains
    Object.entries(config.units).forEach(([k, cfg]) => {
      const unit = sysUnits[cfg.cls] || this.allUnits[k];
      if (!unit) {
        throw 'unknown unit';
      }

      if (unit !== this) {
        for (const child of cfg.children) {
          unit.appendChild(this.allUnits[child]);
        }
      }

      // unpack properties
      for (const [k, prop] of Object.entries(cfg.properties)) {
        if (!unit.properties[k]) {
          console.warn(`unknown property ${k}`);
          continue;
        }
        unit.properties[k].value = prop;
      }

      // unpack chains
      (unit as any).chains = Object.fromEntries(cfg.chains.map((chain) => ([chain.id, unpackChain(unit, chain)])));
    });

    // link event and chain
    Object.entries(config.units).forEach(([k, cfg]) => {
      const unit = sysUnits[cfg.cls] || this.allUnits[k];
      if (!unit) {
        throw 'unknown unit';
      }
      for (const [name, chainsCfg] of Object.entries(cfg.events)) {
        const event = unit.events[name];
        if (!event) {
          if (chainsCfg.length > 0) {
            throw 'unknown event';
          } else {
            console.warn(`unknown event ${name}`);
            continue;
          }
        }
        event.chains = chainsCfg.map(it => {
          const lintTo = this.allUnits[it.unit];
          if (!lintTo) {
            throw 'unknown unit';
          }
          return lintTo.chains[it.chain];
        });
      }
    });
  }
  findUnit(uuid: string): Unit | undefined {
    const u = this.allUnits[uuid];
    if (u) {
      return u;
    }
    if (this.uuid === uuid) {
      return this;
    }
    return Object.values(this.devices).find(e => e.uuid === uuid) || Object.values(this.builtins).find(e => e.uuid === uuid);
  }
  build(): ChickRuntime {
    return super.build() as ChickRuntime;
  }
  private reset(): void {
    this.allUnits = {};
    this.chains = {};
    this.children = {};

    this.storage.properties = {};
    (this.storage.instance as any).properties = {};

    (this.instance as runtime.Chick).reset();

    this.allUnits[this.uuid] = this;

    for (const prop of Object.values(this.properties)) {
      prop.value = prop.default;
    }

    // now reappend devices and builtins to children, and reset their properties
    for (const iterator of Object.values(this.devices)) {
      this.appendChild(iterator);
      this.allUnits[iterator.uuid] = iterator;
    }
    for (const iterator of Object.values(this.builtins)) {
      this.appendChild(iterator);
      this.allUnits[iterator.uuid] = iterator;
    }

    for (const event of Object.values(this.events)) {
      event.chains = [];
    }
  }
}
