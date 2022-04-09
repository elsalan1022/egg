<template>
  <Enums v-if="prop.values" :prop="prop" />
  <el-input v-else v-model="value" size="small" clearable> </el-input>
</template>
<script lang=ts>
import Enums from './enums.vue';
export default {
  components: {
    Enums,
  },
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
