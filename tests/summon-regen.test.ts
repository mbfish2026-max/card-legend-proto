// 召唤物脱战快速回血 + 雷电术冷却 = 火球术冷却 + 诱惑宠物不叛变
import { World } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
import { CLASSES } from '../src/data/classes';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const run = (w: World, sec: number) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05); };
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; };
// 雷电术冷却 === 火球术冷却（数据表引用）
const sk = (id: string) => CLASSES.mage.skills.find(s => s.id === id)!;
ok(sk('thunder').cooldown === sk('fireball').cooldown, `雷电术冷却 ${sk('thunder').cooldown} === 火球术冷却 ${sk('fireball').cooldown}`);
// 各类召唤物：骷髅 / 神兽 / 赶尸 / 金甲骷髅（道士）+ 诱惑宠物（法师）
const summonsOf = (w: World) => w.units.filter(u => u.summon && u.alive);
const cases: [string, () => { w: World; u: any }][] = [];
for (const id of ['summon_skeleton', 'summon_beast', 'drive_corpse', 'summon_golden_skeleton']) cases.push([id, () => {
  const w = new World(() => 0.5, 50, FLOORS, 'taoist'); clear(w); const h = w.hero!; h.mp = h.maxMp = 99999; h.hp = h.maxHp = 1e6;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  for (const u of summonsOf(w)) u.alive = false;
  const i = w.skills.findIndex(s => s.id === id); const r = w.cast(i, w.skills.map(() => 0)); if (!r.ok) throw new Error(id + ' cast ' + r.reason);
  const u = summonsOf(w).find(x => x.sBase); if (!u) throw new Error(id + ' no summon'); return { w, u };
}]);
cases.push(['charm_pet', () => {
  const w = new World(() => 0.01, 40, FLOORS, 'mage'); clear(w); const h = w.hero!; h.mp = h.maxMp = 99999; h.hp = h.maxHp = 1e6;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  const d = w.spawnFoe('deer', h.x + 120, 0); d.level = 1; run(w, 0.1);
  const i = w.skills.findIndex(s => s.id === 'charm'); const r = w.cast(i, w.skills.map(() => 0)); if (!r.ok) throw new Error('charm ' + r.reason);
  const u = summonsOf(w).find(x => x.pet); if (!u) throw new Error('no pet'); return { w, u };
}]);
for (const [name, mk] of cases) {
  const { w, u } = mk(); const rate = (sec: number) => { const a = u.hp; run(w, sec); return (u.hp - a) / u.maxHp / sec; };
  u.hp = u.maxHp * 0.2; u.combatT = w.time; // 刚交战
  const rIn = rate(1); // 0–1s：战斗中正常速度
  run(w, WORLD.summonOocSec); u.hp = u.maxHp * 0.2;
  const rOut = rate(1);
  ok(Math.abs(rIn - WORLD.summonRegen) < 1e-3 && Math.abs(rOut - WORLD.summonRegen * WORLD.summonOocMul) < 1e-3, `${name}：战斗中 ${(rIn * 100).toFixed(2)}%/s，脱战 ${WORLD.summonOocSec}s 后 ${(rOut * 100).toFixed(2)}%/s`);
  // 被攻击 → 立即恢复正常速度
  const foe = w.spawnFoe('deer', u.x + 5000, 0); u.hp = u.maxHp * 0.2; w.damage(u, 1, foe); const rHit = rate(1);
  ok(Math.abs(rHit - WORLD.summonRegen) < 2e-3, `${name}：被攻击后立即回到正常 ${(rHit * 100).toFixed(2)}%/s`);
  // 攻击别人 → 也算交战
  run(w, WORLD.summonOocSec + 0.1); ok(w.summonOocNow(u), `${name}：${WORLD.summonOocSec}s 无交战 → 脱战`);
  foe.hp = foe.maxHp = 1e6; w.damage(foe, 1, u); ok(!w.summonOocNow(u), `${name}：攻击别人 → 立即非脱战`);
  foe.alive = false;
  u.hp = u.maxHp * 0.5; run(w, 60); ok(u.hp === u.maxHp && u.alive, `${name}：脱战 60s 回满且不超上限`);
}
console.log(`summon-regen: ${n} ok`);
