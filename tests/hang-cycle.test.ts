// 用户新增（fix/hang-stuck）：清层循环回归——真实 World。清空 → 进下一层 → 不战斗走回 → 原层重刷 → 继续打，至少 2 轮；
// 不能往返（末层/侧层/首领封印/返回入口不通本层）→ nocycle；循环中死亡 / 背包满 / 下一层低血无药 停止；召唤物跟随换层。
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
// 找一个可往返的普通层（非侧层/非首领/非练级）
const a0 = new AutoHang();
const fi = FLOORS.findIndex((f, i) => !f.farm && i > 0 && (() => { const w = mkW('warrior', 30, i); killAll(w); return a0.canCycle(w) === null; })());
ok(fi > 0, `可往返层：第 ${fi} 号 ${FLOORS[fi]?.name} → 下一层 ${FLOORS[nextFloorOf(fi)]?.name}`);
for (const cls of ['taoist', 'mage', 'warrior'] as ClassId[]) {
  const w = mkW(cls, 30, fi); for (const s of w.skillPool) w.learned.add(s.id);
  if (cls === 'taoist') { const si = w.skills.findIndex(s => s.id === 'summon_skeleton'); if (si >= 0) w.cast(si, w.skills.map(() => 0)); }
  const sm0 = w.units.filter(u => u.summon && u.alive).length;
  const a = new AutoHang(); a.start(w); killAll(w);
  let fought = 0, nextHits = 0, kills0 = w.kills, foesAfter: number[] = [];
  const r = sim(w, a, 240, () => {
    if (w.floorIndex !== fi && w.hero && w.hero.cd > 0.01 && a.phase === 'back') nextHits++;
    if (a.cycles > foesAfter.length) { foesAfter.push(w.alive('enemy').filter(u => u.tier !== 'boss').length); }
    if (a.phase === 'farm' && w.floorIndex === fi && w.kills > kills0) { fought = w.kills - kills0; }
    // 第 1 轮回来打掉 2 只后直接清场，促成第 2 轮
    if (a.cycles === 1 && fought >= 2 && a.phase === 'farm') killAll(w);
    return a.cycles >= 2;
  });
  ok(a.cycles >= 2 && !r.stop, `${cls}：完成 ${a.cycles} 轮循环，楼层轨迹 ${r.trail.join('→')}，停止=${r.stop || '无'}`);
  ok(foesAfter.length >= 2 && foesAfter.every(n => n > 0), `${cls}：每次返回原层都重刷了怪 ${JSON.stringify(foesAfter)}`);
  ok(fought >= 2, `${cls}：返回原层后继续击杀 ${fought} 只`);
  ok(nextHits === 0, `${cls}：在下一层返回途中不普攻（命中计数 ${nextHits}）`);
  const sm1 = w.units.filter(u => u.summon && u.alive);
  if (cls === 'taoist') ok(sm0 > 0 && sm1.length > 0 && sm1.every(u => Math.abs(u.x - w.hero!.x) < 600), `道士召唤物 ${sm0}→${sm1.length} 只跟随换层并在英雄附近`);
}
{ // 不能往返 → nocycle
  const last = FLOORS.findIndex((f, i) => nextFloorOf(i) < 0); const w = mkW('warrior', 50, last >= 0 ? last : 0); const a = new AutoHang(); a.start(w); killAll(w);
  for (const u of w.alive('enemy')) u.alive = false; w.units = w.units.filter(u => u.alive);
  const r = sim(w, a, 2); ok(r.stop === 'nocycle', `末层/不可往返层 ${FLOORS[w.floorIndex].name} 清空 → nocycle（${a.info}）`);
  const w2 = mkW('warrior', 30, fi); (w2.floors[nextFloorOf(fi)] as any).minLevel = 99; const a2 = new AutoHang(); a2.start(w2); killAll(w2);
  const r2 = sim(w2, a2, 2); delete (w2.floors[nextFloorOf(fi)] as any).minLevel;
  ok(r2.stop === 'nocycle' && /等级 99/.test(a2.info), `下一层等级门槛（测试注入 minLevel=99）→ nocycle（${a2.info}）`);
}
{ // 循环中：下一层返回途中低血无药 → lowhp；死亡 → dead
  const w = mkW('mage', 30, fi); const a = new AutoHang(); a.start(w); killAll(w);
  const r = sim(w, a, 60, () => { if (a.phase === 'back' && w.hero) { w.pots = [0, 0, 0, 0]; w.hero.hp = Math.floor(w.hero.maxHp * 0.1); } });
  ok(r.stop === 'lowhp', `下一层返回途中低血无药 → ${r.stop}`);
  const w2 = mkW('taoist', 30, fi); const a2 = new AutoHang(); a2.start(w2); killAll(w2);
  const r2 = sim(w2, a2, 60, () => { if (a2.phase === 'back' && w2.hero) { w2.hero.hp = 0; w2.hero.alive = false; } });
  ok(r2.stop === 'dead' || r2.stop === 'dead(no hero)', `下一层死亡 → ${r2.stop}`);
}
{ // 循环第 1 轮返回原层后背包满 + 有装备掉落 → bagfull
  const w = mkW('warrior', 30, fi); const a = new AutoHang(); a.start(w); killAll(w); let inj = false;
  const r = sim(w, a, 120, () => { if (!inj && a.cycles >= 1 && a.phase === 'farm' && w.hero) { inj = true;
    w.bag = Array.from({ length: WORLD.bagSize }, (_, i) => ({ uid: 9000 + i } as any)); w.ground.push({ uid: 1, x: w.hero.x - 60, y: 0, landAt: -1, inv: { uid: 2 } } as any); } });
  ok(inj && r.stop === 'bagfull', `循环中（第 ${a.cycles} 轮后）背包满 → ${r.stop}`);
}
{ // 首领无冷却（如副本次数内）→ 返回原层首领重刷 → 按既有规则 boss 停
  const w = mkW('warrior', 30, fi); const a = new AutoHang(); a.start(w); for (const u of w.alive('enemy')) u.alive = false; w.units = w.units.filter(u => u.alive); w.farmQueue.length = 0;
  const r = sim(w, a, 120); ok(r.stop === 'boss' && a.cycles === 1, `首领未进冷却 → 返回后首领重刷 → ${r.stop}（${a.cycles} 轮）`);
}
console.log(`hang-cycle: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
