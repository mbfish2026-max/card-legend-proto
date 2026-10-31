import { EquipSlot, ItemDef, Slot } from '../combat/types';
import { CLASSES } from './classes';
import { BOOKS, bookItemId } from './books';
// 物品表：中文名 + 图标。equip=基础属性；req=需求等级；price=出售价（商人收购价）
const I = 'assets/items/';
export const SLOTS: Slot[] = ['weapon', 'helmet', 'armor', 'necklace', 'ring', 'bracelet', 'boots'];
export const SLOT_NAMES: Record<Slot, string> = { weapon: '武器', helmet: '头盔', armor: '衣服', necklace: '项链', ring: '戒指', bracelet: '手镯', boots: '靴子' };
/** 穿戴位：戒指×2、手镯×2（热血传奇官方穿戴位） */
export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'helmet', 'armor', 'necklace', 'ring1', 'ring2', 'bracelet1', 'bracelet2', 'boots'];
export const EQUIP_SLOT_NAMES: Record<EquipSlot, string> = { weapon: '武器', helmet: '头盔', armor: '衣服', necklace: '项链', ring1: '左戒指', ring2: '右戒指', bracelet1: '左手镯', bracelet2: '右手镯', boots: '靴子' };
/** 物品部位 → 可放入的穿戴位（按优先顺序） */
export function equipSlotsFor(k: Slot): EquipSlot[] { return k === 'ring' ? ['ring1', 'ring2'] : k === 'bracelet' ? ['bracelet1', 'bracelet2'] : [k]; }
/** 存档装备结构版本：2 = 双戒双镯 */
export const EQUIP_VERSION = 2;
export const STAT_NAMES: Record<string, string> = { hp: '生命', mp: '魔法值', atk: '攻击', mag: '魔法', tao: '道术', def: '防御' };
export const ITEMS: Record<string, ItemDef> = {
  hp_small: { id: 'hp_small', name: '金创药(小量)', icon: 'assets/potions/INV_Potion_51.png', potion: 0 },
  hp_mid: { id: 'hp_mid', name: '金创药(中量)', icon: 'assets/potions/INV_Potion_54.png', potion: 1 },
  mp_small: { id: 'mp_small', name: '魔法药(小量)', icon: 'assets/potions/INV_Potion_72.png', potion: 2 },
  mp_mid: { id: 'mp_mid', name: '魔法药(中量)', icon: 'assets/potions/INV_Potion_75.png', potion: 3 },
  // 祝福油：武器幸运 +1（上限 7），有几率诅咒（参考传奇规则，重新实现）
  bless_oil: { id: 'bless_oil', name: '祝福油', icon: I + 'bless_oil.png', price: 50 },
  // 黑铁矿石：强化武器/头盔/衣服/靴子（手机版规则简化，见 World.enhanceWithIron）
  black_iron: { id: 'black_iron', name: '黑铁矿石', icon: I + 'black_iron.png', price: 20 },
  // 套装（R2，参考传奇沃玛/祖玛/赤月套装概念，数值为本作重新设计）。图标为占位副本，美术交付后同名替换
  set_woma_helm: { id: 'set_woma_helm', name: '沃玛头盔', icon: I + 'set_woma_helm.png', slot: 'helmet', equip: { def: 10, hp: 60 }, req: 14, price: 90, set: 'woma' },
  set_woma_necklace: { id: 'set_woma_necklace', name: '沃玛项链', icon: I + 'set_woma_necklace.png', slot: 'necklace', equip: { atk: 7, mag: 7, tao: 7 }, req: 14, price: 90, set: 'woma' },
  set_woma_bracelet: { id: 'set_woma_bracelet', name: '沃玛手镯', icon: I + 'set_woma_bracelet.png', slot: 'bracelet', equip: { def: 5, hp: 50 }, req: 14, price: 90, set: 'woma' },
  set_zuma_helm: { id: 'set_zuma_helm', name: '祖玛头盔', icon: I + 'set_zuma_helm.png', slot: 'helmet', equip: { def: 13, hp: 90 }, req: 18, price: 140, set: 'zuma' },
  set_zuma_ring: { id: 'set_zuma_ring', name: '祖玛戒指', icon: I + 'set_zuma_ring.png', slot: 'ring', equip: { atk: 11, mag: 11, tao: 11 }, req: 18, price: 140, set: 'zuma' },
  set_zuma_boots: { id: 'set_zuma_boots', name: '祖玛靴', icon: I + 'set_zuma_boots.png', slot: 'boots', equip: { def: 8, hp: 70 }, req: 18, price: 140, set: 'zuma' },
  set_chiyue_necklace: { id: 'set_chiyue_necklace', name: '赤月项链', icon: I + 'set_chiyue_necklace.png', slot: 'necklace', equip: { atk: 14, mag: 14, tao: 14 }, req: 22, price: 220, set: 'chiyue' },
  set_chiyue_ring: { id: 'set_chiyue_ring', name: '赤月戒指', icon: I + 'set_chiyue_ring.png', slot: 'ring', equip: { atk: 14, mag: 14, tao: 14 }, req: 22, price: 220, set: 'chiyue' },
  set_chiyue_bracelet: { id: 'set_chiyue_bracelet', name: '赤月手镯', icon: I + 'set_chiyue_bracelet.png', slot: 'bracelet', equip: { def: 8, hp: 120 }, req: 22, price: 220, set: 'chiyue' },
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
  // R13 资料装备（21cq 1.76 物品库 https://www.21cq.com/mir/View.aspx?id=<n>）。卡牌属性 = 资料上限 × 换算 [适配]：攻击×1.5、魔法/道术×3、防御×2.3、生命=防御×8；
  // 需求等级取资料值；资料缺失（未查到）的按同档 [适配]。图标暂复用旧图，美术见 art-requests §R13 掉落。
  short_sword: { id: 'short_sword', name: '短剑', icon: I + 'INV_Sword_01.png', slot: 'weapon', equip: { atk: 16 }, req: 10, price: 10 }, // id=84
  bronze_sword: { id: 'bronze_sword', name: '青铜剑', icon: I + 'INV_Sword_01.png', slot: 'weapon', equip: { atk: 10 }, req: 5, price: 10 }, // id=83
  dagger: { id: 'dagger', name: '匕首', icon: I + 'INV_Sword_01.png', slot: 'weapon', equip: { atk: 8 }, req: 1, price: 10 }, // id=81
  ebony_sword: { id: 'ebony_sword', name: '乌木剑', icon: I + 'INV_Sword_01.png', slot: 'weapon', equip: { atk: 12, mag: 3 }, req: 1, price: 40 }, // id=82
  bronze_axe: { id: 'bronze_axe', name: '青铜斧', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 22 }, req: 13, price: 15 }, // id=87
  bahuang: { id: 'bahuang', name: '八荒', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 18 }, req: 15, price: 50 }, // id=89
  banyue: { id: 'banyue', name: '半月', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 15, mag: 3, tao: 3 }, req: 15, price: 40 }, // id=91
  haihun: { id: 'haihun', name: '海魂', icon: I + 'INV_Sword_03.png', slot: 'weapon', equip: { atk: 15, mag: 6 }, req: 15, price: 30 }, // id=90
  lingfeng: { id: 'lingfeng', name: '凌风', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 18 }, req: 19, price: 50 }, // id=92
  xiangmo: { id: 'xiangmo', name: '降魔', icon: I + 'INV_Sword_04.png', slot: 'weapon', equip: { atk: 16, tao: 6 }, req: 20, price: 100 }, // id=96
  yanyue: { id: 'yanyue', name: '偃月', icon: I + 'INV_Sword_03.png', slot: 'weapon', equip: { atk: 15, mag: 9 }, req: 20, price: 100 }, // id=95
  xiuluo: { id: 'xiuluo', name: '修罗', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 30 }, req: 22, price: 100 }, // id=97
  zhanma: { id: 'zhanma', name: '斩马刀', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 22 }, req: 20, price: 60 }, // id=94
  pohun: { id: 'pohun', name: '破魂', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 21 }, req: 22, price: 80 }, // id=93
  ningshuang: { id: 'ningshuang', name: '凝霜', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 20 }, req: 25, price: 80 }, // id=98
  lianyu: { id: 'lianyu', name: '炼狱', icon: I + 'INV_Sword_02.png', slot: 'weapon', equip: { atk: 38 }, req: 26, price: 250 }, // id=99
  jingzhongyue: { id: 'jingzhongyue', name: '井中月', icon: I + 'INV_Sword_05.png', slot: 'weapon', equip: { atk: 33 }, req: 28, price: 300 }, // id=102
  wujigun: { id: 'wujigun', name: '无极棍', icon: I + 'INV_Sword_04.png', slot: 'weapon', equip: { atk: 24, tao: 15 }, req: 30, price: 300 }, // id=104
  longwen: { id: 'longwen', name: '龙纹剑', icon: I + 'INV_Sword_04.png', slot: 'weapon', equip: { atk: 30, tao: 18 }, req: 35, price: 350 }, // id=107
  caijue: { id: 'caijue', name: '裁决之杖', icon: I + 'INV_Sword_05.png', slot: 'weapon', equip: { atk: 45 }, req: 30, price: 350 }, // id=105
  guyu: { id: 'guyu', name: '骨玉权杖', icon: I + 'INV_Sword_03.png', slot: 'weapon', equip: { atk: 9, tao: 12 }, req: 26, price: 200 }, // id=106
  light_armor: { id: 'light_armor', name: '轻型盔甲', icon: I + 'INV_Chest_Plate01.png', slot: 'armor', equip: { def: 7, hp: 56 }, req: 11, price: 30 }, // id=118
  soul_robe: { id: 'soul_robe', name: '灵魂战衣', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 14, hp: 112, tao: 6 }, req: 22, price: 100 }, // id=126
  magic_robe: { id: 'magic_robe', name: '魔法长袍', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 12, hp: 96, mag: 6 }, req: 22, price: 100 }, // id=124
  war_armor: { id: 'war_armor', name: '战神盔甲', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 21, hp: 168 }, req: 30, price: 250 }, // id=128
  ghost_robe: { id: 'ghost_robe', name: '幽灵战衣', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 16, hp: 128, tao: 12 }, req: 30, price: 220 }, // id=132
  demon_robe: { id: 'demon_robe', name: '恶魔长袍', icon: I + 'INV_Chest_Plate03.png', slot: 'armor', equip: { def: 16, hp: 128, mag: 12 }, req: 30, price: 220 }, // id=130
  tao_helm: { id: 'tao_helm', name: '道士头盔', icon: I + 'INV_Helmet_03.png', slot: 'helmet', equip: { def: 5, hp: 40 }, req: 24, price: 50 }, // id=149
  magic_helm: { id: 'magic_helm', name: '魔法头盔', icon: I + 'INV_Helmet_01.png', slot: 'helmet', equip: { def: 2, hp: 16 }, req: 14, price: 20 }, // id=148
};
/** 套装：集齐 n 件激活对应加成（卸下即失效） */
export interface SetDef { id: string; name: string; pieces: string[]; bonus: { n: number; stats: Partial<Record<'hp' | 'mp' | 'atk' | 'mag' | 'tao' | 'def', number>>; luck?: number; text: string }[] }
export const SETS: Record<string, SetDef> = {
  woma: { id: 'woma', name: '沃玛', pieces: ['set_woma_helm', 'set_woma_necklace', 'set_woma_bracelet'], bonus: [
    { n: 2, stats: { hp: 60 }, text: '生命+60' }, { n: 3, stats: { atk: 8, mag: 8, tao: 8, def: 5 }, text: '攻/魔/道+8 防御+5' }] },
  zuma: { id: 'zuma', name: '祖玛', pieces: ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots'], bonus: [
    { n: 2, stats: { atk: 6, mag: 6, tao: 6 }, text: '攻/魔/道+6' }, { n: 3, stats: { def: 8, hp: 100 }, text: '防御+8 生命+100' }] },
  chiyue: { id: 'chiyue', name: '赤月', pieces: ['set_chiyue_necklace', 'set_chiyue_ring', 'set_chiyue_bracelet'], bonus: [
    { n: 2, stats: { atk: 10, mag: 10, tao: 10 }, text: '攻/魔/道+10' }, { n: 3, stats: { hp: 200 }, luck: 1, text: '生命+200 幸运+1' }] },
};

/** 可黑铁强化的部位：手机版为武器/头盔/衣服/腰带/鞋；本作无腰带 → 适配四部位。首饰不可强化（官方）。 */
export const ENHANCE_SLOTS: (Slot & EquipSlot)[] = ['weapon', 'helmet', 'armor', 'boots'];
export const ENHANCE_MAX = 7;
export const ENHANCE_STAT = 0.08; // 适配：每 +1 该件基础属性 +8%
export const IRON_PRICE = 80; // 商店纯度 1 售价（适配）
export const IRON_MAX_PURITY = 5;
/** 适配成功率：纯度相对目标等级越高越易成功（官方：纯度越高成功率越高，具体表未公开） */
export function enhanceChance(curEnhance: number, purity: number): number {
  const need = curEnhance + 1;
  const gap = purity - need;
  return Math.max(0.15, Math.min(0.95, 0.72 + gap * 0.14 - curEnhance * 0.04));
}
/** 适配：当前强化 ≥5 失败时有破碎概率（参考《不正经的卡牌传说》武器强化可破碎；官方手游失败不掉级不破碎） */
export function shatterChance(curEnhance: number): number {
  return curEnhance >= 5 ? 0.12 * (curEnhance - 4) : 0;
}

// R11 技能书：图标暂用技能图标占位（专用书本图标见 docs/art-requests.md）
for (const b of Object.values(BOOKS)) {
  const sk = CLASSES[b.cls].skills.find(x => x.id === b.skill)!;
  ITEMS[bookItemId(b.skill)] = { id: bookItemId(b.skill), name: `${sk.name}（技能书）`, icon: sk.icon, price: Math.round(b.price / 2), book: b.skill };
}
