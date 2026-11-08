import type { ItemDef } from '../combat/types';
/**
 * 灵符商城价目表与商品物品定义（docs/lingfu-shop.md §2、§3、§7 P1–P7 推荐方案）。
 * 标注：[用户要求] = 简报给定；[适配] = 原版无对应数值、本原型自定；未查到 = 查不到官方来源。
 * 不售：顶级装备、祝福油、黑铁矿（P1）。
 */
export type ShopTab = 'hot' | 'summon' | 'grow' | 'supply' | 'util' | 'recharge';
export const SHOP_TABS: { id: ShopTab; name: string }[] = [
  { id: 'hot', name: '推荐' }, { id: 'summon', name: '召唤' }, { id: 'grow', name: '成长' }, { id: 'supply', name: '补给' }, { id: 'util', name: '便利' }, { id: 'recharge', name: '充值' },
];
export interface Product { sku: string; item: string; name: string; price: number; tab: Exclude<ShopTab, 'hot' | 'recharge'>; hot?: boolean; desc: string; note: string; limit?: number }

/** 血石：储量与佩戴等级 [用户要求]；回复节奏由战斗开发实现（tickStone） */
export const BLOODSTONES = {
  stone_s: { name: '血石（小）', hp: 20000, mp: 20000, req: 1, /* 用户要求：小血石无等级限制（原 30） */ price: 200 },
  stone_m: { name: '血石（中）', hp: 50000, mp: 50000, req: 35, price: 450 },
  stone_l: { name: '血石（大）', hp: 120000, mp: 120000, req: 40, price: 900 },
  stone_x: { name: '血石（特）', hp: 300000, mp: 300000, req: 45, price: 1800 },
} as const;
export type BloodstoneId = keyof typeof BLOODSTONES;
/** 回城石：10 次、30 秒冷却、无读条 [用户要求] */
export const RETURN_STONE_USES = 10, RETURN_STONE_CD_MS = 30_000;
/** 技巧项链：技能熟练度 ×5 [用户要求]（战斗开发在 addTrain 接入） */
export const SKILL_NECKLACE_MUL = 5;
/** 5 倍经验卷轴 [用户要求]：击杀经验 ×5，2 小时「在线游戏时间」；重复使用累加剩余时间，上限 8 小时 [适配]；
 *  价格 300 灵符为建议值（推导见 docs/exp-scroll.md §1），由用户定——只改 EXP_SCROLL_PRICE 一处 */
export const EXP_SCROLL_MUL = 5, EXP_SCROLL_SEC = 2 * 3600, EXP_SCROLL_MAX_SEC = 8 * 3600, EXP_SCROLL_PRICE = 300;
/** 召唤物直升等级 [用户要求] */
export const SUMMON_SCROLL_LV = 7;

const I = 'assets/items/';
const IC = 'assets/icons/'; // 美术2 art/lingfu-icons（75559c6）
/** 血石图标：特级 key 是 stone_x → bloodstone_xl.png */
export const BLOODSTONE_ICON: Record<string, string> = { stone_s: IC + 'bloodstone_s.png', stone_m: IC + 'bloodstone_m.png', stone_l: IC + 'bloodstone_l.png', stone_x: IC + 'bloodstone_xl.png' };
/** 商城物品定义（并入 ITEMS 由 items.ts 之外的 registerShopItems 完成，避免改动平衡模拟输入） */
export const SHOP_ITEMS: Record<string, ItemDef> = {
  summon_lv7_scroll: { id: 'summon_lv7_scroll', name: '召唤直升卷轴', icon: IC + 'shop_summon_scroll.png', price: 0 },
  exp_scroll: { id: 'exp_scroll', name: '5倍经验卷轴', icon: IC + 'shop_exp_scroll.png', price: 0 }, // 占位图（docs/art-requests.md 待美术）
  return_stone: { id: 'return_stone', name: '回城石', icon: IC + 'shop_return_stone.png', price: 0 },
  skill_necklace: { id: 'skill_necklace', name: '技巧项链', icon: IC + 'shop_skill_necklace.png', price: 0, slot: 'necklace', req: 1, equip: {} },
  ...Object.fromEntries(Object.entries(BLOODSTONES).map(([id, b]) => [id, { id, name: b.name, icon: BLOODSTONE_ICON[id] ?? I + 'eq_pearl.png', price: 0, slot: 'stone', req: b.req, equip: {} } as ItemDef])),
};

export const PRODUCTS: Product[] = [
  { sku: 'summon_lv7_scroll', item: 'summon_lv7_scroll', name: '召唤直升卷轴', price: 300, tab: 'summon', hot: true, desc: `场上道士召唤物与法师诱惑宠物升到 ${SUMMON_SCROLL_LV} 级（满级）。没有可升级目标不消耗`, note: '价格 [用户要求]；满级/无召唤物/替身与英雄不消耗。生存系数另见召唤物公式 [适配]，不改攻击' },
  { sku: 'exp_scroll', item: 'exp_scroll', name: '5倍经验卷轴', price: EXP_SCROLL_PRICE, tab: 'grow', hot: true, desc: `使用后 ${EXP_SCROLL_SEC / 3600} 小时内击杀经验 ×${EXP_SCROLL_MUL}（按在线游戏时间计，可续时，上限 ${EXP_SCROLL_MAX_SEC / 3600} 小时）`, note: '倍率/时长 [用户要求]；价格为建议值待定；上限 [适配]' },
  { sku: 'skill_necklace', item: 'skill_necklace', name: '技巧项链', price: 500, tab: 'grow', hot: true, desc: `佩戴后技能熟练度 ×${SKILL_NECKLACE_MUL}，占项链栏`, note: '价格/倍率 [用户要求]；无属性 [适配]' },
  ...(Object.entries(BLOODSTONES) as [BloodstoneId, typeof BLOODSTONES[BloodstoneId]][]).map(([id, b]) => ({
    sku: id, item: id, name: b.name, price: b.price, tab: 'supply' as const, hot: id === 'stone_s',
    desc: `血石栏佩戴，储量 生命/魔法 各 ${b.hp / 10000} 万；${b.req <= 1 ? '无等级限制' : b.req + ' 级可戴'}`, note: '储量/价格/等级 [用户要求]；回复速度 [适配] 未查到',
  })),
  { sku: 'return_stone', item: 'return_stone', name: '回城石', price: 100, tab: 'util', hot: true, desc: `无读条回到所在区域主城，${RETURN_STONE_USES} 次，冷却 ${RETURN_STONE_CD_MS / 1000} 秒`, note: '价格/次数/冷却 [用户要求]' },
];
export const PRODUCT_BY_SKU: Record<string, Product> = Object.fromEntries(PRODUCTS.map(p => [p.sku, p]));
export function productsOf(tab: ShopTab): Product[] { return tab === 'recharge' ? [] : tab === 'hot' ? PRODUCTS.filter(p => p.hot) : PRODUCTS.filter(p => p.tab === tab); }
/** 充值档位（只显示，置灰「未接入支付」） */
export const RECHARGE_TIERS = [6, 30, 68, 128, 328, 648].map(yuan => ({ yuan, lingfu: yuan * 10 }));
