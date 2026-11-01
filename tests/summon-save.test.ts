// 召唤物/诱惑宠物存读档往返（SaveData.summons 可选字段；旧档无字段按现状）
import { World } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; };
const sums = (w: World) => w.units.filter(u => u.summon && u.alive && !u.decoy).sort((a, b) => a.id.localeCompare(b.id) || (a.sLv! - b.sLv!));
const sig = (w: World) => sums(w).map(u => `${u.id}|${u.pet ? 'P' : ''}|L${u.sLv}|k${u.sKills}|${u.name}|${u.nameColor}|${u.maxHp}|${u.atk}|${u.def}|${(u.hp / u.maxHp).toFixed(3)}`).join('\n');
const rt = (w: World) => new World(() => 0.5, 1, FLOORS, w.cls, JSON.parse(JSON.stringify(w.toSave())));
// 道士：多只、不同等级、不同 HP 比例
const w = new World(() => 0.5, 42, FLOORS, 'taoist'); clear(w); const h = w.hero!; h.mp = h.maxMp = 99999;
for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
for (const u of sums(w)) u.alive = false;
for (const id of ['summon_golden_skeleton', 'summon_golden_skeleton', 'summon_beast']) { const r = w.cast(w.skills.findIndex(s => s.id === id), w.skills.map(() => 0)); for (const u of w.units) u.cd = 0; if (!r.ok) console.log('cast', id, r.reason); w.step(0.05); for (const k in (w as any).skillCd ?? {}) (w as any).skillCd[k] = 0; }
const ss = sums(w); ok(ss.length >= 2, `已召唤 ${ss.length} 只：${ss.map(u => u.name).join('、')}`);
ss.forEach((u, i) => { u.sLv = [5, 2, 7][i % 3]; u.sKills = 3 + i; w.applySummonLv(u); u.hp = Math.round(u.maxHp * [0.37, 0.8, 0.55][i % 3]); });
const before = sig(w), sv = w.toSave(); ok(Array.isArray(sv.summons) && sv.summons!.length === ss.length, `toSave.summons ${sv.summons!.length} 条：${JSON.stringify(sv.summons![0])}`);
const w2 = rt(w); ok(sig(w2) === before, `往返一致：\n${sig(w2)}`);
ok(sums(w2).every(u => w2.summonOocNow(u) && Math.abs(u.x - w2.hero!.x) < 400 && u.y === WORLD.summonLane), '恢复在英雄附近、脱战');
// 再存一次 / 再读一次：不重复叠加
const w3 = rt(w2); ok(sums(w3).length === ss.length, `二次往返数量不变 ${sums(w3).length}`);
w3.restoreSummons(w.toSave().summons); ok(sums(w3).length === ss.length, '已有召唤物时再 restore 不叠加');
// 旧档：无 summons 字段
const old: any = JSON.parse(JSON.stringify(w.toSave())); delete old.summons; const w4 = new World(() => 0.5, 1, FLOORS, 'taoist', old);
ok(sums(w4).length === 0 && w4.level === w.level && w4.gold === w.gold && w4.bag.length === w.bag.length, '旧档无 summons：不报错、无召唤物、其它数据不丢');
const bad: any = { ...old, summons: [null, { id: 'nope', base: { hp: 1 } }, 5, { id: 'skeleton' }] }; const w5 = new World(() => 0.5, 1, FLOORS, 'taoist', bad);
ok(sums(w5).length === 0, '坏条目忽略不报错');
// 多存档槽：两份存档互不串
const slotA = JSON.stringify(w.toSave()), wB = new World(() => 0.5, 42, FLOORS, 'taoist'); clear(wB); for (const u of sums(wB)) u.alive = false; const slotB = JSON.stringify(wB.toSave());
ok(sums(new World(() => 0.5, 1, FLOORS, 'taoist', JSON.parse(slotB))).length === 0 && sig(new World(() => 0.5, 1, FLOORS, 'taoist', JSON.parse(slotA))) === before, '槽 A（有召唤物）/槽 B（无）互不串');
// 法师诱惑宠物往返
{ const m = new World(() => 0.01, 40, FLOORS, 'mage'); clear(m); const mh = m.hero!; mh.mp = mh.maxMp = 99999;
  for (const s of m.skillPool) { m.learned.add(s.id); m.skillTrain[s.id] = 99999; }
  const d = m.spawnFoe('deer', mh.x + 120, 0); d.level = 1; m.step(0.1); m.cast(m.skills.findIndex(s => s.id === 'charm'), m.skills.map(() => 0));
  const p = sums(m).find(u => u.pet)!; p.sLv = 6; m.applySummonLv(p); p.hp = Math.round(p.maxHp * 0.42); const b = sig(m);
  const m2 = rt(m); const p2 = sums(m2).find(u => u.pet); ok(!!p2 && sig(m2) === b && p2.team === 'ally' && m2.pets.length === 1, `诱惑宠物往返：${p2?.name} ${p2?.nameColor} hp ${(p2!.hp / p2!.maxHp).toFixed(2)}`);
  ok(m2.charmCheck(undefined).res === 'none' && m2.pets.length === 1, '宠物计数（上限逻辑）照旧'); }
console.log(`summon-save: ${n} ok`);
