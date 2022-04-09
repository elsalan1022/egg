declare module 'egg/fs' {
  /**
   * @label 文件系统
   */
  interface Module extends Dispatchable {
    /** readFile */
    readFile(cxt: DispContext, filepath: string): Promise<Buffer>;
    /** writeFile */
    writeFile(cxt: DispContext, filepath: string, data: Buffer): Promise<void>;
  }
}
