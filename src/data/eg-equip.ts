// P2 eg-sets：40–50 级 40 件装备（docs/equip-3050-plan.md §3，数值为该表「本作属性 [适配]」列，来源代号见该文 来源索引）。
// 不依赖 items.ts（避免循环）；items.ts 合并 EG_EQUIP，equip-official 的 EQUIP_META 合并 EG_META。图标 = 美术 E4（id 与本表一一对应，无需映射）。
import type { ItemDef } from '../combat/types';
import type { Cls, EquipMeta, Need } from './equip-official';
type S = Partial<Record<'atk' | 'mag' | 'tao' | 'def' | 'mdef' | 'hp', number>>;
type Row = [id: string, name: string, slot: NonNullable<ItemDef['slot']>, cls: Cls | null, req: number, stats: S, need: Need | null, src: string, price: number];
const W: Cls = 'warrior', M: Cls = 'mage', T: Cls = 'taoist';
const L = (v: number): Need => ({ kind: 'level', v }), A = (v: number): Need => ({ kind: 'atk', v }), G = (v: number): Need => ({ kind: 'mag', v }), D = (v: number): Need => ({ kind: 'tao', v });
export const EG_ROWS: Row[] = [
  ['nuzhan', '怒斩', 'weapon', W, 40, { atk: 38 }, A(46), 'C21', 1200],
  ['longya', '龙牙', 'weapon', M, 40, { atk: 28, mag: 18 }, G(28), 'C21', 1200],
  ['xiaoyao_fan', '逍遥扇', 'weapon', T, 35, { atk: 18, tao: 28 }, L(35), 'C21', 1200],
  ['shihun_staff', '嗜魂法杖', 'weapon', M, 35, { atk: 19, mag: 20 }, L(35), 'C21', 1500],
  ['mingyun_blade', '命运之刃', 'weapon', W, 35, { atk: 28 }, L(35), 'C21', 800],
  ['bazhe_blade', '霸者之刃', 'weapon', null, 40, { atk: 38, mag: 18, tao: 22 }, L(40), 'T1(C)', 1500],
  ['kaitian', '开天', 'weapon', W, 47, { atk: 46 }, null, 'A1', 2000],
  ['zhentian', '镇天', 'weapon', M, 46, { atk: 32, mag: 34 }, null, 'A1', 2000],
  ['xuantian', '玄天', 'weapon', T, 46, { atk: 39, tao: 34 }, null, 'A1', 2000],
  ['tianmo_armor', '天魔神甲', 'armor', W, 40, { def: 26, mdef: 17, atk: 3, hp: 208 }, L(40), 'T1(C)', 1000],
  ['fashen_cape', '法神披风', 'armor', M, 40, { def: 20, mdef: 15, mag: 14, hp: 160 }, L(40), 'T1(C)', 1000],
  ['tianzun_robe', '天尊道袍', 'armor', T, 40, { def: 20, mdef: 15, tao: 14, hp: 160 }, L(40), 'T1(C)', 1000],
  ['leiting_armor', '雷霆战甲', 'armor', W, 44, { def: 26, mdef: 18, atk: 4, hp: 208 }, L(42), 'T1(C)', 1200],
  ['lieyan_robe', '烈焰魔衣', 'armor', M, 44, { def: 26, mdef: 18, mag: 16, hp: 208 }, L(42), 'T1(C)', 1200],
  ['guangmang_robe', '光芒道袍', 'armor', T, 44, { def: 26, mdef: 18, tao: 16, hp: 208 }, L(42), 'T1(C)', 1200],
  ['fengtian_armor', '凤天魔甲', 'armor', null, 48, { def: 30, mdef: 24, atk: 6, mag: 16, tao: 16, hp: 240 }, L(45), 'T1+A2(C)', 1800],
  ['shenglong_helm', '圣龙盔', 'helmet', W, 44, { def: 17, atk: 2, hp: 136 }, L(42), 'T1(C)', 800],
  ['molong_helm', '魔龙盔', 'helmet', M, 44, { def: 17, mag: 4, hp: 136 }, L(42), 'T1(C)', 800],
  ['tianlong_helm', '天龙盔', 'helmet', T, 44, { def: 17, tao: 4, hp: 136 }, L(42), 'T1(C)', 800],
  ['leiting_necklace', '雷霆项链', 'necklace', W, 45, { atk: 10 }, A(45), 'B4', 700],
  ['leiting_bracelet', '雷霆护腕', 'bracelet', W, 45, { atk: 5, def: 3, mdef: 3, hp: 24 }, A(45), 'B4', 700],
  ['leiting_ring', '雷霆战戒', 'ring', W, 45, { atk: 8 }, A(45), 'B4', 700],
  ['leiting_boots', '雷霆战靴', 'boots', W, 45, { atk: 2, def: 5, hp: 40 }, A(45), 'B4', 700],
  ['lieyan_necklace', '烈焰项链', 'necklace', M, 45, { mag: 20 }, G(30), 'B4', 700],
  ['lieyan_bracelet', '烈焰护腕', 'bracelet', M, 45, { mag: 12, def: 3, hp: 24 }, G(30), 'B4', 700],
  ['lieyan_ring', '烈焰魔戒', 'ring', M, 45, { mag: 16, def: 2, hp: 16 }, G(30), 'B4', 700],
  ['lieyan_boots', '烈焰魔靴', 'boots', M, 45, { mag: 4, def: 5, hp: 40 }, G(30), 'B4', 700],
  ['guangmang_necklace', '光芒项链', 'necklace', T, 45, { tao: 20 }, D(28), 'B4', 700],
  ['guangmang_bracelet', '光芒护腕', 'bracelet', T, 45, { tao: 12, def: 6, hp: 48 }, D(28), 'B4', 700],
  ['guangmang_ring', '光芒道戒', 'ring', T, 45, { tao: 18, def: 3, hp: 24 }, D(28), 'B4', 700],
  ['guangmang_boots', '光芒道靴', 'boots', T, 45, { tao: 4, def: 6, hp: 48 }, D(28), 'B4', 700],
  ['zhanshen_necklace', '战神项链', 'necklace', W, 48, { atk: 11 }, A(54), 'T1(C)', 900],
  ['zhanshen_bracelet', '战神手镯', 'bracelet', W, 48, { atk: 6, def: 2, hp: 16 }, A(54), 'T1(C)', 900],
  ['zhanshen_ring', '战神戒指', 'ring', W, 48, { atk: 9, mdef: 2 }, A(54), 'T1(C)', 900],
  ['shengmo_necklace', '圣魔项链', 'necklace', M, 48, { mag: 18 }, G(32), 'T1(C)', 900],
  ['shengmo_bracelet', '圣魔手镯', 'bracelet', M, 48, { mag: 12, def: 3, mdef: 3, hp: 24 }, G(32), 'T1(C)', 900],
  ['shengmo_ring', '圣魔戒指', 'ring', M, 48, { mag: 20, mdef: 2 }, G(32), 'T1(C)', 900],
  ['zhenhun_necklace', '真魂项链', 'necklace', T, 48, { tao: 18 }, D(30), 'T1(C)', 900],
  ['zhenhun_bracelet', '真魂手镯', 'bracelet', T, 48, { tao: 12 }, D(30), 'T1(C)', 900],
  ['zhenhun_ring', '真魂戒指', 'ring', T, 48, { tao: 22, mdef: 2 }, D(30), 'T1(C)', 900],
];
export const EG_IDS = EG_ROWS.map(r => r[0]);
/** 美术 E4 图标 id → 装备表 id 对照：40/40 同名（不需映射）。若后续美术交付改名，在此登记 { 美术id: 装备id } */
export const EG_ICON_MAP: Record<string, string> = Object.fromEntries(EG_IDS.map(id => [id, id]));
const iconOf = (id: string) => `assets/items/eq_${Object.entries(EG_ICON_MAP).find(([, v]) => v === id)![0]}.png`;
export const EG_EQUIP: Record<string, ItemDef> = Object.fromEntries(EG_ROWS.map(([id, name, slot, cls, req, stats, , , price]) =>
  [id, { id, name, icon: iconOf(id), slot, equip: { ...stats }, req, price, ...(cls ? { cls: [cls] } : {}) } as ItemDef]));
export const EG_META: Record<string, EquipMeta> = Object.fromEntries(EG_ROWS.map(([id, name, , cls, , , need, src]) =>
  [id, { official: name, cq: 0, need: need ?? undefined, cls: cls ? [cls] : undefined, tier: 'eg40', origin: 'eg', note: `来源 ${src}（docs/equip-3050-plan.md 来源索引）；本作 req/属性 [适配]` } as EquipMeta]));
