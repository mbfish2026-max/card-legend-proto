import { CLASSES } from './classes';
export type { SkillDef } from './classes';
/** 兼容旧代码/测试：战士技能表 */
export const SKILLS = CLASSES.warrior.skills;
export const ARMOR_BUFF = { duration: 8, reduce: 0.5 };
export const POTIONS = [
  { key: '1', item: 'hp_small', hp: 120, mp: 0, count: 5, price: 20 },
  { key: '2', item: 'hp_mid', hp: 320, mp: 0, count: 2, price: 60 },
  { key: '3', item: 'mp_small', hp: 0, mp: 90, count: 5, price: 20 },
  { key: '4', item: 'mp_mid', hp: 0, mp: 240, count: 2, price: 60 },
  // feat/potion-expand：只追加到末尾（下标 4–7），旧 4 种下标/key 不动。key 用 P4–P7（非数字键，键盘 1–4 行为不变；药水栏按「格当前选中药」转发此 key）
  // lv = 药店等级门槛 [适配]；bundleOnly = 药店不卖散装（只卖捆）。instant（立刻回复）由战斗开发在 World.usePotion 接（docs/potion-expand.md §8）
  { key: 'P4', item: 'hp_big', hp: 560, mp: 0, count: 0, price: 360, lv: 40 },
  { key: 'P5', item: 'mp_big', hp: 0, mp: 900, count: 0, price: 180, lv: 40 },
  { key: 'P6', item: 'sun', hp: 180, mp: 240, count: 0, price: 300, lv: 40, instant: true },
  { key: 'P7', item: 'sun_big', hp: 300, mp: 480, count: 0, price: 600, lv: 40, instant: true, bundleOnly: true },
] as { key: string; item: string; hp: number; mp: number; count: number; price: number; lv?: number; instant?: boolean; bundleOnly?: boolean }[];
