/**
 * P2 eg-sets：官方职业套 SETS（三圣 4 件特效档 / 雷霆系 4 件 / 战神系 3 件）+ 自创套停掉落。
 * 官方套装加成未查到（equip-3050-plan B4「未曾被发现」）→ 数值全部 [适配]（D4/E4，逐档）。
 * 特效 special 只是「接口标记」，战斗效果由战斗开发实现（docs/eg-sets.md §给战斗开发）。
 */
import { ITEMS, SETS } from './items';
import { ENEMIES } from './units';
import { CLASS_SETS } from './r14b';
import type { Cls } from './equip-official';

export const MAIN: Record<Cls, 'atk' | 'mag' | 'tao'> = { warrior: 'atk', mage: 'mag', taoist: 'tao' };
const CN = { atk: '攻击', mag: '魔法', tao: '道术' } as const;
/** 三圣 4 件职业特效（接口；数值 [适配]，战斗开发实现） */
export const SET_SPECIALS: Record<string, { cls: Cls; text: string; param: number }> = {
  shengzhan4: { cls: 'warrior', text: '暴击率 +5%，暴击伤害 ×1.5 [适配]', param: 0.05 },
  fashen4: { cls: 'mage', text: '技能魔法消耗 -10% [适配]', param: 0.1 },
  tianzun4: { cls: 'taoist', text: '召唤物伤害 +10%，治疗量 +10% [适配]', param: 0.1 },
};
// D4：三圣 2 件 主属性+12；4 件 再 主属性+12 + 生命250 防御10 幸运1 + 职业特效
for (const s of CLASS_SETS) { const m = { warrior: 'atk', mage: 'mag', taoist: 'tao' }[s.cls] as 'atk' | 'mag' | 'tao', sp = s.id + '4';
  SETS[s.id].bonus[1] = { n: 4, stats: { [m]: 12, hp: 250, def: 10 }, luck: 1, special: sp, text: `${CN[m]}+12 生命+250 防御+10 幸运+1；特效：${SET_SPECIALS[sp].text}` }; }

/** E4 雷霆/烈焰/光芒（项链/护腕/戒指/靴，无腰带）3/4 件；战神/圣魔/真魂（项链/手镯/戒指）2/3 件。[适配] */
export const EG_SETS: { id: string; name: string; cls: Cls; pre: string; parts: string[]; bonus: [number, number, number, number][] }[] = [
  ...([['leiting', '雷霆', 'warrior'], ['lieyan', '烈焰', 'mage'], ['guangmang', '光芒', 'taoist']] as const).map(([id, name, cls]) => ({ id, name, cls, pre: id + '_', parts: ['necklace', 'bracelet', 'ring', 'boots'],
    bonus: [[3, 6, 120, 0], [4, 10, 200, 8]] as [number, number, number, number][] })),
  ...([['zhanshen', '战神', 'warrior'], ['shengmo', '圣魔', 'mage'], ['zhenhun', '真魂', 'taoist']] as const).map(([id, name, cls]) => ({ id, name, cls, pre: id + '_', parts: ['necklace', 'bracelet', 'ring'],
    bonus: [[2, 8, 0, 0], [3, 12, 200, 5]] as [number, number, number, number][] })),
];
for (const s of EG_SETS) { const m = ({ warrior: 'atk', mage: 'mag', taoist: 'tao' } as const)[s.cls];
  const pieces = s.parts.map(p => s.pre + p).filter(id => ITEMS[id]); pieces.forEach(id => { ITEMS[id].set = s.id; });
  SETS[s.id] = { id: s.id, name: s.name, pieces, bonus: s.bonus.map(([n, v, hp, def]) => ({ n, stats: { [m]: v, ...(hp ? { hp } : {}), ...(def ? { def } : {}) },
    text: `${CN[m]}+${v}${hp ? ` 生命+${hp}` : ''}${def ? ` 防御+${def}` : ''} [适配]` })) }; }

// D8/E5：自创祖玛套/赤月套停掉落（旧存档里的件仍有效，SETS 保留）
export const RETIRED_SET_ITEMS = ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots', 'set_chiyue_necklace', 'set_chiyue_ring', 'set_chiyue_bracelet'];
if (ENEMIES.boss_zuma) delete ENEMIES.boss_zuma.setDrop;
for (const u of Object.values(ENEMIES)) { if (u.drops) u.drops = u.drops.filter(d => !RETIRED_SET_ITEMS.includes(d.item));
  if (u.setDrop) u.setDrop = u.setDrop.filter(id => !RETIRED_SET_ITEMS.includes(id)); }
