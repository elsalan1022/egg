declare module 'egg' {
  /** Block type */
  type BlockType = 'logic' | 'action' | 'data';

  /** Block name */
  type BlockName = string;

  /** Slot data */
  type SlotData = Omit<Property, 'name' | 'label' | 'description'>;

  /** Slot */
  interface Slot extends Discriable {
    /** required */
    required?: boolean;
    /** block */
    block?: Block;
    /** data */
    data?: SlotData;
    /** Prefix label */
    prefix?: TextLocalized;
    /** Suffix label */
    suffix?: TextLocalized;
  }

  /** Block Constructor */
  interface BlockConstructor {
    new(callee: Unit): Block;
    /** Type */
    readonly type: BlockType;
  }

  /** Block Constructor */
  interface BlockRuntimeConstructor {
    new(callee: runtime.Unit): Block;
  }

  type ExecuteFunc = (values?: Record<string, runtime.Block>, event?: runtime.Event) => any;

  /** Block annotation */
  interface Block extends Discriable {
    /** id */
    readonly id: GUID;
    /** callee */
    readonly callee: Unit;
    /** slots */
    readonly slots: Record<string, Slot>;
    /** ending */
    readonly ending?: boolean;
    /** next */
    readonly next?: Block;
    /** chain of */
    chain?: BlockChain;
    /** Execute */
    readonly execute: ExecuteFunc;
    /** can bind */
    canBind?(slot: string, block: Block): boolean;
    /** bind */
    bind?(slot: string, block: Block): void;
    /** attach */
    attach(block: Block): void;
    /** dettach */
    dettach(): Block | undefined;
    /** born */
    born(): runtime.Block;
    /** update slots */
    updateSlots?(): boolean;
    /** load user data */
    loadUserData?(data: Record<string, any>): Promise<void>;
    /** pack user data */
    packUserData?(data?: Record<string, any>): Record<string, any>;
  }

  /** Block chain */
  interface BlockChain {
    /** id */
    id: GUID;
    /** unit */
    unit: Unit;
    /** blocks */
    head?: Block;
    /** bound */
    bound?: {
      /** event bound to */
      unit: Unit;
      /** event name */
      event: string;
      /** sub event name */
      filter?: string;
    };
  }

  /** Block action */
  interface BlockAction extends Block {
    /** output */
    readonly output?: Record<string, Field> | NativeData;
  }

  /** Block data */
  interface BlockData extends Block {
    /** output */
    readonly output: Record<string, Field> | NativeData;
  }

  namespace runtime {
    /** Block */
    interface Block {
      /** callee */
      readonly callee: runtime.Unit;
      /** next */
      readonly next: Block | undefined;
      /** slots */
      readonly slots: Record<string, runtime.Block>;
      /** Execute */
      execute(values?: Record<string, runtime.Block | any>, event?: runtime.Event): Promise<any> | any;
    }
  }
}
