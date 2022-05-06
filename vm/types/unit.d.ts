
declare module 'egg' {
  /** Field */
  interface Field extends Discriable {
    /** Property type */
    type: DataType;
    /** Mime type */
    mime?: Mime;
  }

  /** Property */
  interface Property<T = any> extends Field {
    /** Value */
    value?: T;
    /** readonly */
    readonly?: boolean;
    /** Default value */
    default?: T;
    /** Max value */
    max?: number;
    /** Min value */
    min?: number;
    /** step */
    step?: number;
    /** Optional value set */
    values?: Array<boolean | number | string | {
      /** value */
      value: boolean | number | string;
      /** label */
      label?: TextLocalized;
      /** Property description */
      description?: TextLocalized;
    }>;
    /** group */
    group?: string;
  }

  /** properties */
  type Properties = Record<string, Property>;

  /** Field with values */
  interface FieldWithValues extends Field {
    /** value list */
    values?: Array<boolean | number | string | {
      /** value */
      value: boolean | number | string;
      /** label */
      label?: TextLocalized;
      /** Property description */
      description?: TextLocalized;
    }>;
  }

  /** Native data */
  interface NativeData extends FieldWithValues {
    name: '.';
  }

  /** Event field */
  type EventField = FieldWithValues;

  /** Event */
  interface Event extends Discriable {
    /** params */
    params: Record<string, EventField>;
    /** blocks */
    chains: Array<BlockChain>;
  }

  /** Unit Constructor */
  interface UnitConstructor {
    /** Devices depended */
    readonly deps?: Array<DeviceType>;
    /** tags */
    readonly tags?: Array<string>;
    /** Icon */
    readonly icon?: Url;
    /** label */
    readonly label?: TextLocalized;
    /** description */
    readonly description?: string;
    /** cls for runtime */
    readonly runtime: runtime.UnitConstructor;
    /** Constructor */
    new(egg: Egg, instance: runtime.Unit, parent?: Unit): Unit;
  }

  /** Unit Annotation */
  interface Unit {
    /** uuid */
    readonly uuid: UUID;
    /** name */
    readonly name: string;
    /** Properties */
    readonly properties: Properties;
    /** Actions */
    readonly actions: Record<string, BlockConstructor>;
    /** Events */
    readonly events: Record<string, Event>;
    /** Block chains */
    readonly chains: Record<UUID, BlockChain>;
    /** Parent */
    readonly parent?: Unit;
    /** Children */
    readonly children: Record<UUID, Unit>;
    /** Runtime instance */
    readonly instance: runtime.Unit;
    /** build */
    build(): runtime.Unit;
    /** append unit */
    appendChild(unit: Unit): void;
    /** remove unit */
    removeChild(unit: Unit): void;
    /** Create action */
    createAction(name: string): BlockAction;
    /** create block chain */
    createChain(block?: Block): BlockChain;
    /** append block to chain */
    appendBlock(chain: BlockChain, block: Block): void;
    /** remove block from chain */
    removeBlock(chain: BlockChain, block: Block): void;
    /** find block from id */
    findBlock(chain: BlockChain, id: GUID): Block | undefined;
    /** remove block chain */
    removeChain(chain: BlockChain): void;
    /** clear chains */
    clearChains(): void;
    /** bind chain to unit */
    bindEvent(event: string, chain: BlockChain, filter?: string): void;
    /** unbind event */
    unbindEvent(event: string, chain: BlockChain): void;
    /** reset event  */
    clearEvents(): void;
  }

  namespace runtime {
    /** event */
    interface Event {
      /** from unit */
      from: runtime.Unit;
      /** event name */
      name: string;
      /** params */
      params: Record<string, any>;
    }

    /** properties */
    type Properties = Record<string, any>;

    /** Runtime Unit Constructor */
    interface UnitConstructor {
      /** Type */
      readonly type: UnitType;
      /** clsid */
      readonly clsname: ClsName;
      /** clsid */
      readonly clsid: CLSID;
      /** Constructor */
      new(uuid?: string, parent?: runtime.Unit, prosthesis?: runtime.Unit): runtime.Unit;
      /** create instance from json */
      create(uuid?: string, parent?: runtime.Unit, properties?: Json): Promise<runtime.Unit>;
    }

    /** Unit  */
    interface Unit {
      /** ID */
      readonly uuid: UUID;
      /** Properties */
      readonly properties: Properties;
      /** Events */
      readonly events: Record<string, Array<{ filter?: string; blocks: runtime.Block }>>;
      /** Parent */
      readonly parent?: runtime.Unit;
      /** Children */
      readonly children: Record<UUID, runtime.Unit>;
      /** Is cloned */
      readonly cloned?: boolean;
      /** get property */
      get({ name }: { name: string }): any;
      /** set property */
      set({ name, value }: { name: string, value: any }): void;
      /** Clone */
      clone(): Promise<runtime.Unit>;
      /** Die */
      die(): Promise<void>;
      /** emit */
      emit(event: string, args: Record<string, any>): Promise<void>;
      /** append unit */
      appendChild(unit: runtime.Unit): void;
      /** remove unit */
      removeChild(unit: runtime.Unit): void;
      /** load user data */
      loadUserData?(data: Record<string, any>): Promise<void>;
      /** pack user data */
      packUserData?(): Record<string, any>;
    }
  }
}
