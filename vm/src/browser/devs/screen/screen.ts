/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ActionBase, } from '../../../unit';
import { BlockConstructor, Egg, NativeData, Property, runtime, Slot, Unit } from 'egg';
import { Phynit, Phynit2D } from './phynit';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { gclsids } from '../../../clsids';
import { debounce, makeProperty, makeSlot } from '../../../utils';
import { DevRuntime, DevUnit } from '../../../devs/base';
import { MaterialLoader, TextureLoader } from 'three';
import { Scene, Decoration as SceneDecoration } from './scene';

const xyz: any[] = ['x', 'y', 'z'];

type PercentSize = {
  x: number;
  y: number;
};

type Paths = {
  font: string;
  texture: string;
  sounds: string;
};

export let gScreen: Screen = null as any as Screen;

// @ts-ignore
const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
stats.domElement.style.right = '160px';
stats.domElement.style.left = 'unset';
document.body.appendChild(stats.domElement);

function removeImages(matJson: any) {
  delete matJson.images;
  return matJson;
}

export class Screen extends DevRuntime {
  static type: UnitType = 'screen';
  static clsname: ClsName = 'screen';
  static clsid = gclsids.screen;

  // 3d wolrd
  protected clock: THREE.Clock;
  protected renderer: THREE.WebGLRenderer;
  protected camera: THREE.PerspectiveCamera;
  readonly listener: THREE.AudioListener;
  // 2d plane
  protected scene2d: THREE.Scene;
  protected camera2d: THREE.OrthographicCamera;
  // web
  protected dom: HTMLElement | null = null;
  protected shadow: ShadowRoot | null = null;
  protected canvas: HTMLCanvasElement;
  protected obs: ResizeObserver | null = null;
  // font
  protected font: Font | null = null;
  // paths
  protected paths: Paths = {} as any;
  // materials and textures
  readonly materials: Record<string, THREE.Material> = {};
  readonly textures: Record<string, { image: string; value: THREE.Texture }> = {};
  readonly images: Array<[string, string]> = [];
  readonly sounds: Record<string, { filename: string; buffer: AudioBuffer }> = {};
  // state
  protected working = false;

  /** scene */
  readonly scene?: Scene;

  constructor(uuid?: string, parent?: runtime.Unit) {
    super(uuid, parent);

    gScreen = this;

    const expectedSize = { width: 604, height: 480 };

    this.canvas = document.createElement('canvas');
    this.canvas.style.transformOrigin = 'top left';

    // clock
    this.clock = new THREE.Clock();

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(expectedSize.width, expectedSize.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.autoClear = false;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    // camera
    this.camera = new THREE.PerspectiveCamera(50, expectedSize.width / expectedSize.height, 1, 100);
    this.camera.position.set(0, 1, 4);
    // this.camera.add(this.listener);
    // /** camera.position */

    // audio
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    /** scene 2d */
    this.scene2d = new THREE.Scene();
    /** camera 2d */
    this.camera2d = new THREE.OrthographicCamera(0, expectedSize.width, 0, -expectedSize.height, -100, 100);
  }

  protected resize() {
    if (!this.dom) {
      return;
    }
    const size = { width: this.dom.offsetWidth, height: this.dom.offsetHeight };
    this.canvas.width = size.width;
    this.canvas.height = size.height;
    this.canvas.style.width = size ? `${size.width}px` : '';
    this.canvas.style.height = size ? `${size.height}px` : '';
    this.renderer.setSize(size.width, size.height);

    /** update camera 3d */
    this.camera.aspect = size.width / size.height;
    this.camera.updateProjectionMatrix();

    /** update scene 2d */
    this.scene2d.rotation.x = Math.PI;

    /** update camera 2d */
    this.camera2d.right = size.width;
    this.camera2d.bottom = -size.height;
    this.camera2d.updateProjectionMatrix();
  }

  async start(): Promise<void> {
    if (this.working) {
      throw new Error('already working');
    }
    this.working = true;
    // const chick = this.parent as runtime.Chick;
    const fps = 30;
    const fpsInterval = 1000 / fps;
    let then: number | undefined = undefined;
    const step = (timestamp: number) => {
      if (!this.working) {
        return;
      }
      window.requestAnimationFrame(step);
      if (then === undefined) {
        then = timestamp;
      }
      const elapsed = timestamp - then;
      // if enough time has elapsed, draw the next frame
      if (elapsed > fpsInterval) {
        then = timestamp;
        this.update();
        this.render();
      }
    };
    window.requestAnimationFrame(step);
  }
  getFont() {
    return this.font;
  }
  get({ name }: { name: string; }) {
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    }
    // default values
    const fn = ({
      'light.physicallyCorrect': () => this.renderer.physicallyCorrectLights,
      'scene': () => this.scene?.uuid,
      'camera.position': () => ({ x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }),
      'camera.rotation': () => ({ x: this.camera.rotation.x, y: this.camera.rotation.y, z: this.camera.rotation.z }),
      'camera.anchor': () => this.camera.parent?.uuid,
    })[name];
    return fn?.();
  }
  set({ name, value }: { name: string; value: any; }): void {
    if (name === 'scene') {
      const uuid = value ? (value.uuid || value) : undefined;
      if (uuid !== undefined) {
        const scene = this.children[uuid];
        if (!scene) {
          throw new Error(`scene not found: ${uuid}`);
        } else if (!(scene instanceof Scene)) {
          throw new Error(`scene is not Scene: ${uuid}`);
        }
      }
      super.set({ name, value: uuid });
    } else if (name === 'camera.anchor') {
      const uuid = value ? (value.uuid || value) : undefined;
      if (uuid !== undefined) {
        const chick = this.parent as runtime.Chick;
        const target = chick.findUnit({ uuid });
        if (!target) {
          throw new Error(`chick not found: ${uuid}`);
        }
        if (!(target instanceof Phynit)) {
          throw new Error(`chick is not Phynit: ${uuid}`);
        }
      }
      super.set({ name, value: uuid });
    } else {
      super.set({ name, value });
    }
    if (name === 'light.physicallyCorrect') {
      this.renderer.physicallyCorrectLights = value;
    } else if (name === 'scene') {
      // is uuid
      if (typeof value === 'string') {
        const scene = this.children[value] as Scene;
        if (!scene) {
          throw new Error(`scene not found: ${value}`);
        }
        (this as any).scene = scene;
      } else {
        (this as any).scene = value;
      }
    } else if (name === 'camera.position') {
      this.camera.position.set(value.x, value.y, value.z);
    } else if (name === 'camera.rotation') {
      this.camera.rotation.set(value.x, value.y, value.z);
    } else if (name === 'camera.anchor') {
      if (this.camera.parent) {
        this.camera.parent.remove(this.camera);
      }
      // is uuid
      if (typeof value === 'string') {
        const chick = this.parent as runtime.Chick;
        const target = chick.findUnit({ uuid: value });
        if (!target) {
          throw new Error(`chick not found: ${value}`);
        }
        (target as Phynit).object.add(this.camera);
      } else if (value) {
        (value as Phynit).object.add(this.camera);
      }
    }
  }
  async setup(paths: Paths): Promise<void> {
    this.paths = paths;
    const loader = new FontLoader();
    this.font = await loader.loadAsync(paths.font);
    (this as any).images = (await fetch(this.paths.texture).then((res) => res.json())).map((v: string) => [v, `${this.paths.texture}/${v}`]);
    const sounds = (await fetch(this.paths.sounds).then((res) => res.json()));
    const audioLoader = new THREE.AudioLoader();
    (this as any).sounds = {};
    await Promise.all(sounds.map(async (v: string) => {
      const buffer = await audioLoader.loadAsync(`${this.paths.sounds}/${v}`);
      // const audio = new THREE.PositionalAudio(this.listener);
      // audio.setBuffer(buffer);
      const name = v.replace(/\..+$/, '');
      this.sounds[name] = { filename: v, buffer };
    }));
  }
  attach(element: HTMLElement) {
    if (this.dom) {
      this.dettach();
    }

    this.dom = element;
    this.shadow = element.attachShadow({ mode: 'open' });
    this.shadow.appendChild(this.canvas);
    this.obs = new ResizeObserver(() => {
      this.resize();
    });
    this.obs.observe(element);
    this.resize();
    this.start();
  }
  dettach() {
    if (this.dom) {
      this.obs?.unobserve(this.dom);
      this.dom = null;
    }
  }
  appendChild(unit: runtime.Unit): void {
    if (!(unit instanceof Phynit2D) && !(unit instanceof Phynit) && !(unit instanceof Scene)) {
      throw new Error("Not allowed.");
    }
    super.appendChild(unit);
    if (unit instanceof Phynit2D) {
      this.scene2d.add(unit.object);
    }
  }
  removeChild(unit: runtime.Unit): void {
    super.removeChild(unit);
    if (unit instanceof Phynit2D) {
      this.scene2d.remove(unit.object);
    }
  }
  private update() {
    const now = Date.now();
    const delta = this.clock.getDelta();

    if (delta <= 0) {
      return;
    }

    for (const it of Object.values(this.children)) {
      (it as Phynit).update(delta, now, null as any, null as any);
    }
  }
  private render() {
    this.renderer.clear();
    if (this.scene) {
      this.scene.render(this.renderer, this.camera);
    }
    this.renderer.render(this.scene2d, this.camera2d);
    stats.update();
  }
  reset() {
    const resetUnit = (it: Phynit) => {
      for (const [key, value] of Object.entries(it.properties)) {
        it.set({ name: key, value });
      }
      for (const child of Object.values(it.children)) {
        if (child.cloned) {
          delete it.children[child.uuid];
          continue;
        } else if (!(child as Phynit).isPhynit && !(child as Scene).isScene) {
          continue;
        }
        resetUnit(child as any);
      }
    };
    resetUnit(this as any);
  }
  to3D({ xy, z }: { xy: PercentSize; z?: number }) {
    return {
      x: xy.x * 2 - 1,
      y: -xy.y * 2 + 2,
      z: z || 0,
    };
  }
  getMaterialFromId(id: string): THREE.Material {
    return this.materials[id];
  }
  getImages() {
    return this.images;
  }
  getMaterials() {
    return this.materials;
  }
  addMaterial(material: THREE.Material) {
    if (this.materials[material.uuid]) {
      throw new Error("Material already exists.");
    }
    this.materials[material.uuid] = material;
  }
  removeMaterial(uuid: string) {
    if (!this.materials[uuid]) {
      throw new Error("Material not found.");
    }
    delete this.materials[uuid];
  }
  getTextures() {
    return this.textures;
  }
  getTextureFromImage(image: string): THREE.Texture | undefined {
    const it = Object.values(this.textures).find(e => e.image === image);
    return it?.value;
  }
  getTextureFromId(id: string): THREE.Texture | null {
    return (this.textures[id] || {}).value;
  }
  async addTexture(image: string) {
    const texture = await (new TextureLoader()).loadAsync(`${this.paths.texture}/${image}`);
    const info = {
      image,
      value: texture,
    };
    this.textures[texture.uuid] = info;
    return info;
  }
  removeTexture(uuid: string) {
    if (!this.textures[uuid]) {
      throw new Error("Texture not found.");
    }
    delete this.textures[uuid];
  }
  getScenes(): Array<SceneDecoration> {
    return Object.values(this.children).filter((e: any) => e.isScene) as any;
  }
  enterScene(uuid: GUID) {
    const it = this.children[uuid];
    if (!it) {
      throw new Error("Scene not found.");
    }
    if (!(it instanceof Scene)) {
      throw new Error("Not a scene.");
    }
    if (this.scene) {
      this.scene.emit('leave', {});
    }
    (this as any).scene = it as Scene;
    it.emit('leave', {});
  }
  async loadUserData(data: Record<string, any>) {
    const { materials, textures } = data;
    const loader = new MaterialLoader();
    (this as any).textures = {};
    const loaded: any = {};
    if (textures) {
      for (const [uuid, it] of Object.entries(textures)) {
        const image: string = (it as any).image || it;
        const texture = await (new TextureLoader()).loadAsync(`${this.paths.texture}/${image}`);
        texture.uuid = uuid;
        const cfg = (it as any).value;
        if (cfg) {
          for (const it of Object.entries(cfg)) {
            const [k, v] = it as any;
            if (['metadata', 'image'].includes(k)) {
              continue;
            }
            if (k === 'repeat') {
              texture.repeat.set(v[0], v[1]);
            } else if (k === 'offset') {
              texture.offset.set(v[0], v[1]);
            } else if (k === 'center') {
              texture.center.set(v[0], v[1]);
            } else if (k === 'wrap') {
              texture.wrapS = v[0];
              texture.wrapT = v[1];
            } else {
              (texture as any)[k] = v;
            }
          }
        }
        this.textures[uuid] = { image: image as string, value: texture };
        loaded[image as any] = true;
      }
    }
    loader.setTextures(Object.fromEntries(Object.entries(this.textures).map(([id, { value }]) => [id, value])));
    (this as any).materials = {};
    if (materials) {
      for (const [id, mat] of Object.entries(materials)) {
        const material = loader.parse(mat);
        this.materials[id] = material;
      }
    }
  }
  packUserData(): Record<string, any> {
    const textures = Object.fromEntries(Object.entries(this.textures).map(([id, { value }]) => [id, value]));
    return {
      materials: Object.fromEntries(Object.entries(this.materials).map(([uuid, material]) => [uuid, removeImages(material.toJSON({ textures }))])),
      textures: Object.fromEntries(Object.entries(this.textures).map(([uuid, it]) => [uuid, { image: it.image, value: it.value.toJSON(undefined) }])),
    };
  }
}

export class Decoration extends DevUnit {
  static runtime = Screen;

  protected camera: THREE.Camera;
  protected canvas: HTMLCanvasElement;
  protected raycaster = new THREE.Raycaster();
  protected pointer = new THREE.Vector2();
  protected onUpPosition = new THREE.Vector2();
  protected onDownPosition = new THREE.Vector2();
  protected orbit: OrbitControls;
  protected controls: TransformControls;
  protected axesHelper: THREE.AxesHelper;
  protected cbChanged?: (unit?: Unit) => void;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    const ins = this.instance as any as Screen;

    // add elements for editor

    const { canvas, camera, renderer, scene, light } = instance as any;

    this.canvas = canvas;
    this.camera = camera;

    // const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    // scene.add(cameraHelper);

    // const helper = new THREE.DirectionalLightHelper(light);
    // scene.add(helper);
    this.axesHelper = new THREE.AxesHelper(5);

    // orbit
    this.orbit = new OrbitControls(camera, renderer.domElement);
    this.orbit.addEventListener('change', () => {
      instance.properties['camera.position'] = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      instance.properties['camera.rotation'] = { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z };
      if (this.cbChanged) {
        debounce(this.cbChanged, 100)();
      }
    });
    // this.orbit.maxPolarAngle = Math.PI / 2;
    this.orbit.enableZoom = false;
    this.orbit.enablePan = false;
    this.orbit.enableDamping = false;
    this.orbit.update();

    // controls
    this.controls = new TransformControls(camera, renderer.domElement);
    this.controls.addEventListener('change', (ev) => {
      (ins as any).render();
    });
    this.controls.addEventListener('dragging-changed', (event) => {
      this.orbit.enabled = !event.value;
    });
    if (scene?.scene) {
      scene.scene.add(this.controls);
      scene.scene.add(this.axesHelper);
    }

    renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));

    const props: Record<string, Property> = {
      scene: makeProperty(instance, {
        name: 'scene',
        type: 'unit',
        label: 'scene.default',
      }),
      'camera.position': makeProperty(instance, {
        name: 'camera.position',
        group: 'camera',
        type: 'vec3',
      }),
      'camera.rotation': makeProperty(instance, {
        name: 'camera.rotation',
        group: 'camera',
        type: 'vec3',
      }),
      'camera.anchor': makeProperty(instance, {
        name: 'camera.anchor',
        group: 'camera',
        type: 'unit',
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }

    // actions
    const actions: Record<string, BlockConstructor> = {
      to3D: class extends ActionBase {
        slots: Record<string, Slot> = {
          xy: makeSlot({
            name: 'xy',
            data: {
              type: 'vec2',
            },
            required: true,
          }),
          z: makeSlot({
            name: 'z',
            data: {
              type: 'number',
            },
          }),
        };
        output: NativeData = {
          type: 'vec3',
          name: '.',
          label: 'result',
          description: 'result-desc',
        };
        constructor(callee: Unit) {
          super(callee, 'to3D');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
    delete this.actions['clone'];
  }

  private onPointerDown(event: MouseEvent) {
    this.onDownPosition.x = event.clientX;
    this.onDownPosition.y = event.clientY;

    const sceneObject: THREE.Scene | undefined = (this.instance as Screen).scene?.scene;
    if (sceneObject && !this.controls.object) {
      sceneObject.attach(this.controls);
    }
  }

  private onPointerUp(event: MouseEvent) {
    this.onUpPosition.x = event.clientX;
    this.onUpPosition.y = event.clientY;

    if (this.controls.object) {
      const { uid } = this.controls.object.userData;
      const unit = this.egg.findUnit(uid);
      if (unit) {
        const p1 = this.controls.object.position;
        const p2 = unit.instance.properties.position || {};
        if (p1.x !== p2.x || p1.y !== p2.y || p1.z !== p2.z) {
          unit.instance.properties.position = { x: p1.x, y: p1.y, z: p1.z };
          if (this.cbChanged) {
            this.cbChanged(unit);
          }
        }
      }
    }
    if (this.onDownPosition.distanceTo(this.onUpPosition) === 0) this.controls.detach();
  }

  private onPointerMove(event: MouseEvent) {
    // const { dom } = this.instance as any;
    this.pointer.x = ((event.clientX - this.canvas.offsetLeft) / this.canvas.clientWidth) * 2 - 1;
    this.pointer.y = -((event.clientY - this.canvas.offsetTop) / this.canvas.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const sceneObject = (this.instance as Screen).scene;

    if (sceneObject) {
      const intersects = this.raycaster.intersectObjects(Object.values(sceneObject.children).map((e: any) => e.object), false);
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object !== this.controls.object) {
          this.controls.attach(object);
        }
      }
    }
  }

  setupObsever(cb: (unit?: Unit) => void) {
    this.cbChanged = cb;
  }

  afterLoad() {
    const sceneObject: THREE.Scene | undefined = (this.instance as Screen).scene?.scene;
    if (sceneObject) {
      sceneObject.add(this.controls);
      sceneObject.add(this.axesHelper);
    }
  }

  setCurrentScene(scene: SceneDecoration) {
    let sceneObject: THREE.Scene | undefined = (this.instance as Screen).scene?.scene;
    if (sceneObject) {
      sceneObject.remove(this.controls);
      sceneObject.remove(this.axesHelper);
    }
    (this.instance as Screen).enterScene(scene.uuid);
    sceneObject = (this.instance as Screen).scene?.scene;
    if (sceneObject) {
      sceneObject.add(this.controls);
      sceneObject.add(this.axesHelper);
    }
  }

  getScenes(): Array<SceneDecoration> {
    return Object.values(this.children).filter((e: any) => e.instance.isScene) as any;
  }
}
