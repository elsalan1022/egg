<template>
  <div class="paneContainer" style="display: flex; flex-direction: row">
    <div class="mainBoard" style="flex: 1 1 auto; align-items: stretch; display: flex; flex-direction: column" @drop="onMainBoardDrop">
      <div class="x-item body-item" v-for="item in items" :key="item.name" draggable="true" showTrash="true" @click="selVar(item.name, item.type)" @dragstart="onVarDragStart(item.name, $event)" @dragend="onVarDragEnd(item.name, $event)">
        <div class="item-slot">
          <i :class="toIconClass(item.type)" />
        </div>
        <div class="cls-name text-ellipsis">{{ item.name }}</div>
        <div class="item-slot" :selected="selected === item.name" style="max-width: 8em; color: black; flex: 1 1 auto; justify-content: start; padding: 0 1em">
          <label class="prop-value text-ellipsis">{{ item.value }}</label>
        </div>
      </div>
    </div>
    <div class="clsBoard" style="display: flex; flex-direction: column; align-items: center">
      <i class="icon-drag" style="margin-bottom: 0.4em; color: gray; cursor: default; font-size: 2em" />
      <div v-for="type in types" :key="type" class="x-item cls-item" draggable="true" @dragstart="onTypeDragStart(type, $event)">
        <div class="item-slot">
          <i :class="toIconClass(type)" />
        </div>
        <div class="cls-name text-ellipsis">{{ $t(`ty.data.${type}`, type) }}</div>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import { ElMessageBox } from 'element-plus';
import { Storage } from 'egg/src/devs/storage';
import { project, setVar } from '../store/index';
import { fillDragType, fillDragVar, parseDragEvent } from '../actions/drag';
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
      return ['boolean', 'number', 'time', 'string', 'color', 'vec2', 'vec3', 'json', 'octets', 'stream', 'texture', 'material', 'unit', 'unknown'];
    },
  },
  watch: {
    revision() {
      this.reset();
    },
  },
  methods: {
    toIconClass(name: string) {
      return icons.glyphs.find((e) => e.font_class === name) ? `icon-${name}` : 'icon-variable';
    },
    async onTypeDragStart(clsname: string, ev: DragEvent) {
      fillDragType(ev, clsname, 'vars');
    },
    async onVarDragStart(name: string, ev: DragEvent) {
      fillDragVar(ev, name);
    },
    async onVarDragEnd(name: string, ev: DragEvent) {
      if (ev.dataTransfer?.getData('selfRemove')) {
        const storage = project.devices.storage as Storage;
        storage.removeProperty(name);
        if (this.selected === name) {
          this.selected = '';
          setVar({
            scope: 'global',
            name: '',
            type: 'unknown',
          });
        }
        this.$makeDirty();
      }
    },
    async onMainBoardDrop(ev: DragEvent) {
      const data = parseDragEvent(ev);
      if (data.type === 'type') {
        const { action, value } = (await ElMessageBox.prompt(this.$t('se.inname'), this.$t('se.new'), {
          confirmButtonText: this.$t('se.ok'),
          cancelButtonText: this.$t('se.cancel'),
          inputPattern: /\w{1,30}/,
          inputErrorMessage: this.$t('se.invalidName'),
        })) as any;
        if (action === 'confirm' && value) {
          const storage = project.devices.storage as Storage;
          storage.addProperty(data.name as any, value, undefined);
          setVar({ scope: 'global', type: data.name as any, name: value, slot: null });
          this.$makeDirty();
        }
      }
    },
    reset() {
      const storage = project.devices.storage as Storage;
      this.items = Object.values(storage.properties);
    },
    selVar(name: string, type: any) {
      setVar({
        scope: 'global',
        type,
        name,
      });
      this.selected = name;
    },
  },
  mounted() {
    this.selSceneId = project.screen.scene?.uuid;
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
