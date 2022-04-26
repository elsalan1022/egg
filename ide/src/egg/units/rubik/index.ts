/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Phynit, PhynitUnit } from 'egg/src/browser/devs/screen/phynit';
import { Scene } from 'egg/src/browser/devs/screen/scene';
import { BlockConstructor, Egg, Property, runtime, Unit, } from 'egg';
import { makeProperty } from 'egg/src/utils';
import { RubikCubeModel } from './model';
import { LayerModel } from './layer';
import { ActionBase } from 'egg/src/unit';
import { randomNotation, toRotation } from './utils';
import { Axis } from './types';

class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'rubik';
  static clsid = '2e8f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f9f';
  model: RubikCubeModel;
  layerGroup = new LayerModel(true);
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
    super.set({ name, value });
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
  onWorldSetup(scene: Scene, wolrd: any): void {
    scene.scene.add(this.layerGroup);
  }
  onWorldTeardown(scene: Scene, wolrd: any): void {
    scene.scene.remove(this.layerGroup);
  }
  update(delta: number, now: number, scene: Scene, wolrd: any): void {
    TWEEN.update(now);
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
    // properties
    const props: Record<string, Property> = {
      scale: makeProperty(instance, {
        name: 'scale',
        type: 'number'
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
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
  }
}
