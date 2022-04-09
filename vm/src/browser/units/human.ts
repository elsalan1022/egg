/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, runtime, Slot, Unit, } from 'egg';
import { ActionBase } from '../../unit';
import { makeEvent, makeNamesSlotData, makeSlot } from '../../utils';
import { gScreen } from '../devs/screen/screen';

function toCamelString(s: string) {
  return s.replace(/[-_](\w)/g, (all, letter) => letter.toUpperCase()).replace(/^\w/, (all) => all.toLowerCase());
}

const _v1 = /*@__PURE__*/ new THREE.Vector3();
const _zAxis = /*@__PURE__*/ new THREE.Vector3(0, 0, 1);

export class HumanRuntime extends Phynit<THREE.Group> {
  mixer: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  animations: Record<string, THREE.AnimationAction>;
  protected capsule: THREE.CylinderGeometry;
  protected moveSpeed: number;
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, prosthesis?: runtime.Unit) {
    if (!prosthesis) {
      throw new Error('prosthesis is not initialized');
    }
    const { object, clips } = prosthesis as any;
    const box3 = new THREE.Box3().setFromObject(object);
    const center = box3.getCenter(new THREE.Vector3());
    const height = box3.getSize(new THREE.Vector3()).y;
    super(uuid, parent, { object });
    this.capsule = new THREE.CylinderGeometry(0.2, 0.2, height, 32, 1);
    this.moveSpeed = 0;
    this.mixer = new THREE.AnimationMixer(object);
    this.clips = clips;
    this.animations = Object.fromEntries(Object.entries(clips as Record<string, THREE.AnimationClip>).map(([name, it]) => [toCamelString(name), this.mixer.clipAction(it)]));
  }
  do({ name, speed, loop }: { name: string; speed?: number; loop?: boolean; }) {
    const action = this.animations[name];
    if (!action) {
      throw new Error(`unknown action: ${name}`);
    } else if (action.isRunning()) {
      return;
    }
    action.clampWhenFinished = true;
    action.reset()
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
      .setEffectiveTimeScale(speed || 1)
      .setEffectiveWeight(1)
      .fadeIn(1.0)
      .play();
    const sound = gScreen.sounds[name];
    if (sound) {
      this.playSound({ name, loop });
    }
  }
  stop({ name }: { name: string; }) {
    const action = this.animations[name];
    if (!action) {
      if (name !== 'all') {
        throw new Error(`unknown action: ${name}`);
      }
      for (const [k, action] of Object.entries(this.animations)) {
        if (action.isRunning()) {
          action.fadeOut(1.0);
        }
      }
      this.stopSound({});
      this.moveSpeed = 0;
      return;
    } else if (name === 'move') {
      this.moveSpeed = 0;
      return;
    } else if (name === 'turn') {
      return;
    } else if (!action.isRunning()) {
      return;
    }
    action.fadeOut(1.0);
    const sound = gScreen.sounds[name];
    if (sound) {
      this.playSound({ name });
    }
  }
  move({ speed }: { speed: number }): void {
    this.moveSpeed = speed;
  }
  turn({ angle }: { angle: number }): void {
    this.object.rotateY(Math.PI * angle / 180);
  }
  collide(pos: THREE.Vector3): GUID {
    if (!this.parent) {
      return '';
    }
    const center = pos.clone().add(this.center);
    const objects = Object.values(this.parent.children).map((e: any) => e.object).filter((e: any) => e !== this.object);
    const vertices = this.capsule.getAttribute('position')?.array as Float32Array;
    const count = vertices?.length / 3;
    for (let index = 0; index < count; index++) {
      const x = vertices[index * 3];
      const y = vertices[index * 3 + 1];
      const z = vertices[index * 3 + 2];
      const point = new THREE.Vector3(x, y, z);
      const ray = new THREE.Raycaster(center, point);
      const intersects = ray.intersectObjects(objects);
      if (intersects.length) {
        return intersects[0].object.userData.uid;
      }
    }
    return '';
  }
  update(delta: number, now: number, scene: any): void {
    if (this.moveSpeed) {
      _v1.copy(_zAxis).applyQuaternion(this.object.quaternion);

      const pos = this.position.clone().add(_v1.multiplyScalar(this.moveSpeed * delta));

      const target = this.collide(pos);
      if (target) {
        this.emit('collide', { target });
      } else {
        this.object.translateZ(this.moveSpeed * delta);
      }
    }
    this.mixer.update(delta);
  }
}

export class HumanUnit<T extends HumanRuntime> extends PhynitUnit<T> {
  constructor(egg: Egg, instance: runtime.Unit, parent?: Unit) {
    super(egg, instance as T, parent);
    const ins = instance as HumanRuntime;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const unit = this;
    const actions = {
      // collide: class extends ActionBase {
      //   slots: Record<string, Slot> = {
      //     target: makeSlot({
      //       name: 'target.unit',
      //       data: {
      //         type: 'unit',
      //       },
      //       required: true,
      //     }),
      //   };
      //   constructor(callee: Unit) {
      //     super(callee, 'collide');
      //   }
      // },
      do: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}, () => {
              return Object.keys(ins.animations);
            }),
            required: true,
          }),
          speed: makeSlot({
            name: 'speed',
            data: {
              type: 'number',
              min: 0.0001,
              max: 10,
            },
          }),
          loop: makeSlot({
            name: 'loop',
            data: {
              type: 'boolean',
            },
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'do');
        }
      },
      stop: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}, () => {
              return Object.keys(ins.animations).concat(['all']);
            }),
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'stop');
        }
      },
      turn: class extends ActionBase {
        slots: Record<string, Slot> = {
          angle: makeSlot({
            name: 'target.angle',
            data: {
              type: 'number',
            },
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'turn');
        }
      },
      move: class extends ActionBase {
        slots: Record<string, Slot> = {
          speed: makeSlot({
            name: 'speed',
            data: {
              type: 'number',
            },
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'move');
        }
      },
    };

    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }

    for (const name of Object.keys((instance as any).animations)) {
      this.actions[name] = class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, name, async () => {
            await ins.do({ name, loop: true });
          });
        }
      };
    }

    // events
    const events = {
      collide: makeEvent({
        name: 'collide',
        params: {
          target: {
            type: 'string',
            name: 'target',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}

