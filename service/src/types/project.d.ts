declare module 'egg/project' {
  import { config } from "egg";

  interface Assets {
    models: Array<string>;
    sounds: Array<string>;
    textures: Array<string>;
  }

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
    /** assets */
    assets(cxt: DispContext, name: string): Assets;
    /** remove resource from assets, filename = '[models|sounds|textures]/name' */
    removeAsset(cxt: DispContext, name: string, filename: string): void;
  }
}
