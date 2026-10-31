import { UnitDef, DropEntry } from '../combat/types';
// 主角卡（属性由职业+等级计算，见 classes.ts；这里只提供卡牌尺寸等通用字段）
export const HERO: UnitDef = {
  id: 'hero', name: '战士', level: 1, hp: 320, mp: 120, atk: 30, atkInterval: 1.1,
  range: 6, speed: 0, width: 170, height: 240, tier: 'player',
  card: { w: 150, h: 200, figureScale: 1.25, anchorX: 0.42, maxWidthRatio: 1.7, artFacing: 1, bg: 0x2a2a2e },
};
const card = (o: Partial<NonNullable<UnitDef['card']>> = {}) => ({ w: 140, h: 190, figureScale: 1.15, anchorX: 0.55, maxWidthRatio: 1.7, artFacing: -1 as const, ...o });
const bossCard = (o: Partial<NonNullable<UnitDef['card']>> = {}) => card({ w: 200, h: 260, figureScale: 1.2, maxWidthRatio: 1.6, bg: 0x3a0606, ...o });
/** 难度曲线（v0.2 上调：原版偏简单）。普通怪/首领的生命与攻击倍率 */
export const DIFF = { hp: 1.6, atk: 2.81, bossHp: 1.6, bossAtk: 2.08 };
const n = (id: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, name, level, hp: Math.round(hp * DIFF.hp), atk: Math.round(atk * 1.4 * DIFF.atk), def, exp, drops, atkInterval: 1.3, range: 6, speed: 110, width: 130, height: 180, tier: 'normal', card: card(), ...extra });
const b = (id: string, art: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, art, name, level, hp: Math.round(hp * DIFF.bossHp), atk: Math.round(atk * 1.4 * DIFF.bossAtk), def, exp, drops, atkInterval: 1.5, range: 8, speed: 70, width: 190, height: 260, tier: 'boss', card: bossCard(), ...extra });
const G = (c: number): DropEntry => ({ item: 'gold', chance: c });
export const ENEMIES: Record<string, UnitDef> = {
  // 第1层 幽暗森林
  deer: n('deer', '鹿', 1, 60, 6, 0, 22, [{ item: 'meat', chance: 0.5 }, G(0.5), { item: 'cloth', chance: 0.12 }], { deathSfx: 'deer_death' }),
  bat: n('bat', '蝙蝠', 2, 80, 9, 1, 28, [G(0.5), { item: 'hp_small', chance: 0.25 }, { item: 'boots', chance: 0.08 }], { deathSfx: 'death', card: card({ figureScale: 1.0 }) }),
  wolf: n('wolf', '狼', 3, 140, 12, 2, 40, [{ item: 'chicken', chance: 0.4 }, { item: 'hp_small', chance: 0.3 }, { item: 'iron_ring', chance: 0.12 }, { item: 'wood_sword', chance: 0.1 }], { deathSfx: 'death2', card: card({ anchorX: 0.56 }) }),
  wolf_king: b('wolf_king', 'boss_wolf_king', '狼王', 6, 900, 20, 5, 260, [{ item: 'iron_sword', chance: 1 }, { item: 'helmet', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  // R11 第3层 蛛网晶洞（数值随层位调整：沿用原第 3 层强度）
  spider: n('spider', '洞穴蜘蛛', 9, 380, 26, 7, 90, [G(0.5), { item: 'mp_small', chance: 0.3 }, { item: 'bracelet', chance: 0.1 }, { item: 'boots', chance: 0.08 }], { deathSfx: 'death' }),
  spider_queen: b('spider_queen', 'boss_spider_queen', '蜘蛛女王', 13, 3200, 44, 12, 900, [{ item: 'magic_staff', chance: 1 }, { item: 'tao_sword', chance: 1 }, { item: 'pearl', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'death' }),
  // R11 第4层 白骨墓穴（沿用原第 4 层强度）
  skeleton: n('skeleton', '骷髅', 12, 650, 34, 10, 160, [{ item: 'bone', chance: 0.5 }, { item: 'mp_small', chance: 0.3 }, { item: 'iron_sword', chance: 0.08 }, G(0.4)], { speed: 95, deathSfx: 'skeleton_death', card: card({ figureScale: 1.2, anchorX: 0.56 }) }),
  zombie: n('zombie', '僵尸', 14, 700, 36, 11, 180, [{ item: 'hp_mid', chance: 0.3 }, { item: 'helmet', chance: 0.12 }, G(0.6)], { speed: 75, atkInterval: 1.5, width: 135, deathSfx: 'ghoul_death', card: card({ anchorX: 0.58 }) }),
  skeleton_lord: b('skeleton_lord', 'boss_skeleton_lord', '骷髅精灵', 16, 4600, 54, 15, 1300, [{ item: 'bone_helm', chance: 1 }, { item: 'gold_ring', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'skeleton_death' }),
  // R11 第2层 兽人要塞（原版半兽人为 8–14 级沃玛森林怪，提前；沿用原第 2 层强度）
  orc: n('orc', '兽人战士', 6, 240, 18, 4, 60, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'armor', chance: 0.05 }, { item: 'bracelet', chance: 0.1 }], { deathSfx: 'death2' }),
  darkmage: n('darkmage', '黑暗法师', 7, 220, 30, 3, 70, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'magic_staff', chance: 0.08 }, { item: 'pearl', chance: 0.08 }], { deathSfx: 'death', atkInterval: 1.6, oilChance: 0.03 }),
  orc_chief: b('orc_chief', 'boss_orc_chief', '兽人酋长', 9, 1800, 30, 8, 520, [{ item: 'armor', chance: 1 }, { item: 'gold_ring', chance: 1 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  // 第5层 尸王殿
  boss_lich: b('boss_lich', 'boss_lich', '尸王', 22, 8000, 68, 20, 3000, [{ item: 'dragon_sword', chance: 1 }, { item: 'armor', chance: 1 }, { item: 'gold_ring', chance: 0.7 }, { item: 'pearl', chance: 0.7 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'lich_death' }),
  // R3 第6层 沃玛寺庙（参考传奇沃玛寺庙；怪物/数值为本作重新设计）
  woma_warrior: n('woma_warrior', '沃玛战士', 20, 1000, 40, 14, 230, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'armor', chance: 0.04 }], { art: 'orc', deathSfx: 'death2', oilChance: 0.02 }),
  woma_guard: n('woma_guard', '沃玛卫士', 21, 1200, 44, 16, 260, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'gold_ring', chance: 0.04 }], { deathSfx: 'death2', oilChance: 0.02 }),
  boss_woma: b('boss_woma', 'boss_woma', '沃玛教主', 24, 9000, 72, 22, 3500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2', setDrop: ['set_woma_helm', 'set_woma_necklace', 'set_woma_bracelet'] }),
  // R3 第7层 祖玛阁
  zuma_statue: n('zuma_statue', '祖玛雕像', 24, 1300, 58, 18, 320, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'bone_helm', chance: 0.04 }], { deathSfx: 'skeleton_death', speed: 85, oilChance: 0.02 }),
  zuma_guard: n('zuma_guard', '祖玛卫士', 25, 1500, 62, 20, 360, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'pearl', chance: 0.04 }], { art: 'orc', deathSfx: 'death2', oilChance: 0.02 }),
  boss_zuma: b('boss_zuma', 'boss_zuma', '祖玛教主', 28, 12000, 88, 24, 4500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'skeleton_death', setDrop: ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots'] }),
  // R3 第8层 赤月魔穴
  blood_zombie: n('blood_zombie', '血僵尸', 28, 1700, 68, 22, 420, [G(0.6), { item: 'hp_mid', chance: 0.35 }], { deathSfx: 'ghoul_death', speed: 75, atkInterval: 1.5, oilChance: 0.02 }),
  redmoon_spider: n('redmoon_spider', '赤月蜘蛛', 29, 1400, 75, 18, 440, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'spider', deathSfx: 'death', oilChance: 0.02 }),
  boss_redmoon: b('boss_redmoon', 'boss_redmoon', '赤月恶魔', 32, 15000, 95, 26, 6000, [{ item: 'dragon_sword', chance: 0.5 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'lich_death', setDrop: ['set_chiyue_necklace', 'set_chiyue_ring', 'set_chiyue_bracelet'] }),
};
/** 道士召唤骷髅（金色卡底，友方） */
export const SUMMON: UnitDef = { id: 'summon_skeleton', art: 'skeleton', name: '骷髅', level: 1, hp: 200, atk: 10, def: 4, atkInterval: 1.3, range: 6, speed: 0, width: 120, height: 170, tier: 'player',
  card: card({ w: 120, h: 160, figureScale: 1.15, bg: 0x7a5c14 }) };
/** 召唤神兽（官方 C：1/2/3 级神兽）；占位立绘用狼，美术见 art-requests */
export const SUMMON_BEAST: UnitDef = { id: 'summon_beast', art: 'wolf', name: '神兽', level: 1, hp: 360, atk: 22, def: 10, atkInterval: 1.15, range: 8, speed: 0, width: 140, height: 180, tier: 'player',
  card: card({ w: 150, h: 190, figureScale: 1.2, bg: 0x5a4010 }) };
export const EXP_PER_LEVEL = (lv: number) => 80 + lv * 45;
