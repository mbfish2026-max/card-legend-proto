// 官方装备表 v1 单测：字段完整 / id 唯一 / 旧 id 保留 / 分层映射 / 文档一致 / 套装计件 / 职业限制
declare const process: { exit(c: number): never };
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
import { ITEMS, SETS } from '../src/data/items';
import { EQUIP_META, NEW_EQUIP, LEGACY_EQUIP_IDS, ALL_CLS } from '../src/data/equip-official';
import { renderEquipTable, equipIds } from '../src/data/equipTableDoc';
import { NAME_TO_ITEM } from '../src/data/drops';
import { resolveSlot, EQUIP_CLASSES } from '../src/data/equipLayers';
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';

let fails = 0;
const ok = (c: unknown, m: string) => { if (c) console.log('  ✓', m); else { fails++; console.log('  ✗', m); } };

const ids = equipIds();
ok(ids.length >= 40, `装备总数 ≥40（${ids.length}）`);
ok(ids.every(id => ITEMS[id].slot && typeof ITEMS[id].req === 'number' && ITEMS[id].req! >= 1), '每件装备有 slot 与 req');
ok(ids.every(id => EQUIP_META[id]), '每件装备有官方盘点条目（官方名/自创）');
ok(ids.every(id => !ITEMS[id].cls || (ITEMS[id].cls!.length > 0 && ITEMS[id].cls!.every(c => ALL_CLS.includes(c)))), '职业字段合法（空=通用）');
ok(Object.values(ITEMS).every(d => ITEMS[d.id] === d), 'ITEMS 键与 id 一致（id 唯一）');
ok(Object.keys(NEW_EQUIP).every(id => !LEGACY_EQUIP_IDS.includes(id)), '新增 id 不与存量冲突');
ok(Object.values(NEW_EQUIP).every(d => d.equip && Object.keys(d.equip).length > 0 && d.price! > 0), '新增件有属性与售价');
ok(Object.keys(NEW_EQUIP).every(id => EQUIP_META[id].cq > 0), '新增件均有官方来源 id');
// 旧 id 快照（R18 存量 52 件，旧存档可能出现）
const SNAP = 'wood_sword iron_sword magic_staff tao_sword dragon_sword short_sword bronze_sword dagger ebony_sword bronze_axe bahuang banyue haihun lingfeng xiangmo yanyue xiuluo zhanma pohun ningshuang lianyu jingzhongyue wujigun longwen caijue guyu cloth light_armor armor magic_robe soul_robe war_armor demon_robe ghost_robe helmet magic_helm tao_helm bone_helm gold_ring pearl iron_ring bracelet boots set_woma_helm set_woma_necklace set_woma_bracelet set_zuma_helm set_zuma_ring set_zuma_boots set_chiyue_necklace set_chiyue_ring set_chiyue_bracelet'.split(' ');
ok(SNAP.length === 52 && SNAP.every(id => ITEMS[id]?.slot), '旧装备 id 全部保留（52）');
ok(Object.values(NAME_TO_ITEM).every(id => ITEMS[id]), '掉落表引用的 id 全部有效');
// 分层映射：所有衣服/武器 × 三职业都能解析（无图走 req 兜底）
let bad: string[] = [];
for (const c of Object.keys(EQUIP_CLASSES)) for (const id of ids) {
  const s = ITEMS[id].slot; if (s !== 'armor' && s !== 'weapon') continue;
  const w = new World(() => 0.5, 1, FLOORS, c as any); const it = w.makeItem(id);
  if (!resolveSlot(c, s, it)) bad.push(`${c}/${id}`);
}
ok(bad.length === 0, `衣服/武器分层映射全部可解析${bad.length ? '：' + bad.join(',') : ''}`);
ok(resolveSlot('warrior', 'armor', new World(() => 0.5).makeItem('medium_armor'))!.id === 'armor', '中型盔甲(req16) 兜底 → armor');
// 文档一致
ok(readFileSync(new URL('../docs/equip-table.md', import.meta.url), 'utf8') === renderEquipTable(), 'docs/equip-table.md 与数据一致（npm run gen:equip）');
// 套装计件：同 id 重复只计 1 件；不同件正常累计
{
  const w = new World(() => 0.5, 50, FLOORS, 'warrior');
  w.equip.ring1 = w.makeItem('set_chiyue_ring'); w.equip.ring2 = w.makeItem('set_chiyue_ring');
  ok((w.setCounts().chiyue ?? 0) === 1, '两只相同赤月戒指只计 1 件');
  w.equip.necklace = w.makeItem('set_chiyue_necklace');
  ok(w.setCounts().chiyue === 2 && w.setBonuses().length === SETS.chiyue.bonus.filter(b => b.n <= 2).length, '不同件累计到 2 件激活 2 件加成');
}
// 职业限制
{
  const w = new World(() => 0.5, 50, FLOORS, 'mage');
  w.bag.push(w.makeItem('war_armor')); ok(w.equipItem(w.bag.length - 1) === '职业不符', '法师不能穿战神盔甲');
  w.bag.push(w.makeItem('fashen_ring')); ok(w.equipItem(w.bag.length - 1) === null, '法师可戴法神戒指');
  w.bag.push(w.makeItem('ghost_necklace')); ok(w.equipItem(w.bag.length - 1) === null, '通用件不限职业');
}
if (fails) { console.log(`装备表测试失败 ${fails} 项`); process.exit(1); }
console.log('装备表测试全部通过');
