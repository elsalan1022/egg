import { project } from '../store';
import devs from './devs';
import units from './units';
import effects from './effects';

export async function loadUsrUnits() {
  await project.init((units as any).concat(effects as any), devs);
}

export async function loadUsrLibs() {
  await loadUsrUnits();
}
