import { REGIONS } from './map';
/** R14 城镇与 NPC。来源/未查到见 docs/towns-npcs-official.md */
export type NpcKind = 'potion' | 'weapon' | 'armor' | 'jewelry' | 'book' | 'general' | 'smith' | 'storage' | 'teleport' | 'veteran' | 'dragon';
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
  mengzhong: { id: 'mengzhong', name: '盟重土城', region: 'zuma', src: T2, npcs: [...basic('mz'), npc('mz_weapon', '铁匠铺老板（武器）', 'weapon', '329,314', { goods: WEAPON_GOODS }),
    npc('mz_veteran', '盟重老兵', 'veteran', undefined, { note: '城门老兵（坐标未查到）' }), npc('mz_armor', '服装店', 'armor', undefined, { goods: ARMOR_GOODS, note: '[适配] 货单同比奇' }),
    npc('mz_jewelry', '首饰店', 'jewelry', undefined, { note: '存货未查到：只收购' }), npc('mz_book', '书店老板', 'book')] },
  bairimen: { id: 'bairimen', name: '白日门', region: 'chiyue', src: '未查到', npcs: [...basic('brm'), npc('brm_dragon', '龙人', 'dragon', undefined, { note: '合击秘籍（H1）；坐标未查到' }),
    npc('brm_weapon', '武器店', 'weapon', undefined, { goods: WEAPON_GOODS, note: '[适配] 货单同比奇' }), npc('brm_armor', '服装店', 'armor', undefined, { goods: ARMOR_GOODS, note: '[适配]' }),
    npc('brm_jewelry', '首饰店', 'jewelry', undefined, { note: '存货未查到：只收购' })] },
  cangyue: { id: 'cangyue', name: '苍月岛', region: 'cangyue', src: '未查到', npcs: [...basic('cy'), npc('cy_weapon', '武器店', 'weapon', undefined, { goods: WEAPON_GOODS, note: '[适配]' }),
    npc('cy_armor', '服装店', 'armor', undefined, { goods: ARMOR_GOODS, note: '[适配]' }), npc('cy_jewelry', '首饰店', 'jewelry', undefined, { note: '存货未查到：只收购' })] },
  fengmo: { id: 'fengmo', name: '封魔谷', region: 'fengmo', src: '未查到', npcs: [...basic('fm'), npc('fm_veteran', '封魔谷老兵', 'veteran', undefined, { note: '坐标未查到' }),
    npc('fm_weapon', '武器店', 'weapon', undefined, { goods: WEAPON_GOODS, note: '[适配]' })] },
};
/** 地图城镇节点 id → 城镇 id */
export const NODE_TOWN: Record<string, string> = { bichi_town: 'bichi', zuma_town: 'mengzhong', chiyue_town: 'bairimen', cangyue_town: 'cangyue', bichi_xinshou: 'xinshou', fengmo_town: 'fengmo', hj_town: 'mengzhong' };
/** 城镇所在区域的入口层（出城去的层） */
export function townFloors(t: string): number[] { const r = REGIONS.find(x => x.id === TOWNS[t]?.region); const e = TOWNS[t]?.exit; if (e !== undefined) return [e]; return r ? [...r.floors] : [0]; }
/** 某层所在区域的城镇（地牢逃脱卷）；没有返回 bichi */
/** 战斗层的「回城/回村」入口：原路返回进来的城镇（第 0 层由新手村进入 → 回新手村；其余回本区域主城） */
export function returnTownOf(f: number): string { const v = Object.values(TOWNS).find(t => t.exit === f); return v ? v.id : townOfFloor(f); }
export function townOfFloor(f: number): string { const r = REGIONS.find(x => x.floors.includes(f)); const tn = r?.nodes.find(n => n.kind === 'town'); return Object.values(TOWNS).find(t => t.region === r?.id && t.exit === undefined)?.id ?? (tn && NODE_TOWN[tn.id]) ?? 'bichi'; }
export const STORAGE_SIZE = 40;

/** R14 横版长街：街宽 = 3 屏；西端城门（出城），店铺门面沿街等距排开 */
/** 横版长街素材（docs/art-requests.md K 章）原尺寸 5760×1080，游戏内按 720/1080 = 2/3 缩放 → 3840×720 */
export const STREET_ART_K = 2 / 3;
export const TOWN_W = Math.round(5760 * STREET_ART_K), TOWN_GATE_X = 0, GATE_RANGE = 70, TOWN_SPAWN_X = 384;
/** 门口触发半径：素材约定 |x−店铺中心| < 200（原尺寸）→ ×2/3 */
export const DOOR_RANGE = Math.round(200 * STREET_ART_K) - 13;
/** NPC 立绘/门面文件 id（public/assets/town/npc_<id>.png、shop_<id>.png） */
export const NPC_ART: Record<NpcKind, string> = { potion: 'pharmacist', weapon: 'weapon', armor: 'clothes', jewelry: 'jewelry', book: 'book', general: 'grocer', smith: 'blacksmith', storage: 'storage', teleport: 'teleporter', veteran: 'veteran', dragon: 'jewelry' }; // [适配] 龙人暂用首饰店位与立绘（白日门无首饰店）
/** 街上店铺顺序（素材 street_near 中的固定排布，中心 x = 288 + 576×i 原尺寸） */
export const STREET_ORDER = ['veteran', 'teleporter', 'pharmacist', 'weapon', 'clothes', 'jewelry', 'book', 'grocer', 'blacksmith', 'storage'];
export const streetSlotX = (i: number) => Math.round((288 + 576 * i) * STREET_ART_K);
/** 门面列表：按素材顺序放到对应店位；没有该类 NPC 的城镇只占用其已有的店位 */
export function streetDoors(t: string): { npc: NpcDef; x: number; art: string; shop?: string; npcArt?: string }[] {
  const L = TOWN_LAYOUT[t]; if (L) return L.items.filter(it => it.npc).map(it => ({ npc: TOWNS[t].npcs.find(n => n.id === it.npc)!, x: Math.round(it.x * STREET_ART_K), art: NPC_ART[TOWNS[t].npcs.find(n => n.id === it.npc)!.kind], shop: it.shop, npcArt: it.npcArt })).sort((a, b) => a.x - b.x);
  return (TOWNS[t]?.npcs ?? []).map(npc => ({ npc, art: NPC_ART[npc.kind], x: streetSlotX(STREET_ORDER.indexOf(NPC_ART[npc.kind])) })).sort((a, b) => a.x - b.x);
}

/** 大城长街（docs/art-requests.md L-P1/P2/P3 摆位表，背景原尺寸坐标；门面底边 y=760、NPC 脚底 y=1040，origin (0.5,1)；游戏内 ×STREET_ART_K）
 *  npc：可进入的 NPC id（缺省 = 装饰门面，不可进入：客栈/肉店/炼金师、白日门神秘书商/神秘铁匠「未接线」）；shop 门面图；npcArt 立绘；npcX 立绘位置 */
export interface StreetItem { x: number; npc?: string; shop?: string; npcArt?: string; npcX?: number; label?: string }
export interface TownLayout { bg: string; artW: number; shopScale: number; items: StreetItem[] }
export const NPC_SCALE = 0.35;
export const TOWN_LAYOUT: Record<string, TownLayout> = {
  mengzhong: { bg: 'bg_town_mengzhong', artW: 7680, shopScale: 1, items: [
    { x: 520, npc: 'mz_veteran', npcArt: 'npc_mz_veteran' }, { x: 1000, npc: 'mz_general', shop: 'shop_mz_grocer', label: '罗家铺子' },
    { x: 1300, npc: 'mz_tele', npcArt: 'npc_teleporter' }, { x: 1650, npc: 'mz_storage', shop: 'shop_mz_storage', npcArt: 'npc_mz_storage', npcX: 1880, label: '王家仓库' },
    { x: 2250, shop: 'shop_mz_inn', label: '悦来客栈' }, { x: 2950, npc: 'mz_weapon', shop: 'shop_mz_weapon', npcArt: 'npc_mz_weapon', npcX: 3200 },
    { x: 3550, npc: 'mz_armor', shop: 'shop_mz_clothes' }, { x: 4150, npc: 'mz_jewelry', shop: 'shop_mz_jewelry' },
    { x: 4850, shop: 'shop_mz_alchemist', label: '炼金师' }, { x: 5450, shop: 'shop_mz_butcher', label: '黄家肉店' },
    { x: 6050, npc: 'mz_potion', shop: 'shop_mz_pharmacy', npcArt: 'npc_mz_pharmacy', npcX: 6290 }, { x: 6700, npc: 'mz_book', shop: 'shop_mz_book', npcArt: 'npc_mz_book', npcX: 6940 }] },
  bairimen: { bg: 'bg_town_bairimen', artW: 5760, shopScale: 1, items: [
    { x: 820, npc: 'brm_tele', npcArt: 'npc_brm_guide', label: '向导（传送）' }, { x: 1150, shop: 'shop_brm_mystic_book', npcArt: 'npc_brm_mystic_book', npcX: 1400, label: '神秘书商（未开放）' },
    { x: 1750, npc: 'brm_weapon', shop: 'shop_brm_weapon' }, { x: 2050, npc: 'brm_general', npcArt: 'npc_grocer' }, { x: 2350, npc: 'brm_storage', shop: 'shop_brm_storage' },
    { x: 2950, npc: 'brm_potion', shop: 'shop_brm_pharmacy' }, { x: 3550, npc: 'brm_jewelry', shop: 'shop_brm_jewelry' }, { x: 4150, npc: 'brm_armor', shop: 'shop_brm_clothes' },
    { x: 4800, shop: 'shop_brm_mystic_smith', npcArt: 'npc_brm_mystic_smith', npcX: 5050, label: '神秘铁匠（未开放）' }, { x: 5300, npc: 'brm_dragon', npcArt: 'npc_brm_dragon' }] },
  fengmo: { bg: 'bg_town_fengmo', artW: 3840, shopScale: 1, items: [
    { x: 900, npc: 'fm_veteran', npcArt: 'npc_fm_veteran' }, { x: 1400, npc: 'fm_potion', shop: 'shop_fm_potion' }, { x: 1700, npc: 'fm_tele', npcArt: 'npc_teleporter' },
    { x: 2000, npc: 'fm_weapon', shop: 'shop_fm_weapon' }, { x: 2650, npc: 'fm_storage', shop: 'shop_fm_storage' }, { x: 3250, npc: 'fm_general', shop: 'shop_fm_general' }] },
  cangyue: { bg: 'bg_town_cangyue', artW: 3840, shopScale: 0.85, items: [
    { x: 560, npc: 'cy_tele', npcArt: 'npc_teleporter' }, { x: 860, npc: 'cy_weapon', shop: 'shop_cy_weapon' }, { x: 1310, npc: 'cy_general', shop: 'shop_cy_general' },
    { x: 1760, npc: 'cy_storage', shop: 'shop_cy_storage' }, { x: 2210, npc: 'cy_armor', shop: 'shop_cy_clothes' }, { x: 2660, npc: 'cy_potion', shop: 'shop_cy_potion' },
    { x: 3110, npc: 'cy_jewelry', shop: 'shop_cy_jewelry' }] }, // 书店 shop_cy_book 不用：每屏 ≤3 门面（towns-plan 取舍，书店无货单）
};
/** 街宽（游戏像素）：大城按背景宽，其余（比奇/新手村）TOWN_W */
export const townWidth = (t: string | null) => { const L = t ? TOWN_LAYOUT[t] : undefined; return L ? Math.round(L.artW * STREET_ART_K) : TOWN_W; };
/** 某 NPC 在街上的立绘（大城优先用专属立绘；Panel 进店左侧大图用） */
export const npcArtOf = (t: string | null, npcId: string, kind: NpcKind) => { const it = t ? TOWN_LAYOUT[t]?.items.find(i => i.npc === npcId) : undefined; return it?.npcArt ?? 'npc_' + NPC_ART[kind]; };
/** 大城用到的全部美术 key（assets-manifest TOWN_ASSETS 由此生成） */
export const townArtKeys = (t: string) => { const L = TOWN_LAYOUT[t]; return L ? [L.bg, ...L.items.flatMap(i => [i.shop, i.npcArt]).filter((k): k is string => !!k)] : []; };
