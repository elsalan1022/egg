import { Unit, runtime, Event, Property, BlockConstructor, Field, NativeData, BlockChain, Slot, BlockAction, Block, Egg, ExecuteFunc, BlockType, BlockData, } from "egg";
import { BlockBase, } from "./block";
import { makeSlot, makeEvent, buildUnit, genUniqueId, excuteBlocks, makeNamesSlotData, cloneBlock, makeRelativeTypeSlotData, makeProperty } from "./utils";

export abstract class ActionBase extends BlockBase implements BlockAction {
  static type: BlockType = 'action';
  output?: Record<string, Field> | NativeData | undefined;
  constructor(callee: Unit, name: string, execute?: ExecuteFunc, label?: string) {
    super(callee, name, execute, label);
  }
}

export abstract class DataBase extends BlockBase implements BlockData {
  static type: BlockType = 'data';
  abstract output: Record<string, Field> | NativeData;
  constructor(callee: Unit, name: string, execute?: ExecuteFunc, label?: string) {
    super(callee, name, execute, label);
  }
}

export abstract class UnitRuntime implements runtime.Unit {
  uuid: string;
  properties: Record<string, any> = {};
  events: Record<string, Array<{ filter?: string; blocks: runtime.Block }>> = {};
  children: Record<string, runtime.Unit> = {};
  protected clonedCount = 0;
  constructor(uuid?: string, public parent?: runtime.Unit) {
    this.uuid = uuid || genUniqueId();
  }
  get({ name }: { name: string; }) {
    return this.properties[name];
  }
  set({ name, value }: { name: string; value: any; }): void {
    this.properties[name] = value;
  }
  appendChild(unit: runtime.Unit): void {
    if (this.children[unit.uuid]) {
      throw new Error(`unit ${unit.uuid} already exists`);
    }
    (unit as any).parent = this;
    this.children[unit.uuid] = unit;
  }
  removeChild(unit: runtime.Unit): void {
    delete this.children[unit.uuid];
  }
  async clone(): Promise<runtime.Unit> {
    if (!this.parent) {
      throw new Error('cannot clone root unit');
    }

    this.clonedCount++;

    // /** Constructor */
    // new(uuid?: string, parent?: runtime.Unit, prosthesis?: runtime.Unit): runtime.Unit;
    const n = new (this as any).__proto__.constructor(undefined, this.parent, this);

    n.cloned = true;

    /** copy properties */
    Object.assign(n.properties, this.properties);

    /** copy events */
    const set = this.events['clone'] as Array<{ filter?: string; blocks: runtime.Block }>;
    if (set.length) {
      n.events['clone'] = set.map(it => ({ filter: it.filter, blocks: cloneBlock(it.blocks, this, n) }));
    }

    this.parent.appendChild(n);

    n.emit('clone', {});

    return n as runtime.Unit;
  }
  async die(): Promise<void> {
    if (!this.parent) {
      // aready dead
      return;
    }
    this.parent.removeChild(this);
    console.log(`${this.uuid} died`);
  }
  async emit(event: string, args: Record<string, any>): Promise<void> {
    const actions = this.events[event];
    if (actions?.length) {
      await Promise.all(actions.map(async action => {
        if (action.filter && args.name !== action.filter) {
          return;
        }
        return await excuteBlocks(action.blocks, {}, {
          from: this,
          name: event,
          params: args,
        });
      })).catch(e => {
        console.error(e);
      });
    }
  }
  static async create(uuid?: string, parent?: runtime.Unit, properties?: Record<string, any>): Promise<runtime.Unit> {
    return new (this as any as runtime.UnitConstructor)(uuid, parent, properties as any);
  }
}

export class UnitImpl implements Unit {
  properties: Record<string, Property> = {};
  actions: Record<string, BlockConstructor> = {};
  events: Record<string, Event> = {};
  chains: Record<string, BlockChain> = {};
  children: Record<string, Unit> = {};
  constructor(protected egg: Egg, public instance: runtime.Unit, public parent?: Unit) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const unit = this;
    this.properties = {
      name: makeProperty(instance, {
        name: 'name',
        type: 'string',
      }),
    };
    this.actions = {
      clone: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'clone');
        }
      },
      die: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'die');
        }
      },
      get: class extends DataBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}),
            required: true,
            suffix: 'valueof',
          }),
        };
        get output(): NativeData {
          const name = this.slots.name.data?.value;
          if (typeof name === 'object') {
            return name;
          }
          const pr = unit.properties[name];
          return pr as any || {
            type: 'unknown',
            name: '.',
            label: 'value',
            description: 'value-desc',
          };
        }
        constructor(callee: Unit) {
          super(callee, 'get');
        }
      },
      set: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}),
            required: true,
            suffix: 'valueof',
          }),
          value: makeSlot({
            name: 'value',
            data: makeRelativeTypeSlotData(unit, this, {}, 'name'),
            required: true,
            prefix: 'tois',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'set');
        }
      },
    };
    this.events = {
      clone: makeEvent({ name: 'clone' }),
    };
  }
  get uuid() {
    return this.instance.uuid;
  }
  get name() {
    return (this.instance.constructor as runtime.UnitConstructor).clsname;
  }
  appendChild(unit: Unit): void {
    if (this.children[unit.instance.uuid]) {
      throw new Error(`unit ${unit.instance.uuid} already exists`);
    }
    if ((unit as any).parent) {
      (unit as any).parent.removeChild(unit);
    }
    (unit as any).parent = this;
    this.children[unit.instance.uuid] = unit;
    this.instance.appendChild(unit.instance);
  }
  removeChild(unit: Unit): void {
    delete this.children[unit.instance.uuid];
    this.instance.removeChild(unit.instance);
  }
  createChain(block?: Block): BlockChain {
    const chain: BlockChain = {
      id: genUniqueId(),
      unit: this,
      head: block,
    };
    if (this.chains[chain.id]) {
      throw 'duplicate chain';
    }
    if (block) {
      block.chain = chain;
    }
    this.chains[chain.id] = chain;
    return chain;
  }
  removeChain(chain: BlockChain): void {
    if (chain.bound) {
      chain.bound.unit.unbindEvent(chain.bound.event, chain);
    }
    delete this.chains[chain.id];
  }
  bindEvent(name: string, chain: BlockChain, filter?: string): void {
    const event = this.events[name];
    if (!event) {
      throw new Error(`event ${name} not found`);
    }
    if (chain.bound) {
      chain.bound.unit.unbindEvent(chain.bound.event, chain);
    }
    event.chains.push(chain);
    chain.bound = {
      unit: this,
      event: name,
      filter,
    };
  }
  unbindEvent(name: string, chain: BlockChain): void {
    const event = this.events[name];
    if (!event) {
      throw new Error(`event ${name} not found`);
    }
    const index = event.chains.indexOf(chain);
    if (index !== -1) {
      event.chains.splice(index, 1);
      chain.bound = undefined;
    }
  }
  appendBlock(chain: BlockChain, block: Block): void {
    block.chain = chain;
    if (!chain.head) {
      chain.head = block;
    } else {
      let tail = chain.head;
      while (tail.next) {
        tail = tail.next;
      }
      (tail as any).next = block;
    }
  }
  removeBlock(chain: BlockChain, block: Block): void {
    if (chain.head === block) {
      chain.head = block.next;
    } else if (chain.head) {
      let prev: any = chain.head;
      while (prev.next !== block) {
        prev = prev.next;
      }
      if (!prev) {
        throw new Error('block not found');
      }
      prev.next = block.next;
    }
    block.chain = undefined;
    (block as any).next = undefined;
  }
  findBlock(chain: BlockChain, id: GUID): Block | undefined {
    let block = chain.head;
    while (block) {
      if (block.id === id) {
        return block;
      }
      block = block.next;
    }
  }
  clearChains(): void {
    Object.values(this.chains).forEach(chain => {
      this.removeChain(chain);
    });
  }
  clearEvents(): void {
    Object.values(this.events).forEach(event => {
      event.chains.length = 0;
    });
  }
  build(): runtime.Unit {
    buildUnit(this, this.instance);
    for (const child of Object.values(this.children)) {
      child.build();
    }
    return this.instance;
  }
  /** Create action */
  createAction(name: string): BlockAction {
    return new this.actions[name](this) as BlockAction;
  }
}
