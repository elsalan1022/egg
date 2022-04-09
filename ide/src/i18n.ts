import { createI18n } from 'vue-i18n';
import { Sys } from './utils/index';
import locales from './locales/index';

export const LOCALE = localStorage.getItem('locale') || Object.keys(locales).find(e => e === Sys.getSystemLang()) || 'zh-CN';

const i18n = createI18n({
  locale: LOCALE,
  fallbackLocale: LOCALE,
  messages: locales,
});

export function setLang(lang: string) {
  if (!Object.keys(locales).includes(lang)) {
    return false;
  }
  const locale = localStorage.getItem('locale');
  if (locale === lang) {
    return false;
  }
  i18n.global.locale = lang;
  localStorage.setItem('locale', lang);
  return true;
}

export default i18n;

function toCamelString(s: string) {
  return s.replace(/[-_](\w)/g, (all, letter) => letter.toUpperCase()).replace(/^\w/, (all) => all.toLowerCase());
}

export function t(key: string, optional?: string): string {
  if (!key || typeof key !== 'string') {
    return key ?? '';
  }
  const s = i18n.global.t(toCamelString(key));
  if (s.indexOf('.') !== -1 && optional) {
    return t(optional as any);
  }
  return s;
}
