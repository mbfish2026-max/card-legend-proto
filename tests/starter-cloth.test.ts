// feat/starter-cloth（docs/gear-tiers.md D1–D9）：出生布衣、starterClothGiven、不可卖提示、gear-tiers P1–P3 需求/爆率/腰带掉落
import { World, type SaveData } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { ITEMS } from '../src/data/items';
import { ENEMIES } from '../src/data/units';
import { boundSellMsg } from '../src/data/early-gear';
import { minFloorLv, CAP_BOSS, CAP_GEAR, CAP_NORMAL } from '../src/data/drop-plan';
import { BELT_PLAN } from '../src/data/belts';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
// 1) 新档三职业：armor=布衣、绑定、req 1、写标记；卸下后不可卖且提示正确
for (const cls of ['warrior', 'mage', 'taoist'] as const) {
  const w = new World(() => 0.5, 1, FLOORS, cls), a = w.equip.armor;
  ok(a?.item === 'cloth' && a.bound === true && a.req === 1 && ITEMS.cloth.req === 1, `${cls} 出生布衣 绑定 req=1`);
  ok(w.toSave().starterClothGiven === 1 && w.toSave().starterGiven === 1, `${cls} 写 starterClothGiven/starterGiven`);
  w.unequip('armor'); const i = w.bag.findIndex(b => b.item === 'cloth'), g = w.gold;
  ok(i >= 0 && w.sellItem(i) === 0 && w.gold === g && w.bag[i]?.item === 'cloth', `${cls} 布衣不可出售`);
  ok(boundSellMsg(w.bag[i]) === '出生布衣已绑定，不可出售', `${cls} 不可卖提示`);
}
// 2) 旧档：无标记+护甲栏空 → 补一次；已有 starterGiven 也补；有护甲不覆盖；有标记不再补
const base = new World(() => 0.5, 12, FLOORS, 'mage').toSave();
const old = clone(base) as SaveData; delete old.starterClothGiven; delete old.equip.armor; old.bag = [];
ok(old.starterGiven === 1, '前置：旧档有 starterGiven');
const w1 = new World(() => 0.5, 12, FLOORS, 'mage', clone(old));
ok(w1.equip.armor?.item === 'cloth' && w1.equip.armor.bound === true, '旧档护甲栏空 → 补发布衣');
const s1 = w1.toSave(); ok(s1.starterClothGiven === 1, '补发后写标记');
const w2 = new World(() => 0.5, 12, FLOORS, 'mage', clone(s1)); ok(w2.equip.armor?.uid === w1.equip.armor?.uid, '再次读档不重复补');
w2.unequip('armor'); const s2 = w2.toSave(); s2.bag = [];
const w3 = new World(() => 0.5, 12, FLOORS, 'mage', clone(s2)); ok(!w3.equip.armor && !w3.bag.some(b => b.item === 'cloth'), '有标记：卸下丢掉后不再补');
const o2 = clone(old); const la = new World(() => 0.5, 12, FLOORS, 'mage').makeItem('light_armor'); o2.equip.armor = la;
const w4 = new World(() => 0.5, 12, FLOORS, 'mage', clone(o2));
ok(w4.equip.armor?.item === 'light_armor' && !w4.bag.some(b => b.item === 'cloth') && w4.toSave().starterClothGiven === 1, '旧档已有护甲：不覆盖、不进包、写标记');
// 3) D3 新需求
const REQ: Record<string, number> = { cloth: 1, iron_sword: 11, light_armor: 11, h_black_crystal_necklace: 11, h_ebony_necklace: 11, h_yellow_crystal_necklace: 11,
  h_big_bracelet: 9, h_horn_ring: 9, h_hex_ring: 9, h_glass_ring: 9, haihun: 11, banyue: 11, magic_staff: 25, tao_sword: 25, guyu: 30,
  magic_helm: 11, tao_helm: 20, h_cloth_shoes: 11, h_deer_boots: 20, h_silk_boots: 25 };
for (const [id, r] of Object.entries(REQ)) ok(ITEMS[id]?.req === r, `${id} req=${r}（实际 ${ITEMS[id]?.req}）`);
// 4) 爆率：T2 回退件按曲线 [10,19] cap=5 flo=100 ×1；紫绸靴 1/30；骨玉无触龙神；龙纹仍有触龙神
const den = (e: string, it: string) => { const d = ENEMIES[e]?.drops?.find(x => x.item === it); return d ? Math.round(1 / d.chance) : 0; };
for (const [e, d] of [['red_snake', 70], ['tiger_snake', 90], ['skeleton', 100], ['skeleton_lord', 5]] as const) { ok(den(e, 'iron_sword') === d, `铁剑×${e} 1/${d}`); ok(den(e, 'light_armor') === d, `轻盔甲×${e} 1/${d}`); }
for (const it of ['h_black_crystal_necklace', 'h_ebony_necklace', 'h_yellow_crystal_necklace']) ok(den('red_snake', it) === 24 && den('skeleton_lord', it) === 12, `${it} 1/24、BOSS 1/12`);
for (const it of ['h_big_bracelet', 'h_horn_ring', 'h_hex_ring', 'h_glass_ring']) ok(den('orc', it) === 16 && den('skeleton_lord', it) === 8 && !den('forest_yeti', it), `${it} 1/16、BOSS 1/8、雪人不掉`);
ok(Object.values(ENEMIES).every(u => !(u.drops ?? []).some(d => d.item === 'h_silk_boots') || (u.drops ?? []).filter(d => d.item === 'h_silk_boots').every(d => Math.round(1 / d.chance) === 30)), '紫绸靴 1/30');
ok(!den('boss_chulong', 'guyu') && den('boss_chulong', 'longwen') === 200, '骨玉删触龙神源；龙纹保留触龙神 1/200');
// 5) 腰带：BELT_PLAN 全部挂上
for (const [b, src] of Object.entries(BELT_PLAN)) for (const [e, d] of src) ok(den(e, b) === d, `${b}×${e} 1/${d}`);
ok(!Object.values(ENEMIES).some(u => (u as any).setDrop?.some((x: string) => /zuma/.test(x))), 'D8：祖玛件不走 setDrop（zuma-drops 已推翻 E5 改普通掉落，见 zuma-drops.test）');
// 6) 所有调整件来源合法：req ≤ 最低出现层目标等级 + 6/8
const adj = [...Object.keys(REQ).filter(i => i !== 'cloth'), ...Object.keys(BELT_PLAN)];
for (const it of adj) for (const [e, u] of Object.entries(ENEMIES)) { if (!(u.drops ?? []).some(d => d.item === it)) continue; const L = minFloorLv(e); if (L === undefined) continue;
  const cap = u.tier !== 'boss' ? CAP_NORMAL : ITEMS[it]!.slot === 'weapon' ? CAP_BOSS : CAP_GEAR; ok((ITEMS[it]!.req ?? 0) <= L + cap, `${it}×${e} 合法（req ${ITEMS[it]!.req} ≤ ${L}+${cap}）`); }
console.log(fail ? `starter-cloth: ${fail}/${n} FAIL` : `starter-cloth: ${n} ok`); if (fail) (globalThis as any).process.exit(1);
