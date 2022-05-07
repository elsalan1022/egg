import SVG from 'svg.js';
import { Block, BlockChain, Slot, Unit } from "egg";
import { Storage } from 'egg/src/devs/storage';
import Shapes, { arrowHeight, leftSideWidth, minBlockHeight, minBlockWidth, minSlotHeight, minSlotWidth } from './index';
import store, { project, setVar } from '../../store/index';
import { hookDrop, makeDraggable } from '../../utils/dragable';
import { fillDragAction, fillDragBlock, fillDragLinker, parseDragEvent } from '../../actions/drag';
import { t } from '../../i18n';

type Size = {
  width: number;
  height: number;
};

type DrawResult = Size & {
  g: SVG.G;
};

const bodyPadding = {
  x: 20,
  y: 60,
};

const chainPadding = {
  x: 40,
  y: 0,
};

const blockPadding = {
  x: 6,
  y: 6,
}

const textMargin = {
  x: 4,
  y: 4,
};

const slotTop = minBlockHeight / 2 - minSlotHeight / 2;

const slotMargin = 4;

export default {
  defs(canvas: SVG.Doc): SVG.Defs {
    const defs = canvas.defs();
    defs.marker(10, 10, function (marker) {
      marker.path('M2,2 L8,5 L2,8 L5,5 L2,2').fill('rgb(204, 153, 0)');
    }).ref(8, 5).attr({
      orient: 'auto',
    }).id('bezier-arrow').style({
      'stroke-width': '1px',
    });
    defs.marker(8, 8, function (marker) {
      marker.circle(3).cx(5).cy(5).fill('rgb(204, 153, 0)');
    }).ref(5, 5).id('dot').style({
      stroke: 'none',
    });
    return defs;
  },
  redraw() {
    store.state.revision++;
  },
  drawSlot(canvas: SVG.Doc, uint: Unit, chain: BlockChain, stack: Array<Block>, it: Slot): DrawResult {
    const group = canvas.group();
    const rs: DrawResult = {
      g: group,
      width: minSlotWidth,
      height: minSlotHeight,
    };
    let x = 0;
    if (it.prefix && it.data) {
      const text = canvas.text(t(it.prefix)).addClass('it-block-title');
      text.y(minBlockHeight / 2 - text.bbox().height / 2);
      x += text.bbox().width + textMargin.x;
      group.add(text);
    }
    if ((it as any).isLabelOnly) {
      const text = canvas.text(it.label || '').addClass('it-block-title');
      text.y(minBlockHeight / 2 - text.bbox().height / 2);
      text.x(x);
      group.add(text);
      x += text.bbox().width + textMargin.x;
    } else if (it.block) {
      stack.push(it.block);
      const { width, height } = this.drawBlocks(canvas, uint, chain, it.block, stack, group, 0, it, !!it.data);
      stack.pop();
      // group.add(g);
      // g.translate(x, 0);
      x += width + textMargin.x;
      rs.height = Math.max(rs.height, height);
    } else if (it.data) {
      // is data slot
      let textValue = it.data.value;
      if (it.data.values) {
        const filterItem = it.data.values?.find((e: any) => e.value === textValue) as any;
        if (filterItem?.label) {
          textValue = t(`vs.${filterItem.label}`);
        }
      }
      const text = canvas.text(textValue || '').addClass('it-slot-text');
      text.y(minBlockHeight / 2 - text.bbox().height / 2);
      text.x(textMargin.x);
      const cg = Shapes.dataSlot(canvas, text.bbox().width + textMargin.x * 2, minSlotHeight).addClass('it-theme-slot');
      cg.x(x).y(slotTop);
      text.x(x + cg.width() / 2);
      group.add(cg);
      group.add(text);
      x += cg.width() + textMargin.x;
      if (chain) {
        cg.click(() => {
          setVar({ scope: 'slot', type: it.data?.type || 'unknown', name: it.name, slot: it, stack: [...stack] });
        });
        hookDrop(cg, (ev: DragEvent) => {
          const data = parseDragEvent(ev);
          if (!data) {
            throw new Error('no data transfer');
          }
          if (data.type === 'action') {
            const unit = project.findUnit(data.unit);
            if (!unit) {
              throw new Error('no unit');
            }
            const cls = unit.actions[data.action];
            if (cls.type !== 'data') {
              const action = unit.createAction(data.action);
              if (!action.output) {
                throw new Error('not data action');
              }
              it.block = action;
            } else {
              it.block = unit.createAction(data.action);
            }
            it.block.chain = chain;
            this.redraw();
          } else if (data.type === 'var') {
            const storage = project.devices['storage'] as Storage;
            const action = storage.createAction('get') as any;
            action.slots.name.data.value = data.name;
            it.block = action;
            action.chain = chain;
            this.redraw();
          } else {
            console.log(ev);
          }
        });
      }
    } else if (chain) {
      const holder = this.drawBlockHolder(canvas);
      holder.x(x);
      const { width, height } = holder.bbox()
      x += width + textMargin.x;
      rs.height = Math.max(rs.height, height) - arrowHeight;
      group.add(holder);
      hookDrop(holder, (ev: DragEvent) => {
        const data = parseDragEvent(ev);
        if (!data) {
          throw new Error('no data transfer');
        }
        if (data.type === 'action') {
          const unit = project.findUnit(data.unit);
          if (!unit) {
            throw new Error('no unit');
          }
          it.block = unit.createAction(data.action);
          it.block.chain = chain;
          this.redraw();
        } else if (data.type === 'block') {
          // move block
          const unitFrom = project.findUnit(data.unit);
          if (!unitFrom) {
            throw new Error('no unit');
          }
          const chainFrom = unitFrom.chains[data.chain];
          const itMove = unitFrom.findBlock(chainFrom, data.block);
          if (itMove) {
            unitFrom.removeBlock(chainFrom, itMove);
            it.block = itMove;
            itMove.chain = chain;
            this.redraw();
          } else {
            throw new Error('no block');
          }
        } else {
          console.log(ev);
        }
      });
    }
    if (it.suffix) {
      const text = canvas.text(t(it.suffix)).addClass('it-block-title');
      text.y(minBlockHeight / 2 - text.bbox().height / 2);
      text.x(x);
      x += text.bbox().width + textMargin.x;
      group.add(text);
    }
    rs.width = Math.max(rs.width, x);
    return rs;
  },
  drawBlockHolder(canvas: SVG.Doc): SVG.Path {
    return Shapes.block(canvas, 0).addClass('it-block').addClass('it-theme-holder').attr({
      'stroke-width': '1px',
      'stroke-dasharray': '2,2',
    });
  },
  drawBlock(canvas: SVG.Doc, unit: Unit, chain: BlockChain, it: Block, stack: Array<Block>, slot?: Slot, dataMode?: boolean): DrawResult {
    const rs: DrawResult = {
      g: null as any,
      width: minBlockWidth,
      height: minBlockHeight,
    };
    let maxX = 0;
    const slots: any[] = [];
    /**
     * format: actiononly | composes + ending
     * actiononly = action
     * composes = compose[]
     * compose = pre + action
     */
    const heights: Array<number> = [];
    /** convert to lines and make title as a special label slot */
    const unName = t(`nm.${it.callee.name}`, it.callee.name);
    const atName = t(`at.${it.label || it.name}`, it.label || it.name);
    const lines: Array<Slot[]> = [[{
      isLabelOnly: true,
      label: `${unName}.${atName}`,
    } as any]];
    for (const slot of Object.values(it.slots)) {
      const last = lines[lines.length - 1];
      if (slot.data) {
        last.push(slot);
      } else {
        if (slot.prefix) {
          last.push({
            isLabelOnly: true,
            label: t(slot.prefix),
          } as any);
        }
        lines.push([slot], []);
      }
    }
    if (dataMode && lines.length > 1) {
      throw new Error('only data type block can be in data slot');
    }
    let y = 0;
    let lineIndex = 0;
    for (const line of lines) {
      let x = lineIndex % 2 ? leftSideWidth : blockPadding.x;
      lineIndex++;
      let maxHeight = 0;
      for (const slot of line) {
        if ((slot as any).isLabelOnly && !slot.label) {
          continue;
        }
        const { g: slotIt, width, height } = this.drawSlot(canvas, unit, chain, stack, slot);
        slotIt.translate(x, y);
        slots.push(slotIt);
        const rlHeight = Math.max(height, minBlockHeight);
        maxHeight = Math.max(maxHeight, rlHeight);
        x += width + slotMargin;
      }
      y += maxHeight || minBlockHeight;
      heights.push(maxHeight);
      if (maxX < x) {
        maxX = x;
      }
    }

    const themeName = ['logic', 'math'].find(n => n === it.callee.name) || 'action';
    const b = (dataMode ? Shapes.dataSlot(canvas, maxX, heights[0]) : Shapes.block(canvas, maxX, heights, it.ending)).addClass(`it-theme-${themeName}`).addClass('it-block');

    const { height } = b.bbox();

    makeDraggable(b, (ev: DragEvent) => {
      if (!ev.dataTransfer) {
        return;
      }
      if (chain) {
        fillDragBlock(ev, chain, it);
      } else {
        fillDragAction(ev, unit, it.name);
      }
    }, (ev: DragEvent) => {
      if (!ev.dataTransfer) {
        return;
      }
      if (ev.dataTransfer.getData('unhandled')) {
        const bid = ev.dataTransfer.getData('block');
        const any = slot as any;
        let b: Block | undefined = any.block;
        let p = b;
        while (b && b.id !== bid) {
          p = b;
          b = b.next;
        }
        if (!p || !b) {
          throw new Error('no block');
        }
        if (p === b) {
          any.block = null;
        } else {
          (p as any).next = b.next;
        }
        this.redraw();
      }
    });

    const group = canvas.group();
    group.add(b);
    for (const slot of slots) {
      group.add(slot);
    }
    rs.g = group;
    rs.width = Math.max(rs.width, maxX);
    rs.height = Math.max(rs.height, y, height);
    if (!it.ending) {
      rs.height -= arrowHeight;
    }
    return rs;
  },
  drawBlocks(canvas: SVG.Doc, unit: Unit, chain: BlockChain, it: Block, stack: Array<Block>, g: SVG.G, yOffset: number, slot?: Slot, dataMode?: boolean): Size {
    const rs: Size = {
      width: minBlockWidth,
      height: minBlockHeight,
    };
    let y = yOffset;
    let maxWidth = 0;
    let isEnding = false;
    let block: Block | undefined = it;
    let tail = block;
    while (block) {
      stack.push(block);
      const { g: it, height, width } = this.drawBlock(canvas, unit, chain, block, stack, slot, dataMode);
      stack.pop();
      it.translate(0, y);
      g.add(it);
      y += height;
      if (maxWidth < width) {
        maxWidth = width;
      }
      // y += height - arrowHeight;
      isEnding = isEnding || !!block.ending;
      tail = block;
      block = block.next;
      if (dataMode && block) {
        throw new Error('data mode can only have one block');
      }
    }

    if (tail && !dataMode && !isEnding) {
      const it = this.drawBlockHolder(canvas);
      it.translate(0, y);
      g.add(it);
      const { height, width } = it.bbox();
      y += height;// - arrowHeight;
      if (maxWidth < width) {
        maxWidth = width;
      }

      hookDrop(it, (ev: DragEvent) => {
        const data = parseDragEvent(ev);
        if (!data) {
          throw new Error('no data transfer');
        }
        if (data.type === 'action') {
          const unit = project.findUnit(data.unit);
          if (!unit) {
            throw new Error('no unit');
          }
          const block = unit.createAction(data.action);
          (tail as any).next = block;
          block.chain = chain;
          this.redraw();
        } else if (data.type === 'block') {
          // move block
          const unit = project.findUnit(data.unit);
          if (!unit) {
            throw new Error('no unit');
          }
          const chainFrom = unit.chains[data.chain];
          const next = unit.findBlock(chainFrom, data.block);
          if (next) {
            unit.removeBlock(chainFrom, next);
            if (tail) {
              (tail as any).next = next;
            } else {
              chain.head = next;
            }
            next.chain = chain;
            this.redraw();
          } else {
            throw new Error('no block');
          }
        } else {
          console.log(ev);
        }
      });
    }
    if (!dataMode) {
      y -= arrowHeight;
    }
    rs.width = Math.max(rs.width, maxWidth);
    rs.height = Math.max(rs.height, y - yOffset);
    return rs;
  },
  drawChainHead(canvas: SVG.Doc, chain: BlockChain, visibles: Record<string, boolean>, cb: () => void): DrawResult {
    const group = canvas.group();
    const { unit, id, bound } = chain;
    let subEvents: any = null;
    if (bound) {
      const event = bound.unit.events[bound.event];
      if (event.params.name) {
        subEvents = event.params.name.values;
      }
    }

    const isVisible = visibles[id] === false ? false : true;
    const text = canvas.plain(isVisible ? '-' : '+').addClass('it-block-title');
    const linker = Shapes.chainStart(canvas, 0, subEvents?.length ? minBlockHeight : 0).addClass('it-block').addClass('it-theme-event');
    linker.id(`chain.${id}`);
    if (subEvents) {
      text.y(minBlockHeight - text.bbox().height / 2);
      text.x(24);

      // is data slot
      const filterItem = subEvents?.find((it: any) => it.value === bound?.filter);
      const filterValue = filterItem?.label || bound?.filter;
      const filter = canvas.text(filterValue ? t(`vs.${filterValue}`) : t('all')).addClass('it-slot-text').x(textMargin.x);
      filter.y(minBlockHeight / 2 - filter.bbox().height / 2);
      const slotWidth = Math.max(minBlockWidth - textMargin.x * 2, filter.bbox().width + textMargin.x * 2);
      const cg = Shapes.dataSlot(canvas, slotWidth, minSlotHeight).addClass('it-theme-event-name');
      cg.x(textMargin.x).y(slotTop);
      filter.x(textMargin.x + cg.width() / 2);
      group.add(linker);
      group.add(text);
      group.add(cg);
      group.add(filter);

      cg.click(() => {
        const pxy = new Proxy({
          type: 'string',
          values: subEvents,
        }, {
          get(target: any, p: string | symbol, receiver: any): any {
            if (p === 'value') {
              return bound?.filter;
            }
            return Reflect.get(target, p, receiver);
          },
          set(target: any, p: string | symbol, value: any, receiver: any): boolean {
            if (bound && p === 'value') {
              bound.filter = value;
              cb();
              return true;
            }
            return Reflect.set(target, p, value, receiver);
          },
        }) as any;
        setVar({
          scope: 'slot', type: 'string', name: 'name', slot: {
            name: 'name',
            data: pxy
          }
        });
      });

      if (bound?.filter) {
        cg.dblclick(() => {
          if (bound) {
            bound.filter = undefined;
            cb();
          }
        });
      }
    } else {
      text.x(24).y(0);
      group.add(linker);
      group.add(text);
    }
    hookDrop(linker, (ev: DragEvent) => {
      const data = parseDragEvent(ev);
      if (!data) {
        throw new Error('no data transfer');
      }
      if (data.type === 'event') {
        const unit = project.findUnit(data.unit);
        if (!unit) {
          throw new Error('no unit');
        }
        unit.bindEvent(data.name, chain);
        this.redraw();
      } else {
        console.log(ev);
      }
    });
    linker.click(() => {
      visibles[id] = !isVisible;
      cb();
    });

    makeDraggable(linker, (ev: DragEvent) => {
      fillDragLinker(ev, unit, chain);
    });

    return {
      width: linker.bbox().width,
      height: linker.bbox().height,
      g: group,
    };
  },
  drawChains(canvas: SVG.Doc, chains: Array<BlockChain>, yOffset: number, visibles: Record<string, boolean>, cb: () => void): Size & {
    events: Record<string, Array<SVG.G>>;
  } {
    let x = bodyPadding.x + chainPadding.x;
    let maxHeight = 0;
    const events: any = {};

    yOffset += bodyPadding.y;

    for (const chain of Object.values(chains)) {
      const { unit, id, bound } = chain;

      const isVisible = visibles[id] === false ? false : true;

      const chainGroup = canvas.group();
      chainGroup.translate(x, yOffset);

      let y = 0;

      const hdrs = this.drawChainHead(canvas, chain, visibles, cb);

      chainGroup.add(hdrs.g);

      y += hdrs.height - arrowHeight;

      if (bound) {
        const eventName = `event.${bound.unit.name}.${bound.event}`;
        const ls = events[eventName] || (events[eventName] = []);
        ls.push(hdrs.g);
      }

      let maxWidth = 0;
      let isEnding = false;
      let block = chain.head;
      let tail = block;
      while (isVisible && block) {
        const { g: it, height, width } = this.drawBlock(canvas, unit, chain, block, [block]);
        it.translate(0, y);
        chainGroup.add(it);
        y += height;
        if (maxWidth < width) {
          maxWidth = width;
        }
        // y += height - arrowHeight;
        isEnding = isEnding || !!block.ending;
        tail = block;
        block = block.next;
      }

      if (isVisible && !isEnding) {
        const it = this.drawBlockHolder(canvas);
        it.translate(0, y);
        chainGroup.add(it);
        const { height } = it.bbox();
        y += height;// - arrowHeight;

        hookDrop(it, (ev: DragEvent) => {
          const data = parseDragEvent(ev);
          if (!data) {
            throw new Error('no data transfer');
          }
          if (data.type === 'action') {
            const unit = project.findUnit(data.unit);
            if (!unit) {
              throw new Error('no unit');
            }
            const block = unit.createAction(data.action);
            unit.appendBlock(chain, block);
            this.redraw();
          } else if (data.type === 'block') {
            // move block
            const unit = project.findUnit(data.unit);
            if (!unit) {
              throw new Error('no unit');
            }
            const chainFrom = unit.chains[data.chain];
            const next = unit.findBlock(chainFrom, data.block);
            if (next) {
              unit.removeBlock(chainFrom, next);
              if (tail) {
                (tail as any).next = next;
              } else {
                chain.head = next;
              }
              next.chain = chain;
              this.redraw();
            } else {
              throw new Error('no block');
            }
          } else {
            console.log(ev);
          }
        });
      }

      if (y > maxHeight) {
        maxHeight = y;
      }
      x += chainGroup.bbox().width + chainPadding.x;
    }
    return {
      width: x + bodyPadding.x,
      height: maxHeight + bodyPadding.y * 2,
      events,
    };
  },
  drawLinks(canvas: SVG.Doc, events: Record<string, { event: SVG.G; to: Array<SVG.G> }>): void {
    for (const { event, to } of Object.values(events)) {
      for (const it of to) {
        const line = Shapes.link(canvas, event, it);
        line.attr({
          'marker-start': 'url(#dot)',
          'marker-end': 'url(#bezier-arrow)',
          'stroke-dasharray': '8,4',
          fill: 'none',
        });
        line.addClass('it-linker-line');
      }
    }
  },
  drawBlockList(canvas: SVG.Doc, bocks: Array<Block>, padding?: { x: number, y: number, gapy: number }): Size {
    padding = padding || { x: 0, y: 0, gapy: 8 };

    const chainGroup = canvas.group();
    chainGroup.translate(padding.x, padding.y);

    const x = padding.x;
    let y = padding.y;

    let maxWidth = 0;

    for (const block of bocks) {
      const { g: it, height, width } = this.drawBlock(canvas, block.callee, null as any, block, [block]);
      it.translate(x, y);
      chainGroup.add(it);
      y += height + padding.gapy;
      if (maxWidth < width) {
        maxWidth = width;
      }
    }
    return {
      width: padding.x * 2 + maxWidth,
      height: y + padding.y,
    };
  },
};
