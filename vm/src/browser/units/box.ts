/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { makeProperty } from '../../utils';
import { gclsids } from '../../clsids';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'box';
  static clsid = gclsids.box;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0xfff, depthWrite: false }));
    const physics = new CANNON.Body({
      mass: 1,
      material: new CANNON.Material(),
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    });
    super(uuid, parent, { object: mesh, physics });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      const mesh = this.object as THREE.Mesh;
      const geo = mesh.geometry as THREE.BoxGeometry;
      switch (name) {
        case 'width':
          return geo.parameters.width;
        case 'height':
          return geo.parameters.height;
        case 'depth':
          return geo.parameters.depth;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (!['width', 'height', 'depth'].includes(name)) {
      return;
    }
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.BoxGeometry;
    const physics = this.physics as CANNON.Body;
    const shape = physics.shapes[0] as CANNON.Box;
    if (name === 'width') {
      mesh.geometry = new THREE.BoxGeometry(value, geo.parameters.height, geo.parameters.depth);
      shape.halfExtents.x = value / 2;
    } else if (name === 'height') {
      mesh.geometry = new THREE.BoxGeometry(geo.parameters.width, value, geo.parameters.depth);
      shape.halfExtents.y = value / 2;
    } else if (name === 'depth') {
      mesh.geometry = new THREE.BoxGeometry(geo.parameters.width, geo.parameters.height, value);
      shape.halfExtents.z = value / 2;
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
      depth: makeProperty(instance, {
        name: 'depth',
        type: 'number'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
