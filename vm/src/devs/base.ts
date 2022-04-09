import { Egg, runtime, } from "egg";
import { UnitImpl, UnitRuntime, } from "../unit";

export abstract class DevUnit extends UnitImpl {
  constructor(egg: Egg, instance: runtime.Unit) {
    super(egg, instance, egg);
    delete this.actions['clone'];
    delete this.actions['die'];
    delete this.events['clone'];
  }
}

export abstract class DevRuntime extends UnitRuntime {
  clone(): Promise<runtime.Unit> {
    throw new Error("Not allowed.");
  }
}
