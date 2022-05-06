<template>
  <el-dialog v-model="prop.visible" :title="title" width="30%" draggable @close="prop.visible = false">
    <div style="align-items: stretch; display: flex; flex-direction: column">
      <div class="sec" title="模型" style="display: flex; flex-direction: row">
        <el-tag v-for="item in models" :key="item.name" type="info" :effect="item == sel ? 'dark' : 'plain'" @click="setModel(item)">{{ item.name }}</el-tag>
      </div>
      <div class="sec" title="内置单词" style="display: flex; flex-direction: row; flex-wrap: wrap">
        <el-badge v-for="item in sort(sel)" :key="item.name" :value="getExampleCount(item)" class="item">
          <el-tag type="success" :effect="item == selWord ? 'dark' : 'plain'" @click="setWord(item)">{{ item }}</el-tag>
        </el-badge>
      </div>
      <div class="sec" title="自定义单词" style="display: flex; flex-direction: row">
        <el-badge v-for="item in customWords" :key="item" :value="getExampleCount(item)" class="item">
          <el-tag closable @close="removeWord(item)" :effect="item == selWord ? 'dark' : 'plain'" @click="setWord(item)">{{ item }}</el-tag>
        </el-badge>
      </div>
      <div class="sec" title="输入自定义单词" style="align-items: center; display: flex; flex-direction: row">
        <el-input v-model="inputWord" :disabled="!isTransferReady || collecting || trainning" :placeholder="$t('speech.inputword')">
          <template #append>
            <i class="icon-add" @click="addWord"></i>
          </template>
        </el-input>
      </div>
      <div @mousedown="listen" @mouseup="stop" class="sec" title="识别结果（长按识别）" style="display: flex; flex-direction: row; background: #f2f2f2; min-height: 3em">
        <label>{{ regWord }}</label>
      </div>
    </div>
    <template #footer>
      <div style="align-items: center; display: flex; flex-direction: row; justify-content: space-around; min-height: 60px">
        <el-button type="primary" :disabled="trainning || collecting" @click="resetTransfer">{{ $t('speech.reset') }}</el-button>
        <el-button type="primary" :disabled="!isTransferReady || trainning" @click="collect">{{ $t('speech.collect') }}</el-button>
        <el-button type="primary" :disabled="!isTransferReady || trainning" @click="train">{{ $t('speech.train') }}</el-button>
        <el-button type="primary" :disabled="!isTransferReady" @click="save">{{ $t('speech.save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang='ts'>
import '@tensorflow/tfjs';
import * as speechCommands from '../speech-commands/index';
import type { SpeechCommandRecognizer, TransferSpeechCommandRecognizer } from '../speech-commands/types';
import * as tfvis from '@tensorflow/tfjs-vis';
import * as apis from '../apis';
import type { Model } from 'egg/speech';
import { projectName } from '../store';

const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const directions = ['up', 'down', 'left', 'right'];
const trues = ['yes', 'no'];
const action = ['go', 'start', 'stop', 'run', 'walk', 'jump', 'dance', 'sit', 'laugh'];

function sortWords(words: Array<string>): Array<string> {
  const rs: Array<string> = [];
  for (const iterator of digits) {
    if (words.includes(iterator)) {
      rs.push(iterator);
    }
  }
  for (const iterator of directions) {
    if (words.includes(iterator)) {
      rs.push(iterator);
    }
  }
  for (const iterator of trues) {
    if (words.includes(iterator)) {
      rs.push(iterator);
    }
  }
  for (const iterator of action) {
    if (words.includes(iterator)) {
      rs.push(iterator);
    }
  }
  for (const iterator of words) {
    if (!rs.includes(iterator)) {
      rs.push(iterator);
    }
  }
  return rs;
}

let recognizer: SpeechCommandRecognizer = null;
let transferRecognizer: TransferSpeechCommandRecognizer = null;
async function createTransferRecognizer(model: Model) {
  // eslint-disable-next-line max-len
  recognizer = speechCommands.create('BROWSER_FFT', null, `${window.location.origin}/__egg__/${projectName}/assets/models/speech/${model.name}/model.json`, `${window.location.origin}/__egg__/assets/models/speech/${model.name}/metadata.json`);
  await recognizer.ensureModelLoaded();
  transferRecognizer = recognizer.createTransfer(`${model.name}-transfer`);
  if (model.transfer) {
    await transferRecognizer.load(`${window.location.origin}/__egg__/${projectName}/assets/models/speech/${model.name}/transfer/model.json`);
    transferRecognizer.setWords(model.transfer.words);
  }
}

export default {
  props: {
    title: {
      type: String,
    },
    prop: {
      type: Object,
      default: {
        visible: false,
      },
    },
  },
  data() {
    return {
      models: [],
      sel: {
        name: '',
        words: [],
      } as Model,
      selWord: '',
      customWords: [],
      inputWord: '',
      examples: {},
      isTransferReady: false,
      trainning: false,
      collecting: false,
      regWord: '',
    };
  },
  methods: {
    sort(item) {
      return sortWords(item.words);
    },
    reset() {
      this.isTransferReady = false;
      this.examples = {};
      this.customWords = [];
      transferRecognizer = null;
      if (this.sel.transfer) {
        for (const iterator of this.sel.transfer.words) {
          if (this.sel.words.indexOf(iterator) === -1) {
            this.customWords.push(iterator);
          }
        }
      }
      createTransferRecognizer(this.sel).then(() => {
        this.isTransferReady = true;
        if (!transferRecognizer.isDatasetEmpty()) {
          this.examples = transferRecognizer.countExamples();
        }
      });
    },
    resetTransfer() {
      this.sel.transfer = null;
      this.reset();
    },
    setModel(model: Model) {
      this.sel = model;
      this.selWord = '';
      this.customWords = [];
      if (!model.words.length) {
        return;
      }
      this.reset();
    },
    removeWord(word) {
      const index = this.customWords.indexOf(word);
      if (index >= 0) {
        this.customWords.splice(index, 1);
      }
    },
    addWord() {
      if (!this.inputWord || !/^[\w\d]+$/.test(this.inputWord)) {
        return;
      }
      if (this.customWords.includes(this.inputWord)) {
        return;
      }
      this.customWords.push(this.inputWord);
      this.inputWord = '';
    },
    setWord(word) {
      this.selWord = word;
      if (this.collecting) {
        transferRecognizer.collectExample(word).then(() => {
          this.examples = transferRecognizer.countExamples();
        });
      }
    },
    getExampleCount(word) {
      return this.examples[word] || 0;
    },
    async collect() {
      this.collecting = !this.collecting;
    },
    async train() {
      if (this.trainning) {
        throw 'aready started';
      }
      try {
        await transferRecognizer.train({
          // 迭代次数
          epochs: 100,
          callback: tfvis.show.fitCallbacks(
            { name: '训练效果' },
            // 度量, 查看损失, 准确度
            ['loss', 'acc'],
            { callbacks: ['onEpochEnd'] },
          ),
        });
        this.$notify({
          type: 'success',
          message: '已训练完',
        });
      } catch (e) {
        console.warn(e);
        this.$notify({
          type: 'error',
          message: e.message,
        });
      } finally {
        this.trainning = false;
        this.$forceUpdate();
      }
    },
    async save() {
      const rs = await transferRecognizer.save(`${window.location.origin}/__egg__/uploadmodel?name=${this.sel.name}`);
      const meta = transferRecognizer.getMetadata();
      await apis.speech.saveTransferMeta(projectName, this.sel.name, meta);
      console.log(rs);
    },
    async listen() {
      const s = this.sel.transfer ? transferRecognizer : recognizer;
      return await s.listen(
        (result) => {
          const { scores } = result;
          console.warn('result', result);
          const maxValue = Math.max(...(<Array<any>>scores));
          const index = (<Array<any>>scores).indexOf(maxValue);
          const labels = transferRecognizer.wordLabels();
          console.log(labels[index]);
          this.regWord = labels[index];
          return Promise.resolve();
        },
        {
          overlapFactor: 0.1,
          probabilityThreshold: 0.9,
        },
      );
    },
    async stop() {
      const s = this.sel.transfer ? transferRecognizer : recognizer;
      s.stopListening();
    },
  },
  async mounted() {
    this.models = await apis.speech.models(projectName);
    const sel = this.models[0] || { words: [] };
    this.setModel(sel);
  },
};
</script>
<style scoped>
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
