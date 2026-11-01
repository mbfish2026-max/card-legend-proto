// 换图后召唤物立即在英雄身边（≤100px）、等级保留：下一层 / 返回上一层(S) / 上一层按钮 / 传送 / 副本进出 / 回城 / 出城 / 城内传送
import { World } from '../src/combat/World';
import { FLOORS, WORLD, prevLayerOf } from '../src/data/world';
import { DUNGEON_BY_FLOOR } from '../src/data/dungeons';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const sums = (w: World) => w.units.filter(u => u.summon && u.alive && !u.decoy);
const clear = (w: World) => { for (const e of w.units) if (e.team === 'enemy') e.alive = false; w.units = w.units.filter(u => u.alive); };
// 道士召唤 3 只不同等级 → 存档 → 法师/道士各读一份
const t = new World(() => 0.5, 42, FLOORS, 'taoist'); clear(t); const th = t.hero!; th.mp = th.maxMp = 99999;
for (const s of t.skillPool) { t.learned.add(s.id); t.skillTrain[s.id] = 99999; }
for (const id of ['summon_golden_skeleton', 'summon_beast']) { t.cast(t.skills.findIndex(s => s.id === id), t.skills.map(() => 0)); t.step(0.05); }
sums(t).forEach((u, i) => { u.sLv = [5, 2, 7][i % 3]; t.applySummonLv(u); });
const sv = JSON.parse(JSON.stringify(t.toSave()));
// 再加一只诱惑宠物（法师）
const pet = { id: 'deer', pet: true, sLv: 3, sKills: 1, base: { hp: 100, atk: 10, start: 1, name: '鹿' }, hpR: 0.6, level: 5, def: 1, mdef: 1 };
for (const cls of ['mage', 'taoist'] as const) {
  const w = new World(() => 0.5, 42, FLOORS, cls, { ...sv, cls, summons: [...sv.summons, ...(cls === 'mage' ? [pet] : [])] }); clear(w);
  const lv = () => sums(w).map(u => u.id + ':' + u.sLv).sort().join(',');
  const lv0 = lv(); ok(sums(w).length >= (cls === 'mage' ? 3 : 2), `${cls} 召唤物 ${lv0}`);
  const chk = (path: string) => {
    const h = w.hero!, d = sums(w).map(u => Math.round(Math.abs(u.x - h.x))), W = w.town ? 1e9 : w.mapW;
    ok(d.length >= 2 && d.every(x => x <= 100) && sums(w).every(u => u.x >= u.width / 2 && u.x <= W - u.width / 2) && lv() === lv0, `${cls} ${path}：距英雄 ${d.join('/')}px，等级 ${lv()}`);
  };
  const far = () => { for (const u of sums(w)) u.x = w.hero!.x + 1500; }; // 模拟召唤物落在远处
  w.reached = new Set(FLOORS.map((_, i) => i)); w.gold = 1e9;
  w.loadFloor(3); chk('下一层(loadFloor)');
  far(); w.hero!.x = WORLD.heroStartX; ok(w.prevFloor(), 'prevFloor ok'); chk('返回上一层(S，落在上一层终点)');
  w.loadFloor(FLOORS.findIndex((_, i) => prevLayerOf(i) >= 0)); far(); const ul = w.upLayer(); ok(ul === 'ok', 'upLayer ' + ul); chk('上一层按钮');
  far(); w.teleportReadyAt = 0; w.teleport(5); chk('传送');
  const df = +Object.keys(DUNGEON_BY_FLOOR)[0];
  far(); w.teleportReadyAt = 0; w.reached.add(df); const r = w.teleport(df); w.loadFloor(df); chk(`进副本(${w.floors[df].name}${r ? ' ' + r : ''})`);
  far(); w.loadFloor(3); chk('出副本');
  far(); w.enterTown('bichi', true); chk(`回城(${w.town})`);
  far(); w.leaveTown(); chk('出城');
}
console.log(`summon-mapchange: ${n} ok`);
