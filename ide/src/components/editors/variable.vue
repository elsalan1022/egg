<template>
  <div class="props" :maximized="maximized" style="display: flex; flex-direction: column">
    <div class="props-header" style="align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: flex-end">
      <i class="icon-variable" style="margin: 0 8px" @click="maximized = !maximized"></i>
      <label v-if="maximized" class="props-title" style="flex: 1 1 auto">{{ title }}</label>
      <i v-if="isNew && maximized" :disabled="!isReaqdy" class="icon-add" @click="addVar"></i>
      <i :class="maximized ? 'icon-minimize' : 'icon-maximize'" @click="maximized = !maximized" style="margin-right: 8px"></i>
    </div>
    <div class="props-body" v-if="maximized">
      <div style="display: flex; flex-direction: column">
        <div style="align-items: center; display: flex; flex-direction: row">
          <label class="text-ellipsis prop-name">{{ $t('nm.type') }}</label>
          <p style="flex: 1 1 auto"></p>
          <label class="text-ellipsis prop-value" style="max-width: 180px; margin-right: 12px; color: gray">{{ $t(`ty.data.${type}`, type) }}</label>
        </div>
        <div style="align-items: center; display: flex; flex-direction: row">
          <label class="text-ellipsis prop-name">{{ $t('nm.name') }}</label>
          <p style="flex: 1 1 auto"></p>
          <el-input :disabled="!isNew" class="prop-value" v-model="name" size="small" clearable style="max-width: 160px; margin-right: 12px"> </el-input>
        </div>
        <div style="align-items: center; display: flex; flex-direction: row">
          <label class="text-ellipsis prop-name">{{ $t('nm.value') }}</label>
          <p style="flex: 1 1 auto"></p>
          <component class="prop-value" :is="component" :prop="prop" style="max-width: 160px; margin-right: 12px"></component>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import { project, setVar, VarProp } from '../../store/index';
import elements from '../elements/index';
import { Storage } from 'egg/src/devs/storage';

export default {
  data() {
    return {
      maximized: false,
      isNew: true,
      type: '',
      name: '',
      prop: {
        value: '',
        values: undefined,
      },
      component: elements.string,
    };
  },
  computed: {
    var() {
      return this.$store.state.var;
    },
    types() {
      const keys = Object.keys(elements).map((e) => ({ label: `types.${e}`, value: e }));
      return this.isNew ? keys.filter((e) => e.value !== 'unknown') : keys;
    },
    title() {
      return this.isNew ? this.$t('at.var.new') : this.name;
    },
    isReaqdy() {
      return this.name && this.type;
    },
  },
  watch: {
    type() {
      this.resetType();
    },
    var() {
      this.resetVar();
    },
    'prop.value'(v: any) {
      if (!this.isNew) {
        this.updateVar(v);
      }
    },
  },
  methods: {
    resetVar() {
      let v = this.var as VarProp;
      this.isNew = v.scope === 'global' && !v.name;
      this.maximized = true;
      if (this.isNew) {
        this.type = v.type || 'unknown';
        this.name = '';
        this.prop.value = '';
        this.prop.values = undefined;
      } else if (v.scope === 'global') {
        const storage = project.devices.storage as Storage;
        const prop = storage.properties[v.name];
        this.type = prop.type;
        this.name = v.name;
        this.prop.value = prop.value;
        this.prop.values = prop.values;
      } else {
        const prop = v.slot.data;
        this.type = prop.type;
        this.name = v.name;
        this.prop.value = prop.value;
        this.prop.values = prop.values;
      }
      this.resetType();
      if (this.$el) {
        const input = this.$el.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    },
    resetType() {
      this.component = elements[this.type] || elements.string;
    },
    addVar() {
      const storage = project.devices.storage as Storage;
      storage.addProperty(this.type, this.name, this.prop.value);
      setVar({ scope: 'global', type: this.type, name: this.name, slot: null });
      this.$makeDirty();
    },
    updateVar(value: any) {
      let changed = false;
      let v = this.var as VarProp;
      if (v.scope === 'global') {
        const storage = project.devices.storage as Storage;
        const prop = storage.properties[v.name];
        if (prop.value != value) {
          prop.value = value;
          changed = true;
        }
      } else {
        const prop = v.slot.data;
        if (prop.value != value) {
          prop.value = value;
          changed = true;
        }
        for (const e of this.var.stack || []) {
          if (e.name === 'switch') {
            if (e.updateSlots()) {
              this.$makeDirty();
            }
            break;
          }
        }
      }
      if (changed) {
        this.$makeDirty();
      }
    },
  },
  created() {
    this.resetVar();
  },
};
</script>
<style scoped>
.props {
  width: 320px;
  padding: 6px;
  overflow: hidden;
}
.props[maximized='false'] {
  align-self: flex-end;
  width: unset;
}
.props i {
  cursor: pointer;
}
.props-header {
  min-height: 26px;
  background: hsla(215, 100%, 95%, 1);
  margin: -6px;
  padding: 4px 0px;
}
.props-title {
  text-align: left;
  align-content: center;
  margin-left: 8px;
}
.props-body {
  padding-top: 10px;
}
.prop-name {
  max-width: 40%;
}
.prop-value {
  margin-right: 12px;
}
.icon-add {
  margin-right: 1em;
  color: coral;
}
</style>
