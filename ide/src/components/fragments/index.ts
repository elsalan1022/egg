import bezier from './bezier.vue';
import flexsvg from './flexsvg.vue';

export default {
  install(Vue: any) {
    Vue.component(`FlexSvg`, flexsvg);
    Vue.component(`Bezier`, bezier);
  },
};
