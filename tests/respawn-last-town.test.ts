// 死亡复活回「最近待过的城镇」：多城切换、旧档回退、存档往返、召唤物跟随（≤100px、等级保留）、多次死亡
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { TOWNS, TOWN_SPAWN_X, returnTownOf, townFloors } from '../src/data/towns';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
const sums = (w: World) => w.units.filter(u => u.summon && u.alive && !u.decoy);
const die = (w: World) => { w.kill(w.hero!); ok(!w.hero, '死亡'); w.respawn(); ok(!!w.hero && w.hero.hp === w.hero.maxHp, '满血复活'); };
const towns = Object.keys(TOWNS); ok(towns.includes('xinshou') && towns.includes('bichi') && towns.length >= 3, '城镇 ' + towns.join(','));
const pet = { id: 'deer', pet: true, sLv: 3, sKills: 1, base: { hp: 100, atk: 10, start: 1, name: '鹿' }, hpR: 0.6, level: 5, def: 1, mdef: 1 };
const mk = (extra: object = {}) => { const w0 = new World(() => 0.5, 1, FLOORS, 'mage'); const sv = { ...JSON.parse(JSON.stringify(w0.toSave())), level: 30, floorIndex: 4, town: null, reached: FLOORS.map((_, i) => i), summons: [pet], ...extra }; delete sv.lastTownId; Object.assign(sv, extra); return new World(() => 0.5, 1, FLOORS, 'mage', sv); };
// 多城切换：进 A → 出城野外死 → 回 A；进 B → 野外死 → 回 B；再死一次仍 B
const w = mk(); const [A, B] = ['bichi', towns.find(t => t !== 'bichi' && t !== 'xinshou')!];
for (const [t, k] of [[A, 1], [B, 2], [B, 3], ['xinshou', 4]] as const) {
  if (k !== 3) { ok(w.enterTown(t, true) === null, '进 ' + t); ok(w.lastTownId === t, 'lastTownId=' + t); ok(w.leaveTown(townFloors(t)[0]) === null && !w.town, '出城到野外'); ok(w.lastTownId === t, '野外不改 lastTownId'); }
  const lv0 = sums(w).map(u => u.sLv).join();
  die(w); ok(w.town === t && w.deaths === k, `第 ${k} 次死亡回 ${t}（实际 ${w.town}）`);
  ok(Math.abs(w.hero!.x - TOWN_SPAWN_X) < 1, '落在进城出生点');
  const d = sums(w).map(u => Math.round(Math.abs(u.x - w.hero!.x)));
  ok(d.length === 1 && d.every(x => x <= 100) && sums(w).map(u => u.sLv).join() === lv0, `召唤物跟随 ${d}px 等级 ${lv0}`);
  w.leaveTown(townFloors(t)[0]);
}
// 旧档：无 lastTownId、不在城 → 回退本层 returnTownOf；在城旧档 → 该城
const o = mk(); ok(o.lastTownId === null, '旧野外档 lastTownId=null'); die(o); ok(o.town === returnTownOf(4), '旧档回退 returnTownOf(4)=' + o.town);
const o2 = mk({ town: A }); ok(o2.lastTownId === A, '旧城内档 lastTownId=存档 town');
// 往返
const r = new World(() => 0.5, 1, FLOORS, 'mage', JSON.parse(JSON.stringify(w.toSave()))); ok(r.toSave().lastTownId === 'xinshou' && r.lastTownId === 'xinshou', '存档往返 lastTownId');
r.leaveTown(); die(r); ok(r.town === 'xinshou', '读档后死亡回 xinshou');
const bad = mk({ lastTownId: 'nope' }); ok(bad.lastTownId === null, '非法 lastTownId 忽略');
console.log(`respawn-last-town: ${n} ok`);
