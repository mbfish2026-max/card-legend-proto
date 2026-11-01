// 召唤物移动速度 = 英雄当前移动速度（World.heroMoveSpeed，实时读取，含 spdMul 加速/减速）
import { World } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; };
const summonsOf = (w: World) => w.units.filter(u => u.summon && u.alive);
// 跟随：英雄不动，召唤物离目标点很远 → 每帧位移 = 英雄速度 × dt
const follow = (w: World, u: any) => { const h = w.hero!; u.x = h.x + h.facing * 3000; u.y = WORLD.summonLane; const x0 = u.x; w.step(0.05); return Math.abs(u.x - x0) / 0.05; };
// 英雄按住移动速度
const heroV = (w: World) => { const h = w.hero!, x0 = h.x; w.step(0.05, { dx: 1, dy: 0 } as any); const v = Math.abs(h.x - x0) / 0.05; h.x = x0; return v; };
const mk: [string, () => { w: World; u: any }][] = [];
for (const id of ['summon_skeleton', 'summon_beast', 'drive_corpse', 'summon_golden_skeleton']) mk.push([id, () => {
  const w = new World(() => 0.5, 42, FLOORS, 'taoist'); clear(w); const h = w.hero!; h.mp = h.maxMp = 99999;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  for (const u of summonsOf(w)) u.alive = false;
  const r = w.cast(w.skills.findIndex(s => s.id === id), w.skills.map(() => 0)); if (!r.ok) throw new Error(id + r.reason);
  return { w, u: summonsOf(w).find(x => x.sBase && !x.pet)! };
}]);
mk.push(['charm_pet', () => {
  const w = new World(() => 0.01, 40, FLOORS, 'mage'); clear(w); const h = w.hero!; h.mp = h.maxMp = 99999;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  const d = w.spawnFoe('deer', h.x + 120, 0); d.level = 1; w.step(0.1);
  w.cast(w.skills.findIndex(s => s.id === 'charm'), w.skills.map(() => 0)); return { w, u: summonsOf(w).find(x => x.pet)! };
}]);
for (const [name, f] of mk) {
  const { w, u } = f(); const h = w.hero!; clear(w);
  ok(!!u, `${name} 已召唤`);
  const v0 = follow(w, u); ok(Math.abs(v0 - w.heroMoveSpeed()) < 1 && Math.abs(v0 - WORLD.heroSpeed) < 1, `${name} 跟随速度 ${v0.toFixed(0)} == 英雄速度 ${w.heroMoveSpeed()}`);
  h.spdMul = 1.5; const v1 = follow(w, u), hv1 = heroV(w); ok(Math.abs(v1 - hv1) < 1 && Math.abs(v1 - WORLD.heroSpeed * 1.5) < 1, `${name} 英雄加速 ×1.5 → 召唤物 ${v1.toFixed(0)} == 英雄实测 ${hv1.toFixed(0)}`);
  h.spdMul = 0.5; const v2 = follow(w, u), hv2 = heroV(w); ok(Math.abs(v2 - hv2) < 1, `${name} 英雄减速 ×0.5 → 召唤物 ${v2.toFixed(0)} == 英雄 ${hv2.toFixed(0)}`);
  h.spdMul = 1;
  // 追击：放一只交战中的怪在远处
  const e = w.spawnFoe('deer', h.x + 600, 0); e.ai = 'chase'; e.hp = e.maxHp = 1e6; u.x = h.x - 400; const x0 = u.x; w.step(0.05);
  ok(Math.abs(Math.abs(u.x - x0) / 0.05 - w.heroMoveSpeed()) < 1, `${name} 追击速度 == 英雄速度`);
  ok(/·\d级 \S+的宠物$/.test(u.name), `${name} 名字未受影响：${u.name}`);
}
console.log(`summon-speed: ${n} ok`);
