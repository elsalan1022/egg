import { Block, runtime, Slot, Unit, ExecuteFunc } from "egg";
import { bornSlot, excuteBlocks, genUniqueId } from "./utils";

export class BlockBase implements Block {
  id: GUID = genUniqueId();
  slots: Record<string, Slot> = {};
  label?: string | undefined;
  description?: string | undefined;
  execute: ExecuteFunc;
  ending?: boolean | undefined;
  next?: Block | undefined;
  constructor(public callee: Unit, public name: string, execute?: ExecuteFunc, label?: string, description?: string) {
    this.label = label || name;
    this.description = description || `${this.label}-desc`;
    this.execute = execute || (callee.instance as any)[name];
    if (!this.execute) {
      throw new Error(`${this.name} is not found`);
    }
  }
  born(): runtime.Block {
    const slots = Object.fromEntries(Object.entries(this.slots).map(([key, value]) => [key, bornSlot(value)]));
    const preExes: any = {};
    const ents = Object.entries(this.slots);
    for (let i = 0; i < ents.length; i++) {
      const [key, value] = ents[i];
      if (value.data) {
        preExes[key] = true;
      } else {
        break;
      }
    }
    Object.fromEntries(Object.entries(this.slots).map(([key, value]) => [key, !!value.data]));
    const { execute } = this;
    return {
      callee: this.callee.instance,
      next: this.next?.born(),
      slots,
      execute: async function (args: any, event: any) {
        const values = Object.fromEntries(await Promise.all(Object.entries(this.slots).map(async ([key, value]) => [key, preExes[key] ? await excuteBlocks(value, args, event) : value])));
        return await execute.call(this.callee, values, event);
      },
    };
  }
  /** attach */
  attach(block: Block): void {
    if (this.next) {
      throw new Error(`${this.name} already has next block`);
    }
    this.next = block;
  }
  /** dettach */
  dettach(): Block | undefined {
    const next = this.next;
    this.next = undefined;
    return next;
  }
}
