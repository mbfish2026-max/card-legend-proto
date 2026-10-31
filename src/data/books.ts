import { ClassId } from './classes';
import { OFFICIAL_DROPS } from './drops-official';
import { officialBookRates } from './drops';
import { WOMA_S9_BOOKS } from './drops-s9';
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
  // #11 新法师书（新书接入）：地狱火/大火球 进书店（官方系统价 1000/2000，见 thelegendofmir2.com）；其余按 21cq 怪物掉落表
  // drops 列官方掉落怪（项目内存在的 id）；有资料怪的爆率取 BOOK_RATES（21cq 1/N），见 docs/skills-official.md「新书接入与再平衡」
  big_fireball: { skill: 'big_fireball', cls: 'mage', shop: true, drops: ['skeleton_lord', LICH, 'woma_guard'], price: P(19) },
  burst_fire: { skill: 'burst_fire', cls: 'mage', shop: false, drops: ['skeleton_lord', LICH, 'woma_guard'], price: P(22) },
  hell_fire: { skill: 'hell_fire', cls: 'mage', shop: true, drops: ['skeleton_lord', LICH, 'woma_guard'], price: P(16) },
  lightning_flash: { skill: 'lightning_flash', cls: 'mage', shop: false, drops: [LICH], price: P(26) },
  hell_thunder: { skill: 'hell_thunder', cls: 'mage', shop: false, drops: [LICH, 'woma_guard', 'boss_redmoon', 'boss_chulong', 'boss_white_boar', 'boss_bull_king', 'hongmo_pig', 'boss_hongmo'], price: P(30) },
  // 诱惑之光：书店是否出售/售价 未查到 → shop:false；官方掉落 = 21cq 骷髅精灵 1/5、尸王 1/5、沃玛卫士 1/3（drops-official.ts），已接入
  charm: { skill: 'charm', cls: 'mage', shop: false, drops: ['skeleton_lord', LICH, 'woma_guard'], price: P(13) },
  // 道士：治愈(初始)/精神力/施毒/灵魂火符/召唤骷髅 书店有售；神兽 掉落
  spirit_force: { skill: 'spirit_force', cls: 'taoist', shop: true, drops: [], price: P(9) },
  poison: { skill: 'poison', cls: 'taoist', shop: true, drops: [LICH, ...WOMA], price: P(14) },
  soul_fire: { skill: 'soul_fire', cls: 'taoist', shop: true, drops: [LICH, ...WOMA], price: P(18) },
  summon_skeleton: { skill: 'summon_skeleton', cls: 'taoist', shop: true, drops: [], price: 100 },
  summon_beast: { skill: 'summon_beast', cls: 'taoist', shop: false, drops: [LICH, ...ZUMA, 'boss_redmoon'], price: P(35) },
  // #12 新道士书（新书接入）：幽灵盾/神圣战甲术 [适配] 进书店（官方书店是否有售 未查到；官方为尸王/骷髅精灵/沃玛卫士掉落，保留）；群体治疗术按沃玛教主 S9 + 21cq 掉落
  ghost_shield: { skill: 'ghost_shield', cls: 'taoist', shop: true, drops: ['skeleton_lord', LICH, 'woma_guard'], price: P(22) },
  holy_armor: { skill: 'holy_armor', cls: 'taoist', shop: true, drops: [LICH, 'woma_guard'], price: P(25) },
  mass_heal: { skill: 'mass_heal', cls: 'taoist', shop: false, drops: [LICH, 'boss_woma', 'boss_white_boar', 'hongmo_pig'], price: P(33) },
};
/** [适配] 掉落率（原版未查到）：首领 25%，普通怪 2%；只掉本职业、尚未学会的书 */
export const BOOK_DROP = { boss: 0.25, normal: 0.02 };
export const bookItemId = (skill: string) => 'book_' + skill;
/** R13：有掉落资料的怪 → 技能书逐本爆率（21cq 1.76 资料 1/N）；不在此表的怪才用 BOOK_DROP [适配] */
export const BOOK_RATES: Record<string, Record<string, number>> = Object.fromEntries(Object.keys(OFFICIAL_DROPS).map(id => [id, officialBookRates(id)!]));
/** R14 #7：沃玛教主书爆率改用 S9 */
BOOK_RATES.boss_woma = { ...WOMA_S9_BOOKS };
