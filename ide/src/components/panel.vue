<template>
  <div class="panel" style="align-items: stretch; display: flex; flex-direction: column">
    <Properties class="panel-item"></Properties>
    <VarEditor class="panel-item"></VarEditor>
    <TexEditor class="panel-item"></TexEditor>
    <MatEditor class="panel-item"></MatEditor>
  </div>
</template>
<script lang=ts>
import Properties from './editors/properties.vue';
import VarEditor from './editors/variable.vue';
import MatEditor from './editors/material.vue';
import TexEditor from './editors/texture.vue';
export default {
  components: {
    Properties,
    VarEditor,
    MatEditor,
    TexEditor,
  },
};
</script>
<style scoped>
.panel {
  background: transparent;
  pointer-events: none;
  padding: 4px;
}

.panel-item {
  flex: 0 0 0%;
  margin-top: 20px;
  min-height: 20px;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 12%), 0 0 6px 0 rgb(0 0 0 / 4%);
  background: white;
  pointer-events: auto;
}
</style>
