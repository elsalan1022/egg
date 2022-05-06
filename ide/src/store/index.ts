import { ProjectBrowser } from 'egg/src/browser/index';
import { Slot } from 'egg';
import { createStore } from 'vuex';

export type VarProp = {
  /** global or slot */
  readonly scope: 'global' | 'slot';
  /** var type */
  readonly type: DataType;
  /** var name */
  readonly name: string;
  /** slot */
  readonly slot?: Slot;
};

export type PropUUID = {
  /** mat uuid */
  readonly uuid: string;
};

export type MatProp = PropUUID;

export const project = new ProjectBrowser();

export const projectName = localStorage.getItem('project') || 'test';

export const state = {
  isLoading: false,
  isNetBusy: false,
  isPreviewFloating: false,
  selected: {
    unit: null as any as ProjectBrowser,
    block: null,
  },
  var: {
    /** global or slot */
    scope: 'global' as 'global' | 'slot',
    /** var name */
    name: '',
    /** slot */
    slot: undefined,
  } as VarProp,
  mat: {
    uuid: '',
  } as MatProp,
  tex: {
    uuid: '',
  } as PropUUID,
  revision: -1,
};

const store = createStore<typeof state>({
  state,
  mutations: {
    setVar(state, payload) {
      state.var = payload;
    },
    setMat(state, payload) {
      state.mat = payload;
    },
    setTex(state, payload) {
      state.tex = payload;
    }
  },
});

store.state.selected.unit = project;

export default store;
export type Store = typeof store;

export function setVar(payload: VarProp) {
  return store.commit('setVar', payload);
}

export function setMat(payload: MatProp) {
  return store.commit('setMat', payload);
}

export function setTex(payload: PropUUID) {
  return store.commit('setTex', payload);
}
