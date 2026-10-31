import { ItemDef } from '../combat/types';
/** R14 城镇/消耗品新物品（单独文件，避免大改 items.ts）。效果数值原版未查到 → [适配]，见 docs/towns-npcs-official.md */
const P = 'assets/potions/', I = 'assets/items/';
export const TOWN_ITEMS: Record<string, ItemDef> = {
  hp_strong: { id: 'hp_strong', name: '强效金创药', icon: 'assets/items/hp_strong.png', price: 30 },
  mp_strong: { id: 'mp_strong', name: '强效魔法药', icon: 'assets/items/mp_strong.png', price: 30 },
  sun_water: { id: 'sun_water', name: '太阳水', icon: 'assets/items/sun_water.png', price: 40 },
  return_scroll: { id: 'return_scroll', name: '回城卷', icon: 'assets/items/return_scroll.png', price: 10 },
  dungeon_scroll: { id: 'dungeon_scroll', name: '地牢逃脱卷', icon: 'assets/items/dungeon_scroll.png', price: 7 },
  woma_horn: { id: 'woma_horn', name: '沃玛号角', icon: 'assets/items/woma_horn.png', price: 20 },
};
/** 背包消耗品效果 [适配] */
export const CONSUMABLE: Record<string, { hp?: number; mp?: number; town?: 'bichi' | 'region' }> = {
  hp_strong: { hp: 600 }, mp_strong: { mp: 480 }, sun_water: { hp: 300, mp: 200 },
  return_scroll: { town: 'bichi' }, dungeon_scroll: { town: 'region' },
};
