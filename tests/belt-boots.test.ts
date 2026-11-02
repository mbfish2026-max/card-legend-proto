// 阶段2：腰带 7 条数据 + 靴子/腰带独立栏 + 旧存档迁移（不丢装备）
import { World, migrateEquip } from '../src/combat/World';
import { ITEMS, EQUIP_SLOTS, EQUIP_SLOT_NAMES } from '../src/data/items';
import { BELT_ITEMS } from '../src/data/belts';
import { SETS } from '../src/data/items';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
const B = Object.values(BELT_ITEMS);
ok(B.length === 7, '腰带 7 条');
const want: Record<string, number> = { belt_hide: 15, belt_iron: 22, belt_bronze: 30, belt_steel: 35, belt_leiting: 45, belt_lieyan: 45, belt_guangmang: 45 };
for (const [id, r] of Object.entries(want)) ok(ITEMS[id]?.req === r && ITEMS[id]?.slot === 'belt', `${id} 需求 ${r}、部位 belt`);
ok(B.every(b => !b.set), '腰带不计套装（无 set）');
ok(Object.values(SETS).every((s: any) => !s.pieces?.some((p: string) => p.startsWith('belt_'))), '套装件表不含腰带');
ok(EQUIP_SLOTS.includes('belt') && EQUIP_SLOTS.includes('boots') && EQUIP_SLOT_NAMES.belt === '腰带', '穿戴位含 boots/belt');
// 旧档：靴子误占衣服位 → 迁到 boots
const boot = { uid: 1, item: 'h_cloth_shoes', name: '布鞋', rarity: 'common', slot: 'boots', stats: { def: 5 }, req: 15, price: 20 } as any;
const arm = { uid: 2, item: 'armor', name: '衣', rarity: 'common', slot: 'armor', stats: { def: 3 }, req: 1, price: 10 } as any;
let e: any = migrateEquip({ equip: { armor: boot } as any, eqV: 2 });
ok(e.boots?.uid === 1 && !e.armor, '衣服位的靴子迁到 boots');
e = migrateEquip({ equip: { armor: boot, boots: { ...boot, uid: 3 } } as any, eqV: 2 });
ok(e.armor?.uid === 1 && e.boots?.uid === 3, 'boots 已占用时原样保留，不丢');
e = migrateEquip({ equip: { armor: arm, boots: boot } as any, eqV: 2 });
ok(e.armor?.uid === 2 && e.boots?.uid === 1, '正常存档不变');
e = migrateEquip({ equip: { ring: arm } as any, eqV: 1 });
ok(e.ring1?.uid === 2, '旧戒指迁移仍有效');
// 腰带可穿戴、可卸下
const w = new World(() => 0.5, 50, undefined, 'warrior');
const it = { uid: 99, item: 'belt_hide', name: '兽皮腰带', rarity: 'common', slot: 'belt', stats: { def: 4, hp: 70 }, req: 15, price: 30 } as any;
w.bag.push(it); const hp0 = w.stats().hp; w.equipItem(w.bag.length - 1);
if (w.equip.belt) { ok(w.stats().hp === hp0 + 70, '腰带生命计入'); w.unequip('belt'); ok(!w.equip.belt && w.bag.some(b => b.uid === 99), '卸下回包'); }
else ok(false, '腰带穿戴失败');
console.log(fail ? `belt-boots: ${fail}/${n} FAIL` : `belt-boots: ${n} ok`); if (fail) (globalThis as any).process.exit(1);
