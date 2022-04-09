/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Property, runtime, Unit, } from 'egg';
import { gclsids } from '../../clsids';
import { makeProperty } from '../../utils';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'sphere';
  static clsid = gclsids.sphere;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const material = new THREE.MeshLambertMaterial({ color: 0x666666, emissive: 0xff0000 });
    const geometry = new THREE.SphereGeometry(1, 32, 16);
    const mesh = new THREE.Mesh(geometry, material);
    const physics = new CANNON.Body({
      mass: 1,
      material: new CANNON.Material(),
      shape: new CANNON.Sphere(1),
    });
    super(uuid, parent, { object: mesh, physics });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    const geo = (this.object as any).geometry as THREE.SphereGeometry;
    if (name === 'radius') {
      return geo.parameters.radius;
    }
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    const geo = (this.object as any).geometry as THREE.SphereGeometry;
    if (name === 'radius') {
      if (value === geo.parameters.radius) {
        return;
      }
      const mesh = this.object as THREE.Mesh;
      const geometry = new THREE.SphereGeometry(value || 1, geo.parameters.widthSegments, geo.parameters.heightSegments);
      mesh.geometry = geometry;
      mesh.matrixWorldNeedsUpdate = true;
      if (this.physics?.shapes[0]) {
        const shape = this.physics.shapes[0] as CANNON.Sphere;
        shape.radius = value;
      }
    }
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: any, instance: runtime.Unit, parent?: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      radius: makeProperty(instance, {
        name: 'radius',
        type: 'number',
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
