<template>
  <div class="flexsvg-root">
    <div ref="anchor" class="flexsvg-anchor"></div>
    <svg ref="root" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:html="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
      <slot></slot>
    </svg>
  </div>
</template>
<script lang=ts>
export default {
  mounted() {
    // Force update for initial layout.
    this.$forceUpdate();
    this.obs = new ResizeObserver(() => {
      this.autolayout();
    });
    this.obs.observe(this.$el);
  },
  unmounted() {
    this.obs.disconnect();
  },
  updated() {
    this.$nextTick(() => {
      this.autolayout();
    });
  },
  methods: {
    dump(node: SVGElement, div?: HTMLDivElement): HTMLDivElement {
      if (!div) {
        div = document.createElement('div');
        for (const iterator of Object.entries(node.style)) {
          try {
            div.style[iterator[0]] = iterator[1];
          } catch (e) {
            console.log(e);
          }
        }
        // copy attrs
        const count = node.attributes.length;
        for (let i = 0; i < count; i++) {
          const attr = node.attributes[i];
          if (attr.name === 'style') {
            continue;
          }
          div.setAttribute(attr.name, attr.value);
        }
        node.classList.forEach((c) => div.classList.add(c));
        (div as any).__svg__ = node;
      } else {
        const count = div.children.length;
        for (let i = 0; i < count; i++) {
          div.removeChild(div.children[0]);
        }
      }
      const count = node.children.length;
      for (let i = 0; i < count; i++) {
        const child = node.children[i];
        if (child.tagName !== 'g') {
          continue;
        }
        div.appendChild(this.dump(child));
      }
      return div;
    },
    applyCss(node: HTMLElement, to: HTMLElement) {
      for (const iterator of Object.entries(node.style)) {
        to.style[iterator[0]] = iterator[1];
      }
      // copy attrs
      const count = node.attributes.length;
      for (let i = 0; i < count; i++) {
        const attr = node.attributes[i];
        if (attr.name === 'style') {
          continue;
        }
        to.setAttribute(attr.name, attr.value);
      }
      node.classList.forEach((c) => {
        if (to.classList.contains(c)) {
          return;
        }
        to.classList.add(c);
      });
    },
    layout(div: HTMLDivElement) {
      const svg = (div as any).__svg__ as SVGElement;
      if (svg && svg.style.position !== 'absolute') {
        const boundsParent = div.parentElement.getBoundingClientRect();
        const bounds = div.getBoundingClientRect();
        svg.setAttribute('width', `${bounds.width}`);
        svg.setAttribute('height', `${bounds.height}`);
        // svg.setAttribute('x', `${bounds.left - boundsParent.left}`);
        // svg.setAttribute('y', `${bounds.top - boundsParent.top}`);
        svg.setAttribute('transform', `translate(${bounds.left - boundsParent.left}, ${bounds.top - boundsParent.top})`);
      }
      const count = div.children.length;
      for (let i = 0; i < count; i++) {
        const child = div.children[i];
        this.layout(child as HTMLDivElement);
      }
    },
    autolayout() {
      this.applyCss(this.$el, this.$refs.anchor);
      this.$refs.anchor.style.width = '100%';
      this.$refs.anchor.style.height = '100%';
      this.$refs.anchor.style.position = 'absolute';
      this.$refs.anchor.style.top = '0';
      this.$refs.anchor.style.left = '0';
      // this.$refs.anchor.style.opacity = '0';
      this.$refs.anchor.style.zIndex = '-1';
      this.dump(this.$refs.root, this.$refs.anchor);
      this.layout(this.$refs.anchor);
    },
  },
};
</script>
<style scoped>
.flexsvg-root {
  position: relative;
}
.flexsvg-anchor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;
  /* z-index: 1; */
  /* visibility: visible; */
  /* opacity: 0; */
}
</style>
