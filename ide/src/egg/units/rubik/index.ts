/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Phynit, PhynitUnit } from 'egg/src/browser/devs/screen/phynit';
import { Scene } from 'egg/src/browser/devs/screen/scene';
import { BlockConstructor, Egg, NativeData, Property, runtime, Slot, Unit, } from 'egg';
import { makeNamesSlotData, makeProperty, makeSlot } from 'egg/src/utils';
import { RubikCubeModel } from './model';
import { LayerModel } from './layer';
import { ActionBase } from 'egg/src/unit';
import { bases, randomNotation, toRotation } from './utils';
import { Axis } from './types';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'rubik';
  static clsid = '2e8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f9f';
  model: RubikCubeModel;
  layerGroup = new LayerModel(false);
  constructor(uuid?: string, parent?: runtime.Unit) {
    const model = new RubikCubeModel();
    super(uuid, parent, { object: model.group });
    this.model = model;
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    if (name === 'material') {
      const mesh = this.model.group.children[0] as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      return (mesh.material as any).uuid;
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    if (name === 'texture') {
      super.set({ name, value: value?.uuid || value });
    } else {
      super.set({ name, value });
    }
    if (name === 'material') {
      // is uuid
      const mat = typeof value === 'string' ? this.getMaterialFromId(value) : (value ?? new THREE.MeshPhongMaterial({ color: '#333', depthWrite: false, transparent: true }));
      for (const cube of this.model.group.children) {
        (cube as THREE.Mesh).material = mat;
      }
    } else if (name === 'scale') {
      this.layerGroup.scale.set(value, value, value);
    } else if (name === 'position') {
      this.layerGroup.position.set(value.x, value.y, value.z);
    } else if (name === 'texture') {
      // is uuid
      const text = typeof value === 'string' ? this.getTextureFromId(value) : value;
      for (const cube of this.model.group.children) {
        for (const plane of cube.children) {
          ((plane as THREE.Mesh).material as THREE.MeshStandardMaterial).bumpMap = text;
          ((plane as THREE.Mesh).material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    }
  }
  async random() {
    let i = 0;
    let lastNotation = '';
    const total = 20;
    while (i < total) {
      const notation = randomNotation();

      if (lastNotation && notation[0] === lastNotation[0]) {
        continue;
      }
      lastNotation = notation;

      const [layerRorationAxis, axisValue, rotationRad] = toRotation(notation);
      this.model.move(notation);

      this.layerGroup.group(layerRorationAxis, axisValue, this.model.group.children);
      await this.rotationTransition(layerRorationAxis, rotationRad);
      i++;
    }
  }
  async move({ name, step }: { name: string; step: string }) {
    const notation = `${name}${step}`;

    const [layerRorationAxis, axisValue, rotationRad] = toRotation(notation);
    this.model.move(notation);

    this.layerGroup.group(layerRorationAxis, axisValue, this.model.group.children);
    await this.rotationTransition(layerRorationAxis, rotationRad);
  }
  check(): boolean {
    return this.model.check();
  }
  onWorldSetup(scene: Scene, wolrd: any): void {
    scene.scene.add(this.layerGroup);
  }
  onWorldTeardown(scene: Scene, wolrd: any): void {
    scene.scene.remove(this.layerGroup);
  }
  update(delta: number, now: number, scene: Scene, wolrd: any): void {
    TWEEN.update();
  }
  private async rotationTransition(axis: Axis, endRad: number) {
    await this.layerGroup.rotationAnimation(axis, endRad);
    this.layerGroup.ungroup(this.model.group);
    this.layerGroup.initRotation();
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['shape', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const unit = this;

    // properties
    const props: Record<string, Property> = {
      scale: makeProperty(instance, {
        name: 'scale',
        type: 'number'
      }),
      texture: makeProperty(instance, {
        name: 'texture',
        type: 'texture'
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }

    // actions
    const actions: Record<string, BlockConstructor> = {
      random: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'random');
        }
      },
      move: class extends ActionBase {
        slots: Record<string, Slot> = {
          name: makeSlot({
            name: 'name',
            data: makeNamesSlotData(unit, {}, () => {
              return bases;
            }),
            required: true,
          }),
          step: makeSlot({
            name: 'step',
            data: {
              type: 'string',
              values: [
                {
                  value: '',
                  label: 'step-1',
                },
                {
                  value: '2',
                  label: 'step-2',
                },
                {
                  value: `'`,
                  label: 'back-1',
                },
              ]
            },
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'move');
        }
      },
      check: class extends ActionBase {
        output: NativeData = {
          type: 'boolean',
          name: '.',
          label: 'result',
          description: 'result-desc',
        };
        constructor(callee: Unit) {
          super(callee, 'check');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
  }
}
