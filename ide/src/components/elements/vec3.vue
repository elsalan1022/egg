<template>
  <div style="align-items: center; display: flex; flex-direction: row; justify-content: flex-end">
    <el-input class="v-item" v-model="value.x" size="small" placeholder="x"> </el-input>
    <el-input class="v-item" v-model="value.y" size="small" placeholder="y"> </el-input>
    <el-input class="v-item" v-model="value.z" size="small" placeholder="z"> </el-input>
  </div>
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
      value: {
        x: undefined,
        y: undefined,
        z: undefined,
      },
    };
  },
  watch: {
    prop: {
      handler() {
        this.reset();
      },
      deep: true,
    },
    'value.x'(v) {
      if (isNaN(parseFloat(v))) {
        return;
      }
      this.updateVar();
    },
    'value.y'(v) {
      if (isNaN(parseFloat(v))) {
        return;
      }
      this.updateVar();
    },
    'value.z'(v) {
      if (isNaN(parseFloat(v))) {
        return;
      }
      this.updateVar();
    },
  },
  methods: {
    reset() {
      this.value = {
        x: this.prop.value?.x,
        y: this.prop.value?.y,
        z: this.prop.value?.z,
      };
    },
    updateVar() {
      const newValue = {
        x: this.value.x ? parseFloat(this.value.x) : 0,
        y: this.value.y ? parseFloat(this.value.y) : 0,
        z: this.value.z ? parseFloat(this.value.z) : 0,
      };
      if (JSON.stringify(this.prop.value) !== JSON.stringify(newValue)) {
        this.prop.value = newValue;
        this.$makeDirty();
      }
    },
  },
  mounted() {
    this.reset();
  },
};
</script>
<style scoped>
.v-item {
  margin: 0 4px;
}
</style>
