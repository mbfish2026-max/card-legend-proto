/**
 * feat/potion-expand：药水扩充（强效药/太阳水/药水捆）+ 3 格药水栏选择 + 旧 key 迁移。纯数据/纯函数，World 与 UI 共用，单测 tests/potion-expand.test.ts。
 * 规则见 docs/potion-expand.md（用户已拍板版）。
 */
import { POTIONS } from './skills';
import type { InvItem } from '../combat/types';

export const POT_MAX = 999;          // 散装单种上限
export const BUNDLE_N = 6;           // 每捆瓶数
export const BUNDLE_STACK_MAX = 999; // 捆在背包里单格叠加上限

/** 药水下标（按 item key） */
export const potIndex = (item: string) => POTIONS.findIndex(p => p.item === item);

/** 捆：背包物品 id → 散装药 key；名称沿用官方，「超级」留给强效捆 */
export const BUNDLES: Record<string, { pot: string; name: string }> = {
  bundle_hp_small: { pot: 'hp_small', name: '金创药(小)包' },
  bundle_mp_small: { pot: 'mp_small', name: '魔法药(小)包' },
  bundle_hp_mid: { pot: 'hp_mid', name: '金创药(中)包' },
  bundle_mp_mid: { pot: 'mp_mid', name: '魔法药(中)包' },
  bundle_hp_big: { pot: 'hp_big', name: '超级金创药' },
  bundle_mp_big: { pot: 'mp_big', name: '超级魔法药' },
  bundle_sun: { pot: 'sun', name: '太阳水包' },
  bundle_sun_big: { pot: 'sun_big', name: '强效太阳水包' },
};
/** 捆价 = 单价 × 6，不打折 */
export const bundlePrice = (id: string) => { const b = BUNDLES[id]; const p = b && POTIONS[potIndex(b.pot)]; return p ? p.price * BUNDLE_N : 0; };
/** 药店等级门槛（散装与捆同门槛） */
export const potLevel = (item: string) => POTIONS[potIndex(item)]?.lv ?? 1;

/** 3 格药水栏：红 / 蓝 / 太阳水；每格可在同类药之间切换（长按弹层） */
export const POT_SLOTS = [
  { id: 'hp', name: '红药', items: ['hp_small', 'hp_mid', 'hp_big'] },
  { id: 'mp', name: '蓝药', items: ['mp_small', 'mp_mid', 'mp_big'] },
  { id: 'sun', name: '太阳水', items: ['sun', 'sun_big'] },
] as const;
export const POT_SLOT_N = POT_SLOTS.length;

/** 旧档里的同类物品（items-town 时期的背包消耗品）→ 新 key */
export const LEGACY_POT_KEYS: Record<string, string> = { hp_strong: 'hp_big', mp_strong: 'mp_big', sun_water: 'sun' };

/** 默认选中：该类里当前有货的最低级；都没有选最低级 */
export function defaultSel(pots: number[]): string[] {
  return POT_SLOTS.map(s => s.items.find(k => (pots[potIndex(k)] ?? 0) > 0) ?? s.items[0]);
}
/** 校正存档里的选择（缺省/非法 → 默认） */
export function normSel(sel: unknown, pots: number[]): string[] {
  const d = defaultSel(pots), a = Array.isArray(sel) ? sel : [];
  return POT_SLOTS.map((s, i) => (s.items as readonly string[]).includes(a[i]) ? a[i] : d[i]);
}

/** 药店列表：散装（非 bundleOnly）+ 捆，按门槛标 locked（灰显，不隐藏） */
export interface PotShopRow { kind: 'pot' | 'bundle'; id: string; idx: number; price: number; lv: number; locked: boolean }
export function potShopRows(level: number): PotShopRow[] {
  const rows: PotShopRow[] = [];
  POTIONS.forEach((p, i) => { if (!p.bundleOnly) rows.push({ kind: 'pot', id: p.item, idx: i, price: p.price, lv: p.lv ?? 1, locked: level < (p.lv ?? 1) }); });
  for (const id of Object.keys(BUNDLES)) { const i = potIndex(BUNDLES[id].pot), lv = potLevel(BUNDLES[id].pot); rows.push({ kind: 'bundle', id, idx: i, price: bundlePrice(id), lv, locked: level < lv }); }
  return rows;
}

/**
 * 旧档迁移（纯函数，不改入参）：
 * - pots 补到 POTIONS.length（缺的补 0），原值不动
 * - 主角背包/仓库里的 hp_strong/mp_strong/sun_water（以及误入背包的散装新药）→ 并入 pots（数量保留，封顶 POT_MAX；超出部分以新 key 物品留在原处）
 * - 英雄包裹里的旧 key → 改名为新 key（英雄仍从包裹喝药）
 */
export function migratePots<T extends { pots?: number[]; bag?: InvItem[]; storage?: InvItem[]; companion?: { bag: InvItem[] } | null }>(save: T, names: Record<string, string> = {}): T & { pots: number[] } {
  const pots = POTIONS.map((_, i) => Math.max(0, Math.floor(Number(save.pots?.[i] ?? 0)) || 0));
  const absorb = (list: InvItem[] | undefined) => {
    if (!list) return list; const out: InvItem[] = [];
    for (const it of list) {
      const k = LEGACY_POT_KEYS[it.item] ?? it.item, i = potIndex(k);
      if (i < 0 || BUNDLES[it.item]) { out.push(it); continue; }
      const q = it.qty ?? 1, take = Math.min(q, POT_MAX - pots[i]); pots[i] += take;
      if (q - take > 0) out.push({ ...it, item: k, name: names[k] ?? it.name, qty: q - take });
    }
    return out;
  };
  const rename = (list: InvItem[]) => list.map(it => LEGACY_POT_KEYS[it.item] ? { ...it, item: LEGACY_POT_KEYS[it.item], name: names[LEGACY_POT_KEYS[it.item]] ?? it.name } : it);
  const bag = absorb(save.bag), storage = absorb(save.storage);
  const companion = save.companion ? { ...save.companion, bag: rename(save.companion.bag ?? []) } : save.companion;
  return { ...save, pots, ...(bag ? { bag } : {}), ...(storage ? { storage } : {}), ...(save.companion !== undefined ? { companion } : {}) };
}
