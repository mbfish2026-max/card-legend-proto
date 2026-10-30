import { UnitDef, DropEntry } from '../combat/types';
// 主角卡（属性由职业+等级计算，见 classes.ts；这里只提供卡牌尺寸等通用字段）
export const HERO: UnitDef = {
  id: 'hero', name: '战士', level: 1, hp: 320, mp: 120, atk: 30, atkInterval: 1.1,
  range: 6, speed: 0, width: 170, height: 240, tier: 'player',
  card: { w: 150, h: 200, figureScale: 1.25, anchorX: 0.42, maxWidthRatio: 1.7, artFacing: 1, bg: 0x2a2a2e },
};
const card = (o: Partial<NonNullable<UnitDef['card']>> = {}) => ({ w: 140, h: 190, figureScale: 1.15, anchorX: 0.55, maxWidthRatio: 1.7, artFacing: -1 as const, ...o });
const bossCard = (o: Partial<NonNullable<UnitDef['card']>> = {}) => card({ w: 200, h: 260, figureScale: 1.2, maxWidthRatio: 1.6, bg: 0x3a0606, ...o });
const n = (id: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, name, level, hp, atk: Math.round(atk * 1.4), def, exp, drops, atkInterval: 1.3, range: 6, speed: 110, width: 130, height: 180, tier: 'normal', card: card(), ...extra });
const b = (id: string, art: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, art, name, level, hp, atk: Math.round(atk * 1.4), def, exp, drops, atkInterval: 1.5, range: 8, speed: 70, width: 190, height: 260, tier: 'boss', card: bossCard(), ...extra });
const G = (c: number): DropEntry => ({ item: 'gold', chance: c });
export const ENEMIES: Record<string, UnitDef> = {
  // 第1层 幽暗森林
  deer: n('deer', '鹿', 1, 60, 6, 0, 22, [{ item: 'meat', chance: 0.5 }, G(0.5), { item: 'cloth', chance: 0.12 }], { deathSfx: 'deer_death' }),
  bat: n('bat', '蝙蝠', 2, 80, 9, 1, 28, [G(0.5), { item: 'hp_small', chance: 0.25 }, { item: 'boots', chance: 0.08 }], { deathSfx: 'death', card: card({ figureScale: 1.0 }) }),
  wolf: n('wolf', '狼', 3, 140, 12, 2, 40, [{ item: 'chicken', chance: 0.4 }, { item: 'hp_small', chance: 0.3 }, { item: 'iron_ring', chance: 0.12 }, { item: 'wood_sword', chance: 0.1 }], { deathSfx: 'death2', card: card({ anchorX: 0.56 }) }),
  wolf_king: b('wolf_king', 'wolf', '狼王', 6, 900, 20, 5, 260, [{ item: 'iron_sword', chance: 1 }, { item: 'helmet', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  // 第2层 蛛网晶洞
  spider: n('spider', '洞穴蜘蛛', 6, 240, 18, 4, 60, [G(0.5), { item: 'mp_small', chance: 0.3 }, { item: 'bracelet', chance: 0.1 }, { item: 'boots', chance: 0.08 }], { deathSfx: 'death' }),
  spider_queen: b('spider_queen', 'spider', '蜘蛛女王', 9, 1800, 30, 8, 520, [{ item: 'magic_staff', chance: 1 }, { item: 'tao_sword', chance: 1 }, { item: 'pearl', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'death' }),
  // 第3层 白骨墓穴
  skeleton: n('skeleton', '骷髅', 9, 380, 26, 7, 90, [{ item: 'bone', chance: 0.5 }, { item: 'mp_small', chance: 0.3 }, { item: 'iron_sword', chance: 0.08 }, G(0.4)], { speed: 95, deathSfx: 'skeleton_death', card: card({ figureScale: 1.2, anchorX: 0.56 }) }),
  zombie: n('zombie', '僵尸', 11, 620, 32, 9, 130, [{ item: 'hp_mid', chance: 0.3 }, { item: 'helmet', chance: 0.12 }, G(0.6)], { speed: 75, atkInterval: 1.5, width: 135, deathSfx: 'ghoul_death', card: card({ anchorX: 0.58 }) }),
  skeleton_lord: b('skeleton_lord', 'skeleton', '骷髅精灵', 13, 3200, 44, 12, 900, [{ item: 'bone_helm', chance: 1 }, { item: 'gold_ring', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'skeleton_death' }),
  // 第4层 兽人要塞
  orc: n('orc', '兽人战士', 13, 800, 40, 12, 170, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'armor', chance: 0.05 }, { item: 'bracelet', chance: 0.1 }], { deathSfx: 'death2' }),
  darkmage: n('darkmage', '黑暗法师', 14, 600, 50, 8, 190, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'magic_staff', chance: 0.08 }, { item: 'pearl', chance: 0.08 }], { deathSfx: 'death', atkInterval: 1.6 }),
  orc_chief: b('orc_chief', 'orc', '兽人酋长', 17, 5200, 60, 16, 1400, [{ item: 'armor', chance: 1 }, { item: 'gold_ring', chance: 1 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  // 第5层 尸王殿
  boss_lich: b('boss_lich', 'boss_lich', '尸王', 22, 9000, 75, 20, 3000, [{ item: 'dragon_sword', chance: 1 }, { item: 'armor', chance: 1 }, { item: 'gold_ring', chance: 0.7 }, { item: 'pearl', chance: 0.7 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'lich_death' }),
};
/** 道士召唤骷髅（金色卡底，友方） */
export const SUMMON: UnitDef = { id: 'summon_skeleton', art: 'skeleton', name: '骷髅', level: 1, hp: 200, atk: 10, def: 4, atkInterval: 1.3, range: 6, speed: 0, width: 120, height: 170, tier: 'player',
  card: card({ w: 120, h: 160, figureScale: 1.15, bg: 0x7a5c14 }) };
export const EXP_PER_LEVEL = (lv: number) => 80 + lv * 45;
