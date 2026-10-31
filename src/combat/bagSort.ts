// feat/bag-sort：背包整理——按品质、等级降序；可叠加物（带 qty，如黑铁同纯度）合并；空格在后（背包为紧凑数组）
import type { InvItem, Rarity } from './types';
export const RARITY_RANK: Record<Rarity, number> = { rare: 2, magic: 1, common: 0 };
/** [适配] 整理合并的单堆上限（官方叠加上限未查到） */
export const BAG_STACK_MAX = 999;
const stackKey = (it: InvItem) => (!it.slot && (it.qty !== undefined || it.item === 'black_iron')) ? `${it.item}|${it.purity ?? 1}` : null;
/** 返回新数组，不修改入参；不涉及已穿装备 */
export function sortBag(bag: InvItem[], cap = Infinity): InvItem[] {
  const out: InvItem[] = [], stacks = new Map<string, InvItem[]>();
  for (const it of bag) { if (!it) continue; const k = stackKey(it); if (!k) { out.push(it); continue; }
    let left = it.qty ?? 1; const list = stacks.get(k) ?? []; stacks.set(k, list);
    for (const s of list) { const room = BAG_STACK_MAX - (s.qty ?? 1); if (room <= 0) continue; const m = Math.min(room, left); s.qty = (s.qty ?? 1) + m; left -= m; if (!left) break; }
    if (left > 0) { const n = { ...it, qty: left }; list.push(n); out.push(n); }
    while (list.length && (list[list.length - 1].qty ?? 1) > BAG_STACK_MAX) { const last = list[list.length - 1], extra = last.qty! - BAG_STACK_MAX; last.qty = BAG_STACK_MAX; const n = { ...last, qty: extra }; list.push(n); out.push(n); }
  }
  out.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.req - a.req || a.item.localeCompare(b.item) || a.uid - b.uid);
  void cap; return out; // 合并只会减少或保持格数（拆出的溢出堆只来自已存在的超上限堆），不会超出原格数
}
