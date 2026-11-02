// P2 eg-sets：40–50 级 40 件装备 / 官方职业套 / 掉落来源 / 自创套停掉落 / 旧存档兼容 / 图标
declare const process: { exit(c: number): never };
// @ts-ignore node
import { existsSync } from 'node:fs';
import { World } from '../src/combat/World';
import { ITEMS, SETS } from '../src/data/items';
import { ENEMIES } from '../src/data/units';
import { FLOORS } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { EG_IDS, EG_ICON_MAP } from '../src/data/eg-equip';
import { EG_DROPS } from '../src/data/drop-plan';
import { RETIRED_SET_ITEMS, SET_SPECIALS } from '../src/data/eg-sets';
import { EQUIP_META } from '../src/data/equip-official';
import { ITEM_ICON_2X } from '../src/data/item-icons-2x';
let fails = 0; const ok = (c: unknown, m: string) => { if (c) console.log('  ✓', m); else { fails++; console.log('  ✗', m); } };

ok(EG_IDS.length === 40 && EG_IDS.every(id => ITEMS[id]?.slot && EQUIP_META[id]?.origin === 'eg'), '40 件新装备入表且有盘点条目');
ok(EG_IDS.every(id => [40, 44, 45, 46, 47, 48, 35].includes(ITEMS[id].req!)), 'req 档 40/44/45/46–47/48（命运之刃官方 35）');
ok(Object.keys(EG_ICON_MAP).length === 40 && EG_IDS.every(id => existsSync(`public/${ITEMS[id].icon}`) && existsSync(`public/${ITEMS[id].icon.replace('.png', '@2x.png')}`)), '美术 E4 图标 64/128 全部存在（id 对照 40/40）');
ok(EG_IDS.every(id => ITEM_ICON_2X.has(ITEMS[id].icon.replace(/^assets\/items\/|\.png$/g, ''))), '@2x 图标登记 item-icons-2x');
// 每件都有来源
const src = new Set(Object.values(ENEMIES).flatMap(u => [...(u.drops ?? []).map(d => d.item), ...(u.setDrop ?? [])]));
ok(EG_IDS.every(id => src.has(id)), `40 件均有掉落来源${EG_IDS.filter(i => !src.has(i)).join(',')}`);
// 40 级以下层不掉 40+ 装备
const bad: string[] = [];
FLOORS.forEach((f, i) => { if (FLOOR_TARGET_LV[i] >= 40) return;
  for (const s of f.spawns) { const u = ENEMIES[s.id]; if (!u) continue;
    for (const it of [...(u.drops ?? []).map(d => d.item), ...(u.setDrop ?? [])]) if ((ITEMS[it]?.req ?? 0) >= 40 && ITEMS[it]?.slot) bad.push(`${f.name}:${s.id}:${it}`); } });
ok(bad.length === 0, `目标等级 <40 的层不掉 Lv40+ 装备${bad.length ? '：' + [...new Set(bad)].slice(0, 5).join(' ') : ''}`);
ok(Object.values(EG_DROPS).flat().every(([, c]) => c <= 1 / 8), 'E1：新增爆率不优于 1/8');
// 天尊进 HJ 掉落、自创套停掉落
ok(['helm', 'necklace', 'ring', 'bracelet'].every(k => ENEMIES.boss_redmoon.drops!.some(d => d.item === 'tianzun_' + k)), 'D9 天尊 4 件按职业归赤月恶魔（drop-realign）');
ok(!RETIRED_SET_ITEMS.some(id => src.has(id)), 'D8：set_zuma/set_chiyue 不再掉落');
ok(RETIRED_SET_ITEMS.every(id => ITEMS[id]?.slot) && SETS.zuma && SETS.chiyue, '自创套物品与套装定义保留（旧存档）');
// 套装
ok(['leiting', 'lieyan', 'guangmang'].every(s => SETS[s].pieces.length === 4 && SETS[s].bonus.map(b => b.n).join() === '3,4'), '雷霆系 4 件 3/4 档');
ok(['zhanshen', 'shengmo', 'zhenhun'].every(s => SETS[s].pieces.length === 3 && SETS[s].bonus.map(b => b.n).join() === '2,3'), '战神系 3 件 2/3 档');
ok(['shengzhan', 'fashen', 'tianzun'].every(s => SETS[s].bonus[1].special === s + '4' && SET_SPECIALS[s + '4']), '三圣 4 件带职业特效接口');
const w = new World(() => 0.5, 50, FLOORS, 'warrior');
const base = w.stats().atk;
for (const k of ['necklace', 'bracelet1', 'ring1', 'boots'] as const) w.equip[k] = w.makeItem('leiting_' + (k.replace(/1$/, '')));
ok(w.setCounts().leiting === 4 && w.setBonuses().length === 2, '穿 4 件雷霆：两档激活');
const w2 = new World(() => 0.5, 50, FLOORS, 'warrior');
for (const [k, id] of [['helmet', 'shengzhan_helm'], ['necklace', 'shengzhan_necklace'], ['ring1', 'shengzhan_ring'], ['bracelet1', 'shengzhan_bracelet']] as const) w2.equip[k] = w2.makeItem(id);
ok(w2.setSpecials().join() === 'shengzhan4' && w2.stats().atk > base, '圣战 4 件：特效 shengzhan4 + 主属性加成');
// 旧存档：穿着自创赤月套 → 仍有效
const old = new World(() => 0.5, 40, FLOORS, 'mage');
for (const [k, id] of [['necklace', 'set_chiyue_necklace'], ['ring1', 'set_chiyue_ring'], ['bracelet1', 'set_chiyue_bracelet']] as const) old.equip[k] = old.makeItem(id);
const sv = JSON.parse(JSON.stringify(old.toSave())), re = new World(() => 0.5, 1, FLOORS, 'mage', sv);
ok(re.equip.necklace?.item === 'set_chiyue_necklace' && (re.setCounts().chiyue ?? 0) === 3, '旧存档自创赤月套读档后仍计件');
const sv2 = JSON.parse(JSON.stringify(w.toSave())), re2 = new World(() => 0.5, 1, FLOORS, 'warrior', sv2);
ok(re2.equip.boots?.item === 'leiting_boots' && re2.setCounts().leiting === 4, '新装备存读档往返');
console.log(fails ? `eg-sets: ${fails} FAILED` : 'eg-sets: all passed'); if (fails) process.exit(1);
