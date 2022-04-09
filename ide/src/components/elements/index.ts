import boolean from './boolean.vue';
import number from './number.vue';
import time from './time.vue';
import string from './string.vue';
import vec2 from './vec2.vue';
import vec3 from './vec3.vue';
import color from './color.vue';
import texture from './texture.vue';
import material from './material.vue';
import unit from './unit.vue';
import readonly from './readonly.vue';

// declare type DataType = 'boolean' | 'number' | 'time' | 'string' | 'color' | 'vec2' | 'vec3' | 'json' | 'octets' | 'stream' | 'texture' | 'material' | 'unit' | 'unknown';

export default {
  boolean,
  number,
  time,
  string,
  color,
  vec2,
  vec3,
  json: readonly,
  octets: readonly,
  stream: readonly,
  texture,
  material,
  unit,
  unknown: readonly,
};
