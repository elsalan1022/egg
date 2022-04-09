/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ActionBase, UnitImpl, UnitRuntime } from '../../../unit';
import { BlockConstructor, Egg, Property, runtime, Slot, Unit } from 'egg';
import { makeSlot, makeProperty, makeNamesSlotData } from '../../../utils';
import { gScreen } from './screen';
import { Scene } from './scene';

export class VisRuntime<T extends THREE.Object3D = THREE.Object3D> extends UnitRuntime {
  /** isVisUnit */
  readonly isVisUnit = true;
  /** object */
  readonly object: T;
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, { object, }: { object: T; }) {
    super(uuid, parent);
    object.traverse(function (o: any) {
      if (o.isMesh) o.castShadow = true;
    });
    object.userData.uid = uuid;
    this.object = object;
    this.object.name = (this as any).__proto__.clsname;
  }
  get position() {
    return this.object.position;
  }
  async die() {
    if ((this as any).cloned) {
      super.die();
      if (this.object.parent) {
        this.object.parent.remove(this.object);
      }
    } else {
      this.object.visible = false;
    }
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    if (name === 'position') {
      return { x: this.object.position.x, y: this.object.position.y, z: this.object.position.z };
    } else if (name === 'scale') {
      return 1;
    } else if (name === 'rotation') {
      return { x: this.object.rotation.x, y: this.object.rotation.y, z: this.object.rotation.z };
    } else if (name === 'material') {
      const mesh = this.object as any as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      return (mesh.material as any).uuid;
    } else if (name === 'visible') {
      return true;
    }
  }
  set({ name, value }: { name: string; value: any; }): void {
    if (name === 'material') {
      super.set({ name, value: value?.uuid || value });
    } else {
      super.set({ name, value });
    }
    if (name === 'position') {
      this.object.position.set(value.x, value.y, value.z);
    } else if (name === 'scale') {
      this.object.scale.set(value, value, value);
    } else if (name === 'rotation') {
      this.object.rotation.set(value.x, value.y, value.z);
    } else if (name === 'material') {
      const mesh = this.object as any as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      // is uuid
      if (typeof value === 'string') {
        const mat = this.getMaterialFromId(value);
        if (mat) {
          mesh.material = mat;
        }
      } else {
        mesh.material = value ?? new THREE.MeshPhongMaterial({ color: 0xfff, depthWrite: false });
      }
    } else if (name === 'visible') {
      this.object.visible = value;
    }
  }
  getMaterialFromId(id: string): THREE.Material | null {
    return gScreen.getMaterialFromId(id);
  }
}

export class VisUnit<T extends VisRuntime> extends UnitImpl {
  constructor(egg: Egg, instance: T, parent?: Unit) {
    super(egg, instance as runtime.Unit, parent);
    // properties
    const props: Record<string, Property> = {
      position: makeProperty(instance, {
        name: 'position',
        type: 'vec3',
      }),
      rotation: makeProperty(instance, {
        name: 'rotation',
        type: 'vec3',
      }),
      scale: makeProperty(instance, {
        name: 'scale',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
      }),
      material: makeProperty(instance, {
        name: 'material',
        type: 'material'
      }),
      visible: makeProperty(instance, {
        name: 'visible',
        type: 'boolean',
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}

export abstract class Phynit<T extends THREE.Object3D = THREE.Object3D> extends VisRuntime {
  /** is phynit */
  readonly isPhynit = true;
  readonly physics?: CANNON.Body;
  readonly selfUpdate?: boolean;
  protected center: THREE.Vector3;
  protected soudsCached: Record<string, THREE.PositionalAudio> = {};
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, prosthesis: { object: T; physics?: CANNON.Body, selfUpdate?: boolean; }) {
    const { object, physics, selfUpdate } = prosthesis;
    super(uuid, parent, prosthesis);
    const box3 = new THREE.Box3().setFromObject(object);
    const center = box3.getCenter(new THREE.Vector3());
    this.center = center;
    this.physics = physics;
    this.selfUpdate = selfUpdate;
    if (!this.selfUpdate && physics) {
      physics.position.set(center.x, center.y, center.z);
    }
  }
  get position() {
    return this.object.position;
  }
  onWorldSetup?(scene: Scene, wolrd: CANNON.World): void;
  onWorldTeardown?(scene: Scene, wolrd: CANNON.World): void;
  update(delta: number, now: number, scene: Scene, world: CANNON.World): void {
    if (!this.selfUpdate && this.physics) {
      this.object.position.set(this.physics.position.x, this.physics.position.y, this.physics.position.z);
      this.object.quaternion.set(this.physics.quaternion.x, this.physics.quaternion.y, this.physics.quaternion.z, this.physics.quaternion.w);
    }
  }
  scale({ value }: { value: number }): void {
    if (!value) {
      return;
    }
    this.object.scale.x += value;
    this.object.scale.y += value;
    this.object.scale.z += value;
  }
  playSound({ name, loop }: { name: string; loop?: boolean; }): void {
    let sound = this.soudsCached[name];
    if (!sound) {
      const info = gScreen.sounds[name];
      if (!info) {
        throw new Error(`sound ${name} not found`);
      }
      sound = new THREE.PositionalAudio(gScreen.listener);
      sound.setBuffer(info.buffer);
      sound.setLoop(!!loop);
      this.soudsCached[name] = sound;
      this.object.add(sound);
    }
    sound.play();
  }
  stopSound({ name }: { name?: string; }) {
    if (!name) {
      Object.values(this.soudsCached).forEach(e => e.stop());
    } else {
      const sound = this.soudsCached[name];
      if (!sound) {
        return;
      }
      sound.stop();
    }
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    if (name === 'mass') {
      return this.physics?.mass ?? 0;
    } else if (name === 'velocity') {
      return this.physics ? { x: this.physics.velocity.x, y: this.physics.velocity.y, z: this.physics.velocity.z } : { x: 0, y: 0, z: 0 };
    } else if (name === 'force') {
      return this.physics ? { x: this.physics.force.x, y: this.physics.force.y, z: this.physics.force.z } : { x: 0, y: 0, z: 0 };
    } else if (name === 'friction') {
      return this.physics ? this.physics.material?.friction : 0;
    } else if (name === 'restitution') {
      return this.physics ? this.physics.material?.restitution : 0;
    }
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (name === 'position') {
      if (this.physics) {
        this.physics.position.set(value.x, value.y, value.z);
        this.physics.velocity.set(0, 0, 0);
        this.physics.quaternion.set(0, 0, 0, 1);
      }
    } else if (name === 'mass') {
      if (this.physics) {
        this.physics.mass = value;
      }
    } else if (name === 'velocity') {
      if (this.physics) {
        this.physics.velocity.set(value.x, value.y, value.z);
      }
    } else if (name === 'force') {
      if (this.physics) {
        this.physics.force.set(value.x, value.y, value.z);
      }
    } else if (name === 'friction') {
      if (this.physics?.material) {
        this.physics.material.friction = value;
      }
    } else if (name === 'restitution') {
      if (this.physics?.material) {
        this.physics.material.restitution = value;
      }
    }
  }
}

export abstract class PhynitUnit<T extends Phynit> extends VisUnit<T> {
  constructor(egg: Egg, instance: runtime.Unit, parent?: Unit) {
    super(egg, instance as T, parent);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // actions
    const actions: Record<string, BlockConstructor> = {
      scale: class extends ActionBase {
        slots: Record<string, Slot> = {
          value: makeSlot({
            name: 'target.value',
            data: {
              type: 'number',
            },
            required: true,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'scale');
        }
      },
      playSound: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(self, {}, () => {
              return Object.keys(gScreen.sounds);
            }),
            required: true,
          }),
          loop: makeSlot({
            name: 'loop',
            data: {
              type: 'boolean',
            },
            required: false,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'playSound');
        }
      },
      stopSound: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(self, {}, () => {
              return Object.keys(gScreen.sounds);
            }),
            required: false,
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'stopSound');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
    delete this.actions.scale;

    // properties
    if ((instance as Phynit).physics) {
      const props: Record<string, Property> = {
        mass: makeProperty(instance, {
          name: 'mass',
          type: 'number',
        }),
        velocity: makeProperty(instance, {
          name: 'velocity',
          type: 'vec3',
        }),
        force: makeProperty(instance, {
          name: 'force',
          type: 'vec3',
        }),
        friction: makeProperty(instance, {
          name: 'friction',
          type: 'number',
        }),
        restitution: makeProperty(instance, {
          name: 'restitution',
          type: 'number',
        }),
      };
      for (const iterator of Object.entries(props)) {
        const [key, value] = iterator;
        this.properties[key] = value;
      }
    }
    delete this.properties.scale;
  }
}

export class Phynit2D extends VisRuntime {
  static is2D = true;
}

export class PhynitUnit2D<T extends Phynit2D> extends VisUnit<T> {
  constructor(egg: Egg, instance: runtime.Unit, parent?: Unit) {
    super(egg, instance as T, parent);
  }
}
