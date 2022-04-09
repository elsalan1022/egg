<template>
  <div class="props" :maximized="maximized" style="display: flex; flex-direction: column">
    <div class="props-header" style="align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: flex-end">
      <i class="icon-layer" style="margin: 0 8px" @click="maximized = !maximized"></i>
      <label v-if="maximized" class="props-title text-ellipsis" style="flex: 1 1 auto">{{ title }}</label>
      <i :class="maximized ? 'icon-minimize' : 'icon-maximize'" @click="maximized = !maximized" style="margin-right: 8px"></i>
    </div>
    <div class="props-body" v-if="maximized">
      <div style="display: flex; flex-direction: column">
        <div style="align-items: center; display: flex; flex-direction: row">
          <label class="text-ellipsis prop-name">{{ $t('nm.type') }}</label>
          <p style="flex: 1 1 auto"></p>
          <label class="text-ellipsis prop-value" style="max-width: 180px; margin-right: 12px; color: gray">{{ type }}</label>
        </div>
        <Property class="props-item" v-for="item in props" :key="item.name" :item="item" scoped="material"></Property>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import * as THREE from 'three';
import { project, setMat, MatProp } from '../../store/index';
import { decoration } from 'egg/src/browser/devs/screen/material';
import { Property } from 'egg';
import VueProperty from './property.vue';

export default {
  components: {
    Property: VueProperty,
  },
  data() {
    return {
      maximized: false,
      isNew: true,
      type: '',
      props: {} as Record<string, Property>,
    };
  },
  computed: {
    mat() {
      return this.$store.state.mat;
    },
    types() {
      return Object.keys(decoration.materialTypesSupported);
    },
    title() {
      return this.mat?.uuid;
    },
  },
  watch: {
    mat() {
      this.resetMat();
    },
  },
  methods: {
    resetMat() {
      let v = this.mat as MatProp;
      let mat = project.screen.getMaterialFromId(v.uuid);
      if (!mat) {
        this.props = {};
      } else {
        this.maximized = true;
        this.type = mat.type;
        const props: Record<string, Property> = {};
        const json = mat.toJSON();
        const keys = decoration.materialTypesSupported[this.type];
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        for (const k of keys) {
          const doc = decoration.allProps[k];
          if (!doc) continue;
          props[k] = new Proxy(Object.assign({ name: k }, doc), {
            get(target, prop) {
              if (prop === 'value') {
                if (doc.type === 'color') {
                  return `#${mat[k].getHexString()}`;
                } else if (doc.type === 'texture') {
                  const t = mat[k];
                  return t?.uuid;
                }
                return json[k];
              }
              return target[prop];
            },
            set(target, prop, value) {
              if (prop === 'value') {
                if (doc.type === 'color') {
                  mat[k].set(new THREE.Color(value));
                } else {
                  mat[k] = value;
                }
                mat.needsUpdate = true;
                json[k] = value;
                self.$makeDirty();
                return true;
              }
              target[prop] = value;
              return true;
            },
          });
        }
        this.props = props;
      }
    },
    addMat() {
      const mat = new THREE[this.type]();
      project.screen.addMaterial(mat);
      this.$makeDirty();
      setMat({
        uuid: mat.uuid,
      });
    },
  },
  created() {
    this.resetMat();
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
