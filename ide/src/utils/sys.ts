const n = navigator as any;
export const isModile = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);
export const isTouchDevice = 'ontouchstart' in window || n.maxTouchPoints;

export default {
  randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
    const l = chars.length;
    return Array(length).fill(0)
      .map(() => chars[Math.floor(Math.random() * l)])
      .join('');
  },

  random(start: number, end: number) {
    return start + Math.floor(Math.random() * (end - start + 1));
  },

  randomChoice(obj: any[]): any {
    if (Array.isArray(obj)) {
      const i = Math.floor(Math.random() * obj.length);
      return obj[i];
    } else {
      const list = Object.keys(obj);
      const key = Math.floor(Math.random() * list.length);
      return obj[key];
    }
  },

  toCamelString(s: string) {
    return s.replace(/[-_](\w)/g, (all, letter) => letter.toUpperCase()).replace(/^\w/, (all) => all.toLowerCase());
  },

  /**
   * 获取系统语言设置
   */
  getSystemLang() {
    return navigator.language;
  },

  isModile() {
    return isModile;
  }
};
