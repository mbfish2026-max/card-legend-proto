/**
 * 装备需求/掉落重新对齐（docs/drop-realign.md，用户已批准 G1–G9）。
 * 在 drop-plan 末尾执行：用 REALIGN_PLAN（B 表）整体替换 124 件装备在普通掉落表里的来源和爆率。
 * 机制源不动：setDrop（套装抽签）、副本补正（DUNGEON_SET_CHANCE）、DUNGEON_ITEM_SCALE。
 * 首杀加成不做（G1），精英层级不加（G3）。
 */
import { H_PLAN } from './h-chain';
import { ENEMIES } from './units';
import { ITEMS } from './items';
import { REALIGN_PLAN } from './drop-realign-table';
import type { InvItem } from '../combat/types';

/** C 章曲线：[需求下限, 上限, K, BOSS 上限分母, BOSS 下限分母, BOSS 段默认分母]；普通怪三个分母 ×2 */
/** early-gear-3-5：1–9 档系数 ×2（K 8→16、BOSS 上限 3→2（1.5 取整）、下限 60→30、默认 8→4）；其它档不动 */
export const REALIGN_BANDS: [number, number, number, number, number, number][] = [
  [1, 9, 16, 2, 30, 4], [10, 19, 10, 5, 100, 12], [20, 29, 15, 8, 150, 20], [30, 39, 25, 12, 250, 30], [40, 49, 40, 20, 400, 50], [50, 999, 40, 30, 600, 80]];
/** A 章等级规则：需求 ≤ 怪物等级 + X（普通 6 / BOSS 8），且怪物等级 ≤ 需求 + 15 */
export const REALIGN_X_NORMAL = 6, REALIGN_X_BOSS = 8, REALIGN_OVER = 15;
/** 返回 1/N 的分母 N。officialN 未查到（undefined）→ 段默认 */
export function realignDen(req: number, boss: boolean, officialN?: number): number {
  const [, , K, cap, flo, def] = REALIGN_BANDS.find(b => req >= b[0] && req <= b[1])!;
  const m = boss ? 1 : 2;
  if (officialN === undefined) return def * m;
  return Math.max(cap * m, Math.min(flo * m, Math.round(officialN / K)));
}
/** 改造前的装备来源（只读快照，供审计/测试） */
export const REALIGN_BEFORE: Record<string, { item: string; chance: number }[]> = {};
export function applyRealign(): void {
  for (const [id, u] of Object.entries(ENEMIES)) {
    REALIGN_BEFORE[id] = (u.drops ?? []).filter(d => d.item in REALIGN_PLAN).map(d => ({ ...d }));
    if (u.drops) u.drops = u.drops.filter(d => !(d.item in REALIGN_PLAN) && !(d.item in H_PLAN));
  }
  for (const [item, src] of Object.entries(REALIGN_PLAN)) {
    if (!ITEMS[item]) continue;
    for (const [uid, n] of src) { const u = ENEMIES[uid]; if (!u) continue; (u.drops ??= []).push({ item, chance: 1 / n }); }
  }
  // H 章过渡链新物品（只掉落，G9 不上商店）
  for (const [item, src] of Object.entries(H_PLAN)) for (const [uid, n] of src) { const u = ENEMIES[uid]; if (u) (u.drops ??= []).push({ item, chance: 1 / n }); }
}
/** D5 改名（只改显示名，id 不变）：旧名 → 新名 */
export const RENAMED: Record<string, [string, string]> = { tao_sword: ['银蛇剑', '银蛇'], dragon_sword: ['屠龙刀', '屠龙'] };
/**
 * 存档兼容（G2）：读档时刷新背包/仓库/身上物品的显示名和需求等级（按 id 取 ITEMS 当前值）。
 * 身上已穿戴的不强制卸下（需求只在穿戴时检查）；卸下后再穿按新需求。品质后缀（[精良]/[极品]）保留。
 */
export function refreshInvItem(it: InvItem | undefined): void {
  if (!it) return; const def = ITEMS[it.item]; if (!def?.slot) return;
  const rn = RENAMED[it.item]; if (rn && it.name.startsWith(rn[0])) it.name = rn[1] + it.name.slice(rn[0].length);
  if (def.req !== undefined) it.req = def.req;
}
