<template>
  <label class="readonly text-ellipsis" @drop="onDrop" @dblclick="clear"> {{ prop.value || tip }} </label>
</template>
<script lang=ts>
import { parseDragEvent } from '../../actions/drag';
import { project } from '../../store/index';
export default {
  props: {
    prop: {
      type: Object,
      required: true,
    },
  },
  computed: {
    tip() {
      return this.$t('se.placeHolder').replace('$0', this.$t('nm.texture'));
    },
  },
  methods: {
    onDrop(ev: DragEvent) {
      const data = parseDragEvent(ev);
      if (!data || data.type !== 'texture') {
        return;
      }
      const info = project.screen.getTextures()[data.uuid];
      if (!info) {
        throw new Error('texture not found');
      }
      this.prop.value = info.value;
      this.$makeDirty();
    },
    clear() {
      this.prop.value = null;
      this.$makeDirty();
    },
  },
};
</script>
<style scoped>
.readonly {
  background: #eee;
  color: #555;
  border-radius: 0.6em;
  padding: 0.2em 1em;
}
</style>
