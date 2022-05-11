<template>
  <Enums v-if="prop.values" :prop="prop" />
  <div v-else-if="prop.step !== undefined" style="display: flex; flex: 1 1 auto; flex-direction: row; align-items: center; margin-left: 12px">
    <el-input v-model="value" size="small" placeholder="scale"> </el-input>
    <el-slider v-model="value" :step="prop.step" :max="prop.max" :min="prop.min" style="margin-left: 12px"></el-slider>
  </div>
  <el-input-number v-else v-model="value" size="small" clearable :max="prop.max" :min="prop.min"> </el-input-number>
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
