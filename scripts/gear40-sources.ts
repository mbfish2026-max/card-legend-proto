// 只读：列出需求 40–49 的武器/衣服 → 来源怪/BOSS、爆率分母、出现在哪些主线层（FLOOR_ORDER 位置/每层刷怪数）
import { World } from '../src/combat/World';
import { ITEMS } from '../src/data/items';
import { ENEMIES } from '../src/data/units';
import { FLOORS, FLOOR_ORDER } from '../src/data/world';
import { MAIN_ANCHORS } from '../src/data/balance';
void World;
const out: any[] = [];
for (const [id, d] of Object.entries(ITEMS) as any) {
  if (!d.slot || !['weapon', 'armor'].includes(d.slot) || (d.req ?? 0) < 40 || d.req > 49) continue;
  const src: any[] = [];
  for (const [uid, u] of Object.entries(ENEMIES) as any) {
    for (const dr of u.drops ?? []) if (dr.item === id) src.push({ mon: uid, name: u.name, tier: u.tier, den: Math.round(1 / dr.chance), floors: FLOORS.map((f, i) => [i, f.name, f.spawns.filter((s: any) => s.id === uid).reduce((a: number, s: any) => a + (s.count ?? 1), 0), FLOOR_ORDER.indexOf(i)]).filter((x: any) => x[2] > 0) });
    if (u.setDrop?.includes(id)) src.push({ mon: uid, name: u.name, tier: u.tier, setDrop: true, setChance: u.setChance ?? 1 });
  }
  out.push({ id, name: d.name, slot: d.slot, req: d.req, cls: d.cls ?? null, src });
}
console.log(JSON.stringify({ anchors: MAIN_ANCHORS, order: FLOOR_ORDER.map(i => [i, FLOORS[i].name]), items: out }));
