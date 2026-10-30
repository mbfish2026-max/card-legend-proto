// 三职业：基础属性、每级成长、技能（Q W E R）。技能伤害 = 对应属性 × mult × (1 + 0.02×(等级-1))
import { Stats } from '../combat/types';
export type ClassId = 'warrior' | 'mage' | 'taoist';
export type SkillKind = 'melee' | 'pierce' | 'ranged' | 'aoe' | 'dot' | 'buff' | 'summon';
export interface SkillDef {
  key: string; id: string; name: string; kind: SkillKind; stat: 'atk' | 'mag' | 'tao';
  mana: number; cooldown: number; mult?: number; pierce?: number; range?: number;
  duration?: number; reduce?: number; slow?: number; heal?: number; icon: string; sfx: string; desc: string;
}
export interface ClassDef {
  id: ClassId; name: string; art: string; bg: number; artFacing: 1 | -1; atkInterval: number;
  base: Stats; grow: Stats; skills: SkillDef[]; desc: string; autoStat: 'atk' | 'mag' | 'tao';
}
const S = 'assets/skills/';
export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior', name: '战士', art: 'hero', bg: 0x2a2a2e, artFacing: 1, atkInterval: 1.1, autoStat: 'atk',
    base: { hp: 320, mp: 120, atk: 30, mag: 0, tao: 0, def: 6 }, grow: { hp: 34, mp: 9, atk: 5, mag: 0, tao: 0, def: 1.4 },
    desc: '近战肉盾，高血高防\n烈火剑法爆发、半月弯刀穿透',
    skills: [
      { key: 'Q', id: 'fire_sword', name: '烈火剑法', kind: 'melee', stat: 'atk', mana: 30, cooldown: 4, mult: 3, icon: S + 'Ability_Warrior_SavageBlow.png', sfx: 'fireball_impact', desc: '对前排造成 300% 攻击伤害' },
      { key: 'W', id: 'half_moon', name: '半月弯刀', kind: 'pierce', stat: 'atk', mana: 35, cooldown: 6, mult: 1.5, pierce: 3, icon: S + 'Ability_Warrior_Cleave.png', sfx: 'cleave', desc: '穿透前 3 个敌人，150% 攻击' },
      { key: 'E', id: 'shadow_slash', name: '暗影斩击', kind: 'melee', stat: 'atk', mana: 30, cooldown: 5, mult: 2.2, icon: S + 'Ability_Warrior_Revenge.png', sfx: 'summon', desc: '暗影撕裂前排，220% 攻击' },
      { key: 'R', id: 'battle_shout', name: '金刚护体', kind: 'buff', stat: 'atk', mana: 40, cooldown: 18, duration: 8, reduce: 0.5, icon: S + 'Ability_Warrior_ShieldWall.png', sfx: 'shout', desc: '8 秒内受到伤害降低 50%' },
    ],
  },
  mage: {
    id: 'mage', name: '法师', art: 'mage', bg: 0x1c3a7a, artFacing: 1, atkInterval: 1.3, autoStat: 'mag',
    base: { hp: 220, mp: 240, atk: 10, mag: 36, tao: 0, def: 3 }, grow: { hp: 22, mp: 20, atk: 1, mag: 6, tao: 0, def: 0.7 },
    desc: '远程法术，高爆发低血量\n冰咆哮群攻减速、魔法盾减伤',
    skills: [
      { key: 'Q', id: 'fireball', name: '火球术', kind: 'ranged', stat: 'mag', mana: 18, cooldown: 1.6, mult: 2.2, range: 520, icon: S + 'Spell_Fire_Fireball.png', sfx: 'fireball_cast', desc: '远程火球，220% 魔法' },
      { key: 'W', id: 'thunder', name: '雷电术', kind: 'ranged', stat: 'mag', mana: 32, cooldown: 4, mult: 3.6, range: 560, icon: S + 'Spell_Nature_Lightning.png', sfx: 'shockwave', desc: '天雷落下，360% 魔法' },
      { key: 'E', id: 'ice_roar', name: '冰咆哮', kind: 'aoe', stat: 'mag', mana: 45, cooldown: 7, mult: 1.6, range: 420, duration: 4, slow: 0.5, icon: S + 'Spell_Frost_FrostNova.png', sfx: 'shockwave2', desc: '周围所有敌人 160% 魔法并减速 4 秒' },
      { key: 'R', id: 'magic_shield', name: '魔法盾', kind: 'buff', stat: 'mag', mana: 50, cooldown: 20, duration: 12, reduce: 0.4, icon: S + 'Spell_Holy_Renew.png', sfx: 'heal2', desc: '12 秒内受到伤害降低 40%' },
    ],
  },
  taoist: {
    id: 'taoist', name: '道士', art: 'taoist', bg: 0x7a5c14, artFacing: 1, atkInterval: 1.2, autoStat: 'tao',
    base: { hp: 270, mp: 190, atk: 16, mag: 0, tao: 28, def: 4 }, grow: { hp: 28, mp: 15, atk: 2, mag: 0, tao: 4.5, def: 1 },
    desc: '召唤骷髅协战，施毒持续伤害\n神圣战甲减伤并回血',
    skills: [
      { key: 'Q', id: 'soul_fire', name: '灵魂火符', kind: 'ranged', stat: 'tao', mana: 15, cooldown: 1.5, mult: 2.0, range: 500, icon: S + 'Spell_Fire_FlameBolt.png', sfx: 'fireball_cast', desc: '远程火符，200% 道术' },
      { key: 'W', id: 'poison', name: '施毒术', kind: 'dot', stat: 'tao', mana: 20, cooldown: 3, mult: 0.6, range: 500, duration: 8, icon: S + 'Spell_Shadow_ShadowBolt.png', sfx: 'summon2', desc: '中毒 8 秒，每秒 60% 道术' },
      { key: 'E', id: 'summon_skeleton', name: '召唤骷髅', kind: 'summon', stat: 'tao', mana: 50, cooldown: 12, icon: S + 'Spell_Shadow_RaiseDead.png', sfx: 'summon', desc: '召唤一具骷髅协同作战（已存在则治疗）' },
      { key: 'R', id: 'holy_armor', name: '神圣战甲术', kind: 'buff', stat: 'tao', mana: 40, cooldown: 16, duration: 10, reduce: 0.3, heal: 2.5, icon: S + 'Spell_Holy_HolyBolt.png', sfx: 'heal', desc: '10 秒减伤 30%，并回复 250% 道术生命' },
    ],
  },
};
export const CLASS_IDS: ClassId[] = ['warrior', 'mage', 'taoist'];
