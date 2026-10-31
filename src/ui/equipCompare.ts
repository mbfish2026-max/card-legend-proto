// feat/equip-compare：物品提示与身上同部位装备的属性差（涨绿降红）；戒指/手镯双位分别对比；空位显示「未穿戴」
import type { EquipSlot, InvItem } from '../combat/types';
import { EQUIP_SLOT_NAMES, STAT_NAMES, equipSlotsFor } from '../data/items';
export const UP = '#7aff7a', DOWN = '#ff5a5a';
/** 返回提示行；it 本身已穿戴或非装备时返回空 */
export function compareLines(it: InvItem, equip: Partial<Record<EquipSlot, InvItem>>): [string, string][] {
  if (!it.slot) return [];
  const slots = equipSlotsFor(it.slot); if (slots.some(s => equip[s] === it || (equip[s] && equip[s]!.uid === it.uid))) return [];
  const out: [string, string][] = [];
  for (const s of slots) {
    const cur = equip[s], tag = slots.length > 1 ? EQUIP_SLOT_NAMES[s] : '身上';
    if (!cur) { out.push([`对比${tag}：未穿戴`, '#aaa']); continue; }
    out.push([`对比${tag}：${cur.name}`, '#aaa']);
    const keys = [...new Set([...Object.keys(it.stats), ...Object.keys(cur.stats)])] as (keyof typeof STAT_NAMES)[];
    let any = false;
    for (const k of keys) { const d = ((it.stats as any)[k] ?? 0) - ((cur.stats as any)[k] ?? 0); if (!d) continue; any = true; out.push([`  ${STAT_NAMES[k] ?? k} ${d > 0 ? '+' : ''}${d}`, d > 0 ? UP : DOWN]); }
    if (!any) out.push(['  属性相同', '#aaa']);
  }
  return out;
}
