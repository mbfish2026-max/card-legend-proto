// drop-realign：导出所有层（序号/名称/目标等级/怪物 id·名称·tier）与全部敌人（含未上层的）为 JSON。只读。
import '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { OFFICIAL_DROPS } from '../src/data/drops-official';
import { NAME_TO_ITEM } from '../src/data/drops';
import { FLOORS } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { ITEMS } from '../src/data/items';
const floors = FLOORS.map((f: any, i: number) => ({ n: i + 1, name: f.name, lv: FLOOR_TARGET_LV[i], units: [...new Set(f.spawns.map((s: any) => s.id))] }));
const units = Object.fromEntries(Object.entries(ENEMIES).map(([id, u]: any) => [id, { name: u.name, tier: u.tier, elite: !!u.elite, drops: (u.drops ?? []).map((d: any) => [d.item, d.chance]) }]));
const official: Record<string, { name: string; src: string; items: Record<string, number> }> = {};
for (const [id, t] of Object.entries(OFFICIAL_DROPS)) { const items: Record<string, number> = {};
  for (const [n, N] of t.drops) { const it = NAME_TO_ITEM[n]; if (it) items[it] = Math.min(items[it] ?? 1e9, N); } official[id] = { name: t.name, src: t.src, items, raw: t.drops.map(([n, N]: any) => [n, N]) } as any; }
const items = Object.fromEntries(Object.entries(ITEMS).filter(([, d]: any) => d.slot).map(([id, d]: any) => [id, { name: d.name, slot: d.slot, req: d.req ?? 0, price: d.price ?? 0, equip: d.equip ?? {}, cls: d.cls ?? [], set: d.set ?? '' }]));
console.log(JSON.stringify({ floors, units, official, items }));
