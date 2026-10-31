/** 击杀悬赏 + 成就称号（参考手游环式任务/成就永久加成，数值为本作适配）
 * 来源思路：[手机版资料库](https://mir.qq.com/act/a20150615data/xtjs.shtml) — 环式任务可接取；成就给称号永久加属性。
 * 具体击杀数/奖励为本作按层难度适配，非官方数值。
 */
import { Stats } from '../combat/types';

export interface QuestDef {
  id: string; floor: number; target: string; need: number; name: string;
  gold: number; exp: number;
}
export interface AchieveDef {
  id: string; name: string; title: string; desc: string;
  /** 永久属性加成（适配） */
  bonus: Partial<Stats>;
  /** 达成条件检查键 */
  kind: 'kills' | 'bosses' | 'enhance' | 'floors' | 'quests';
  need: number;
}

/** 每层 1 个悬赏：击杀本层常见怪 */
export const QUESTS: QuestDef[] = [
  { id: 'q0', floor: 0, target: 'wolf', need: 3, name: '清剿野狼', gold: 40, exp: 60 },
  { id: 'q1', floor: 2, target: 'spider', need: 4, name: '清剿毒蛛', gold: 80, exp: 120 },
  { id: 'q2', floor: 3, target: 'skeleton', need: 4, name: '镇压骷髅', gold: 100, exp: 160 },
  { id: 'q3', floor: 1, target: 'orc', need: 4, name: '击退兽人', gold: 60, exp: 90 },
  { id: 'q4', floor: 4, target: 'zombie', need: 3, name: '净化尸潮', gold: 120, exp: 200 },
  { id: 'q5', floor: 5, target: 'woma_warrior', need: 4, name: '讨伐沃玛', gold: 150, exp: 260 },
  { id: 'q6', floor: 6, target: 'zuma_statue', need: 3, name: '击碎祖玛', gold: 180, exp: 320 },
  { id: 'q7', floor: 7, target: 'blood_zombie', need: 3, name: '肃清赤月', gold: 220, exp: 400 },
];

export const ACHIEVES: AchieveDef[] = [
  { id: 'a_kills_30', name: '见习猎手', title: '见习猎手', desc: '累计击杀 30 只怪物', kind: 'kills', need: 30, bonus: { atk: 3, mag: 3, tao: 3 } },
  { id: 'a_kills_100', name: '猎魔者', title: '猎魔者', desc: '累计击杀 100 只怪物', kind: 'kills', need: 100, bonus: { atk: 8, mag: 8, tao: 8, hp: 80 } },
  { id: 'a_boss_3', name: '屠龙新秀', title: '屠龙新秀', desc: '击杀 3 种不同层 Boss', kind: 'bosses', need: 3, bonus: { def: 5, hp: 100 } },
  { id: 'a_boss_8', name: '传奇猎手', title: '传奇猎手', desc: '击杀 8 层全部 Boss', kind: 'bosses', need: 8, bonus: { atk: 12, mag: 12, tao: 12, def: 8 } },
  { id: 'a_enhance_5', name: '铁匠学徒', title: '铁匠学徒', desc: '任意装备强化到 +5', kind: 'enhance', need: 5, bonus: { def: 4 } },
  { id: 'a_floors_8', name: '探路者', title: '探路者', desc: '到达第 8 层', kind: 'floors', need: 8, bonus: { hp: 120, mp: 40 } },
  { id: 'a_quests_4', name: '悬赏猎人', title: '悬赏猎人', desc: '完成 4 个击杀悬赏', kind: 'quests', need: 4, bonus: { atk: 5, mag: 5, tao: 5 } },
];
