import { Block, BlockChain, Unit } from "egg";

export type DragObjectType = 'type' | 'unit' | 'block' | 'action' | 'var' | 'event' | 'linker' | 'material' | 'texture' | 'class';

type DragDataType = {
  type: 'type';
  name: string;
  from: string;
}

export function fillDragType(ev: DragEvent, name: string, from: string) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'type');
  ev.dataTransfer.setData('name', name);
  ev.dataTransfer.setData('from', from);
}


type DragDataUnit = {
  type: 'unit';
  uuid: UUID;
}

export function fillDragUnit(ev: DragEvent, uuid: GUID) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'unit');
  ev.dataTransfer.setData('uuid', uuid);
}

type DragDataBlock = {
  type: 'block';
  unit: UUID;
  chain: GUID;
  block: GUID;
}

export function fillDragBlock(ev: DragEvent, chain: BlockChain, block: Block) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'block');
  ev.dataTransfer.setData('unit', chain.unit.uuid);
  ev.dataTransfer.setData('chain', chain.id);
  ev.dataTransfer.setData('block', block.id);
}

type DragDataAction = {
  type: 'action';
  unit: UUID;
  action: string;
}

export function fillDragAction(ev: DragEvent, unit: Unit, name: string) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'action');
  ev.dataTransfer.setData('unit', unit.uuid);
  ev.dataTransfer.setData('action', name);
}

type DragDataVar = {
  type: 'var';
  name: string;
}

export function fillDragVar(ev: DragEvent, name: string) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'var');
  ev.dataTransfer.setData('name', name);
}

type DragDataEvent = {
  type: 'event';
  unit: UUID;
  name: string;
}

export function fillDragEvent(ev: DragEvent, unit: Unit, name: string) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'event');
  ev.dataTransfer.setData('unit', unit.uuid);
  ev.dataTransfer.setData('name', name);
}

type DragDataLinker = {
  type: 'linker';
  unit: UUID;
  chain: GUID;
}

export function fillDragLinker(ev: DragEvent, unit: Unit, chain: BlockChain) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'linker');
  ev.dataTransfer.setData('unit', unit.uuid);
  ev.dataTransfer.setData('chain', chain.id);
}

type DragDataMaterial = {
  type: 'material';
  uuid: GUID;
}

export function fillDragMaterial(ev: DragEvent, uuid: GUID) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'material');
  ev.dataTransfer.setData('uuid', uuid);
}

type DragDataTexture = {
  type: 'texture';
  uuid: GUID;
}

export function fillDragTexture(ev: DragEvent, uuid: GUID) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'texture');
  ev.dataTransfer.setData('uuid', uuid);
}

type DragDataClass = {
  type: 'class';
  name: string;
}

export function fillDragClass(ev: DragEvent, name: string) {
  if (!ev.dataTransfer) {
    throw new Error('no dataTransfer');
  }
  ev.dataTransfer.setData('type', 'class');
  ev.dataTransfer.setData('name', name);
}

type DragData = DragDataType | DragDataUnit | DragDataBlock | DragDataAction | DragDataVar | DragDataEvent
  | DragDataLinker | DragDataMaterial | DragDataTexture | DragDataClass;

export function parseDragEvent(ev: DragEvent): DragData | undefined {
  if (!ev.dataTransfer) {
    return undefined;
  }
  const type = ev.dataTransfer.getData('type');
  if (!type) {
    return undefined;
  }
  switch (type) {
    case 'type':
      return {
        type: 'type',
        name: ev.dataTransfer.getData('name'),
        from: ev.dataTransfer.getData('from'),
      };
    case 'unit':
      return {
        type: 'unit',
        uuid: ev.dataTransfer.getData('uuid'),
      };
    case 'block':
      return {
        type: 'block',
        unit: ev.dataTransfer.getData('unit'),
        chain: ev.dataTransfer.getData('chain'),
        block: ev.dataTransfer.getData('block'),
      };
    case 'action':
      return {
        type: 'action',
        unit: ev.dataTransfer.getData('unit'),
        action: ev.dataTransfer.getData('action'),
      };
    case 'var':
      return {
        type: 'var',
        name: ev.dataTransfer.getData('name'),
      };
    case 'event':
      return {
        type: 'event',
        unit: ev.dataTransfer.getData('unit'),
        name: ev.dataTransfer.getData('name'),
      };
    case 'linker':
      return {
        type: 'linker',
        unit: ev.dataTransfer.getData('unit'),
        chain: ev.dataTransfer.getData('chain'),
      };
    case 'material':
      return {
        type: 'material',
        uuid: ev.dataTransfer.getData('uuid'),
      };
    case 'texture':
      return {
        type: 'texture',
        uuid: ev.dataTransfer.getData('uuid'),
      };
    case 'class':
      return {
        type: 'class',
        name: ev.dataTransfer.getData('name'),
      };
  }
  return undefined;
}
