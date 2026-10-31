/** 合击版阶段 A：英雄战斗单测（生成/三模式/指定目标/召回冷却/用药/怒气/合击/存档/英雄关闭一致性） */
import { World } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { WORLD } from '../src/data/world';
import { COMPANION_UNIT_ID, COMPANION_RECALL_CD, RAGE_MAX, RAGE_REGEN, HEART_PER_RAGE, BURST_DRAIN, rageTick, canUnleash, unleash, newCompanion, migrateCompanion, companionStats, COMPANION_POT_HP, comboFor, COMBO_PLACEHOLDER, comboEffect, COMBOS, COMBO_EFFECTS } from '../src/data/companion';
import type { InvItem } from '../src/combat/types';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const W = (cls: any = 'warrior', hcls: any = 'mage', seed = 1, save?: any) => { const w = new World(seeded(seed), 45, [{ name: '测试层', spawns: [] }], cls, save); if (!save) { w.recruitCompanion(hcls, '小英'); w.step(0.05); w.drainEvents(); } return w; };
const item = (id: string, qty = 1): InvItem => ({ uid: 0, item: id, name: id, rarity: 'common' as any, stats: {}, req: 0, price: 0, qty });
const foe = (w: World, x: number, hp = 1e6) => { const e = w.spawn(ENEMIES.orc, 'enemy', x, 0); e.hp = e.maxHp = hp; return e; };
const run = (w: World, sec: number, f?: () => void) => { const ev: any[] = []; for (let t = 0; t < sec; t += 0.05) { f?.(); w.step(0.05); ev.push(...w.drainEvents()); } return ev; };
const hitsBy = (ev: any[], uid: number, target?: number) => ev.filter(e => e.type === 'attack' && e.source === uid && (target === undefined || e.target === target)).length;
{ // A1 生成
  const w = W(); const u = w.companionUnit!;
  ok(!!u && u.id === COMPANION_UNIT_ID && u.companion === true && !u.summon && u.team === 'ally', 'out=true 生成 id=companion 单位（非召唤物）');
  const st = companionStats(w.companion!); ok(u.maxHp === st.hp && u.atk === st.atk && u.mag === st.mag, '英雄单位属性 = companionStats');
  w.loadFloor(0); ok(w.companionUnit === u, '换层保留英雄单位');
}
{ // A1 三模式
  const w = W('warrior', 'warrior'); const h = w.hero!; h.hp = h.maxHp = 1e9; const e = foe(w, h.x + 400); e.ai = 'chase'; e.atk = 0;
  w.cycleCompanionMode('follow'); const cu = w.companionUnit!.uid; let ev = run(w, 6, () => { h.x = WORLD.heroStartX; });
  ok(hitsBy(ev, cu) === 0, '跟随：不自己攻击');
  ok(Math.abs(w.companionUnit!.x - (h.x - h.facing * 80)) < 40, '跟随：贴在主人身后');
  w.cycleCompanionMode('fight'); ev = run(w, 6, () => { h.x = WORLD.heroStartX; }); ok(hitsBy(ev, cu, e.uid) > 0, '攻击：主动打交战中的怪');
  ok(e.aggroUid === w.companionUnit!.uid, '英雄打怪记仇（复用召唤物仇恨）');
  w.cycleCompanionMode('rest'); const x0 = w.companionUnit!.x; ev = run(w, 4, () => { h.x = WORLD.heroStartX + 600; });
  ok(w.companionUnit!.x === x0 && hitsBy(ev, cu) === 0, '休息：原地等待、不攻击');
  ok(w.cycleCompanionMode() === null && w.companion!.mode === 'fight', 'Ctrl+E 循环：休息 → 攻击');
  ok(newCompanion('mage', 'x').mode === 'fight', '官方初始状态 = 攻击');
}
{ // A1 指定目标 + 合法性
  const w = W('warrior', 'warrior'); const h = w.hero!; h.hp = h.maxHp = 1e9;
  const a = foe(w, h.x + 300), b = foe(w, h.x + 900); a.ai = 'chase'; a.atk = b.atk = 0;
  ok(w.setCompanionTarget(b.uid) === null && w.companionTarget === b.uid, '点怪物卡：指定英雄目标');
  ok(w.setCompanionTarget(h.uid) !== null, '不能指定友方为目标');
  const cu = w.companionUnit!.uid; let ev = run(w, 8, () => { h.x = WORLD.heroStartX; }); ok(hitsBy(ev, cu, b.uid) > 0 && hitsBy(ev, cu, a.uid) === 0, '英雄优先打指定目标');
  w.cycleCompanionMode('follow'); w.setCompanionTarget(a.uid); ev = run(w, 6, () => { h.x = WORLD.heroStartX; }); ok(hitsBy(ev, cu, a.uid) > 0, '[适配] 跟随状态下指定目标仍执行');
  w.cycleCompanionMode('rest'); ok(w.setCompanionTarget(a.uid) !== null, '休息状态不接受指定');
}
{ // A1 受伤 / 死亡
  const w = W(); const u = w.companionUnit!; const e = foe(w, u.x + 100);
  const ev0: any[] = []; w.damage(u, 30, e); ev0.push(...w.drainEvents()); ok(u.hp < u.maxHp && ev0.some(x => x.type === 'damage' && x.target === u.uid), '英雄受伤（damage 事件，走受击动画）');
  w.damage(u, 1e9, e, false); w.step(0.05); w.drainEvents();
  ok(!u.alive && !w.companionUnit && !w.companion!.out, '英雄被怪打死：自动收回');
  ok(w.companionCooldown() > 0 && w.toggleCompanion()!.includes('冷却'), '阵亡后同样 60 秒冷却 [适配]');
}
{ // A2 召回冷却（官方 60 秒）
  const w = W(); ok(COMPANION_RECALL_CD === 60, '召回冷却 = 官方 1 分钟');
  ok(w.toggleCompanion() === null && !w.companion!.out && !w.companionUnit, '收回：移除单位');
  ok(w.toggleCompanion()!.includes('冷却'), '60 秒内无法再次召唤');
  run(w, 59); ok(w.toggleCompanion() !== null, '59 秒仍冷却'); run(w, 1.1);
  ok(w.toggleCompanion() === null && w.companion!.out && !!w.companionUnit, '满 60 秒可再召唤');
}
{ // A3 自动用药
  const w = W(); const u = w.companionUnit!; w.companion!.bag.push(item('hp_strong', 2), item('mp_strong'));
  u.hp = u.maxHp * (COMPANION_POT_HP + 0.05); w.step(0.05); ok(w.companion!.bag[0].qty === 2, '阈值以上不喝');
  u.hp = Math.max(1, u.maxHp * 0.3); const h0 = u.hp; w.step(0.05); ok(u.hp > h0 && w.companion!.bag[0].qty === 1, 'HP < 50% 自动喝红');
  for (let t = 0; t < 1.05; t += 0.05) w.step(0.05); // feat/balance-battle：药水 1s 冷却
  u.mp = 0; w.step(0.05); ok(!w.companion!.bag.some(b => b.item === 'mp_strong') && u.mp! > 0, 'MP < 30% 自动喝蓝');
  w.companion!.bag = []; u.hots = []; u.hp = 1; w.step(0.05); ok(u.hp < u.maxHp * 0.5, '无药不喝');
}
{ // A4 rageTick / heartStore
  const c = newCompanion('mage', 'x'); c.out = true; rageTick(c, 10); ok(c.rage === 0, '无火龙之心不补怒');
  c.equip.heart = item('fire_heart'); c.heartStore = 1000; rageTick(c, 10);
  ok(Math.abs(c.rage - RAGE_REGEN * 10) < 1e-6 && Math.abs(c.heartStore - (1000 - RAGE_REGEN * 10 * HEART_PER_RAGE)) < 1e-6, 'rageTick：按速率补怒并扣火龙之心储量');
  c.heartStore = 0; const r0 = c.rage; rageTick(c, 10); ok(c.rage === r0, '火龙之心储量为 0：怒气无法恢复（官方）');
  c.heartStore = 30000; rageTick(c, 1000); ok(c.rage === RAGE_MAX && c.heartStore === 30000 - (RAGE_MAX - r0) * HEART_PER_RAGE, '补满即止，不多扣储量');
  ok(canUnleash(c) && unleash(c) && !!c.burst && c.rage === RAGE_MAX, '满槽可爆发（进入爆发态）'); ok(!canUnleash(c), '爆发中不能重复爆发');
  rageTick(c, RAGE_MAX / BURST_DRAIN / 2); ok(c.rage < RAGE_MAX && !!c.burst && c.heartStore === 30000 - (RAGE_MAX - r0) * HEART_PER_RAGE, '爆发期间自动消耗怒气，不补怒');
  ok(rageTick(c, RAGE_MAX / BURST_DRAIN) === 'expired' && !c.burst && c.rage === 0, '怒气耗尽未放出：作废');
}
{ // A4 unleash 条件 + 合击释放
  const w = W('warrior', 'mage'); const c = w.companion!, h = w.hero!; h.hp = h.maxHp = 1e9;
  ok(w.unleashCombo()!.includes('火龙之心'), '无火龙之心不能爆发');
  c.equip.heart = item('fire_heart'); c.rage = 50; ok(w.unleashCombo()!.includes('未满'), '怒气未满不能爆发');
  c.rage = RAGE_MAX; ok(w.unleashCombo()!.includes('合击'), '未学合击不能爆发');
  const cb = comboFor('warrior', 'mage')!; c.combo = [cb.id]; c.out = false; w.step(0.05); ok(w.unleashCombo() !== null, '英雄未召唤不能爆发'); c.out = true; w.step(0.05);
  ok(w.unleashCombo() === null && !!c.burst, '满足条件：进入爆发');
  const e = foe(w, h.x + 160); e.ai = 'chase'; e.atk = 0; let combo: any = null;
  for (let i = 0; i < 100 && !combo; i++) { w.step(0.05); combo = w.drainEvents().find(x => x.type === 'combo'); }
  ok(!!combo && combo.id === cb.id && combo.target === e.uid && combo.amount > 0, '同目标同范围：自动释放合击（占位伤害）');
  ok(c.rage === 0 && !c.burst, '释放后清空怒气');
  // 目标不一致 → 不触发、怒气耗尽作废
  c.rage = RAGE_MAX; w.unleashCombo(); w.heroTargetUid = null; const far = foe(w, h.x + 3000); w.companionTarget = far.uid; w.heroTargetUid = e.uid;
  let fired = false, expired = false; for (let i = 0; i < 200; i++) { w.step(0.05); for (const ev of w.drainEvents()) { if (ev.type === 'combo') fired = true; if (ev.type === 'log' && ev.text.includes('作废')) expired = true; } }
  ok(!fired && expired && c.rage === 0 && !c.burst, '目标不同：不释放，怒空失效');
}
{ // A5 存档往返 + 旧档兼容
  const w = W(); const c = w.companion!; c.mode = 'rest'; c.rage = 42; c.heartStore = 1234; c.burst = true; c.recallAt = 99;
  const w2 = W('warrior', 'mage', 1, JSON.parse(JSON.stringify(w.toSave()))); const c2 = w2.companion!;
  ok(!!c2 && c2.mode === 'rest' && c2.rage === 42 && c2.heartStore === 1234 && c2.out === true, '存档往返：模式/怒气/储量/召唤态');
  ok(c2.burst === false && c2.recallAt < -1e8, '爆发态与召回时刻不跨存档（读档后 world.time 从 0 起）');
  const old: any = { cls: 'taoist', name: '旧', level: 41, exp: 0, bag: [], equip: {}, mode: 'follow', rage: 0, heartStore: 0, out: true, recallAt: 5 };
  const m = migrateCompanion(old)!; ok(m.burst === false && m.mode === 'follow' && m.recallAt < 0, '旧档（无 burst 字段）兼容');
  ok(migrateCompanion({ ...old, mode: 'xx' })!.mode === 'fight', '非法模式回落官方默认「攻击」');
}
{ // 英雄关闭：与无英雄世界逐 tick 一致（模拟 = main）
  const mkw = (withC: boolean) => { const w = new World(seeded(7), 45, [{ name: 't', spawns: [{ id: 'orc', x: 900 }, { id: 'orc', x: 1300 }] }], 'warrior'); if (withC) { w.recruitCompanion('mage', 'x'); w.toggleCompanion(); } w.drainEvents(); return w; };
  const a = mkw(false), b = mkw(true); ok(!b.companion!.out, '英雄已收回');
  const sig = (w: World) => JSON.stringify(w.units.map(u => [u.uid, Math.round(u.x), Math.round(u.hp)]).concat([[w.rng(), w.exp, w.gold]]));
  let same = true; for (let i = 0; i < 1200; i++) { a.step(0.05, { dx: 1, dy: 0 }); b.step(0.05, { dx: 1, dy: 0 }); a.drainEvents(); b.drainEvents(); if (i % 100 === 0 && sig(a) !== sig(b)) same = false; }
  ok(same && sig(a) === sig(b), '英雄不出战：战斗结算与随机序列与无英雄完全一致');
}
{ // B1 职业对→合击 id 一一对应 + 效果表不再走占位
  const pairs: [any, any, string][] = [['warrior','warrior','pohun'],['mage','mage','huolong'],['taoist','taoist','shihun'],['warrior','mage','leiting'],['mage','taoist','mori'],['warrior','taoist','pixing']];
  ok(pairs.every(([a, b, id]) => comboFor(a, b)?.id === id && comboFor(b, a)?.id === id), 'B1：6 个职业对各映射到唯一合击 id（顺序无关）');
  ok(COMBOS.every(c => !!COMBO_EFFECTS[c.id] && comboEffect(c.id) !== COMBO_PLACEHOLDER), 'B1：6 种合击均有效果表，不回退占位');
  // 每种合击：触发一次，检查伤害/命中数/状态
  const fire = (mc: any, hc: any, lv = 45) => {
    const w = W(mc, hc); const c = w.companion!, h = w.hero!; h.hp = h.maxHp = 1e9; c.level = lv;
    const cb = comboFor(mc, hc)!; c.combo = [cb.id]; c.equip.heart = item('fire_heart'); c.heartStore = 30000; c.rage = RAGE_MAX; c.out = true; w.step(0.05); w.drainEvents();
    const e = foe(w, h.x + 160); e.ai = 'chase'; e.atk = 0; e.def = 0; e.mdef = 0; const e2 = foe(w, h.x + 300); e2.atk = 0; e2.ai = 'chase'; const e3 = foe(w, h.x + 600); e3.atk = 0;
    w.unleashCombo(); let combo: any = null; for (let i = 0; i < 200 && !combo; i++) { w.step(0.05); combo = w.drainEvents().find(x => x.type === 'combo'); }
    return { w, h, e, e2, e3, combo, cb };
  };
  for (const [mc, hc, id] of pairs) {
    const r = fire(mc, hc), fx = COMBO_EFFECTS[id]!, t = r.w.units.find(u => u.uid === r.combo?.target)!;
    ok(!!r.combo && r.combo.id === id && r.combo.amount > 0, `B1 ${id}：触发并造成伤害`);
    if (!r.combo || !t) continue;
    ok(fx.aoe > 0 ? r.combo.hits >= 2 : r.combo.hits === 1, `B1 ${id}：范围 ${fx.aoe ? '群体 ' + fx.aoe + 'px' : '单体'}`);
    if (fx.poison) ok((t.poisonUntil ?? 0) > r.w.time && (t.poisonDps ?? 0) > 0, `B1 ${id}：持续掉血/中毒`);
    if (fx.stun) ok((t.stunUntil ?? 0) > r.w.time && t.cd > 1, `B1 ${id}：麻痹（不移动不攻击）`);
    if (fx.vuln) ok((t.vulnUntil ?? 0) > r.w.time && ((t.vulnPhys ?? 0) > 0 || (t.vulnMag ?? 0) > 0), `B1 ${id}：受伤加深`);
  }
  { const w = W(); const e = foe(w, 9999); e.def = 0; e.mdef = 0; const a = w.damage(e, 1000, undefined, false, false, true, 0); e.vulnUntil = w.time + 5; e.vulnPhys = 0.2; const b = w.damage(e, 1000, undefined, false, false, true, 0); ok(a === 1000 && b === 1200, 'B1 受伤加深：物理 +20%'); }
  { const w = W(); const e = foe(w, 9999); e.ai = 'chase'; e.stunUntil = w.time + 5; const x0 = e.x; run(w, 1); ok(e.x === x0, 'B1 麻痹期间不移动'); }
  { const r = fire('warrior', 'warrior'); const ls = COMBO_EFFECTS.pohun!.lifesteal!; ok(ls > 0 && !!r.combo, 'B1 战士英雄（战战破魂斩）可近战触发合击'); }
  { // 战士英雄掉队修复：主人奔跑时近战英雄能跟上
    const w = W('warrior', 'warrior'); const h = w.hero!; h.hp = h.maxHp = 1e9; w.companion!.level = 45;
    for (let i = 0; i < 400; i++) { w.step(0.05, { dx: 1, dy: 0 }); w.drainEvents(); }
    ok(Math.abs(w.companionUnit!.x - h.x) <= 450, 'B1 战士英雄跟得上奔跑的主人（≤ 合击范围）');
  }
}
{ // B3 新 BOSS 魔龙教主 / 魔龙血域（侧线层 23）
  const { FLOORS, FLOOR_ORDER, SIDE_FLOORS, nextFloorOf } = await import('../src/data/world');
  const { BOSS_MECH } = await import('../src/combat/World');
  const { townOfFloor } = await import('../src/data/towns');
  const { REGIONS } = await import('../src/data/map');
  const { HJ_FLOOR_ANCHORS, FLOOR_EXP_MULT } = await import('../src/data/expCurve');
  const d = ENEMIES.boss_molong;
  ok(!!d && d.name === '魔龙教主' && d.tier === 'boss' && d.hp === ENEMIES.boss_zuma.hp && d.art === 'boss_woma' && d.card?.tint !== undefined, 'B3 魔龙教主：HP 基数 12000（官方，与祖玛教主同基数×难度），复用贴图着色占位');
  ok(d.drops!.some(x => x.item === 'boots') && d.drops!.some(x => x.item === 'book_page') && BOSS_MECH.has('boss_molong'), 'B3 掉落靴子/书页（官方掉落中本作已有的），走 BOSS 机制框架');
  ok(FLOORS[23]?.name === '魔龙血域' && FLOORS[23].spawns.some(x => x.id === 'boss_molong') && SIDE_FLOORS.includes(23) && !FLOOR_ORDER.includes(23) && nextFloorOf(22) === -1, 'B3 下标 23 侧线层，不进通关顺序（火龙仍是终点）');
  ok(REGIONS.find(r => r.id === 'hejiban')!.nodes.some(n => n.floor === 23) && townOfFloor(23) === 'mengzhong' && HJ_FLOOR_ANCHORS.length === 6 && FLOOR_EXP_MULT.length === 80, 'B3 接入合击区域/回盟重/经验锚点');
  const w = new World(seeded(9), 55, FLOORS, 'warrior'); w.loadFloor(23); const h = w.hero!; h.hp = h.maxHp = 1e9; h.atk = 0;
  const boss = w.units.find(u => u.id === 'boss_molong')!; ok(!!boss && boss.alive, 'B3 进入魔龙血域生成魔龙教主');
  for (const u of w.alive('enemy')) if (u !== boss) w.kill(u);
  h.x = boss.x - 150; boss.ai = 'chase'; let tp = false, hit = false;
  for (let i = 0; i < 40 * 20; i++) { w.step(0.05); for (const e of w.drainEvents()) { if (e.type === 'bossfx' && e.kind === 'fly') tp = true; if (e.type === 'attack' && e.source === boss.uid) hit = true; } }
  ok(tp && hit, 'B3 魔龙教主近战 + 30 秒瞬移到身后');
  { const w3 = W('warrior', 'taoist'); const c = w3.companion!; c.level = 45; c.combo = ['pixing']; c.equip.heart = item('fire_heart'); c.heartStore = 30000; c.rage = RAGE_MAX; const h3 = w3.hero!; h3.hp = h3.maxHp = 1e9;
    const bb = w3.spawn(ENEMIES.boss_molong, 'enemy', h3.x + 150, 0); bb.hp = bb.maxHp = 1e7; bb.ai = 'chase'; bb.atk = 0; w3.unleashCombo(); let cm: any = null;
    for (let i = 0; i < 200 && !cm; i++) { w3.step(0.05); cm = w3.drainEvents().find(x => x.type === 'combo'); }
    ok(!!cm && !(bb.stunUntil && bb.stunUntil > w3.time) && (bb.vulnUntil ?? 0) > w3.time, 'B BOSS 免疫麻痹（受伤加深仍生效）'); }
  for (const u of w.alive('enemy')) w.kill(u); h.x = w.exitX; w.step(0.05); w.step(0.05);
  ok(!w.done && w.town === 'mengzhong', 'B3 清完魔龙血域：回盟重，不判通关');
  const w2 = new World(seeded(9), 55, FLOORS, 'warrior'); w2.loadFloor(23); const sv = JSON.parse(JSON.stringify(w2.toSave()));
  ok(new World(seeded(9), 55, FLOORS, 'warrior', sv).floorIndex === 23, 'B3 存档在魔龙血域：读档层号不变');
  const old: any = JSON.parse(JSON.stringify(new World(seeded(9), 50, FLOORS, 'warrior').toSave())); old.floorIndex = 22; delete old.companion;
  const wo = new World(seeded(9), 50, FLOORS, 'warrior', old); ok(wo.floorIndex === 22 && nextFloorOf(22) === -1, 'B3 旧存档（无英雄/在火龙神殿）兼容');
}
console.log(`合击版阶段 A 英雄战斗通过（${pass}）`);
