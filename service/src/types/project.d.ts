declare module 'egg/project' {
  import { config } from "egg";

  /**
   * @label EGG系统
   */
  interface Module extends Dispatchable {
    /** load */
    load(cxt: DispContext): Promise<config.Project>;
    /** save */
    save(cxt: DispContext, cfg: config.Project): Promise<void>;
  }
}
