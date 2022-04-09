declare module 'egg/speech' {
  type Model = {
    name: string;
    words: Array<string>;
    transfer?: {
      time: number;
      words: Array<string>;
    };
  }
  /**
   * @label 语音识别
   */
  interface Module extends Dispatchable {
    /** get models list */
    models(cxt: DispContext): Promise<Array<Model>>;
    /** save meta data  */
    saveTransferMeta(cxt: DispContext, name: string, data: any): Promise<void>;
  }
}
