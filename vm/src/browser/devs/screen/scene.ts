/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { UnitImpl, UnitRuntime } from '../../../unit';
import { BlockConstructor, Egg, Property, runtime, } from 'egg';
import { Phynit } from './phynit';
import { gclsids } from '../../../clsids';
import { makeEvent, makeProperty, } from '../../../utils';
import { gScreen } from './screen';

export class Scene extends UnitRuntime {
  static type: UnitType = 'object';
  static clsname: ClsName = 'scene';
  static clsid = gclsids.scene;
  readonly isScene = true;
  // 3d wolrd
  readonly scene: THREE.Scene;
  protected light: THREE.DirectionalLight;
  protected spotLight: THREE.SpotLight;
  protected ambient: THREE.AmbientLight;
  protected ground: THREE.Mesh;
  // physics
  protected world: CANNON.World;
  protected gravity: CANNON.Vec3 = new CANNON.Vec3(0, -9.8, 0);
  constructor(uuid: string, parent: runtime.Unit) {
    super(uuid, parent);

    // scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfd1e5);
    // this.scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
    /** sky.color */

    // lights
    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(3, 10, 10);
    this.light.castShadow = true;
    this.light.shadow.mapSize.x = 1024;
    this.light.shadow.mapSize.y = 1024;
    this.light.shadow.camera.visible = true;
    this.light.shadow.camera.top = 10;
    this.light.shadow.camera.bottom = - 2;
    this.light.shadow.camera.left = - 2;
    this.light.shadow.camera.right = 2;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = 40;
    this.scene.add(this.light);
    /** light.color */
    /** light.position */

    // ambient light
    this.ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(this.ambient);
    /** ambient.color */

    // spot light
    this.spotLight = new THREE.SpotLight(0xffffff);
    this.spotLight.position.set(0, 10, 0);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.x = 1024;
    this.spotLight.shadow.mapSize.y = 1024;
    this.spotLight.shadow.camera.near = 0.1;
    this.spotLight.shadow.camera.far = 40;
    this.spotLight.shadow.camera.fov = 30;
    this.scene.add(this.spotLight);

    /** ground */
    const material = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false, specular: 0x101010 });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), material);
    this.ground.rotation.x = - Math.PI / 2;
    this.ground.position.y = - 0.0001;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    /** ground.color */

    // physics
    this.world = new CANNON.World({
      gravity: this.gravity,
    });
    this.world.broadphase = new CANNON.NaiveBroadphase();
    // Tweak contact properties.
    // Contact stiffness - use to make softer/harder contacts
    this.world.defaultContactMaterial.contactEquationStiffness = 5e6;
    // Stabilization time in number of timesteps
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;

    // const groundPlane = this.ground.geometry as THREE.PlaneGeometry;
    const groundShape = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, 0, 0),
      shape: new CANNON.Plane(),
      material: new CANNON.Material({ friction: 0.1, restitution: 0.01 }),
    });
    groundShape.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    // groundShape.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    this.ground.userData.physics = groundShape;
    this.world.addBody(groundShape);
  }

  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  get name() {
    return this.get({ name: 'name' });
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    // default values
    const fn = ({
      name: () => (this.constructor as runtime.UnitConstructor).clsname,
      'sky.color': () => `#${(this.scene.background as THREE.Color).getHexString()}`,
      // 'camera.position': () => ({ x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }),
      'light.on': () => this.light.visible,
      'light.color': () => `#${this.light.color.getHexString()}`,
      'light.position': () => ({ x: this.light.position.x, y: this.light.position.y, z: this.light.position.z }),
      'light.intensity': () => this.light.intensity,
      'spot.on': () => this.spotLight.visible,
      'spot.color': () => `#${this.spotLight.color.getHexString()}`,
      'spot.position': () => ({ x: this.spotLight.position.x, y: this.spotLight.position.y, z: this.spotLight.position.z }),
      'ambient.on': () => this.ambient.visible,
      'ambient.color': () => `#${this.ambient.color.getHexString()}`,
      'ground.visible': () => this.ground.visible,
      'ground.material': () => (this.ground.material as THREE.Material).uuid,
    })[name];
    return fn?.();
  }
  set({ name, value }: { name: string; value: any; }): void {
    if (name === 'ground.material') {
      super.set({ name, value: value.uuid || value });
    } else {
      super.set({ name, value });
    }
    if (name === 'sky.color') {
      this.scene.background = new THREE.Color(value);
      // } else if (name === 'camera.position') {
      //   this.camera.position.set(value.x, value.y, value.z);
    } else if (name === 'light.on') {
      this.light.visible = value;
    } else if (name === 'light.color') {
      this.light.color.set(value);
    } else if (name === 'light.position') {
      this.light.position.set(value.x, value.y, value.z);
    } else if (name === 'light.intensity') {
      this.light.intensity = value;
    } else if (name === 'spot.on') {
      this.spotLight.visible = value;
    } else if (name === 'spot.color') {
      this.spotLight.color.set(value);
    } else if (name === 'spot.position') {
      this.spotLight.position.set(value.x, value.y, value.z);
    } else if (name === 'ambient.on') {
      this.ambient.visible = value;
    } else if (name === 'ambient.color') {
      this.ambient.color.set(value);
    } else if (name === 'ground.visible') {
      this.ground.visible = value;
    } else if (name === 'ground.material') {
      // is uuid
      if (typeof value === 'string') {
        const mat = this.getMaterialFromId(value);
        if (mat) {
          this.ground.material = mat;
        }
      } else {
        this.ground.material = value;
      }
    }
  }
  appendChild(unit: runtime.Unit): void {
    if (!(unit instanceof Phynit)) {
      throw new Error("Not allowed.");
    }
    super.appendChild(unit);
    this.scene.add(unit.object);
    if (unit.physics) {
      this.world.addBody(unit.physics);
    } else if (unit.onWorldSetup) {
      unit.onWorldSetup(this, this.world);
    }
  }
  removeChild(unit: runtime.Unit): void {
    if (!(unit instanceof Phynit)) {
      throw new Error("Not allowed.");
    }
    super.removeChild(unit);
    this.scene.remove(unit.object);
    if (unit.physics) {
      this.world.removeBody(unit.physics);
    } else if (unit.onWorldTeardown) {
      unit.onWorldTeardown(this, this.world);
    }
  }
  update(delta: number, now: number) {
    this.world.step(delta);
    // update units
    const each = (it: Phynit) => {
      it.update(delta, now, this, this.world);
      for (const sub of Object.values(it.children)) {
        each(sub as Phynit);
      }
    };
    for (const it of Object.values(this.children)) {
      each(it as Phynit);
    }
  }
  render(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    renderer.render(this.scene, camera);
  }
  getMaterialFromId(id: string): THREE.Material | null {
    return gScreen.getMaterialFromId(id);
  }
}

export class Decoration extends UnitImpl {
  static runtime = Scene;

  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);

    const props: Record<string, Property> = {
      name: makeProperty(instance, {
        name: 'name',
        type: 'string',
      }),
      'sky.color': makeProperty(instance, {
        name: 'sky.color',
        group: 'scene',
        type: 'color',
      }),
      'ground.visible': makeProperty(instance, {
        name: 'ground.visible',
        group: 'ground',
        type: 'boolean',
      }),
      'ground.material': makeProperty(instance, {
        name: 'ground.material',
        group: 'ground',
        type: 'material',
      }),
      'light.on': makeProperty(instance, {
        name: 'light.on',
        group: 'light',
        type: 'boolean',
      }),
      'light.color': makeProperty(instance, {
        name: 'light.color',
        group: 'light',
        type: 'color',
      }),
      'light.position': makeProperty(instance, {
        name: 'light.position',
        group: 'light',
        type: 'vec3',
      }),
      'light.intensity': makeProperty(instance, {
        name: 'light.intensity',
        group: 'light',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
      }),
      'spot.on': makeProperty(instance, {
        name: 'spot.on',
        group: 'spot',
        type: 'boolean',
      }),
      'spot.color': makeProperty(instance, {
        name: 'spot.color',
        group: 'spot',
        type: 'color',
      }),
      'spot.position': makeProperty(instance, {
        name: 'spot.position',
        group: 'spot',
        type: 'vec3',
      }),
      'ambient.on': makeProperty(instance, {
        name: 'ambient.on',
        group: 'ambient',
        type: 'boolean',
      }),
      'ambient.color': makeProperty(instance, {
        name: 'ambient.color',
        group: 'ambient',
        type: 'color',
      }),
      'wind.force': makeProperty(instance, {
        name: 'wind.force',
        group: 'wind',
        type: 'vec3',
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }

    // actions
    const actions: Record<string, BlockConstructor> = {
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
    delete this.actions['clone'];

    // events
    const events = {
      enter: makeEvent({
        name: 'enter',
      }),
      leave: makeEvent({
        name: 'leave',
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}

