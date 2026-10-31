/** 合击版阶段 A：英雄战斗单测（生成/三模式/指定目标/召回冷却/用药/怒气/合击/存档/英雄关闭一致性） */
import { World } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { WORLD } from '../src/data/world';
import { COMPANION_UNIT_ID, COMPANION_RECALL_CD, RAGE_MAX, RAGE_REGEN, HEART_PER_RAGE, BURST_DRAIN, rageTick, canUnleash, unleash, newCompanion, migrateCompanion, companionStats, COMPANION_POT_HP, comboFor, COMBO_PLACEHOLDER, comboEffect } from '../src/data/companion';
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
  u.mp = 0; w.step(0.05); ok(!w.companion!.bag.some(b => b.item === 'mp_strong') && u.mp! > 0, 'MP < 30% 自动喝蓝');
  w.companion!.bag = []; u.hp = 1; w.step(0.05); ok(u.hp < u.maxHp * 0.5, '无药不喝');
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
  ok(comboEffect('pohun') === COMBO_PLACEHOLDER, '阶段 A：6 种合击走占位效果表（阶段 B 填 COMBO_EFFECTS）');
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
console.log(`合击版阶段 A 英雄战斗通过（${pass}）`);
