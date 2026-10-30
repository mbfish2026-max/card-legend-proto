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
];
