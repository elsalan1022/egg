<template>
  <div class="min-width" v-loading="isLoading" style="align-items: stretch; display: flex; flex-direction: column; max-height: 100vh; min-height: 100vh">
    <div class="topbar" style="align-items: stretch; display: flex; flex-direction: row; width: auto">
      <div class="leftside" style="align-items: center; display: flex; flex: 1 1 auto; flex-direction: row; font-size: 2rem; padding-left: 0.5rem">
        <i class="icon-egg" style="cursor: default; font-size: 3rem"></i>
        <el-dropdown @command="selectProject" style="flex: 1 1 auto">
          <div style="display: flex; flex-direction: row; align-items: center">
            <label style="color: white; font-size: 2rem; margin-left: 0.5em">{{ projectName }}</label>
            <i class="icon-arrow-dropdown" style="color: white"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="name in names" :key="name" :command="name">{{ name }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="center topbtns" style="padding-left: 0.5em; align-items: center; display: flex; flex: 1 1 auto; flex-direction: row">
        <i class="icon-add" @click="newProject"></i>
        <i class="icon-save" signame="save" :disabled="!isDirty" @click="save"></i>
        <i class="icon-trash" signame="trash" :disabled="names.length == 1" @click="removeProject"></i>
        <i class="icon-upload" @click="uploader.visible = !uploader.visible"></i>
        <!-- <i class="icon-recorder" @click="speechDlg.visible = true"></i> -->
      </div>
      <div class="rightside topbtns" style="align-items: center; display: flex; flex-direction: row">
        <i class="icon-start" :disabled="isRunning" signame="run" @click="start"></i>
        <i class="icon-stop" :disabled="!isRunning" @click="stop"></i>
        <i class="icon-loading" v-if="isPending" style="margin-right: 8px"></i>
        <p style="flex: 1 1 auto"></p>
        <i class="icon-reset" @click="resetScreen" style="margin-right: 8px"></i>
        <i :class="floating ? 'icon-minimize' : 'icon-maximize'" signame="maximize" @click="floating = !floating"></i>
      </div>
    </div>
    <div ref="main" class="main" style="align-items: stretch; display: flex; flex-direction: row">
      <div class="leftside blocks" style="align-items: stretch; display: flex; flex-direction: column">
        <Blocks class="leftside blocks-panel outer-panel" :items="selBlocks" style="overflow: scroll"></Blocks>
        <el-tabs class="block-panes" type="border-card" style="flex: 1 1 auto; border: none; box-shadow: none; border-top: 2px solid #f2f2f2">
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-egg"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.global') }}</label>
              </div>
            </template>
            <Blocks class="leftside blocks-panel inner-tabpane" :items="blocksGlobal" style="overflow: scroll"></Blocks>
          </el-tab-pane>
          <el-tab-pane :lazy="true">
            <template #label>
              <div class="picker-label">
                <i class="icon-group"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.device') }}</label>
              </div>
            </template>
            <Blocks class="leftside blocks-panel inner-tabpane" :items="blocksBuiltin" style="overflow: scroll"></Blocks>
          </el-tab-pane>
          <el-tab-pane :lazy="true">
            <template #label>
              <div class="picker-label">
                <i class="icon-logic"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.logic') }}</label>
              </div>
            </template>
            <Blocks class="leftside blocks-panel inner-tabpane" :items="blocksLogic" style="overflow: scroll"></Blocks>
          </el-tab-pane>
          <el-tab-pane :lazy="true">
            <template #label>
              <div class="picker-label">
                <i class="icon-math"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.math') }}</label>
              </div>
            </template>
            <Blocks class="leftside blocks-panel inner-tabpane" :items="blocksMath" style="overflow: scroll"></Blocks>
          </el-tab-pane>
        </el-tabs>
      </div>
      <Editor class="center editor"> </Editor>
      <Panel class="panel"></Panel>
      <div class="rightside" style="align-items: stretch; display: flex; flex-direction: column">
        <Preview class="preview" id="preview" :floating="floating"></Preview>
        <el-tabs class="picker" type="border-card" style="flex: 1 1 auto">
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-screen"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.scene') }}</label>
              </div>
            </template>
            <div style="align-items: stretch; display: flex; flex-direction: column">
              <Scenes class="picker-body"></Scenes>
            </div>
          </el-tab-pane>
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-variable"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.variable') }}</label>
              </div>
            </template>
            <Vars class="vars picker-body"></Vars>
          </el-tab-pane>
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-layer"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.material') }}</label>
              </div>
            </template>
            <Materials class="picker-body"></Materials>
          </el-tab-pane>
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-brush"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.texture') }}</label>
              </div>
            </template>
            <Textures class="picker-body"></Textures>
          </el-tab-pane>
          <el-tab-pane>
            <template #label>
              <div class="picker-label">
                <i class="icon-component"></i>
                <label style="margin-left: 0.2em">{{ $t('nm.device') }}</label>
              </div>
            </template>
            <Devices class="units picker-body" :items="devices"></Devices>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <!-- <Speech :prop="speechDlg" :title="$t('speech.train')"></Speech> -->
  </div>
</template>
<script lang='ts'>
import { ElMessageBox } from 'element-plus';
import Blocks from '../components/blocks.vue';
import Editor from '../components/editor.vue';
import Preview from '../components/preview.vue';
import Panel from '../components/panel.vue';
import Vars from '../components/vars.vue';
import Scenes from '../components/scenes.vue';
import Materials from '../components/materials.vue';
import Textures from '../components/textures.vue';
import Devices from '../components/devices.vue';
// import Speech from '../components/speech.vue';
import { project, projectName } from '../store/index';
import * as apis from '../apis';
import { setLang } from '../i18n';
import { Dragable } from '../utils/dragable';
import { rpc } from '../rpc';

export default {
  components: {
    Blocks,
    Editor,
    Preview,
    Vars,
    Scenes,
    Materials,
    Textures,
    Devices,
    Panel,
    // Speech,
  },
  data() {
    return {
      isRunning: false,
      localRev: -1,
      names: [] as string[],
      // speechDlg: {
      //   visible: false,
      // },
      uploader: {
        visible: false,
      },
    };
  },
  computed: {
    projectName() {
      return projectName;
    },
    isDirty() {
      return this.localRev !== this.$store.state.revision;
    },
    isLoading() {
      return this.$store.state.isLoading;
    },
    isPending() {
      return this.$store.state.isNetBusy;
    },
    floating: {
      get() {
        return this.$store.state.isPreviewFloating;
      },
      set(value) {
        this.$store.state.isPreviewFloating = value;
      },
    },
    devices() {
      return [project as any].concat(
        Object.entries(this.$prj.devices)
          .filter((e: any) => ['logic', 'math', 'storage', 'test'].indexOf(e[0]) === -1)
          .map((e) => e[1]),
      );
    },
    selected() {
      return this.$store.state.selected.unit;
    },
    selBlocks() {
      const sel = this.selected;
      if (!sel) {
        return [];
      }
      return Object.entries(sel.actions).map((e) => ({ unit: sel, name: e[0], action: e[1] }));
    },
    blocksGlobal() {
      const ls: any[] = [];
      [project, project.builtins.test].forEach((e) => {
        ls.push(...Object.entries(e.actions).map((ev) => ({ unit: e, name: ev[0], action: ev[1] })));
      });
      return ls;
    },
    blocksBuiltin() {
      const ls: any[] = [];
      Object.values(project.devices).forEach((e) => {
        ls.push(...Object.entries(e.actions).map((ev) => ({ unit: e, name: ev[0], action: ev[1] })));
      });
      return ls;
    },
    blocksLogic() {
      const ls: any[] = [];
      [project.builtins.logic].forEach((e) => {
        ls.push(...Object.entries(e.actions).map((ev) => ({ unit: e, name: ev[0], action: ev[1] })));
      });
      return ls;
    },
    blocksMath() {
      const ls: any[] = [];
      [project.builtins.math].forEach((e) => {
        ls.push(...Object.entries(e.actions).map((ev) => ({ unit: e, name: ev[0], action: ev[1] })));
      });
      return ls;
    },
  },
  methods: {
    setLang(lang) {
      setLang(lang);
    },
    async save() {
      const cfg = project.serialize();
      await apis.project.save(projectName, cfg);
      this.localRev = this.$store.state.revision;
    },
    async addUnit(clsname) {
      await project.createUnit(clsname, project.devices.screen);
      this.$makeDirty();
    },
    async removeUnit() {
      const unit = this.selected;
      if (unit) {
        await project.destroyUnit(unit);
        this.$makeDirty();
      }
    },
    async start() {
      if (this.isRunning) {
        await project.stop();
      }
      this.isRunning = true;
      await project.build().run({});
    },
    async stop() {
      await project.stop();
      this.isRunning = false;
    },
    resetScreen() {
      project.screen.reset();
    },
    async newProject() {
      const { action, value } = (await ElMessageBox.prompt(this.$t('se.inpjname'), this.$t('se.new'), {
        confirmButtonText: this.$t('se.ok'),
        cancelButtonText: this.$t('se.cancel'),
        inputPattern: /\w{1,30}/,
        inputErrorMessage: this.$t('se.invalidName'),
      })) as any;
      if (action === 'confirm' && value) {
        await apis.project.create(value);
        localStorage.setItem('project', value);
        location.reload();
      }
    },
    async selectProject(name) {
      localStorage.setItem('project', name);
      location.reload();
    },
    async removeProject() {
      ElMessageBox.confirm(this.$t('se.delpj'), this.$t('se.warning'), {
        confirmButtonText: this.$t('se.ok'),
        cancelButtonText: this.$t('se.cancel'),
        type: 'warning',
      }).then(async () => {
        await apis.project.remove(projectName);
        const rs = await apis.project.list();
        this.names = rs.items;
      });
    },
  },
  async mounted() {
    this.localRev = this.$store.state.revision <= 0 ? 0 : this.$store.state.revision;
    this.dragable = new Dragable(this.$refs.main);
    const rs = await apis.project.list();
    this.names = rs.items;
    const preview = document.getElementById('preview');
    const screen = project.screen;
    screen.attach(preview);
    screen.reset();
    project.screenEditor.setupObsever(() => {
      this.$makeDirty();
    });
    this.$regsig('save', { key: 's' }, () => {
      this.save();
    });
    this.$regsig('run', { key: 'r' }, () => {
      this.start();
    });
    this.$regsig('maximize', { key: 'm' }, () => {
      this.floating = this.floating ? false : true;
    });
    rpc.describe(
      'joystick',
      ({ type, name, value }) => {
        if (type === 'button' && name === 'start' && !this.isRunning) {
          this.floating = true;
          this.start();
        }
      },
      this,
    );
  },
};
</script>
<style>
.topbar-pending {
  position: absolute;
  width: 100%;
  height: 2px;
  left: 0;
  bottom: 0px;
  background: #ff9900;
  animation: loading 4s ease-in-out infinite;
}

@keyframes loading {
  0% {
    left: 0;
    width: 0;
  }
  25% {
    left: 0;
    width: 100%;
  }
  50% {
    left: 100%;
    width: 0%;
  }
  75% {
    left: 0;
    width: 100%;
  }
  100% {
    left: 0;
    width: 0;
  }
}
</style>
<style scoped='true'>
.topbar {
  padding: 0;
  color: hsla(0, 100%, 100%, 1);
  background-color: hsla(215, 100%, 65%, 1);
  user-select: none;
  position: relative;
  min-height: 4rem;
  font-family: longcang, sans-serif;
}

.topbar i {
  font-size: 2rem;
}

.langs {
  color: var(--color-comment);
}

.langs span {
  cursor: pointer;
  white-space: nowrap;
}

.topbtns i {
  font-size: 2rem;
  margin-left: 0.75rem;
  margin-right: 0.75rem;
  cursor: pointer;
}

i {
  cursor: pointer;
}

.topbar i {
  color: white;
}

.topbar .icon-minimize {
  color: #ff9900;
  z-index: 1000;
}

i[disabled='true'] {
  cursor: default;
  color: #ccc;
  pointer-events: none;
}

.icon-start[disabled='false'] {
  color: greenyellow;
}

.icon-stop[disabled='false'] {
  color: red;
}

.icon-egg {
  color: #ffcc88;
}

.icon-trash[disabled='false'] {
  color: red;
}

.icon-loading {
  color: #ff9900;
  animation: rotate 1s infinite linear;
}

.main {
  flex: 1 1 auto;
  background-color: hsla(215, 100%, 95%, 1);
  font-size: 1.4rem;
  position: relative;
}

.main label {
  font-size: 1.4rem;
  line-height: 1.4rem;
  vertical-align: middle;
}

.blocks {
  align-self: stretch;
  border-radius: 6px;
  background: white;
  margin: 6px;
  min-height: 400px;
  max-height: calc(100vh - 4rem);
  overflow: scroll;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 12%), 0 0 6px 0 rgb(0 0 0 / 4%);
}

.editor {
  flex: 1 1 auto;
  background-color: white;
  min-height: 400px;
  max-height: calc(100vh - 4rem);
  overflow: scroll;
}

.panel {
  position: absolute;
  top: 3.5em;
  right: 416px;
  min-height: 20px;
  max-height: calc(100vh - 12rem);
  z-index: 100;
  overflow: scroll;
}

.outer-panel {
  min-height: calc(40vh - 2rem);
  max-height: calc(40vh - 2rem);
}

.inner-tabpane {
  margin: -15px;
  min-height: 100%;
  max-height: 100%;
  overflow: scroll;
}

.block-panes {
  min-height: 200px;
  max-height: calc(100vh - 4rem - 460px);
  overflow: scroll;
}

.preview {
  border-radius: 6px;
  background: white;
  margin: 6px;
  margin-bottom: 3px;
  height: 300px;
  overflow: hidden;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 12%), 0 0 6px 0 rgb(0 0 0 / 4%);
}

.preview[floating='true'] {
  position: absolute;
  top: -4rem;
  right: 0;
  left: 0;
  width: 100vw;
  height: unset;
  bottom: 0;
  margin: 0;
  border-radius: 0;
  z-index: 999;
}

.picker {
  border-radius: 6px;
  margin: 6px;
  margin-top: 3px;
  overflow: hidden;
}

.picker-body {
  max-height: calc(100vh - 430px);
  overflow: scroll;
}

.units-bar {
  background-color: hsla(215, 100%, 95%, 1);
  height: 32px;
  border-radius: 12px;
  cursor: pointer;
  padding: 4px;
  margin: 8px 0;
}

.units {
  flex: 1 1 auto;
  background: white;
  overflow-y: scroll;
}

.picker-label {
  align-items: center;
  display: flex;
  flex-direction: row;
}
.picker-label * {
  cursor: pointer;
}
.picker-label i {
  font-size: 1.6em;
}
</style>
