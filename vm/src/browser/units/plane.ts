/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { gclsids } from '../../clsids';
import { makeProperty } from '../../utils';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'plane';
  static clsid = gclsids.plane;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshPhongMaterial({ color: 0xfff, depthWrite: false }));
    super(uuid, parent, { object: plane });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      const mesh = this.object as THREE.Mesh;
      const geo = mesh.geometry as THREE.PlaneGeometry;
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
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneGeometry;
    if (name === 'width') {
      mesh.geometry = new THREE.PlaneGeometry(value, geo.parameters.height);
    } else if (name === 'height') {
      mesh.geometry = new THREE.PlaneGeometry(geo.parameters.width, value);
    }
    mesh.matrixWorldNeedsUpdate = true;
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
