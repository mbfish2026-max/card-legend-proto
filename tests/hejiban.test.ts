import { World } from '../src/combat/World';
import { HEART_ITEM, HEART_STORE_MAX, RAGE_MAX, canUnleash, unleash, feedHeart, heartFeedValue } from '../src/data/companion';
import { HERO } from '../src/data/units';
import { newCompanion, companionEquip, companionUnequip, companionStats, COMPANION_UNIT_ID, migrateCompanion } from '../src/data/companion';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const W = (lv = 40, cls: any = 'warrior', save?: any) => new World(seeded(1), lv, [{ name: '测试层', spawns: [] }], cls, save);
{ // #1 英雄数据模型
  ok(COMPANION_UNIT_ID !== HERO.id, '英雄 id 不与主角 hero 冲突');
  const w = W(); ok(w.companion === null && w.toSave().companion === null, '新档/旧档默认无英雄');
  const old = w.toSave(); delete (old as any).companion; ok(W(40, 'warrior', old).companion === null, '旧存档（无 companion 字段）可读');
  w.companion = newCompanion('mage', '小法'); w.bag.push(w.makeItem('wood_sword'));
  const it = w.bag[w.bag.length - 1]; ok(w.giveToCompanion(w.bag.length - 1) === null && w.companion.bag.includes(it), '主角包裹 → 英雄包裹');
  ok(companionEquip(w.companion, 0) === null && w.companion.equip.weapon === it, '英雄从英雄包裹穿装');
  ok(companionStats(w.companion).atk > 0, '英雄属性含装备');
  ok(companionUnequip(w.companion, 'weapon') === null && w.takeFromCompanion(0) === null && w.bag.includes(it), '卸下并取回主角包裹');
  const s = w.toSave(); const w2 = W(40, 'warrior', s); ok(w2.companion?.name === '小法' && w2.companion.cls === 'mage' && w2.companion.mode === 'follow', '英雄存取档');
  ok(migrateCompanion({ cls: 'taoist', name: '道' } as any)!.rage === 0, '缺字段补默认');
  w2.companion!.out = true; w2.gainExp(100000); ok(w2.companion!.exp > 0 || w2.companion!.level > 1, '召唤中的英雄分得经验');
}
console.log(`合击版测试全部通过（${pass}）`);
{ // #2 英雄获取
  const w = W(39); ok(w.recruitCompanion('taoist', '阿道')?.includes('40') === true && !w.companion, '40 级前不可领');
  w.level = 40; const g = w.gold; ok(w.recruitCompanion('taoist', '阿道') === null && w.companion?.cls === 'taoist' && w.gold === g, '40 级免费领取，职业三选一');
  ok(w.recruitCompanion('mage', 'x') === '已有英雄', '只能领一次');
  ok(W(40, 'warrior', w.toSave()).companion?.name === '阿道', '领取后存档保留');
}
console.log(`合击版 #2 通过（${pass}）`);
{ // #5 怒槽 + 火龙之心
  const w = W(40); w.recruitCompanion('mage', '法'); const c = w.companion!;
  ok(w.feedCompanionHeart(0) === '英雄未装备火龙之心', '无火龙之心不可补充');
  c.equip.heart = { uid: 9e6, item: HEART_ITEM, name: '火龙之心', rarity: 'legendary' as any, stats: {}, req: 0, price: 0 };
  w.bag.push({ uid: 9e6 + 1, item: 'hl_yuanshen', name: '元神丹', rarity: 'common' as any, stats: {}, req: 0, price: 0 });
  const n = w.bag.length; ok(w.feedCompanionHeart(n - 1) === null && c.heartStore === 5000 && w.bag.length === n - 1, '元神丹补充并消耗');
  ok(feedHeart(c, 'hl_yuanshen', 99) > 0 && c.heartStore === HEART_STORE_MAX, '储量上限 30000');
  ok(heartFeedValue('meat') > 0 && heartFeedValue('hp_small') === 0, '肉可补，药不可补');
  ok(!canUnleash(c) && (c.rage = RAGE_MAX, canUnleash(c)) && unleash(c) && c.rage === 0, '满槽可爆发（占位清槽）');
  c.rage = 50; const w2 = W(40, 'warrior', w.toSave()); ok(w2.companion!.heartStore === HEART_STORE_MAX && w2.companion!.rage === 50, '怒槽/储量存档');
}
console.log(`合击版 #5 通过（${pass}）`);
{ // #7 龙人合书
  const w = W(45, 'warrior'); w.recruitCompanion('mage', '法'); const c = w.companion!; w.enterTown('bairimen', true);
  const mk = (id: string, qty = 1) => ({ uid: Math.random(), item: id, name: id, rarity: 'common' as any, stats: {}, req: 0, price: 0, qty });
  w.bag.push(mk('book_page', 20), mk('gold_bar'), mk('gold_bar'));
  ok(w.craftBrmBook() === null && w.craftBrmBook() === null && w.countItem('brm_book') === 2 && w.countItem('book_page') === 0, '20 书页合 2 本白日门书');
  ok(w.learnCombo()?.includes('43') === true, '英雄 43 级前不可学');
  c.level = 43; ok(w.learnCombo() === null && c.combo!.includes('leiting') && c.equip.heart?.item === 'fire_heart' && w.countItem('gold_bar') === 0, '战+法学会雷霆一击并获得火龙之心');
  ok(w.learnCombo()?.includes('已学会') === true, '不可重复学');
  ok(W(45, 'warrior', w.toSave()).companion!.combo!.includes('leiting'), '合击存档');
}
console.log(`合击版 #7 通过（${pass}）`);
