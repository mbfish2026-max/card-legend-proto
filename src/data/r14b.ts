/**
 * R14 阶段 B 补缺：#13 赤月三职业套 + 屠龙战士专用 req34；#14 沃玛寺庙多层 + 号角；#17 环式任务 / 鉴定。
 * 只在此文件追加数据/补丁，不重写 items.ts / equip-official.ts。来源见 docs/r14b-official.md。
 */
import { ITEMS, SETS } from './items';
import { ENEMIES } from './units';
import type { Cls } from './equip-official';

// ---------- #13 赤月三职业套 ----------
/** 原版 1.76 赤月恶魔掉落的圣战（战士）/法神（法师）/天尊（道士）套（21cq 物品页见 equip-table.md）；
 *  1.76 原版无「套装属性加成」——套装加成数值为 [适配]（与旧赤月套同量级） */
export const CLASS_SETS: { id: string; name: string; cls: Cls; pre: string }[] = [
  { id: 'shengzhan', name: '圣战', cls: 'warrior', pre: 'shengzhan_' },
  { id: 'fashen', name: '法神', cls: 'mage', pre: 'fashen_' },
  { id: 'tianzun', name: '天尊', cls: 'taoist', pre: 'tianzun_' },
];
const MAIN = { warrior: 'atk', mage: 'mag', taoist: 'tao' } as const;
for (const s of CLASS_SETS) {
  const pieces = ['helm', 'necklace', 'ring', 'bracelet'].map(p => s.pre + p).filter(id => ITEMS[id]);
  pieces.forEach(id => { ITEMS[id].set = s.id; ITEMS[id].cls = [s.cls]; });
  const m = MAIN[s.cls];
  SETS[s.id] = { id: s.id, name: s.name, pieces, bonus: [
    { n: 2, stats: { [m]: 12 }, text: `${m === 'atk' ? '攻击' : m === 'mag' ? '魔法' : '道术'}+12 [适配]` },
    { n: 4, stats: { hp: 250, def: 10 }, luck: 1, text: '生命+250 防御+10 幸运+1 [适配]' }] };
}
/** 旧通用赤月套保留（旧存档里的件仍有效），不再掉落 */
ENEMIES.boss_redmoon.setDrop = CLASS_SETS.flatMap(s => SETS[s.id].pieces);

// ---------- #13 屠龙：官方 req34、攻 5-35、战士专用（21cq id=108） ----------
export const TULONG_SRC = 'https://www.21cq.com/mir/View.aspx?id=108';
const topAtk = Math.max(...Object.values(ITEMS).filter(i => i.slot === 'weapon' && i.id !== 'dragon_sword' && (i.req ?? 0) <= 34).map(i => i.equip?.atk ?? 0));
// [适配] 攻击 = 同段（req≤34）最高攻击武器 ×1.1；名字保留「屠龙刀」（存档/掉落表兼容）
Object.assign(ITEMS.dragon_sword, { req: 34, cls: ['warrior'] as Cls[], equip: { atk: Math.round(topAtk * 1.1) } });

// ---------- #14 沃玛寺庙多层 ----------
/** 原版：沃玛寺庙 1–3 层 + 教主之家（gap-vs-official S7/S9）；本作压在一张横版图里按 x 分段 [适配] */
export const WOMA_FLOOR_NAME = '沃玛寺庙';
export const WOMA_SECTIONS: { name: string; until: number }[] = [
  { name: '沃玛寺庙一层', until: 1200 }, { name: '沃玛寺庙二层', until: 2000 }, { name: '沃玛寺庙三层', until: 2850 }, { name: '沃玛教主之家', until: Infinity }];
/** 教主之家门口 x（需号角） */
export const WOMA_DOOR_X = 2850;
/** 沃玛战士/卫士掉号角几率：原版未查到 → [适配] 8%；本层小怪清完仍没有号角时保底给 1 个 [适配] */
export const HORN_MOB_CHANCE = 0.08;
export const HORN_MOBS = ['woma_warrior', 'woma_guard'];

// ---------- #17 环式任务 ----------
/** 手游 20 级起可接环式任务、可无限接（S12 https://mir.qq.com/act/a20150615data/xtjs.shtml）；环数奖励公式未查到 → [适配] */
export const RING_MIN_LEVEL = 20;
export interface RingQuest { n: number; floor: number; target: string; name: string; need: number; prog: number }
export const ringReward = (n: number, floor: number) => ({ gold: Math.round((60 + floor * 25) * (1 + Math.min(n, 20) * 0.1)), exp: Math.round((80 + floor * 40) * (1 + Math.min(n, 20) * 0.1)) });

// ---------- #17 鉴定 ----------
/** 手游 35 级开放鉴定，随机 1–3 条属性（S12）；费用、词条池、数值未查到 → [适配] */
export const IDENT_MIN_LEVEL = 35;
export const IDENT_PRICE = 500;
export const IDENT_POOL = ['hp', 'mp', 'atk', 'mag', 'tao', 'def'] as const;
export const identValue = (stat: string, req: number) => Math.max(1, Math.round((stat === 'hp' || stat === 'mp' ? 4 : 0.5) * Math.max(req, 5)));
