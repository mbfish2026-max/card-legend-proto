import { ClassId } from './classes';
/**
 * 技能书（R11）：参考原版——新角色仅 1 个初始技能，其余技能需获得技能书并达到等级后在背包中使用学会。
 * 来源与分歧见 docs/skills-official.md「技能书来源」。
 * shop：比奇书店/商人出售；drops：掉落该书的怪物 id（映射原版掉落怪，见文档）。
 * 价格：原版仅查到火球术 500 金（其余 未查到），[适配] 价格 = max(100, 学习等级 × 30)。
 */
export interface BookDef { skill: string; cls: ClassId; shop: boolean; drops: string[]; price: number }
/** 初始技能（原版三职业第一个技能，7 级学；[适配] 新角色开局即会、1 级可用） */
export const STARTER: Record<ClassId, string> = { warrior: 'basic_sword', mage: 'fireball', taoist: 'heal' };
const LICH = 'boss_lich', WOMA = ['woma_warrior', 'woma_guard', 'boss_woma'], ZUMA = ['zuma_statue', 'zuma_guard', 'boss_zuma'];
const P = (lv: number) => Math.max(100, lv * 30);
export const BOOKS: Record<string, BookDef> = {
  // 战士：攻杀/刺杀 书店有售；半月/野蛮/烈火 打怪掉落
  slaying: { skill: 'slaying', cls: 'warrior', shop: true, drops: [], price: P(19) },
  thrust: { skill: 'thrust', cls: 'warrior', shop: true, drops: ['zombie', 'skeleton_lord'], price: P(25) },
  half_moon: { skill: 'half_moon', cls: 'warrior', shop: false, drops: [LICH, 'skeleton_lord', 'zombie', ...WOMA], price: P(28) },
  rush: { skill: 'rush', cls: 'warrior', shop: false, drops: [LICH, ...WOMA], price: P(30) },
  fire_sword: { skill: 'fire_sword', cls: 'warrior', shop: false, drops: [LICH, ...ZUMA, 'boss_redmoon'], price: P(35) },
  // 法师：火球(初始)/雷电 书店有售；火墙/魔法盾/冰咆哮 掉落
  thunder: { skill: 'thunder', cls: 'mage', shop: true, drops: [], price: P(17) },
  fire_wall: { skill: 'fire_wall', cls: 'mage', shop: false, drops: [LICH, ...WOMA], price: P(24) },
  magic_shield: { skill: 'magic_shield', cls: 'mage', shop: false, drops: [LICH, ...WOMA], price: P(31) },
  ice_roar: { skill: 'ice_roar', cls: 'mage', shop: false, drops: [LICH, ...ZUMA, 'boss_redmoon'], price: P(35) },
  // 道士：治愈(初始)/精神力/施毒/灵魂火符/召唤骷髅 书店有售；神兽 掉落
  spirit_force: { skill: 'spirit_force', cls: 'taoist', shop: true, drops: [], price: P(9) },
  poison: { skill: 'poison', cls: 'taoist', shop: true, drops: [LICH, ...WOMA], price: P(14) },
  soul_fire: { skill: 'soul_fire', cls: 'taoist', shop: true, drops: [LICH, ...WOMA], price: P(18) },
  summon_skeleton: { skill: 'summon_skeleton', cls: 'taoist', shop: true, drops: [], price: 100 },
  summon_beast: { skill: 'summon_beast', cls: 'taoist', shop: false, drops: [LICH, ...ZUMA, 'boss_redmoon'], price: P(35) },
};
/** [适配] 掉落率（原版未查到）：首领 25%，普通怪 2%；只掉本职业、尚未学会的书 */
export const BOOK_DROP = { boss: 0.25, normal: 0.02 };
export const bookItemId = (skill: string) => 'book_' + skill;
