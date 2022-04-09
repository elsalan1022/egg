/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit } from 'egg';
import { makeProperty } from '../../utils';
import { gclsids } from '../../clsids';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'bulb';
  static clsid = gclsids.bulb;
  material: THREE.MeshStandardMaterial;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
    const light = new THREE.PointLight(0xffee88, 1, 100, 2);
    const material = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000
    });
    light.add(new THREE.Mesh(bulbGeometry, material));
    light.position.set(0, 2, 0);
    light.castShadow = true;
    super(uuid, parent, { object: light });
    this.material = material;
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    const light = this.object as THREE.PointLight;
    if (name === 'distance') {
      return light.distance;
    } else if (name === 'color') {
      return `#${light.color.getHexString()}`;
    } else if (name === 'power') {
      return light.power;
    }
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    const light = this.object as THREE.PointLight;
    if (name === 'distance') {
      light.distance = value;
    } else if (name === 'color') {
      light.color.set(value);
    } else if (name === 'power') {
      light.power = value;
      this.material.emissiveIntensity = light.intensity / Math.pow(0.02, 2.0);
    }
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['light', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      power: makeProperty(instance, {
        name: 'power',
        type: 'number',
        values: [
          { value: 0, label: 'off' },
          { value: 20, label: '4W' },
          { value: 180, label: '25W' },
          { value: 400, label: '40W' },
          { value: 800, label: '60W' },
          { value: 1700, label: '100W' },
          { value: 3500, label: '300W' },
          { value: 110000, label: '1000W' },
        ]
      }),
      color: makeProperty(instance, {
        name: 'color',
        type: 'color'
      }),
      distance: makeProperty(instance, {
        name: 'distance',
        type: 'number'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
    delete this.properties.scale;
    delete this.properties.rotation;
    delete this.properties.material;
  }
}
