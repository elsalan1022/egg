/** 错误码 */
declare type ErrCode = number;

/** 上下文，用于鉴权 */
declare interface DispContext {
  /** cookies */
  cookies?: Record<string, any>;
  /** 会话连接, rpc.MessageConnection */
  connection?: any;
}

/** 错误状态及说明 */
declare type TyError = {
  code: ErrCode;
  message?: string;
};

/** 含总数的列表 */
declare interface RecSet<T> {
  total: number;
  items: Array<T>;
}

/** 调度参数 */
type DispArgs = Record<string, any>;

/** 调度统一接口 */
declare interface Dispatchable {
  [key: string]: (cxt: DispContext, ...args: any[]) => Promise<any> | any;
}
