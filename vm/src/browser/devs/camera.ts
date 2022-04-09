import { BlockConstructor, Egg, Property, runtime, Unit, } from "egg";
import * as THREE from "three";
import { gclsids } from "../../clsids";
import { DevRuntime, DevUnit } from "../../devs/base";
import { ActionBase } from "../../unit";
import { makeEvent, makeProperty, } from "../../utils";

const vertexShader = `
  varying vec2 vUv;
  void main( void ) {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }`;

const fragmentShader = `
  uniform vec3 keyColor;
  uniform float similarity;
  uniform float smoothness;
  varying vec2 vUv;
  uniform sampler2D map;
  void main() {
      vec4 videoColor = texture2D(map, vUv);

      float Y1 = 0.299 * keyColor.r + 0.587 * keyColor.g + 0.114 * keyColor.b;
      float Cr1 = keyColor.r - Y1;
      float Cb1 = keyColor.b - Y1;

      float Y2 = 0.299 * videoColor.r + 0.587 * videoColor.g + 0.114 * videoColor.b;
      float Cr2 = videoColor.r - Y2;
      float Cb2 = videoColor.b - Y2;

      float blend = smoothstep(similarity, similarity + smoothness, distance(vec2(Cr2, Cb2), vec2(Cr1, Cb1)));
      gl_FragColor = vec4(videoColor.rgb, videoColor.a * blend);
  }`;

type CameraCxt = {
  webcamCanvas: HTMLCanvasElement;
  webcam: HTMLVideoElement;
  canvasCtx: CanvasRenderingContext2D;
  webcamTexture: THREE.Texture;
  shaderMaterial: THREE.ShaderMaterial;
};

export class Runtime extends DevRuntime {
  static type: UnitType = 'camera';
  static clsname: ClsName = 'camera';
  static clsid = gclsids.camera;

  private camera?: CameraCxt;
  private fpsTick = 0;
  async open(): Promise<void> {
    if (this.camera) {
      throw new Error("Camera is already started.");
    }
    const cxt: CameraCxt = {} as any;
    const webcam = document.createElement('video');
    webcam.style.position = 'absolute';
    webcam.style.right = '0';
    webcam.style.bottom = '0';
    webcam.style.pointerEvents = 'none';
    webcam.style.transform = 'scaleX(-1)';
    webcam.width = 400;
    webcam.height = 320;
    document.body.appendChild(webcam);
    cxt.webcam = webcam;
    const constraints = { video: { width: 400, height: 320 } };
    navigator.mediaDevices.getUserMedia(constraints).then((mediaStream: MediaStream) => {
      webcam.srcObject = mediaStream;
      webcam.onloadedmetadata = () => {
        webcam.setAttribute('autoplay', 'true');
        webcam.setAttribute('playsinline', 'true');
        webcam.play();
      };
    }).catch(function (err) {
      alert(err.name + ': ' + err.message);
    });
    cxt.webcamCanvas = document.createElement('canvas');
    const canvasCtx = cxt.webcamCanvas.getContext('2d') as CanvasRenderingContext2D;
    cxt.canvasCtx = canvasCtx;
    canvasCtx.fillStyle = '#000000';
    canvasCtx.fillRect(0, 0, cxt.webcamCanvas.width, cxt.webcamCanvas.height);
    const webcamTexture = new THREE.Texture(cxt.webcamCanvas);
    cxt.webcamTexture = webcamTexture;
    webcamTexture.minFilter = THREE.LinearFilter;
    webcamTexture.magFilter = THREE.LinearFilter;
    cxt.shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        map: { value: webcamTexture },
        keyColor: { value: [0.0, 1.0, 0.0] },
        similarity: { value: 0.3 },
        smoothness: { value: 0.0 }
      },
      vertexShader,
      fragmentShader,
    });
    this.camera = cxt;
    requestAnimationFrame(this.animate.bind(this));
  }
  async close(): Promise<void> {
    if (!this.camera) {
      throw new Error("Camera is not started.");
    }
    this.camera.webcam.pause();
    this.camera.webcam.srcObject = null;
    this.camera = undefined;
  }
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
  get({ name }: { name: string; }) {
    if (name === 'frame') {
      return this.camera?.shaderMaterial;
    } else if (name === 'element') {
      return this.camera?.webcam;
    }
    const v = super.get({ name });
    if (v !== undefined) {
      return v;
    } if (name === 'fps') {
      return 30;
    }
  }
  /**
   * This should be called in renderer's animate method
   */
  private animate(time: number) {
    if (!this.camera) {
      return;
    } else if (!(this.parent as any).isRunning()) {
      return this.close();
    }
    const fps = this.get({ name: 'fps' });
    const spf = 1000 / fps;
    if (spf > time - this.fpsTick) {
      requestAnimationFrame(this.animate.bind(this));
      return;
    }
    this.fpsTick = time;
    // const camera = this.camera;
    // camera.canvasCtx.drawImage(camera.webcam, 0, 0, camera.webcamCanvas.width, camera.webcamCanvas.height);
    // camera.webcamTexture.needsUpdate = true;
    this.emit('frame', {}).finally(() => {
      requestAnimationFrame(this.animate.bind(this));
    });
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    // actions
    const actions: Record<string, BlockConstructor> = {
      open: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'open');
        }
      },
      close: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'close');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }

    // events
    const events = {
      frame: makeEvent({
        name: 'frame',
        params: {
          image: {
            type: 'material',
            name: 'image',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });

    // properties
    const props: Record<string, Property> = {
      fps: makeProperty(instance, {
        name: 'fps',
        type: 'number',
        min: 10,
        max: 60,
      }),
      frame: makeProperty(instance, {
        name: 'frame',
        type: 'material',
        readonly: true,
      }),
      element: makeProperty(instance, {
        name: 'element',
        type: 'unknown',
        readonly: true,
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }
  }
}

