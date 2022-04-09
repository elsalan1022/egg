
declare module 'egg' {
  /** egg */
  interface Egg extends Unit {
    /** Builtin devices */
    readonly devices: Record<BuiltinDeviceType, Unit>;
    /** Builtin units */
    readonly builtins: Record<ClsName, Unit>;
    /** Classes */
    readonly classes: Record<ClsName, UnitConstructor>;
    /** All units */
    readonly allUnits: Record<UUID, Unit>;
    /** initialize */
    init(classes: Array<UnitConstructor>): Promise<Egg>;
    /** searialize to json */
    serialize(): config.Project;
    /** load from json */
    unserialize(data: config.Project): Promise<void>;
    /** build */
    build(): runtime.Chick;
    /** create unit */
    createUnit(cls: ClsName, parent: Unit, uuid?: UUID, properties?: Json): Promise<Unit>;
    /** destroy unit */
    destroyUnit(unit: Unit): void;
    /** find unit */
    findUnit(uuid: UUID): Unit | undefined;
    /** run */
    run(params: Record<string, any>): Promise<void>;
    /** stop and clear running context */
    stop(): void;
    /** is running */
    isRunning(): boolean;
  }
  namespace runtime {
    /** chick */
    interface Chick extends runtime.Unit {
      /** reset */
      reset(): void;
      /** run */
      run(params: Record<string, any>): Promise<void>;
      /** stop and clear running context */
      stop(): void;
      /** is running */
      isRunning(): boolean;
      /** find unit */
      findUnit(args: { uuid: UUID }): runtime.Unit | undefined;
    }
  }
  namespace config {
    /** SlotData */
    interface SlotData {
      /** type */
      type: 'data';
      /** data */
      value: any;
    }
    /** Block Data */
    interface BlockData {
      /** id */
      id: GUID;
      /** type */
      type: 'block';
      /** Unit id */
      unit: string;
      /** action */
      action: string;
      /** slots */
      slots: Record<string, Array<BlockData> | SlotData>;
    }
    /** block chain */
    interface BlockChain {
      /** id */
      id: GUID;
      /** blocks */
      blocks: Array<BlockData>;
      /** bound */
      bound?: {
        /** event bound to */
        unit: UUID;
        /** event name */
        event: string;
        /** sub event name */
        filter?: string;
      };
    }

    /** Unit config */
    interface Unit {
      /** cls name */
      cls: ClsName;
      /** cls id */
      clsid: GUID;
      /** Properties */
      readonly properties: Record<string, any>;
      /** Events */
      readonly events: Record<string, Array<{ unit: UUID; chain: GUID }>>;
      /** Block chains */
      readonly chains: Array<BlockChain>;
      /** Children */
      readonly children: Array<UUID>;
      /** user data */
      readonly userData?: Record<string, any>;
    }

    /** config */
    interface Project {
      /** version */
      version: string;
      /** All units */
      readonly units: Record<UUID, Unit>;
      /** user variables in storage */
      readonly variables: Record<string, DataType>;
    }
  }
}
