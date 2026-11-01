// drop-audit-full：导出全部装备（ITEMS 中有 slot 的）+ 我方来源（楼层掉落/setDrop/副本套装/商店）为 JSON。只读。
import '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { ITEMS, SETS } from '../src/data/items';
import { FLOORS } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { EQUIP_META } from '../src/data/equip-official';
import { DUNGEONS } from '../src/data/dungeons';
import { TOWNS } from '../src/data/towns';
const setOf: Record<string, string> = {};
for (const [sid, s] of Object.entries(SETS as any)) for (const p of (s as any).pieces) setOf[p] = `${(s as any).name}(${sid})`;
const src: Record<string, string[]> = {};
const add = (id: string, s: string) => { (src[id] ??= []).includes(s) || src[id].push(s); };
FLOORS.forEach((f: any, i: number) => {
  for (const id of new Set(f.spawns.map((s: any) => s.id)) as Set<string>) { const u: any = ENEMIES[id]; if (!u) continue;
    for (const d of u.drops ?? []) if ((ITEMS as any)[d.item]?.slot) add(d.item, `${i + 1}${f.name}L${FLOOR_TARGET_LV[i]}×${u.name}${u.tier === 'boss' ? '(BOSS)' : ''}×1/${Math.round(1 / d.chance)}`);
    for (const s of u.setDrop ?? []) add(s, `${i + 1}${f.name}L${FLOOR_TARGET_LV[i]}×${u.name}(BOSS)×setDrop(p=${u.setChance ?? 1},池${u.setDrop.length})`);
  } });
for (const d of DUNGEONS) for (const [c, sid] of Object.entries(d.sets)) for (const p of (SETS as any)[sid].pieces) add(p, `${d.name}×副本补正抽签(${c})`);
for (const t of Object.values(TOWNS as any)) for (const n of (t as any).npcs) for (const g of n.goods ?? []) if ((ITEMS as any)[g.id ?? g.item]?.slot) add(g.id ?? g.item, `商店:${(t as any).name}·${n.name}`);
const out = Object.values(ITEMS as any).filter((it: any) => it.slot).map((it: any) => { const m: any = (EQUIP_META as any)[it.id] ?? {};
  return { id: it.id, name: it.name, slot: it.slot, set: setOf[it.id] ?? '', req: it.req ?? 0, cls: it.cls ?? '', official: m.official ?? '', cq: m.cq ?? null, need: m.need ?? null, tier: m.tier ?? '', origin: m.origin ?? '', note: m.note ?? '', src: src[it.id] ?? [] }; });
console.log(JSON.stringify(out, null, 1));
