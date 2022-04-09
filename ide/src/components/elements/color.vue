<template>
  <el-color-picker v-model="value" show-alpha style="margin-right: 12px" />
</template>
<script lang=ts>
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
