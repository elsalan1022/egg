declare module 'egg/project' {
  import { config } from "egg";

  /**
   * @label EGG系统
   */
  interface Module extends Dispatchable {
    /** list */
    list(cxt: DispContext): RecSet<string>;
    /** create */
    create(cxt: DispContext, name: string): config.Project;
    /** load */
    load(cxt: DispContext, name: string): config.Project;
    /** save */
    save(cxt: DispContext, name: string, cfg: config.Project): void;
    /** remove */
    remove(cxt: DispContext, name: string): void;
  }
}
