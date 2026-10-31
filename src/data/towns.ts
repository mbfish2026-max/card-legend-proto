import { REGIONS } from './map';
/** R14 城镇与 NPC。来源/未查到见 docs/towns-npcs-official.md */
export type NpcKind = 'potion' | 'weapon' | 'armor' | 'jewelry' | 'book' | 'general' | 'smith' | 'storage' | 'teleport' | 'veteran';
/** 商品：item 物品 id；official 原版价（null = 未查到）；price 本作买价 */
export interface Goods { item: string; official: number | null; price: number; src: string }
export interface NpcDef { id: string; name: string; kind: NpcKind; pos?: string; goods?: Goods[]; note?: string }
export interface TownDef { id: string; name: string; region: string; src: string; npcs: NpcDef[]; /** 出村/出城直接去的层（缺省 = 区域第一层） */ exit?: number }
/** [适配] 本作买价 = 原版价 × 0.25 */
export const PRICE_K = 0.25;
const T2 = 'https://www.tayewan.com/forum.php?mod=viewthread&tid=41925', T4 = (id: number) => `https://www.21cq.com/mir/View.aspx?ID=${id}`;
const S14 = 'http://mir.17173.com/item/item.htm', T1 = 'http://cq.5pk.com/infobox/list/8xKJuEAOtt4.html', S7 = 'https://games.sina.com.cn/o/z/cq/2013-10-31/1843506458.shtml';
const g = (item: string, official: number | null, src: string, price = Math.round((official ?? 0) * PRICE_K)): Goods => ({ item, official, price, src });
export const WEAPON_GOODS = [g('wood_sword', 50, T2 + ' ' + T4(80)), g('bronze_sword', 900, T2 + ' ' + T4(83)), g('short_sword', 1000, T2 + ' ' + T4(84)), g('iron_sword', 1200, T4(85)), g('banyue', 4000, T2 + ' ' + T4(91))];
export const ARMOR_GOODS = [g('cloth', 120, T4(116)), g('light_armor', 3000, T4(118)), g('medium_armor', 6000, T4(120)), g('helmet', 1000, T4(147) + ' [适配] 头盔放服装店')];
export const GENERAL_GOODS = [g('dungeon_scroll', 110, S14), g('return_scroll', null, '未查到', 40)];
/** 新手村（银杏山谷）来源：传奇正传官方资料站 比奇省 NPC 表 + 47daili 坐标表 */
const XS = 'http://sscq.oss-cn-hangzhou.aliyuncs.com/game/datainfo/hzfXGJXY8LQ.html', XS2 = 'http://47daili.com/lianluoyuan/topic-94763-1-1.html';
/** [适配] 新手村只卖最低级货（原版村内具体货单未查到） */
export const NEWBIE_WEAPON = WEAPON_GOODS.slice(0, 1), NEWBIE_ARMOR = ARMOR_GOODS.slice(0, 1);
const npc = (id: string, name: string, kind: NpcKind, pos?: string, extra: Partial<NpcDef> = {}): NpcDef => ({ id, name, kind, pos, ...extra });
const basic = (p: string): NpcDef[] => [npc(p + '_potion', '药店', 'potion'), npc(p + '_general', '杂货铺', 'general', undefined, { goods: GENERAL_GOODS }), npc(p + '_storage', '仓库', 'storage'), npc(p + '_tele', '传送员', 'teleport', undefined, { note: '[适配] 原版位置未查到' })];
export const TOWNS: Record<string, TownDef> = {
  xinshou: { id: 'xinshou', name: '银杏村（新手村）', region: 'bichi', src: XS + ' ' + XS2, exit: 0, npcs: [
    npc('xs_potion', '许家店（药店）', 'potion', '649,618'),
    npc('xs_weapon', '精武馆老板（武器店）', 'weapon', '649,602', { goods: NEWBIE_WEAPON }),
    npc('xs_armor', '白家服装老板（服装店）', 'armor', '643,601', { goods: NEWBIE_ARMOR }),
    npc('xs_general', '陈家铺老板（杂货店）', 'general', '641,611', { goods: GENERAL_GOODS }),
    npc('xs_storage', '廖家店老板（仓库）', 'storage', '621,642'),
    npc('xs_veteran', '新手引导员', 'veteran', '654,623', { note: '新手引导；入口 (623,600)' })] },
  bichi: { id: 'bichi', name: '比奇城', region: 'bichi', src: S7 + ' ' + T1, npcs: [
    npc('bq_potion', '夏家店老板（药店）', 'potion', '324,291'),
    npc('bq_weapon', '卫家店（武器店）', 'weapon', '335,299', { goods: WEAPON_GOODS }),
    npc('bq_armor', '安家布衣（服装店）', 'armor', '317,301', { goods: ARMOR_GOODS }),
    npc('bq_jewelry', '首饰店', 'jewelry', '305,275', { note: '存货未查到：只收购' }),
    npc('bq_book', '书店老板', 'book', '325,250'),
    npc('bq_general', '杂货铺老板', 'general', '278,298', { goods: GENERAL_GOODS }),
    npc('bq_smith', '铁匠铺老板', 'smith', '302,219'),
    npc('bq_storage', '仓库保管员', 'storage', '301,257'),
    npc('bq_tele', '传送员', 'teleport', undefined, { note: '[适配] 原版位置未查到' }),
    npc('bq_veteran', '比奇老兵', 'veteran', undefined, { note: '城门老兵：新手指引 + 传送（原版比奇老兵承担传送；坐标未查到）' })] },
  mengzhong: { id: 'mengzhong', name: '盟重土城', region: 'zuma', src: T2, npcs: [...basic('mz'), npc('mz_weapon', '铁匠铺老板（武器）', 'weapon', '329,314', { goods: WEAPON_GOODS })] },
  bairimen: { id: 'bairimen', name: '白日门', region: 'chiyue', src: '未查到', npcs: basic('brm') },
  cangyue: { id: 'cangyue', name: '苍月岛', region: 'cangyue', src: '未查到', npcs: basic('cy') },
  fengmo: { id: 'fengmo', name: '封魔谷', region: 'fengmo', src: '未查到', npcs: basic('fm') },
};
/** 地图城镇节点 id → 城镇 id */
export const NODE_TOWN: Record<string, string> = { bichi_town: 'bichi', zuma_town: 'mengzhong', chiyue_town: 'bairimen', cangyue_town: 'cangyue', bichi_xinshou: 'xinshou', fengmo_town: 'fengmo' };
/** 城镇所在区域的入口层（出城去的层） */
export function townFloors(t: string): number[] { const r = REGIONS.find(x => x.id === TOWNS[t]?.region); const e = TOWNS[t]?.exit; if (e !== undefined) return [e]; return r ? [...r.floors] : [0]; }
/** 某层所在区域的城镇（地牢逃脱卷）；没有返回 bichi */
/** 战斗层的「回城/回村」入口：原路返回进来的城镇（第 0 层由新手村进入 → 回新手村；其余回本区域主城） */
export function returnTownOf(f: number): string { const v = Object.values(TOWNS).find(t => t.exit === f); return v ? v.id : townOfFloor(f); }
export function townOfFloor(f: number): string { const r = REGIONS.find(x => x.floors.includes(f)); return Object.values(TOWNS).find(t => t.region === r?.id && t.exit === undefined)?.id ?? 'bichi'; }
export const STORAGE_SIZE = 40;

/** R14 横版长街：街宽 = 3 屏；西端城门（出城），店铺门面沿街等距排开 */
/** 横版长街素材（docs/art-requests.md K 章）原尺寸 5760×1080，游戏内按 720/1080 = 2/3 缩放 → 3840×720 */
export const STREET_ART_K = 2 / 3;
export const TOWN_W = Math.round(5760 * STREET_ART_K), TOWN_GATE_X = 0, GATE_RANGE = 70, TOWN_SPAWN_X = 384;
/** 门口触发半径：素材约定 |x−店铺中心| < 200（原尺寸）→ ×2/3 */
export const DOOR_RANGE = Math.round(200 * STREET_ART_K) - 13;
/** NPC 立绘/门面文件 id（public/assets/town/npc_<id>.png、shop_<id>.png） */
export const NPC_ART: Record<NpcKind, string> = { potion: 'pharmacist', weapon: 'weapon', armor: 'clothes', jewelry: 'jewelry', book: 'book', general: 'grocer', smith: 'blacksmith', storage: 'storage', teleport: 'teleporter', veteran: 'veteran' };
/** 街上店铺顺序（素材 street_near 中的固定排布，中心 x = 288 + 576×i 原尺寸） */
export const STREET_ORDER = ['veteran', 'teleporter', 'pharmacist', 'weapon', 'clothes', 'jewelry', 'book', 'grocer', 'blacksmith', 'storage'];
export const streetSlotX = (i: number) => Math.round((288 + 576 * i) * STREET_ART_K);
/** 门面列表：按素材顺序放到对应店位；没有该类 NPC 的城镇只占用其已有的店位 */
export function streetDoors(t: string): { npc: NpcDef; x: number; art: string }[] {
  return (TOWNS[t]?.npcs ?? []).map(npc => ({ npc, art: NPC_ART[npc.kind], x: streetSlotX(STREET_ORDER.indexOf(NPC_ART[npc.kind])) })).sort((a, b) => a.x - b.x);
}
