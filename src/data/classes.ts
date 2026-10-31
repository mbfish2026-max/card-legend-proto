// 三职业：基础属性、每级成长、技能。技能伤害 = 对应属性 × mult × (1 + 0.02×(等级-1))
// 官方数据与适配标注见 docs/skills-official.md；本文件只写有据可依的技能。
import { Stats } from '../combat/types';
/** 职业基础/成长：魔御官方职业成长未查到 → 可省略（按 0） */
type ClassStats = Omit<Stats, 'mdef'> & { mdef?: number };
export type ClassId = 'warrior' | 'mage' | 'taoist';
export type SkillKind = 'melee' | 'pierce' | 'ranged' | 'aoe' | 'dot' | 'buff' | 'summon' | 'zone' | 'rush' | 'line' | 'blast' | 'charm';
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
  /** 基本剑术/精神力战法：准确 +N（官方 C）；[适配] 转为暴击率 +N% */
  accBonus?: number[];
  passive?: boolean;
  /** 每级持续时间增量 [适配] */
  durPerLv?: number;
  /** blast：以首个目标为中心的半径（px）[适配] */
  splash?: number;
  /** #12 幽灵盾/神圣战甲术：增益属性（mdef 魔御 / def 防御） */
  buffStat?: 'def' | 'mdef';
  /** #12 群体治愈术：以主角为中心的治疗半径（px）[适配] */
  area?: number;
}
export interface ClassDef {
  id: ClassId; name: string; art: string; bg: number; artFacing: 1 | -1; atkInterval: number;
  base: ClassStats; grow: ClassStats; skills: SkillDef[]; desc: string; autoStat: 'atk' | 'mag' | 'tao';
}
const S = 'assets/skills/';
export const CLASSES: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior', name: '战士', art: 'hero', bg: 0x2a2a2e, artFacing: 1, atkInterval: 1.1, autoStat: 'atk',
    // [适配] 改用官方学习等级后战士 19 级前无主动技能，提高基础/成长保持模拟死亡 1–4 次（R4 技能轮）
    base: { hp: 800, mp: 120, atk: 70, mag: 0, tao: 0, def: 26 }, grow: { hp: 110, mp: 9, atk: 11, mag: 0, tao: 0, def: 5.5 },
    desc: '近战肉盾，高血高防\n基本/攻杀被动 · 刺杀 · 半月 · 野蛮 · 烈火',
    skills: [
      // 被动不占 F 键；World.skills 只返回主动技能并重标 F1..
      { key: 'P', id: 'basic_sword', name: '基本剑术', kind: 'melee', stat: 'atk', mana: 0, cooldown: 0, passive: true, learn: [7, 7, 11, 16], train: [1000, 4000, 8000], accBonus: [3, 6, 9], icon: S + 'skill_basic_sword.png', sfx: 'cleave', desc: '被动：准确 +3/+6/+9（官方）；[适配] 转为暴击率' },
      { key: 'P', id: 'slaying', name: '攻杀剑术', kind: 'melee', stat: 'atk', mana: 0, cooldown: 0, passive: true, learn: [19, 19, 22, 24], train: [4000, 8000, 16000], lvBonus: [5, 6, 7, 8], lvChance: [1 / 10, 1 / 8, 1 / 6, 1 / 4], icon: S + 'skill_slaying.png', sfx: 'cleave', desc: '被动：普攻有几率附加伤害' },
      { key: 'F1', id: 'thrust', name: '刺杀剑术', kind: 'pierce', stat: 'atk', mana: 0, cooldown: 2, pierce: 2, learn: [25, 25, 27, 29], train: [6000, 12000, 18000], lvMult: [0.4, 0.6, 0.8, 1], icon: S + 'skill_thrust.png', sfx: 'cleave', desc: '攻击前方 2 格：前排 100%，第 2 格按等级' },
      { key: 'F2', id: 'half_moon', name: '半月弯刀', kind: 'pierce', stat: 'atk', mana: 0, cooldown: 3, pierce: 3, learn: [28, 28, 31, 34], train: [8000, 16000, 24000], lvMult: [0.15, 0.23, 0.31, 0.38], icon: S + 'skill_half_moon.png', sfx: 'cleave', desc: '主目标 100%，周围其他敌人按等级' },
      { key: 'F3', id: 'rush', name: '野蛮冲撞', kind: 'rush', stat: 'atk', mana: 0, cooldown: 8, mult: 0.5, range: 220, learn: [30, 30, 34, 39], train: [3000, 6000, 9000], icon: S + 'skill_rush.png', sfx: 'shout', desc: '撞开等级低于自己的目标（官方）；[适配] 附带 50% 攻击力伤害（伤害官方未查到）' },
      { key: 'F4', id: 'fire_sword', name: '烈火剑法', kind: 'melee', stat: 'atk', mana: 0, cooldown: 6, learn: [35, 35, 37, 40], train: [2000, 4000, 6000], lvMult: [1.4, 1.8, 2.2, 2.6], icon: S + 'skill_fire_sword.png', sfx: 'fireball_impact', desc: '火精灵附剑，对前排造成倍数伤害' },
    ],
  },
  mage: {
    id: 'mage', name: '法师', art: 'mage', bg: 0x1c3a7a, artFacing: 1, atkInterval: 1.3, autoStat: 'mag',
    // [适配] 法师 7 级前无技能，同上提高基础/成长（R4 技能轮）
    base: { hp: 300, mp: 240, atk: 10, mag: 90, tao: 0, def: 6 }, grow: { hp: 33, mp: 20, atk: 1, mag: 7, tao: 0, def: 1.2 },
    desc: '远程法术，高爆发低血量\n火球·雷电·火墙·魔法盾·冰咆哮\n大火球·爆裂·地狱火·疾光·雷光',
    skills: [
      { key: 'F1', id: 'fireball', name: '火球术', kind: 'ranged', stat: 'mag', mana: 12, cooldown: 1.6, mult: 2.2, range: 520, learn: [7, 7, 11, 16], train: [500, 1500, 3000], icon: S + 'skill_fireball.png', sfx: 'fireball_cast', desc: '远程火球，杀伤随修炼等级提升' },
      { key: 'F2', id: 'thunder', name: '雷电术', kind: 'ranged', stat: 'mag', mana: 36, cooldown: 4, mult: 3.6, range: 560, learn: [17, 17, 20, 23], train: [1200, 3000, 5000], icon: S + 'skill_thunder.png', sfx: 'shockwave', desc: '天雷落下，单体高伤' },
      { key: 'F3', id: 'fire_wall', name: '火墙', kind: 'zone', stat: 'mag', mana: 60, cooldown: 8, mult: 0.8, range: 420, duration: 6, durPerLv: 2, learn: [24, 24, 29, 33], train: [4000, 12000, 24000], icon: S + 'skill_fire_wall.png', sfx: 'fireball_impact', desc: '2×2 火墙持续燃烧（官方 A）；[适配] 落在目标脚下，每秒灼烧' },
      { key: 'F4', id: 'magic_shield', name: '魔法盾', kind: 'buff', stat: 'mag', mana: 60, cooldown: 20, duration: 12, durPerLv: 4, reduce: 0.4, learn: [31, 31, 34, 38], train: [4000, 8000, 12000], icon: S + 'skill_magic_shield.png', sfx: 'heal2', desc: '减低受到的伤害 40%，等级越高持续越久' },
      { key: 'F5', id: 'ice_roar', name: '冰咆哮', kind: 'aoe', stat: 'mag', mana: 36, cooldown: 7, mult: 1.6, range: 420, duration: 4, slow: 0.5, learn: [35, 35, 37, 40], train: [4000, 8000, 12000], icon: S + 'skill_ice_roar.png', sfx: 'shockwave2', desc: '暴风雪攻击范围内全部敌人并减速' },
      // #11 法师 5 技能：学习等级/修炼点 = 官方 C（21cq），耗魔 = D 私服 Spell ×3 [适配]，倍率/冷却/范围 [适配]（docs/skills-official.md #11）
      { key: 'F6', id: 'big_fireball', name: '大火球', kind: 'ranged', stat: 'mag', mana: 9, cooldown: 2, mult: 3.0, range: 560, learn: [19, 19, 23, 25], train: [8000, 14000, 25000], icon: S + 'skill_fireball.png', sfx: 'fireball_cast', desc: '远程单体大火球（官方）；[适配] 倍率 3.0' },
      { key: 'F7', id: 'burst_fire', name: '爆裂火焰', kind: 'blast', stat: 'mag', mana: 45, cooldown: 5, mult: 1.8, range: 520, splash: 170, learn: [22, 22, 27, 31], train: [3000, 6000, 18000], icon: S + 'skill_fireball.png', sfx: 'fireball_impact', desc: '3×3 爆炸（官方）；[适配] 目标及其左右 1 卡' },
      { key: 'F8', id: 'hell_fire', name: '地狱火', kind: 'line', stat: 'mag', mana: 30, cooldown: 3, mult: 1.5, range: 425, learn: [16, 16, 21, 26], train: [1000, 4000, 8000], icon: S + 'skill_fire_wall.png', sfx: 'fireball_impact', desc: '向前 5 格火焰（官方）；[适配] 前方 2.5 卡内全部敌人' },
      { key: 'F9', id: 'lightning_flash', name: '疾光电影', kind: 'line', stat: 'mag', mana: 75, cooldown: 5, mult: 2.4, range: 680, learn: [26, 26, 29, 32], train: [3000, 6000, 12000], icon: S + 'skill_thunder.png', sfx: 'shockwave', desc: '直线穿透光电（官方）；[适配] 前方 4 卡内全部敌人' },
      { key: 'F10', id: 'hell_thunder', name: '地狱雷光', kind: 'aoe', stat: 'mag', mana: 105, cooldown: 6, mult: 2.2, range: 425, learn: [30, 30, 32, 34], train: [4000, 8000, 12000], icon: S + 'skill_thunder.png', sfx: 'shockwave2', desc: '以自身为中心 5×5 雷暴（官方）；[适配] 左右各 2.5 卡' },
      // 诱惑之光：学习等级/修炼点/延迟 60 = 官方 C（21cq）；耗魔 = D Spell 3 ×3 [适配]；无伤害（倍率无）；规则见 World.charm*（docs/skills-official.md「诱惑之光」）
      { key: 'F11', id: 'charm', name: '诱惑之光', kind: 'charm', stat: 'mag', mana: 9, cooldown: 0, range: 520, learn: [13, 13, 18, 24], train: [1000, 2000, 4000], icon: S + 'skill_thunder.png', sfx: 'shockwave', desc: '驯服不高于自身等级+2 的生物系怪物成为宠物（官方 C）；宠物上限 2/3/4/5（资料站）；BOSS/不死系/高智商免疫；[适配] 成功率与叛变时间' },
    ],
  },
  taoist: {
    id: 'taoist', name: '道士', art: 'taoist', bg: 0x7a5c14, artFacing: 1, atkInterval: 1.2, autoStat: 'tao',
    // [适配] 技能扩充后保模拟死亡 1–4：基础 HP 278（官方无对应基础血量）
    base: { hp: 380, mp: 190, atk: 16, mag: 0, tao: 28, def: 8 }, grow: { hp: 28, mp: 15, atk: 2, mag: 0, tao: 4.2, def: 1 },
    desc: '召唤协战，施毒持续伤害\n精神力被动 · 治愈·施毒·火符·骷髅·神兽\n幽灵盾·神圣战甲·群疗',
    skills: [
      { key: 'P', id: 'spirit_force', name: '精神力战法', kind: 'melee', stat: 'tao', mana: 0, cooldown: 0, passive: true, learn: [9, 9, 13, 19], train: [1000, 4000, 8000], accBonus: [3, 5, 8], icon: S + 'skill_spirit_force.png', sfx: 'heal', desc: '被动：准确 +3/+5/+8（官方）；[适配] 转为暴击率' },
      { key: 'F1', id: 'heal', name: '治愈术', kind: 'buff', stat: 'tao', mana: 12, cooldown: 4, heal: 2.5, learn: [7, 7, 11, 16], train: [500, 1500, 3000], icon: S + 'skill_heal.png', sfx: 'heal', desc: '恢复自身生命（随修炼等级提升）' },
      { key: 'F2', id: 'poison', name: '施毒术', kind: 'dot', stat: 'tao', mana: 12, cooldown: 3, mult: 0.6, range: 500, duration: 8, durPerLv: 2, learn: [14, 14, 17, 20], train: [1000, 2000, 4000], icon: S + 'skill_poison.png', sfx: 'summon2', desc: '中毒持续掉血，等级越高持续越久' },
      { key: 'F3', id: 'soul_fire', name: '灵魂火符', kind: 'ranged', stat: 'tao', mana: 15, cooldown: 1.5, mult: 2.0, range: 500, learn: [18, 18, 21, 24], train: [2000, 4000, 6000], icon: S + 'skill_soul_fire.png', sfx: 'fireball_cast', desc: '驱使护身符远程攻击' },
      { key: 'F4', id: 'summon_skeleton', name: '召唤骷髅', kind: 'summon', stat: 'tao', mana: 50, cooldown: 12, unlock: 1, learn: [1, 19, 23, 26], train: [2000, 4000, 8000], icon: S + 'skill_summon_skeleton.png', sfx: 'summon', desc: '召唤骷髅协同作战（已存在则治疗）；骷髅随技能等级变强' },
      { key: 'F5', id: 'summon_beast', name: '召唤神兽', kind: 'summon', stat: 'tao', mana: 48, cooldown: 15, learn: [35, 35, 37, 40], train: [2000, 4000, 8000], icon: S + 'skill_summon_beast.png', sfx: 'summon', desc: '召唤 1/2/3 级神兽（官方 C）；[适配] 属性随道术与技能等级；与骷髅互斥只保留一只' },
      // #12 道士 3 技能：学习等级/修炼点 = 官方 C（21cq），耗魔 = D 私服 Spell ×3 [适配]；增益/持续公式见 World.taoBuff（docs/skills-official.md #12）
      { key: 'F6', id: 'ghost_shield', name: '幽灵盾', kind: 'buff', stat: 'tao', mana: 45, cooldown: 10, buffStat: 'mdef', learn: [22, 22, 24, 26], train: [5000, 10000, 15000], icon: S + 'skill_magic_shield.png', sfx: 'heal2', desc: '提高魔御，持续随技能等级与道术（官方）；持续中重复施放无效' },
      { key: 'F7', id: 'holy_armor', name: '神圣战甲术', kind: 'buff', stat: 'tao', mana: 45, cooldown: 10, buffStat: 'def', learn: [25, 25, 27, 29], train: [5000, 10000, 15000], icon: S + 'Ability_Warrior_DefensiveStance.png', sfx: 'heal2', desc: '提高防御，持续随技能等级与道术（官方）；持续中重复施放无效' },
      { key: 'F8', id: 'mass_heal', name: '群体治愈术', kind: 'buff', stat: 'tao', mana: 36, cooldown: 6, heal: 2.5, area: 170, learn: [33, 33, 35, 38], train: [4000, 8000, 12000], icon: S + 'Spell_Holy_Renew.png', sfx: 'heal', desc: '3×3 范围治疗（官方）；[适配] 主角与 1 卡内召唤物' },
    ],
  },
};
/**
 * 取消冷却（用户：「学习官方，先不要冷却」）：官方只有施法延迟与耗魔，无独立冷却。
 * 21cq 技能表「延迟」60/40/100 等单位 未查到 → 不直接换算；[适配] 统一公共施法间隔 CAST_GAP 秒（任意技能施放后所有技能共享，防同帧连放/刷屏）。
 * COOLDOWN_BEFORE 保留改前 [适配] 冷却供文档/对照。
 */
export const CAST_GAP = 0.8;
export const COOLDOWN_BEFORE: Record<string, number> = {};
for (const c of Object.values(CLASSES)) for (const s of c.skills) { COOLDOWN_BEFORE[s.id] = s.cooldown; if (!s.passive) s.cooldown = CAST_GAP; }
/** 取消冷却后的再平衡 [适配]：法/道 主动技能 耗魔×mana、倍率×mult（9 种子模拟调参；战士不动）。改前值见 MANA_BEFORE/MULT_BEFORE */
export const REBALANCE = { mage: { mana: 1.5, mult: 0.56 }, taoist: { mana: 1.35, mult: 1 } } as const;
export const MANA_BEFORE: Record<string, number> = {}, MULT_BEFORE: Record<string, number> = {};
for (const c of ['mage', 'taoist'] as const) for (const s of CLASSES[c].skills) if (!s.passive) {
  MANA_BEFORE[s.id] = s.mana; if (s.mult) MULT_BEFORE[s.id] = s.mult;
  s.mana = Math.round(s.mana * REBALANCE[c].mana); if (s.mult) s.mult = +(s.mult * REBALANCE[c].mult).toFixed(2);
}
export const CLASS_IDS: ClassId[] = ['warrior', 'mage', 'taoist'];
