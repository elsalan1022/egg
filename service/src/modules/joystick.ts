import { spawn } from 'child_process';
import { broadcastMessage } from '../rpc';

const names = {
  init: [],
  axis: ['joy-x', 'joy-y', 'back-2', 'joy-x-2', 'joy-y-2', 'forward-2', 'axis-x', 'axis-y'],
  button: ['a', 'b', 'x', 'y', 'back', 'forward', 'select', 'start', 'mode'],
};

async function jsmon() {
  const ps = spawn('cat', ['/dev/input/js0']);
  ps.stdout.on('data', (data) => {
    const tv = data[6];
    const type = tv & 0x80 ? 'init' : (tv & 0x01 ? 'button' : 'axis');
    const index = data[7];
    const name = names[type][index];
    const event = {
      type,
      time: data.readUInt32LE(0),
      value: data.readInt16LE(4),
      index,
      name,
    };
    broadcastMessage('joystick', event);
  });
}

export default function (expr: any) {
  jsmon();
  return {} as any;
}
