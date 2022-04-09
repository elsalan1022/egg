/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { runtime, } from 'egg';
import { gclsids } from '../../clsids';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'plane';
  static clsid = gclsids.plane;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshPhongMaterial({ color: 0xfff, depthWrite: false }));
    super(uuid, parent, { object: plane });
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
}
