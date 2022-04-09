import { runtime, Egg, Slot, Unit, ExecuteFunc, BlockType } from "egg";
import { BlockBase } from "../block";
import { gclsids } from "../clsids";
import { UnitImpl, UnitRuntime } from "../unit";
import { excuteBlocks, makeSlot } from "../utils";

class Runtime extends UnitRuntime {
  static type: UnitType = 'virtual-device';
  static clsname: ClsName = 'logic';
  static clsid = gclsids.logic;
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  async if({ condiction, action }: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> {
    const rs = condiction ? await excuteBlocks(condiction, {}, event) : false;
    if (rs && action) {
      await excuteBlocks(action, {}, event);
    }
  }
  async ifElse({ condiction, alternative, action }: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> {
    const rs = condiction ? await excuteBlocks(condiction, {}, event) : false;
    if (rs) {
      if (action) {
        await excuteBlocks(action, {}, event);
      }
    } else if (alternative) {
      await excuteBlocks(alternative, {}, event);
    }
  }
  async loop({ action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    const chick = this.parent as runtime.Chick;
    while ((chick as runtime.Chick).isRunning()) {
      await excuteBlocks(action, {}, event);
    }
  }
  async loopUntill({ condiction, action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    while (!await excuteBlocks(condiction, {}, event)) {
      await excuteBlocks(action, {}, event);
    }
  }
  async repeat({ times, action }: Record<string, runtime.Block | any>, event?: runtime.Event) {
    const count = await excuteBlocks(times, {}, event);
    for (let i = 0; i < count; i++) {
      await excuteBlocks(action, {}, event);
    }
  }
}

export abstract class LogicBase extends BlockBase {
  static type: BlockType = 'logic';
  constructor(callee: Unit, name: string, execute?: ExecuteFunc, label?: string) {
    super(callee, name, execute, label);
  }
}

export class Decoration extends UnitImpl {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance, egg);
    this.actions = {
      if: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            required: true,
            suffix: 'logic.then',
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'if');
        }
      },
      ifElse: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            suffix: 'logic.then',
            required: true,
          }),
          action: makeSlot({
            name: 'action'
          }),
          alternative: makeSlot({
            name: 'alternative',
            prefix: 'logic.else',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'ifElse');
        }
      },
      loop: class extends LogicBase {
        ending = true;
        slots: Record<string, Slot> = {
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'loop');
        }
      },
      loopUntill: class extends LogicBase {
        slots: Record<string, Slot> = {
          condiction: makeSlot({
            name: 'condiction',
            data: {
              type: 'boolean',
            },
            required: true,
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'loopUntill');
        }
      },
      repeat: class extends LogicBase {
        slots: Record<string, Slot> = {
          times: makeSlot({
            name: 'times',
            data: {
              type: 'number',
            },
            required: true,
            suffix: 'logic.times',
          }),
          action: makeSlot({
            name: 'action',
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'repeat');
        }
      },
    };
  }
}
