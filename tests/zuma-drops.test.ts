// feat/zuma-drops：推翻 E5，祖玛三件（自创 set_zuma_helm/ring/boots）恢复普通掉落；补法/道 T5 头盔缺口
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { ITEMS, SETS } from '../src/data/items';
import { ENEMIES } from '../src/data/units';
import { RESTORED_SET_ITEMS, RETIRED_SET_ITEMS } from '../src/data/eg-sets';
import { realignDen } from '../src/data/drop-realign';
import { minFloorLv, CAP_GEAR, CAP_NORMAL } from '../src/data/drop-plan';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
const Z = ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots'];
const den = (e: string, it: string) => { const d = ENEMIES[e]?.drops?.find(x => x.item === it); return d ? Math.round(1 / d.chance) : 0; };
ok(JSON.stringify(RESTORED_SET_ITEMS) === JSON.stringify(Z) && !Z.some(i => RETIRED_SET_ITEMS.includes(i)) && RETIRED_SET_ITEMS.length === 3, '祖玛三件移出退役表，赤月 3 件仍退役');
// 属性/需求/图标不改
const ST: Record<string, string> = { set_zuma_helm: '{"def":13,"hp":90}', set_zuma_ring: '{"atk":11,"mag":11,"tao":11}', set_zuma_boots: '{"def":8,"hp":70}' };
for (const id of Z) ok(JSON.stringify(ITEMS[id]!.equip) === ST[id] && ITEMS[id]!.req === 30 && !ITEMS[id]!.cls && ITEMS[id]!.icon === `assets/items/${id}.png` && ITEMS[id]!.set === 'zuma', `${id} 属性/需求30/通用/图标不变`);
ok(SETS.zuma?.pieces.join() === Z.join(), '祖玛套定义不变');
// 来源与爆率：BOSS 1/30（30 档默认），普通怪 1/60
const SRC: [string, number][] = [['boss_evil_pincer', 30], ['boss_chulong', 30], ['boss_zuma', 30], ['zuma_guard', 60], ['zuma_statue', 60]];
ok(realignDen(30, true) === 30 && realignDen(30, false) === 60, '30 档默认 BOSS 1/30、普通 1/60');
for (const id of Z) { for (const [e, d] of SRC) ok(den(e, id) === d, `${ITEMS[id]!.name}×${ENEMIES[e]!.name} 1/${d}`);
  const all = Object.entries(ENEMIES).filter(([, u]) => (u.drops ?? []).some(d => d.item === id)).map(([e]) => e).sort();
  ok(all.join() === SRC.map(s => s[0]).sort().join(), `${id} 只有这 5 个来源（${all.join()}）`);
  for (const [e] of SRC) { const L = minFloorLv(e)!, u = ENEMIES[e]!; ok(L !== undefined && 30 <= L + (u.tier === 'boss' ? CAP_GEAR : CAP_NORMAL) , `${id}×${e} 合法（drop-realign 规则按最低出现层目标等级：L${L}+${u.tier === 'boss' ? CAP_GEAR : CAP_NORMAL}；怪基础等级 ${u.level} 仅供参考）`); } }
ok(!Object.values(ENEMIES).some(u => u.setDrop?.some(x => Z.includes(x))), 'setDrop 不含祖玛件（大法老模板也剔除）');
// 可达：来源怪都在某层出现
for (const [e] of SRC) ok(FLOORS.some(f => f.spawns?.some(s => s.id === e)), `${e} 在地图中出现`);
// T5（26–30）头盔：法/道可穿祖玛头盔
for (const c of ['warrior', 'mage', 'taoist'] as const) { const w = new World(() => 0.5, 30, FLOORS, c); w.bag.push(w.makeItem('set_zuma_helm')); ok(w.equipItem(w.bag.length - 1) === null && w.equip.helmet?.item === 'set_zuma_helm', `${c} 30 级可穿祖玛头盔`);
  const lo = new World(() => 0.5, 29, FLOORS, c); lo.bag.push(lo.makeItem('set_zuma_helm')); ok(lo.equipItem(lo.bag.length - 1) === '需要等级 30', `${c} 29 级不能穿`); }
// 老存档：已有祖玛件读档保留
const w0 = new World(() => 0.5, 30, FLOORS, 'mage'); w0.bag.push(w0.makeItem('set_zuma_ring')); w0.equipItem(w0.bag.length - 1); const sv = JSON.parse(JSON.stringify(w0.toSave()));
const w1 = new World(() => 0.5, 30, FLOORS, 'mage', sv); ok(w1.equip.ring1?.item === 'set_zuma_ring', '老存档祖玛戒指保留');
console.log(fail ? `zuma-drops: ${fail}/${n} FAIL` : `zuma-drops: ${n} ok`); if (fail) (globalThis as any).process.exit(1);
