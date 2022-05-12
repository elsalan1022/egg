import { createApp, openBlock, resolveComponent, createBlock } from 'vue';
import ElementPlus from 'element-plus';
import EpCn from 'element-plus/lib/locale/lang/zh-cn';
import EpEn from 'element-plus/lib/locale/lang/en';
import 'element-plus/dist/index.css';
import './styles/index.less';
import appLifeCircle from './app';
import router from './router';
import store from './store';
import i18n, { LOCALE } from './i18n';
import { useI18n } from 'vue-i18n';
import Fragments from './components/fragments';
import { setup } from './sigpipe';

declare global {
  interface Window {
    setImmediate: any;
    $: (selector: string, doc: Document) => void;
    __store: any;
    __vue: any;
  }
}

if (!window.setImmediate) {
  window.setImmediate = window.setTimeout;
}

if (!window.$) {
  window.$ = (selector: string, doc: Document) => doc.querySelector(selector);
}

const app = createApp({
  render: () => (openBlock(), createBlock(resolveComponent('router-view'))),
});

app.use(store)
  .use(router)
  .use(i18n)
  .use(ElementPlus, { locale: LOCALE === 'zh-CN' ? EpCn : EpEn })
  .mixin({
    computed: {
      $t: () => useI18n().t,
    },
  });

Fragments.install(app);
setup(app);

appLifeCircle.beforeLaunch(app, store, router);

const vue = app.mount('#app');

window.__vue = vue;

vue.$nextTick(() => {
  appLifeCircle.onLaunched(app, store, router);
});
