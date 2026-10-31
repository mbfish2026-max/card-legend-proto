// 素材 ID -> 文件路径（相对 public/）。留空或文件不存在时，渲染回退为色块+文字、音效静默。
// 图标/音效导出自魔兽世界 1.12.1 客户端（版权归暴雪，仅限个人原型使用，公开前必须替换）。
// 立绘、场景背景、项链/手镯/靴子图标为 AI 生成。
const P = 'assets/portraits/';
export const ASSETS: Record<string, string> = {
  // 卡牌半身/全身立绘（AI 生成 + 绿幕抠图，透明 PNG）
  hero: P + 'warrior_full.png', mage: P + 'mage_full.png', taoist: P + 'taoist_full.png',
  deer: P + 'deer_full.png', wolf: P + 'wolf_full.png', bat: P + 'bat_full.png', spider: P + 'spider_full.png',
  skeleton: P + 'skeleton_full.png', zombie: P + 'zombie_full.png', orc: P + 'orc_full.png', darkmage: P + 'darkmage_full.png',
  boss_lich: P + 'boss_lich_full.png',
  boss_wolf_king: P + 'boss_wolf_king_full.png', boss_spider_queen: P + 'boss_spider_queen_full.png', boss_skeleton_lord: P + 'boss_skeleton_lord_full.png', boss_orc_chief: P + 'boss_orc_chief_full.png',
  // R3 新怪/Boss：同名占位副本，美术交付后直接覆盖
  woma_guard: P + 'woma_guard_full.png', boss_woma: P + 'boss_woma_full.png', zuma_statue: P + 'zuma_statue_full.png',
  boss_zuma: P + 'boss_zuma_full.png', blood_zombie: P + 'blood_zombie_full.png', boss_redmoon: P + 'boss_redmoon_full.png',
  merchant: P + 'INV_Misc_Head_Human_02.png',
  // 每层场景背景（AI 生成，1280×720）
  bg: 'assets/ui/bg_dungeon.jpg',
  bg_floor1: 'assets/bg/bg_floor1.jpg', bg_floor2: 'assets/bg/bg_floor2.jpg', bg_floor3: 'assets/bg/bg_floor3.jpg',
  bg_floor4: 'assets/bg/bg_floor4.jpg', bg_floor5: 'assets/bg/bg_floor5.jpg',
  bg_floor6: 'assets/bg/bg_floor6.jpg', bg_floor7: 'assets/bg/bg_floor7.jpg', bg_floor8: 'assets/bg/bg_floor8.jpg',
  potion_0: 'assets/potions/INV_Potion_51.png', potion_1: 'assets/potions/INV_Potion_54.png',
  potion_2: 'assets/potions/INV_Potion_72.png', potion_3: 'assets/potions/INV_Potion_75.png',
  menu_0: 'assets/portraits/INV_Misc_Head_Human_01.png', menu_1: 'assets/items/INV_Misc_Bag_08.png',
  menu_2: 'assets/items/INV_Misc_Book_09.png', menu_3: 'assets/items/INV_Misc_Coin_01.png', menu_4: 'assets/skills/Ability_Warrior_BattleShout.png',
  slot_bg: 'assets/ui/UI-Quickslot2.png', slot_empty: 'assets/ui/UI-Backpack-EmptySlot.png',
};
export const MENU_LABELS = ['角色', '背包', '技能', '商店', '设置'];
const A = 'assets/sfx/';
export const SFX: Record<string, string> = {
  swing: A + 'swing.ogg', swing_crit: A + 'swing_crit.ogg', hit: A + 'hit.ogg', hit_hero: A + 'hit2.ogg',
  fireball_impact: A + 'fireball_impact.ogg', fireball_cast: A + 'fireball_cast.ogg', cleave: A + 'cleave.ogg', summon: A + 'summon.ogg', summon2: A + 'summon2.ogg',
  shout: A + 'shout.ogg', shockwave: A + 'shockwave.ogg', shockwave2: A + 'shockwave2.ogg', heal: A + 'heal.ogg', heal2: A + 'heal2.ogg',
  death: A + 'death.ogg', death2: A + 'death2.ogg', death_boss: A + 'death_boss.ogg', deer_death: A + 'deer_death.ogg', ghoul_death: A + 'ghoul_death.ogg',
  lich_death: A + 'lich_death.ogg', skeleton_death: A + 'skeleton_death.ogg',
  loot: A + 'loot.ogg', coin: A + 'coin.ogg', levelup: A + 'levelup.ogg', click: A + 'click.ogg', click2: A + 'click2.ogg', potion: A + 'potion.ogg',
};
