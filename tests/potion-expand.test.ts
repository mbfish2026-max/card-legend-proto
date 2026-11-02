// feat/potion-expand 单测：药水表 / 旧 key 迁移 / 解包规则与上限 / 捆价 / 旧档兼容 / 3 格选择存取
declare const process: { exit(n: number): void };
import { POTIONS } from '../src/data/skills';
import { ITEMS } from '../src/data/items';
import { CONSUMABLE } from '../src/data/items-town';
import { BUNDLES, BUNDLE_N, POT_MAX, POT_SLOTS, bundlePrice, defaultSel, migratePots, normSel, potIndex, potShopRows, LEGACY_POT_KEYS } from '../src/data/potions';
import { World } from '../src/combat/World';
let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };
const inv = (item: string, qty?: number, uid = 900) => ({ uid, item, name: ITEMS[item]?.name ?? item, rarity: 'common', stats: {}, req: 1, price: 1, ...(qty ? { qty } : {}) }) as any;

console.log('药水表');
ok(POTIONS.length === 8, 'POTIONS 共 8 种');
ok(['hp_small', 'hp_mid', 'mp_small', 'mp_mid'].every((k, i) => POTIONS[i].item === k && POTIONS[i].key === String(i + 1)), '旧 4 种下标与 key 不动');
ok(POTIONS[0].hp === 120 && POTIONS[1].hp === 320 && POTIONS[2].mp === 90 && POTIONS[3].mp === 240 && POTIONS[0].price === 20 && POTIONS[1].price === 60, '旧 4 种数值不变');
const P = (k: string) => POTIONS[potIndex(k)];
ok(P('hp_big').hp === 560 && P('hp_big').price === 360 && P('hp_big').lv === 40, '强效金创药 HP560 360金 Lv40（第5轮调参）');
ok(P('mp_big').mp === 900 && P('mp_big').price === 180 && P('mp_big').lv === 40, '强效魔法药 MP900 180金 Lv40');
ok(P('sun').hp === 180 && P('sun').mp === 240 && P('sun').price === 300 && P('sun').lv === 40 && P('sun').instant, '太阳水 HP180+MP240 立刻 300金 Lv40');
ok(P('sun_big').hp === 300 && P('sun_big').mp === 480 && P('sun_big').price === 600 && P('sun_big').lv === 40 && P('sun_big').bundleOnly, '强效太阳水 HP300+MP480 600金 Lv40 只卖捆');
ok(POTIONS.every((p, i) => ITEMS[p.item]?.potion === i), 'ITEMS.potion 下标与 POTIONS 对齐');
ok(!('hp_strong' in ITEMS) && !('mp_strong' in ITEMS) && !('sun_water' in ITEMS), '旧 key 不再是物品（不能并存两种强效金创药）');
ok(Object.values(ITEMS).filter(d => d.name === '强效金创药').length === 1 && Object.values(ITEMS).filter(d => d.name === '太阳水').length === 1, '「强效金创药」「太阳水」各只有一个物品');
ok(!Object.keys(CONSUMABLE).some(k => k in LEGACY_POT_KEYS), 'CONSUMABLE 不再含旧药');
ok(Object.values(BUNDLES).every(b => !b.name.startsWith('超级') || /_big$/.test(b.pot)) && BUNDLES.bundle_hp_big.name === '超级金创药' && BUNDLES.bundle_mp_big.name === '超级魔法药', '「超级」只用于强效捆');
ok(Object.keys(BUNDLES).length === 8 && Object.keys(BUNDLES).every(id => ITEMS[id]?.bundle?.n === 6 && ITEMS[id].icon === `assets/items/${id}.png`), '8 种捆入 ITEMS，每捆 6 瓶，图标 bundle_*');
ok(['hp_big', 'mp_big', 'sun', 'sun_big'].every(k => ITEMS[k].icon === `assets/items/pot_${k}.png`), '新散装图标 pot_*');

console.log('捆价 = 单价×6');
ok(Object.keys(BUNDLES).every(id => bundlePrice(id) === P(BUNDLES[id].pot).price * 6), '全部捆价 = 单价×6');
ok(bundlePrice('bundle_hp_small') === 120 && bundlePrice('bundle_sun_big') === 3600, '小红捆 120 / 强效太阳水包 3600');
ok(Object.keys(BUNDLES).every(id => ITEMS[id].price === bundlePrice(id) / 2), '回收价 = 捆价/2');

console.log('药店列表');
const r1 = potShopRows(1), r39 = potShopRows(39), r40 = potShopRows(40);
ok(!r1.some(r => r.kind === 'pot' && r.id === 'sun_big'), '强效太阳水不卖散装');
ok(r1.filter(r => !r.locked).map(r => r.id).sort().join() === ['hp_small', 'hp_mid', 'mp_small', 'mp_mid', 'bundle_hp_small', 'bundle_hp_mid', 'bundle_mp_small', 'bundle_mp_mid'].sort().join(), 'Lv1 只能买小/中散装与捆');
ok(r39.filter(r => r.locked).length === 7 && r39.filter(r => !r.locked).length === 8, 'Lv39 强效/太阳水全部锁定');
ok(r40.every(r => !r.locked) && r40.length === 15, 'Lv40 全部解锁（7 散装 + 8 捆）');

console.log('旧 key 迁移');
const old = { pots: [3, 1, 4, 1], bag: [inv('hp_strong', 5), inv('bone'), inv('mp_strong'), inv('sun_water', 2)], storage: [inv('hp_strong', 7)], companion: { bag: [inv('hp_strong', 3), inv('sun_water')] } };
const m = migratePots(old as any, { hp_big: '强效金创药', sun: '太阳水' });
ok(m.pots.length === 8 && m.pots.slice(0, 4).join() === '3,1,4,1', '旧档 pots 补到 8，原 4 项不变');
ok(m.pots[potIndex('hp_big')] === 12 && m.pots[potIndex('mp_big')] === 1 && m.pots[potIndex('sun')] === 2 && m.pots[potIndex('sun_big')] === 0, 'hp_strong(背包5+仓库7)→hp_big 12；mp_strong→mp_big 1；sun_water→sun 2');
ok(m.bag!.length === 1 && m.bag![0].item === 'bone' && m.storage!.length === 0, '背包/仓库旧药移除，其它物品保留');
ok(m.companion!.bag.map((b: any) => b.item).join() === 'hp_big,sun' && m.companion!.bag[0].qty === 3 && m.companion!.bag[0].name === '强效金创药', '英雄包裹旧 key 改名为新 key（数量保留）');
ok(old.bag[0].item === 'hp_strong' && old.pots.length === 4, '迁移不改入参');
const cap = migratePots({ pots: [0, 0, 0, 0, 995], bag: [inv('hp_strong', 10)] } as any);
ok(cap.pots[4] === POT_MAX && cap.bag![0].item === 'hp_big' && cap.bag![0].qty === 6, '超过 999 的余量以新 key 留在背包，不吞');
ok(migratePots({ pots: [1, 2, 3, 4, 5, 6, 7, 8] } as any).pots.join() === '1,2,3,4,5,6,7,8', '新档原样');
ok(migratePots({ pots: [2, 'x', -3, null] } as any).pots.join() === '2,0,0,0,0,0,0,0', '脏数据归 0');

console.log('World 读旧档');
const w0 = new World(() => 0.5, 30, undefined, 'warrior'); const sv: any = w0.toSave();
sv.pots = [9, 8, 7, 6]; delete sv.potSel; sv.bag = [inv('hp_strong', 2, 5001), inv('sun_water', 1, 5002)];
const w1 = new World(() => 0.5, 30, undefined, 'warrior', sv);
ok(w1.pots.join() === '9,8,7,6,2,0,1,0', '旧档读入：pots 8 项，旧药并入');
ok(!w1.bag.some(b => b.item in LEGACY_POT_KEYS), '背包里没有旧 key');
ok(w1.potSel.join() === 'hp_small,mp_small,sun', '旧档默认选各类最低/已有');
const w2 = new World(() => 0.5, 30, undefined, 'warrior', { ...sv, pots: [0, 3, 0, 0, 0, 0, 0, 0], bag: [] });
ok(w2.potSel.join() === 'hp_mid,mp_small,sun', '默认选当前已有的最低级');

console.log('3 格选择存取');
ok(POT_SLOTS.length === 3 && POT_SLOTS.map(s => s.id).join() === 'hp,mp,sun', '只有 3 格：红/蓝/太阳水');
ok(defaultSel(Array(8).fill(0)).join() === 'hp_small,mp_small,sun', 'defaultSel 全空 = 最低级');
ok(normSel(['hp_big', 'sun', 'nope'], Array(8).fill(0)).join() === 'hp_big,mp_small,sun', 'normSel 跨类/非法 → 默认');
ok(w1.setSelectedPotion(0, 'hp_big') && w1.getSelectedPotion(0) === 'hp_big' && w1.selectedPotionIndex(0) === 4, 'set/get 红格 = 强效');
ok(!w1.setSelectedPotion(0, 'mp_big') && !w1.setSelectedPotion(5, 'hp_small') && w1.getSelectedPotion(0) === 'hp_big', '跨类/越界拒绝');
ok(w1.setSelectedPotion(2, 'sun_big') && w1.getSelectedPotion(2) === 'sun_big', '太阳水格换强效太阳水');
const w3 = new World(() => 0.5, 30, undefined, 'warrior', w1.toSave());
ok(w3.potSel.join() === 'hp_big,mp_small,sun_big' && w3.pots.join() === w1.pots.join(), '选择随存档往返');

console.log('买药 / 买捆 / 解包');
const w = new World(() => 0.5, 10, undefined, 'warrior'); w.gold = 100000;
ok(w.buyPotion(potIndex('hp_big')) === '需要等级 40' && w.buyBundle('bundle_hp_big') === '需要等级 40', 'Lv10 不能买强效（散装/捆）');
w.level = 40; ok(w.buyPotion(potIndex('sun_big')) === '药店只卖捆', '强效太阳水散装不卖');
const g0 = w.gold; ok(w.buyBundle('bundle_sun_big') === null && w.gold === g0 - 3600, '买强效太阳水包扣 3600');
ok(w.buyBundle('bundle_sun_big') === null && w.bag.filter(b => b.item === 'bundle_sun_big').length === 1 && w.bag.find(b => b.item === 'bundle_sun_big')!.qty === 2, '同种捆叠在 1 格');
const bi = w.bag.findIndex(b => b.item === 'bundle_sun_big'); const r = w.unbundle(bi);
ok(r.ok && w.pots[7] === 6 && w.bag[bi].qty === 1 && r.msg.includes('6 瓶'), '解开 1 捆：+6 瓶，捆 -1');
ok(w.unbundle(bi).ok && w.pots[7] === 12 && !w.bag.some(b => b.item === 'bundle_sun_big'), '最后 1 捆解开后格子消失');
w.buyBundle('bundle_hp_small'); const hi = w.bag.findIndex(b => b.item === 'bundle_hp_small'); w.pots[0] = 994;
const rf = w.unbundle(hi); ok(!rf.ok && rf.msg.includes('药水已满') && w.pots[0] === 994 && w.bag[hi]?.item === 'bundle_hp_small', '超过 999 不让拆也不吞捆');
w.pots[0] = 993; ok(w.unbundle(hi).ok && w.pots[0] === 999, '恰好 999 允许');
w.pots[0] = 999; ok(w.buyPotion(0) === '药水已满', '散装满 999 不让买');
ok(!w.unbundle(0).ok || w.bag[0]?.item.startsWith('bundle'), '非捆不能解');
const st = w.bag.find(b => b.item === 'bundle_hp_mid') ?? (w.buyBundle('bundle_hp_mid'), w.bag.find(b => b.item === 'bundle_hp_mid')!); st.qty = 999; const n0 = w.bag.length;
ok(w.buyBundle('bundle_hp_mid') === null && w.bag.length === n0 + 1, '单格 999 满了另起一格');
const si = w.bag.findIndex(b => b.item === 'bundle_hp_mid'), gs = w.gold; w.sellItem(si); ok(w.bag[si].qty === 998 && w.gold === gs + 180, '卖捆一次卖 1 捆，回收价=捆价/2');
w.bag.push(inv('hp_big', 3, 7777)); const before = w.pots[4]; const am = w.absorbPotionItem(w.bag.length - 1); ok(w.pots[4] === before + 3 && am.includes('放入药水栏'), '背包散装药双击并入药水栏');

console.log(`\npotion-expand: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
