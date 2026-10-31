import { OFFICIAL_DROPS } from './drops-official';
/**
 * R13 逐级掉落：怪物/BOSS 掉落表数据化。
 * 原始爆率见 drops-official.ts（21cq.com 1.76 资料库，爆率 1/N），核对表见 docs/drops-official.md。
 * 规则：有资料的怪 → 只掉资料表里出现、且本作已实现的物品，几率 = 1/N（不加成）；
 *       金币数量与几率资料未给 → 沿用原值 [适配]；
 *       无资料的怪（本作原创/未查到）→ 保留原 [适配] 掉落。
 */
/** 资料物品名 → 本作物品 id（[适配] 标注：强效药并入中量药；男女款合并为一件） */
export const NAME_TO_ITEM: Record<string, string> = {
  '金创药(小量)': 'hp_small', '金创药(中量)': 'hp_mid', '强效金创药': 'hp_mid',
  '魔法药(小量)': 'mp_small', '魔法药(中量)': 'mp_mid', '强效魔法药': 'mp_mid',
  '肉': 'meat', // 祝福油由 World 额外掉落逻辑处理（首领必掉，与资料 1/1 一致）
  '木剑': 'wood_sword', '铁剑': 'iron_sword', '魔杖': 'magic_staff', '银蛇': 'tao_sword', '屠龙': 'dragon_sword',
  '短剑': 'short_sword', '青铜剑': 'bronze_sword', '匕首': 'dagger', '乌木剑': 'ebony_sword', '青铜斧': 'bronze_axe',
  '八荒': 'bahuang', '半月': 'banyue', '海魂': 'haihun', '凌风': 'lingfeng', '降魔': 'xiangmo', '偃月': 'yanyue',
  '修罗': 'xiuluo', '斩马刀': 'zhanma', '破魂': 'pohun', '凝霜': 'ningshuang', '炼狱': 'lianyu',
  '井中月': 'jingzhongyue', '无极棍': 'wujigun', '龙纹剑': 'longwen', '裁决之杖': 'caijue', '骨玉权杖': 'guyu',
  '布衣(男)': 'cloth', '布衣(女)': 'cloth', '轻型盔甲(男)': 'light_armor', '轻型盔甲(女)': 'light_armor',
  '重盔甲(男)': 'armor', '重盔甲(女)': 'armor', '灵魂战衣(男)': 'soul_robe', '灵魂战衣(女)': 'soul_robe',
  '魔法长袍(男)': 'magic_robe', '魔法长袍(女)': 'magic_robe', '战神盔甲(男)': 'war_armor', '战神盔甲(女)': 'war_armor',
  '幽灵战衣(男)': 'ghost_robe', '幽灵战衣(女)': 'ghost_robe', '恶魔长袍(男)': 'demon_robe', '恶魔长袍(女)': 'demon_robe',
  '青铜头盔': 'helmet', '骷髅头盔': 'bone_helm', '道士头盔': 'tao_helm', '魔法头盔': 'magic_helm', '金戒指': 'gold_ring',
};
/** 资料书名 → 本作技能 id */
export const BOOK_NAME: Record<string, string> = {
  '攻杀剑术': 'slaying', '刺杀剑术': 'thrust', '半月弯刀': 'half_moon', '野蛮冲撞': 'rush', '烈火剑法': 'fire_sword',
  '雷电术': 'thunder', '火墙': 'fire_wall', '魔法盾': 'magic_shield', '冰咆哮': 'ice_roar',
  '精神力战法': 'spirit_force', '施毒术': 'poison', '灵魂火符': 'soul_fire', '召唤骷髅': 'summon_skeleton', '召唤神兽': 'summon_beast',
};
export interface Drop { item: string; chance: number }
/** 某怪的资料掉落（已映射、同物品取最高几率）；无资料返回 undefined */
export function officialDrops(unitId: string): Drop[] | undefined {
  const t = OFFICIAL_DROPS[unitId]; if (!t) return undefined;
  const m = new Map<string, number>();
  for (const [name, n] of t.drops) { const id = NAME_TO_ITEM[name]; if (id) m.set(id, Math.max(m.get(id) ?? 0, 1 / n)); }
  return [...m].map(([item, chance]) => ({ item, chance }));
}
/** 某怪的技能书爆率表 skill → 几率；无资料返回 undefined */
export function officialBookRates(unitId: string): Record<string, number> | undefined {
  const t = OFFICIAL_DROPS[unitId]; if (!t) return undefined;
  const r: Record<string, number> = {};
  for (const [name, n] of t.drops) { const s = BOOK_NAME[name]; if (s) r[s] = Math.max(r[s] ?? 0, 1 / n); }
  return r;
}
