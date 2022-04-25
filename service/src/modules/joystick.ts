import { spawn } from 'child_process';
import { broadcastMessage } from '../rpc';

const names = {
  init: [],
  axis: ['lx', 'ly', 'lb', 'rx', 'ry', 'rb', 'lb_x', 'lb_y'],
  button: ['a', 'b', 'x', 'y', 'lb', 'rb', 'select', 'start', 'mode'],
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
