<template>
  <svg class="bezier-layer" xmlns="http://www.w3.org/2000/svg" :width="size.width" :height="size.height">
    <defs>
      <marker id="bezier-arrow" markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto">
        <path xmlns="http://www.w3.org/2000/svg" d="M2,2 L10,6 L2,10 L6,6 L2,2" :style="'fill:' + color + ';'" />
      </marker>
    </defs>
    <path :class="animated ? 'bezier-layer-line' : ''" :d="path" :style="{ stroke: color, 'stroke-width': width }" marker-end="url(#bezier-arrow)" stroke-dasharray="10,5" fill="none"></path>
  </svg>
</template>
<script lang=ts>
export default {
  props: {
    direction: {
      type: String,
      values: ['vertical', 'horizontal'],
      default: 'horizontal',
    },
    source: {
      type: HTMLElement,
    },
    target: {
      type: HTMLElement,
    },
    width: {
      type: Number,
      default: 1,
    },
    color: {
      type: String,
      default: 'gray',
    },
    animated: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      start: { x: 0, y: 0 },
      C1: { x: 0, y: 0 },
      C2: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
      size: {
        height: 0,
        width: 0,
      },
    };
  },
  computed: {
    path() {
      return `M${this.start.x} ${this.start.y} C${this.C1.x} ${this.C1.y} ${this.C2.x} ${this.C2.y} ${this.end.x} ${this.end.y}`;
    },
  },
  methods: {
    update() {
      const rtParent = this.$el.parentElement.getBoundingClientRect();
      const rtStart = document.getElementById(this.source).getBoundingClientRect();
      const rtEnd = document.getElementById(this.target).getBoundingClientRect();
      const pos: any = {};
      ({
        horizontal: () => {
          this.size.width = Math.abs(rtEnd.x - rtStart.x - rtStart.width);
          this.size.height = Math.max(10, Math.abs(rtEnd.y + rtEnd.height / 2 - rtStart.y - rtStart.height / 2)) + 16;
          pos.x = Math.min(rtEnd.x, rtStart.x + rtStart.width) - rtParent.x;
          pos.y = Math.min(rtEnd.y + rtEnd.height / 2, rtStart.y + rtStart.height / 2) - rtParent.y - 8;

          this.start.x = rtStart.x + rtStart.width - rtParent.x - pos.x;
          this.start.y = rtStart.y + rtStart.height / 2 - rtParent.y - pos.y;
          this.C1.x = this.start.x + this.size.width / 2.5;
          this.C1.y = this.start.y;
          this.end.x = rtEnd.x - rtParent.x - pos.x - 4;
          this.end.y = rtEnd.y + rtEnd.height / 2 - rtParent.y - pos.y;
          this.C2.x = this.end.x - this.size.width / 2.5;
          this.C2.y = this.end.y;
        },
        vertical: () => {
          this.size.height = Math.abs(rtEnd.y - rtStart.y - rtStart.height);
          this.size.width = Math.max(10, Math.abs(rtEnd.x + rtEnd.width / 2 - rtStart.x - rtStart.width / 2)) + 16;
          pos.y = Math.min(rtEnd.y, rtStart.y + rtStart.height) - rtParent.y;
          pos.x = Math.min(rtEnd.x + rtEnd.width / 2, rtStart.x + rtStart.width / 2) - rtParent.x - 8;

          this.start.y = rtStart.y + rtStart.height - rtParent.y - pos.y;
          this.start.x = rtStart.x + rtStart.width / 2 - rtParent.x - pos.x;
          this.C1.y = this.start.y + this.size.height / 2.5;
          this.C1.x = this.start.x;
          this.end.y = rtEnd.y - rtParent.y - pos.y - 4;
          this.end.x = rtEnd.x + rtEnd.width / 2 - rtParent.x - pos.x;
          this.C2.y = this.end.y - this.size.height / 2.5;
          this.C2.x = this.end.x;
        },
      }[this.direction].call(this));
      this.$el.style.left = `${pos.x}px`;
      this.$el.style.top = `${pos.y}px`;
      // console.log({start: this.start, C1: this.C1, C2: this.C2, end: this.end, size: this.size, pos});
    },
    resize() {
      this.update();
    },
  },
  mounted() {
    this.resize();
    this._resize = this.resize.bind(this);
    window.addEventListener('resize', this._resize);
  },
  destroyed() {
    window.removeEventListener('resize', this._resize);
    this._resize = undefined;
  },
};
</script>
<style scoped>
.bezier-layer {
  position: absolute;
  pointer-events: none;
  overflow: visible;
}

.bezier-layer-line {
  animation: line-animation 1s linear infinite;
}

@keyframes line-animation {
  0% {
    stroke-dashoffset: 15;
  }

  100% {
    stroke-dashoffset: 0;
  }
}
</style>
