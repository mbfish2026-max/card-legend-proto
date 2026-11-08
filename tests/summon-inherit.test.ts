// 道士召唤物额外继承英雄属性（[适配] WORLD.summonInhAtk/Def/Hp）：实时随升级/换装刷新；诱惑宠物不继承
import { World } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const run = (w: World, sec: number) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05); };
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; };
const summonsOf = (w: World) => w.units.filter(u => u.summon && u.alive);
const inh = (h: any) => ({ atk: Math.round(WORLD.summonInhAtk * Math.max(h.atk, h.tao)), def: Math.round(WORLD.summonInhDef * h.def), hp: Math.round(WORLD.summonInhHp * h.maxHp) });
for (const id of ['summon_skeleton', 'summon_beast', 'drive_corpse', 'summon_golden_skeleton']) {
  const w = new World(() => 0.5, 42, FLOORS, 'taoist'); clear(w); (w as any).equip.weapon = undefined; w.recompute(); /* early-gear：本测试假设武器栏原为空，去掉出生木剑 */ const h: any = w.hero!; h.mp = h.maxMp = 99999;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  for (const u of summonsOf(w)) u.alive = false;
  const i = w.skills.findIndex(s => s.id === id); const r = w.cast(i, w.skills.map(() => 0)); if (!r.ok) throw new Error(id + ' ' + r.reason);
  const u = summonsOf(w).find(x => x.sBase && !x.pet)!; const b = u.sBase!;
  // 当前继承部分 = 最终 − 不继承时（summonInherit 返回值）
  const chk = (tag: string) => { const e = inh(h), got = w.summonInherit(u); ok(got.atk === e.atk && got.def === e.def && got.hp === e.hp && u.def === Math.round((b.def ?? 0) * WORLD.summonSurvDef) + e.def, `${id} ${tag}：继承 攻${got.atk}=20%×max(攻${h.atk},道${h.tao}) 防${got.def}=20%×${h.def} 血${got.hp}=15%×${h.maxHp}；召唤物防=round(基准×${WORLD.summonSurvDef})+继承 攻${u.atk} 防${u.def} 血${u.maxHp}`); };
  chk('召唤时');
  const a0 = u.atk, d0 = u.def!, m0 = u.maxHp; u.hp = Math.round(u.maxHp / 2); const r0 = u.hp / u.maxHp;
  // 换装：直接加一件 +50 道术 +40 防 +500 血的武器
  (w as any).equip.weapon = { item: 'test', stats: { tao: 50, def: 40, hp: 500, mdef: 0 } }; w.recompute(); run(w, 0.1);
  const e1 = inh(h); chk('换装后');
  ok(u.atk - a0 === e1.atk - Math.round(WORLD.summonInhAtk * Math.max(h.atk, h.tao - 50)) && u.def! - d0 === e1.def - Math.round(WORLD.summonInhDef * (h.def - 40)) && u.maxHp > m0, `${id} 换装实时生效：攻 ${a0}→${u.atk} 防 ${d0}→${u.def} 血上限 ${m0}→${u.maxHp}`);
  ok(Math.abs(u.hp / u.maxHp - r0) < 0.02, `${id} 血上限变化保持血量比例 ${r0.toFixed(2)}→${(u.hp / u.maxHp).toFixed(2)}`);
  const m1 = u.maxHp; w.gainExp(1e7); run(w, 0.1); chk('升级后'); ok(u.maxHp > m1 && u.alive, `${id} 升级后血上限 ${m1}→${u.maxHp}（等级 ${w.level}）`);
  ok(/·\d级 \S+的宠物$/.test(u.name) && u.nameColor !== undefined, `${id} 名字/颜色未受影响：${u.name} ${u.nameColor}`);
}
// 法师诱惑宠物：不继承
{ const w = new World(() => 0.01, 40, FLOORS, 'mage'); clear(w); const h: any = w.hero!; h.mp = h.maxMp = 99999;
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  const d = w.spawnFoe('deer', h.x + 120, 0); d.level = 1; run(w, 0.1);
  const i = w.skills.findIndex(s => s.id === 'charm'); w.cast(i, w.skills.map(() => 0)); const p = summonsOf(w).find(x => x.pet)!;
  const hp = p.maxHp, atk = p.atk, def = p.def; (w as any).equip.weapon = { item: 'test', stats: { mag: 80, atk: 50, def: 40, hp: 500, mdef: 0 } }; w.recompute(); run(w, 0.5);
  const g = w.summonInherit(p); ok(g.atk === 0 && g.hp === 0 && g.def === 0 && p.maxHp === hp && p.atk === atk && p.def === def, `法师诱惑宠物不继承：${p.name} 攻${p.atk} 防${p.def} 血${p.maxHp} 换装前后不变`); }
console.log(`summon-inherit: ${n} ok`);
