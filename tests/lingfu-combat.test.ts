// 灵符商城 · 战斗侧接入（feat/lingfu-combat，docs/lingfu-shop.md §10.6）：血石 tickStone / 技巧项链 ×5 / 召唤直升卷轴 boostSummon / 回城石战斗内
import { World } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
import { CLASSES } from '../src/data/classes';
import { returnTownOf } from '../src/data/towns';
import { SKILL_NECKLACE_MUL, RETURN_STONE_CD_MS, SUMMON_SCROLL_LV } from '../src/shop/catalog';
import { makeShopItem, useReturnStone, useSummonScroll } from '../src/shop/shop';
import { SUMMON_LV_KILLS } from '../src/combat/World';
let n = 0; const ok = (c: unknown, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; w.units = w.units.filter(u => u.alive); };
const mk = (cls: any = 'warrior', lv = 50, save?: any) => { const w = new World(() => 0.5, lv, FLOORS, cls, save); w.step(0.05); clear(w); w.drainEvents(); return w; };
const evs = (w: World) => w.drainEvents().filter((e: any) => e.type === 'stone') as any[];

// ── 血石
{
  const w = mk(); const h = w.hero!; const st = makeShopItem(w, 'stone_m'); w.equip.stone = st;
  h.hp = Math.floor(h.maxHp * 0.5); h.mp = h.maxMp; w.step(0.05); let e = evs(w);
  const add = Math.ceil(h.maxHp * World.STONE.pct);
  ok(e.length === 1 && e[0].hp === add && e[0].mp === 0 && st.charge!.hp === 50000 - add && st.charge!.mp === 50000, `中血石 HP<60% 触发：+${add}（15% 上限），储量扣减`);
  w.step(0.05); ok(evs(w).length === 0, '2 秒冷却内不再触发');
  h.hp = Math.floor(h.maxHp * 0.5); for (let i = 0; i < 45; i++) w.step(0.05); ok(evs(w).length === 1, '冷却结束再次触发');
  h.hp = Math.floor(h.maxHp * 0.7); for (let i = 0; i < 50; i++) w.step(0.05); ok(evs(w).length === 0, 'HP≥60% 不触发');
  h.mp = Math.floor(h.maxMp * 0.3); h.hp = h.maxHp; w.step(0.05); e = evs(w); ok(e.length === 1 && e[0].mp > 0 && e[0].hp === 0 && st.charge!.mp < 50000, 'MP<40% 触发补蓝');
  // 手动药水优先：喝药后（缓回中/药水冷却中）不触发
  const w2 = mk(); const h2 = w2.hero!; w2.equip.stone = makeShopItem(w2, 'stone_s'); w2.pots[0] = 5; h2.hp = Math.floor(h2.maxHp * 0.3);
  ok(w2.usePotion(0), '喝红药'); w2.step(0.05); ok(evs(w2).length === 0, '药水缓回中血石不触发（手动药水优先）');
  // 城内不生效
  const w3 = mk(); w3.equip.stone = makeShopItem(w3, 'stone_s'); w3.enterTown('xinshou', true); w3.hero!.hp = 1; w3.step(0.05); ok(evs(w3).length === 0 && w3.equip.stone!.charge!.hp === 20000, '城内不生效、不扣储量');
  // 等级不足不生效
  const w4 = mk('warrior', 20); w4.equip.stone = makeShopItem(w4, 'stone_m'); w4.hero!.hp = 1; w4.step(0.05); ok(evs(w4).length === 0, '中血石 Lv<35 不生效');
  // 小血石：无等级限制（Lv1 可装备、生效），实装 [适配]：HP<40% 每 2s +3HP、不回 MP
  const w7 = mk('warrior', 1); w7.bag.push(makeShopItem(w7, 'stone_s')); ok(w7.equipItem(w7.bag.length - 1) === null && w7.equip.stone?.item === 'stone_s', 'Lv1 可佩戴小血石');
  const h7 = w7.hero!; h7.hp = Math.floor(h7.maxHp * 0.3); h7.mp = 0; w7.step(0.05); let e7 = evs(w7); ok(e7.length === 1 && e7[0].hp === 3 && e7[0].mp === 0, `Lv1 小血石生效 +${e7[0]?.hp}/+${e7[0]?.mp}`);
  w7.step(0.05); ok(evs(w7).length === 0, '小血石 2 秒冷却'); for (let i = 0; i < 40; i++) w7.step(0.05); ok(evs(w7).length >= 1, '2 秒后再触发');
  // 储量不足：只补剩余，耗尽保留空石
  const w5 = mk(); const h5 = w5.hero!; const s5 = makeShopItem(w5, 'stone_s'); s5.charge = { hp: 2, mp: 0 }; w5.equip.stone = s5; h5.hp = 10; w5.step(0.05);
  const ev5 = w5.drainEvents(); ok(ev5.some((x: any) => x.type === 'stone' && x.hp === 2) && s5.charge.hp === 0 && w5.equip.stone === s5 && ev5.some((x: any) => x.type === 'log' && /耗尽/.test(x.text)), '储量只补剩余；耗尽保留空石并提示');
  h5.hp = 10; for (let i = 0; i < 60; i++) w5.step(0.05); ok(evs(w5).length === 0, '空石不再触发');
  // 存档：储量随存档
  const sv = JSON.parse(JSON.stringify(w.toSave())); const w6 = mk('warrior', 50, sv); ok(w6.equip.stone?.charge?.hp === st.charge!.hp && w6.equip.stone?.charge?.mp === st.charge!.mp, '储量随存档保存/读取');
}
// ── 技巧项链
{
  const w = mk('mage'); const s = CLASSES.mage.skills[0];
  w.skillTrain[s.id] = 0; w.addTrain(s, 10); const a = w.skillTrain[s.id];
  w.equip.necklace = makeShopItem(w, 'skill_necklace'); w.skillTrain[s.id] = 0; w.addTrain(s, 10);
  ok(a === 10 && w.skillTrain[s.id] === 10 * SKILL_NECKLACE_MUL, `佩戴技巧项链熟练度 ×${SKILL_NECKLACE_MUL}（10→${w.skillTrain[s.id]}）`);
  w.equip.necklace = undefined; w.skillTrain[s.id] = 0; w.addTrain(s, 10); ok(w.skillTrain[s.id] === 10, '卸下恢复 ×1');
}
// ── 召唤直升卷轴
{
  const t = mk('taoist', 42); const th = t.hero!; th.mp = th.maxMp = 99999;
  for (const s of t.skillPool) { t.learned.add(s.id); t.skillTrain[s.id] = 99999; }
  const cast = (id: string) => { t.cast(t.skills.findIndex(s => s.id === id), t.skills.map(() => 0)); t.step(0.05); };
  cast('summon_skeleton'); const s0 = t.summons[0]; ok(s0 && (s0.sLv ?? 0) < 7, `召唤骷髅 ${s0?.sLv} 级`);
  const hp0 = s0.maxHp; t.bag.push(makeShopItem(t, 'summon_lv7_scroll')); const r = useSummonScroll(t, t.bag.length - 1);
  ok(r.ok && s0.sLv === SUMMON_SCROLL_LV && s0.sKills === SUMMON_LV_KILLS[7] && s0.maxHp > hp0 && t.summonBoostLv === 7, '在场召唤物立即 7 级（sKills=SUMMON_LV_KILLS[7]，属性按 applySummonLv）');
  for (const u of t.summons) u.alive = false; t.units = t.units.filter(u => u.alive);
  cast('summon_beast'); const b = t.summons[0]; ok(b && b.sLv === 7 && b.sKills === SUMMON_LV_KILLS[7] && b.sBase!.start < 7, `之后新召唤也从 7 级起（${b?.name}）`);
  const sv = JSON.parse(JSON.stringify(t.toSave())); ok(sv.summonBoostLv === 7, '存档写 summonBoostLv=7');
  const t2 = mk('taoist', 42, sv); ok(t2.summonBoostLv === 7 && t2.summons.every(u => u.sLv === 7), '读档保留：标记 + 在场召唤物等级');
  const t3 = mk('taoist', 42); ok(t3.summonBoostLv === 0 && !('summonBoostLv' in t3.toSave()), '未使用不写字段（旧存档兼容）');
}
// ── 回城石：战斗中可用，召唤物跟随，30 秒冷却
{
  const t = mk('taoist', 42); const th = t.hero!; th.mp = th.maxMp = 99999;
  for (const s of t.skillPool) { t.learned.add(s.id); t.skillTrain[s.id] = 99999; }
  t.cast(t.skills.findIndex(s => s.id === 'summon_skeleton'), t.skills.map(() => 0)); t.step(0.05);
  t.loadFloor(3); t.step(0.05); const foe = t.units.find(u => u.team === 'enemy' && u.alive)!; foe.ai = 'chase'; foe.x = th.x + 50;
  ok(t.inCombat(), '处于战斗中'); t.bag.push(makeShopItem(t, 'return_stone')); const i = t.bag.length - 1, now = 1_000_000;
  const r = useReturnStone(t, i, now); ok(r.ok && t.town === returnTownOf(3), '战斗中可用：无读条回城 ' + r.msg);
  const d = t.summons.map(u => Math.abs(u.x - t.hero!.x)); ok(t.summons.length === 1 && d.every(x => x <= 100), `召唤物跟随回城（距 ${d}px）`);
  t.leaveTown(3); t.step(0.05); const it = t.bag.find(x => x.item === 'return_stone')!; const k = t.bag.indexOf(it);
  ok(!useReturnStone(t, k, now + RETURN_STONE_CD_MS - 1).ok && !t.town, '30 秒冷却内不可用');
  ok(useReturnStone(t, k, now + RETURN_STONE_CD_MS).ok && it.uses === 8, '冷却结束可再用，次数 10→8');
}
console.log(`lingfu-combat: ${n} passed`);
