/** maps-3050 战斗字段：onHit.stun / immobile / ranged / magic / 按 id BOSS 冷却（docs/maps-3050-combat.md） */
import { World, BOSS_RESPAWN } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
const mk = (spawns: { id: string; x: number }[], extra: any[] = []) => { const w = new World(seeded(7), 30, [{ name: 'T', bg: 'bg_floor1', spawns } as any, ...extra], 'warrior'); if (!w.units.some(u => u.team === 'enemy')) w.loadFloor(0); return w; };
const foes = (w: World) => w.units.filter(u => u.team === 'enemy' && u.alive);
const run = (w: World, sec: number, inp: any = { dx: 0, dy: 0 }) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05, inp); };

// 定义
ok(ENEMIES.sq_youying.onHit?.stun?.chance === 0.1 && ENEMIES.sq_youying.onHit?.stun?.dur === 2 && ENEMIES.sq_youying.tier === 'normal', '幽影武士 onHit.stun 10%/2s');
ok(ENEMIES.sq_lieyan_shi.immobile === true, '烈焰使 immobile');
ok(ENEMIES.boss_sq_jindi.immobile === true && ENEMIES.boss_sq_jindi.tier === 'boss', '禁地魔王 immobile + boss');
ok(ENEMIES.boss_sq_shandian.tier === 'boss' && ENEMIES.boss_sq_shandian.ranged === true && ENEMIES.boss_sq_shandian.magic === 1 && ENEMIES.boss_sq_shandian.range >= 200, '闪电魔 BOSS 远程魔法');
ok(ENEMIES.boss_sq_lizhua.tier === 'boss' && !ENEMIES.boss_sq_lizhua.ranged && ENEMIES.boss_sq_lizhua.range <= 8 && ENEMIES.sq_lizhua.range <= 8, '利爪魔 近战');
ok(BOSS_RESPAWN === 600, 'BOSS_RESPAWN 600');

// onHit.stun：几率统计（lootRng 固定种子）、时长、不刷新、BOSS 免疫
{ const w = mk([{ id: 'sq_youying', x: 900 }]); const h = w.hero!, f = foes(w)[0];
  let n = 0, N = 4000; w.lootRng = seeded(42);
  for (let k = 0; k < N; k++) { h.stunUntil = 0; h.hp = h.maxHp; w.foeHit(f, h); if ((h.stunUntil ?? 0) > w.time) n++; }
  ok(Math.abs(n / N - 0.1) < 0.02, `眩晕几率 ≈10%（${(n / N * 100).toFixed(1)}%）`);
  h.stunUntil = 0; w.lootRng = () => 0; w.foeHit(f, h); ok(Math.abs(h.stunUntil! - w.time - 2) < 1e-9 && h.cd >= 2, '眩晕时长 2s，cd 顺延');
  const s0 = h.stunUntil!; w.time += 1; w.foeHit(f, h); ok(h.stunUntil === s0, '眩晕中再次命中不叠加不刷新');
  w.time += 1.01; w.foeHit(f, h); ok(Math.abs(h.stunUntil! - w.time - 2) < 1e-9, '到期后可再次被晕');
  const b: any = { ...foes(w)[0], tier: 'boss', stunUntil: 0, alive: true, hp: 1e9, maxHp: 1e9, def: 0, mdef: 0 }; w.foeHit(f, b); ok(!(b.stunUntil > w.time), 'BOSS 免疫眩晕');
  w.lootRng = () => 0.99; h.stunUntil = 0; w.foeHit(f, h); ok(!((h.stunUntil ?? 0) > w.time), '未中几率不晕');
  // 眩晕中不能动/施法
  h.stunUntil = w.time + 2; const x0 = h.x; run(w, 1, { dx: 1, dy: 0 }); ok(h.x === x0, '眩晕中主角不移动');
  const r = w.cast(0, []); ok(!r.ok && r.reason === '眩晕中', '眩晕中不能施法');
  run(w, 1.2, { dx: 1, dy: 0 }); ok(h.x > x0, '眩晕结束可移动');
}
// 普攻实战：幽影武士打主角会触发眩晕
{ const w = mk([{ id: 'sq_youying', x: 200 }]); w.lootRng = () => 0; const h = w.hero!; h.hp = h.maxHp = 1e7; let hit = false;
  for (let t = 0; t < 10 && !hit; t += 0.05) { w.step(0.05); hit = (h.stunUntil ?? 0) > w.time; }
  ok(hit, '实战：幽影武士普攻命中后主角被晕'); }

// immobile：10s 位置不变，射程内会打
{ const w = mk([{ id: 'sq_lieyan_shi', x: 600 }]); const h = w.hero!, f = foes(w)[0], x0 = f.x; h.hp = h.maxHp = 1e7;
  run(w, 10); ok(f.x === x0 && f.ai !== 'idle', `烈焰使 10s 不移动（ai=${f.ai}）`);
  const hp0 = h.hp; for (let t = 0; t < 10; t += 0.05) { h.x = f.x - (h.width + f.width) / 2 - 2; w.step(0.05); } ok(f.x === x0 && h.hp < hp0, '烈焰使 射程内攻击、仍不移动'); }
{ const w = mk([{ id: 'boss_sq_jindi', x: 600 }]); const h = w.hero!, f = foes(w)[0], x0 = f.x; h.hp = h.maxHp = 1e7;
  run(w, 10); ok(f.x === x0, '禁地魔王 10s 不移动'); }
{ const w = mk([{ id: 'boss_redmoon', x: 600 }]); const f = foes(w)[0], x0 = f.x; w.hero!.hp = w.hero!.maxHp = 1e7; run(w, 5); ok(f.x === x0, '赤月恶魔（历史硬编码）仍不移动'); }
// 普通怪对照会移动
{ const w = mk([{ id: 'sq_lizhua', x: 600 }]); const f = foes(w)[0], x0 = f.x; w.hero!.hp = w.hero!.maxHp = 1e7; run(w, 5); ok(f.x !== x0, '利爪魔（普通）会追击'); }

// ranged + magic：闪电魔站在利爪魔后面也能打，事件带 thunder
{ const w = mk([{ id: 'boss_sq_lizhua', x: 400 }, { id: 'boss_sq_shandian', x: 520 }]); const h = w.hero!; h.hp = h.maxHp = 1e8; h.mdef = 0; h.def = 1e6;
  const [lz, sd] = foes(w); let thunder = 0, melee = 0;
  for (let t = 0; t < 15; t += 0.05) { w.step(0.05); for (const e of w.events.splice(0)) if (e.type === 'attack' && e.target === h.uid) { if (e.source === sd.uid) thunder += +(e.skill === 'thunder'); if (e.source === lz.uid) melee++; } }
  ok(thunder > 0, `闪电魔隔排雷击（${thunder} 次）`); ok(melee > 0, `利爪魔近战（${melee} 次）`);
  const hp0 = h.hp; w.foeHit(sd, h); ok(hp0 - h.hp > 0, '闪电魔魔法伤害无视物防高值（走魔御）');
  ok(Math.abs(sd.x - h.x) > (h.width + sd.width) / 2 + 20, '闪电魔保持远距'); }

// 双 BOSS：按 id 冷却
{ const w = mk([{ id: 'boss_sq_lizhua', x: 400 }, { id: 'boss_sq_shandian', x: 900 }], [{ name: 'U', bg: 'bg_floor1', spawns: [] }]);
  const lz = foes(w).find(u => u.id === 'boss_sq_lizhua')!; w.damage(lz, 1e9, w.hero!, false, false, true);
  ok(w.bossCdLeft(0) > 0 && w.bossOnCd(0, 'boss_sq_lizhua') && !w.bossOnCd(0, 'boss_sq_shandian'), '杀利爪魔只冷却利爪魔');
  w.loadFloor(1); w.loadFloor(0); const ids = foes(w).map(u => u.id);
  ok(!ids.includes('boss_sq_lizhua') && ids.includes('boss_sq_shandian'), `重进：另一只照刷（${ids}）`);
  w.time += BOSS_RESPAWN + 1; w.loadFloor(1); w.loadFloor(0); ok(foes(w).filter(u => u.id === 'boss_sq_lizhua').length === 1, '600s 后利爪魔重生');
  // 禁地魔王 600s 重生
  const w2 = mk([{ id: 'boss_sq_jindi', x: 600 }], [{ name: 'U', bg: 'bg_floor1', spawns: [] }]); w2.damage(foes(w2)[0], 1e9, w2.hero!, false, false, true);
  w2.time += 599; w2.loadFloor(1); w2.loadFloor(0); ok(!foes(w2).some(u => u.id === 'boss_sq_jindi'), '禁地魔王 599s 未刷');
  w2.time += 2; w2.loadFloor(1); w2.loadFloor(0); ok(foes(w2).some(u => u.id === 'boss_sq_jindi'), '禁地魔王 600s 重生');
  // 存档往返
  const w3 = mk([{ id: 'boss_sq_lizhua', x: 400 }, { id: 'boss_sq_shandian', x: 900 }]); w3.damage(foes(w3).find(u => u.id === 'boss_sq_lizhua')!, 1e9, w3.hero!, false, false, true);
  const sv: any = w3.toSave(); ok(sv.bossCdId?.['0:boss_sq_lizhua'] > 590, '存档写 bossCdId');
  const w4 = new World(seeded(1), 30, [{ name: 'T', bg: 'bg_floor1', spawns: [{ id: 'boss_sq_lizhua', x: 400 }, { id: 'boss_sq_shandian', x: 900 }] } as any], 'warrior', sv);
  ok(w4.bossOnCd(0, 'boss_sq_lizhua') && !w4.bossOnCd(0, 'boss_sq_shandian'), '读档按 id 冷却');
  const old = { ...sv }; delete old.bossCdId; const w5 = new World(seeded(1), 30, [{ name: 'T', bg: 'bg_floor1', spawns: [] } as any], 'warrior', old);
  ok(w5.bossOnCd(0, 'boss_sq_lizhua') && w5.bossOnCd(0, 'boss_sq_shandian'), '旧档：整层冷却兼容');
}
console.log(`maps-3050-combat: ${pass} passed`);
