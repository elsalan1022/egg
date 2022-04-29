import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { RubikCube, Cubelet } from './cube';
import { roundedEdgeBox, roundedPlane } from './geometries';

const faceInfo: {
  [index: string]: {
    position: [number, number, number],
    rotation: [number, number, number]
  }
} = {
  U: { position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0] },
  D: { position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0] },
  F: { position: [0, 0, 0.51], rotation: [0, 0, 0] },
  B: { position: [0, 0, -0.51], rotation: [Math.PI, 0, 0] },
  L: { position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  R: { position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0] },
};

export interface CubeletModel extends THREE.Mesh {
  cubeType?: string;
  num?: number;
  initPosition?: THREE.Vector3;
}

export class RubikCubeModel extends RubikCube {
  group = new THREE.Group();
  tracker = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 1), new THREE.MeshPhongMaterial({ color: 0x16ee16, opacity: 0.5, transparent: true }));
  constructor(fb?: string) {
    super(fb);
    this.group.add(this.tracker);
    for (const cubeInfo of this.cubelets) {
      const cubeletModel = this.generateCubeletModel(cubeInfo);
      cubeletModel.name = 'cubelet';
      cubeletModel.cubeType = cubeInfo.type;
      cubeletModel.num = cubeInfo.num;
      cubeletModel.position.set(cubeInfo.x, cubeInfo.y, cubeInfo.z);
      cubeletModel.initPosition = new THREE.Vector3().set(cubeInfo.x, cubeInfo.y, cubeInfo.z);
      cubeInfo.mesh = cubeletModel;
      this.group.add(cubeletModel);
    }
  }

  async rotate(step: number) {
    // this.group.rotation.y += step * Math.PI / 2;
    this.tracker.rotation.y -= step * Math.PI / 2;

    const current = { value: this.group.rotation.y };
    const end = { value: this.group.rotation.y + step * Math.PI / 2 };
    const time = 500;

    return new Promise((resolve, reject) => {
      try {
        new TWEEN.Tween(current)
          .to(end, time)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate(() => {
            this.group.rotation.y = current.value;
            // Updates the global transform If you need to get rotation immediately
            // this.updateWorldMatrix(false, false);
          })
          .onComplete(resolve)
          // Parameter 'undefined' is needed in version 18.6.0
          // Reference: https://github.com/tweenjs/tween.js/pull/550
          .start(undefined);
      } catch (err) {
        reject(err);
      }
    });
  }

  generateCubeletModel(info: Cubelet) {
    const geometry = roundedEdgeBox(1, 1, 1, 0.05, 4);
    const materials = new THREE.MeshLambertMaterial({ emissive: '#333', transparent: true });
    const cubeletModel = new THREE.Mesh(geometry, materials) as CubeletModel;
    const color = info.color as any;
    for (const key of Object.keys(color)) {
      const planeGeometry = roundedPlane(0, 0, 0.9, 0.9, 0.1);
      const planeMaterial = new THREE.MeshStandardMaterial({ color: color[key], side: THREE.DoubleSide, bumpScale: 0.05 });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.fromArray(faceInfo[key].rotation);
      plane.position.fromArray(faceInfo[key].position);
      plane.name = 'face';
      cubeletModel.attach(plane);
    }
    return cubeletModel;
  }

  dispose() {
    for (const cubeletModel of (this.group.children as CubeletModel[])) {
      if (cubeletModel.material instanceof THREE.Material) {
        cubeletModel.material.dispose();
      }
      cubeletModel.geometry.dispose();
      for (const plan of (cubeletModel.children as THREE.Mesh[])) {
        if (plan.material instanceof THREE.Material) {
          plan.material.dispose();
        }
        (plan as THREE.Mesh).geometry.dispose();
      }
    }
  }
}
