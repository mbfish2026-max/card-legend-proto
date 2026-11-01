// drop-realign H 章过渡链（docs/drop-realign.md H-2 / I-3）：25 件首饰 + 4 双靴子。由 /workspace/rl/out2/new.json 转写。
// 数值均为[适配]（官方区间×H-3 系数，再按 9 seed 调参 v5：×2.5，战士专属件 ×2，无职业防御件每点防御 +10 生命）；靴子数值/售价[暂定]（官方未查到）。只掉落、不上商店（G9）。图标暂用同部位占位，正式图标见 art-requests（AI 生成，待美术2）。
import type { ItemDef } from '../combat/types';
const I = 'assets/items/';
export const H_ITEMS: Record<string, ItemDef> = {
  h_gold_necklace: { id: 'h_gold_necklace', name: '金项链', icon: I + 'h_gold_necklace.png', slot: 'necklace', equip: {"atk": 3}, req: 2, price: 5 }, // [适配] 官方 攻击0-1 敏捷+1
  h_black_crystal_necklace: { id: 'h_black_crystal_necklace', name: '黑色水晶项链', icon: I + 'h_black_crystal_necklace.png', slot: 'necklace', equip: {"atk": 3}, req: 13, price: 15, cls: ["warrior"] }, // [适配] 官方 攻击1-0
  h_ebony_necklace: { id: 'h_ebony_necklace', name: '黑檀项链', icon: I + 'h_ebony_necklace.png', slot: 'necklace', equip: {"mag": 5}, req: 13, price: 12, cls: ["mage"] }, // [适配] 官方 魔法1-0
  h_yellow_crystal_necklace: { id: 'h_yellow_crystal_necklace', name: '黄色水晶项链', icon: I + 'h_yellow_crystal_necklace.png', slot: 'necklace', equip: {"tao": 5}, req: 13, price: 12, cls: ["taoist"] }, // [适配] 官方 道术1-0
  h_devil_necklace: { id: 'h_devil_necklace', name: '魔鬼项链', icon: I + 'h_devil_necklace.png', slot: 'necklace', equip: {"atk": 8}, req: 17, price: 25, cls: ["warrior"] }, // [适配] 官方 攻击2-0
  h_amber_necklace: { id: 'h_amber_necklace', name: '琥珀项链', icon: I + 'h_amber_necklace.png', slot: 'necklace', equip: {"mag": 10}, req: 17, price: 20, cls: ["mage"] }, // [适配] 官方 魔法2-0
  h_phoenix_pearl: { id: 'h_phoenix_pearl', name: '凤凰明珠', icon: I + 'h_phoenix_pearl.png', slot: 'necklace', equip: {"tao": 13}, req: 17, price: 20, cls: ["taoist"] }, // [适配] 官方 道术1-2 准确+1
  h_blue_jade_necklace: { id: 'h_blue_jade_necklace', name: '蓝翡翠项链', icon: I + 'h_blue_jade_necklace.png', slot: 'necklace', equip: {"atk": 8}, req: 23, price: 100, cls: ["warrior"] }, // [适配] 官方 攻击2-2
  h_leather_glove: { id: 'h_leather_glove', name: '皮制手套', icon: I + 'h_leather_glove.png', slot: 'bracelet', equip: {"def": 5, "hp": 50}, req: 7, price: 15 }, // [适配] 官方 防御0-1
  h_steel_bracelet: { id: 'h_steel_bracelet', name: '钢手镯', icon: I + 'h_steel_bracelet.png', slot: 'bracelet', equip: {"def": 5, "mdef": 5, "hp": 50}, req: 8, price: 20 }, // [适配] 官方 防御0-1 魔御0-1
  h_big_bracelet: { id: 'h_big_bracelet', name: '大手镯', icon: I + 'h_big_bracelet.png', slot: 'bracelet', equip: {"def": 5, "hp": 50}, req: 9, price: 50 }, // [适配] 官方 防御1-1
  h_magic_bracelet: { id: 'h_magic_bracelet', name: '魔法手镯', icon: I + 'h_magic_bracelet.png', slot: 'bracelet', equip: {"def": 5, "mdef": 10, "hp": 50}, req: 18, price: 40 }, // [适配] 官方 防御0-1 魔御1-2
  h_sturdy_glove: { id: 'h_sturdy_glove', name: '坚固手套', icon: I + 'h_sturdy_glove.png', slot: 'bracelet', equip: {"def": 10, "hp": 100}, req: 18, price: 70 }, // [适配] 官方 防御0-2
  h_ebony_bracelet: { id: 'h_ebony_bracelet', name: '黑檀手镯', icon: I + 'h_ebony_bracelet.png', slot: 'bracelet', equip: {"mag": 5}, req: 19, price: 40, cls: ["mage"] }, // [适配] 官方 魔法0-1
  h_tao_bracelet: { id: 'h_tao_bracelet', name: '道士手镯', icon: I + 'h_tao_bracelet.png', slot: 'bracelet', equip: {"tao": 8}, req: 19, price: 40, cls: ["taoist"] }, // [适配] 官方 道术0-1
  h_power_bracelet: { id: 'h_power_bracelet', name: '魔力手镯', icon: I + 'h_power_bracelet.png', slot: 'bracelet', equip: {"atk": 5}, req: 20, price: 80, cls: ["warrior"] }, // [适配] 官方 攻击0-1
  h_death_glove: { id: 'h_death_glove', name: '死神手套', icon: I + 'h_death_glove.png', slot: 'bracelet', equip: {"atk": 10}, req: 22, price: 80, cls: ["warrior"] }, // [适配] 官方 攻击1-2
  h_gold_bracelet: { id: 'h_gold_bracelet', name: '金手镯', icon: I + 'h_gold_bracelet.png', slot: 'bracelet', equip: {"atk": 5, "mdef": 15}, req: 23, price: 70 }, // [适配] 官方 攻击0-1 魔御2-3
  h_hex_ring: { id: 'h_hex_ring', name: '六角戒指', icon: I + 'h_hex_ring.png', slot: 'ring', equip: {"mag": 5}, req: 7, price: 8, cls: ["mage"] }, // [适配] 官方 魔法0-1
  h_glass_ring: { id: 'h_glass_ring', name: '玻璃戒指', icon: I + 'h_glass_ring.png', slot: 'ring', equip: {"tao": 8}, req: 7, price: 8, cls: ["taoist"] }, // [适配] 官方 道术0-1
  h_horn_ring: { id: 'h_horn_ring', name: '牛角戒指', icon: I + 'h_horn_ring.png', slot: 'ring', equip: {"atk": 3, "mdef": 5}, req: 9, price: 10, cls: ["warrior"] }, // [适配] 官方 攻击0-1 魔御0-1
  h_blue_crystal_ring: { id: 'h_blue_crystal_ring', name: '蓝色水晶戒指', icon: I + 'h_blue_crystal_ring.png', slot: 'ring', equip: {"atk": 3, "mdef": 10}, req: 16, price: 15, cls: ["warrior"] }, // [适配] 官方 攻击1-0 魔御0-2
  h_black_crystal_ring: { id: 'h_black_crystal_ring', name: '黑色水晶戒指', icon: I + 'h_black_crystal_ring.png', slot: 'ring', equip: {"atk": 5}, req: 20, price: 20, cls: ["warrior"] }, // [适配] 官方 攻击0-2
  h_snake_eye_ring: { id: 'h_snake_eye_ring', name: '蛇眼戒指', icon: I + 'h_snake_eye_ring.png', slot: 'ring', equip: {"mag": 10}, req: 20, price: 20, cls: ["mage"] }, // [适配] 官方 魔法0-2
  h_pearl_ring: { id: 'h_pearl_ring', name: '珍珠戒指', icon: I + 'h_pearl_ring.png', slot: 'ring', equip: {"tao": 13}, req: 20, price: 20, cls: ["taoist"] }, // [适配] 官方 道术0-2
  h_cloth_shoes: { id: 'h_cloth_shoes', name: '布鞋', icon: I + 'h_cloth_shoes.png', slot: 'boots', equip: {"def": 5, "hp": 90}, req: 15, price: 20 }, // [适配] 官方 防御0-1 负重+3；数值/售价暂定
  h_deer_boots: { id: 'h_deer_boots', name: '鹿皮靴', icon: I + 'h_deer_boots.png', slot: 'boots', equip: {"def": 8, "hp": 140}, req: 22, price: 50 }, // [适配] 官方 防御0-2 负重+4；数值/售价暂定
  h_silk_boots: { id: 'h_silk_boots', name: '紫绸靴', icon: I + 'h_silk_boots.png', slot: 'boots', equip: {"def": 13, "hp": 230}, req: 30, price: 100 }, // [适配] 官方 防御0-3 负重+5；数值/售价暂定
  h_soul_boots: { id: 'h_soul_boots', name: '避魂靴', icon: I + 'h_soul_boots.png', slot: 'boots', equip: {"def": 13, "hp": 230}, req: 35, price: 150 }, // [适配] 官方 防御1-3 负重+6；数值/售价暂定
};
export const H_PLAN: Record<string, [string, number][]> = {
  h_gold_necklace: [["forest_yeti", 16], ["hook_cat", 16], ["rake_cat", 16], ["tree_demon", 8], ["skeleton_lord", 8]],
  h_black_crystal_necklace: [["red_snake", 24], ["tiger_snake", 24], ["skeleton", 24], ["skeleton_lord", 12]],
  h_ebony_necklace: [["red_snake", 24], ["tiger_snake", 24], ["skeleton", 24], ["skeleton_lord", 12]],
  h_yellow_crystal_necklace: [["red_snake", 24], ["tiger_snake", 24], ["skeleton", 24], ["skeleton_lord", 12]],
  h_devil_necklace: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_evil_pincer", 12]],
  h_amber_necklace: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_evil_pincer", 12]],
  h_phoenix_pearl: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_evil_pincer", 12]],
  h_blue_jade_necklace: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["boss_lich", 20], ["boss_evil_pincer", 20]],
  h_leather_glove: [["forest_yeti", 16], ["orc", 16], ["red_snake", 16], ["skeleton_lord", 8]],
  h_steel_bracelet: [["orc", 16], ["red_snake", 16], ["tiger_snake", 16], ["skeleton_lord", 8]],
  h_big_bracelet: [["orc", 16], ["red_snake", 16], ["tiger_snake", 16], ["skeleton_lord", 8]],
  h_magic_bracelet: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_evil_pincer", 12]],
  h_sturdy_glove: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_evil_pincer", 12]],
  h_ebony_bracelet: [["black_maggot", 24], ["centipede", 24], ["giant_worm", 24], ["skeleton_lord", 12], ["boss_lich", 12]],
  h_tao_bracelet: [["black_maggot", 24], ["centipede", 24], ["giant_worm", 24], ["skeleton_lord", 12], ["boss_lich", 12]],
  h_power_bracelet: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["skeleton_lord", 20], ["boss_lich", 20]],
  h_death_glove: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["boss_lich", 20], ["boss_evil_pincer", 20]],
  h_gold_bracelet: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["boss_lich", 20], ["boss_evil_pincer", 20]],
  h_hex_ring: [["forest_yeti", 16], ["orc", 16], ["red_snake", 16], ["skeleton_lord", 8]],
  h_glass_ring: [["forest_yeti", 16], ["orc", 16], ["red_snake", 16], ["skeleton_lord", 8]],
  h_horn_ring: [["orc", 16], ["red_snake", 16], ["tiger_snake", 16], ["skeleton_lord", 8]],
  h_blue_crystal_ring: [["skeleton", 24], ["zombie", 24], ["axe_skeleton", 24], ["skeleton_lord", 12], ["boss_lich", 12]],
  h_black_crystal_ring: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["skeleton_lord", 20], ["boss_lich", 20]],
  h_snake_eye_ring: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["skeleton_lord", 20], ["boss_lich", 20]],
  h_pearl_ring: [["black_maggot", 40], ["centipede", 40], ["giant_worm", 40], ["skeleton_lord", 20], ["boss_lich", 20]],
  h_cloth_shoes: [["spider_queen", 12], ["tree_demon", 12]],
  h_deer_boots: [["boss_lich", 20], ["boss_evil_pincer", 20]],
  h_silk_boots: [["boss_evil_pincer", 30], ["boss_chulong", 30]],
  h_soul_boots: [["boss_chulong", 30], ["boss_sq_jiguan", 30]],
};
/** 官方盘点条目（EQUIP_META）：official=官方名，cq=21cq 物品 id（靴子未查到为 0）；数值见 H-2/I-3 */
export const H_META = {
  h_gold_necklace: { official: '金项链', cq: 153, origin: 'realign' as const, note: '官方 攻击0-1 敏捷+1；本作[适配] 攻击0-1×1.4；舍弃敏捷+1(本作无此属性)' },
  h_black_crystal_necklace: { official: '黑色水晶项链', cq: 156, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击1-0；本作[适配] 攻击1-0×1.4' },
  h_ebony_necklace: { official: '黑檀项链', cq: 157, cls: ['mage'], origin: 'realign' as const, note: '官方 魔法1-0；本作[适配] 魔法1-0×2.25' },
  h_yellow_crystal_necklace: { official: '黄色水晶项链', cq: 158, cls: ['taoist'], origin: 'realign' as const, note: '官方 道术1-0；本作[适配] 道术1-0×2.4' },
  h_devil_necklace: { official: '魔鬼项链', cq: 161, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击2-0；本作[适配] 攻击2-0×1.4' },
  h_amber_necklace: { official: '琥珀项链', cq: 162, cls: ['mage'], origin: 'realign' as const, note: '官方 魔法2-0；本作[适配] 魔法2-0×2.25' },
  h_phoenix_pearl: { official: '凤凰明珠', cq: 163, cls: ['taoist'], origin: 'realign' as const, note: '官方 道术1-2 准确+1；本作[适配] 道术1-2×2.4；舍弃准确+1(本作无此属性)' },
  h_blue_jade_necklace: { official: '蓝翡翠项链', cq: 165, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击2-2；本作[适配] 攻击2-2×1.4' },
  h_leather_glove: { official: '皮制手套', cq: 177, origin: 'realign' as const, note: '官方 防御0-1；本作[适配] 防御0-1×2.0' },
  h_steel_bracelet: { official: '钢手镯', cq: 178, origin: 'realign' as const, note: '官方 防御0-1 魔御0-1；本作[适配] 防御0-1×2.0；魔御0-1×2.0' },
  h_big_bracelet: { official: '大手镯', cq: 179, origin: 'realign' as const, note: '官方 防御1-1；本作[适配] 防御1-1×2.0' },
  h_magic_bracelet: { official: '魔法手镯', cq: 183, origin: 'realign' as const, note: '官方 防御0-1 魔御1-2；本作[适配] 防御0-1×2.0；魔御1-2×2.0' },
  h_sturdy_glove: { official: '坚固手套', cq: 182, origin: 'realign' as const, note: '官方 防御0-2；本作[适配] 防御0-2×2.0' },
  h_ebony_bracelet: { official: '黑檀手镯', cq: 184, cls: ['mage'], origin: 'realign' as const, note: '官方 魔法0-1；本作[适配] 魔法0-1×2.0' },
  h_tao_bracelet: { official: '道士手镯', cq: 185, cls: ['taoist'], origin: 'realign' as const, note: '官方 道术0-1；本作[适配] 道术0-1×2.67' },
  h_power_bracelet: { official: '魔力手镯', cq: 186, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击0-1；本作[适配] 攻击0-1×1.83' },
  h_death_glove: { official: '死神手套', cq: 187, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击1-2；本作[适配] 攻击1-2×1.83' },
  h_gold_bracelet: { official: '金手镯', cq: 188, origin: 'realign' as const, note: '官方 攻击0-1 魔御2-3；本作[适配] 攻击0-1×1.83；魔御2-3×2.0' },
  h_hex_ring: { official: '六角戒指', cq: 198, cls: ['mage'], origin: 'realign' as const, note: '官方 魔法0-1；本作[适配] 魔法0-1×2.17' },
  h_glass_ring: { official: '玻璃戒指', cq: 199, cls: ['taoist'], origin: 'realign' as const, note: '官方 道术0-1；本作[适配] 道术0-1×2.62' },
  h_horn_ring: { official: '牛角戒指', cq: 200, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击0-1 魔御0-1；本作[适配] 攻击0-1×1.0；魔御0-1×2.0' },
  h_blue_crystal_ring: { official: '蓝色水晶戒指', cq: 202, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击1-0 魔御0-2；本作[适配] 攻击1-0×1.0；魔御0-2×2.0' },
  h_black_crystal_ring: { official: '黑色水晶戒指', cq: 203, cls: ['warrior'], origin: 'realign' as const, note: '官方 攻击0-2；本作[适配] 攻击0-2×1.0' },
  h_snake_eye_ring: { official: '蛇眼戒指', cq: 204, cls: ['mage'], origin: 'realign' as const, note: '官方 魔法0-2；本作[适配] 魔法0-2×2.17' },
  h_pearl_ring: { official: '珍珠戒指', cq: 205, cls: ['taoist'], origin: 'realign' as const, note: '官方 道术0-2；本作[适配] 道术0-2×2.62' },
  h_cloth_shoes: { official: '布鞋', cq: 0, origin: 'realign' as const, note: '官方 防御0-1 负重+3；本作[适配] 防御类×1.67（雷霆战靴折算系数）；hp=防御×8（沿用本作护甲 hp/def 比，适配）；1.76 掉落未查到，售价暂定' },
  h_deer_boots: { official: '鹿皮靴', cq: 0, origin: 'realign' as const, note: '官方 防御0-2 负重+4；本作[适配] 防御类×1.67（雷霆战靴折算系数）；hp=防御×8（沿用本作护甲 hp/def 比，适配）；1.76 掉落未查到，售价暂定' },
  h_silk_boots: { official: '紫绸靴', cq: 0, origin: 'realign' as const, note: '官方 防御0-3 负重+5；本作[适配] 防御类×1.67（雷霆战靴折算系数）；hp=防御×8（沿用本作护甲 hp/def 比，适配）；1.76 掉落未查到，售价暂定' },
  h_soul_boots: { official: '避魂靴', cq: 0, origin: 'realign' as const, note: '官方 防御1-3 负重+6；本作[适配] 防御类×1.67（雷霆战靴折算系数）；hp=防御×8（沿用本作护甲 hp/def 比，适配）；1.76 掉落未查到，售价暂定' },
};
