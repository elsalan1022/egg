/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { makeProperty } from '../../utils';
import { gclsids } from '../../clsids';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'axis';
  static clsid = gclsids.axis;
  lineMaterial: THREE.Material;
  arrowMaterial: THREE.Material;
  lineGeometry: THREE.CylinderGeometry;
  axisX: THREE.Object3D;
  axisY: THREE.Object3D;
  axisZ: THREE.Object3D;
  constructor(uuid?: string, parent?: runtime.Unit) {
    // const gizmo = new TransformControlsGizmo();

    const group = new THREE.Group();

    // reusable objects

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true
    });

    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true
    });

    const arrowGeometry = new THREE.CylinderGeometry(0, 0.03, 0.1, 12);
    arrowGeometry.translate(0, 0.05, 0);

    const lineGeometry = new THREE.CylinderGeometry(0.0075, 0.0075, 1, 3);
    lineGeometry.translate(0, 0.5, 0);

    const gizmoTranslate = {
      X: [
        [new THREE.Mesh(arrowGeometry, arrowMaterial), [1, 0, 0], [0, 0, - Math.PI / 2]],
        [new THREE.Mesh(lineGeometry, lineMaterial), [0, 0, 0], [0, 0, - Math.PI / 2]]
      ],
      Y: [
        [new THREE.Mesh(arrowGeometry, arrowMaterial), [0, 1, 0]],
        [new THREE.Mesh(lineGeometry, lineMaterial)]
      ],
      Z: [
        [new THREE.Mesh(arrowGeometry, arrowMaterial), [0, 0, 1], [Math.PI / 2, 0, 0]],
        [new THREE.Mesh(lineGeometry, lineMaterial), null, [Math.PI / 2, 0, 0]]
      ],
    };

    function createAxis(items: Array<any>) {
      const axis = new THREE.Object3D();
      for (const it of items) {
        const [mesh, position, rotation] = it;
        if (position) {
          mesh.position.set(position[0], position[1], position[2]);
        }
        if (rotation) {
          mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
        axis.add(mesh);
      }
      return axis;
    }

    // axis 
    const axisX = createAxis(gizmoTranslate.X);
    const axisY = createAxis(gizmoTranslate.Y);
    const axisZ = createAxis(gizmoTranslate.Z);

    group.add(axisX);
    group.add(axisY);
    group.add(axisZ);

    super(uuid, parent, { object: group });

    this.lineMaterial = lineMaterial;
    this.arrowMaterial = arrowMaterial;
    this.lineGeometry = lineGeometry;
    this.axisX = axisX;
    this.axisY = axisY;
    this.axisZ = axisZ;
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      switch (name) {
        case 'length':
          return this.lineGeometry.parameters.height;
        case 'lineMaterial':
          return this.lineMaterial.uuid;
        case 'arrowMaterial':
          return this.arrowMaterial.uuid;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    if (name === 'lineMaterial' || name === 'arrowMaterial') {
      super.set({ name, value: value?.uuid || value });
    } else {
      super.set({ name, value });
    }
    if (!['length', 'lineMaterial', 'arrowMaterial'].includes(name)) {
      return;
    }
    if (name === 'length') {
      const lineGeo = new THREE.CylinderGeometry(this.lineGeometry.parameters.radiusTop, this.lineGeometry.parameters.radiusBottom, value, this.lineGeometry.parameters.radialSegments);
      this.lineGeometry = lineGeo;
      lineGeo.translate(0, value / 2, 0);
      const xyz = ['x', 'y', 'z'];
      let index = 0;
      for (const iterator of [this.axisX, this.axisY, this.axisZ]) {
        const [arrow, line] = iterator.children as Array<THREE.Mesh>;
        line.geometry = lineGeo;
        line.matrixWorldNeedsUpdate = true;
        (arrow.position as any)[xyz[index]] = value;
        arrow.matrixWorldNeedsUpdate = true;
        index++;
      }
    } else if (name === 'lineMaterial') {
      // is uuid
      const mat = typeof value === 'string' ? this.getMaterialFromId(value) : (value ?? new THREE.MeshPhongMaterial({ color: '#333', depthWrite: false, transparent: true }));
      this.lineMaterial = mat;
      for (const iterator of [this.axisX, this.axisY, this.axisZ]) {
        const [, line] = iterator.children as Array<THREE.Mesh>;
        line.material = mat;
      }
    } else if (name === 'arrowMaterial') {
      // is uuid
      const mat = typeof value === 'string' ? this.getMaterialFromId(value) : (value ?? new THREE.MeshPhongMaterial({ color: '#333', depthWrite: false, transparent: true }));
      this.arrowMaterial = mat;
      for (const iterator of [this.axisX, this.axisY, this.axisZ]) {
        const [arrow,] = iterator.children as Array<THREE.Mesh>;
        arrow.material = mat;
      }
    }
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      length: makeProperty(instance, {
        name: 'length',
        type: 'number'
      }),
      lineMaterial: makeProperty(instance, {
        name: 'lineMaterial',
        type: 'material'
      }),
      arrowMaterial: makeProperty(instance, {
        name: 'arrowMaterial',
        type: 'material'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}

// Reusable utility variables

class TransformControlsGizmo extends THREE.Object3D {
  [x: string]: any;
  constructor() {
    super();

    // shared materials

    const gizmoMaterial = new THREE.MeshBasicMaterial({
      // depthTest: false,
      // depthWrite: false,
      fog: false,
      toneMapped: false,
      transparent: true
    });

    // Make unique material for each axis/color
    const matRed = gizmoMaterial.clone();
    matRed.color.setHex(0xff0000);

    const matGreen = gizmoMaterial.clone();
    matGreen.color.setHex(0x00ff00);

    const matBlue = gizmoMaterial.clone();
    matBlue.color.setHex(0x0000ff);

    // reusable geometry

    const arrowGeometry = new THREE.CylinderGeometry(0, 0.04, 0.1, 12);
    arrowGeometry.translate(0, 0.05, 0);

    const lineGeometry2 = new THREE.CylinderGeometry(0.0075, 0.0075, 1, 3);
    lineGeometry2.translate(0, 0.5, 0);

    // Gizmo definitions - custom hierarchy definitions for setupGizmo() function

    const gizmoTranslate = {
      X: [
        [new THREE.Mesh(arrowGeometry, matRed), [1, 0, 0], [0, 0, - Math.PI / 2]],
        [new THREE.Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, - Math.PI / 2]]
      ],
      Y: [
        [new THREE.Mesh(arrowGeometry, matGreen), [0, 1, 0]],
        [new THREE.Mesh(lineGeometry2, matGreen)]
      ],
      Z: [
        [new THREE.Mesh(arrowGeometry, matBlue), [0, 0, 1], [Math.PI / 2, 0, 0]],
        [new THREE.Mesh(lineGeometry2, matBlue), null, [Math.PI / 2, 0, 0]]
      ],
    };

    // Creates an Object3D with gizmos described in custom hierarchy definition.

    function setupGizmo(gizmoMap: Record<string, any>) {
      const gizmo = new THREE.Object3D();
      for (const name in gizmoMap) {
        for (let i = gizmoMap[name].length; i--;) {

          const object = gizmoMap[name][i][0];
          const position = gizmoMap[name][i][1];
          const rotation = gizmoMap[name][i][2];
          const scale = gizmoMap[name][i][3];
          const tag = gizmoMap[name][i][4];

          // name and tag properties are essential for picking and updating logic.
          object.name = name;
          object.tag = tag;

          if (position) {
            object.position.set(position[0], position[1], position[2]);
          }

          if (rotation) {
            object.rotation.set(rotation[0], rotation[1], rotation[2]);
          }

          if (scale) {
            object.scale.set(scale[0], scale[1], scale[2]);
          }

          // object.updateMatrix();

          // const tempGeometry = object.geometry.clone();
          // tempGeometry.applyMatrix4(object.matrix);
          // object.geometry = tempGeometry;
          // object.renderOrder = Infinity;

          // object.position.set(0, 0, 0);
          // object.rotation.set(0, 0, 0);
          // object.scale.set(1, 1, 1);

          gizmo.add(object);
        }
      }
      return gizmo;
    }

    // Gizmo creation

    this.add(setupGizmo(gizmoTranslate));
  }
}
