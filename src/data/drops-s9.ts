/**
 * R14 #7 沃玛教主掉落：按 S9（thelegendofmir2.com 沃玛教主页，逐件爆率）重写。
 * [适配] 倍率 K：S9 几率 < 10% 的条目 ×K（卡牌局数远少于端游），上限 1；≥10% 的原样。
 * 祝福油由 World 首领必掉逻辑处理（S9 为 25%，本作首领必掉 [适配]）。
 * 记忆套装、传送戒指、沃玛首饰中本作未实现的件不进池（见 docs/towns-npcs-official.md #7）。
 */
export const S9_SRC = 'https://www.thelegendofmir2.com/ (沃玛教主 Woma Taurus 掉落页，gap-vs-official S9)';
export const WOMA_K = 4;
/** [物品 id, S9 原始几率] */
export const WOMA_S9_RAW: [string, number][] = [
  ['hp_strong', 1], ['mp_strong', 1], ['sun_water', 1], ['woma_horn', 0.25],
  ['pohun', 0.5], ['zhanma', 0.5], ['yanyue', 0.5], ['xiangmo', 0.5],
  ['xiuluo', 0.0833], ['ningshuang', 0.0125], ['lianyu', 0.0006], ['magic_staff', 0.0006], ['tao_sword', 0.0006],
  ['armor', 0.05], ['soul_robe', 0.05], ['magic_robe', 0.05], ['bone_helm', 0.0833],
  ['set_woma_necklace', 0.0025], ['set_woma_bracelet', 0.0025], ['set_woma_helm', 0.0025],
];
export const WOMA_S9 = WOMA_S9_RAW.map(([item, p]) => ({ item, chance: p < 0.1 ? Math.min(1, p * WOMA_K) : p }));
/** S9 书爆率（技能 id → 几率，未乘 K：书掉落沿用官方原值） */
export const WOMA_S9_BOOKS: Record<string, number> = { fire_sword: 0.0013, rush: 0.0025, mass_heal: 0.0013, summon_beast: 0.0012, magic_shield: 0.0017, holy_word: 0.0013, ice_roar: 0.0012 };
