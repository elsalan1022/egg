/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Phynit, PhynitUnit } from 'egg/src/browser/devs/screen/phynit';
import { Scene } from 'egg/src/browser/devs/screen/scene';
import { BlockConstructor, Egg, NativeData, Property, runtime, Slot, Unit, } from 'egg';
import { makeNamesSlotData, makeProperty, makeSlot } from 'egg/src/utils';
import { RubikCubeModel } from './model';
// import { LayerModel } from './layer';
import { ActionBase } from 'egg/src/unit';
import { bases, randomChoice, randomNotation, toRotation } from './utils';
import { Axis } from './types';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'rubik';
  static clsid = '2e8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f9f';
  model: RubikCubeModel;
  // layerGroup = new LayerModel(false);
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
      const mesh = this.model.cubes[0] as THREE.Mesh;
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
      for (const mesh of this.model.cubes) {
        mesh.material = mat;
      }
      // } else if (name === 'scale') {
      //   this.layerGroup.scale.set(value, value, value);
      // } else if (name === 'position') {
      //   this.layerGroup.position.set(value.x, value.y, value.z);
    } else if (name === 'texture') {
      // is uuid
      const text = typeof value === 'string' ? this.getTextureFromId(value) : value;
      for (const mesh of this.model.cubes) {
        for (const plane of mesh.children) {
          const mat = (plane as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.bumpMap = text;
          mat.needsUpdate = true;
        }
      }
    }
  }
  async random() {
    let i = 0;
    const total = 20;
    while (i < total) {
      const notation = randomChoice(['L', 'R', 'U', 'F', 'D', 'B', 'M', 'E', 'S']);
      this.model.rotateWithName(notation as any, randomChoice([-1, 1, 2]));
      i++;
    }
    this.model.clearHistory();
  }
  async reset() {
    this.model.reset();
  }
  async rollback() {
    this.model.rollback();
  }
  async save() {
    return this.model.clearHistory();
  }
  async move({ name, step }: { name: string; step: number }) {
    this.model.rotateWithName(name as any, step);
    this.playSound({ name: 'rotate' });
  }
  async rotateX({ step }: { step: number }) {
    if (!step) {
      return;
    }
    this.model.rotateX(step);
  }
  async rotateY({ step }: { step: number }) {
    if (!step) {
      return;
    }
    this.model.rotateY(step);
  }
  check(): boolean {
    return this.model.check();
  }
  update(delta: number, now: number, scene: Scene, wolrd: any): void {
    TWEEN.update();
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
      reset: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'reset');
        }
      },
      save: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'save');
        }
      },
      rollback: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'rollback');
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
              type: 'number',
              values: [{
                value: 1,
                label: 'rotate-cw-1',
              }, {
                value: 2,
                label: 'rotate-cw-2',
              }, {
                value: -1,
                label: 'rotate-ccw-1',
              }]
            },
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'move');
        }
      },
      rotateX: class extends ActionBase {
        slots: Record<string, Slot> = {
          step: makeSlot({
            name: 'step',
            data: {
              type: 'number',
              values: [{
                value: 1,
                label: 'rotate-cw-1',
              }, {
                value: 2,
                label: 'rotate-cw-2',
              }, {
                value: -1,
                label: 'rotate-ccw-1',
              }]
            },
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'rotateX');
        }
      },
      rotateY: class extends ActionBase {
        slots: Record<string, Slot> = {
          step: makeSlot({
            name: 'step',
            data: {
              type: 'number',
              values: [{
                value: 1,
                label: 'rotate-cw-1',
              }, {
                value: 2,
                label: 'rotate-cw-2',
              }, {
                value: -1,
                label: 'rotate-ccw-1',
              }]
            },
          }),
        };
        constructor(callee: Unit) {
          super(callee, 'rotateY');
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
