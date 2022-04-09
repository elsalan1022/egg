<template>
  <div>
    <svg ref="root" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:html="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"></svg>
  </div>
</template>

<script lang=ts>
import SVG from 'svg.js';
import Canvas from './shapes/canvas';
export default {
  props: {
    items: {
      type: Array,
      default: [],
    },
  },
  watch: {
    items() {
      this.draw();
    },
  },
  methods: {
    draw() {
      const canvas = this.svg;
      canvas.clear();
      this.items.forEach((e) => {
        if (!e.block) {
          e.block = e.unit.createAction(e.name);
        }
      });
      const sz = Canvas.drawBlockList(
        canvas,
        this.items.map((e) => e.block),
        {
          x: 4,
          y: 4,
          gapy: 8,
        },
      );
      this.$refs.root.setAttribute('width', `${sz.width + 8}px`);
      this.$refs.root.setAttribute('height', `${sz.height + 8}px`);
    },
  },
  mounted() {
    this.svg = SVG(this.$refs.root);
    this.$nextTick(() => {
      this.draw();
    });
  },
};
</script>

<style>
</style>
