import { runtime, Egg, Slot, Unit, BlockType, ExecuteFunc, NativeData } from "egg";
import { BlockBase } from "../block";
import { gclsids } from "../clsids";
import { UnitImpl, UnitRuntime } from "../unit";
import { makeSlot } from "../utils";

export abstract class TestBase extends BlockBase {
  static type: BlockType = 'logic';
  constructor(callee: Unit, name: string, execute?: ExecuteFunc, label?: string) {
    super(callee, name, execute, label);
  }
}

class Runtime extends UnitRuntime {
  static type: UnitType = 'virtual-device';
  static clsname: ClsName = 'test';
  static clsid = gclsids.test;
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  async equal({ left, right }: { left: any, right: any }): Promise<any> {
    return left === right;
  }
}

export class Decoration extends UnitImpl {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance, egg);
    this.actions = {
      equal: class extends TestBase {
        slots: Record<string, Slot> = {
          left: makeSlot({
            name: 'left',
            data: {
              type: 'string',
            },
            required: true,
            suffix: 'se.and',
          }),
          right: makeSlot({
            name: 'right',
            data: {
              type: 'string',
            },
            suffix: 'se.same',
          }),
        };
        output: NativeData = {
          type: 'boolean',
          name: '.',
          label: 'result',
          description: 'result-desc',
        };
        constructor(callee: Unit) {
          super(callee, 'equal');
        }
      },
    };
  }
}
