// feat/early-gear-3-5（docs/early-gear-3-5.md，G-1..G-15 推荐默认）：出生木剑、旧档补发、需求 3–5、1–9 档爆率 ×2
import { World, type SaveData } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { ITEMS } from '../src/data/items';
import { ENEMIES } from '../src/data/units';
import { REALIGN_PLAN } from '../src/data/drop-realign-table';
import { H_PLAN } from '../src/data/h-chain';
import { realignDen, REALIGN_BANDS, refreshInvItem } from '../src/data/drop-realign';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
// 1) 出生木剑：三职业、武器栏、绑定、不可卖、req 1、属性不变；不送布衣（G-13）
for (const cls of ['warrior', 'mage', 'taoist'] as const) {
  const w = new World(() => 0.5, 1, FLOORS, cls), wp = w.equip.weapon;
  ok(wp?.item === 'wood_sword', `${cls} 出生武器栏=木剑`);
  ok(wp?.bound === true && wp.req === 1 && ITEMS.wood_sword.req === 1, `${cls} 木剑绑定 req=1`);
  ok(JSON.stringify(wp?.stats) === JSON.stringify({ atk: 6, mag: 3, tao: 3 }), `${cls} 木剑属性 攻6 魔3 道3`);
  ok(!w.equip.armor && w.bag.length === 0, `${cls} 不送布衣、背包空`);
  ok(w.toSave().starterGiven === 1, `${cls} 新档写入 starterGiven`);
  // 卸下后卖：拒绝
  w.unequip('weapon'); const i = w.bag.findIndex(b => b.item === 'wood_sword'), g = w.gold;
  ok(i >= 0 && w.sellItem(i) === 0 && w.gold === g && w.bag[i]?.item === 'wood_sword', `${cls} 出生木剑不可出售`);
}
// 2) 旧档补发：武器栏空且无标记 → 补一次；有武器 → 不补但写标记；有标记 → 不再补（卸下/卖出后）
const base = new World(() => 0.5, 12, FLOORS, 'mage').toSave();
const old = clone(base) as SaveData; delete old.starterGiven; old.equip = {}; old.bag = [];
const w1 = new World(() => 0.5, 12, FLOORS, 'mage', clone(old));
ok(w1.equip.weapon?.item === 'wood_sword' && w1.equip.weapon.bound === true, '旧档武器栏空 → 补发木剑（不限等级）');
const s1 = w1.toSave(); ok(s1.starterGiven === 1, '补发后写标记');
const w2 = new World(() => 0.5, 12, FLOORS, 'mage', clone(s1)); ok(w2.equip.weapon?.uid === w1.equip.weapon?.uid, '再次读档不重复补');
w2.unequip('weapon'); const s2 = w2.toSave(); s2.bag = []; // 卸下后丢掉/卖出
const w3 = new World(() => 0.5, 12, FLOORS, 'mage', clone(s2));
ok(!w3.equip.weapon && !w3.bag.some(b => b.item === 'wood_sword'), '有标记：卸下/卖出后不重复补');
const withW = clone(old); withW.equip = { weapon: { ...base.equip.weapon!, item: 'iron_sword', name: '铁剑', req: 10, bound: false } };
const w4 = new World(() => 0.5, 12, FLOORS, 'mage', withW);
ok(w4.equip.weapon?.item === 'iron_sword' && w4.toSave().starterGiven === 1, '旧档已有武器：不补，写标记');
ok(w4.equip.weapon?.req === 5, `refreshInvItem 读档刷新铁剑需求 10→5（实际 ${w4.equip.weapon?.req}）`);
// 3) 需求等级（14 件）
const REQ: Record<string, number> = { h_leather_glove: 3, h_hex_ring: 3, h_glass_ring: 3, helmet: 4, h_steel_bracelet: 4, h_big_bracelet: 4, h_horn_ring: 4,
  iron_sword: 5, short_sword: 5, light_armor: 5, bone_helm: 5, h_black_crystal_necklace: 5, h_ebony_necklace: 5, h_yellow_crystal_necklace: 5 };
for (const [id, r] of Object.entries(REQ)) ok(ITEMS[id]?.req === r, `${ITEMS[id]?.name ?? id} 需求 ${r}（实际 ${ITEMS[id]?.req}）`);
// G-1 不纳入
for (const [id, r] of Object.entries({ bronze_axe: 13, magic_helm: 14, h_cloth_shoes: 15, bronze_sword: 5 })) ok(ITEMS[id]?.req === r, `${id} 需求不变 ${r}`);
for (const id of Object.keys(REQ)) { const it = { uid: 1, item: id, name: ITEMS[id].name, rarity: 'common', slot: ITEMS[id].slot, stats: {}, req: 13, price: 1 } as any; refreshInvItem(it); ok(it.req === REQ[id], `refreshInvItem ${id} → ${REQ[id]}`); }
// 4) 爆率：1–9 档 ×2，其它档不动
ok(JSON.stringify(REALIGN_BANDS[0]) === JSON.stringify([1, 9, 16, 2, 30, 4]), '1–9 档参数 ×2');
ok(JSON.stringify(REALIGN_BANDS[1]) === JSON.stringify([10, 19, 10, 5, 100, 12]), '10–19 档不动');
const den = (item: string, u: string) => { const d = ENEMIES[u]?.drops?.find(x => x.item === item); return d ? Math.round(1 / d.chance) : 0; };
// [物品, 怪, 旧分母, 新分母]
const DEN: [string, string, number, number][] = [
  ['wood_sword', 'hook_cat', 50, 25], ['bronze_sword', 'red_snake', 38, 19], ['iron_sword', 'red_snake', 70, 44], ['iron_sword', 'skeleton', 100, 60], ['iron_sword', 'skeleton_lord', 5, 2],
  ['helmet', 'tiger_snake', 90, 56], ['light_armor', 'red_snake', 70, 44], ['bone_helm', 'tree_demon', 24, 15], ['bone_helm', 'skeleton_lord', 12, 4],
  ['iron_ring', 'wolf_king', 8, 4], ['h_glass_ring', 'forest_yeti', 16, 8], ['h_horn_ring', 'orc', 16, 8], ['h_ebony_necklace', 'red_snake', 24, 8], ['h_yellow_crystal_necklace', 'skeleton_lord', 12, 4]];
for (const [it, u, o, nw] of DEN) ok(den(it, u) === nw && nw < o, `${it}×${u} 1/${o} → 1/${nw}（实际 1/${den(it, u)}）`);
ok(den('bone_helm', 'black_maggot') === 0, 'G-8 骷髅头盔×黑色恶蛆 已删');
ok(den('bronze_axe', 'red_snake') === 70, '青铜斧（13，不纳入）分母不动 1/70');
// 与曲线一致：官方 N 换算
for (const [req, boss, N, d] of [[5, false, 700, 44], [5, false, 1000, 60], [5, true, 3, 2], [5, true, 240, 15], [5, false, 300, 19]] as const) ok(realignDen(req, boss, N) === d, `realignDen(${req},${boss},${N})=${d}`);
// 新手怪原掉落不恢复（G-7）；G-15 木剑仍在 F0 掉落表
ok(!['scarecrow', 'deer'].some(u => den('cloth', u)), 'G-7 稻草人/鹿不恢复布衣掉落');
ok(den('wood_sword', 'hook_cat') === 25, 'G-15 木剑保留在 F0 掉落表');
ok(REALIGN_PLAN.wood_sword.length === 3 && Object.keys(H_PLAN).length > 0, '木剑掉落来源保留 3 个');
console.log(`early-gear: ${n - fail}/${n} ok`); if (fail) process.exit(1);
