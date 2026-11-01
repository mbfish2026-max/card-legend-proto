// fix/town-hot：城内喝药水（HoT）应在城内结算；出城不重复补；读档兼容
import { World } from '../src/combat/World';
import { WORLD } from '../src/data/world';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const mk = () => { const w = new World(() => 0.5); w.startInVillage(); w.pots[0] = 5; const h = w.hero!; h.hp = 10; return w; };
{ const w = mk(), h = w.hero!; ok(!!w.town, '在城内');
  ok(w.usePotion(0) !== null && w.pots[0] === 4, '城内喝金创药：扣 1 瓶');
  for (let i = 0; i < 20; i++) w.step(0.05);
  ok(h.hp === 10 + 120, `城内 1s 后 HP 涨满 120（实际 ${h.hp}）`);
  ok(!(h.hots?.length), 'HoT 在城内 tick 到期并清空');
  w.leaveTown(0); const hp0 = w.hero!.hp; w.step(0.05);
  ok(w.hero!.hp - hp0 <= WORLD.hpRegen * 5 * 0.05 + 1e-6, `出城不重复补 HoT（+${(w.hero!.hp - hp0).toFixed(2)}）`); }
{ const w = mk(), h = w.hero!; w.usePotion(0); w.step(0.05); w.step(0.05); const mid = h.hp; ok(mid > 10, `城内 0.1s 已回第一跳（${mid}）`); }
{ const w = mk(); w.usePotion(0); for (let i = 0; i < 20; i++) w.step(0.05); const s = JSON.parse(JSON.stringify(w.toSave()));
  const w2 = new World(() => 0.5, s.level, undefined, s.cls, s); ok(!!w2.town && w2.pots[0] === 4, '城内喝药后存读档：仍在城内、瓶数一致');
  const hp = w2.hero!.hp; for (let i = 0; i < 20; i++) w2.step(0.05); ok(w2.hero!.hp >= hp && !(w2.hero!.hots?.length), '读档后无残留 HoT、不额外回血'); }
console.log(`town-hot: ${n - fail}/${n}`); if (fail) { console.log('town-hot: FAILED'); process.exit(1); } else console.log('town-hot: all passed');
