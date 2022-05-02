/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { Egg, Property, runtime, Unit, } from 'egg';
import { Phynit, PhynitUnit } from '../devs/screen/phynit';
import { makeProperty } from '../../utils';
import { gScreen } from '../devs/screen/screen';
import { gclsids } from '../../clsids';

export class Runtime extends Phynit {
  static type: UnitType = 'object';
  static clsname: ClsName = 'text3d';
  static clsid = gclsids.text3d;

  group: THREE.Group;
  textMesh: THREE.Mesh | null = null;
  textGeo: THREE.ShapeGeometry | null = null;
  font: Font;
  constructor(uuid: string | undefined, parent: runtime.Unit | undefined, { font }: { font: Font }) {
    const group = new THREE.Group();
    super(uuid, parent, { object: group });
    this.font = font;
    this.group = group;
    this.updateText();
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v === undefined) {
      switch (name) {
        case 'size':
          return 1;
        case 'opacity':
          return 1;
      }
    }
    return v;
  }
  set({ name, value }: { name: string; value: any; }): void {
    super.set({ name, value });
    if (['text', 'size', 'height'].includes(name)) {
      this.updateText();
    } else if (name === 'color') {
      if (this.textMesh) {
        (this.textMesh.material as any).color.set(value);
      }
    } else if (name === 'opacity') {
      if (this.textMesh) {
        (this.textMesh.material as THREE.MeshBasicMaterial).opacity = value;
      }
    } else if (['align', 'valign'].includes(name)) {
      this.updateAlign();
    }
  }
  private updateText() {
    const text = this.get({ name: 'text' });
    if (!text) {
      return;
    }
    const size = this.get({ name: 'size' });
    const color = this.get({ name: 'color' });
    const opacity = this.get({ name: 'opacity' });

    const shapes = this.font.generateShapes(text.toString(), size);
    const textGeo = new THREE.ShapeGeometry(shapes);
    textGeo.computeBoundingBox();
    if (!textGeo.boundingBox) {
      return;
    }

    if (!this.textMesh) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide
      });

      const textMesh = new THREE.Mesh(textGeo, material);

      textMesh.position.x = 0;
      textMesh.position.y = 0;
      textMesh.position.z = 0;

      textMesh.rotation.x = 0;
      textMesh.rotation.y = Math.PI;
      textMesh.rotation.z = Math.PI;
      this.group.add(textMesh);

      this.textMesh = textMesh;
    } else {
      (this.textMesh as THREE.Mesh).geometry = textGeo;
    }
    this.textGeo = textGeo;

    this.updateAlign();
  }
  private updateAlign() {
    const textGeo = this.textGeo;
    if (!this.textMesh || !textGeo?.boundingBox) {
      return;
    }
    const centerOffsetX = 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    const align = this.get({ name: 'align' }) || 'center';
    if (align === 'left') {
      this.textMesh.position.x = 0;
    } else if (align === 'center') {
      this.textMesh.position.x = -centerOffsetX;
    } else {
      this.textMesh.position.x = - 2 * centerOffsetX;
    }
    const centerOffsetY = 0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
    const valign = this.get({ name: 'valign' }) || 'middle';
    if (valign === 'top') {
      this.textMesh.position.y = textGeo.boundingBox.min.y + 2 * centerOffsetY;
    } else if (valign === 'middle') {
      this.textMesh.position.y = textGeo.boundingBox.min.y + centerOffsetY;
    } else {
      this.textMesh.position.y = textGeo.boundingBox.min.y;
    }
  }
  static async create(uuid?: string, parent?: runtime.Unit, properties?: Record<string, any>): Promise<runtime.Unit> {
    const font = properties?.font || gScreen.getFont();
    if (!font) {
      throw new Error('font not found');
    }
    return super.create(uuid, parent, Object.assign({}, properties || {}, { font }));
  }
}

export class Decoration extends PhynitUnit<Runtime> {
  static runtime = Runtime;
  static tags: string[] = ['text', '3d'];
  constructor(egg: Egg, instance: Runtime, parent: Unit) {
    super(egg, instance, parent);
    // properties
    const props: Record<string, Property> = {
      text: makeProperty(instance, {
        name: 'text',
        type: 'string'
      }),
      size: makeProperty(instance, {
        name: 'size',
        type: 'number'
      }),
      align: makeProperty(instance, {
        name: 'align',
        type: 'string',
        values: [{
          value: 'left',
          label: 'text.align.left',
        }, {
          value: 'center',
          label: 'text.align.center',
        }, {
          value: 'right',
          label: 'text.align.right',
        }],
      }),
      valign: makeProperty(instance, {
        name: 'valign',
        type: 'string',
        values: [{
          value: 'top',
          label: 'text.align.top',
        }, {
          value: 'middle',
          label: 'text.align.middle',
        }, {
          value: 'bottom',
          label: 'text.align.bottom',
        }],
      }),
      color: makeProperty(instance, {
        name: 'color',
        type: 'color'
      }),
      opacity: makeProperty(instance, {
        name: 'opacity',
        type: 'number',
        min: 0,
        max: 1,
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
    delete this.properties['material'];
  }
}
