import { runtime, Egg, Slot, NativeData } from "egg";
import { gclsids } from "../clsids";
import { ActionBase, UnitImpl, UnitRuntime } from "../unit";
import { makeSlot } from "../utils";

class MathActionWithNumber extends ActionBase {
  output: NativeData = {
    type: 'number',
    name: '.',
    label: 'result',
    description: 'result-desc',
  };
  constructor(name: string) {
    super(MathUnit, name, undefined, `math.${name}`);
    if (!this.execute) {
      throw `unknown math action: ${name}`;
    }
  }
}

class MathActionWithBool extends ActionBase {
  output: NativeData = {
    type: 'boolean',
    name: '.',
    label: 'result',
    description: 'result-desc',
  };
  constructor(name: string) {
    super(MathUnit, name, undefined, `math.${name}`);
    if (!this.execute) {
      throw `unknown math action: ${name}`;
    }
  }
}

export class MathAction1Operand extends MathActionWithNumber {
  slots: Record<string, Slot> = {
    a: makeSlot({
      name: 'a',
      label: 'math.operand.a',
      data: {
        type: 'number',
      },
      required: true,
    }),
  };
}

class MathAction2Operands extends MathActionWithNumber {
  slots: Record<string, Slot> = {
    a: makeSlot({
      name: 'a',
      label: 'math.operand.a',
      data: {
        type: 'number',
      },
      required: true,
    }),
    b: makeSlot({
      name: 'b',
      label: 'math.operand.b',
      data: {
        type: 'number',
      },
      required: true,
    }),
  };
}

class MathAction2OperandsWithBool extends MathActionWithBool {
  slots: Record<string, Slot> = {
    a: makeSlot({
      name: 'a',
      label: 'math.operand.a',
      data: {
        type: 'number',
      },
      required: true,
    }),
    b: makeSlot({
      name: 'b',
      label: 'math.operand.b',
      data: {
        type: 'number',
      },
      required: true,
    }),
  };
}


class Runtime extends UnitRuntime {
  static type: UnitType = 'virtual-device';
  static clsname: ClsName = 'math';
  static clsid = gclsids.math;
  readonly uuid = gclsids.math;
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  add({ a, b }: { a: number, b: number }): number {
    return a + b;
  }
  sub({ a, b }: { a: number, b: number }): number {
    return a - b;
  }
  mul({ a, b }: { a: number, b: number }): number {
    return a * b;
  }
  div({ a, b }: { a: number, b: number }): number {
    return a / b;
  }
  mod({ a, b }: { a: number, b: number }): number {
    return a % b;
  }
  random({ a, b }: { a: number, b: number }): number {
    return Math.floor(Math.random() * (b - a + 1) + a);
  }
  not({ a }: { a: boolean }): boolean {
    return !a;
  }
  equal({ a, b }: { a: number, b: number }): boolean {
    return a === b;
  }
  greaterThen({ a, b }: { a: number, b: number }): boolean {
    return a > b;
  }
  greaterThenOrEqual({ a, b }: { a: number, b: number }): boolean {
    return a >= b;
  }
  lessThen({ a, b }: { a: number, b: number }): boolean {
    return a > b;
  }
  lessThenOrEqual({ a, b }: { a: number, b: number }): boolean {
    return a <= b;
  }
}

export class Decoration extends UnitImpl {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance, egg);
    this.actions = {
      add: class extends MathAction2Operands {
        constructor() {
          super('add');
          this.slots.a.suffix = 'math.+';
        }
      },
      sub: class extends MathAction2Operands {
        constructor() {
          super('sub');
          this.slots.a.suffix = 'math.-';
        }
      },
      mul: class extends MathAction2Operands {
        constructor() {
          super('mul');
          this.slots.a.suffix = 'math.*';
        }
      },
      div: class extends MathAction2Operands {
        constructor() {
          super('div');
          this.slots.a.suffix = 'math./';
        }
      },
      mod: class extends MathAction2Operands {
        constructor() {
          super('mod');
          this.slots.a.suffix = 'math.%';
        }
      },
      random: class extends MathAction2Operands {
        constructor() {
          super('random');
          this.slots.a.prefix = 'from';
          this.slots.a.suffix = 'to';
        }
      },
      not: class extends MathActionWithBool {
        slots: Record<string, Slot> = {
          a: makeSlot({
            name: 'a',
            label: 'math.operand.a',
            data: {
              type: 'boolean',
            },
            required: true,
            prefix: 'math.!',
          }),
        };
        constructor() {
          super('not');
        }
      },
      equal: class extends MathAction2OperandsWithBool {
        constructor() {
          super('equal');
          this.slots.a.suffix = 'math.==';
        }
      },
      greaterThen: class extends MathAction2OperandsWithBool {
        constructor() {
          super('greaterThen');
          this.slots.a.suffix = 'math.>';
        }
      },
      greaterThenOrEqual: class extends MathAction2OperandsWithBool {
        constructor() {
          super('greaterThenOrEqual');
          this.slots.a.suffix = 'math.>=';
        }
      },
      lessThen: class extends MathAction2OperandsWithBool {
        constructor() {
          super('lessThen');
          this.slots.a.suffix = 'math.<';
        }
      },
      lessThenOrEqual: class extends MathAction2OperandsWithBool {
        constructor() {
          super('lessThenOrEqual');
          this.slots.a.suffix = 'math.<=';
        }
      },
    };
  }
}

export const MathUnit = new Decoration(null as any, new Runtime());
