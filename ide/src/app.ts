/* eslint-disable @typescript-eslint/no-unused-vars */
import { App } from 'vue';
import { Router } from 'vue-router';
import { Store } from 'vuex';
import { ElNotification } from 'element-plus';
import rpcService, { rpc } from './rpc';
import store, { project, projectName } from './store/index';
import * as apis from './apis';
import { loadUsrLibs } from './egg';
import Stats from 'stats.js';

export default {
  beforeLaunch(app: App, _store: Store<any>, _router: Router) {
    app.mixin({
      computed: {
        $app: () => this,
        $rpc: () => rpc,
        $prj: () => project,
        $textures: () => project.screen.getTextures(),
      },
      methods: {
        $makeDirty() {
          store.state.revision++;
        },
      },
    });
    rpcService.setupObserver({
      onPending(count: number) {
        store.state.isNetBusy = !!count;
      },
      onAlert(e) {
        console.warn(e);
        ElNotification({
          type: 'error',
          title: '请求失败',
          message: e.message || e.toString(),
        });
      },
    });
    Promise.all([loadUsrLibs(), rpcService.start()]).then(async () => {
      store.state.isLoading = false;
      try {
        await project.screen.setup({
          font: '/assets/fonts/helvetiker_regular.typeface.json',
          assets: `/__egg__/${projectName}/assets`,
        });
        const cfg = await apis.project.load(projectName);
        await project.unserialize(cfg);
        project.screenEditor.afterLoad();
      } catch (e) {
        // nothing
        console.error(e);
      }
      store.state.revision = 0;
    });
  },
  onLaunched(_app: App, _store: Store<any>, _router: Router) {
    console.log('launched');
    const stats = new Stats();
    stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.dom);
  },
};
