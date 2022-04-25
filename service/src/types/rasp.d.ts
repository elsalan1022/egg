declare module 'egg/rasp' {
  /**
   * @label 树莓派系统
   */
  interface Module extends Dispatchable {
    /** load */
    cameraOpen(cxt: DispContext): Promise<string>;
  }
}
