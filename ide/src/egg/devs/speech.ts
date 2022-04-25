/* eslint-disable @typescript-eslint/no-var-requires */
import "@tensorflow/tfjs";
import * as speech from "../../speech-commands/index";
import { SpeechCommandRecognizer } from '@tensorflow-models/speech-commands';
import { BlockConstructor, Egg, runtime, Unit, } from "egg";
import { gclsids } from "egg/src/clsids";
import { ActionBase } from "egg/src/unit";
import { makeEvent } from "egg/src/utils";
import { DevRuntime, DevUnit } from "egg/src/devs/base";

class Runtime extends DevRuntime {
  static type: UnitType = 'speech';
  static clsname: ClsName = 'speech';
  static clsid = gclsids.speech;

  model?: SpeechCommandRecognizer;

  async start(): Promise<void> {
    if (this.model) {
      throw 'already started';
    }
    const model = await speech.create('BROWSER_FFT') as SpeechCommandRecognizer;
    this.model = model;
    await model.listen(async (result) => {
      console.log(result);
      let maxScore = 0;
      let maxIndex = -1;
      result.scores.forEach((score: any, index) => {
        if (score > 0.8 && score > maxScore) {
          maxScore = score;
          maxIndex = index;
        }
      });
      if (maxIndex >= 0) {
        const words = model.wordLabels();
        const word = words[maxIndex];
        this.emit('say', { word, score: maxScore });
      }
    }, {
      includeSpectrogram: true,
      probabilityThreshold: 0.75
    });
  }
  async stop(): Promise<void> {
    if (!this.model) {
      throw 'not started';
    }
    await this.model.stopListening();
    this.model = null as any;
  }
}

export class Decoration extends DevUnit {
  static runtime = Runtime;
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance);
    // actions
    const actions: Record<string, BlockConstructor> = {
      start: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'start');
        }
      },
      stop: class extends ActionBase {
        constructor(callee: Unit) {
          super(callee, 'stop');
        }
      },
    };
    for (const iterator of Object.entries(actions)) {
      const [key, value] = iterator;
      this.actions[key] = value;
    }
    delete this.actions['clone'];
    delete this.actions.get;
    delete this.actions.set;
    // events
    const events = {
      say: makeEvent({
        name: 'say',
        params: {
          word: {
            type: 'string',
            name: 'word',
          },
        }
      }),
    };
    Object.entries(events).forEach(([key, value]) => {
      this.events[key] = value;
    });
  }
}
