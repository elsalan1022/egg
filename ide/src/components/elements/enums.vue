<template>
  <el-select v-model="value" :placeholder="'请选择'" size="mini" clearable>
    <el-option v-for="(item, i) in prop.values" :key="i" :value="item.hasOwnProperty('value') ? item.value : item" :label="nameOf(item)">
      <div style="align-items: center; display: flex; flex-direction: row">
        <span>{{ nameOf(item) }}</span>
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
  methods: {
    nameOf(item) {
      if (item.hasOwnProperty('label')) {
        return this.$t(`vs.${item.label}`, item.label);
      } else {
        return item;
      }
    },
  },
};
</script>
<style scoped>
</style>
