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
  // feat/art-integrate：art/gap-fill 交付的独立立绘（原借用他怪贴图，见 docs/art-requests.md §L）
  tree_demon: P + 'tree_demon_full.png', boss_chulong: P + 'boss_chulong_full.png', boss_white_boar: P + 'boss_white_boar_full.png', boss_bull_king: P + 'boss_bull_king_full.png', boss_hongmo: P + 'boss_hongmo_full.png', woma_warrior: P + 'woma_warrior_full.png', zuma_guard: P + 'zuma_guard_full.png', bull_warrior: P + 'bull_warrior_full.png', bull_mage: P + 'bull_mage_full.png', bull_guard: P + 'bull_guard_full.png', hongmo_pig: P + 'hongmo_pig_full.png', hongmo_scorpion: P + 'hongmo_scorpion_full.png', redmoon_spider: P + 'redmoon_spider_full.png', red_snake: P + 'red_snake_full.png', tiger_snake: P + 'tiger_snake_full.png', scorpion: P + 'scorpion_full.png', centipede: P + 'centipede_full.png', jump_bee: P + 'jump_bee_full.png', black_maggot: P + 'black_maggot_full.png', red_boar: P + 'red_boar_full.png', black_boar: P + 'black_boar_full.png', scorpion_snake: P + 'scorpion_snake_full.png', summon_beast: P + 'summon_beast_full.png',
  // 召唤物姿态单帧（art-requests L.2）
  summon_skeleton_atk: 'assets/fx/summon_skeleton_atk.png', summon_skeleton_hurt: 'assets/fx/summon_skeleton_hurt.png', summon_beast_atk: 'assets/fx/summon_beast_atk.png', summon_beast_hurt: 'assets/fx/summon_beast_hurt.png',
  merchant: P + 'INV_Misc_Head_Human_02.png',
  // 每层场景背景（AI 生成，1280×720）
  bg: 'assets/ui/bg_dungeon.jpg',
  bg_floor1: 'assets/bg/bg_floor1.jpg', bg_floor2: 'assets/bg/bg_floor2.jpg', bg_floor3: 'assets/bg/bg_floor3.jpg',
  bg_floor4: 'assets/bg/bg_floor4.jpg', bg_floor5: 'assets/bg/bg_floor5.jpg',
  map_world: 'assets/map/map_world.jpg', map_node_bichi: 'assets/map/map_node_bichi.png', map_node_mengzhong: 'assets/map/map_node_mengzhong.png', map_node_woma: 'assets/map/map_node_woma.png', map_node_zuma: 'assets/map/map_node_zuma.png', map_node_chiyue: 'assets/map/map_node_chiyue.png',
  bg_floor6: 'assets/bg/bg_floor6.jpg', bg_floor7: 'assets/bg/bg_floor7.jpg', bg_floor8: 'assets/bg/bg_floor8.jpg',
  // R13 新地图背景占位：复用现有背景文件（独立 key，美术到位后替换路径即可，见 art-requests §R13）
  bg_floor9: 'assets/bg/bg_floor2.jpg', bg_floor10: 'assets/bg/bg_floor3.jpg', bg_floor11: 'assets/bg/bg_floor4.jpg', bg_floor12: 'assets/bg/bg_floor6.jpg', bg_floor13: 'assets/bg/bg_floor7.jpg',
  // feat/maps-more 占位（见 art-requests）
  bg_floor14: 'assets/bg/bg_floor3.jpg', bg_floor15: 'assets/bg/bg_floor3.jpg', bg_floor16: 'assets/bg/bg_floor3.jpg', bg_floor17: 'assets/bg/bg_floor3.jpg', bg_floor18: 'assets/bg/bg_floor2.jpg', bg_floor19: 'assets/bg/bg_floor2.jpg', // [适配] 占位：古墓/天然洞穴/自然洞穴背景待美术（docs/art-requests.md）
  potion_0: 'assets/items/hp_small.png', potion_1: 'assets/items/hp_mid.png',
  potion_2: 'assets/items/mp_small.png', potion_3: 'assets/items/mp_mid.png',
  set_badge: 'assets/ui/set_badge.png', menu_0: 'assets/portraits/INV_Misc_Head_Human_01.png', menu_1: 'assets/items/INV_Misc_Bag_08.png',
  menu_2: 'assets/items/INV_Misc_Book_09.png', menu_3: 'assets/items/INV_Misc_Coin_01.png', menu_4: 'assets/skills/Ability_Warrior_BattleShout.png',
  slot_bg: 'assets/ui/UI-Quickslot2.png', slot_empty: 'assets/ui/UI-Backpack-EmptySlot.png',
};
export const MENU_LABELS = ['角色', '悬赏', '技能', '商店', '设置'];
const A = 'assets/sfx/';
export const SFX: Record<string, string> = {
  swing: A + 'swing.ogg', swing_crit: A + 'swing_crit.ogg', hit: A + 'hit.ogg', hit_hero: A + 'hit2.ogg',
  fireball_impact: A + 'fireball_impact.ogg', fireball_cast: A + 'fireball_cast.ogg', cleave: A + 'cleave.ogg', summon: A + 'summon.ogg', summon2: A + 'summon2.ogg',
  shout: A + 'shout.ogg', shockwave: A + 'shockwave.ogg', shockwave2: A + 'shockwave2.ogg', heal: A + 'heal.ogg', heal2: A + 'heal2.ogg',
  death: A + 'death.ogg', death2: A + 'death2.ogg', death_boss: A + 'death_boss.ogg', deer_death: A + 'deer_death.ogg', ghoul_death: A + 'ghoul_death.ogg',
  lich_death: A + 'lich_death.ogg', skeleton_death: A + 'skeleton_death.ogg',
  loot: A + 'loot.ogg', coin: A + 'coin.ogg', levelup: A + 'levelup.ogg', click: A + 'click.ogg', click2: A + 'click2.ogg', potion: A + 'potion.ogg',
};
