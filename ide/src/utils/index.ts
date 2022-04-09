export { default as Sys } from './sys';
export { default as Path } from './path';
export { default as Theme } from './theme';
export { default as Time } from './time';
export { default as Sounds } from './sounds';

export const Utils = {
  getAbsoluteRect(element: Element) {
    const rt = element.getBoundingClientRect();
    return {
      left: rt.left + document.documentElement.scrollLeft,
      top: rt.top + document.documentElement.scrollTop,
      width: rt.width,
      height: rt.height,
    };
  },
};
