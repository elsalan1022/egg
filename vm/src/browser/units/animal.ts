/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, runtime, Slot, Unit, } from 'egg';
import { ActionBase } from '../../unit';
import { makeNamesSlotData, makeSlot } from '../../utils';

export const actionGroup = {
  leg: ['run', 'walk', 'jump', 'sit', 'crouch', 'crawl', 'standup'],
  hand: ['fist', 'five', 'victory'],
  face: ['smile', 'cry', 'talk'],
};

function toCamelString(s: string) {
  return s.replace(/[-_](\w)/g, (all, letter) => letter.toUpperCase()).replace(/^\w/, (all) => all.toLowerCase());
}

export interface Assets {
  object: THREE.Object3D;
  clips: Record<string, THREE.AnimationClip>;
  sounds: Record<string, THREE.PositionalAudio>;
}

export class AniRuntime extends Phynit {
  mixer: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  sounds: Record<string, THREE.PositionalAudio>;
  animations: Record<string, THREE.AnimationAction>;
  moveSpeed = 0;
  rotateSpeed = 0;
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, prosthesis?: runtime.Unit) {
    if (!prosthesis) {
      throw new Error('prosthesis is not initialized');
    }
    const umenon = prosthesis as any as Assets;
    super(uuid, parent, umenon);
    this.mixer = new THREE.AnimationMixer(umenon.object);
    this.clips = umenon.clips;
    this.sounds = Object.fromEntries(Object.entries(umenon.sounds).map(([name, sound]) => [toCamelString(name), sound.clone().add(this.object)]));
    this.animations = Object.fromEntries(Object.entries(umenon.clips).map(([name, it]) => [toCamelString(name), this.mixer.clipAction(it)]));
  }
  do({ name, speed, loop }: { name: string; speed?: number; loop?: boolean; }) {
    const action = this.animations[name];
    if (!action) {
      throw new Error(`unknown action: ${name}`);
    } else if (action.isRunning()) {
      return;
    }
    // const clipInfo = this.clips[name];
    // for (const iterator of clipInfo.conflicts) {
    //   this.stop({ name: iterator });
    // }
    action.clampWhenFinished = true;
    action.reset()
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
      .setEffectiveTimeScale(speed || 1)
      .setEffectiveWeight(1)
      .fadeIn(1.0)
      .play();
    const sound = this.sounds[name];
    if (sound) {
      if (loop) {
        sound.loop = true;
      }
      sound.play();
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
        const sound = this.sounds[k];
        if (sound) {
          sound.stop();
        }
      }
      this.moveSpeed = 0;
      this.rotateSpeed = 0;
      return;
    } else if (name === 'move') {
      this.moveSpeed = 0;
      return;
    } else if (name === 'turn') {
      this.rotateSpeed = 0;
      return;
    } else if (!action.isRunning()) {
      return;
    }
    action.fadeOut(1.0);
    const sound = this.sounds[name];
    if (sound) {
      sound.stop();
    }
  }
  move({ distance }: { distance: number }): void {
    this.moveSpeed = distance;
  }
  turn({ angle }: { angle: number }): void {
    this.rotateSpeed = angle;
  }
  update(delta: number, now: number, scene: any): void {
    if (this.moveSpeed) {
      this.object.translateZ(this.moveSpeed * delta);
    }
    if (this.rotateSpeed) {
      this.object.rotateY(this.rotateSpeed * delta);
    }
    this.mixer.update(delta);
  }
}

export class PhyUnit<T extends AniRuntime> extends PhynitUnit<T> {
  constructor(egg: Egg, instance: runtime.Unit, parent?: Unit) {
    super(egg, instance as T, parent);
    const ins = instance as AniRuntime;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const unit = this;
    const actions = {
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
          distance: makeSlot({
            name: 'target.distance',
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
  }
}

