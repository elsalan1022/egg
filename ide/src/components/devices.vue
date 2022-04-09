<template>
  <div style="align-items: stretch; display: flex; flex-direction: column">
    <div style="display: flex; flex-direction: column">
      <div class="prop-item" v-for="item in items" :key="item.id" @click="select(item)" style="align-items: center; display: flex; flex-direction: row">
        <div class="prop-slot">
          <i :class="toIconClass(item.name)" />
        </div>
        <label class="prop-name text-ellipsis" style="flex: 0 0 0%">{{ $t(`nm.${item.name}`, item.name) }}</label>
        <div class="prop-slot" :selected="selectedId === item.uuid" style="flex: 1 1 auto; justify-content: start; padding: 0 1em">
          <label class="prop-value text-ellipsis">{{ item.uuid }}</label>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import { Unit } from 'egg';
import icons from '../assets/font/iconfont.json';
export default {
  props: {
    items: {
      type: Array,
      default: [],
    },
  },
  computed: {
    selectedId() {
      return this.$store.state.selected.unit?.uuid;
    },
  },
  methods: {
    toIconClass(name: string) {
      return icons.glyphs.find((e) => e.font_class === name) ? `icon-${name}` : 'icon-chip';
    },
    select(item: Unit) {
      this.$store.state.selected.unit = item;
    },
  },
};
</script>
<style scoped>
.prop-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 16px;
  border: rgb(56, 148, 56);
  background: rgb(89, 192, 89);
  color: white;
  position: relative;
  height: 32px;
  box-sizing: content-box;
  margin: 4px 0;
  padding: 0 1px;
  font-size: 14px;
}
.prop-item i {
  color: black;
}
.prop-slot {
  min-width: 30px;
  height: 30px;
  padding: 0;
  background: white;
  border-radius: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.prop-slot[selected='true'] {
  background: greenyellow;
}
.prop-type {
  color: #888;
}
.prop-name {
  color: #fff;
  margin: 0 0.2em;
  pointer-events: none;
  min-width: 6em;
  padding: 0 0.5em;
}
.prop-value {
  color: #888;
  direction: rtl;
}
</style>
