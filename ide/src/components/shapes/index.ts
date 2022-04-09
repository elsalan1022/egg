/* eslint-disable max-len */
import SVG from 'svg.js';

const leftTop = 'm 0,4 A 4,4 0 0,1 4,0';
const leftTopInside = 'a 4,4 0 0 0 -4,4';
const rightTop = 'a 4,4 0 0,1 4,4';
const rightBottom = 'a 4,4 0 0,1 -4,4';
const leftBottom = 'a 4,4 0 0,1 -4,-4 z';
const leftBottomInside = 'a 4,4 0 0,0 4,4';
const downArrow = 'c -2,0 -3,1 -4,2 l -4,4 c -1,1 -2,2 -4,2 h -12 c -2,0 -3,-1 -4,-2 l -4,-4 c -1,-1 -2,-2 -4,-2';
const upArrow = 'c 2,0 3,1 4,2 l 4,4 c 1,1 2,2 4,2 h 12 c 2,0 3,-1 4,-2 l 4,-4 c 1,-1 2,-2 4,-2';
export const minBlockWidth = 120;
export const minBlockHeight = 40;
export const minSlotWidth = 60;
export const minSlotHeight = 30;
export const arrowHeight = 7;
export const leftSideWidth = 20;

export default {
  chainStart(canvas: SVG.Doc, width: number, height?: number): SVG.Path {
    height = Math.max(height || 0, 12);
    width = width <= minBlockWidth ? minBlockWidth : width;
    return canvas.path([
      leftTop,
      `H ${width - 4}`,
      rightTop,
      `v ${height - 8}`,
      rightBottom,
      'H 48',
      downArrow,
      'H 4',
      leftBottom,
    ].join(' '));
  },
  block(canvas: SVG.Doc, width: number, heights?: Array<number>, ending?: boolean): SVG.Path {
    width = width <= minBlockWidth ? minBlockWidth : width;
    if (!heights) {
      heights = [minBlockHeight];
    }
    const count = heights.length;
    if (count % 2 === 0) {
      throw new Error('sections must be even');
    }
    const paths: Array<string> = [
      leftTop,
      'H 12',
      upArrow,
      `H ${width - 4}`,
      rightTop,
    ];
    for (let i = 0; i < count; i++) {
      const h = Math.max(minBlockHeight, heights[i]);
      const isLast = i === count - 1;
      paths.push(`v ${h - 8}`);
      if (i % 2 === 0) {
        paths.push(rightBottom);
        if (isLast) {
          if (ending) {
            paths.push(
              'H 4',
              leftBottom
            );
          } else {
            paths.push(
              'H 48',
              downArrow,
              ' H 4',
              leftBottom,
            );
          }
        } else {
          paths.push(
            'H 68',
            downArrow,
            'H 24',
            leftTopInside,
          );
        }
      } else {
        paths.push(
          leftBottomInside,
          'H 32',
          upArrow,
          `H ${width - 4}`,
          rightTop,
        );
      }
    }
    return canvas.path(paths.join(' '));
  },
  dataSlot(canvas: SVG.Doc, width: number, height: number): SVG.Path {
    height = height <= minSlotHeight ? minSlotHeight : height;
    width = Math.max(width, minSlotWidth, height);
    const radius = height / 2;
    return canvas.path([
      `m 0,${radius} A ${radius},${radius} 0 0 1 ${radius},0 H ${width - radius} a ${radius},${radius} 0 0 1 ${radius},${radius}`,
      `a ${radius},${radius} 0 0 1 -${radius},${radius} H ${radius} a ${radius},${radius} 0 0 1 -${radius},-${radius}`,
      'z'].join(' '));
  },
  link(canvas: SVG.Doc, from: SVG.G, to: SVG.G): SVG.Path {
    const { x: cx, y: cy } = canvas.rbox();
    const { x: fx, y: fy, w, h } = from.rbox();
    const { x: tx, y: ty, } = to.rbox();
    const startX = (fx - cx) + w / 2;
    const startY = (fy - cy) + h;
    const endX = (tx - cx) + 32;
    const endY = (ty - cy);
    const dy = (endY - startY) * 0.614;
    // const dx = (endX - startX) * 0.614;
    return canvas.path(`M ${startX},${startY} C ${startX},${startY + dy} ${endX},${endY - dy} ${endX},${endY}`);
  }
}
