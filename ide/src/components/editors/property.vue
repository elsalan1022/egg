<template>
  <div style="align-items: center; display: flex; flex-direction: row">
    <label class="text-ellipsis prop-name">{{ $t(propName(item.name), item.name) }}</label>
    <p style="flex: 1 1 auto"></p>
    <component class="prop-value" :is="componentOf(item)" :prop="item"></component>
  </div>
</template>
<script lang='ts'>
import elements from '../elements/index';
export default {
  props: {
    item: {
      type: Object,
      default: {},
    },
    scoped: {
      type: String,
      default: '',
    },
  },
  computed: {
    name() {
      return this.item.name;
    },
  },
  methods: {
    propName(name) {
      if (this.scoped) {
        return `pr.${this.scoped}.${name}`;
      }
      return `pr.${name}`;
    },
    componentOf(item) {
      const { type } = item;
      return elements[type] || elements['string'];
    },
  },
};
</script>
<style scoped>
.prop-name {
  max-width: 40%;
}
.prop-value {
  max-width: 60%;
  margin-right: 12px;
}
</style>
