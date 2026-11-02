// 用户新增（fix/hang-stuck）：挂机打首领回归——真实 World。
// @ts-ignore 测试运行于 node（tsx）
declare const process: { exit(n: number): void };
import { World } from '../src/combat/World';
import { FLOORS, WORLD, nextFloorOf } from '../src/data/world';
import { AutoHang } from '../src/combat/autoHang';
import { DEFAULT_AUTO_SKILLS } from '../src/settings';
import type { ClassId } from '../src/data/classes';
let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };
const DT = 1 / 30;
const mkW = (cls: ClassId, lv: number, fi: number) => { let s = 3; const w = new World(() => (s = (s * 16807) % 2147483647) / 2147483647, lv, FLOORS, cls); w.loadFloor(fi); w.pots = [99, 99, 99, 99]; return w; };
// 首领按真实击杀记冷却（World.bossCdUntil/bossCdId，BOSS_RESPAWN 600s），返回原层时不重刷首领
const killAll = (w: World) => { for (const u of w.alive('enemy')) { if (u.tier === 'boss') { const x = w as any; x.bossCdUntil[w.floorIndex] = w.time + 600; x.bossCdId[w.floorIndex + ':' + u.id] = w.time + 600; } u.alive = false; } w.units = w.units.filter(u => u.alive); w.farmQueue.length = 0; w.ground.length = 0; };
/** 模拟 BattleScene：use → Input.use；back → prevFloor()；fight=false → 关普攻/技能 */
function sim(w: World, a: AutoHang, sec: number, each?: (t: number) => boolean | void) {
  const cds = w.skills.map(() => 0); let stop = ''; const trail: number[] = [];
  for (let t = 0; t < sec; t += DT) {
    if (!w.hero) { stop = 'dead(no hero)'; break; }
    while (cds.length < w.skills.length) cds.push(0); for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - DT);
    const r = a.tick(w, DT); if (r.stop) { stop = r.stop; break; }
    if (r.back) w.prevFloor();
    if (r.fight !== false) w.autoCast(DEFAULT_AUTO_SKILLS[w.cls], cds);
    w.step(DT, { dx: r.dx, dy: 0, use: !!r.use, autoAttack: r.fight !== false }); w.drainEvents();
    if (trail[trail.length - 1] !== w.floorIndex) trail.push(w.floorIndex);
    if (each && each(t)) break;
  }
  return { stop, trail };
}
// 用户新增/推翻：挂机遇首领自动接战 → 击杀后继续清层循环；打不过 → bosslow（无药 HP<30%）/ bosstimeout（久攻不下）停止
import { HANG } from '../src/combat/autoHang';
const fi = FLOORS.findIndex((f, i) => !f.farm && i > 0 && f.spawns.some(s => s.id.startsWith('boss')) && (() => { const w = mkW('warrior', 30, i); killAll(w); return new AutoHang().canCycle(w) === null; })());
ok(fi > 0, `首领层：第 ${fi} 号 ${FLOORS[fi]?.name}`);
const killNorm = (w: World) => { for (const u of w.alive('enemy')) if (u.tier !== 'boss') u.alive = false; w.units = w.units.filter(u => u.alive); w.farmQueue.length = 0; w.ground.length = 0; };
for (const cls of ['warrior', 'mage', 'taoist'] as ClassId[]) {
  const w = mkW(cls, 60, fi); for (const s of w.skillPool) w.learned.add(s.id);
  const a = new AutoHang(); a.start(w); killNorm(w); let engaged = false, potUsed = false; const p0 = w.pots.reduce((x, y) => x + y, 0);
  const r = sim(w, a, 300, () => { if (a.boss !== null) engaged = true; return a.bossKills >= 1 && a.cycles >= 1; });
  potUsed = w.pots.reduce((x, y) => x + y, 0) < p0;
  ok(engaged && a.bossKills >= 1 && a.cycles >= 1 && !r.stop, `${cls}：清层后首领自动接战 → 击杀 ${a.bossKills} → 继续循环 ${a.cycles} 轮，轨迹 ${r.trail.join('→')}，停止=${r.stop || '无'}，用药=${potUsed}`);
}
{ // 打首领中低血无药 → bosslow（阈值 30%，高于普通 20%）
  const w = mkW('warrior', 30, fi); const a = new AutoHang(); a.start(w); killNorm(w);
  const r = sim(w, a, 120, () => { if (a.boss !== null && w.hero) { w.pots = [0, 0, 0, 0]; w.hero.hp = Math.floor(w.hero.maxHp * 0.25); } });
  ok(r.stop === 'bosslow' && HANG.bossLowHp === 0.3, `打首领中 HP 25% 无药 → ${r.stop}`);
}
{ // 有药时打首领：低血自动喝药，不停
  const w = mkW('warrior', 60, fi); const a = new AutoHang(); a.start(w); killNorm(w); let hit = false;
  const r = sim(w, a, 20, () => { if (a.boss !== null && w.hero && !hit) { hit = true; w.hero.hp = Math.floor(w.hero.maxHp * 0.25); } return hit; });
  ok(!r.stop && a.tick(w, DT).stop !== 'bosslow', '打首领中 HP 25% 但有药 → 不停（喝药由场景按设置阈值触发）');
}
{ // 久攻不下：首领血量 60s 无新低 → bosstimeout
  const w = mkW('warrior', 60, fi); const a = new AutoHang(); a.start(w); killNorm(w);
  const r = sim(w, a, HANG.bossStallSec + 60, () => { const b = w.alive('enemy').find(u => u.tier === 'boss'); if (b) b.hp = b.maxHp; if (w.hero) w.hero.hp = w.hero.maxHp; });
  ok(r.stop === 'bosstimeout', `首领 ${HANG.bossStallSec}s 无进展 → ${r.stop}`);
}
{ // 总时长：首领血量极高（一直掉血但打不死）→ 超过 bossMaxSec 停
  const w = mkW('warrior', 60, fi); const a = new AutoHang(); a.start(w); killNorm(w); let big = false;
  const r = sim(w, a, HANG.bossMaxSec + 120, () => { const b = w.alive('enemy').find(u => u.tier === 'boss'); if (b && !big) { big = true; b.hp = b.maxHp = 1e12; } if (w.hero) w.hero.hp = w.hero.maxHp; });
  ok(r.stop === 'bosstimeout', `首领接战超过 ${HANG.bossMaxSec}s → ${r.stop}`);
}
console.log(`hang-boss: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
