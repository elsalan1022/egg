/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { gclsids } from '../../clsids';
import { makeProperty } from '../../utils';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'mirror';
  static clsid = gclsids.mirror;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mirror = new Reflector(geo, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0x889999
    });
    super(uuid, parent, { object: mirror });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      const mirror = this.object as Reflector;
      const geo = mirror.geometry as THREE.PlaneGeometry;
      switch (name) {
        case 'width':
          return geo.parameters.width;
        case 'height':
          return geo.parameters.height;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (!['width', 'height'].includes(name)) {
      return;
    }
    const mirror = this.object as Reflector;
    const geo = mirror.geometry as THREE.PlaneGeometry;
    if (name === 'width') {
      mirror.geometry = new THREE.PlaneGeometry(value, geo.parameters.height);
    } else if (name === 'height') {
      mirror.geometry = new THREE.PlaneGeometry(geo.parameters.width, value);
    }
    mirror.matrixWorldNeedsUpdate = true;
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      width: makeProperty(instance, {
        name: 'width',
        type: 'number'
      }),
      height: makeProperty(instance, {
        name: 'height',
        type: 'number'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
