// feat/balance-battle：战斗平衡（保底/等级差/BOSS/药水/技能）+ 首图不变量
import { World, mitigate, lvDiffMult } from '../src/combat/World';
import { WORLD, Floor, FLOORS } from '../src/data/world';
import { ENEMIES } from '../src/data/units';
import { ClassId, CLASSES, PLAN_G, PLAN_G_BEFORE, SKILL_CD, castGapOf } from '../src/data/classes';
import { foeStatsAt, FLOOR_TARGET_LV } from '../src/data/balance';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const mk = (spawns: Floor['spawns'], cls: ClassId = 'warrior', lv = 20) => new World(seeded(1), lv, [{ name: '测试层', spawns }], cls);
const run = (w: World, sec: number) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05, { dx: 0, dy: 0 }); };

{ // 1. 保底 / defFactor / 等级差
  ok(WORLD.dmgFloor === 0.3 && WORLD.defFactor === 0.6, '保底 30%、defFactor 0.6（方案 B 的 0.5 因 balance-sys 公式按 0.6 校准而回退）');
  ok(mitigate(100, 1000, 0) === 30 && mitigate(100, 1000, 0, 0, 0.2, 0.6) === 20, '高防：新保底 30，旧保底 20');
  ok(mitigate(100, 40, 0) === 76 && mitigate(100, 90, 0) === 46 && mitigate(100, 90, 0, 0, 0.2, 0.6) === 46 && mitigate(100, 150, 0) === 30 && mitigate(100, 150, 0, 0, 0.2, 0.6) === 20, '防 40：100−24=76；防 150：新保底 30 / 旧 20');
  ok(lvDiffMult(25, 20) === 1.15 && Math.abs(lvDiffMult(15, 20) - 0.9) < 1e-9 && lvDiffMult(1, 60) === 0.7 && lvDiffMult(20, 20) === 1, '等级差：+3%/级、−2%/级、下限 −30%');
  const w = mk([{ id: 'wolf', x: 700 }]); const h = w.hero!, e = w.alive('enemy')[0];
  h.def = 0; h.hp = h.maxHp = 1e6; e.level = w.level + 5; w.rng = () => 0.5;
  const a = h.hp; w.damage(h, 100, e, false); ok(a - h.hp === 115, `怪物高 5 级：100→${a - h.hp}`);
  const b = e.hp; e.hp = e.maxHp = 1e6; const b0 = e.hp; w.damage(e, 100, h, false); ok(b0 - e.hp === Math.round(Math.max(30, 100 - (e.def ?? 0) * WORLD.defFactor)), `主角打怪不吃等级差（${b0 - e.hp}）`); void b;
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
{ // 3b. 红/蓝冷却各自独立
  const w = mk([], 'mage'); const h = w.hero!; h.hp = 10; h.maxHp = 5000; h.mp = 0; w.pots = [5, 5, 5, 5];
  ok(w.usePotion(0) !== null && w.usePotion(1) === null && w.usePotion(2) !== null && w.usePotion(3) === null, '红药冷却中仍可喝蓝药，同色共用 1s');
  run(w, 0.6); ok(h.hp > 120 && (h.mp ?? 0) >= 90, `0.5s 内回满一瓶（hp ${Math.round(h.hp)} mp ${Math.round(h.mp ?? 0)}）`);
}
{ // 2b. 主线 BOSS：balance-sys 面板 × 分段倍率；早期层不开通用机制
  const sq = FLOORS.findIndex(f => f.name === '蛛网晶洞'); const w = new World(seeded(1), 8, FLOORS, 'mage'); w.loadFloor(sq);
  const q = w.spawnFoe('spider_queen', 3000, 0), fs = foeStatsAt('spider_queen', sq)!;
  ok(FLOOR_TARGET_LV[sq] <= WORLD.bossEarlyLv && q.atk === Math.round(fs.atk * WORLD.bossAtkEarly) && q.maxHp === fs.hp, `蜘蛛女王 攻 ${fs.atk}→${q.atk}（×${WORLD.bossAtkEarly}）血 ${fs.hp} 不变`);
  const ml = FLOORS.findIndex((_, i) => FLOOR_TARGET_LV[i] > WORLD.bossMidLv && FLOORS[i].spawns.some(s => ENEMIES[s.id]?.tier === 'boss'));
  const w2 = new World(seeded(1), 40, FLOORS, 'warrior'); w2.loadFloor(ml); const bid = FLOORS[ml].spawns.find(s => ENEMIES[s.id]?.tier === 'boss')!.id;
  const b2 = w2.spawnFoe(bid, 3000, 0); ok(b2.atk === Math.round(foeStatsAt(bid, ml)!.atk * WORLD.bossAtkLate) && b2.atkInterval <= 1.2, `后期 BOSS ${FLOORS[ml].name} 攻 ×${WORLD.bossAtkLate}、攻速 ≤1.2s`);
}
{ // 4. 方案 G + 召唤
  ok(castGapOf('mage') === 1.0 && castGapOf('warrior') === 0.8 && SKILL_CD.fire_sword === 6 && SKILL_CD.half_moon === 3, '法师公共间隔 1.0s；烈火 6s、半月 3s');
  const fb = CLASSES.mage.skills.find(s => s.id === 'fireball')!;
  ok(fb.mult === +(PLAN_G_BEFORE.mult.fireball * PLAN_G.mageMult * PLAN_G.fireMult).toFixed(2) && fb.mana === Math.round(PLAN_G_BEFORE.mana.fireball * PLAN_G.mageMana), `火球 倍率 ${PLAN_G_BEFORE.mult.fireball}→${fb.mult} 耗魔 ${PLAN_G_BEFORE.mana.fireball}→${fb.mana}`);
  ok(CLASSES.mage.base.hp === PLAN_G.mageHp && CLASSES.mage.grow.hp === PLAN_G.mageHpGrow && CLASSES.mage.grow.def === PLAN_G.mageDefGrow, `法师 HP ${PLAN_G_BEFORE.mageHp}+${PLAN_G_BEFORE.mageHpGrow}/级 → ${PLAN_G.mageHp}+${PLAN_G.mageHpGrow}/级`);
  const sk = (lv: number) => { const w = mk([{ id: 'wolf', x: 3000 }], 'taoist', lv); w.learned = new Set(CLASSES.taoist.skills.map(s => s.id)); const h = w.hero!; h.mp = h.maxMp = 1e4; const i = w.skills.findIndex(s => s.id === 'summon_skeleton'); w.cast(i, w.skills.map(() => 0)); return w.units.find(u => u.summon)!; };
  const a = sk(14), m = sk(20), b = sk(25); ok(b.atk / a.atk < 0.6 && m.atk < a.atk && m.atk > b.atk, `召唤骷髅 15→25 级线性降到 ×${WORLD.summonAtkMul}（攻 14级 ${a.atk} / 20级 ${m.atk} / 25级 ${b.atk}）`);
}
console.log(`战斗平衡测试(药水)全部通过 ${pass} 项`);
