/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Egg, Property, runtime, Unit, } from 'egg';
import { Phynit, PhynitUnit } from 'egg/src/browser/devs/screen/phynit';
import { makeProperty } from 'egg/src/utils';

const vex = `
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 10.0;
  gl_Position = projectionMatrix * mvPosition;
}`;

const frag = `
uniform vec3 color;
void main() {
  gl_FragColor = vec4( color, 1.0 );
}`;

const partCount = 17;
const batchCount = 20;
const frameSize = batchCount * partCount;
const pointSize = 3; /** x,y,z,visible */

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'skeleton';
  static clsid = '9e8f7f7f-f8f8-4f8f-8f8f-8f8f8f8f8fa2';
  private offset = 0;
  private frameCount = 0;
  constructor(uuid?: string, parent?: runtime.Unit) {
    const positions = new Float32Array(batchCount * partCount * pointSize);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, pointSize));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vex,
      fragmentShader: frag,
    });
    const particles = new THREE.Points(geometry, material);
    super(uuid, parent, { object: particles });
  }
  update(delta: number, now: number, scene: any): void {
    const { pose } = this.properties;
    if (!pose) {
      return;
    }

    this.frameCount++;
    const gap = this.properties.gap || 1;
    if (this.frameCount % gap !== 0) {
      return;
    }

    const width = this.properties.width || 1;
    const height = this.properties.height || 1;

    const particles = this.object as THREE.Points;
    const positions = particles.geometry.attributes.position.array as any;

    let pos = this.offset;
    for (const vec of Object.values(pose) as any) {
      const pos4 = pos * pointSize;
      positions[pos4] = vec.x / width - 0.5;
      positions[pos4 + 1] = vec.y / height - 0.5;
      positions[pos4 + 2] = 0;
      // positions[pos4 + 3] = 1;
      pos++;
    }
    for (let index = 0; index < frameSize; index++) {
      const pos4 = index * pointSize;
      positions[pos4 + 2] -= 0.01;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    this.offset += partCount;
    if (this.offset === partCount * partCount) {
      this.offset = 0;
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
      width: makeProperty(instance, {
        name: 'width',
        type: 'number'
      }),
      height: makeProperty(instance, {
        name: 'height',
        type: 'number'
      }),
      gap: makeProperty(instance, {
        name: 'gap',
        type: 'number'
      }),
      pose: makeProperty(instance, {
        name: 'pose',
        type: 'json'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}
