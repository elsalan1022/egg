import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { generateCoords, } from './cube';
import { roundedEdgeBox, roundedPlane } from './geometries';
import { Axis, color2Face, Colors, CubeInfo, CudeType, face2Color, FaceName, NotationBase, StickerInfo } from './types';

const faceInfo: {
  [index: string]: {
    position: [number, number, number];
    rotation: [number, number, number];
    name: FaceName;
    color: Colors;
  }
} = {
  U: { position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0], name: 'up', color: Colors.White },
  D: { position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0], name: 'down', color: Colors.Yellow },
  F: { position: [0, 0, 0.51], rotation: [0, 0, 0], name: 'front', color: Colors.Green },
  B: { position: [0, 0, -0.51], rotation: [Math.PI, 0, 0], name: 'back', color: Colors.Blue },
  L: { position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0], name: 'left', color: Colors.Orange },
  R: { position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0], name: 'right', color: Colors.Red },
};

type RotateTask = {
  axis: Axis;
  rad: number;
  cubes: Array<THREE.Mesh>;
  resolve: any;
  reject: any;
};

type RotateAction = {
  axis: Axis;
  name?: NotationBase;
  step: number;
};

function arrayRemove(arr: Array<any>, filter: (item: any) => boolean) {
  const removed = arr.filter(filter);
  for (const iterator of removed) {
    arr.splice(arr.indexOf(iterator), 1);
  }
  return removed;
}

export class RubikCubeModel {
  group = new THREE.Group();
  tracker = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 1), new THREE.MeshPhongMaterial({ color: 0x16ee16, opacity: 0.5, transparent: true }));
  transformer = new THREE.Group;
  cubes: THREE.Mesh[] = [];
  faces: {
    all: THREE.Mesh[];
    up: THREE.Mesh[],
    down: THREE.Mesh[],
    front: THREE.Mesh[],
    back: THREE.Mesh[],
    left: THREE.Mesh[],
    right: THREE.Mesh[]
  } = { all: [], up: [], down: [], front: [], back: [], left: [], right: [] } as any;
  rotateTasks: RotateTask[] = [];
  rotating: RotateTask | null = null;
  history: Array<RotateAction> = [];
  constructor() {
    // this.group.add(this.tracker);
    this.group.add(this.transformer);

    const cubes = generateCoords();
    for (const cube of cubes) {
      const geometry = roundedEdgeBox(1, 1, 1, 0.05, 4);
      const materials = new THREE.MeshLambertMaterial({ emissive: '#333', transparent: true });
      const color = cube.color as any;

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.name = 'cubelet';

      // save user info
      const userData = mesh.userData as CubeInfo;
      userData.initPosition = new THREE.Vector3().set(cube.x, cube.y, cube.z);
      userData.type = cube.type as CudeType;

      for (const key of Object.keys(color)) {
        const planeGeometry = roundedPlane(0, 0, 0.9, 0.9, 0.1);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: color[key], side: THREE.DoubleSide, bumpScale: 0.05 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        const clrInfo = faceInfo[key];
        plane.rotation.fromArray(clrInfo.rotation);
        plane.position.fromArray(clrInfo.position);
        plane.name = 'face';
        plane.userData.color = face2Color[clrInfo.name];
        mesh.attach(plane);
        this.faces[clrInfo.name].push(plane);
        this.faces.all.push(plane);
      }

      mesh.position.set(cube.x, cube.y, cube.z);

      this.group.add(mesh);
      this.cubes.push(mesh);
    }
  }

  check() {
    for (const faces of [this.faces.up, this.faces.down, this.faces.front, this.faces.back, this.faces.left, this.faces.right]) {
      const color = faces[0].userData.color;
      for (let index = 1; index < faces.length; index++) {
        if (faces[index].userData.color !== color) {
          return false;
        }
      }
    }
    return true;
  }

  reset() {
    this.clearHistory();
    this.cubes.forEach(cube => {
      const userData = cube.userData as CubeInfo;
      cube.position.copy(userData.initPosition);
      cube.rotation.set(0, 0, 0);
    });
    this.faces.back = [];
    this.faces.front = [];
    this.faces.left = [];
    this.faces.right = [];
    this.faces.up = [];
    this.faces.down = [];
    this.faces.all.forEach(face => {
      const userData = face.userData as StickerInfo;
      const faceName = color2Face[userData.color];
      (this.faces as any)[faceName].push(face);
    });
    this.group.updateWorldMatrix(false, false);
  }

  clearHistory() {
    this.history = [];
  }

  rollback() {
    for (const iterator of [...this.history]) {
      if (iterator.name) {
        this.rotateWithName(iterator.name, -iterator.step);
      } else if (iterator.axis === 'x') {
        this.rotateX(-iterator.step);
      } else {
        this.rotateY(-iterator.step);
      }
    }
    this.clearHistory();
  }

  /**
   *
   * @param step  rad = step * Math.PI / 2, counterclockwise if step > 0
   * @returns
   */
  async rotateWithName(name: NotationBase, step: number) {
    const stepLocal = (4 + step % 4) % 4;
    const faceName = (faceInfo[name] || {} as any).name;
    const faces = this.faces[faceName] || [];
    const facesUpdate: Array<THREE.Mesh[]> = [];
    let axis: Axis = 'x';

    const findCube = function (cube: THREE.Mesh, ls1: Array<THREE.Mesh>, ls2: Array<THREE.Mesh>) {
      return ls1.find(it => it.parent === cube) || ls2.find(it => it.parent === cube);
    }

    if (name === 'L') {
      facesUpdate.push(this.faces.up, this.faces.front, this.faces.down, this.faces.back);
    }
    else if (name === 'M') {
      facesUpdate.push(this.faces.up, this.faces.front, this.faces.down, this.faces.back);
      for (const iterator of this.faces.all) {
        if (findCube(iterator.parent as any, this.faces.left, this.faces.right)) {
          continue;
        }
        faces.push(iterator);
      }
    } else if (name === 'R') {
      facesUpdate.push(this.faces.up, this.faces.front, this.faces.down, this.faces.back);
    } else if (name === 'U') {
      axis = 'y';
      facesUpdate.push(this.faces.left, this.faces.front, this.faces.right, this.faces.back);
    } else if (name === 'E') {
      axis = 'y';
      facesUpdate.push(this.faces.left, this.faces.front, this.faces.right, this.faces.back);
      for (const iterator of this.faces.all) {
        if (findCube(iterator.parent as any, this.faces.up, this.faces.down)) {
          continue;
        }
        faces.push(iterator);
      }
    } else if (name === 'D') {
      axis = 'y';
      facesUpdate.push(this.faces.left, this.faces.front, this.faces.right, this.faces.back);
    } else if (name === 'F') {
      axis = 'z';
      facesUpdate.push(this.faces.up, this.faces.left, this.faces.down, this.faces.right);
    } else if (name === 'S') {
      axis = 'z';
      facesUpdate.push(this.faces.up, this.faces.left, this.faces.down, this.faces.right);
      for (const iterator of this.faces.all) {
        if (findCube(iterator.parent as any, this.faces.front, this.faces.back)) {
          continue;
        }
        faces.push(iterator);
      }
    } else if (name === 'B') {
      axis = 'z';
      facesUpdate.push(this.faces.up, this.faces.left, this.faces.down, this.faces.right);
    }

    const cubes = faces.map(iterator => iterator.parent as THREE.Mesh);

    for (let index = 0; index < stepLocal; index++) {
      const [f1, f2, f3, f4] = facesUpdate;
      const [ms1, ms2, ms3, ms4] = facesUpdate.map(face => arrayRemove(face, iterator => cubes.includes(iterator.parent)));
      f1.push(...ms4);
      f2.push(...ms1);
      f3.push(...ms2);
      f4.push(...ms3);
    }

    this.history.push({ axis, name, step });

    return new Promise((resolve, reject) => {
      this.rotateTasks.push({
        axis,
        rad: step * Math.PI / 2,
        cubes,
        resolve,
        reject,
      });
      this.excuteRotate();
    });
  }

  /**
   *
   * @param step  rad = step * Math.PI / 2, counterclockwise if step > 0
   * @returns
   */
  async rotateX(step: number) {
    const stepLocal = (4 + step % 4) % 4;

    for (let index = 0; index < stepLocal; index++) {
      const face = this.faces.up;
      this.faces.up = this.faces.back;
      this.faces.back = this.faces.down;
      this.faces.down = this.faces.front;
      this.faces.front = face;
    }

    this.history.push({ axis: 'x', step });

    return new Promise((resolve, reject) => {
      this.rotateTasks.push({
        axis: 'x',
        rad: step * Math.PI / 2,
        cubes: this.cubes,
        resolve,
        reject,
      });
      this.excuteRotate();
    });
  }

  async rotateY(step: number) {
    const stepLocal = (4 + step % 4) % 4;

    for (let index = 0; index < stepLocal; index++) {
      const face = this.faces.front;
      this.faces.front = this.faces.left;
      this.faces.left = this.faces.back;
      this.faces.back = this.faces.right;
      this.faces.right = face;
    }

    this.history.push({ axis: 'y', step });

    return new Promise((resolve, reject) => {
      this.rotateTasks.push({
        axis: 'y',
        rad: step * Math.PI / 2,
        cubes: this.cubes,
        resolve,
        reject,
      });
      this.excuteRotate();
    });
  }

  excuteRotate(): any {
    if (this.rotating) {
      return;
    }
    const task = this.rotateTasks.shift();
    if (!task) {
      return;
    }

    const { axis, rad, cubes, resolve, reject } = task;
    if (!rad) {
      return setTimeout(() => {
        this.excuteRotate();
      }, 0);
    }

    this.rotating = task;

    this.transformer.rotation.x = 0;
    this.transformer.rotation.y = 0;
    this.transformer.rotation.z = 0;

    cubes.forEach(cube => this.transformer.add(cube));

    // The rotation degree may be greater than 360
    // Like: 361 -> 0
    const startRad = this.transformer.rotation[axis] % (Math.PI * 2);

    const current = { rad: startRad };
    const end = { rad: startRad + rad };
    const time = Math.abs(rad) * (500 / Math.PI);

    const updateMatrix = () => {
      // Updates the global transform If you need to get rotation immediately when rotation Object3d
      this.transformer.updateWorldMatrix(false, false);

      for (let i = this.transformer.children.length - 1; i >= 0; i--) {
        const obj = this.transformer.children[i];

        const position = new THREE.Vector3();
        obj.getWorldPosition(position);

        const quaternion = new THREE.Quaternion();
        obj.getWorldQuaternion(quaternion);

        this.transformer.remove(obj);

        position.x = parseFloat((position.x / this.group.scale.x).toFixed(15));
        position.y = parseFloat((position.y / this.group.scale.y).toFixed(15));
        position.z = parseFloat((position.z / this.group.scale.z).toFixed(15));

        obj.position.copy(position);
        obj.quaternion.copy(quaternion);

        this.group.add(obj);
      }
    }

    try {
      new TWEEN.Tween(current)
        .to(end, time)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          this.transformer.rotation[axis] = current.rad;
          // Updates the global transform If you need to get rotation immediately
          // this.updateWorldMatrix(false, false);
        })
        .onComplete(() => {
          updateMatrix();
          resolve(true);
          this.rotating = null;
          setTimeout(() => {
            this.excuteRotate();
          }, 0);
        })
        // Parameter 'undefined' is needed in version 18.6.0
        // Reference: https://github.com/tweenjs/tween.js/pull/550
        .start(undefined);
    } catch (err) {
      cubes.forEach(cube => this.group.add(cube));
      reject(err);
      this.rotating = null;
      setTimeout(() => {
        this.excuteRotate();
      }, 0);
    }
  }
}
