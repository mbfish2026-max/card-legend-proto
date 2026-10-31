import { UnitDef, DropEntry } from '../combat/types';
import { officialDrops } from './drops';
import { WOMA_S9 } from './drops-s9';
// 主角卡（属性由职业+等级计算，见 classes.ts；这里只提供卡牌尺寸等通用字段）
export const HERO: UnitDef = {
  id: 'hero', name: '战士', level: 1, hp: 320, mp: 120, atk: 30, atkInterval: 1.1,
  range: 6, speed: 0, width: 170, height: 240, tier: 'player',
  card: { w: 150, h: 200, figureScale: 1.25, anchorX: 0.42, maxWidthRatio: 1.7, artFacing: 1, bg: 0x2a2a2e },
};
const card = (o: Partial<NonNullable<UnitDef['card']>> = {}) => ({ w: 140, h: 190, figureScale: 1.15, anchorX: 0.55, maxWidthRatio: 1.7, artFacing: -1 as const, ...o });
const bossCard = (o: Partial<NonNullable<UnitDef['card']>> = {}) => card({ w: 200, h: 260, figureScale: 1.2, maxWidthRatio: 1.6, bg: 0x3a0606, ...o });
/** 难度曲线（v0.2 上调：原版偏简单）。普通怪/首领的生命与攻击倍率 */
export const DIFF = { hp: 1.6, atk: 2.81, bossHp: 2.8, bossAtk: 1.9 };
const n = (id: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, name, level, hp: Math.round(hp * DIFF.hp), atk: Math.round(atk * 1.4 * DIFF.atk), def, exp, drops, atkInterval: 1.3, range: 6, speed: 110, width: 130, height: 180, tier: 'normal', card: card(), ...extra });
const b = (id: string, art: string, name: string, level: number, hp: number, atk: number, def: number, exp: number, drops: DropEntry[], extra: Partial<UnitDef> = {}): UnitDef =>
  ({ id, art, name, level, hp: Math.round(hp * DIFF.bossHp), atk: Math.round(atk * 1.4 * DIFF.bossAtk), def, exp, drops, atkInterval: 1.5, range: 8, speed: 70, width: 190, height: 260, tier: 'boss', card: bossCard(), ...extra });
const G = (c: number): DropEntry => ({ item: 'gold', chance: c });
/** 新手怪官方值（21cq 1.76）与折算 [适配]，见 docs/monsters-official.md「新手怪」 */
export const NOVICE_OFFICIAL: Record<string, { name: string; lv: number; hp: number; atk: [number, number]; def: number; exp: number }> = {
  hen: { name: '鸡', lv: 5, hp: 5, atk: [1, 1], def: 0, exp: 5 },
  scarecrow: { name: '稻草人', lv: 10, hp: 15, atk: [1, 2], def: 0, exp: 12 },
  hook_cat: { name: '多钩猫', lv: 13, hp: 22, atk: [2, 4], def: 0, exp: 17 },
  rake_cat: { name: '钉耙猫', lv: 13, hp: 23, atk: [2, 4], def: 0, exp: 18 },
  forest_yeti: { name: '森林雪人', lv: 16, hp: 36, atk: [7, 10], def: 2, exp: 30 },
  man_eater_flower: { name: '食人花', lv: 20, hp: 28, atk: [6, 9], def: 2, exp: 28 },
};
export const NOVICE_SCALE = (o: { lv: number; hp: number; atk: [number, number]; def: number }) =>
  ({ level: Math.max(1, Math.min(6, Math.round(0.3 * o.lv))), hp: Math.round(50 + 2.5 * o.hp), atk: Math.round(5 + 0.8 * (o.atk[0] + o.atk[1]) / 2), def: o.def });
const NOVICE_DROPS: Record<string, DropEntry[]> = {
  hen: [{ item: 'chicken', chance: 0.5 }, G(0.4)],
  scarecrow: [G(0.5), { item: 'hp_small', chance: 0.2 }, { item: 'cloth', chance: 0.06 }],
  hook_cat: [G(0.5), { item: 'hp_small', chance: 0.25 }, { item: 'wood_sword', chance: 0.06 }],
  rake_cat: [G(0.5), { item: 'hp_small', chance: 0.25 }, { item: 'iron_ring', chance: 0.06 }],
  forest_yeti: [G(0.6), { item: 'hp_small', chance: 0.3 }, { item: 'boots', chance: 0.06 }],
  man_eater_flower: [G(0.6), { item: 'mp_small', chance: 0.3 }, { item: 'bracelet', chance: 0.06 }],
};
function novice(): Record<string, UnitDef> {
  return Object.fromEntries(Object.entries(NOVICE_OFFICIAL).map(([id, o]) => { const v = NOVICE_SCALE(o);
    return [id, n(id, o.name, v.level, v.hp, v.atk, v.def, o.exp, NOVICE_DROPS[id], { deathSfx: id === 'hen' ? 'death' : 'death2' })]; }));
}
export const ENEMIES: Record<string, UnitDef> = {
  // 第1层 幽暗森林
  deer: n('deer', '鹿', 1, 60, 6, 0, 22, [{ item: 'meat', chance: 0.5 }, G(0.5), { item: 'cloth', chance: 0.12 }], { deathSfx: 'deer_death' }),
  bat: n('bat', '蝙蝠', 2, 80, 9, 1, 28, [G(0.5), { item: 'hp_small', chance: 0.25 }, { item: 'boots', chance: 0.08 }], { deathSfx: 'death', card: card({ figureScale: 1.0 }) }),
  wolf: n('wolf', '狼', 3, 140, 12, 2, 40, [{ item: 'chicken', chance: 0.4 }, { item: 'hp_small', chance: 0.3 }, { item: 'iron_ring', chance: 0.12 }, { item: 'wood_sword', chance: 0.1 }], { deathSfx: 'death2', card: card({ anchorX: 0.56 }) }),
  // 9:27 新手怪（官方 21cq 1.76：鸡 Lv5 HP5 攻1-1 经验5；稻草人 Lv10 HP15 攻1-2 经验12；多钩猫 Lv13 HP22 攻2-4 经验17；钉耙猫 Lv13 HP23 攻2-4 经验18；
  // 森林雪人 Lv16 HP36 攻7-10 防2 经验30；食人花 Lv20 HP28 攻6-9 防2 经验28）。折算 [适配]（NOVICE_SCALE）：本作原始面板 hp = 50 + 2.5×官方HP，atk = 5 + 0.8×官方平均攻，
  // def = 官方防，等级 = clamp(round(0.3×官方等级), 1, 6)；再经 n() 的 DIFF 倍率。第 0 层豁免公式面板 → 直接用此值；第 1 层起由 foeStatsAt 按层目标等级重算。掉落官方未查到 → [适配]
  ...novice(),
  // 首图削弱 [适配]：血 900→680（-24%）、攻 20→13（-35%），9 种子网格搜索选出（中位数 3/2/1、最大 9）；首图可反复刷
  wolf_king: b('wolf_king', 'boss_wolf_king', '狼王', 6, 680, 13, 5, 260, [{ item: 'iron_sword', chance: 1 }, { item: 'helmet', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
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
  woma_warrior: n('woma_warrior', '沃玛战士', 20, 1000, 40, 14, 230, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'armor', chance: 0.04 }], { art: 'woma_warrior', deathSfx: 'death2', oilChance: 0.02 }),
  woma_guard: n('woma_guard', '沃玛卫士', 21, 1200, 44, 16, 260, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'gold_ring', chance: 0.04 }], { deathSfx: 'death2', oilChance: 0.02 }),
  boss_woma: b('boss_woma', 'boss_woma', '沃玛教主', 24, 9000, 72, 22, 3500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2', setDrop: ['set_woma_helm', 'set_woma_necklace', 'set_woma_bracelet'] }),
  // R3 第7层 祖玛阁
  zuma_statue: n('zuma_statue', '祖玛雕像', 24, 1300, 58, 18, 320, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'bone_helm', chance: 0.04 }], { deathSfx: 'skeleton_death', speed: 85, oilChance: 0.02 }),
  zuma_guard: n('zuma_guard', '祖玛卫士', 25, 1500, 62, 20, 360, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'pearl', chance: 0.04 }], { art: 'zuma_guard', deathSfx: 'death2', oilChance: 0.02 }),
  boss_zuma: b('boss_zuma', 'boss_zuma', '祖玛教主', 28, 12000, 88, 24, 4500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'skeleton_death', setDrop: ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots'] }),
  // R3 第8层 赤月魔穴
  blood_zombie: n('blood_zombie', '血僵尸', 28, 1700, 68, 22, 420, [G(0.6), { item: 'hp_mid', chance: 0.35 }], { deathSfx: 'ghoul_death', speed: 75, atkInterval: 1.5, oilChance: 0.02 }),
  redmoon_spider: n('redmoon_spider', '赤月蜘蛛', 29, 1400, 75, 18, 440, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'redmoon_spider', deathSfx: 'death', oilChance: 0.02 }),
  boss_redmoon: b('boss_redmoon', 'boss_redmoon', '赤月恶魔', 32, 15000, 95, 26, 6000, [{ item: 'dragon_sword', chance: 0.5 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'lich_death', setDrop: ['set_chiyue_necklace', 'set_chiyue_ring', 'set_chiyue_bracelet'] }),
  // 合击版 #8 新地图怪物（docs/hejiban-official.md §4）。官方怪物表/数值未查到 → 名称/数值 [适配]，美术：重画·第1组起各用自身 <id>_full.png（不再复用小怪素材）
  hj_guard: n('hj_guard', '家园守卫', 30, 1800, 76, 23, 470, [G(0.6), { item: 'hp_mid', chance: 0.35 }, { item: 'book_page', chance: 0.06 }], { art: 'hj_guard', deathSfx: 'death2', oilChance: 0.02 }),
  boss_hj_home: b('boss_hj_home', 'boss_molong', '魔龙守将', 33, 15500, 96, 26, 6200, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'gold_bar', chance: 0.5 }, G(1), G(1)], { deathSfx: 'death2' }),
  wolong_guard: n('wolong_guard', '卧龙护卫', 31, 1850, 78, 24, 490, [G(0.6), { item: 'hp_mid', chance: 0.35 }, { item: 'book_page', chance: 0.06 }], { art: 'wolong_guard', deathSfx: 'death2', oilChance: 0.02 }),
  boss_wolong: b('boss_wolong', 'boss_orc_chief', '卧龙名将', 34, 16000, 98, 27, 6500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'gold_bar', chance: 0.6 }, G(1), G(1)], { deathSfx: 'death2' }),
  leiyan_spider: n('leiyan_spider', '雷炎蜘蛛', 32, 1700, 82, 22, 510, [G(0.6), { item: 'mp_mid', chance: 0.35 }, { item: 'book_page', chance: 0.08 }], { art: 'leiyan_spider', deathSfx: 'death', oilChance: 0.02 }),
  boss_leiyan: b('boss_leiyan', 'boss_redmoon', '雷炎蛛王', 35, 16500, 100, 27, 7000, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'gold_bar', chance: 0.6 }, G(1), G(1)], { deathSfx: 'lich_death' }),
  fire_dragon_guard: n('fire_dragon_guard', '火龙守卫', 33, 1900, 84, 24, 530, [G(0.6), { item: 'hp_mid', chance: 0.35 }, { item: 'book_page', chance: 0.08 }], { art: 'fire_dragon_guard', deathSfx: 'death2', oilChance: 0.02 }),
  boss_fire_dragon: b('boss_fire_dragon', 'boss_redmoon', '火龙', 36, 17000, 102, 28, 7500, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'gold_bar', chance: 1 }, G(1), G(1)], { deathSfx: 'lich_death' }),
  // 阶段 B #9 新 BOSS 魔龙教主（docs/hejiban-official.md §7）：HP 12000 官方（百度百科）；等级/攻/防未查到 → [适配] 取火龙(36 级)之后一档；
  // 掉落官方「腰带/靴子、技能书、魔龙首饰、开天/镇天/玄天」(17173)：本作无腰带/魔龙首饰/开天镇天玄天 → 只落已有的 靴子(boots)、技能残页(book_page)，其余未实装（不新建背包结构）
  // 美术：boss_molong 立绘已到位（108d607），去掉沃玛贴图+紫色着色占位
  boss_molong: b('boss_molong', 'boss_molong', '魔龙教主', 38, 12000, 108, 24, 8000, [{ item: 'boots', chance: 0.5 }, { item: 'book_page', chance: 1 }, { item: 'book_page', chance: 0.5 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2', card: bossCard({ figureScale: 1.35, bg: 0x2a0636 }) }),
  // M4 新怪（docs/monsters-official.md「M4 新怪」）。原版数值见文档（21cq 1.76 资料站）；本作数值 [适配]：原版均为 50 级段后期怪，
  // 按本作同层位相邻档（火龙守卫 33 级 / 火龙 36 级 / 魔龙教主 38 级）取值；掉落 = 原版掉落表中本作已有的物品、按 21cq 原版爆率；金币/书页(代技能书) [适配]；雪人王/鹰卫掉落未查到 → 只给 [适配] 药水金币；其余未实装
  rake_cat_king: n('rake_cat_king', '钉耙猫王', 34, 1950, 86, 24, 550, [G(0.6), { item: 'hp_mid', chance: 1 / 2 }, { item: 'mp_mid', chance: 1 / 2 }, { item: 'armor', chance: 1 / 8 }, { item: 'soul_robe', chance: 1 / 8 }, { item: 'magic_robe', chance: 1 / 8 }, { item: 'gold_ring', chance: 1 / 8 }, { item: 'xiangmo', chance: 1 / 5 }, { item: 'pohun', chance: 1 / 5 }, { item: 'zhanma', chance: 1 / 5 }, { item: 'yanyue', chance: 1 / 5 }], { art: 'rake_cat_king', deathSfx: 'death2', oilChance: 0.02 }),
  orc_commander: n('orc_commander', '半兽统领', 34, 1900, 84, 24, 560, [G(0.6), { item: 'armor', chance: 1 / 8 }, { item: 'soul_robe', chance: 1 / 8 }, { item: 'magic_robe', chance: 1 / 8 }, { item: 'gold_ring', chance: 1 / 8 }, { item: 'xiangmo', chance: 1 / 5 }, { item: 'pohun', chance: 1 / 5 }, { item: 'zhanma', chance: 1 / 5 }, { item: 'yanyue', chance: 1 / 5 }], { art: 'orc_commander', deathSfx: 'death2', oilChance: 0.02 }),
  evil_lich: n('evil_lich', '恶灵尸王', 34, 1850, 84, 22, 540, [G(0.6), { item: 'hp_mid', chance: 1 / 200 }, { item: 'mp_mid', chance: 1 / 200 }, { item: 'ningshuang', chance: 1 / 1000 }, { item: 'book_page', chance: 0.05 }], { art: 'evil_lich', deathSfx: 'ghoul_death', oilChance: 0.02 }),
  hawk_guard: n('hawk_guard', '鹰卫', 34, 2000, 86, 25, 560, [G(0.6), { item: 'hp_mid', chance: 0.35 }], { art: 'hawk_guard', deathSfx: 'death', oilChance: 0.02 }),
  boss_yeti_king: b('boss_yeti_king', 'yeti_king', '雪人王', 37, 15000, 104, 27, 7600, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  boss_huangquan: b('boss_huangquan', 'huangquan_master', '黄泉教主', 38, 16000, 106, 27, 7800, [{ item: 'book_page', chance: 1 }, { item: 'jingzhongyue', chance: 1 / 800 }, { item: 'wujigun', chance: 1 / 800 }, { item: 'caijue', chance: 1 / 3200 }, { item: 'guyu', chance: 1 / 3200 }, { item: 'longwen', chance: 1 / 3200 }, { item: 'tao_sword', chance: 1 / 160 }, { item: 'magic_staff', chance: 1 / 160 }, { item: 'lianyu', chance: 1 / 160 }, G(1), G(1)], { deathSfx: 'skeleton_death' }),
  boss_twinhead_kong: b('boss_twinhead_kong', 'twinhead_kong', '双头金刚', 39, 17000, 110, 22, 8200, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'ningshuang', chance: 1 / 80 }, { item: 'armor', chance: 1 / 50 }, { item: 'soul_robe', chance: 1 / 50 }, { item: 'magic_robe', chance: 1 / 50 }, { item: 'bone_helm', chance: 1 / 240 }, { item: 'xiuluo', chance: 1 / 240 }, { item: 'tao_sword', chance: 1 / 160 }, { item: 'magic_staff', chance: 1 / 160 }, { item: 'lianyu', chance: 1 / 160 }, G(1), G(1)], { deathSfx: 'death2', mdef: 40 }),
  boss_twinhead_blood: b('boss_twinhead_blood', 'twinhead_blood', '双头血魔', 40, 17000, 112, 32, 8400, [{ item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, { item: 'book_page', chance: 1 }, { item: 'ningshuang', chance: 1 / 240 }, { item: 'armor', chance: 1 / 50 }, { item: 'soul_robe', chance: 1 / 50 }, { item: 'magic_robe', chance: 1 / 50 }, { item: 'bone_helm', chance: 1 / 240 }, { item: 'xiuluo', chance: 1 / 240 }, { item: 'tao_sword', chance: 1 / 160 }, { item: 'magic_staff', chance: 1 / 160 }, { item: 'lianyu', chance: 1 / 160 }, G(1), G(1)], { deathSfx: 'lich_death', mdef: 10 }),
  // R13 新增地图（原版怪名/BOSS 见 docs/maps-research.md；数值按本作层位 [适配]，非原版数值）
  red_snake: n('red_snake', '红蛇', 10, 420, 28, 8, 110, [G(0.5), { item: 'hp_small', chance: 0.3 }, { item: 'bracelet', chance: 0.08 }], { art: 'red_snake', deathSfx: 'death' }),
  tiger_snake: n('tiger_snake', '虎蛇', 11, 460, 30, 8, 120, [G(0.5), { item: 'mp_small', chance: 0.3 }, { item: 'boots', chance: 0.08 }], { art: 'tiger_snake', deathSfx: 'death' }),
  scorpion: n('scorpion', '蝎子', 11, 440, 31, 9, 125, [G(0.5), { item: 'hp_small', chance: 0.3 }, { item: 'iron_ring', chance: 0.08 }], { art: 'scorpion', deathSfx: 'death' }),
  tree_demon: b('tree_demon', 'tree_demon', '万年树妖', 14, 3800, 48, 13, 1100, [{ item: 'magic_staff', chance: 0.6 }, { item: 'pearl', chance: 0.6 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'death' }),
  centipede: n('centipede', '蜈蚣', 15, 760, 38, 12, 200, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'helmet', chance: 0.06 }], { art: 'centipede', deathSfx: 'death' }),
  jump_bee: n('jump_bee', '跳跳蜂', 16, 700, 40, 11, 210, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'bracelet', chance: 0.06 }], { art: 'jump_bee', deathSfx: 'death', card: card({ figureScale: 1.0 }) }),
  black_maggot: n('black_maggot', '黑色恶蛆', 17, 820, 40, 13, 220, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'black_maggot', speed: 80, deathSfx: 'ghoul_death' }),
  boss_chulong: b('boss_chulong', 'boss_chulong', '触龙神', 19, 6000, 60, 18, 2200, [{ item: 'gold_ring', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death' }),
  red_boar: n('red_boar', '红野猪', 18, 880, 40, 13, 230, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'armor', chance: 0.04 }], { art: 'red_boar', deathSfx: 'death2' }),
  black_boar: n('black_boar', '黑野猪', 19, 950, 42, 14, 245, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'helmet', chance: 0.05 }], { art: 'black_boar', deathSfx: 'death2' }),
  scorpion_snake: n('scorpion_snake', '蝎蛇', 19, 900, 44, 13, 245, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'gold_ring', chance: 0.03 }], { art: 'scorpion_snake', deathSfx: 'death' }),
  boss_white_boar: b('boss_white_boar', 'boss_white_boar', '白野猪', 21, 7500, 66, 20, 2800, [{ item: 'armor', chance: 1 }, { item: 'pearl', chance: 0.6 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  bull_warrior: n('bull_warrior', '牛魔战士', 25, 1400, 60, 19, 380, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'bone_helm', chance: 0.04 }], { art: 'bull_warrior', deathSfx: 'death2', oilChance: 0.02 }),
  bull_mage: n('bull_mage', '牛魔法师', 26, 1300, 66, 17, 400, [G(0.6), { item: 'mp_mid', chance: 0.3 }, { item: 'pearl', chance: 0.04 }], { art: 'bull_mage', deathSfx: 'death', atkInterval: 1.6, oilChance: 0.02 }),
  bull_guard: n('bull_guard', '牛魔侍卫', 26, 1500, 62, 20, 410, [G(0.6), { item: 'hp_mid', chance: 0.3 }, { item: 'gold_ring', chance: 0.04 }], { art: 'bull_guard', deathSfx: 'death2', oilChance: 0.02 }),
  boss_bull_king: b('boss_bull_king', 'boss_bull_king', '牛魔王', 30, 13000, 90, 25, 5000, [{ item: 'dragon_sword', chance: 0.4 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  hongmo_pig: n('hongmo_pig', '虹魔猪卫', 27, 1550, 64, 20, 410, [G(0.6), { item: 'hp_mid', chance: 0.35 }], { art: 'hongmo_pig', deathSfx: 'death2', oilChance: 0.02 }),
  hongmo_scorpion: n('hongmo_scorpion', '虹魔蝎卫', 27, 1650, 66, 21, 420, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'hongmo_scorpion', deathSfx: 'death', oilChance: 0.02 }),
  boss_hongmo: b('boss_hongmo', 'boss_hongmo', '虹魔教主', 31, 14000, 92, 25, 5500, [{ item: 'dragon_sword', chance: 0.4 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death2' }),
  // feat/maps-more 新增 6 层（怪名/刷怪/BOSS 按 21cq，见 docs/map-system-full.md；数值按本作层位 [适配]，非原版数值）
  cave_skel_warrior: n('cave_skel_warrior', '骷髅战士', 14, 670, 35, 10, 170, [G(0.4), { item: 'hp_small', chance: 0.3 }], { art: 'cave_skel_warrior', speed: 95, deathSfx: 'skeleton_death', card: card({ figureScale: 1.2, anchorX: 0.56 }) }),
  cave_skel_general: n('cave_skel_general', '骷髅战将', 14, 720, 37, 11, 185, [G(0.4), { item: 'mp_small', chance: 0.3 }], { art: 'cave_skel_general', speed: 95, deathSfx: 'skeleton_death', card: card({ figureScale: 1.25, anchorX: 0.56 }) }),
  axe_skeleton: n('axe_skeleton', '掷斧骷髅', 14, 600, 38, 9, 175, [G(0.4), { item: 'hp_small', chance: 0.3 }], { art: 'axe_skeleton', range: 220, speed: 85, deathSfx: 'skeleton_death', card: card({ figureScale: 1.2, anchorX: 0.56 }) }),
  cave_bat: n('cave_bat', '山洞蝙蝠', 14, 560, 34, 9, 165, [G(0.4), { item: 'hp_small', chance: 0.25 }], { art: 'cave_bat', deathSfx: 'death', card: card({ figureScale: 1.0 }) }),
  cave_maggot: n('cave_maggot', '洞蛆', 14, 740, 36, 12, 185, [G(0.4), { item: 'hp_mid', chance: 0.25 }], { art: 'cave_maggot', speed: 70, deathSfx: 'ghoul_death' }),
  // feat/maps-batch2（plan-60h B2）新增 6 种：官方名/出没按 21cq（docs/map-system-full.md）；等级/数值官方逐怪未查到，全部 [适配]（21cq 区间沃玛寺庙 20–31、矿区 21–25 与本作层位曲线冲突，按通关顺序普通怪等级递增取值）；僵尸1–5 合为一种 [适配]
  dung_beetle: n('dung_beetle', '粪虫', 19, 900, 38, 12, 210, [G(0.5), { item: 'hp_mid', chance: 0.25 }], { art: 'dung_beetle', speed: 70, deathSfx: 'ghoul_death' }),
  woma_brave: n('woma_brave', '沃玛勇士', 20, 1100, 42, 15, 245, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'woma_brave', deathSfx: 'death2', oilChance: 0.02 }),
  woma_general: n('woma_general', '沃玛战将', 21, 1250, 45, 17, 270, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'woma_general', deathSfx: 'death2', oilChance: 0.02 }),
  fire_woma: n('fire_woma', '火焰沃玛', 20, 1100, 48, 14, 270, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'fire_woma', deathSfx: 'death2', oilChance: 0.02 }),
  dark_warrior: n('dark_warrior', '暗黑战士', 21, 1300, 47, 18, 290, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'dark_warrior', deathSfx: 'death2', oilChance: 0.02 }),
  // feat/maps-batch3 新怪：等级按「通关顺序普通怪等级递增」取 [适配]（21cq 官方 26–60 级区间与本作压缩曲线不符）；数值 [适配]，掉落走 DROPS_AS/官方表，缺图借用相近立绘
  pincer_bug: n('pincer_bug', '钳虫', 16, 780, 39, 12, 205, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'pincer_bug', deathSfx: 'death' }),
  giant_worm: n('giant_worm', '巨型蠕虫', 16, 900, 36, 13, 210, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'giant_worm', speed: 70, deathSfx: 'ghoul_death' }),
  wedge_moth: n('wedge_moth', '楔蛾', 18, 820, 42, 12, 230, [G(0.6), { item: 'mp_mid', chance: 0.3 }], { art: 'wedge_moth', deathSfx: 'death' }),
  horn_fly: n('horn_fly', '角蝇', 18, 800, 43, 12, 235, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'horn_fly', deathSfx: 'death' }),
  boss_evil_pincer: b('boss_evil_pincer', 'boss_evil_pincer', '邪恶钳虫', 18, 5000, 56, 17, 1800, [{ item: 'helmet', chance: 0.6 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1)], { deathSfx: 'death' }),
  boss_evil_snake: b('boss_evil_snake', 'boss_evil_snake', '邪恶毒蛇', 22, 8000, 70, 21, 3000, [{ item: 'gold_ring', chance: 0.8 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'death' }),
  boss_shimu_lich: b('boss_shimu_lich', 'boss_shimu_lich', '石墓尸王', 22, 8500, 72, 21, 3200, [{ item: 'armor', chance: 1 }, { item: 'pearl', chance: 0.6 }, { item: 'hp_mid', chance: 1 }, { item: 'mp_mid', chance: 1 }, G(1), G(1)], { deathSfx: 'ghoul_death' }),
  mine_zombie: n('mine_zombie', '僵尸', 14, 1000, 40, 13, 225, [G(0.6), { item: 'hp_mid', chance: 0.3 }], { art: 'mine_zombie', speed: 75, atkInterval: 1.5, width: 135, deathSfx: 'ghoul_death', card: card({ anchorX: 0.58 }) }),
};
/** feat/maps-more：同名官方怪的掉落沿用已有 21cq 表（id 不同仅因数值按层位区分）；无表的标「未查到」只给 [适配] 金币/药水 */
/** [适配] 新洞穴怪的难度系数（攻/血），按 9 种子模拟调到死亡中位 1–4 */
const NEW_IDS = ['cave_skel_warrior', 'cave_skel_general', 'axe_skeleton', 'cave_bat', 'cave_maggot'];
const NEW_ATK = 1.3, NEW_HP = 1.2;
for (const id of NEW_IDS) { const u = ENEMIES[id]; u.atk = Math.round(u.atk * NEW_ATK); u.hp = Math.round(u.hp * NEW_HP); }
/** feat/maps-sq-mir3：传世/传奇3 官方怪名；等级按相邻地图递增取 [适配]；数值克隆同段已有怪 [适配]（官方数值未查到）；普通怪掉落未查到只给 [适配] 金币/药水；立绘借用（见 docs/art-requests.md） */
const sqClone = (id: string, name: string, level: number, tpl: string, art: string, boss = false): UnitDef => { const t = ENEMIES[tpl]; return { ...t, id, name, level, art, card: { ...t.card! }, drops: boss ? [...(t.drops ?? [])] : [G(0.6), { item: 'hp_mid', chance: 0.3 }] }; };
const SQMIR3: [string, string, number, string, string][] = [["sq_shiwei", "尸卫", 11, "tiger_snake", "skeleton"], ["sq_shiwei_yong", "尸卫勇士", 12, "scorpion", "skeleton"], ["sq_shiwei_qiang", "掷枪尸卫", 12, "scorpion", "skeleton"], ["sq_shiwei_zhan", "尸卫战将", 13, "scorpion", "skeleton"], ["sq_bat", "蝙蝠", 12, "tiger_snake", "bat"], ["m3_ant_warrior", "蚂蚁战士", 13, "skeleton", "jump_bee"], ["m3_ant_armor", "盔甲蚂蚁", 14, "zombie", "black_maggot"], ["m3_ant_bomb", "爆毒蚂蚁", 14, "zombie", "jump_bee"], ["m3_ant_tao", "蚂蚁道士", 14, "zombie", "centipede"], ["sq_stone_man", "石人", 14, "zombie", "zuma_statue"], ["sq_bronze_man", "铜人", 15, "zombie", "zuma_guard"], ["sq_bronze_beast", "青铜兽", 15, "centipede", "zuma_statue"], ["sq_blade_man", "滚刀手", 15, "centipede", "zuma_guard"], ["sq_hammer_man", "铜锤手", 16, "jump_bee", "zuma_guard"], ["sq_jingang", "金刚人", 16, "jump_bee", "zuma_statue"], ["sq_red_snake_yao", "红蛇妖", 16, "jump_bee", "red_snake"], ["sq_black_snake_yao", "黑蛇妖", 16, "jump_bee", "tiger_snake"], ["sq_scarab", "圣甲虫", 17, "black_maggot", "dung_beetle"], ["sq_magic_beetle", "魔甲虫", 17, "black_maggot", "dung_beetle"], ["sq_termite", "白蚁", 17, "black_maggot", "centipede"], ["sq_three_snake", "三头蛇", 18, "red_boar", "scorpion_snake"], ["sq_white_snake_yao", "白蛇妖", 18, "red_boar", "red_snake"], ["m3_skel_wushi", "骷髅武士", 19, "black_boar", "skeleton"], ["m3_skel_wujiang", "骷髅武将", 19, "black_boar", "skeleton"], ["m3_skel_soldier", "骷髅士兵", 19, "scorpion_snake", "skeleton"], ["m3_skel_archer", "骷髅弓箭手", 20, "dung_beetle", "skeleton"], ["m3_bone_general", "骨鬼将", 20, "dung_beetle", "skeleton"], ["m3_noma", "诺玛", 24, "zuma_statue", "zuma_statue"], ["m3_noma_pharaoh", "诺玛法老", 25, "zuma_guard", "zuma_guard"], ["m3_desert_fish", "沙漠鱼魔", 24, "zuma_statue", "scorpion_snake"], ["m3_desert_wind", "沙漠风魔", 24, "zuma_statue", "jump_bee"], ["m3_desert_tree", "沙漠树魔", 25, "zuma_guard", "tree_demon"], ["m3_desert_stone", "沙漠石人", 25, "zuma_guard", "zuma_statue"], ["sq_imp", "地下小鬼", 25, "bull_warrior", "darkmage"], ["sq_nimo_archer", "逆魔弓箭手", 26, "bull_mage", "zuma_guard"], ["sq_nimo_guard", "逆魔卫士", 26, "bull_guard", "zuma_guard"], ["sq_nimo_shiwei", "逆魔侍卫", 27, "hongmo_pig", "bull_guard"], ["sq_nimo_statue", "逆魔雕像", 27, "hongmo_scorpion", "zuma_statue"], ["sq_cimo", "刺魔", 27, "hongmo_pig", "hongmo_pig"], ["sq_lizhua", "利爪魔", 27, "hongmo_scorpion", "hongmo_scorpion"], ["sq_shanling", "闪灵", 28, "hongmo_pig", "darkmage"], ["sq_tengyao", "藤妖", 28, "blood_zombie", "tree_demon"], ["sq_xueyao", "血妖", 28, "blood_zombie", "blood_zombie"], ["sq_tieyi", "铁翼魔", 29, "redmoon_spider", "jump_bee"], ["sq_yaolishi", "妖力士", 29, "redmoon_spider", "bull_warrior"], ["sq_youling_bug", "幽灵虫", 29, "blood_zombie", "black_maggot"], ["m3_panye_fire", "潘夜火魔", 29, "redmoon_spider", "fire_woma"], ["m3_panye_wind", "潘夜风魔", 29, "redmoon_spider", "woma_brave"], ["m3_panye_ice", "潘夜冰魔", 29, "redmoon_spider", "woma_general"], ["m3_panye_cloud", "潘夜云魔", 29, "redmoon_spider", "darkmage"], ["m3_panye_warrior", "潘夜战士", 30, "redmoon_spider", "bull_warrior"], ["m3_panye_left", "潘夜左护卫", 30, "redmoon_spider", "bull_guard"], ["m3_panye_right", "潘夜右护卫", 30, "redmoon_spider", "bull_guard"], ["m3_panye_ghost", "潘夜鬼将", 30, "redmoon_spider", "dark_warrior"]];
const SQMIR3_BOSS: [string, string, number, string, string][] = [["boss_sq_shiba", "尸霸", 15, "tree_demon", "boss_lich"], ["boss_m3_ant_general", "蚂蚁将军", 17, "boss_evil_pincer", "boss_chulong"], ["boss_sq_jiguan", "机关巨兽", 19, "boss_chulong", "boss_zuma"], ["boss_sq_snake_king", "三头蛇王", 22, "boss_evil_snake", "boss_white_boar"], ["boss_m3_skel_master", "骷髅教主", 22, "boss_white_boar", "boss_skeleton_lord"], ["boss_m3_great_pharaoh", "大法老", 28, "boss_zuma", "boss_zuma"], ["boss_sq_nimo", "逆魔", 31, "boss_hongmo", "boss_hongmo"], ["boss_sq_jindi", "禁地魔王", 32, "boss_redmoon", "boss_redmoon"], ["boss_m3_panye_bull", "潘夜牛魔王", 33, "boss_redmoon", "boss_bull_king"]];
// art/maps-sq-mir3 立绘已到位：art 用怪物 id 本身（元组第 5 列原占位贴图保留作记录）
for (const [id, name, lv, tpl] of SQMIR3) ENEMIES[id] = sqClone(id, name, lv, tpl, id);
for (const [id, name, lv, tpl] of SQMIR3_BOSS) ENEMIES[id] = sqClone(id, name, lv, tpl, id, true);
export const DROPS_AS: Record<string, string> = { mine_zombie: 'zombie' };
/** R13：有资料的怪，装备/药水/祝福油掉落替换为资料表（1/N）；金币条目保留 [适配]。见 docs/drops-official.md */
for (const u of Object.values(ENEMIES)) { const od = officialDrops(DROPS_AS[u.id] || u.id); if (od) u.drops = [...(u.drops ?? []).filter(d => d.item === 'gold'), ...od]; }
/** R14 #7：沃玛教主按 S9 结构（[适配] 倍率 K），见 drops-s9.ts */
ENEMIES.boss_woma.drops = [...(ENEMIES.boss_woma.drops ?? []).filter(d => d.item === 'gold'), ...WOMA_S9];
/** 道士召唤骷髅（金色卡底，友方） */
export const SUMMON: UnitDef = { id: 'summon_skeleton', art: 'skeleton', name: '骷髅', level: 1, hp: 200, atk: 10, def: 4, atkInterval: 1.3, range: 6, speed: 0, width: 120, height: 170, tier: 'player',
  card: card({ w: 120, h: 160, figureScale: 1.15, bg: 0x7a5c14 }) };
/** 召唤神兽（官方 C：1/2/3 级神兽）；占位立绘用狼，美术见 art-requests */
export const SUMMON_BEAST: UnitDef = { id: 'summon_beast', art: 'summon_beast', name: '神兽', level: 1, hp: 360, atk: 22, def: 10, atkInterval: 1.15, range: 8, speed: 0, width: 140, height: 180, tier: 'player',
  card: card({ w: 150, h: 190, figureScale: 1.2, bg: 0x5a4010 }) };
/** 传世赶尸「尸灵」：占位立绘用僵尸（[适配] 属性 = 骷髅 ×1.25，见 World CS_SUMMON） */
export const SUMMON_CORPSE: UnitDef = { ...SUMMON, id: 'summon_corpse', art: 'zombie', name: '尸灵', card: card({ w: 120, h: 160, figureScale: 1.15, bg: 0x4a5a20 }) };
/** 传世强化骷髅术「金甲骷髅」：复用骷髅立绘 + 金色着色（美术见 docs/fx-requests.md） */
export const SUMMON_GOLDEN: UnitDef = { ...SUMMON, id: 'summon_golden_skeleton', name: '金甲骷髅', width: 130, height: 180, card: card({ w: 130, h: 175, figureScale: 1.25, bg: 0x8a6a10, tint: 0xffd040 }) };
/** 传世替身法符「替身」：复用骷髅立绘 + 纸符色着色占位 */
export const DECOY: UnitDef = { ...SUMMON, id: 'decoy_talisman', name: '替身', atkInterval: 99, card: card({ w: 110, h: 150, figureScale: 1.05, bg: 0x5a4a30, tint: 0xe8d8a0 }) };
/** R22：经验曲线移至 expCurve.ts（官方形状 ÷ 常数）；怪物 exp 字段为旧曲线基准值，按层由 scaledExp 同步缩放 */
export { EXP_PER_LEVEL } from './expCurve';
