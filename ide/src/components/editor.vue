<template>
  <div>
    <svg ref="root" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlns:html="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"></svg>
  </div>
</template>
<script lang='ts'>
import SVG from 'svg.js';
import { project } from '../store/index';
import { Unit, Event } from 'egg';
import Canvas from './shapes/canvas';
import { hookDrop, makeDraggable } from '../utils/dragable';
import { fillDragEvent, parseDragEvent } from '../actions/drag';
import { t } from '../i18n';

const eventsPadding = {
  x: 20,
  y: 40,
};
const textPadding = {
  x: 20,
  y: 5,
};

export default {
  data() {
    return {
      visibles: {},
    };
  },
  computed: {
    selected() {
      return this.$store.state.selected.unit;
    },
    revision() {
      return this.$store.state.revision;
    },
  },
  watch: {
    selected() {
      this.draw(this.svg);
    },
    revision() {
      this.draw(this.svg);
    },
    visibles: {
      hander() {
        this.draw(this.svg);
      },
      deep: true,
    },
  },
  methods: {
    onDrop(e: DragEvent) {
      const data = parseDragEvent(e);
      if (!data) {
        return;
      }
      if (data.type === 'action') {
        if (!this.selected) {
          throw new Error('no selected unit');
        }
        const unit = project.findUnit(data.unit);
        const block = unit.createAction(data.action);
        this.selected.createChain(block);
        this.$makeDirty();
      } else if (data.type === 'block') {
        const unit = project.findUnit(data.unit);
        const chain = unit.chains[data.chain];
        const block = unit.findBlock(chain, data.block);
        if (block) {
          unit.removeBlock(chain, block);
          this.$makeDirty();
        } else {
          e.dataTransfer.setData('unhandled', 'true');
        }
      } else if (data.type === 'linker') {
        if (!this.selected) {
          throw new Error('no selected unit');
        }
        const unit = project.findUnit(data.unit);
        const chain = this.selected.chains[data.chain];
        if (!chain.head) {
          unit.removeChain(chain);
          this.$makeDirty();
        }
      } else if (data.type === 'event') {
        if (!this.selected) {
          throw new Error('no selected unit');
        }
        const unit = project.findUnit(data.unit);
        if (!unit) {
          throw new Error('no unit');
        }
        const chain = this.selected.createChain();
        unit.bindEvent(data.name, chain);
        this.$makeDirty();
      }
    },
    events() {
      const sel = this.selected;
      if (!sel) {
        return [];
      }
      const units = [project, ...Object.values(project.devices)];
      if (units.findIndex((e) => e.uuid === sel.uuid) === -1) {
        units.splice(0, 0, sel);
      }
      const ls: { unit: Unit; name: string; event: Event; count: number }[] = [];
      const count = (un: Unit, ev: Event) => {
        const iv = un === sel ? 10 : 1;
        return iv * ev.chains.reduce((pv, cv) => (cv.unit.uuid == sel.uuid ? pv + 1 : pv), 0);
      };
      units.forEach((e) => {
        ls.push(...Object.entries(e.events).map((ev) => ({ unit: e, name: ev[0], event: ev[1], count: count(e, ev[1] as any) } as any)));
      });
      ls.sort((a, b) => b.count - a.count);
      return ls;
    },
    drawEvents(canvas: SVG.Doc): { width: number; height: number; events: Record<string, SVG.G> } {
      const itMargin = 20;
      let x = eventsPadding.x;
      let y = eventsPadding.y;
      let maxHeight = 0;
      const events: any = {};
      for (const it of this.events()) {
        const { unit, name } = it as { unit: Unit; name: string; event: Event };
        const unName = t(`nm.${unit.name}`, unit.name);
        const evName = t(`ev.${it.event.label || name}`, name);
        const text = canvas.plain(`${unName}.${evName}`).addClass('it-event-title').attr({
          'dominant-baseline': 'middle',
        });
        const rect = canvas
          .rect(text.bbox().width + textPadding.x * 2, text.bbox().height + textPadding.y * 2)
          .addClass('it-block')
          .addClass('it-theme-event');
        const { width, height } = rect.bbox();
        rect.radius(height / 2);
        text.x(width / 2);
        text.attr({
          x: width / 2,
          y: height / 2,
          height,
        });
        const group = canvas.group();
        makeDraggable(rect, (ev: DragEvent) => {
          fillDragEvent(ev, unit, name);
        });
        group.id(`event.${unit.name}.${name}`);
        group.add(rect);
        group.add(text);
        group.translate(x, y);
        x += width + itMargin;
        if (maxHeight < height) {
          maxHeight = height;
        }
        events[group.id()] = group;
      }
      return {
        width: x + eventsPadding.x - itMargin,
        height: y + maxHeight + eventsPadding.y,
        events,
      };
    },
    draw(canvas: SVG.Doc) {
      let { width } = (this.$el as HTMLElement).getBoundingClientRect();
      canvas.clear();
      Canvas.defs(canvas);
      const rs = this.drawEvents(canvas);
      rs.height += 1;
      const cn = Canvas.drawChains(canvas, this.selected?.chains || [], rs.height, this.visibles, () => {
        this.draw(this.svg);
      });
      const links: any = {};
      for (const [key, it] of Object.entries(rs.events)) {
        links[key] = {
          event: it,
          to: cn.events[key] || [],
        };
      }
      Canvas.drawLinks(canvas, links);
      const maxWidth = Math.max(width, rs.width, cn.width + 300);
      canvas.line(0, rs.height, maxWidth, rs.height).stroke({ width: 1, color: '#eee' }).style({ opacity: 0.5 });
      rs.height += cn.height;
      const height = Math.max(this.$el.clientHeight || 0, rs.height);
      this.$refs.root.setAttribute('width', `${maxWidth}px`);
      this.$refs.root.setAttribute('height', `${height}px`);
    },
  },
  mounted() {
    const canvas = SVG(this.$refs.root);
    this.svg = canvas;
    this.draw(canvas);
    hookDrop(canvas, this.onDrop);
    this.$el.ondrop = this.onDrop;
  },
};
</script>
<style>
.it-block {
  fill: none;
  cursor: pointer;
}
.it-block[dragging='true'] {
  stroke: chocolate;
  fill: coral;
}
.it-block[isdragover='true'] {
  stroke: chocolate;
  fill: coral;
}
.it-block-title {
  fill: #fff;
  font-size: 14px;
  font-family: 'sans-serif';
  font-weight: bold;
  pointer-events: none;
}
.it-slot-text {
  fill: #222;
  font-size: 14px;
  font-family: 'sans-serif';
  font-weight: bold;
  pointer-events: none;
  text-anchor: middle;
}
.it-event-title {
  fill: #fff;
  text-anchor: middle;
  font-size: 14px;
  font-family: 'sans-serif';
  font-weight: bold;
  pointer-events: none;
}
.it-theme-event {
  stroke: #cc7700;
  fill: #ff9900;
}
.it-theme-action {
  stroke: rgb(51, 115, 204);
  fill: rgb(76, 151, 255);
}
.it-theme-logic {
  stroke: rgb(119, 77, 203);
  fill: rgb(153, 102, 255);
}
.it-theme-math {
  stroke: rgb(56, 148, 56);
  fill: rgb(89, 192, 89);
}
.it-theme-holder {
  stroke: rgb(0, 153, 0);
  fill: rgb(255, 255, 255);
}
.it-theme-slot {
  stroke: rgb(46, 142, 184);
  fill: rgb(255, 255, 255);
}
.it-theme-event-name {
  stroke: #cc7700;
  fill: rgb(255, 255, 255);
}
.it-linker-line {
  stroke: rgb(204, 153, 0);
  fill: none;
  animation: line-animation 1s linear infinite;
  stroke-width: 2px;
}
@keyframes line-animation {
  0% {
    stroke-dashoffset: 12;
  }

  100% {
    stroke-dashoffset: 0;
  }
}
</style>
