import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';
import { PoseNet } from '@tensorflow-models/posenet';
import { Vector2D } from '@tensorflow-models/posenet/dist/types';
import { ActionBase, } from '../../unit';
import { BlockConstructor, Egg, Property, runtime, Unit } from 'egg';
import { makeEvent, makeProperty, } from '../../utils';
import { DevRuntime, DevUnit } from '../../devs/base';
import { gclsids } from '../../clsids';
import { ChickRuntime } from '../../project';

const defaultPoseNetArchitecture = 'MobileNetV1';
const defaultQuantBytes = 2;
const defaultMultiplier = 0.5;
const defaultStride = 16;
const defaultInputResolution = 200;

export type PoseVex = Record<string, Vector2D>;

export class Runtime extends DevRuntime {
  static type: UnitType = 'pose';
  static clsname: ClsName = 'pose';
  static clsid = gclsids.pose;

  element: HTMLVideoElement = null as any;
  model?: PoseNet;
  private ma: Record<string, [Vector2D, Vector2D]> = {};
  async open(): Promise<void> {
    if (this.element) {
      throw 'already opened';
    }
    const chick = this.parent as ChickRuntime;
    if (!chick) {
      throw 'invalid chick instance';
    }
    const { camera } = chick.devices;
    if (!camera) {
      throw 'camer not found';
    }
    const { element } = camera.properties;
    this.element = element;
    if (!this.model) {
      this.model = await posenet.load({
        architecture: defaultPoseNetArchitecture,
        outputStride: defaultStride,
        inputResolution: defaultInputResolution,
        multiplier: defaultMultiplier,
        quantBytes: defaultQuantBytes
      });
    }
  }
  async close(): Promise<void> {
    if (!this.element) {
      throw 'not started';
    }
    this.element = null as any;
  }
  async detect(): Promise<void> {
    if (!this.model || !this.element) {
      return;
    }
    if (this.element.readyState !== this.element.HAVE_ENOUGH_DATA) {
      return;
    }
    const pose = await this.model.estimateSinglePose(this.element, {
      flipHorizontal: true,
    });
    if (pose && this.element) {
      const { width, height } = this.element;
      const confidence = this.get({ name: 'confidence' }) || 0.5;
      const parts: PoseVex = {};
      pose.keypoints.forEach(({ part, position, score }) => {
        if (score >= confidence) {
          const mav = this.ma[part] || (this.ma[part] = [{ x: position.x, y: position.y }, { x: position.x, y: position.y }]);
          const [first, second] = mav;
          const mid = {
            x: first.x + (second.x - first.x) * 0.5,
            y: first.y + (second.y - first.y) * 0.5,
          };
          const fin = {
            x: mid.x + (position.x - mid.x) * 0.5,
            y: mid.y + (position.y - mid.y) * 0.5,
          };
          mav[0] = second;
          mav[1] = fin;
          parts[part] = {
            x: fin.x / width,
            y: fin.y / height,
          };
        }
      });
      await this.emit('pose', { detail: parts });
    }
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);

    // properties
    const props: Record<string, Property> = {
      confidence: makeProperty(instance, {
        name: 'confidence',
        type: 'number',
        min: 0.1,
        max: 1,
        step: 0.1,
      }),
    };
    for (const iterator of Object.entries(props)) {
      const [key, value] = iterator;
      this.properties[key] = value;
    }

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
      detect: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'detect');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }

    // events
    this.events.pose = makeEvent({
      name: 'pose',
      params: {
        detail: {
          type: 'json',
          name: 'detail',
        },
      }
    });
  }
}
