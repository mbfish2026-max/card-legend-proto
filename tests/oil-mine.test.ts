// 阶段4：祝福油只由高级 BOSS 掉；黑铁矿只能挖矿（docs/drop-plan.md「祝福油 / 黑铁矿」）
import { World } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { FLOORS } from '../src/data/world';
import { OFFICIAL_DROPS } from '../src/data/drops-official';
import { WOMA_S9 } from '../src/data/drops-s9';
import { MINE_FLOORS, MINE_CAST, MINE_RESPAWN, OIL_BOSSES, OIL_RATE } from '../src/data/mining';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const seeded = (s: number) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const tables: [string, string, string[]][] = Object.values(ENEMIES).map(u => [u.id, u.tier ?? 'normal', (u.drops ?? []).map(d => d.item)]);
for (const [id, t] of Object.entries(OFFICIAL_DROPS)) tables.push([id, ENEMIES[id]?.tier ?? 'normal', t.drops.map(d => d[0])]);
tables.push(['boss_woma(S9)', 'boss', WOMA_S9.map(d => d.item)]);
ok(tables.every(([, , it]) => !it.includes('black_iron')), `黑铁矿不在任何掉落表（${tables.length} 张）`);
ok(tables.filter(([, t]) => t !== 'boss').every(([, , it]) => !it.includes('bless_oil')), '普通怪/精英掉落表无祝福油');
ok(tables.filter(([, , it]) => it.includes('bless_oil')).every(([id]) => OIL_BOSSES.includes(id)), '掉落表里的祝福油只在高级 BOSS');
ok(OIL_BOSSES.every(id => ENEMIES[id]?.tier === 'boss' && ENEMIES[id].level >= 28), '油 BOSS 名单全为 L≥28 BOSS');
// 实际击杀：普通/精英/低级 BOSS 各 300 次不出油/铁；高级 BOSS 出油率≈1/8
const killMany = (id: string, n: number) => { let oil = 0, iron = 0; const w = new World(seeded(1), 40, [{ name: 't', spawns: [{ id, x: 800 }] }], 'warrior');
  for (let k = 0; k < n; k++) { w.ground = []; w.loadFloor(0); w.bossCdUntil = {}; const e = w.alive('enemy')[0]; if (!e) continue; w.kill(e);
  oil += w.ground.filter(g => g.item === 'bless_oil').length; iron += w.ground.filter(g => g.item === 'black_iron').length; } return { oil, iron }; };
for (const id of ['hen' in ENEMIES ? 'hen' : 'deer', 'boss_woma', ...Object.values(ENEMIES).filter(u => (u.oilChance ?? 0) > 0).slice(0, 3).map(u => u.id)].filter(i => ENEMIES[i])) {
  const r = killMany(id, 200); ok(r.oil === 0 && r.iron === 0, `${ENEMIES[id].name} 击杀 200 次：油 0、铁 0`); }
{ const r = killMany('boss_zuma', 2000); ok(r.iron === 0 && r.oil > 0 && r.oil < 2000 * OIL_RATE * 1.5, `祖玛教主 2000 次：油 ${r.oil}（≈${OIL_RATE}）、铁 0`); }
// 挖矿
const fi = MINE_FLOORS[0];
const mkMine = () => { const w = new World(seeded(7), 30, FLOORS, 'warrior'); w.loadFloor(fi); w.units = w.units.filter(u => u.team !== 'enemy'); return w; };
const tick = (w: World, sec: number) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05); };
{ const w = mkMine(); const h = w.hero!; ok(!w.atMine(), '起点不在矿点范围');
  ok(w.startMine().includes('没有'), '范围外不能挖'); h.x = w.mineX(); ok(w.atMine() && w.startMine() === '挖矿中', '范围内开始读条');
  tick(w, MINE_CAST - 0.5); ok(!w.bag.some(b => b.item === 'black_iron'), '读条未完不产出');
  tick(w, 1); ok(w.bag.some(b => b.item === 'black_iron') && !w.mine, `读条 ${MINE_CAST}s 产出黑铁矿石`);
  ok(w.mineCdLeft() > MINE_RESPAWN - 5 && w.startMine().includes('刷新'), '挖空后进入刷新间隔');
  const s = w.toSave(); ok((s.mineCd?.[fi] ?? 0) > MINE_RESPAWN - 5, '存档写入下次刷新剩余秒数');
  const w2 = new World(seeded(1), 30, FLOORS, 'warrior', s); ok(Math.abs(w2.mineCdLeft(fi) - w.mineCdLeft()) <= 1, '读档恢复刷新时间');
  const old = { ...s }; delete old.mineCd; const w3 = new World(seeded(1), 30, FLOORS, 'warrior', old); ok(w3.mineCdLeft(fi) === 0, '旧档（无 mineCd）兼容：矿点可挖');
  tick(w, MINE_RESPAWN + 1); ok(w.mineCdLeft() === 0 && w.startMine() === '挖矿中', '刷新间隔后可再挖'); }
{ const w = mkMine(); w.hero!.x = w.mineX(); w.startMine(); tick(w, 1); w.hero!.x += 30; tick(w, 0.1); ok(!w.mine && !w.bag.some(b => b.item === 'black_iron'), '移动打断，不产出'); }
{ const w = mkMine(); w.hero!.x = w.mineX(); w.startMine(); tick(w, 1); w.hero!.hp -= 5; tick(w, 0.1); ok(!w.mine && w.mineCdLeft() === 0, '受击打断，不进冷却'); }
{ const w = new World(seeded(7), 30, FLOORS, 'warrior'); w.loadFloor(0); w.hero!.x = w.mineX(); ok(!w.hasMine() && !w.atMine(), '非矿层无矿点'); }
ok(MINE_FLOORS.every(i => /矿/.test(FLOORS[i].name)), `矿点层均为矿区：${MINE_FLOORS.map(i => FLOORS[i].name).join('、')}`);
console.log(`oil-mine: ${pass} passed`);
