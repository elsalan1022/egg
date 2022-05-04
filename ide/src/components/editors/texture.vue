<template>
  <div class="props" :maximized="maximized" style="display: flex; flex-direction: column">
    <div class="props-header" style="align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: flex-end">
      <i class="icon-brush" style="margin: 0 8px" @click="maximized = !maximized"></i>
      <label v-if="maximized" class="props-title text-ellipsis" style="flex: 1 1 auto">{{ title }}</label>
      <i :class="maximized ? 'icon-minimize' : 'icon-maximize'" @click="maximized = !maximized" style="margin-right: 8px"></i>
    </div>
    <div class="props-body" v-if="maximized">
      <div style="display: flex; flex-direction: column">
        <div style="align-items: center; display: flex; flex-direction: row">
          <label class="text-ellipsis prop-name">{{ $t('nm.image') }}</label>
          <p style="flex: 1 1 auto"></p>
          <label class="text-ellipsis prop-value" style="max-width: 180px; margin-right: 12px; color: gray">{{ type }}</label>
        </div>
        <Property class="props-item" v-for="item in props" :key="item.name" :item="item" scoped="texture"></Property>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import * as THREE from 'three';
import { project, setTex, PropUUID } from '../../store/index';
import { decoration } from 'egg/src/browser/devs/screen/texture';
import { Property } from 'egg';
import VueProperty from './property.vue';

export default {
  components: {
    Property: VueProperty,
  },
  data() {
    return {
      maximized: false,
      type: '',
      props: {} as Record<string, Property>,
      images: [],
    };
  },
  computed: {
    tex() {
      return this.$store.state.tex;
    },
    title() {
      return this.tex?.uuid;
    },
  },
  watch: {
    tex() {
      this.reset();
    },
  },
  methods: {
    reset() {
      let v = this.tex as PropUUID;
      let texInfo = project.screen.getTextures()[v.uuid];
      this.images = project.screen.getImages().map((e) => e[0]);
      if (!texInfo) {
        this.maximized = false;
        this.props = {};
      } else {
        this.maximized = true;
        const tex = texInfo.value;
        this.type = texInfo.image;
        const props: Record<string, Property> = {};
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        for (const [k, doc] of Object.entries(decoration.allProps)) {
          props[k] = new Proxy(Object.assign({ name: k }, doc), {
            get(target, prop) {
              if (prop === 'value') {
                if (doc.type === 'color') {
                  return `#${tex[k].getHexString()}`;
                }
                return tex[k];
              }
              return target[prop];
            },
            set(target, prop, value) {
              if (prop === 'value') {
                if (doc.type === 'color') {
                  tex[k].set(new THREE.Color(value));
                }
                if (doc.type === 'vec2') {
                  tex[k] = new THREE.Vector2(value.x, value.y);
                } else {
                  tex[k] = value;
                }
                // tex.needsUpdate = true;
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
    async add() {
      const info = await project.screen.addTexture(this.type);
      this.$makeDirty();
      setTex({
        uuid: info.value.uuid,
      });
    },
  },
  created() {
    this.reset();
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
