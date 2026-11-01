# P2 eg-sets：40–50 级装备与官方职业套（feat/eg-sets）

数据：`src/data/eg-equip.ts`（40 件，属性取 docs/equip-3050-plan.md §3「本作属性 [适配]」列）、`src/data/eg-sets.ts`（套装/特效/停掉落）、`src/data/drop-plan.ts` `EG_DROPS`（掉落）。测试：`tests/eg-sets.test.ts`。

## 套装数值（D4/E4 逐档 [适配]）
| 套装 | 件 | 档 | 加成 |
|---|---|---|---|
| 圣战/法神/天尊（三圣） | 头盔、项链、戒指、手镯 | 2 件 | 沿用 r14b |
| 三圣 | 同上 | 4 件 | 主属性 +12、生命 +250、防御 +10、幸运 +1 + 职业特效 |
| 雷霆/烈焰/光芒 | 项链、手镯、戒指、靴子（无腰带栏） | 3 / 4 件 | 主 +6 生命 +120 / 主 +10 生命 +200 防御 +8 |
| 战神/圣魔/真魂 | 项链、手镯、戒指 | 2 / 3 件 | 主 +8 / 主 +12 生命 +200 防御 +5 |

三圣 4 件特效（`SetDef.bonus[].special` → `World.setSpecials()` 返回 id，**数值未接入战斗**）：
- shengzhan4 战士：暴击 5%，暴伤 ×1.5 [适配]
- fashen4 法师：耗蓝 −10% [适配]
- tianzun4 道士：召唤物伤害、治疗 +10% [适配]

## 掉落（E1：官方 N÷40，不优于 1/8；minFloorLv 全部 ≥40）
| BOSS | 新增 |
|---|---|
| 祖玛教主 | 三神兵 1/100、嗜魂法杖 1/200、命运之刃 1/60（plan 未写命运来源，本块补 [适配]） |
| 牛魔王 | 三神兵 1/100、嗜魂 1/200 |
| 虹魔教主 | 40 级重装 1/20 |
| 赤月恶魔 | 三神兵 1/50 |
| 双头金刚 / 双头血魔 | 圣战 4 件 1/25 / 法神 4 件 1/25 |
| 合击 BOSS（HJ_GEAR） | 天尊 4 件 1/40；hj_home 另加重装 1/20、神兵 1/40、嗜魂 1/80、霸者 1/40 |
| 卧龙 | 龙盔 1/20、42 级衣 1/25 |
| 雷炎蛛王 | 雷霆系 12 件 1/30 |
| 魔龙教主 | 战神系 9 件 1/30、雷霆系 1/40、凤天 1/40 |
| 火龙 | 开天/镇天/玄天 1/40、凤天 1/25 |

D8/E5：set_zuma / set_chiyue 全部掉落表与 setDrop 移除；物品与 SETS 定义保留，旧存档穿戴仍计件（测试覆盖）。
D7 节奏提示：三圣单件 1/25 偏慢于“25–30 次一套”，留 P3（副本爆率）统一调。

## 美术 E4 图标 id 对照（恒等，40/40，不改美术命名）
| 美术文件（public/assets/items/） | 装备表 id | 名称 |
|---|---|---|
| eq_nuzhan.png / eq_nuzhan@2x.png | nuzhan | 怒斩 |
| eq_longya.png / eq_longya@2x.png | longya | 龙牙 |
| eq_xiaoyao_fan.png / eq_xiaoyao_fan@2x.png | xiaoyao_fan | 逍遥扇 |
| eq_shihun_staff.png / eq_shihun_staff@2x.png | shihun_staff | 嗜魂法杖 |
| eq_mingyun_blade.png / eq_mingyun_blade@2x.png | mingyun_blade | 命运之刃 |
| eq_bazhe_blade.png / eq_bazhe_blade@2x.png | bazhe_blade | 霸者之刃 |
| eq_kaitian.png / eq_kaitian@2x.png | kaitian | 开天 |
| eq_zhentian.png / eq_zhentian@2x.png | zhentian | 镇天 |
| eq_xuantian.png / eq_xuantian@2x.png | xuantian | 玄天 |
| eq_tianmo_armor.png / eq_tianmo_armor@2x.png | tianmo_armor | 天魔神甲 |
| eq_fashen_cape.png / eq_fashen_cape@2x.png | fashen_cape | 法神披风 |
| eq_tianzun_robe.png / eq_tianzun_robe@2x.png | tianzun_robe | 天尊道袍 |
| eq_leiting_armor.png / eq_leiting_armor@2x.png | leiting_armor | 雷霆战甲 |
| eq_lieyan_robe.png / eq_lieyan_robe@2x.png | lieyan_robe | 烈焰魔衣 |
| eq_guangmang_robe.png / eq_guangmang_robe@2x.png | guangmang_robe | 光芒道袍 |
| eq_fengtian_armor.png / eq_fengtian_armor@2x.png | fengtian_armor | 凤天魔甲 |
| eq_shenglong_helm.png / eq_shenglong_helm@2x.png | shenglong_helm | 圣龙盔 |
| eq_molong_helm.png / eq_molong_helm@2x.png | molong_helm | 魔龙盔 |
| eq_tianlong_helm.png / eq_tianlong_helm@2x.png | tianlong_helm | 天龙盔 |
| eq_leiting_necklace.png / eq_leiting_necklace@2x.png | leiting_necklace | 雷霆项链 |
| eq_leiting_bracelet.png / eq_leiting_bracelet@2x.png | leiting_bracelet | 雷霆护腕 |
| eq_leiting_ring.png / eq_leiting_ring@2x.png | leiting_ring | 雷霆战戒 |
| eq_leiting_boots.png / eq_leiting_boots@2x.png | leiting_boots | 雷霆战靴 |
| eq_lieyan_necklace.png / eq_lieyan_necklace@2x.png | lieyan_necklace | 烈焰项链 |
| eq_lieyan_bracelet.png / eq_lieyan_bracelet@2x.png | lieyan_bracelet | 烈焰护腕 |
| eq_lieyan_ring.png / eq_lieyan_ring@2x.png | lieyan_ring | 烈焰魔戒 |
| eq_lieyan_boots.png / eq_lieyan_boots@2x.png | lieyan_boots | 烈焰魔靴 |
| eq_guangmang_necklace.png / eq_guangmang_necklace@2x.png | guangmang_necklace | 光芒项链 |
| eq_guangmang_bracelet.png / eq_guangmang_bracelet@2x.png | guangmang_bracelet | 光芒护腕 |
| eq_guangmang_ring.png / eq_guangmang_ring@2x.png | guangmang_ring | 光芒道戒 |
| eq_guangmang_boots.png / eq_guangmang_boots@2x.png | guangmang_boots | 光芒道靴 |
| eq_zhanshen_necklace.png / eq_zhanshen_necklace@2x.png | zhanshen_necklace | 战神项链 |
| eq_zhanshen_bracelet.png / eq_zhanshen_bracelet@2x.png | zhanshen_bracelet | 战神手镯 |
| eq_zhanshen_ring.png / eq_zhanshen_ring@2x.png | zhanshen_ring | 战神戒指 |
| eq_shengmo_necklace.png / eq_shengmo_necklace@2x.png | shengmo_necklace | 圣魔项链 |
| eq_shengmo_bracelet.png / eq_shengmo_bracelet@2x.png | shengmo_bracelet | 圣魔手镯 |
| eq_shengmo_ring.png / eq_shengmo_ring@2x.png | shengmo_ring | 圣魔戒指 |
| eq_zhenhun_necklace.png / eq_zhenhun_necklace@2x.png | zhenhun_necklace | 真魂项链 |
| eq_zhenhun_bracelet.png / eq_zhenhun_bracelet@2x.png | zhenhun_bracelet | 真魂手镯 |
| eq_zhenhun_ring.png / eq_zhenhun_ring@2x.png | zhenhun_ring | 真魂戒指 |

## 给战斗开发的需求
1. 三圣 4 件特效：读 `world.setSpecials()`（string[]），实现 shengzhan4/fashen4/tianzun4 数值（上表 [适配]，可改）。
2. E6：魔血/虹魔/祈祷/记忆 特效本块**未实现**（物品仅属性）。
