import FingerPoseEstimator, { EstimatorOptions } from './FingerPoseEstimator';
import { Finger, FingerCurl, FingerDirection } from './FingerDescription';
import GestureDescription from './GestureDescription';

export type WellKnownGesture = Record<string, GestureDescription>;

export default class GestureEstimator {
  estimator: FingerPoseEstimator;
  gestures: WellKnownGesture;

  constructor(knownGestures: WellKnownGesture, estimatorOptions = {}) {

    this.estimator = new FingerPoseEstimator(estimatorOptions as unknown as EstimatorOptions);

    // list of predefined gestures
    this.gestures = knownGestures;
  }

  estimate(landmarks: { [x: string]: any; }, minConfidence: number) {

    const gesturesFound = [];

    // step 1: get estimations of curl / direction for each finger
    const est = this.estimator.estimate(landmarks);

    const debugInfo = [];
    for (const fingerIdx of Finger.all) {
      debugInfo.push([
        Finger.getName(fingerIdx),
        FingerCurl.getName(est.curls[fingerIdx]),
        FingerDirection.getName(est.directions[fingerIdx])
      ]);
    }

    // step 2: compare gesture description to each known gesture
    for (const [name, descriptor] of Object.entries(this.gestures)) {
      const confidence = descriptor.matchAgainst(est.curls as any, est.directions as any);
      if (confidence >= minConfidence) {
        gesturesFound.push({
          name,
          confidence: confidence
        });
      }
    }

    return {
      poseData: debugInfo,
      gestures: gesturesFound
    };
  }
}
