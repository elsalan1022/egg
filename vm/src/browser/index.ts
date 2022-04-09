import { Egg, UnitConstructor } from 'egg';
import { Project, ChickRuntime } from '../project';
import { Screen, Decoration as ScreenEditor } from './devs/screen/screen';
import devices from './devs';
import units from './units';

class RuntimeBrowser extends ChickRuntime {
  async run(params: Record<string, any>): Promise<void> {
    const screen = this.devices.screen as Screen;
    screen.reset();
    await super.run(params);
  }
}

export class ProjectBrowser extends Project {
  readonly screen: Screen = null as any;
  readonly screenEditor: ScreenEditor = null as any;
  static runtime = RuntimeBrowser;
  constructor() {
    super(RuntimeBrowser);
  }
  async init(classes: Array<UnitConstructor>, additionalDevices?: Array<UnitConstructor>, additionalBuiltins?: Array<UnitConstructor>): Promise<Egg> {
    await super.init(units.concat(classes as any) as any, devices.concat(additionalDevices as any || []), additionalBuiltins);
    (this as any).screenEditor = this.devices['screen'] as ScreenEditor;
    (this as any).screen = this.screenEditor.instance as Screen;
    return this;
  }
}
