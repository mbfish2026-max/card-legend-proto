// feat/balance-battle：战斗平衡（保底/等级差/BOSS/药水/技能）+ 首图不变量
import { World, mitigate, lvDiffMult } from '../src/combat/World';
import { WORLD, Floor, FLOORS } from '../src/data/world';
import { ENEMIES } from '../src/data/units';
import { ClassId } from '../src/data/classes';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const mk = (spawns: Floor['spawns'], cls: ClassId = 'warrior', lv = 20) => new World(seeded(1), lv, [{ name: '测试层', spawns }], cls);
const run = (w: World, sec: number) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05, { dx: 0, dy: 0 }); };

{ // 1. 保底 / defFactor / 等级差
  ok(WORLD.dmgFloor === 0.3 && WORLD.defFactor === 0.5, '保底 30%、defFactor 0.5');
  ok(mitigate(100, 1000, 0) === 30 && mitigate(100, 1000, 0, 0, 0.2, 0.6) === 20, '高防：新保底 30，旧保底 20');
  ok(mitigate(100, 40, 0) === 80 && mitigate(100, 40, 0, 0, 0.2, 0.6) === 76, '防 40：新 100−20=80，旧 100−24=76');
  ok(lvDiffMult(25, 20) === 1.15 && Math.abs(lvDiffMult(15, 20) - 0.9) < 1e-9 && lvDiffMult(1, 60) === 0.7 && lvDiffMult(20, 20) === 1, '等级差：+3%/级、−2%/级、下限 −30%');
  const w = mk([{ id: 'wolf', x: 700 }]); const h = w.hero!, e = w.alive('enemy')[0];
  h.def = 0; h.hp = h.maxHp = 1e6; e.level = w.level + 5; w.rng = () => 0.5;
  const a = h.hp; w.damage(h, 100, e, false); ok(a - h.hp === 115, `怪物高 5 级：100→${a - h.hp}`);
  const b = e.hp; e.hp = e.maxHp = 1e6; const b0 = e.hp; w.damage(e, 100, h, false); ok(b0 - e.hp === Math.round(100 - (e.def ?? 0) * 0.5) || b0 - e.hp === Math.round(Math.max(30, 100 - (e.def ?? 0) * 0.5)), `主角打怪不吃等级差（${b0 - e.hp}）`); void b;
}
{ // 5. 首图不变量：幽暗森林沿用旧系数、无等级差、狼王不加强
  const w = new World(seeded(1), 1, FLOORS, 'warrior'); ok(w.floorIndex === 0 && w.newbieFloor, '主线第 0 层 = 首图');
  const h = w.hero!; h.def = 1000; h.hp = h.maxHp = 1e6; const e = w.alive('enemy')[0]; e.level = 50; w.rng = () => 0.5;
  const a = h.hp; w.damage(h, 100, e, false); ok(a - h.hp === 20, `首图：旧保底 20%、无等级差（${a - h.hp}）`);
  const wk = w.spawnFoe('wolf_king', 900, 0); ok(wk.atk === ENEMIES.wolf_king.atk && wk.hp === ENEMIES.wolf_king.hp && wk.atkInterval === 1.5, '首图狼王属性/攻速不变');
  const t = new World(seeded(1), 1, [{ name: '测试层', spawns: [] }], 'warrior'); ok(!t.newbieFloor, '自定义测试层不算首图');
}
{ // 2. BOSS：攻=同层普通怪×1.6、血=×4、攻速 1.2、狂暴/AOE/召唤
  const w = mk([{ id: 'wolf', x: 1400 }, { id: 'bat', x: 1500 }, { id: 'boss_white_boar', x: 1800 }]);
  const bs = w.alive('enemy').find(u => u.tier === 'boss')!, nm = [ENEMIES.wolf, ENEMIES.bat];
  ok(bs.atkInterval === 1.2, 'BOSS 攻速 1.2s');
  ok(bs.atk === Math.max(ENEMIES.boss_white_boar.atk, Math.round(1.6 * (nm[0].atk + nm[1].atk) / 2)), `BOSS 攻 ${bs.atk}`);
  ok(bs.maxHp === Math.min(ENEMIES.boss_white_boar.hp, Math.round(4 * (nm[0].hp + nm[1].hp) / 2)), `BOSS 血 ${bs.maxHp}`);
  w.alive('enemy').filter(u => u.tier !== 'boss').forEach(u => u.alive = false); w.units = w.units.filter(u => u.alive);
  const h = w.hero!; h.hp = h.maxHp = 1e5; h.def = 1e5; bs.atk = 0; bs.hp = bs.maxHp = 1e9; bs.x = h.x + 150; bs.ai = 'chase'; bs.level = w.level;
  run(w, 11.5); ok(h.maxHp - h.hp < 10, '12s 前无 AOE');
  run(w, 0.6); ok(w.events.some(e => e.type === 'bossfx' && e.kind === 'aoe_warn'), 'AOE 预警');
  const before = h.hp; run(w, 1.2); ok(Math.abs(before - h.hp - 1e5 * 0.18) < 10, `AOE 精确 18%（${before - h.hp}）`);
  w.events = []; bs.hp = bs.maxHp * 0.49; run(w, 0.1);
  ok(w.events.some(e => e.type === 'bossfx' && e.kind === 'enrage') && (bs.boss!.enrageUntil ?? 0) > w.time + 7.5, '50% 血狂暴 8 秒');
  ok(w.alive('enemy').filter(u => u.tier !== 'boss').length === 2 && w.alive('enemy').filter(u => u.tier !== 'boss').every(u => u.exp === 0), '召唤 2 只 0 经验小怪');
  run(w, 3); ok(w.alive('enemy').filter(u => u.tier !== 'boss').length <= 2 && w.events.filter(e => e.type === 'bossfx' && e.kind === 'enrage').length === 1, '狂暴/召唤只触发一次');
  // 狂暴 +30%
  bs.atk = 100; h.def = 0; const s0 = h.hp; w.rng = () => 0.5; w.damage(h, 100, bs, false); ok(s0 - h.hp === 130, `狂暴伤害 ×1.3（${s0 - h.hp}）`);
  // 沃玛：官方机制优先，不叠加通用狂暴/AOE/召唤
  const ww = mk([{ id: 'boss_woma', x: 900 }]); const wb = ww.alive('enemy')[0]; wb.ai = 'chase'; wb.hp = wb.maxHp * 0.4; wb.atk = 0; ww.hero!.hp = ww.hero!.maxHp = 1e6;
  run(ww, 14); ok(!ww.events.some(e => e.type === 'bossfx' && (e.kind === 'enrage' || e.kind === 'aoe')), '沃玛教主不触发通用狂暴/AOE');
}
console.log(`战斗平衡测试全部通过 ${pass} 项`);
{ // 3. 药水：1s 冷却 + 2s HoT
  const w = mk([]); const h = w.hero!; h.hp = 10; h.maxHp = 5000; w.pots[0] = 5; w.pots[1] = 5;
  ok(w.usePotion(0) !== null && h.hp === 10, '喝药不立即回满（HoT）');
  ok(w.usePotion(1) === null && w.pots[1] === 5, '1s 冷却内不能再喝');
  run(w, 0.06); const hp1 = h.hp; ok(hp1 > 10 && hp1 < 10 + 120, `第 1 跳 ${hp1 - 10}`);
  run(w, 2.1); ok(h.hp >= 130 - 1e-6, `2s 内总回复 ≥120（${Math.round(h.hp - 10)}，含自然回血）`);
  ok(w.usePotion(1) !== null, '冷却后可再喝');
}
console.log(`战斗平衡测试(药水)全部通过 ${pass} 项`);
