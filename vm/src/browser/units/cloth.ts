/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import SimplexNoise from 'simplex-noise';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Unit, } from 'egg';
import { makeProperty } from '../../utils';
import { gclsids } from '../../clsids';
import shader from '../../shaders/cloth';
import { Scene } from '../devs/screen/scene';

const noise = new SimplexNoise();

export const map = (value: number, min1: number, max1: number, min2: number, max2: number) => min2 + (max2 - min2) * (value - min1) / (max1 - min1);
const off = 0.1;

type Piece = {
  body: CANNON.Body;
  constraints: Array<CANNON.DistanceConstraint>;
  initPos: THREE.Vector3;
};

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'cloth';
  static clsid = gclsids.cloth;
  private shape: CANNON.Particle = new CANNON.Particle();
  private pieces: Array<Piece> = [];
  constructor(uuid?: string, parent?: runtime.Unit) {
    const plane = new THREE.PlaneBufferGeometry(1, 1, 20, 20);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: 0 },
      },
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(plane, material);
    super(uuid, parent, { object: mesh });
    this.reshape();
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      const mesh = this.object as THREE.Mesh;
      const geo = mesh.geometry as THREE.PlaneBufferGeometry;
      switch (name) {
        case 'width':
          return geo.parameters.width;
        case 'height':
          return geo.parameters.height;
        case 'widthSegments':
          return geo.parameters.widthSegments;
        case 'heightSegments':
          return geo.parameters.heightSegments;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneBufferGeometry;
    if (name === 'width') {
      mesh.geometry = new THREE.PlaneBufferGeometry(value, geo.parameters.height, geo.parameters.widthSegments, geo.parameters.heightSegments);
    } else if (name === 'height') {
      mesh.geometry = new THREE.PlaneBufferGeometry(geo.parameters.width, value, geo.parameters.widthSegments, geo.parameters.heightSegments);
    } else if (name === 'widthSegments') {
      mesh.geometry = new THREE.PlaneBufferGeometry(geo.parameters.width, geo.parameters.height, value, geo.parameters.heightSegments);
    } else if (name === 'heightSegments') {
      mesh.geometry = new THREE.PlaneBufferGeometry(geo.parameters.width, geo.parameters.height, geo.parameters.widthSegments, value);
    } else if (name === 'position') {
      this.repos();
    } else {
      return;
    }
    mesh.matrixWorldNeedsUpdate = true;
    this.reshape();
  }
  private repos() {
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneBufferGeometry;
    const { position } = geo.attributes;

    for (let i = 0; i < position.count; i++) {
      const p = this.pieces[i];
      const pt = p.initPos.clone().applyQuaternion(this.object.quaternion);
      p.body.position.set(pt.x, pt.y, pt.z);
    }
  }
  private reshape() {
    // clear
    const world = this.pieces.length ? this.pieces[0].body.world : null;
    if (world) {
      this.onWorldTeardown(null as any, world);
    }

    const pieces = [];

    const mass = this.properties.mass || 1;
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneBufferGeometry;
    const { position } = geo.attributes;
    const massPerStitch = mass / position.count;
    const colCount = geo.parameters.widthSegments;
    const rowCount = geo.parameters.heightSegments;

    const stitchs: Array<CANNON.Body> = [];
    for (let i = 0; i < position.count; i++) {
      const pos = new CANNON.Vec3(
        position.getX(i),
        position.getY(i),
        position.getZ(i),
      );

      const stitch = new CANNON.Body({
        mass: massPerStitch,
        linearDamping: 0.8,
        position: pos,
        shape: this.shape,
        material: new CANNON.Material({
          friction: 0.1,
          restitution: 0.1,
        }),
      });

      stitchs.push(stitch);
    }

    // make a cloth
    for (let i = 0; i <= rowCount; i++) {
      for (let j = 0; j <= colCount; j++) {
        const constraints: Array<CANNON.DistanceConstraint> = [];
        const index = i * (colCount + 1) + j;
        const left = stitchs[index];
        if (j !== colCount) {
          const right = stitchs[index + 1];
          constraints.push(new CANNON.DistanceConstraint(left, right));
        }
        if (i !== rowCount) {
          const bottom = stitchs[index + colCount + 1];
          constraints.push(new CANNON.DistanceConstraint(left, bottom));
        }
        pieces.push({
          body: left,
          constraints,
          initPos: new THREE.Vector3(left.position.x, left.position.y, left.position.z),
        });
      }
    }

    // make a pole
    for (let j = 0; j <= colCount; j++) {
      const p1 = stitchs[j];
      const din = new CANNON.Body({
        mass: 0,
        position: p1.position.clone(),
        shape: this.shape,
      });
      const constraint = new CANNON.DistanceConstraint(din, p1, 0);
      pieces.push({
        body: din,
        constraints: [constraint],
        initPos: new THREE.Vector3(din.position.x, din.position.y, din.position.z),
      });
    }

    this.pieces = pieces;

    // restore
    if (world) {
      this.onWorldSetup(null as any, world);
    }

    // update position
    this.repos();
  }
  onWorldSetup(scene: Scene, wolrd: CANNON.World): void {
    this.pieces.forEach((piece) => {
      if (wolrd) {
        wolrd.addBody(piece.body);
        piece.constraints.forEach((c) => wolrd.addConstraint(c));
      }
    });
  }
  onWorldTeardown(scene: Scene, wolrd: CANNON.World): void {
    this.pieces.forEach((piece) => {
      if (piece.body.world) {
        piece.body.world.removeBody(piece.body);
        piece.constraints.forEach((c) => wolrd.removeConstraint(c));
      }
    });
  }
  update(delta: number, now: number, scene: Scene, wolrd: CANNON.World): void {
    const mesh = this.object as THREE.Mesh;
    const geo = mesh.geometry as THREE.PlaneBufferGeometry;
    const { position } = geo.attributes;
    const colCount = geo.parameters.widthSegments;
    const rowCount = geo.parameters.heightSegments;
    const windValue = scene.properties['wind.force'] || { x: 0, y: 0, z: 0 };
    const windForce = new CANNON.Vec3(windValue.x, windValue.y, windValue.z);

    for (let i = 0; i < position.count; i++) {
      const p = this.pieces[i];
      const xyz = p.body.position;

      // sync position
      position.setXYZ(i, xyz.x, xyz.y, xyz.z);

      // update wind
      const col = (i % (colCount));
      const row = Math.floor(i / (rowCount));

      const force = map(noise.noise3D(row, col, delta * 0.1), -1, 1, -0.01, 0.1);

      const wind = windForce.clone().scale(force);

      p.body.applyLocalForce(wind, CANNON.Vec3.ZERO);
    }
    position.needsUpdate = true;
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      mass: makeProperty(instance, {
        name: 'mass',
        type: 'number',
      }),
      width: makeProperty(instance, {
        name: 'width',
        type: 'number'
      }),
      height: makeProperty(instance, {
        name: 'height',
        type: 'number'
      }),
      widthSegments: makeProperty(instance, {
        name: 'widthSegments',
        type: 'number'
      }),
      heightSegments: makeProperty(instance, {
        name: 'heightSegments',
        type: 'number'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
