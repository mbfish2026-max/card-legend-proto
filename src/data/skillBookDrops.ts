import type { ClassId } from './classes';
/**
 * R54 技能书 ↔ BOSS 掉落表（纯数据，供掉落系统 / 掉落重置 / drop-plan 引用；见 docs/skill-book-drops.md）
 * 规则（用户需求）：商店只卖学习等级 ≤25 的书；26–35 级只由「尸王」及以上 BOSS 掉落、尸王掉率最高；>35 级由所在层等级≈书等级的高等级 BOSS 掉落。
 * 出处：书的官方掉落怪/具体爆率多数「未查到」；rate 均为 [适配] 值（rateNote 注明可参考的 21cq 官方爆率）。
 * floor = FLOORS 下标，floorLv = 该层怪物最高等级（本作层推荐等级的代理值）。
 */
export interface BookDropSrc { boss: string; floor: number; floorName: string; floorLv: number; rate: number; rateNote: string }
export interface SkillBookDrop { skill: string; name: string; cls: ClassId; lv: number; src: BookDropSrc[] }
export const SKILL_BOOK_DROPS: SkillBookDrop[] = [
  { skill: 'half_moon', name: '半月弯刀', cls: 'warrior', lv: 28, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/500）' }, { boss: 'boss_zuma', floor: 9, floorName: '祖玛阁', floorLv: 28, rate: 0.05, rateNote: '适配' }] },
  { skill: 'rush', name: '野蛮冲撞', cls: 'warrior', lv: 30, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/600）' }, { boss: 'boss_bull_king', floor: 10, floorName: '牛魔寺庙', floorLv: 30, rate: 0.05, rateNote: '适配' }] },
  { skill: 'thunder_sword', name: '雷霆剑', cls: 'warrior', lv: 34, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_wolong', floor: 20, floorName: '卧龙山庄', floorLv: 34, rate: 0.05, rateNote: '适配' }] },
  { skill: 'fire_sword', name: '烈火剑法', cls: 'warrior', lv: 35, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_leiyan', floor: 21, floorName: '雷炎洞穴', floorLv: 35, rate: 0.05, rateNote: '适配' }] },
  { skill: 'break_strike', name: '破击剑法', cls: 'warrior', lv: 36, src: [{ boss: 'boss_fire_dragon', floor: 22, floorName: '火龙神殿', floorLv: 36, rate: 0.08, rateNote: '适配' }] },
  { skill: 'dash_slash', name: '突斩', cls: 'warrior', lv: 37, src: [{ boss: 'boss_yeti_king', floor: 80, floorName: '白日门·雪域', floorLv: 37, rate: 0.08, rateNote: '适配' }] },
  { skill: 'shield_break', name: '破盾斩', cls: 'warrior', lv: 39, src: [{ boss: 'boss_huangquan', floor: 81, floorName: '骨魔洞五层', floorLv: 38, rate: 0.08, rateNote: '适配' }] },
  { skill: 'vajra_body', name: '金刚护体', cls: 'warrior', lv: 41, src: [{ boss: 'boss_twinhead_kong', floor: 82, floorName: '恶魔祭坛', floorLv: 40, rate: 0.08, rateNote: '适配' }, { boss: 'boss_twinhead_blood', floor: 82, floorName: '恶魔祭坛', floorLv: 40, rate: 0.08, rateNote: '适配' }] },
  { skill: 'lightning_flash', name: '疾光电影', cls: 'mage', lv: 26, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/10）' }, { boss: 'boss_woma', floor: 8, floorName: '沃玛寺庙', floorLv: 24, rate: 0.05, rateNote: '适配' }] },
  { skill: 'ice_dragon', name: '冰龙破', cls: 'mage', lv: 26, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_woma', floor: 8, floorName: '沃玛寺庙', floorLv: 24, rate: 0.05, rateNote: '适配' }] },
  { skill: 'frost_blade', name: '玄冰刃', cls: 'mage', lv: 26, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_woma', floor: 8, floorName: '沃玛寺庙', floorLv: 24, rate: 0.05, rateNote: '适配' }] },
  { skill: 'hell_thunder', name: '地狱雷光', cls: 'mage', lv: 30, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/600）' }, { boss: 'boss_bull_king', floor: 10, floorName: '牛魔寺庙', floorLv: 30, rate: 0.05, rateNote: '适配' }] },
  { skill: 'magic_shield', name: '魔法盾', cls: 'mage', lv: 31, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/900）' }, { boss: 'boss_hongmo', floor: 11, floorName: '封魔殿', floorLv: 31, rate: 0.05, rateNote: '适配' }] },
  { skill: 'five_thunder', name: '五雷轰', cls: 'mage', lv: 34, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_wolong', floor: 20, floorName: '卧龙山庄', floorLv: 34, rate: 0.05, rateNote: '适配' }] },
  { skill: 'ice_roar', name: '冰咆哮', cls: 'mage', lv: 35, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_leiyan', floor: 21, floorName: '雷炎洞穴', floorLv: 35, rate: 0.05, rateNote: '适配' }] },
  { skill: 'ice_whirl', name: '冰旋风', cls: 'mage', lv: 37, src: [{ boss: 'boss_yeti_king', floor: 80, floorName: '白日门·雪域', floorLv: 37, rate: 0.08, rateNote: '适配' }] },
  { skill: 'soul_wall', name: '灵魂墙', cls: 'taoist', lv: 28, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_zuma', floor: 9, floorName: '祖玛阁', floorLv: 28, rate: 0.05, rateNote: '适配' }] },
  { skill: 'clear_mind', name: '道心清明', cls: 'taoist', lv: 30, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_bull_king', floor: 10, floorName: '牛魔寺庙', floorLv: 30, rate: 0.05, rateNote: '适配' }] },
  { skill: 'mass_heal', name: '群体治愈术', cls: 'taoist', lv: 33, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配（21cq 尸王 1/800）' }, { boss: 'boss_hj_home', floor: 19, floorName: '保卫家园', floorLv: 33, rate: 0.05, rateNote: '适配' }] },
  { skill: 'summon_beast', name: '召唤神兽', cls: 'taoist', lv: 35, src: [{ boss: 'boss_lich', floor: 5, floorName: '尸王殿', floorLv: 22, rate: 0.1, rateNote: '适配' }, { boss: 'boss_leiyan', floor: 21, floorName: '雷炎洞穴', floorLv: 35, rate: 0.05, rateNote: '适配' }] },
  { skill: 'holy_light', name: '神光术', cls: 'taoist', lv: 36, src: [{ boss: 'boss_fire_dragon', floor: 22, floorName: '火龙神殿', floorLv: 36, rate: 0.08, rateNote: '适配' }] },
  { skill: 'cleanse', name: '解毒术', cls: 'taoist', lv: 38, src: [{ boss: 'boss_huangquan', floor: 81, floorName: '骨魔洞五层', floorLv: 38, rate: 0.08, rateNote: '适配' }] },
  { skill: 'summon_golden_skeleton', name: '金甲骷髅', cls: 'taoist', lv: 42, src: [{ boss: 'boss_twinhead_kong', floor: 82, floorName: '恶魔祭坛', floorLv: 40, rate: 0.08, rateNote: '适配' }, { boss: 'boss_twinhead_blood', floor: 82, floorName: '恶魔祭坛', floorLv: 40, rate: 0.08, rateNote: '适配' }] },
];
/** BOSS id → 该 BOSS 可掉的 >25 级书 */
export const BOOK_DROPS_BY_BOSS: Record<string, { skill: string; cls: ClassId; rate: number }[]> = {};
for (const d of SKILL_BOOK_DROPS) for (const s of d.src) (BOOK_DROPS_BY_BOSS[s.boss] ??= []).push({ skill: d.skill, cls: d.cls, rate: s.rate });
