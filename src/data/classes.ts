// 三职业：基础属性、每级成长、技能（Q W E R）。技能伤害 = 对应属性 × mult × (1 + 0.02×(等级-1))
import { Stats } from '../combat/types';
export type ClassId = 'warrior' | 'mage' | 'taoist';
export type SkillKind = 'melee' | 'pierce' | 'ranged' | 'aoe' | 'dot' | 'buff' | 'summon';
export interface SkillDef {
  key: string; id: string; name: string; kind: SkillKind; stat: 'atk' | 'mag' | 'tao';
  mana: number; cooldown: number; mult?: number; pierce?: number; range?: number;
  duration?: number; reduce?: number; slow?: number; heal?: number; unlock?: number; icon: string; sfx: string; desc: string;
  /** 官方（docs/skills-official.md）：Lv0..Lv3 人物等级要求 */
  learn?: number[];
  /** 官方：升 Lv1/Lv2/Lv3 所需修炼点 */
  train?: number[];
  /** 官方各级倍率（Lv0..3），战士剑法用 */
  lvMult?: number[];
  /** 攻杀剑术：各级附加伤害与几率（官方 C） */
  lvBonus?: number[]; lvChance?: number[];
  passive?: boolean;
  /** 每级持续时间增量 [适配] */
  durPerLv?: number;
}
export interface ClassDef {
  id: ClassId; name: string; art: string; bg: number; artFacing: 1 | -1; atkInterval: number;
  base: Stats; grow: Stats; skills: SkillDef[]; desc: string; autoStat: 'atk' | 'mag' | 'tao';
}
const S = 'assets/skills/';
export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior', name: '战士', art: 'hero', bg: 0x2a2a2e, artFacing: 1, atkInterval: 1.1, autoStat: 'atk',
    // [适配] 改用官方学习等级后战士 19 级前无主动技能，提高基础/成长保持模拟死亡 1–4 次（R4 技能轮）
    base: { hp: 800, mp: 120, atk: 70, mag: 0, tao: 0, def: 26 }, grow: { hp: 90, mp: 9, atk: 11, mag: 0, tao: 0, def: 4 },
    desc: '近战肉盾，高血高防\n攻杀·刺杀·半月·烈火（19/25/28/35 级学习）',
    skills: [
      { key: 'F1', id: 'slaying', name: '攻杀剑术', kind: 'melee', stat: 'atk', mana: 0, cooldown: 0, passive: true, learn: [19, 19, 22, 24], train: [4000, 8000, 16000], lvBonus: [5, 6, 7, 8], lvChance: [1 / 10, 1 / 8, 1 / 6, 1 / 4], icon: S + 'skill_slaying.png', sfx: 'cleave', desc: '被动：普攻有几率附加伤害' },
      { key: 'F2', id: 'thrust', name: '刺杀剑术', kind: 'pierce', stat: 'atk', mana: 0, cooldown: 2, pierce: 2, learn: [25, 25, 27, 29], train: [6000, 12000, 18000], lvMult: [0.4, 0.6, 0.8, 1], icon: S + 'skill_thrust.png', sfx: 'cleave', desc: '攻击前方 2 格：前排 100%，第 2 格按等级' },
      { key: 'F3', id: 'half_moon', name: '半月弯刀', kind: 'pierce', stat: 'atk', mana: 0, cooldown: 3, pierce: 3, learn: [28, 28, 31, 34], train: [8000, 16000, 24000], lvMult: [0.15, 0.23, 0.31, 0.38], icon: S + 'skill_half_moon.png', sfx: 'cleave', desc: '主目标 100%，周围其他敌人按等级' },
      { key: 'F4', id: 'fire_sword', name: '烈火剑法', kind: 'melee', stat: 'atk', mana: 0, cooldown: 6, learn: [35, 35, 37, 40], train: [2000, 4000, 6000], lvMult: [1.4, 1.8, 2.2, 2.6], icon: S + 'skill_fire_sword.png', sfx: 'fireball_impact', desc: '火精灵附剑，对前排造成倍数伤害' },
    ],
  },
  mage: {
    id: 'mage', name: '法师', art: 'mage', bg: 0x1c3a7a, artFacing: 1, atkInterval: 1.3, autoStat: 'mag',
    // [适配] 法师 7 级前无技能，同上提高基础/成长（R4 技能轮）
    base: { hp: 480, mp: 240, atk: 10, mag: 90, tao: 0, def: 12 }, grow: { hp: 36, mp: 20, atk: 1, mag: 7.5, tao: 0, def: 1.4 },
    desc: '远程法术，高爆发低血量\n火球·雷电·魔法盾·冰咆哮',
    skills: [
      { key: 'F1', id: 'fireball', name: '火球术', kind: 'ranged', stat: 'mag', mana: 12, cooldown: 1.6, mult: 2.2, range: 520, learn: [7, 7, 11, 16], train: [500, 1500, 3000], icon: S + 'skill_fireball.png', sfx: 'fireball_cast', desc: '远程火球，杀伤随修炼等级提升' },
      { key: 'F2', id: 'thunder', name: '雷电术', kind: 'ranged', stat: 'mag', mana: 36, cooldown: 4, mult: 3.6, range: 560, learn: [17, 17, 20, 23], train: [1200, 3000, 5000], icon: S + 'skill_thunder.png', sfx: 'shockwave', desc: '天雷落下，单体高伤' },
      { key: 'F3', id: 'magic_shield', name: '魔法盾', kind: 'buff', stat: 'mag', mana: 60, cooldown: 20, duration: 12, durPerLv: 4, reduce: 0.4, learn: [31, 31, 34, 38], train: [4000, 8000, 12000], icon: S + 'skill_magic_shield.png', sfx: 'heal2', desc: '减低受到的伤害 40%，等级越高持续越久' },
      { key: 'F4', id: 'ice_roar', name: '冰咆哮', kind: 'aoe', stat: 'mag', mana: 36, cooldown: 7, mult: 1.6, range: 420, duration: 4, slow: 0.5, learn: [35, 35, 37, 40], train: [4000, 8000, 12000], icon: S + 'skill_ice_roar.png', sfx: 'shockwave2', desc: '暴风雪攻击范围内全部敌人并减速' },
    ],
  },
  taoist: {
    id: 'taoist', name: '道士', art: 'taoist', bg: 0x7a5c14, artFacing: 1, atkInterval: 1.2, autoStat: 'tao',
    base: { hp: 270, mp: 190, atk: 16, mag: 0, tao: 28, def: 4 }, grow: { hp: 28, mp: 15, atk: 2, mag: 0, tao: 4.5, def: 1 },
    desc: '召唤骷髅协战，施毒持续伤害\n治愈术·灵魂火符',
    skills: [
      { key: 'F1', id: 'heal', name: '治愈术', kind: 'buff', stat: 'tao', mana: 12, cooldown: 4, heal: 2.5, learn: [7, 7, 11, 16], train: [500, 1500, 3000], icon: S + 'skill_heal.png', sfx: 'heal', desc: '恢复自身生命（随修炼等级提升）' },
      { key: 'F2', id: 'poison', name: '施毒术', kind: 'dot', stat: 'tao', mana: 12, cooldown: 3, mult: 0.6, range: 500, duration: 8, durPerLv: 2, learn: [14, 14, 17, 20], train: [1000, 2000, 4000], icon: S + 'skill_poison.png', sfx: 'summon2', desc: '中毒持续掉血，等级越高持续越久' },
      { key: 'F3', id: 'soul_fire', name: '灵魂火符', kind: 'ranged', stat: 'tao', mana: 15, cooldown: 1.5, mult: 2.0, range: 500, learn: [18, 18, 21, 24], train: [2000, 4000, 6000], icon: S + 'skill_soul_fire.png', sfx: 'fireball_cast', desc: '驱使护身符远程攻击' },
      { key: 'F4', id: 'summon_skeleton', name: '召唤骷髅', kind: 'summon', stat: 'tao', mana: 50, cooldown: 12, unlock: 1, learn: [1, 19, 23, 26], train: [2000, 4000, 8000], icon: S + 'skill_summon_skeleton.png', sfx: 'summon', desc: '召唤骷髅协同作战（已存在则治疗）；骷髅随技能等级变强' },
    ],
  },
};
export const CLASS_IDS: ClassId[] = ['warrior', 'mage', 'taoist'];
