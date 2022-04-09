import { Project } from '../src/project';

async function main() {
  const project = await new Project().init([]);
  const { timer, storage } = project.devices;
  const { math } = project.builtins;

  const divBlock = math.createAction('div');

  const chainStart = project.createChain(divBlock);
  timer.bindEvent('change', chainStart);

  const getTime = timer.createAction('time');

  divBlock.slots.a.block = getTime;
  if (divBlock.slots.b.data) {
    divBlock.slots.b.data.value = 100000;
  }

  const setValue = storage.createAction('set');
  if (setValue.slots.name.data) {
    setValue.slots.name.data.value = 'name';
  }
  setValue.slots.value.block = divBlock;

  const chainSet = project.createChain(setValue);

  timer.bindEvent('change', chainSet);

  const cfg = project.serialize();

  project.unserialize(cfg);

  const app = project.build();
  app.run({});

  console.log("Timer example", project);
}

main();


