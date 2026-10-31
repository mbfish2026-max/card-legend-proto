// 装备对比改版（左右并排）：左 = 身上同部位已穿装备，右 = 当前查看的装备；属性取两边并集逐行对齐，右侧相对左侧差值涨绿降红。
// 规则见 docs/equip-compare.md。纯数据函数，界面在 Panel.showCompare。
import type { EquipSlot, InvItem } from '../combat/types';
import { STAT_NAMES, equipSlotsFor } from '../data/items';
export const UP = '#7aff7a', DOWN = '#ff5a5a', SAME = '#cccccc';
/** 属性显示顺序（并集按此排序，未知键排最后） */
export const STAT_ORDER = ['atk', 'mag', 'tao', 'def', 'mdef', 'hp', 'mp'];
/** 「越低越好」的行：差值方向反转。当前只有需求等级（属性本身没有越低越好的项） */
export const LOWER_BETTER = new Set(['req']);
/** 对比评分（双槽位选「较弱的一件」用）：攻/魔/道/防/魔御各 1 分，生命/魔法值 0.1 分，强化每级 +1 */
export function cmpScore(it: InvItem | undefined): number {
  if (!it) return -Infinity; let s = 0;
  for (const [k, v] of Object.entries(it.stats)) s += (v ?? 0) * (k === 'hp' || k === 'mp' ? 0.1 : 1);
  return s + (it.enhance ?? 0);
}
/** 双槽位：有空位取空位；都穿着取评分较低（较弱）的一件，同分取第一格。单槽位直接返回该格 */
export function compareSlot(it: InvItem, equip: Partial<Record<EquipSlot, InvItem>>): EquipSlot | null {
  if (!it.slot) return null; const c = equipSlotsFor(it.slot);
  const empty = c.find(s => !equip[s]); if (empty) return empty;
  return c.reduce((a, b) => (cmpScore(equip[b]) < cmpScore(equip[a]) ? b : a));
}
export interface CmpRow { key: string; label: string; left: string; right: string; diff: number; color: string }
export interface CmpData { slot: EquipSlot; left: InvItem | null; other: InvItem | null; rows: CmpRow[] }
const sign = (d: number) => (d > 0 ? '+' : '') + d;
/** 生成对比数据；非装备或 it 已穿在身上返回 null */
export function compareRows(it: InvItem, equip: Partial<Record<EquipSlot, InvItem>>): CmpData | null {
  if (!it.slot) return null; const slots = equipSlotsFor(it.slot);
  if (slots.some(s => equip[s] && (equip[s] === it || equip[s]!.uid === it.uid))) return null;
  const slot = compareSlot(it, equip)!, L = equip[slot] ?? null, other = slots.length > 1 ? (equip[slots.find(s => s !== slot)!] ?? null) : null;
  const keys = [...new Set([...Object.keys(it.stats), ...Object.keys(L?.stats ?? {})])].filter(k => (it.stats as any)[k] || (L?.stats as any)?.[k])
    .sort((a, b) => (STAT_ORDER.indexOf(a) + 1 || 99) - (STAT_ORDER.indexOf(b) + 1 || 99));
  const row = (key: string, label: string, l: number | undefined, r: number, hasL: boolean): CmpRow => {
    const raw = r - (l ?? 0), good = LOWER_BETTER.has(key) ? -raw : raw;
    return { key, label, left: hasL ? String(l ?? 0) : '—', right: String(r), diff: raw, color: !hasL ? UP : good > 0 ? UP : good < 0 ? DOWN : SAME };
  };
  const rows = keys.map(k => row(k, STAT_NAMES[k] ?? k, (L?.stats as any)?.[k] ?? 0, (it.stats as any)[k] ?? 0, !!L));
  if (L?.enhance || it.enhance) rows.push(row('enhance', '强化', L?.enhance ?? 0, it.enhance ?? 0, !!L));
  rows.push(row('req', '需要等级', L?.req, it.req, !!L));
  return { slot, left: L, other, rows };
}
export const diffText = (r: CmpRow) => (r.left === '—' ? '' : r.diff ? sign(r.diff) : '=');
