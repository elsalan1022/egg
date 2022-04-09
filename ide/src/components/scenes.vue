<template>
  <div class="scenePane" style="display: flex; flex-direction: row">
    <div class="unitBoard" style="flex: 1 1 auto; align-items: stretch; display: flex; flex-direction: column" @drop="onUnitBoardDrop">
      <el-dropdown split-button type="primary" @command="selectScene" style="margin-bottom: 0.8em">
        <div class="x-item" draggable="true" showTrash="true" @click="selectUnit(scene.uuid)" @dragstart="onSceneDragStart(scene.uuid, $event)" @dragend="onSceneDragEnd(scene.uuid, $event)" style="width: 100%; pointer-events: all">
          <div class="item-slot">
            <i class="icon-scene" />
          </div>
          <label class="cls-name text-ellipsis" style="flex: 1 1 auto"> {{ $t(scene.name) }} </label>
          <div class="item-slot" style="max-width: 6em; color: black; flex: 1 1 auto; justify-content: start; padding: 0 1em">
            <label class="prop-value text-ellipsis">{{ scene.uuid }}</label>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in scenes" :key="item.uuid" :command="item.uuid">{{ item.name }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="x-item unit-item" v-for="item in units" :key="item.uuid" draggable="true" showTrash="true" @click="selectUnit(item.uuid)" @dragstart="onUnitDragStart(item.uuid, $event)" @dragend="onUnitDragEnd(item.uuid, $event)">
        <div class="item-slot">
          <img v-if="isImg(item.icon)" :src="item.icon" />
          <i v-else :class="toIconClass(item.icon)" />
        </div>
        <div class="cls-name text-ellipsis">{{ $t(`nm.${item.label || item.name}`, item.label || item.name) }}</div>
        <div class="item-slot" :selected="selectedId === item.uuid" style="max-width: 8em; color: black; flex: 1 1 auto; justify-content: start; padding: 0 1em">
          <label class="prop-value text-ellipsis">{{ item.uuid }}</label>
        </div>
      </div>
    </div>
    <div class="clsBoard" style="display: flex; flex-direction: column; align-items: center">
      <i class="icon-drag" style="margin-bottom: 0.4em; color: gray; cursor: default; font-size: 2em" />
      <div v-for="item in classes" :key="item.clsid" class="x-item cls-item" draggable="true" @dragstart="onClassDragStart(item.name, $event)">
        <div class="item-slot">
          <img v-if="isImg(item.icon)" :src="item.icon" />
          <i v-else :class="toIconClass(item.icon)" />
        </div>
        <div class="cls-name text-ellipsis">{{ $t(`nm.${item.label || item.name}`, item.label || item.name) }}</div>
      </div>
    </div>
  </div>
</template>
<script lang='ts'>
import { project } from '../store/index';
import { fillDragClass, fillDragUnit, parseDragEvent } from '../actions/drag';
import icons from '../assets/font/iconfont.json';
export default {
  data() {
    return {
      scene: {
        uuid: '',
        name: '',
      },
      scenes: [],
      units: [],
    };
  },
  computed: {
    revision() {
      return this.$store.state.revision;
    },
    selectedId() {
      return this.$store.state.selected.unit?.uuid;
    },
    items() {
      const [keys] = [['chick'].concat(Object.keys(this.$prj.builtins).concat(Object.keys(this.$prj.devices))), this.$store.state.revision];
      return Object.values(this.$prj.allUnits).filter((e: any) => keys.indexOf(e.name) === -1);
    },
    classes() {
      return [['scene', project.classes.scene as any], ...Object.entries(project.classes).filter((e) => e[0] !== 'scene')].map(([name, it]) => ({
        name,
        label: it.label,
        icon: it.constructor.icon || name,
        clsid: it.constructor.clsid,
      }));
    },
  },
  watch: {
    revision() {
      this.reset();
    },
  },
  methods: {
    isImg(s: string) {
      return s && /^(data:image\/png;base64|data:image\/jpeg;base64|https?:)/.test(s);
    },
    toIconClass(name: string) {
      return icons.glyphs.find((e) => e.font_class === name) ? `icon-${name}` : 'icon-component';
    },
    async onClassDragStart(clsname: string, ev: DragEvent) {
      fillDragClass(ev, clsname);
    },
    async onSceneDragStart(uuid: string, ev: DragEvent) {
      fillDragUnit(ev, uuid);
    },
    async onSceneDragEnd(uuid: string, ev: DragEvent) {
      if (ev.dataTransfer?.getData('selfRemove')) {
        const scenes = project.screenEditor.getScenes();
        if (scenes.length <= 1) {
          throw new Error('至少保留一个场景');
        }
        const scene = project.findUnit(uuid);
        project.screenEditor.removeChild(scene);
        this.selectScene(project.screenEditor.getScenes()[0].uuid);
        this.$makeDirty();
      }
    },
    async onUnitDragStart(uuid: string, ev: DragEvent) {
      fillDragUnit(ev, uuid);
    },
    async onUnitDragEnd(uuid: string, ev: DragEvent) {
      if (ev.dataTransfer?.getData('selfRemove')) {
        const unit = project.findUnit(uuid);
        if (!unit.parent) {
          throw new Error('无法删除根节点');
        }
        unit.parent.removeChild(unit);
        this.$makeDirty();
      }
    },
    async onUnitBoardDrop(ev: DragEvent) {
      const data = parseDragEvent(ev);
      if (data.type === 'class') {
        const clsname = data.name;
        if (clsname === 'scene') {
          await project.createUnit(clsname, project.screenEditor);
        } else {
          const cls = project.classes[clsname];
          const { is2D } = cls.runtime as any;
          if (is2D) {
            await project.createUnit(clsname, project.screenEditor);
          } else {
            if (!project.screen.scene) {
              throw new Error('no scene');
            } else {
              const deco = project.screenEditor.children[project.screen.scene.uuid];
              await project.createUnit(clsname, deco);
            }
          }
        }
        this.$makeDirty();
      }
    },
    reset() {
      const scene = project.screen.scene;
      if (scene) {
        this.scene = {
          uuid: scene.uuid,
          name: scene.get({ name: 'name' }),
        };
      } else {
        this.scene = {
          uuid: '',
          name: 'scene.new',
        };
      }
      this.scenes = Object.values(project.screenEditor.getScenes()).map((e) => ({
        uuid: e.uuid,
        name: e.instance.get({ name: 'name' }),
      }));
      this.resetUnits();
    },
    resetUnits() {
      const units: any = [];
      const scene = project.screen.scene;
      if (scene) {
        const deco = project.screenEditor.children[scene.uuid] as any;
        if (deco) {
          for (const iterator of Object.values(deco.children) as any) {
            if ((iterator.instance as any).isScene) {
              continue;
            }
            units.push({
              uuid: iterator.uuid,
              label: iterator.constructor.label || iterator.name,
              icon: iterator.constructor.icon || iterator.name,
            });
          }
        }
      }

      for (const iterator of Object.values(project.screenEditor.children) as any) {
        if ((iterator.instance as any).isScene) {
          continue;
        }
        units.push({
          uuid: iterator.uuid,
          label: iterator.constructor.label || iterator.name,
          icon: iterator.constructor.icon || iterator.name,
        });
      }
      this.units = units;
    },
    selectUnit(uuid: string) {
      if (!uuid) {
        return;
      }
      this.$store.state.selected.unit = project.findUnit(uuid);
    },
    selectScene(uuid: string) {
      const scene = project.findUnit(uuid);
      this.scene = {
        uuid: scene.uuid,
        name: scene.instance.get({ name: 'name' }),
      };
      project.screenEditor.setCurrentScene(scene as any);
      this.resetUnits();
    },
  },
  mounted() {
    this.selSceneId = project.screen.scene?.uuid;
  },
};
</script>
<style scoped>
.scenePane {
  margin: -15px;
}
.unitBoard {
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
.unit-item {
  border: rgb(56, 148, 56);
  background: rgb(89, 192, 89);
  color: white;
}
.cls-item {
  border: 1px solid rgb(219, 110, 0);
  background: rgb(255, 140, 26);
  color: white;
}
.unit-item i,
.cls-item i,
.item-slot i {
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
<style>
.el-button-group {
  border-radius: 16px !important;
  overflow: hidden !important;
}
.el-button-group .el-button:first-child {
  width: 186px;
  pointer-events: none;
  padding: 0 !important;
  padding-right: 4px !important;
}
.el-button-group .el-button:first-child span {
  width: 100%;
}
</style>
