import { REGIONS } from './map';
/** R14 城镇与 NPC。来源/未查到见 docs/towns-npcs-official.md */
export type NpcKind = 'potion' | 'weapon' | 'armor' | 'jewelry' | 'book' | 'general' | 'smith' | 'storage' | 'teleport';
/** 商品：item 物品 id；official 原版价（null = 未查到）；price 本作买价 */
export interface Goods { item: string; official: number | null; price: number; src: string }
export interface NpcDef { id: string; name: string; kind: NpcKind; pos?: string; goods?: Goods[]; note?: string }
export interface TownDef { id: string; name: string; region: string; src: string; npcs: NpcDef[] }
/** [适配] 本作买价 = 原版价 × 0.25 */
export const PRICE_K = 0.25;
const T2 = 'https://www.tayewan.com/forum.php?mod=viewthread&tid=41925', T4 = (id: number) => `https://www.21cq.com/mir/View.aspx?ID=${id}`;
const S14 = 'http://mir.17173.com/item/item.htm', T1 = 'http://cq.5pk.com/infobox/list/8xKJuEAOtt4.html', S7 = 'https://games.sina.com.cn/o/z/cq/2013-10-31/1843506458.shtml';
const g = (item: string, official: number | null, src: string, price = Math.round((official ?? 0) * PRICE_K)): Goods => ({ item, official, price, src });
export const WEAPON_GOODS = [g('wood_sword', 50, T2 + ' ' + T4(80)), g('bronze_sword', 900, T2 + ' ' + T4(83)), g('short_sword', 1000, T2 + ' ' + T4(84)), g('banyue', 4000, T2 + ' ' + T4(91))];
export const ARMOR_GOODS = [g('cloth', 120, T4(116)), g('light_armor', 3000, T4(118))];
export const GENERAL_GOODS = [g('dungeon_scroll', 110, S14), g('return_scroll', null, '未查到', 40)];
const npc = (id: string, name: string, kind: NpcKind, pos?: string, extra: Partial<NpcDef> = {}): NpcDef => ({ id, name, kind, pos, ...extra });
const basic = (p: string): NpcDef[] => [npc(p + '_potion', '药店', 'potion'), npc(p + '_general', '杂货铺', 'general', undefined, { goods: GENERAL_GOODS }), npc(p + '_storage', '仓库', 'storage'), npc(p + '_tele', '传送员', 'teleport', undefined, { note: '[适配] 原版位置未查到' })];
export const TOWNS: Record<string, TownDef> = {
  bichi: { id: 'bichi', name: '比奇城', region: 'bichi', src: S7 + ' ' + T1, npcs: [
    npc('bq_potion', '夏家店老板（药店）', 'potion', '324,291'),
    npc('bq_weapon', '卫家店（武器店）', 'weapon', '335,299', { goods: WEAPON_GOODS }),
    npc('bq_armor', '安家布衣（服装店）', 'armor', '317,301', { goods: ARMOR_GOODS }),
    npc('bq_jewelry', '首饰店', 'jewelry', '305,275', { note: '存货未查到：只收购' }),
    npc('bq_book', '书店老板', 'book', '325,250'),
    npc('bq_general', '杂货铺老板', 'general', '278,298', { goods: GENERAL_GOODS }),
    npc('bq_smith', '铁匠铺老板', 'smith', '302,219'),
    npc('bq_storage', '仓库保管员', 'storage', '301,257'),
    npc('bq_tele', '传送员', 'teleport', undefined, { note: '[适配] 原版位置未查到' })] },
  mengzhong: { id: 'mengzhong', name: '盟重土城', region: 'zuma', src: T2, npcs: [...basic('mz'), npc('mz_weapon', '铁匠铺老板（武器）', 'weapon', '329,314', { goods: WEAPON_GOODS })] },
  bairimen: { id: 'bairimen', name: '白日门', region: 'chiyue', src: '未查到', npcs: basic('brm') },
  cangyue: { id: 'cangyue', name: '苍月岛', region: 'cangyue', src: '未查到', npcs: basic('cy') },
  fengmo: { id: 'fengmo', name: '封魔谷', region: 'fengmo', src: '未查到', npcs: basic('fm') },
};
/** 地图城镇节点 id → 城镇 id */
export const NODE_TOWN: Record<string, string> = { bichi_town: 'bichi', zuma_town: 'mengzhong', chiyue_town: 'bairimen', cangyue_town: 'cangyue', fengmo_town: 'fengmo' };
/** 城镇所在区域的入口层（出城去的层） */
export function townFloors(t: string): number[] { const r = REGIONS.find(x => x.id === TOWNS[t]?.region); return r ? [...r.floors] : [0]; }
/** 某层所在区域的城镇（地牢逃脱卷）；没有返回 bichi */
export function townOfFloor(f: number): string { const r = REGIONS.find(x => x.floors.includes(f)); return Object.values(TOWNS).find(t => t.region === r?.id)?.id ?? 'bichi'; }
export const STORAGE_SIZE = 40;
