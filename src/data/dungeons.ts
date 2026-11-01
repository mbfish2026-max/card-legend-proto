// P3 eg-dungeon：Lv40–50 可重复副本（endgame-plan §2，D2/D3/D7/E7）
// 官方依据：BOSS 刷新 双头/赤月/魔龙 6 小时（B1）；每日次数只查到「保卫家园」每日 1 次（H2/H4）。其余均为 [适配]。
// 官方 6 小时 → 本作 600 s（÷36）[适配]。
import { FLOORS } from './world';
import { ENEMIES } from './units';
import { SETS, ITEMS } from './items';
import type { ClassId } from './classes';

/** D2：每日 3 次（本地日 0 点重置）；用尽仍可进，BOSS 600 s 冷却、掉率 ×0.25 */
export const DUNGEON_DAILY = 3;
export const DUNGEON_PENALTY = 0.25;
/** D3：首通必掉 1 件套装件，之后每次 1/10 [适配] */
export const DUNGEON_FIRST_GUARANTEE = 1;
export const DUNGEON_BASE_CHANCE = 1 / 10;
/** D7：凑齐一套 ≈ 25–30 次副本（8–10 个每日次数）。按「每次副本拿到本职业新/旧套装件的总概率 q」调：
 *  4 件套 q=0.25（蒙特卡洛中位 26 次）；3 件套 q=0.15（中位 ≈ 27 次，见 tests/eg-dungeon.test.ts）。
 *  q = 1/10（D3）+ BOSS 原有本职业件掉率 + D7 补正（只在副本次数内生效，普通击杀不变，E1 不受影响）。 */
export const DUNGEON_TARGET_Q: Record<number, number> = { 4: 0.25, 3: 0.15 };

export interface DungeonDef { id: string; name: string; floor: string; bosses: string[]; sets: Record<ClassId, string>; minLv: number }
/** 套装 id：按职业 */
const SAN: Record<ClassId, string> = { warrior: 'shengzhan', mage: 'fashen', taoist: 'tianzun' };
const LT: Record<ClassId, string> = { warrior: 'leiting', mage: 'lieyan', taoist: 'guangmang' };
const ZS: Record<ClassId, string> = { warrior: 'zhanshen', mage: 'shengmo', taoist: 'zhenhun' };
export const DUNGEONS: DungeonDef[] = [
  { id: 'chiyue', name: '赤月魔穴副本', floor: '赤月魔穴', bosses: ['boss_redmoon'], sets: SAN, minLv: 45 },
  // E7：双头金刚/双头血魔（官方：双头血魔爆圣战、双头金刚挖法神，B1/B3）—— 恶魔祭坛已有两只，纳入副本
  { id: 'jitan', name: '恶魔祭坛副本', floor: '恶魔祭坛', bosses: ['boss_twinhead_kong', 'boss_twinhead_blood'], sets: SAN, minLv: 45 },
  { id: 'wolong', name: '卧龙山庄副本', floor: '卧龙山庄', bosses: ['boss_wolong'], sets: SAN, minLv: 47 },
  { id: 'leiyan', name: '雷炎洞穴副本', floor: '雷炎洞穴', bosses: ['boss_leiyan'], sets: LT, minLv: 48 },
  { id: 'molong', name: '魔龙血域副本', floor: '魔龙血域', bosses: ['boss_molong'], sets: ZS, minLv: 48 },
  { id: 'huolong', name: '火龙神殿副本', floor: '火龙神殿', bosses: ['boss_fire_dragon'], sets: LT, minLv: 49 },
];
/** D7 统一调整：赤月恶魔原 setDrop 每杀必掉 1 件三圣（setChance 缺省 1）→ 一套只需 ≈8 次，远快于 25–30 次目标；改 0.15 [适配] */
export const REDMOON_SET_CHANCE = 0.15;
/** 只在副本击杀时生效（普通/关闭副本时沿用原 setChance，9 seed 回归不变） */
export const DUNGEON_SET_CHANCE: Record<string, number> = { boss_redmoon: REDMOON_SET_CHANCE };
/** 副本内对 BOSS 原掉落的倍率（只在副本击杀生效）：魔龙战神系 1/30 → 1/60，使 3 件套 q≈0.15 */
const ZS_PIECES = ['warrior', 'mage', 'taoist'].flatMap(c => [`${ZS[c as ClassId]}_necklace`, `${ZS[c as ClassId]}_bracelet`, `${ZS[c as ClassId]}_ring`]);
export const DUNGEON_ITEM_SCALE: Record<string, Record<string, number>> = { boss_molong: Object.fromEntries(ZS_PIECES.map(i => [i, 0.5])) };
/** 层 index → 副本 */
export const DUNGEON_BY_FLOOR: Record<number, DungeonDef> = {};
for (const d of DUNGEONS) { const i = FLOORS.findIndex(f => f.name === d.floor); if (i >= 0) DUNGEON_BY_FLOOR[i] = d; }

/** 该副本一次（所有 BOSS 合计）原有掉落中本职业套装件的概率 */
export function nativeQ(d: DungeonDef, cls: ClassId): number {
  const pieces = SETS[d.sets[cls]].pieces; let miss = 1;
  for (const b of d.bosses) { const u = ENEMIES[b]; if (!u) continue;
    for (const dr of u.drops ?? []) if (pieces.includes(dr.item)) miss *= 1 - dr.chance * (DUNGEON_ITEM_SCALE[b]?.[dr.item] ?? 1);
    if (u.setDrop?.length) { const own = u.setDrop.filter(id => ITEMS[id]?.cls?.includes(cls)), pool = own.length ? own : u.setDrop;
      miss *= 1 - (DUNGEON_SET_CHANCE[b] ?? u.setChance ?? 1) * pool.filter(id => pieces.includes(id)).length / pool.length; } }
  return 1 - miss;
}
/** D7 补正：额外一次抽签的概率，使 1-(1-native)(1-1/10)(1-bonus)=target */
export function bonusChance(d: DungeonDef, cls: ClassId): number {
  const t = DUNGEON_TARGET_Q[SETS[d.sets[cls]].pieces.length] ?? 0.2;
  return Math.max(0, 1 - (1 - t) / ((1 - nativeQ(d, cls)) * (1 - DUNGEON_BASE_CHANCE)));
}
/** 本地日键（设备时间，Asia/Shanghai 用户即北京时间 0 点重置） */
export function localDay(now = new Date()): string { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
