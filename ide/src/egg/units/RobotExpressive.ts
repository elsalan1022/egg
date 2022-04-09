/* eslint-disable @typescript-eslint/no-unused-vars */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { runtime, } from 'egg';
import { AniRuntime, PhyUnit, Assets } from 'egg/src/browser/units/animal';

class Runtime extends AniRuntime {
  static type: UnitType = 'object';
  static clsname: ClsName = 'RobotExpressive';
  static clsid = '9e8f7f7f-f8f8-4f8f-8f8f-8f8f8f8f8f8f';
  static async create(uuid?: string, parent?: runtime.Unit, properties?: Record<string, any>): Promise<runtime.Unit> {
    const gltf = await new GLTFLoader().loadAsync('./assets/models/gltf/RobotExpressive/RobotExpressive.glb');
    const assets: Assets = {
      object: gltf.scene,
      clips: Object.fromEntries(gltf.animations.map(animation => [animation.name, animation])),
      sounds: {},
    };
    return super.create(uuid, parent, Object.assign({}, properties || {}, assets));
  }
}

export class Decoration extends PhyUnit<Runtime> {
  static runtime = Runtime;
  constructor(egg: any, instance: runtime.Unit, parent?: any) {
    super(egg, instance, parent);
    delete this.properties['material'];
  }
}
