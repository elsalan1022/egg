/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { Egg, Property, runtime, Slot, Unit, } from 'egg';
import { ActionBase } from '../../unit';
import { makeEvent, makeNamesSlotData, makeProperty, makeSlot } from '../../utils';
import { gScreen } from '../devs/screen/screen';
import { gclsids } from '../../clsids';

function toCamelString(s: string) {
  return s.replace(/[-_](\w)/g, (all, letter) => letter.toUpperCase()).replace(/^\w/, (all) => all.toLowerCase());
}

class Runtime extends Phynit<THREE.Group> {
  static type: UnitType = 'object';
  static clsname: ClsName = 'model3d';
  static clsid = gclsids.model3d;
  mixer: THREE.AnimationMixer;
  clips: Record<string, THREE.AnimationClip>;
  animations: Record<string, THREE.AnimationAction>;
  protected moveSpeed: number;
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, prosthesis?: runtime.Unit) {
    if (!prosthesis) {
      throw new Error('prosthesis is not initialized');
    }
    const { object, clips } = prosthesis as any;
    super(uuid, parent, { object: object || new THREE.Group() });
    this.moveSpeed = 0;
    this.mixer = new THREE.AnimationMixer(this.object);
    this.clips = clips;
    this.animations = clips ? Object.fromEntries(Object.entries(clips as Record<string, THREE.AnimationClip>).map(([name, it]) => [toCamelString(name), this.mixer.clipAction(it)])) : {};
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
  update(delta: number, now: number, scene: any): void {
    if (this.moveSpeed) {
      this.object.translateZ(this.moveSpeed * delta);
    }
    this.mixer.update(delta);
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (!['model'].includes(name)) {
      return;
    }
    const parent = this.object.parent;
    this.loadModel(value).then((assets) => {
      this.stop({ name: 'all' });
      if (parent) {
        parent.remove(this.object);
        (this as any).object = assets.object;
        parent.add(this.object);
      }
      this.mixer = new THREE.AnimationMixer(assets.object);
      this.clips = assets.clips;
      this.animations = Object.fromEntries(Object.entries(assets.clips as Record<string, THREE.AnimationClip>).map(([name, it]) => [toCamelString(name), this.mixer.clipAction(it)]));
    });
  }
  static async create(uuid?: string, parent?: runtime.Unit, properties?: Record<string, any>): Promise<runtime.Unit> {
    const assets = properties && properties['model'] ? await gScreen.loadModel(properties['model']) : {};
    return super.create(uuid, parent, Object.assign({}, properties || {}, assets || {}));
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['model', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    const ins = instance as Runtime;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const unit = this;
    // properties
    const props: Record<string, Property> = {
      scale: makeProperty(instance, {
        name: 'scale',
        type: 'number',
        min: 0,
        max: 100,
        step: 0.01,
      }),
      model: makeProperty(instance, {
        name: 'model',
        type: 'unknown'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
    delete this.properties['material'];
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

