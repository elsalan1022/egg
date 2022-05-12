import { h } from 'vue';
import { ElMessageBox } from 'element-plus';
import bezier from './bezier.vue';
import flexsvg from './flexsvg.vue';
import { t } from '../../i18n';
import enums from '../elements/enums.vue';

export default {
  install(Vue: any) {
    Vue.component(`FlexSvg`, flexsvg);
    Vue.component(`Bezier`, bezier);
    Vue.mixin({
      methods: {
        async $input(title: string, tip: string, values?: Array<string>) {
          if (!values) {
            return (await ElMessageBox.prompt(tip, title, {
              confirmButtonText: t('se.ok'),
              cancelButtonText: t('se.cancel'),
              inputPattern: /\w{1,30}/,
              inputErrorMessage: t('se.invaliValue'),
            })) as any;
          } else {
            let valueSel = values[0];
            const options = values.map(value => h('option', { value } as any, [value]));
            const select = h('select', {
              class: 'x-select',
              onchange(value: any) {
                valueSel = values[value.target.selectedIndex];
              },
            }, options);
            return await ElMessageBox({
              title,
              message: select,
              showCancelButton: true,
              confirmButtonText: t('se.ok'),
              cancelButtonText: t('se.cancel'),
            }).then(() => valueSel);
          }
        },
      },
    });
  },
};
