<template>
  <div class="paneContainer" style="display: flex; flex-direction: row">
    <div class="mainBoard" style="flex: 1 1 auto; align-items: stretch; display: flex; flex-direction: column" @drop="onMainBoardDrop">
      <div class="x-item body-item" v-for="item in items" :key="item.uuid" draggable="true" showTrash="true" @click="sel(item.uuid, item.type)" @dragstart="onItemDragStart(item.uuid, $event)" @dragend="onItemDragEnd(item.uuid, $event)">
        <div class="item-slot">
          <img class="tex-item" :src="item.url" />
        </div>
        <div class="cls-name text-ellipsis">{{ nameOf(item) }}</div>
        <div class="item-slot" :selected="selected === item.uuid" style="max-width: 8em; color: black; flex: 1 1 auto; justify-content: start; padding: 0 1em">
          <label class="prop-value text-ellipsis">{{ item.uuid }}</label>
        </div>
      </div>
    </div>
    <div class="clsBoard" style="display: flex; flex-direction: column; align-items: center">
      <i class="icon-drag" style="margin-bottom: 0.4em; color: gray; cursor: default; font-size: 2em" />
      <div v-for="item in images" :key="item.name" class="x-item cls-item" draggable="true" @dragstart="onTypeDragStart(item.name, $event)">
        <div class="item-slot">
          <img class="tex-item" :src="item.url" />
        </div>
        <label :title="item.name" class="cls-name text-ellipsis">{{ item.name }}</label>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import { project, setTex } from '../store/index';
import { fillDragTexture, fillDragType, parseDragEvent } from '../actions/drag';
export default {
  data() {
    return {
      items: [],
      selected: '',
      images: [],
    };
  },
  computed: {
    revision() {
      return this.$store.state.revision;
    },
  },
  watch: {
    revision() {
      this.reset();
    },
  },
  methods: {
    nameOf(item: any) {
      return item.name || item.image || '';
    },
    async onTypeDragStart(clsname: string, ev: DragEvent) {
      fillDragType(ev, clsname, 'textures');
    },
    async onItemDragStart(uuid: string, ev: DragEvent) {
      fillDragTexture(ev, uuid);
    },
    async onItemDragEnd(uuid: string, ev: DragEvent) {
      if (ev.dataTransfer?.getData('selfRemove')) {
        project.screen.removeTexture(uuid);
        this.$makeDirty();
      }
    },
    async onMainBoardDrop(ev: DragEvent) {
      const data = parseDragEvent(ev);
      if (data.type === 'type') {
        const info = await project.screen.addTexture(data.name);
        setTex({
          uuid: info.value.uuid,
        });
        this.$makeDirty();
      }
    },
    reset() {
      this.images = project.screen.getImages().map((e) => ({
        name: e[0],
        url: e[1],
      }));
      this.items = Object.values(project.screen.getTextures()).map((e) => ({
        uuid: e.value.uuid,
        name: e.value.name,
        image: e.image,
        url: e.value.image.src,
      }));
    },
    sel(uuid: string) {
      setTex({
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
  box-sizing: border-box;
  overflow: hidden;
}
.item-slot[selected='true'] {
  background: greenyellow;
}
.item-slot img {
  width: 30px;
  height: 30px;
  object-fit: cover;
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

