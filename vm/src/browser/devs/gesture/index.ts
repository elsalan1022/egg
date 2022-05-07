import '@tensorflow/tfjs-backend-webgl';
import * as handpose from './handpose';
import { HandPose } from './handpose';
import GestureEstimator, { WellKnownGesture } from './GestureEstimator';
import * as Gestures from './gestures/index';
import { ActionBase } from '../../../unit';
import { BlockConstructor, Egg, NativeData, Property, runtime, Unit } from 'egg';
import { makeEvent, makeProperty, } from '../../../utils';
import { DevRuntime, DevUnit } from '../../../devs/base';
import { gclsids } from '../../../clsids';
import { ChickRuntime } from '../../../project';

type GestureName = 'thumbs-up' | 'victory' | 'five' | 'fist' | 'none';

// configure gesture estimator
// add "✌🏻" and "👍" as sample gestures
const knownGestures: WellKnownGesture = {
  // symbol: '👍',
  'thumbs-up': Gestures.ThumbsUpGesture,
  // symbol: '✌🏻',
  victory: Gestures.VictoryGesture,
  // symbol: '🖐',
  five: Gestures.FiveGesture,
  // symbol: '✊',
  fist: Gestures.FistGesture,
};

type GestureDetail = {
  score: number;
  position: {
    x: number;
    y: number;
  };
  name: GestureName;
};

class Runtime extends DevRuntime {
  static type: DeviceType = 'gesture';
  static clsname = 'gesture';
  static clsid = gclsids.gesture;
  element: HTMLVideoElement = null as any;
  model?: HandPose;
  estimator?: GestureEstimator;
  previous: string;
  private ma: [GestureDetail, GestureDetail] = [{ score: 0, position: { x: 0, y: 0, }, name: 'none' }, { score: 0, position: { x: 0, y: 0, }, name: 'none' }];
  constructor(uuid?: UUID, parent?: runtime.Unit) {
    super(uuid, parent);
    this.previous = '';
  }
  async open(): Promise<void> {
    if (this.element) {
      throw 'already started';
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
      this.model = await handpose.load();
      this.estimator = new GestureEstimator(knownGestures);
    }
  }
  async close(): Promise<void> {
    if (!this.element) {
      throw 'not started';
    }
    this.element = null as any;
  }
  async detect(): Promise<string> {
    if (!this.model || !this.estimator) {
      throw 'not started';
    }
    if (this.element.readyState !== this.element.HAVE_ENOUGH_DATA) {
      return '';
    }
    // get hand landmarks from video
    // Note: Handpose currently only detects one hand at a time
    // Therefore the maximum number of predictions is 1
    const predictions = await this.model.estimateHands(this.element, true);

    const rs: GestureDetail = { score: -1, name: 'none', position: { x: 0, y: 0 } };
    for (let i = 0; i < predictions.length; i++) {
      const pt = { x: 0, y: 0 };
      let ptCount = 0;

      // draw colored dots at each predicted joint position
      for (const part in predictions[i].annotations) {
        for (const point of predictions[i].annotations[part]) {
          pt.x += point[0];
          pt.y += point[1];
          ptCount++;
        }
      }
      if (ptCount) {
        pt.x = pt.x / ptCount;
        pt.y = pt.y / ptCount;
      }

      // now estimate gestures based on landmarks
      // using a minimum confidence of 7.5 (out of 10)
      const est = this.estimator.estimate(predictions[i].landmarks, 7.5);

      if (est.gestures.length > 0) {
        // find gesture with highest confidence
        const result = est.gestures.reduce((p, c) => {
          return (p.confidence > c.confidence) ? p : c;
        });
        if (result.confidence > rs.score) {
          rs.score = result.confidence;
          rs.name = result.name as any;
          rs.position = pt;
        }
      }
    }
    const [first, second] = this.ma;
    if (second.name !== rs.name) {
      if (first.name == rs.name) {
        this.ma[1] = rs;
      } else {
        this.ma[0] = rs;
      }
    } else {
      this.ma[0] = second;
      this.ma[1] = rs;
      if (second.name !== 'none') {
        this.previous = rs.name;
        await this.emit('gesture', { name: second.name, detail: second });
      }
    }
    return rs.name;
  }
  get({ name }: { name: string; }) {
    if (name === 'current') {
      return this.previous;
    }
    return super.get({ name });
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);

    const props: Record<string, Property> = {
      'current': makeProperty(instance, {
        name: 'current',
        type: 'string',
        readonly: true,
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
        output: NativeData = {
          type: 'string',
          name: '.',
          label: 'result',
          description: 'result-desc',
        };
        constructor(callee: Unit) {
          super(callee, 'detect');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
    delete this.actions['clone'];

    // events
    // ['swipe-left', 'swipe-right', 'reset', 'ok', 'standby'].
    this.events['gesture'] = makeEvent({
      name: 'gesture',
      params: {
        name: {
          type: 'string',
          name: 'name',
          values: ['thumbs-up', 'victory', 'five', 'fist'].map(e => ({ value: e, label: `gesture.${e}` })),
        },
      }
    });
  }
}
