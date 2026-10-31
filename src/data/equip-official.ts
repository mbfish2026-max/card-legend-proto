// 官方装备表 v1（热血传奇 1.76）：官方名/需求/属性区间/来源 + 新增装备。
// 资料来源：21cq 1.76 物品库 https://www.21cq.com/mir/View.aspx?id=<n>（下表 src 字段即该件链接）；
// 沃玛/祖玛/赤月 各职业归属：https://www.21cq.com/mir/Suit.aspx 、https://zhidao.baidu.com/question/56230124.html
// 赤月（圣战/法神/天尊）数值互证：https://games.sina.com.cn/z/woool/2003-10-17/56400.shtml
// 本文件不依赖 items.ts（避免循环引用）；items.ts 合并 NEW_EQUIP 并给每件挂 EQUIP_META。
import type { ItemDef } from '../combat/types';

export type Cls = 'warrior' | 'mage' | 'taoist';
export const ALL_CLS: Cls[] = ['warrior', 'mage', 'taoist'];
/** 官方需求类型：等级 / 攻击力 / 魔法力 / 精神力 */
export type NeedKind = 'level' | 'atk' | 'mag' | 'tao';
export interface Need { kind: NeedKind; v: number }
export type Range = [number, number];
export interface OffStats { atk?: Range; mag?: Range; tao?: Range; def?: Range; mdef?: Range; extra?: string }
export type Tier = 'base' | 'woma' | 'zuma' | 'chiyue';
export interface EquipMeta {
  /** 官方对应物名；'自创' = 1.76 无此物品 */
  official: string;
  /** 21cq 物品 id（View.aspx?id=），自创/未查到为 0 */
  cq: number;
  /** 官方需求；undefined = 未查到/自创 */
  need?: Need;
  /** 官方属性区间（未查到 = undefined） */
  off?: OffStats;
  /** 职业限制（undefined/空 = 通用）。1.76 无硬职业锁，按官方需求类型推导：攻击力→战士、魔法力→法师、精神力→道士 */
  cls?: Cls[];
  tier?: Tier;
  /** 'r18' = 沿用存量数值；'v1' = 本表按 [适配] 系数生成 */
  origin: 'r18' | 'v1';
  note?: string;
}
export const CQ = (n: number) => `https://www.21cq.com/mir/View.aspx?id=${n}`;
export const NEED_CN: Record<NeedKind, string> = { level: '等级', atk: '攻击力', mag: '魔法力', tao: '精神力' };

/**
 * [适配] 系数（v1 新增件）：卡牌属性 = 官方区间中值 × 系数，四舍五入；
 *   攻击 ×2、魔法/道术 ×4、防御 ×3、生命 = 适配后防御 ×8；魔御 ×3（#10 魔防：与防御同系数，不折算生命；存量 r18 件同样回填）；准确/敏捷/攻速 卡牌无对应属性 → 不换算（文档列出）。
 * （与 R13 存量「上限×1.5/3/2.3」对齐：常见区间中值≈0.75×上限 → 中值×2/4/3 ≈ 上限×1.5/3/2.3。）
 * 需求等级 req（本作唯一门槛）：官方为等级需求 → 取官方值；为攻击力/魔法力/精神力 → 按档次 [适配]：沃玛 24、祖玛 30、赤月 35、黑铁头盔 30。
 */
export const ADAPT = { atk: 2, mag: 4, tao: 4, def: 3, mdef: 3, hpPerDef: 8 } as const;
export const TIER_REQ: Record<Exclude<Tier, 'base'>, number> = { woma: 24, zuma: 30, chiyue: 35 };
const mid = (r?: Range) => (r ? (r[0] + r[1]) / 2 : 0);
/** [适配] 魔御 = 官方魔御区间中值 × 3，四舍五入 */
export const adaptMdef = (o?: OffStats) => Math.round(mid(o?.mdef) * ADAPT.mdef);
export function adapt(o: OffStats): Partial<Record<'atk' | 'mag' | 'tao' | 'def' | 'hp' | 'mdef', number>> {
  const r: Record<string, number> = {};
  const atk = Math.round(mid(o.atk) * ADAPT.atk), mag = Math.round(mid(o.mag) * ADAPT.mag), tao = Math.round(mid(o.tao) * ADAPT.tao), def = Math.round(mid(o.def) * ADAPT.def);
  if (atk) r.atk = atk; if (mag) r.mag = mag; if (tao) r.tao = tao; if (def) { r.def = def; r.hp = def * ADAPT.hpPerDef; }
  const mdef = adaptMdef(o); if (mdef) r.mdef = mdef;
  return r;
}
const clsOf = (n?: Need): Cls[] | undefined => !n || n.kind === 'level' ? undefined : [n.kind === 'atk' ? 'warrior' : n.kind === 'mag' ? 'mage' : 'taoist'];
const L = (v: number): Need => ({ kind: 'level', v }), A = (v: number): Need => ({ kind: 'atk', v }), M = (v: number): Need => ({ kind: 'mag', v }), T = (v: number): Need => ({ kind: 'tao', v });

/** 存量装备（R2/R13/R18）去重盘点：id → 官方对应物。数值不动（保旧档与平衡），仅 guyu 修正（见 note）。 */
const OLD: Record<string, Omit<EquipMeta, 'origin' | 'cls'> & { cls?: Cls[] }> = {
  wood_sword: { official: '木剑', cq: 80, need: L(1), off: { atk: [2, 5] } },
  iron_sword: { official: '铁剑', cq: 85, need: L(10), off: { atk: [5, 9] }, note: '本作 req4（R2 存量，保留）' },
  magic_staff: { official: '魔杖', cq: 100, need: L(26), off: { atk: [5, 9], mag: [2, 5] }, tier: 'woma', note: '本作 req6（R2 存量，保留）' },
  tao_sword: { official: '银蛇', cq: 101, need: L(26), off: { atk: [7, 14], tao: [1, 3], extra: '准确+1' }, tier: 'woma', note: '本作名「银蛇剑」、req6（R2 存量，保留）' },
  dragon_sword: { official: '屠龙', cq: 108, need: L(34), off: { atk: [5, 35] }, note: '本作名「屠龙刀」、req15（R2 存量，保留）' },
  short_sword: { official: '短剑', cq: 84, need: L(10), off: { atk: [3, 11] } },
  bronze_sword: { official: '青铜剑', cq: 83, need: L(5), off: { atk: [3, 7] } },
  dagger: { official: '匕首', cq: 81, need: L(1), note: '21cq id=81 页面无数据（未查到）；gap 文档 S3：攻 4-5' },
  ebony_sword: { official: '乌木剑', cq: 82, need: L(1), off: { atk: [4, 8], mag: [0, 1] } },
  bronze_axe: { official: '青铜斧', cq: 87, need: L(13), off: { atk: [0, 15] } },
  bahuang: { official: '八荒', cq: 89, need: L(15), off: { atk: [4, 12] } },
  banyue: { official: '半月', cq: 91, need: L(15), off: { atk: [5, 10], mag: [0, 1], tao: [1, 1] } },
  haihun: { official: '海魂', cq: 90, need: L(15), off: { atk: [3, 10], mag: [1, 2] } },
  lingfeng: { official: '凌风', cq: 92, need: L(19), off: { atk: [6, 12] } },
  xiangmo: { official: '降魔', cq: 96, need: L(20), off: { atk: [6, 11], tao: [1, 2], extra: '准确+1' } },
  yanyue: { official: '偃月', cq: 95, need: L(20), off: { atk: [4, 10], mag: [1, 3] } },
  xiuluo: { official: '修罗', cq: 97, need: L(22), off: { atk: [0, 20] } },
  zhanma: { official: '斩马刀', cq: 94, need: L(20), off: { atk: [5, 15] } },
  pohun: { official: '破魂', cq: 93, need: L(20), off: { atk: [8, 10], extra: '准确+2' } },
  ningshuang: { official: '凝霜', cq: 98, need: L(25), off: { atk: [10, 13] } },
  lianyu: { official: '炼狱', cq: 99, need: L(26), off: { atk: [0, 25] }, tier: 'woma' },
  jingzhongyue: { official: '井中月', cq: 102, need: L(28), off: { atk: [7, 22] }, tier: 'woma' },
  wujigun: { official: '无极棍', cq: 104, need: T(25), off: { atk: [8, 16], tao: [3, 5] }, tier: 'woma' },
  longwen: { official: '龙纹剑', cq: 107, need: L(35), off: { atk: [8, 20], tao: [3, 6] }, tier: 'zuma' },
  caijue: { official: '裁决之杖', cq: 105, need: L(30), off: { atk: [0, 30] }, tier: 'zuma' },
  guyu: { official: '骨玉权杖', cq: 106, need: L(35), off: { atk: [6, 12], mag: [2, 6] }, tier: 'zuma', note: 'R13 误写为 道术+12；v1 按官方改为 魔法（R13 规则 上限6×3=18）；本作 req26（保留）' },
  cloth: { official: '布衣(男/女)', cq: 116, need: L(1), off: { def: [0, 2], mdef: [0, 1] } },
  light_armor: { official: '轻型盔甲(男/女)', cq: 118, need: L(11), off: { def: [3, 3], mdef: [1, 2] } },
  armor: { official: '重盔甲(男/女)', cq: 122, need: L(22), off: { def: [4, 7], mdef: [2, 3] }, note: '本作 req12（R2 存量，保留）' },
  magic_robe: { official: '魔法长袍(男/女)', cq: 124, need: L(22), off: { mag: [0, 2], def: [3, 5], mdef: [3, 4] } },
  soul_robe: { official: '灵魂战衣(男/女)', cq: 126, need: L(22), off: { tao: [0, 2], def: [3, 6], mdef: [3, 3] } },
  war_armor: { official: '战神盔甲(男/女)', cq: 128, need: A(46), off: { def: [5, 9], mdef: [3, 5] }, tier: 'zuma' },
  demon_robe: { official: '恶魔长袍(男/女)', cq: 130, need: M(28), off: { mag: [1, 4], def: [4, 7], mdef: [3, 4] }, tier: 'zuma' },
  ghost_robe: { official: '幽灵战衣(男/女)', cq: 132, need: T(27), off: { tao: [1, 4], def: [4, 7], mdef: [3, 4] }, tier: 'zuma' },
  helmet: { official: '青铜头盔', cq: 147, need: L(10), off: { def: [0, 1] }, note: '本作 req3（R2 存量，保留）' },
  magic_helm: { official: '魔法头盔', cq: 148, need: L(14), off: { def: [0, 1], mdef: [1, 1] } },
  tao_helm: { official: '道士头盔', cq: 149, need: L(24), off: { def: [1, 2], mdef: [2, 3] } },
  bone_helm: { official: '骷髅头盔', cq: 150, need: A(30), off: { def: [2, 3] }, note: '本作 req10（R2 存量，保留）' },
  gold_ring: { official: '金戒指', cq: 206, need: L(22), off: { atk: [1, 1], mag: [1, 1], tao: [1, 1], mdef: [0, 3] }, note: '本作 req9（R2 存量，保留）' },
  pearl: { official: '自创', cq: 0, note: '黑珍珠项链：1.76 无此物品' },
  iron_ring: { official: '自创', cq: 0, note: '铁戒指：1.76 无此物品' },
  bracelet: { official: '自创', cq: 0, note: '翡翠手镯：1.76 无此物品' },
  boots: { official: '自创', cq: 0, note: '铁靴：1.76 无靴子栏（手游/后续版本）' },
  set_woma_helm: { official: '自创', cq: 0, tier: 'woma', note: '沃玛头盔：1.76 无此物品（沃玛为档次名）' },
  set_woma_necklace: { official: '自创', cq: 0, tier: 'woma', note: '沃玛项链：1.76 无此物品' },
  set_woma_bracelet: { official: '自创', cq: 0, tier: 'woma', note: '沃玛手镯：1.76 无此物品' },
  set_zuma_helm: { official: '自创', cq: 0, tier: 'zuma', note: '祖玛头盔：1.76 无此物品' },
  set_zuma_ring: { official: '自创', cq: 0, tier: 'zuma', note: '祖玛戒指：1.76 无此物品' },
  set_zuma_boots: { official: '自创', cq: 0, tier: 'zuma', note: '祖玛靴：1.76 无此物品' },
  set_chiyue_necklace: { official: '自创', cq: 0, tier: 'chiyue', note: '赤月项链：1.76 无此物品（赤月级为圣战/法神/天尊）' },
  set_chiyue_ring: { official: '自创', cq: 0, tier: 'chiyue', note: '赤月戒指：1.76 无此物品' },
  set_chiyue_bracelet: { official: '自创', cq: 0, tier: 'chiyue', note: '赤月手镯：1.76 无此物品' },
};

type NewSpec = { id: string; name: string; slot: ItemDef['slot']; cq: number; need: Need; off: OffStats; tier: Tier; icon: string; price: number };
const I = 'assets/items/';
/** v1 新增：沃玛/祖玛/赤月 × 三职业 × 项链/戒指/手镯 + 赤月头盔 + 黑铁头盔 + 中型盔甲。price = 官方出售价/100（同 R13）。 */
const NEW: NewSpec[] = [
  // 沃玛首饰（21cq Suit.aspx：战士/法师/道士沃玛套装）
  { id: 'ghost_necklace', name: '幽灵项链', slot: 'necklace', cq: 168, need: L(24), off: { atk: [0, 5] }, tier: 'woma', icon: I + 'set_woma_necklace.png', price: 100 },
  { id: 'dragon_ring', name: '龙之戒指', slot: 'ring', cq: 212, need: A(37), off: { atk: [0, 5] }, tier: 'woma', icon: I + 'INV_Jewelry_Ring_02.png', price: 200 },
  { id: 'ghost_glove', name: '幽灵手套', slot: 'bracelet', cq: 189, need: L(25), off: { def: [0, 3] }, tier: 'woma', icon: I + 'set_woma_bracelet.png', price: 80 },
  { id: 'life_necklace', name: '生命项链', slot: 'necklace', cq: 169, need: M(25), off: { mag: [1, 5], extra: '准确+1' }, tier: 'woma', icon: I + 'set_woma_necklace.png', price: 100 },
  { id: 'ruby_ring', name: '红宝石戒指', slot: 'ring', cq: 213, need: M(17), off: { mag: [0, 4] }, tier: 'woma', icon: I + 'INV_Jewelry_Ring_04.png', price: 150 },
  { id: 'sibeier_bracelet', name: '思贝儿手镯', slot: 'bracelet', cq: 190, need: M(24), off: { mag: [0, 2] }, tier: 'woma', icon: I + 'set_woma_bracelet.png', price: 100 },
  { id: 'tianzhu_necklace', name: '天珠项链', slot: 'necklace', cq: 170, need: T(22), off: { tao: [1, 5] }, tier: 'woma', icon: I + 'set_woma_necklace.png', price: 100 },
  { id: 'platinum_ring', name: '铂金戒指', slot: 'ring', cq: 214, need: T(17), off: { tao: [0, 4] }, tier: 'woma', icon: I + 'INV_Jewelry_Ring_05.png', price: 150 },
  { id: 'heart_bracelet', name: '心灵手镯', slot: 'bracelet', cq: 195, need: T(24), off: { tao: [1, 2] }, tier: 'woma', icon: I + 'set_woma_bracelet.png', price: 130 },
  // 祖玛首饰
  { id: 'green_necklace', name: '绿色项链', slot: 'necklace', cq: 171, need: A(39), off: { atk: [2, 5] }, tier: 'zuma', icon: I + 'gen_necklace.png', price: 200 },
  { id: 'power_ring', name: '力量戒指', slot: 'ring', cq: 215, need: A(46), off: { atk: [0, 6] }, tier: 'zuma', icon: I + 'set_zuma_ring.png', price: 200 },
  { id: 'knight_bracelet', name: '骑士手镯', slot: 'bracelet', cq: 193, need: A(39), off: { atk: [2, 2] }, tier: 'zuma', icon: I + 'gen_bracelet.png', price: 150 },
  { id: 'demon_bell', name: '恶魔铃铛', slot: 'necklace', cq: 172, need: M(27), off: { mag: [0, 7], extra: '准确+2' }, tier: 'zuma', icon: I + 'gen_necklace.png', price: 250 },
  { id: 'zibiluo', name: '紫碧螺', slot: 'ring', cq: 216, need: M(24), off: { mag: [0, 5] }, tier: 'zuma', icon: I + 'set_zuma_ring.png', price: 150 },
  { id: 'dragon_bracelet', name: '龙之手镯', slot: 'bracelet', cq: 194, need: M(28), off: { mag: [0, 3] }, tier: 'zuma', icon: I + 'gen_bracelet.png', price: 120 },
  { id: 'soul_necklace', name: '灵魂项链', slot: 'necklace', cq: 173, need: T(23), off: { tao: [1, 6], extra: '准确+2' }, tier: 'zuma', icon: I + 'gen_necklace.png', price: 250 },
  { id: 'titan_ring', name: '泰坦戒指', slot: 'ring', cq: 217, need: T(24), off: { tao: [2, 6] }, tier: 'zuma', icon: I + 'set_zuma_ring.png', price: 150 },
  { id: 'sanyan_bracelet', name: '三眼手镯', slot: 'bracelet', cq: 191, need: T(22), off: { tao: [1, 3], def: [1, 1] }, tier: 'zuma', icon: I + 'gen_bracelet.png', price: 100 },
  // 赤月：圣战（战）/法神（法）/天尊（道）头盔+项链+戒指+手镯
  { id: 'shengzhan_helm', name: '圣战头盔', slot: 'helmet', cq: 232, need: A(40), off: { atk: [0, 1], def: [4, 5], mdef: [2, 3] }, tier: 'chiyue', icon: I + 'INV_Helmet_04.png', price: 350 },
  { id: 'shengzhan_necklace', name: '圣战项链', slot: 'necklace', cq: 233, need: A(40), off: { atk: [3, 6] }, tier: 'chiyue', icon: I + 'set_chiyue_necklace.png', price: 350 },
  { id: 'shengzhan_ring', name: '圣战戒指', slot: 'ring', cq: 235, need: A(40), off: { atk: [0, 7], mdef: [0, 1] }, tier: 'chiyue', icon: I + 'set_chiyue_ring.png', price: 350 },
  { id: 'shengzhan_bracelet', name: '圣战手镯', slot: 'bracelet', cq: 234, need: A(40), off: { atk: [2, 3], def: [0, 1] }, tier: 'chiyue', icon: I + 'set_chiyue_bracelet.png', price: 350 },
  { id: 'fashen_helm', name: '法神头盔', slot: 'helmet', cq: 236, need: M(28), off: { mag: [0, 1], def: [4, 4], mdef: [1, 2] }, tier: 'chiyue', icon: I + 'INV_Helmet_05.png', price: 350 },
  { id: 'fashen_necklace', name: '法神项链', slot: 'necklace', cq: 237, need: M(28), off: { mag: [1, 8], extra: '准确+2' }, tier: 'chiyue', icon: I + 'set_chiyue_necklace.png', price: 350 },
  { id: 'fashen_ring', name: '法神戒指', slot: 'ring', cq: 239, need: M(28), off: { mag: [1, 6], mdef: [0, 1] }, tier: 'chiyue', icon: I + 'set_chiyue_ring.png', price: 350 },
  { id: 'fashen_bracelet', name: '法神手镯', slot: 'bracelet', cq: 238, need: M(28), off: { mag: [0, 4], def: [0, 1] }, tier: 'chiyue', icon: I + 'set_chiyue_bracelet.png', price: 350 },
  { id: 'tianzun_helm', name: '天尊头盔', slot: 'helmet', cq: 240, need: T(25), off: { tao: [0, 1], def: [4, 4], mdef: [1, 2] }, tier: 'chiyue', icon: I + 'INV_Helmet_02.png', price: 350 },
  { id: 'tianzun_necklace', name: '天尊项链', slot: 'necklace', cq: 241, need: T(25), off: { tao: [2, 7], extra: '准确+2' }, tier: 'chiyue', icon: I + 'set_chiyue_necklace.png', price: 350 },
  { id: 'tianzun_ring', name: '天尊戒指', slot: 'ring', cq: 243, need: T(25), off: { tao: [2, 7], mdef: [0, 1] }, tier: 'chiyue', icon: I + 'set_chiyue_ring.png', price: 350 },
  { id: 'tianzun_bracelet', name: '天尊手镯', slot: 'bracelet', cq: 242, need: T(25), off: { tao: [1, 4], def: [1, 2] }, tier: 'chiyue', icon: I + 'set_chiyue_bracelet.png', price: 350 },
  // 其它等级段补缺
  { id: 'black_iron_helm', name: '黑铁头盔', slot: 'helmet', cq: 151, need: A(46), off: { def: [4, 5], mdef: [2, 3] }, tier: 'zuma', icon: I + 'INV_Helmet_04.png', price: 250 },
  { id: 'medium_armor', name: '中型盔甲', slot: 'armor', cq: 120, need: L(16), off: { def: [3, 5], mdef: [1, 2] }, tier: 'base', icon: I + 'INV_Chest_Plate02.png', price: 60 },
];
const reqOf = (s: NewSpec) => s.need.kind === 'level' ? s.need.v : s.id === 'black_iron_helm' ? 30 : TIER_REQ[s.tier as Exclude<Tier, 'base'>];

export const NEW_EQUIP: Record<string, ItemDef> = Object.fromEntries(NEW.map(s => [s.id,
  { id: s.id, name: s.name, icon: s.icon, slot: s.slot, equip: adapt(s.off), req: reqOf(s), price: s.price, cls: clsOf(s.need) } as ItemDef]));

export const EQUIP_META: Record<string, EquipMeta> = {
  ...Object.fromEntries(Object.entries(OLD).map(([id, m]) => [id, { ...m, cls: m.cls ?? clsOf(m.need), origin: 'r18' as const }])),
  ...Object.fromEntries(NEW.map(s => [s.id, { official: s.name, cq: s.cq, need: s.need, off: s.off, cls: clsOf(s.need), tier: s.tier, origin: 'v1' as const }])),
};
/** 存量（R18 及以前）装备 id —— 旧存档里可能出现，必须永远有效 */
export const LEGACY_EQUIP_IDS = Object.keys(OLD);
