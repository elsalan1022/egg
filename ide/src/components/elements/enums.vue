<template>
  <el-select v-model="value" :placeholder="'请选择'" size="mini" clearable>
    <el-option v-for="(item, i) in prop.values" :key="i" :value="item.hasOwnProperty('value') ? item.value : item" :label="item.label || item.value || item">
      <div style="align-items: center; display: flex; flex-direction: row">
        <span>{{ item.hasOwnProperty('value') ? item.label || item.value : item }}</span>
      </div>
    </el-option>
  </el-select>
</template>
<script lang='ts'>
export default {
  props: {
    prop: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      _value: undefined,
      _cate: '',
    };
  },
  computed: {
    value: {
      get() {
        const v = this.prop.value;
        const lv = this._value;
        if (v !== undefined) {
          return [v, lv][0];
        }
        return this.prop.default;
      },
      set(v) {
        this._value = v;
        if (this.prop.value !== v) {
          this.prop.value = v;
          this.$makeDirty();
        }
      },
    },
  },
};
</script>
<style scoped>
</style>
