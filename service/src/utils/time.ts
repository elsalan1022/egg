export default {
  isSameDay(one: Date, two: Date): boolean {
    const dayDiff = Math.abs((one.getTime() - two.getTime()) / 86400000);
    if (dayDiff >= 1) {
      return false;
    }
    return one.getDay() === two.getDay();
  },
  dayCount(begin: Date, end: Date): number {
    const dayDiff = (end.getTime() - begin.getTime()) / 86400000;
    if (Math.abs(dayDiff) >= 1) {
      return Math.floor(dayDiff);
    }
    return end.getDay() === begin.getDay() ? 0 : 1;
  },
};
