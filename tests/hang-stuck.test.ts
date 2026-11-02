// fix/hang-stuck 回归：真实 World + AutoHang，三职业 × 怪在左右两侧 × 不同距离 × MP 充足/不足。
// 断言：任意时刻「英雄原地不动且不出手」不超过 2.5 秒，且 25 秒内目标掉血（或被击杀）。道士场景最先写（用户报告的卡住职业）。
// @ts-ignore 测试运行于 node（tsx）
declare const process: { exit(n: number): void };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { AutoHang } from '../src/combat/autoHang';
import { DEFAULT_AUTO_SKILLS } from '../src/settings';
import type { ClassId } from '../src/data/classes';
let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };
const DT = 1 / 30;
function run(cls: ClassId, lv: number, learn: string[], dist: number, side: 1 | -1, mpCap: number | null) {
  let s = 7; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const w = new World(rng, lv, FLOORS, cls); w.loadFloor(1);
  for (const id of learn) w.learned.add(id);
  const foes = w.alive('enemy').filter(u => u.tier !== 'boss');
  const f = foes[0]; w.units = w.units.filter(u => u.team !== 'enemy' || u === f); w.farmQueue.length = 0; w.ground.length = 0;
  const h = w.hero!; h.x = 2000; h.y = 0; f.x = h.x + side * ((h.width + f.width) / 2 + dist); f.homeX = f.x; f.y = 0;
  const hp0 = f.hp, cds = w.skills.map(() => 0), a = new AutoHang(); a.start(w);
  let still = 0, maxStill = 0, end = 'timeout';
  for (let t = 0; t < 25; t += DT) {
    const hh = w.hero; if (!hh) { end = 'dead'; break; }
    if (mpCap !== null) hh.mp = Math.min(hh.mp ?? 0, mpCap);
    while (cds.length < w.skills.length) cds.push(0); for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - DT);
    const r = a.tick(w, DT); if (r.stop) { end = r.stop; break; }
    const cd0 = hh.cd, px = hh.x; const cast = w.autoCast(DEFAULT_AUTO_SKILLS[cls], cds);
    w.step(DT, { dx: r.dx, dy: 0, autoAttack: true }); w.drainEvents();
    const acted = !!cast || hh.cd > cd0 + 1e-3;
    if (Math.abs(hh.x - px) < 0.01 && !acted) { still += DT; maxStill = Math.max(maxStill, still); } else still = 0;
    if (!f.alive) { end = 'killed'; break; }
  }
  return { maxStill, end, dmg: hp0 - Math.max(0, f.hp) };
}
const cases: [string, ClassId, number, string[], number | null][] = [
  ['道士 Lv10 只会治愈术（MP 充足）', 'taoist', 10, [], null],
  ['道士 Lv20 施毒+骷髅（MP 充足）', 'taoist', 20, ['poison', 'summon_skeleton'], null],
  ['道士 Lv20 灵魂火符（MP<10）', 'taoist', 20, ['soul_fire', 'poison'], 5],
  ['法师 Lv20 学满（MP 充足）', 'mage', 20, ['fireball', 'thunder', 'ice_arrow'], null],
  ['法师 Lv20 学满（MP<10）', 'mage', 20, ['fireball', 'thunder', 'ice_arrow'], 5],
  ['战士 Lv20', 'warrior', 20, [], null],
];
for (const [name, cls, lv, learn, mp] of cases) for (const side of [1, -1] as const) for (const dist of [60, 250, 290, 600]) {
  const r = run(cls, lv, learn, dist, side, mp);
  ok(r.maxStill <= 2.5 && (r.dmg > 0 || r.end === 'killed'), `${name} 怪在${side > 0 ? '右' : '左'} ${dist}px：最长原地空转 ${r.maxStill.toFixed(1)}s，目标掉血 ${Math.round(r.dmg)}，结束=${r.end}`);
}
console.log(`hang-stuck: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
