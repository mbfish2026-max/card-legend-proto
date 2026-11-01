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
  stone_s: { name: '血石（小）', hp: 20000, mp: 20000, req: 30, price: 200 },
  stone_m: { name: '血石（中）', hp: 50000, mp: 50000, req: 35, price: 450 },
  stone_l: { name: '血石（大）', hp: 120000, mp: 120000, req: 40, price: 900 },
  stone_x: { name: '血石（特）', hp: 300000, mp: 300000, req: 45, price: 1800 },
} as const;
export type BloodstoneId = keyof typeof BLOODSTONES;
/** 回城石：10 次、30 秒冷却、无读条 [用户要求] */
export const RETURN_STONE_USES = 10, RETURN_STONE_CD_MS = 30_000;
/** 技巧项链：技能熟练度 ×5 [用户要求]（战斗开发在 addTrain 接入） */
export const SKILL_NECKLACE_MUL = 5;
/** 召唤物直升等级 [用户要求] */
export const SUMMON_SCROLL_LV = 7;

const I = 'assets/items/';
/** 商城物品定义（并入 ITEMS 由 items.ts 之外的 registerShopItems 完成，避免改动平衡模拟输入） */
export const SHOP_ITEMS: Record<string, ItemDef> = {
  summon_lv7_scroll: { id: 'summon_lv7_scroll', name: '召唤直升卷轴', icon: I + 'dungeon_scroll.png', price: 0 },
  return_stone: { id: 'return_stone', name: '回城石', icon: I + 'INV_Misc_Gem_Pearl_01.png', price: 0 },
  skill_necklace: { id: 'skill_necklace', name: '技巧项链', icon: I + 'eq_green_necklace.png', price: 0, slot: 'necklace', req: 1, equip: {} },
  ...Object.fromEntries(Object.entries(BLOODSTONES).map(([id, b]) => [id, { id, name: b.name, icon: I + 'eq_pearl.png', price: 0, slot: 'stone', req: b.req, equip: {} } as ItemDef])),
};

export const PRODUCTS: Product[] = [
  { sku: 'summon_lv7_scroll', item: 'summon_lv7_scroll', name: '召唤直升卷轴', price: 300, tab: 'summon', hot: true, desc: `场上召唤物直接升到 ${SUMMON_SCROLL_LV} 级（满级）`, note: '价格 [用户要求]；需有召唤物在场' },
  { sku: 'skill_necklace', item: 'skill_necklace', name: '技巧项链', price: 500, tab: 'grow', hot: true, desc: `佩戴后技能熟练度 ×${SKILL_NECKLACE_MUL}，占项链栏`, note: '价格/倍率 [用户要求]；无属性 [适配]' },
  ...(Object.entries(BLOODSTONES) as [BloodstoneId, typeof BLOODSTONES[BloodstoneId]][]).map(([id, b]) => ({
    sku: id, item: id, name: b.name, price: b.price, tab: 'supply' as const, hot: id === 'stone_s',
    desc: `血石栏佩戴，储量 生命/魔法 各 ${b.hp / 10000} 万；${b.req} 级可戴`, note: '储量/价格/等级 [用户要求]；回复速度 [适配] 未查到',
  })),
  { sku: 'return_stone', item: 'return_stone', name: '回城石', price: 100, tab: 'util', hot: true, desc: `无读条回到所在区域主城，${RETURN_STONE_USES} 次，冷却 ${RETURN_STONE_CD_MS / 1000} 秒`, note: '价格/次数/冷却 [用户要求]' },
];
export const PRODUCT_BY_SKU: Record<string, Product> = Object.fromEntries(PRODUCTS.map(p => [p.sku, p]));
export function productsOf(tab: ShopTab): Product[] { return tab === 'recharge' ? [] : tab === 'hot' ? PRODUCTS.filter(p => p.hot) : PRODUCTS.filter(p => p.tab === tab); }
/** 充值档位（只显示，置灰「未接入支付」） */
export const RECHARGE_TIERS = [6, 30, 68, 128, 328, 648].map(yuan => ({ yuan, lingfu: yuan * 10 }));
