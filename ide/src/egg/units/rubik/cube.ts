const faceColorTable: { [index: string]: string } = {
  'U': '#FEFEFE', // White
  'R': '#891214', // Red
  'F': '#199B4C', // Green
  'D': '#FED52F', // yellow
  'B': '#0D48AC', // Blue
  'L': '#FF5525', // Orange
};

interface Cubelet {
  x: number,
  y: number,
  z: number,
  num: number,
  type: string,
  color?: { [index: string]: string },
}

const clrsTable = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

export function generateCoords(): Cubelet[] {
  const lets: Cubelet[] = [];
  const colorNames = 'URFDLB'.split('');
  const faceColor: any = {};
  for (let i = 0; i < colorNames.length; i++) {
    const name = colorNames[i];
    const start = i * 9;
    const end = start + 9;
    faceColor[name] = clrsTable.slice(start, end);
  }
  let num = 0;
  for (let y = 1; y >= -1; y--) {
    for (let z = -1; z <= 1; z++) {
      for (let x = -1; x <= 1; x++) {
        const n = [x, y, z].filter(Boolean).length;
        let type = '';
        if (n === 3) type = 'corner'; // Corner block
        if (n === 2) type = 'edge'; // Edge block
        if (n === 1) type = 'center'; // Center block

        const cubeColor: { [index: string]: string } = {};

        // Up
        if (y === 1) {
          const i = num;
          cubeColor['U'] = faceColorTable[faceColor['U'][i]];
        }

        // Down
        if (y === -1) {
          const n = num - 18;
          const i = Math.floor((8 - n) / 3) * 3 + (3 - (8 - n) % 3) - 1;
          cubeColor['D'] = faceColorTable[faceColor['D'][i]];
        }

        // Right
        if (x === 1) {
          const n = (num + 1) / 3 - 1;
          const i = Math.floor(n / 3) * 3 + (3 - n % 3) - 1;
          cubeColor['R'] = faceColorTable[faceColor['R'][i]];
        }

        // Left
        if (x === -1) {
          const i = num / 3;
          cubeColor['L'] = faceColorTable[faceColor['L'][i]];
        }

        // Front
        if (z === 1) {
          const i = Math.floor((num - 6) / 7) + ((num - 6) % 7);
          cubeColor['F'] = faceColorTable[faceColor['F'][i]];
        }

        // Back
        if (z === -1) {
          const n = Math.floor(num / 7) + (num % 7);
          const i = Math.floor(n / 3) * 3 + (3 - n % 3) - 1;
          cubeColor['B'] = faceColorTable[faceColor['B'][i]];
        }

        lets.push({ x, y, z, num, type, color: cubeColor });
        num++;
      }
    }
  }
  return lets;
}
