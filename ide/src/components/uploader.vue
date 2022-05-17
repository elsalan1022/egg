<template>
  <el-dialog v-model="prop.visible" :title="title" width="30%" draggable @close="prop.visible = false">
    <el-upload class="uploader" drag :action="url" multiple :file-list="fileList" :onSuccess="handleSuccess"
      accept="image/*,audio/*,.glb,.dae,.fbx">
      <el-icon class="el-icon--upload">
        <upload-filled />
      </el-icon>
      <div class="el-upload__text"> {{ $t('se.dragtoup') }} <em>{{ $t('se.clicktoup') }}</em></div>
      <template #tip>
        <div class="el-upload__tip">{{ $t('se.uploadtip') }}</div>
      </template>
    </el-upload>
  </el-dialog>
</template>
<script lang="ts" setup>
import { defineProps, ref } from 'vue';
import { project, projectName } from '../store/index';

const props = defineProps({
  title: {
    type: String,
  },
  prop: {
    type: Object,
    default: {
      visible: false,
    },
  },
});

const url = ref<string>(`/__egg__/${projectName}/upload`);

const fileList = ref<any[]>([]);

const handleSuccess = (response: any, uploadFile: any) => {
  const { result } = response;
  const [type, name] = result.split('/');
  if (type === 'textures') {
    project.screen.addImage(name);
  } else if (type === 'models') {
    project.screen.addModel(name);
  } else if (type === 'sounds') {
    project.screen.addSound(name);
  }
}

</script>
<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.sec {
  position: relative;
  padding: 0.5em;
  margin: 1em 0;
}

.sec::before {
  position: absolute;
  content: attr(title);
  top: -1em;
  left: 0.2em;
}

.el-tag {
  margin: 0.2em 0.5em;
}

.item {
  margin-top: 8px;
  margin-right: 8px;
}
</style>
