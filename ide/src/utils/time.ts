/* eslint-disable no-restricted-syntax */
export default {
  format(date: Date, fmt: string) {
    const o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'h+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds(), // 毫秒
    } as any;
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (`${date.getFullYear()}`).substr(4 - RegExp.$1.length));
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)));
      }
    }
    return fmt;
  },
  fmtDiff(diff: number) {
    const secs = diff / 1000;
    const mins = secs / 60;
    const hours = mins / 60;
    const days = hours / 24;
    return `${days ? `${days}-` : ''}${this.format(new Date(diff), 'MM-dd hh:mm:ss')}`;
  },
};