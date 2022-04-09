import { runtime, Property, Unit, Event, Slot, SlotData, EventField } from 'egg';
import { ActionBase } from './unit';

export function genUniqueId(): GUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function makeEvent(args: Partial<Omit<Event, 'chains'>> & { name: string }): Event {
  return {
    params: {},
    chains: [],
    label: args.name,
    description: `${args.name}-desc`,
    ...args,
  };
}

export function makeProperty(instance: runtime.Unit, args: Partial<Omit<Property, 'default'>> & { name: string }, cb?: (name: string, value: any) => void): Property {
  return new Proxy({
    label: args.name,
    description: `${args.name}-desc`,
    type: 'string',
    ...args,
    default: instance.get({ name: args.name }),
  }, {
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === 'value') {
        return instance.get({ name: args.name });
      }
      return Reflect.get(target, p, receiver);
    },
    set(target: any, p: string | symbol, value: any, receiver: any): boolean {
      const rs = Reflect.set(target, p, value, receiver);
      if (rs && p === 'value') {
        instance.set({ name: args.name, value });
        if (cb) {
          cb(args.name, value);
        }
      }
      return rs;
    },
  });
}

export function makeNamesProperty(unit: Unit, args: Partial<Omit<Property, 'name' | 'default'>>, cb?: (name: string, value: any) => void): Property {
  const instance = unit.instance;
  return new Proxy({
    description: `${args.label}-desc`,
    ...args,
    label: 'name',
    type: 'string',
    default: instance.get({ name: 'name' }),
  }, {
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === 'value') {
        return instance.get({ name: 'name' });
      } else if (p === 'values') {
        return Object.keys(unit.properties);
      }
      return Reflect.get(target, p, receiver);
    },
    set(target: any, p: string | symbol, value: any, receiver: any): boolean {
      if (args.readonly) {
        throw new Error('readonly');
      }
      const rs = Reflect.set(target, p, value, receiver);
      if (rs && p === 'value') {
        instance.set({ name: 'name', value });
        if (cb) {
          cb('name', value);
        }
      }
      return rs;
    },
  });
}

export function makeSlotData(instance: runtime.Unit, args: Partial<Omit<SlotData, 'default'>>): SlotData {
  return {
    type: 'string',
    ...args,
  };
}

export function makeNamesSlotData(unit: Unit, args: Partial<Omit<SlotData, 'default'>>, vsf?: () => Array<string>): SlotData {
  return new Proxy({
    type: 'string',
    ...args,
  }, {
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === 'values') {
        return vsf ? vsf() : Object.keys(unit.properties);
      }
      return Reflect.get(target, p, receiver);
    },
  });
}

export function makeNames4Event(unit: Unit, args: Partial<Omit<EventField, 'default'>>, vsf?: () => Array<string>): EventField {
  return new Proxy({
    type: 'string',
    ...args,
  }, {
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === 'values') {
        return vsf ? vsf() : Object.keys(unit.properties);
      }
      return Reflect.get(target, p, receiver);
    },
  });
}

export function makeRelativeTypeSlotData(unit: Unit, action: ActionBase, args: Partial<Omit<SlotData, 'default'>>, name: string): SlotData {
  return new Proxy({
    ...args,
  }, {
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === 'type') {
        const slot = action.slots[name];
        if (!slot || slot.data?.type !== 'string') {
          return 'unknown';
        }
        const key = slot.data?.value;
        if (!key) {
          return 'unknown';
        }
        return unit.properties[key]?.type || 'unknown';
      }
      return Reflect.get(target, p, receiver);
    },
  });
}

export function buildUnit(unit: Unit, instance: runtime.Unit): runtime.Unit {
  for (const [key, event] of Object.entries(unit.events)) {
    instance.events[key] = event.chains.map(chain => {
      return {
        filter: chain.bound?.filter,
        blocks: chain.head?.born() as any as runtime.Block,
      };
    }).filter(e => e.blocks);
  }
  return instance;
}

export function makeSlot(args: string | Partial<Slot> & { name: string }): Slot {
  if (typeof args === 'string') {
    return {
      name: args,
      label: args,
      description: `${args}-desc`,
    };
  }
  return {
    label: args.name,
    description: `${args.name}-desc`,
    ...args,
  } as Slot;
}

export function isActionSlot(slot: Slot): boolean {
  return !slot.data;
}

export function bornSlot(slot: Slot): runtime.Block | any {
  if (slot.block) {
    return slot.block.born();
  }
  if (slot.data) {
    const value = slot.data.value ?? slot.data.default;
    if (slot.data.type === 'unit') {
      return value?.instance ?? undefined;
    }
    if (slot.required && value === undefined) {
      throw new Error(`${slot.name} is required`);
    }
    return value;
  }
  if (slot.required) {
    throw new Error(`${slot.name} is required`);
  }
  return undefined;
}

export async function excuteBlocks(block: runtime.Block | any, args: Record<string, any>, event?: runtime.Event): Promise<any> {
  let result: any = undefined;
  if (block?.execute) {
    let it: runtime.Block | undefined = block as runtime.Block;
    while (it) {
      result = await it.execute(args || {}, event);
      it = it.next;
    }
    return result;
  }
  return block;
}

export function cloneBlock(block: runtime.Block | any, from: runtime.Unit, to: runtime.Unit): runtime.Block {
  if (!block.execute) {
    return block;
  }
  return {
    callee: block.callee === from ? to : block.callee,
    slots: Object.fromEntries(Object.entries(block.slots).map(([k, s]) => [k, cloneBlock(s, from, to)])),
    next: block.next ? cloneBlock(block.next, from, to) : undefined,
    execute: block.execute,
  };
}
