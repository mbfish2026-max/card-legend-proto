import { ItemDef, Slot } from '../combat/types';
// 物品表：中文名 + 图标。equip=基础属性；req=需求等级；price=出售价（商人收购价）
const I = 'assets/items/';
export const SLOTS: Slot[] = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'bracelet', 'boots'];
export const SLOT_NAMES: Record<Slot, string> = { weapon: '武器', helmet: '头盔', armor: '衣服', necklace: '项链', ring: '戒指', bracelet: '手镯', boots: '靴子' };
export const STAT_NAMES: Record<string, string> = { hp: '生命', mp: '魔法值', atk: '攻击', mag: '魔法', tao: '道术', def: '防御' };
export const ITEMS: Record<string, ItemDef> = {
  hp_small: { id: 'hp_small', name: '金创药(小量)', icon: 'assets/potions/INV_Potion_51.png', potion: 0 },
  hp_mid: { id: 'hp_mid', name: '金创药(中量)', icon: 'assets/potions/INV_Potion_54.png', potion: 1 },
  mp_small: { id: 'mp_small', name: '魔法药(小量)', icon: 'assets/potions/INV_Potion_72.png', potion: 2 },
  mp_mid: { id: 'mp_mid', name: '魔法药(中量)', icon: 'assets/potions/INV_Potion_75.png', potion: 3 },
  // 祝福油：武器幸运 +1（上限 7），有几率诅咒（参考传奇规则，重新实现）
  bless_oil: { id: 'bless_oil', name: '祝福油', icon: I + 'INV_Misc_Gem_Pearl_01.png', price: 50 },
  gold: { id: 'gold', name: '金币', icon: I + 'INV_Misc_Coin_01.png' },
  // 杂物（可卖）
  chicken: { id: 'chicken', name: '鸡肉', icon: I + 'INV_Misc_Food_15.png', price: 3 },
  meat: { id: 'meat', name: '鹿肉', icon: I + 'INV_Misc_Food_14.png', price: 4 },
  bone: { id: 'bone', name: '骷髅骨头', icon: I + 'INV_Misc_Bone_01.png', price: 6 },
  // 武器
  wood_sword: { id: 'wood_sword', name: '木剑', icon: I + 'INV_Sword_01.png', slot: 'weapon', equip: { atk: 6, mag: 3, tao: 3 }, req: 1, price: 10 },
  iron_sword: { id: 'iron_sword', name: '铁剑', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 14 }, req: 4, price: 30 },
  magic_staff: { id: 'magic_staff', name: '魔杖', icon: I + 'INV_Sword_03.png', slot: 'weapon', equip: { mag: 16, atk: 3 }, req: 6, price: 45 },
  tao_sword: { id: 'tao_sword', name: '银蛇剑', icon: I + 'INV_Sword_04.png', slot: 'weapon', equip: { tao: 14, atk: 6 }, req: 6, price: 45 },
  dragon_sword: { id: 'dragon_sword', name: '屠龙刀', icon: I + 'INV_Sword_05.png', slot: 'weapon', equip: { atk: 45, mag: 20, tao: 20 }, req: 15, price: 300 },
  // 防具
  helmet: { id: 'helmet', name: '青铜头盔', icon: I + 'INV_Helmet_01.png', slot: 'helmet', equip: { def: 4, hp: 20 }, req: 3, price: 20 },
  bone_helm: { id: 'bone_helm', name: '骷髅头盔', icon: I + 'INV_Helmet_03.png', slot: 'helmet', equip: { def: 9, hp: 50 }, req: 10, price: 60 },
  cloth: { id: 'cloth', name: '布衣', icon: I + 'INV_Chest_Plate01.png', slot: 'armor', equip: { def: 5, hp: 30 }, req: 1, price: 12 },
  armor: { id: 'armor', name: '重盔甲', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 16, hp: 120 }, req: 12, price: 150 },
  pearl: { id: 'pearl', name: '黑珍珠项链', icon: I + 'gen_necklace.png', slot: 'necklace', equip: { atk: 5, mag: 5, tao: 5 }, req: 5, price: 40 },
  iron_ring: { id: 'iron_ring', name: '铁戒指', icon: I + 'INV_Jewelry_Ring_01.png', slot: 'ring', equip: { atk: 3, hp: 20 }, req: 2, price: 15 },
  gold_ring: { id: 'gold_ring', name: '金戒指', icon: I + 'INV_Jewelry_Ring_03.png', slot: 'ring', equip: { atk: 8, mag: 8, tao: 8 }, req: 9, price: 70 },
  bracelet: { id: 'bracelet', name: '翡翠手镯', icon: I + 'gen_bracelet.png', slot: 'bracelet', equip: { def: 3, hp: 30 }, req: 4, price: 25 },
  boots: { id: 'boots', name: '铁靴', icon: I + 'gen_boots.png', slot: 'boots', equip: { def: 4, hp: 25 }, req: 3, price: 20 },
};
