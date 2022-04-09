/** Data type */
declare type DataType = 'boolean' | 'number' | 'time' | 'string' | 'color' | 'vec2' | 'vec3' | 'json' | 'octets' | 'stream' | 'texture' | 'material' | 'unit' | 'unknown';

/** guid, Globally Unique Identifier, id like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx */
type GUID = string;
/** clsid */
type CLSID = GUID;
/** unique id */
type UUID = GUID;

/** Primitive types */
declare type Int = number;
declare type Float = number;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Varchar<T> = string;
declare type Label = Varchar<128>;
declare type HASH = Varchar<32>;
declare type Url = Varchar<4096>;
declare type Json = Record<string, any>;

/** Text ID for lang localized */
declare type TextLocalized = string;

/** Mime type */
declare type Mime = keyof Mimes;

/** Discriable */
declare interface Discriable {
  /** Name */
  name: string;
  /** Label */
  label?: TextLocalized;
  /** Description */
  description?: TextLocalized;
}

/** Device type */
declare type BuiltinDeviceType = 'screen' | 'storage' | 'mic' | 'speaker' | 'speech' | 'camera' | 'mouse' | 'gesture' | 'pose' | 'keyboard' | 'joystick' | 'timer';
declare type DeviceType = BuiltinDeviceType | 'virtual-device' | 'extend-device' | 'unknown-device';
/** Device */
declare interface Device {
  /** Device ID */
  readonly id: string;
  /** Device name */
  readonly name: string;
  /** Device type */
  readonly type: DeviceType;
}
/** Device list */
declare type DeviceList = Array<Device>;

/** Unit type */
declare type UnitType = DeviceType | 'object' | 'unknown';

/** Unit class name */
declare type ClsName = string;

