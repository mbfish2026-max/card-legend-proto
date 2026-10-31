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
  const r = { ...d, ...c, bag: [...(c.bag ?? [])], equip: { ...(c.equip ?? {}) }, combo: [...(c.combo ?? [])] } as CompanionState;
  // #5 存档兜底：怒槽/储量缺省 0 并夹到合法区间
  r.rage = Math.max(0, Math.min(100, +r.rage || 0)); r.heartStore = Math.max(0, Math.min(30000, +r.heartStore || 0)); return r;
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

// ===== #2 英雄获取 =====
/** 官方：角色 40 级，经苍月岛「神秘人」送至英雄地，长老处选职业+起名，免费（H2 https://actmir2.web.sdo.com/project/mir2180/index.html 、H3、H4） */
export const COMPANION_UNLOCK_LEVEL = 40;
/** [适配] 本作没有苍月岛/英雄地地图：在城里老兵处弹剧情对话完成（神秘人→长老两步合一） */
export const RECRUIT_DIALOG = ['神秘人：你已有 40 级修为，随我去英雄地吧。', '长老：选一位英雄与你并肩作战，给他起个名字。'];

// ===== #5 怒槽 + 火龙之心（仅数据/存档/UI；爆发结算留给战斗开发） =====
/** 官方：火龙之心储量 30000（H1 https://actmir2.web.sdo.com/project/mir2180/index.html 、H5） */
export const HEART_STORE_MAX = 30000;
/** [适配] 怒槽满值（官方未查到） */
export const RAGE_MAX = 100;
export const HEART_ITEM = 'fire_heart';
/** 官方可补充物（H5）；每件补充储量为 [适配]（官方未查到） */
export const HEART_FEED: Record<string, { name: string; rage: number; price: number }> = {
  herb_scorpion: { name: '蝎尾', rage: 300, price: 20 },
  herb_antler: { name: '鹿茸', rage: 300, price: 20 },
  herb_yinyang: { name: '阴阳仙草', rage: 500, price: 40 },
  hl_yulu: { name: '九花玉露', rage: 3000, price: 300 },
  hl_xuelu: { name: '九花雪露', rage: 3000, price: 300 },
  hl_yuanshen: { name: '元神丹', rage: 5000, price: 500 },
  hl_huiqi: { name: '回气糕', rage: 2000, price: 200 },
  hl_buqi: { name: '补气丹', rage: 2000, price: 200 },
};
ITEMS[HEART_ITEM] = { id: HEART_ITEM, name: '火龙之心', icon: 'assets/items/INV_Misc_Gem_Pearl_01.png', price: 0, heart: true };
for (const [id, f] of Object.entries(HEART_FEED)) ITEMS[id] ??= { id, name: f.name, icon: 'assets/items/INV_Misc_Food_15.png', price: f.price, rage: f.rage };
// 肉类 [适配] 补充量
if (ITEMS.chicken) ITEMS.chicken.rage ??= 100; if (ITEMS.meat) ITEMS.meat.rage ??= 150;
/** 物品可补充的储量（书页/白日门技能书同样可喂；未知 = 0） */
export function heartFeedValue(itemId: string): number {
  const d = ITEMS[itemId]; if (!d) return 0; if (d.rage) return d.rage;
  if (d.book) return 1000; // [适配] 技能书/书页补充量
  return 0;
}
export function hasHeart(c: CompanionState): boolean { return !!c.equip.heart; }
/** 往火龙之心喂物品（不超过 HEART_STORE_MAX），返回实际补充量 */
export function feedHeart(c: CompanionState, itemId: string, qty = 1): number {
  if (!hasHeart(c)) return 0; const v = heartFeedValue(itemId) * qty; const before = c.heartStore;
  c.heartStore = Math.min(HEART_STORE_MAX, c.heartStore + v); return c.heartStore - before;
}
// ---- 战斗开发接入点（占位，无战斗结算） ----
/** TODO(战斗开发)：每 tick 从 heartStore 往 rage 补充；积满时间官方未查到，当前不做任何事 */
export function rageTick(_c: CompanionState, _dt: number): void { /* 占位 */ }
/** 怒槽满且装了火龙之心 → 可爆发（Ctrl+S，H1） */
export function canUnleash(c: CompanionState): boolean { return hasHeart(c) && c.out && c.rage >= RAGE_MAX; }
/** TODO(战斗开发)：爆发期间持续消耗、同目标同范围释放、耗尽作废（H1）；此处只清槽占位 */
export function unleash(c: CompanionState): boolean { if (!canUnleash(c)) return false; c.rage = 0; return true; }

// ===== #7 龙人合书（合击秘籍） =====
/** 官方：英雄 43 级，到白日门龙人处交 2 本白日门技能书 + 金条 2 根（H1）/金刚石（H5）→ 合击秘籍 → 获得火龙之心 */
export const COMBO_LEVEL = 43;
export const COMBO_GOLD_BARS = 2;
export const BRM_BOOK = 'brm_book', BOOK_PAGE = 'book_page', GOLD_BAR = 'gold_bar';
/** [适配] 书页合成白日门技能书所需页数（官方未查到）；各组合所需具体书名官方未查到 → 统一用「白日门技能书」 */
export const PAGES_PER_BOOK = 10;
ITEMS[BRM_BOOK] ??= { id: BRM_BOOK, name: '白日门技能书', icon: 'assets/items/INV_Misc_Gem_Pearl_01.png', price: 500, rage: 1000 };
ITEMS[BOOK_PAGE] ??= { id: BOOK_PAGE, name: '书页', icon: 'assets/items/INV_Misc_Gem_Pearl_01.png', price: 20, rage: 100 };
ITEMS[GOLD_BAR] ??= { id: GOLD_BAR, name: '金条', icon: 'assets/items/INV_Misc_Gem_Pearl_01.png', price: 1000 };
/** 6 种组合（H1/H5 名称官方；数值未查到） */
export const COMBOS: { id: string; name: string; pair: [ClassId, ClassId] }[] = [
  { id: 'pohun', name: '破魂斩', pair: ['warrior', 'warrior'] },
  { id: 'huolong', name: '火龙气焰', pair: ['mage', 'mage'] },
  { id: 'shihun', name: '噬魂沼泽', pair: ['taoist', 'taoist'] },
  { id: 'leiting', name: '雷霆一击', pair: ['warrior', 'mage'] },
  { id: 'mori', name: '末日审判', pair: ['mage', 'taoist'] },
  { id: 'pixing', name: '劈星斩', pair: ['warrior', 'taoist'] },
];
export function comboFor(a: ClassId, b: ClassId) { return COMBOS.find(c => (c.pair[0] === a && c.pair[1] === b) || (c.pair[0] === b && c.pair[1] === a)); }
