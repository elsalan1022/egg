import * as THREE from 'three';

export type Axis = 'x' | 'y' | 'z';
export type AxisValue = number;
export type Toward = 1 | -1;

export type Notation = string;
export type NotationBase = 'L' | 'M' | 'R' | 'D' | 'E' | 'U' | 'B' | 'S' | 'F';
export type NotationExtra = '' | `'` | '2';

export enum Colors {
  White = '#FEFEFE',
  Red = '#891214',
  Green = '#199B4C',
  Yellow = '#FED52F',
  Blue = '#0D48AC',
  Orange = '#FF5525',
}

export type FaceName = 'up' | 'down' | 'front' | 'back' | 'left' | 'right';

export type CudeType = 'corner' | 'edge' | 'center';

export interface CubeInfo {
  type: CudeType;
  initPosition: THREE.Vector3;
}

export interface StickerInfo {
  color: Colors;
}
