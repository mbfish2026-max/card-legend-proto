// feat/auto-hang：AutoHang 控制层纯逻辑（假 World）——巡逻掉头、卡住 3 次停、清空停、低血无药停、首领停、背包满停、用药阈值、追击站桩
// @ts-ignore 测试运行于 node（tsx）
import { readFileSync } from 'node:fs';
declare const process: { exit(n: number): void };
import { AutoHang, HANG } from '../src/combat/autoHang';
import { WORLD } from '../src/data/world';
let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };
const mk = (o: any = {}) => {
  const hero: any = { uid: 1, x: 600, y: 0, hp: 100, maxHp: 100, mp: 50, maxMp: 100, alive: true, width: 130, range: 6, ...o.hero };
  const w: any = { hero, town: null, time: 0, ground: [], bag: [], farmQueue: [], exitX: 5000, cls: 'warrior', pots: [5, 5, 5, 5], units: o.units ?? [],
    alive(t: string) { return this.units.filter((u: any) => u.alive && u.team === t); },
    selectedPotionIndex: (s: number) => s, gap: (a: any, b: any) => Math.abs(a.x - b.x) - (a.width + b.width) / 2,
    inMelee(a: any, b: any) { return this.gap(a, b) <= Math.max(a.range, b.range) + 0.5; }, ...o.w };
  return w;
};
const foe = (uid: number, x: number, extra: any = {}) => ({ uid, x, y: 0, hp: 50, maxHp: 50, alive: true, team: 'enemy', tier: 'normal', width: 130, range: 6, ai: 'idle', homeX: x, ...extra });
{ const w = mk({ units: [foe(9, 4000)], w: { farmQueue: [{}] } }), a = new AutoHang(); ok(a.start(w) === null && a.on, '野外可开启');
  ok(new AutoHang().start(mk({ w: { town: 'bichi' } })) === 'town', '城内不可开启');
  const { L, R } = a.anchors(w); ok(L === WORLD.heroStartX + 190 && R === 5000 - WORLD.exitRadius - 40, `锚点 L=${L} R=${R}`);
  w.units = []; w.hero.x = R + 1; a.target = null; const r = a.tick(w, 0.016); ok(r.dx === -1, '到右锚掉头'); w.hero.x = L - 1; ok(a.tick(w, 0.016).dx === 1, '到左锚掉头'); }
{ // 卡住：x 不动，2s 掉头，连续 3 次停
  const w = mk({ w: { farmQueue: [{}] } }), a = new AutoHang(); a.start(w); const dirs: number[] = []; let stop: string | undefined;
  for (let t = 0; t < 7 && !stop; t += 0.05) { w.time = t; const r = a.tick(w, 0.05); stop = r.stop; dirs.push(r.dx); }
  ok(stop === 'stuck', '连续 3 次卡住 → stuck'); ok(new Set(dirs.filter(Boolean)).size === 2, '卡住时掉头（两个方向都出现过）'); }
{ const w = mk(), a = new AutoHang(); a.start(w); ok(a.tick(w, 0.016).stop === 'cleared', '无怪无刷新无掉落 → cleared'); }
{ const w = mk({ units: [foe(9, 900)], hero: { hp: 10 } }); w.pots = [0, 5, 0, 5]; const a = new AutoHang(); a.start(w); ok(a.tick(w, 0.016).stop === 'lowhp', 'HP 10% 且红/太阳水为 0 → lowhp');
  w.pots = [1, 5, 0, 5]; ok(!a.tick(w, 0.016).stop, '有红药时不停'); }
{ const w = mk({ units: [foe(9, 900), foe(10, 3000, { tier: 'boss', homeX: 3000 })] }), a = new AutoHang(); a.start(w);
  ok(a.anchors(w).R === 3000 - WORLD.aggroRange - 60, '首领层右锚停在首领仇恨圈外'); ok(!a.tick(w, 0.016).stop, '首领未追击不停');
  w.units[1].ai = 'chase'; ok(a.tick(w, 0.016).stop === 'boss', '首领追击 → boss'); }
{ const w = mk({ units: [foe(9, 900)] }); w.bag = Array(WORLD.bagSize).fill({}); w.ground = [{ x: 700, landAt: -1, inv: {} }]; const a = new AutoHang(); a.start(w);
  ok(a.tick(w, 0.016).stop === 'bagfull', '背包满且附近有装备掉落 → bagfull'); w.ground = [{ x: 700, landAt: -1 }]; ok(!a.tick(w, 0.016).stop, '背包满但只有金币/药水 → 不停'); }
{ const w = mk({ units: [foe(9, 900)] }), a = new AutoHang(); a.start(w); ok(a.tick(w, 0.016).dx === 1 && a.target === 9, '1020px 内选最近怪并追击');
  w.hero.x = 900 - 136; ok(a.tick(w, 0.016).dx === 0, '贴脸站桩 dx=0');
  for (let t = 0; t <= HANG.giveUpSec + 0.2; t += 0.1) { w.time = t; a.tick(w, 0.1); } ok(a.target === null, `${HANG.giveUpSec}s 无伤害 → 放弃目标`); }
{ const w = mk({ hero: { hp: 25, mp: 20 } }), a = new AutoHang(); const s = a.potionSlots(w, { red: 0.4, sun: 0.3, blue: 0.3 }); ok(s.includes(0) && s.includes(2) && s.includes(1), `HP25%/MP20% → 红+太阳水+蓝 ${s}`);
  w.hero.hp = 35; w.hero.mp = 40; const s2 = a.potionSlots(w, { red: 0.4, sun: 0.3, blue: 0.3 }); ok(s2.join() === '0', `HP35%/MP40% → 只红 ${s2}`); }
const B = readFileSync('src/scenes/BattleScene.ts', 'utf8');
ok(/if \(k === 'J'\) return this\.toggleHang\(\)/.test(B) && /now - this\.hangToggleAt < 250/.test(B), 'J 键开关 + 250ms 去抖');
ok(/this\.hang = new AutoHang\(\)/.test(B) && !/hang/i.test(readFileSync('src/combat/World.ts', 'utf8')), '挂机不存档，create 时重置');
console.log(`\nauto-hang: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
