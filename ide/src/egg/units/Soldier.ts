/* eslint-disable @typescript-eslint/no-unused-vars */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { runtime, } from 'egg';
import { HumanRuntime, HumanUnit } from 'egg/src/browser/units/human';

class Runtime extends HumanRuntime {
  static type: UnitType = 'object';
  static clsname: ClsName = 'Soldier';
  static clsid = '9e8f7f7f-f8f8-4f8f-8f8f-8f8f8f8f8fa0';
  static async create(uuid?: string, parent?: runtime.Unit, properties?: Record<string, any>): Promise<runtime.Unit> {
    const gltf = await new GLTFLoader().loadAsync('./assets/models/gltf/Soldier.glb');
    const assets = {
      object: gltf.scene,
      clips: Object.fromEntries(gltf.animations.map(animation => [animation.name, animation])),
    };
    return super.create(uuid, parent, Object.assign({}, properties || {}, assets));
  }
}

export class Decoration extends HumanUnit<Runtime> {
  static runtime = Runtime;
  constructor(egg: any, instance: runtime.Unit, parent?: any) {
    super(egg, instance, parent);
    delete this.properties['material'];
  }
}
