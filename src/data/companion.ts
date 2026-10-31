/**
 * 合击版 #1 英雄（伙伴）数据模型。官方：英雄战/法/道三选一、独立等级经验、物品须先放进英雄包裹再穿（H5 https://baike.baidu.com/item/%E8%8B%B1%E9%9B%84%E5%90%88%E5%87%BB/10715363 ）。
 * id 用 'companion'，避开 units.ts 里主角 HERO.id = 'hero'。
 * 纯数据/逻辑，不含战斗结算（战斗 AI 归 docs/hejiban-official.md §7 #3/#4）。
 */
import { CLASSES, ClassId } from './classes';
import { ITEMS } from './items';
import { equipSlotsFor } from './items';
import type { EquipSlot, InvItem, Stats } from '../combat/types';
import { EXP_PER_LEVEL } from './expCurve';

export const COMPANION_UNIT_ID = 'companion';
/** 英雄栏 = 主角同款 9 格 + 火龙之心（H1/H5：装英雄栏左下） */
export type CompanionSlot = EquipSlot | 'heart';
export type CompanionMode = 'follow' | 'fight' | 'rest';
/** [适配] 英雄包裹格数（官方未查到） */
export const COMPANION_BAG = 10;
export interface CompanionState {
  cls: ClassId; name: string; level: number; exp: number;
  bag: InvItem[]; equip: Partial<Record<CompanionSlot, InvItem>>;
  mode: CompanionMode;
  /** #5 怒槽（0..RAGE_MAX）与火龙之心剩余储量；无火龙之心 = 0 */
  rage: number; heartStore: number;
  /** 召唤中（false = 收回）/ 上次收回时间（战斗开发用于 60s 冷却） */
  out: boolean; recallAt: number;
  /** #7 已学合击秘籍 id */
  combo?: string[];
}
export const ZERO_STATS: Stats = { hp: 0, mp: 0, atk: 0, mag: 0, tao: 0, def: 0, mdef: 0 };
export function newCompanion(cls: ClassId, name: string, level = 1): CompanionState {
  return { cls, name: name.trim().slice(0, 8) || CLASSES[cls].name + '英雄', level, exp: 0, bag: [], equip: {}, mode: 'follow', rage: 0, heartStore: 0, out: false, recallAt: -1e9 };
}
/** 旧存档 / 缺字段补默认（存档迁移） */
export function migrateCompanion(c: Partial<CompanionState> | null | undefined): CompanionState | null {
  if (!c || !c.cls || !CLASSES[c.cls]) return null;
  const d = newCompanion(c.cls, c.name ?? '', c.level ?? 1);
  return { ...d, ...c, bag: [...(c.bag ?? [])], equip: { ...(c.equip ?? {}) }, combo: [...(c.combo ?? [])] } as CompanionState;
}
/** [适配] 英雄属性：同职业主角成长 ×0.8（官方英雄成长表未查到） */
export const COMPANION_STAT_MULT = 0.8;
export function companionStats(c: CompanionState): Stats {
  const cd = CLASSES[c.cls], r: any = { ...ZERO_STATS };
  for (const k of Object.keys(ZERO_STATS) as (keyof Stats)[]) r[k] = Math.round(((cd.base[k] ?? 0) + (cd.grow[k] ?? 0) * (c.level - 1)) * COMPANION_STAT_MULT);
  for (const it of Object.values(c.equip)) if (it) for (const [k, v] of Object.entries(it.stats)) r[k] += v ?? 0;
  return r;
}
/** 英雄经验：英雄须主人带领打怪；分成比例未查到 → [适配] 主角所得 50% */
export const COMPANION_EXP_SHARE = 0.5;
export function companionGainExp(c: CompanionState, amount: number, masterLevel: number): number {
  let ups = 0; c.exp += Math.max(0, Math.round(amount * COMPANION_EXP_SHARE));
  // [适配] 英雄等级不超过主人（官方英雄等级上限未查到）
  while (c.level < masterLevel && c.exp >= EXP_PER_LEVEL(c.level)) { c.exp -= EXP_PER_LEVEL(c.level); c.level++; ups++; }
  if (c.level >= masterLevel) c.exp = Math.min(c.exp, EXP_PER_LEVEL(c.level) - 1);
  return ups;
}
export function companionTargetSlot(c: CompanionState, it: InvItem): CompanionSlot | null {
  if (ITEMS[it.item]?.heart) return 'heart';
  if (!it.slot) return null; const cs = equipSlotsFor(it.slot); return cs.find(s => !c.equip[s]) ?? cs[0] ?? null;
}
/** 英雄穿装：只能从英雄包裹穿（H5） */
export function companionEquip(c: CompanionState, bagIdx: number): string | null {
  const it = c.bag[bagIdx]; if (!it) return '英雄包裹没有该物品';
  const sl = companionTargetSlot(c, it); if (!sl) return '该物品无法装备';
  if (c.level < it.req) return `英雄需要等级 ${it.req}`;
  const cl = ITEMS[it.item]?.cls; if (cl?.length && !cl.includes(c.cls)) return '职业不符';
  c.bag.splice(bagIdx, 1); const old = c.equip[sl]; if (old) c.bag.splice(bagIdx, 0, old); c.equip[sl] = it; return null;
}
export function companionUnequip(c: CompanionState, sl: CompanionSlot): string | null {
  const it = c.equip[sl]; if (!it) return '该栏位为空'; if (c.bag.length >= COMPANION_BAG) return '英雄包裹已满';
  delete c.equip[sl]; c.bag.push(it); return null;
}
