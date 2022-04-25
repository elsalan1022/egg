import fs from './fs';
import project from './project';
import speech from './speech';
import joystick from './joystick';
import rasp from './rasp';
import { env } from '../environment';

export const modules = {
  fs,
  joystick,
  project,
  speech,
};

if (env.options.rasp) {
  (modules as any).rasp = rasp;
}

export default modules;
