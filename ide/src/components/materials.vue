<template>
  <div class="paneContainer" style="display: flex; flex-direction: row">
    <div class="mainBoard" style="flex: 1 1 auto; align-items: stretch; display: flex; flex-direction: column" @drop="onMainBoardDrop">
      <div class="x-item body-item" v-for="item in items" :key="item.uuid" draggable="true" showTrash="true" @click="sel(item.uuid, item.type)" @dragstart="onItemDragStart(item.uuid, $event)" @dragend="onItemDragEnd(item.uuid, $event)">
        <div class="item-slot">
          <i :class="toIconClass(item.type)" />
        </div>
        <div class="cls-name text-ellipsis">{{ nameOf(item) }}</div>
        <div class="item-slot" :selected="selected === item.uuid" style="max-width: 8em; color: black; flex: 1 1 auto; justify-content: start; padding: 0 1em">
          <label class="prop-value text-ellipsis">{{ item.uuid }}</label>
        </div>
      </div>
    </div>
    <div class="clsBoard" style="display: flex; flex-direction: column; align-items: center">
      <i class="icon-drag" style="margin-bottom: 0.4em; color: gray; cursor: default; font-size: 2em" />
      <div v-for="item in types" :key="item.type" class="x-item cls-item" draggable="true" @dragstart="onTypeDragStart(item.type, $event)">
        <div class="item-slot">
          <i :class="toIconClass(item.type)" />
        </div>
        <div class="cls-name text-ellipsis">{{ $t(`ty.material.${item.label}`) }}</div>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import * as THREE from 'three';
import { decoration } from 'egg/src/browser/devs/screen/material';
import { project, setMat } from '../store/index';
import { fillDragMaterial, fillDragType, parseDragEvent } from '../actions/drag';
import icons from '../assets/font/iconfont.json';
export default {
  data() {
    return {
      items: [],
      selected: '',
    };
  },
  computed: {
    revision() {
      return this.$store.state.revision;
    },
    types() {
      return Object.keys(decoration.materialTypesSupported).map((e) => {
        const [, name] = /(?:Mesh)?(\w+)Material/.exec(e) || [];
        return {
          type: e,
          label: name.toLowerCase(),
        };
      });
    },
  },
  watch: {
    revision() {
      this.reset();
    },
  },
  methods: {
    toIconClass(name: string) {
      const [, shortName] = /(?:Mesh)?(\w+)Material/.exec(name) || [];
      return icons.glyphs.find((e) => e.font_class === shortName) ? `icon-${shortName}` : 'icon-material';
    },
    nameOf(item: any) {
      return item.name || this.$t(`ty.material.${item.label}`);
    },
    async onTypeDragStart(clsname: string, ev: DragEvent) {
      fillDragType(ev, clsname, 'materials');
    },
    async onItemDragStart(uuid: string, ev: DragEvent) {
      fillDragMaterial(ev, uuid);
    },
    async onItemDragEnd(uuid: string, ev: DragEvent) {
      if (ev.dataTransfer?.getData('selfRemove')) {
        project.screen.removeMaterial(uuid);
        this.$makeDirty();
      }
    },
    async onMainBoardDrop(ev: DragEvent) {
      const data = parseDragEvent(ev);
      if (data.type === 'type') {
        const mat = new THREE[data.name]();
        project.screen.addMaterial(mat);
        this.selected = mat.uuid;
        this.$makeDirty();
        setMat({
          uuid: mat.uuid,
        });
      }
    },
    reset() {
      this.items = Object.values(project.screen.getMaterials()).map((e) => ({
        type: e.type,
        uuid: e.uuid,
        name: e.name,
        label: /(?:Mesh)?(\w+)Material/.exec(e.type)[1].toLowerCase(),
      }));
    },
    sel(uuid: string) {
      setMat({
        uuid: uuid,
      });
      this.selected = uuid;
    },
  },
};
</script>
<style scoped>
.paneContainer {
  margin: -15px;
}
.mainBoard {
  border-right: 1px solid #f2f2f2;
  padding: 1.4em 1em;
}
.clsBoard {
  padding: 1em;
}
.x-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 16px;
  position: relative;
  height: 32px;
  box-sizing: content-box;
  margin: 4px 0;
  padding: 0 1px;
  font-size: 14px;
}
.body-item {
  border: rgb(56, 148, 56);
  background: rgb(89, 192, 89);
  color: white;
}
.cls-item {
  border: 1px solid rgb(219, 110, 0);
  background: rgb(255, 140, 26);
  color: white;
}
.body-item i,
.cls-item i {
  color: black;
}
.item-slot {
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
.item-slot[selected='true'] {
  background: greenyellow;
}
.prop-type {
  color: #888;
}
.item-name {
  color: #fff;
  margin: 0 1em;
  pointer-events: none;
  padding: 0 0.5em;
}
.item-value {
  color: #888;
  direction: rtl;
}
.cls-name {
  color: #fff;
  margin: 0 0.25em;
  pointer-events: none;
  min-width: 4em;
  max-width: 4em;
}
</style>

