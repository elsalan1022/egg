import { project } from '../store';
import devs from './devs';
import units from './units';
import effects from './effects';

export async function loadUsrUnits() {
  await project.init(units.concat(effects as any), devs);
}

export async function loadUsrLibs() {
  await loadUsrUnits();
}
