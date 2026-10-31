# 美术缺口盘点：装备图标 + 怪物立绘（2026-10-31，art/gap-fill）

> 需求：「装备图标重新参考传奇设定进行补充生成，补全，怪物也是」。本文件为第一阶段盘点，**尚未生成任何图**。
> 外观要点来自 21cq 1.76 物品/怪物页图标观察、17173 怪物图鉴等公开资料，仅提炼颜色/形制/特征；生成时必须原创绘制，不得描摹或拷贝原版素材。

## 0. 现状与规则

- 装备数据：`src/data/items.ts`（ITEMS，含 R13/v1 新增件）+ `src/data/equip-official.ts`（EQUIP_META：档次/21cq id）。图标字段 `icon`，`src/loader.ts` 以 `item_<id>` 加载；**无占位逻辑**——文件不存在时只显示色块+文字（assets-manifest 注释）。
- 现有图标：`public/assets/items/*.png`，**64×64**（AI 图 `gen_*`、`set_*`；其余 `INV_*` 为魔兽世界客户端导出，assets-manifest 注明“公开前必须替换”）。全仓库**无 @2x** 文件。
- 怪物数据：`src/data/units.ts`（ENEMIES）。普通怪 `art` 缺省 = 自身 id，BOSS 由 `b()` 第 2 参数指定；贴图映射在 `src/assets-manifest.ts`（`<art>: assets/portraits/<art>_full.png`）。
- 现有怪物立绘：`public/assets/portraits/<art>_full.png`，透明 PNG，长边≈960（如 boss_woma 714×960、woma_guard 739×960、wolf 843×681），卡牌内按 `card.figureScale` 缩放。`*_old.png` 为旧版留档。
- 检查结果：84 件装备图标文件**全部存在**（无断链）；41 种怪物 + 召唤物贴图文件**全部存在**。缺口均为“借用他物/共用/版权占位”。

## 1. 装备图标缺口（74 件）

判定：除 9 件套装件（set_*）与铁靴（gen_boots）拥有独立 AI 图外，其余 74 件均为 WoW 占位或与他件共用图标。
建议文件：`public/assets/items/eq_<id>.png` 64×64 透明 PNG（可另交 `eq_<id>@2x.png` 128×128，需开发在 loader 选用；母版建议 256×256 保留在 raw）。交付后需开发把 ITEMS[id].icon 改指向新文件（本分支不改 src）。

| id | 名称 | 部位 | req | 档次 | 职业 | 当前图标 | 缺口类型 | 原作外观要点（21cq 图标观察） | 来源 | 建议文件名 | 优先级 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| wood_sword | 木剑 | 武器 | 1 | base | 通用 | `INV_Sword_01.png` | WoW 图标占位（版权，须替换）；与 4 件共用 | 细长木色直剑，木柄，无护手，朴素 | [21cq View 80](https://www.21cq.com/mir/View.aspx?id=80) | `eq_wood_sword.png` | P2 |
| iron_sword | 铁剑 | 武器 | 4 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 灰白直刃铁剑，金色小护手，棕柄 | [21cq View 85](https://www.21cq.com/mir/View.aspx?id=85) | `eq_iron_sword.png` | P2 |
| magic_staff | 魔杖 | 武器 | 6 | woma | 通用 | `INV_Sword_03.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 细长木杖，顶端弯钩如手杖，杖头橙红 | [21cq View 100](https://www.21cq.com/mir/View.aspx?id=100) | `eq_magic_staff.png` | P2 |
| tao_sword | 银蛇剑 | 武器 | 6 | woma | 通用 | `INV_Sword_04.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 银白细剑身带波纹（蛇形），护手镶红/蓝宝石 | [21cq View 101](https://www.21cq.com/mir/View.aspx?id=101) | `eq_tao_sword.png` | P2 |
| dragon_sword | 屠龙刀 | 武器 | 15 | base | 通用 | `INV_Sword_05.png` | WoW 图标占位（版权，须替换）；与 2 件共用 | 宽大厚重弯刀，刃身银白近似大砍刀，刀背有缺口，柄短（屠龙） | [21cq View 108](https://www.21cq.com/mir/View.aspx?id=108) | `eq_dragon_sword.png` | P2 |
| helmet | 青铜头盔 | 头盔 | 3 | base | 通用 | `INV_Helmet_01.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 青铜色尖顶圆盔，带护鼻 | [21cq View 147](https://www.21cq.com/mir/View.aspx?id=147) | `eq_helmet.png` | P3 |
| bone_helm | 骷髅头盔 | 头盔 | 10 | base | warrior | `INV_Helmet_03.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 粉红骷髅头造型头盔，头顶一圈尖刺 | [21cq View 150](https://www.21cq.com/mir/View.aspx?id=150) | `eq_bone_helm.png` | P3 |
| cloth | 布衣 | 衣服 | 1 | base | 通用 | `INV_Chest_Plate01.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 白色布衣折叠，金黄滚边 | [21cq View 116](https://www.21cq.com/mir/View.aspx?id=116) | `eq_cloth.png` | P3 |
| armor | 重盔甲 | 衣服 | 12 | base | 通用 | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 绿色胸甲配金/红饰，厚重板甲（重盔甲） | [21cq View 122](https://www.21cq.com/mir/View.aspx?id=122) | `eq_armor.png` | P3 |
| pearl | 黑珍珠项链 | 项链 | 5 | base | 通用 | `gen_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 未查到（本作自创/无对应 21cq 页） | — | `eq_pearl.png` | P3 |
| iron_ring | 铁戒指 | 戒指 | 2 | base | 通用 | `INV_Jewelry_Ring_01.png` | WoW 图标占位（版权，须替换） | 未查到（本作自创/无对应 21cq 页） | — | `eq_iron_ring.png` | P3 |
| gold_ring | 金戒指 | 戒指 | 9 | base | 通用 | `INV_Jewelry_Ring_03.png` | WoW 图标占位（版权，须替换） | 粗金戒指，金色宽圈 | [21cq View 206](https://www.21cq.com/mir/View.aspx?id=206) | `eq_gold_ring.png` | P3 |
| bracelet | 翡翠手镯 | 手镯 | 4 | base | 通用 | `gen_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 未查到（本作自创/无对应 21cq 页） | — | `eq_bracelet.png` | P3 |
| short_sword | 短剑 | 武器 | 10 | base | 通用 | `INV_Sword_01.png` | WoW 图标占位（版权，须替换）；与 4 件共用 | 弯曲细长刀（略带弧度），灰刃红柄 | [21cq View 84](https://www.21cq.com/mir/View.aspx?id=84) | `eq_short_sword.png` | P2 |
| bronze_sword | 青铜剑 | 武器 | 5 | base | 通用 | `INV_Sword_01.png` | WoW 图标占位（版权，须替换）；与 4 件共用 | 青铜色直剑，刃窄，木柄 | [21cq View 83](https://www.21cq.com/mir/View.aspx?id=83) | `eq_bronze_sword.png` | P2 |
| dagger | 匕首 | 武器 | 1 | base | 通用 | `INV_Sword_01.png` | WoW 图标占位（版权，须替换）；与 4 件共用 | 短匕首，深色刃，木柄 | [21cq View 81](https://www.21cq.com/mir/View.aspx?id=81) | `eq_dagger.png` | P2 |
| ebony_sword | 乌木剑 | 武器 | 1 | base | 通用 | `INV_Sword_01.png` | WoW 图标占位（版权，须替换）；与 4 件共用 | 乌木色（深棕/黑）长剑，细直 | [21cq View 82](https://www.21cq.com/mir/View.aspx?id=82) | `eq_ebony_sword.png` | P2 |
| bronze_axe | 青铜斧 | 武器 | 13 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 青铜双刃短柄斧，斧面宽大带绿锈 | [21cq View 87](https://www.21cq.com/mir/View.aspx?id=87) | `eq_bronze_axe.png` | P2 |
| bahuang | 八荒 | 武器 | 15 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 暗色宽刃长刀，刃身带木质/铜色纹 | [21cq View 89](https://www.21cq.com/mir/View.aspx?id=89) | `eq_bahuang.png` | P2 |
| banyue | 半月 | 武器 | 15 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 弯月形弯刀，刃面银亮，柄端有蓝色饰 | [21cq View 91](https://www.21cq.com/mir/View.aspx?id=91) | `eq_banyue.png` | P2 |
| haihun | 海魂 | 武器 | 15 | base | 通用 | `INV_Sword_03.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 三叉戟/细长叉，黑色杆 | [21cq View 90](https://www.21cq.com/mir/View.aspx?id=90) | `eq_haihun.png` | P2 |
| lingfeng | 凌风 | 武器 | 19 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 长直剑，刃银白，柄端红/蓝宝石 | [21cq View 92](https://www.21cq.com/mir/View.aspx?id=92) | `eq_lingfeng.png` | P2 |
| xiangmo | 降魔 | 武器 | 20 | base | 通用 | `INV_Sword_04.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 细长弯剑（偏日本刀），金色护手 | [21cq View 96](https://www.21cq.com/mir/View.aspx?id=96) | `eq_xiangmo.png` | P1 |
| yanyue | 偃月 | 武器 | 20 | base | 通用 | `INV_Sword_03.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 偃月刀：长柄，刃头弯月形 | [21cq View 95](https://www.21cq.com/mir/View.aspx?id=95) | `eq_yanyue.png` | P1 |
| xiuluo | 修罗 | 武器 | 22 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 长柄单刃大斧，斧刃宽阔、带尖钩 | [21cq View 97](https://www.21cq.com/mir/View.aspx?id=97) | `eq_xiuluo.png` | P1 |
| zhanma | 斩马刀 | 武器 | 20 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 长柄斩马刀，刃宽而弯，带刃钩 | [21cq View 94](https://www.21cq.com/mir/View.aspx?id=94) | `eq_zhanma.png` | P1 |
| pohun | 破魂 | 武器 | 22 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 短小双叉刃，金色装饰，形如分叉匕首 | [21cq View 93](https://www.21cq.com/mir/View.aspx?id=93) | `eq_pohun.png` | P1 |
| ningshuang | 凝霜 | 武器 | 25 | base | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 直剑，刃银蓝，护手金色（凝霜） | [21cq View 98](https://www.21cq.com/mir/View.aspx?id=98) | `eq_ningshuang.png` | P1 |
| lianyu | 炼狱 | 武器 | 26 | woma | 通用 | `INV_Sword_02.png` | WoW 图标占位（版权，须替换）；与 9 件共用 | 双刃巨斧（炼狱），斧面宽大，长柄深红 | [21cq View 99](https://www.21cq.com/mir/View.aspx?id=99) | `eq_lianyu.png` | P1 |
| jingzhongyue | 井中月 | 武器 | 28 | woma | 通用 | `INV_Sword_05.png` | WoW 图标占位（版权，须替换）；与 2 件共用 | 宽大弯刃大刀（井中月），刃身银白微弧 | [21cq View 102](https://www.21cq.com/mir/View.aspx?id=102) | `eq_jingzhongyue.png` | P1 |
| wujigun | 无极棍 | 武器 | 30 | woma | taoist | `INV_Sword_04.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 细长金色长棍，两端金箍 | [21cq View 104](https://www.21cq.com/mir/View.aspx?id=104) | `eq_wujigun.png` | P1 |
| longwen | 龙纹剑 | 武器 | 35 | zuma | 通用 | `INV_Sword_04.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 宽弯刀，刃银白带金色纹饰，金柄（龙纹剑） | [21cq View 107](https://www.21cq.com/mir/View.aspx?id=107) | `eq_longwen.png` | P1 |
| caijue | 裁决之杖 | 武器 | 30 | zuma | 通用 | `INV_Sword_05.png` | WoW 图标占位（版权，须替换）；与 2 件共用 | 权杖/狼牙棒：黑色粗杖身嵌蓝色宝石与尖刺（裁决之杖） | [21cq View 105](https://www.21cq.com/mir/View.aspx?id=105) | `eq_caijue.png` | P1 |
| guyu | 骨玉权杖 | 武器 | 26 | zuma | 通用 | `INV_Sword_03.png` | WoW 图标占位（版权，须替换）；与 3 件共用 | 白骨色弯曲权杖，顶端带骨质弯钩，紫色饰物（骨玉权杖） | [21cq View 106](https://www.21cq.com/mir/View.aspx?id=106) | `eq_guyu.png` | P1 |
| light_armor | 轻型盔甲 | 衣服 | 11 | base | 通用 | `INV_Chest_Plate01.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 浅灰/蓝白相间轻甲折叠 | [21cq View 118](https://www.21cq.com/mir/View.aspx?id=118) | `eq_light_armor.png` | P3 |
| soul_robe | 灵魂战衣 | 衣服 | 22 | base | 通用 | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 白色长袍带灰蓝饰纹（灵魂战衣） | [21cq View 126](https://www.21cq.com/mir/View.aspx?id=126) | `eq_soul_robe.png` | P3 |
| magic_robe | 魔法长袍 | 衣服 | 22 | base | 通用 | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 深褐/紫色长袍，带彩色宝石装饰（魔法长袍） | [21cq View 124](https://www.21cq.com/mir/View.aspx?id=124) | `eq_magic_robe.png` | P3 |
| war_armor | 战神盔甲 | 衣服 | 30 | zuma | warrior | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 绿色胸甲带金红饰，比重盔甲更华丽（战神盔甲） | [21cq View 128](https://www.21cq.com/mir/View.aspx?id=128) | `eq_war_armor.png` | P1 |
| ghost_robe | 幽灵战衣 | 衣服 | 30 | zuma | taoist | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 白银色道袍，带灰黑纹（幽灵战衣） | [21cq View 132](https://www.21cq.com/mir/View.aspx?id=132) | `eq_ghost_robe.png` | P1 |
| demon_robe | 恶魔长袍 | 衣服 | 30 | zuma | mage | `INV_Chest_Plate03.png` | WoW 图标占位（版权，须替换）；与 5 件共用 | 深色紫褐长袍，嵌粉紫宝石（恶魔长袍） | [21cq View 130](https://www.21cq.com/mir/View.aspx?id=130) | `eq_demon_robe.png` | P1 |
| tao_helm | 道士头盔 | 头盔 | 24 | base | 通用 | `INV_Helmet_03.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 橙铜色面罩式头盔，两侧角，覆盖脸部（道士头盔） | [21cq View 149](https://www.21cq.com/mir/View.aspx?id=149) | `eq_tao_helm.png` | P3 |
| magic_helm | 魔法头盔 | 头盔 | 14 | base | 通用 | `INV_Helmet_01.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 青铜色尖顶盔，顶上红缨（魔法头盔） | [21cq View 148](https://www.21cq.com/mir/View.aspx?id=148) | `eq_magic_helm.png` | P3 |
| ghost_necklace | 幽灵项链 | 项链 | 24 | woma | 通用 | `set_woma_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 金链挂白色獠牙/兽牙吊坠（幽灵项链） | [21cq View 168](https://www.21cq.com/mir/View.aspx?id=168) | `eq_ghost_necklace.png` | P2 |
| dragon_ring | 龙之戒指 | 戒指 | 24 | woma | warrior | `INV_Jewelry_Ring_02.png` | WoW 图标占位（版权，须替换） | 金色盘龙造型戒指 | [21cq View 212](https://www.21cq.com/mir/View.aspx?id=212) | `eq_dragon_ring.png` | P2 |
| ghost_glove | 幽灵手套 | 手镯 | 25 | woma | 通用 | `set_woma_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 灰色金属手套，五指分明（幽灵手套） | [21cq View 189](https://www.21cq.com/mir/View.aspx?id=189) | `eq_ghost_glove.png` | P2 |
| life_necklace | 生命项链 | 项链 | 24 | woma | mage | `set_woma_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 紫粉色宝石吊坠，蓝色链（生命项链） | [21cq View 169](https://www.21cq.com/mir/View.aspx?id=169) | `eq_life_necklace.png` | P2 |
| ruby_ring | 红宝石戒指 | 戒指 | 24 | woma | mage | `INV_Jewelry_Ring_04.png` | WoW 图标占位（版权，须替换） | 金戒托镶大颗红宝石 | [21cq View 213](https://www.21cq.com/mir/View.aspx?id=213) | `eq_ruby_ring.png` | P2 |
| sibeier_bracelet | 思贝儿手镯 | 手镯 | 24 | woma | mage | `set_woma_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 金色宽手镯，镶一排绿宝石（思贝儿手镯） | [21cq View 190](https://www.21cq.com/mir/View.aspx?id=190) | `eq_sibeier_bracelet.png` | P2 |
| tianzhu_necklace | 天珠项链 | 项链 | 24 | woma | taoist | `set_woma_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 金链挂白色圆盘/珠饰（天珠项链） | [21cq View 170](https://www.21cq.com/mir/View.aspx?id=170) | `eq_tianzhu_necklace.png` | P2 |
| platinum_ring | 铂金戒指 | 戒指 | 24 | woma | taoist | `INV_Jewelry_Ring_05.png` | WoW 图标占位（版权，须替换） | 银白色铂金戒指，带扭曲造型 | [21cq View 214](https://www.21cq.com/mir/View.aspx?id=214) | `eq_platinum_ring.png` | P2 |
| heart_bracelet | 心灵手镯 | 手镯 | 24 | woma | taoist | `set_woma_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 银白宽圈手镯，下方挂金色垂饰（心灵手镯） | [21cq View 195](https://www.21cq.com/mir/View.aspx?id=195) | `eq_heart_bracelet.png` | P2 |
| green_necklace | 绿色项链 | 项链 | 30 | zuma | warrior | `gen_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 粉紫链挂绿色羽毛/宝石吊坠（绿色项链） | [21cq View 171](https://www.21cq.com/mir/View.aspx?id=171) | `eq_green_necklace.png` | P1 |
| power_ring | 力量戒指 | 戒指 | 30 | zuma | warrior | `set_zuma_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 灰银宽戒，顶端一排尖刺（力量戒指） | [21cq View 215](https://www.21cq.com/mir/View.aspx?id=215) | `eq_power_ring.png` | P1 |
| knight_bracelet | 骑士手镯 | 手镯 | 30 | zuma | warrior | `gen_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 金色手镯带灰色骑士头/狼头装饰 | [21cq View 193](https://www.21cq.com/mir/View.aspx?id=193) | `eq_knight_bracelet.png` | P1 |
| demon_bell | 恶魔铃铛 | 项链 | 30 | zuma | mage | `gen_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 铜链挂两枚金色铃铛（恶魔铃铛） | [21cq View 172](https://www.21cq.com/mir/View.aspx?id=172) | `eq_demon_bell.png` | P1 |
| zibiluo | 紫碧螺 | 戒指 | 30 | zuma | mage | `set_zuma_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 暗红/紫褐色大宝石戒指（紫碧螺） | [21cq View 216](https://www.21cq.com/mir/View.aspx?id=216) | `eq_zibiluo.png` | P1 |
| dragon_bracelet | 龙之手镯 | 手镯 | 30 | zuma | mage | `gen_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 银灰色宽手镯，环周带尖齿/鳞片（龙之手镯） | [21cq View 194](https://www.21cq.com/mir/View.aspx?id=194) | `eq_dragon_bracelet.png` | P1 |
| soul_necklace | 灵魂项链 | 项链 | 30 | zuma | taoist | `gen_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 金色圆形吊坠，中间紫色宝石（灵魂项链） | [21cq View 173](https://www.21cq.com/mir/View.aspx?id=173) | `eq_soul_necklace.png` | P1 |
| titan_ring | 泰坦戒指 | 戒指 | 30 | zuma | taoist | `set_zuma_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 银色粗戒，表面浮雕 | [21cq View 217](https://www.21cq.com/mir/View.aspx?id=217) | `eq_titan_ring.png` | P1 |
| sanyan_bracelet | 三眼手镯 | 手镯 | 30 | zuma | taoist | `gen_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 金色宽手镯镶三颗蓝绿宝石（三眼） | [21cq View 191](https://www.21cq.com/mir/View.aspx?id=191) | `eq_sanyan_bracelet.png` | P1 |
| shengzhan_helm | 圣战头盔 | 头盔 | 35 | chiyue | warrior | `INV_Helmet_04.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 金色高冠头盔，两侧上扬尖角，红色饰（圣战头盔） | [21cq View 232](https://www.21cq.com/mir/View.aspx?id=232) | `eq_shengzhan_helm.png` | P1 |
| shengzhan_necklace | 圣战项链 | 项链 | 35 | chiyue | warrior | `set_chiyue_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 银白链串白色獠牙/尖齿（圣战项链） | [21cq View 233](https://www.21cq.com/mir/View.aspx?id=233) | `eq_shengzhan_necklace.png` | P1 |
| shengzhan_ring | 圣战戒指 | 戒指 | 35 | chiyue | warrior | `set_chiyue_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 金戒托镶红宝石，小巧 | [21cq View 235](https://www.21cq.com/mir/View.aspx?id=235) | `eq_shengzhan_ring.png` | P1 |
| shengzhan_bracelet | 圣战手镯 | 手镯 | 35 | chiyue | warrior | `set_chiyue_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 红褐色珠串手链（圣战手镯） | [21cq View 234](https://www.21cq.com/mir/View.aspx?id=234) | `eq_shengzhan_bracelet.png` | P1 |
| fashen_helm | 法神头盔 | 头盔 | 35 | chiyue | mage | `INV_Helmet_05.png` | WoW 图标占位（版权，须替换） | 金色冠冕，正面宽翼形，中央尖饰（法神头盔） | [21cq View 236](https://www.21cq.com/mir/View.aspx?id=236) | `eq_fashen_helm.png` | P1 |
| fashen_necklace | 法神项链 | 项链 | 35 | chiyue | mage | `set_chiyue_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 银链挂蓝色宝石吊坠（法神项链） | [21cq View 237](https://www.21cq.com/mir/View.aspx?id=237) | `eq_fashen_necklace.png` | P1 |
| fashen_ring | 法神戒指 | 戒指 | 35 | chiyue | mage | `set_chiyue_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 金戒托镶红/紫宝石 | [21cq View 239](https://www.21cq.com/mir/View.aspx?id=239) | `eq_fashen_ring.png` | P1 |
| fashen_bracelet | 法神手镯 | 手镯 | 35 | chiyue | mage | `set_chiyue_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 蓝金相间珠串手链（法神手镯） | [21cq View 238](https://www.21cq.com/mir/View.aspx?id=238) | `eq_fashen_bracelet.png` | P1 |
| tianzun_helm | 天尊头盔 | 头盔 | 35 | chiyue | taoist | `INV_Helmet_02.png` | WoW 图标占位（版权，须替换） | 金色高耸冠，层叠尖饰（天尊头盔） | [21cq View 240](https://www.21cq.com/mir/View.aspx?id=240) | `eq_tianzun_helm.png` | P1 |
| tianzun_necklace | 天尊项链 | 项链 | 35 | chiyue | taoist | `set_chiyue_necklace.png` | 与 3 件共用；借用套装/通用 AI 图 | 金色细链挂白色月牙/钩形吊坠（天尊项链） | [21cq View 241](https://www.21cq.com/mir/View.aspx?id=241) | `eq_tianzun_necklace.png` | P1 |
| tianzun_ring | 天尊戒指 | 戒指 | 35 | chiyue | taoist | `set_chiyue_ring.png` | 与 3 件共用；借用套装/通用 AI 图 | 绿色玉质戒指（天尊戒指） | [21cq View 243](https://www.21cq.com/mir/View.aspx?id=243) | `eq_tianzun_ring.png` | P1 |
| tianzun_bracelet | 天尊手镯 | 手镯 | 35 | chiyue | taoist | `set_chiyue_bracelet.png` | 与 3 件共用；借用套装/通用 AI 图 | 绿红相间珠串手链（天尊手镯） | [21cq View 242](https://www.21cq.com/mir/View.aspx?id=242) | `eq_tianzun_bracelet.png` | P1 |
| black_iron_helm | 黑铁头盔 | 头盔 | 30 | zuma | warrior | `INV_Helmet_04.png` | WoW 图标占位（版权，须替换）；与 1 件共用 | 银灰铁盔，护面带横向观察缝，全包式（黑铁头盔） | [21cq View 151](https://www.21cq.com/mir/View.aspx?id=151) | `eq_black_iron_helm.png` | P1 |
| medium_armor | 中型盔甲 | 衣服 | 16 | base | 通用 | `INV_Chest_Plate02.png` | WoW 图标占位（版权，须替换） | 灰白/蓝色中型盔甲折叠 | [21cq View 120](https://www.21cq.com/mir/View.aspx?id=120) | `eq_medium_armor.png` | P3 |

附：消耗品/杂物（不在本次范围，供参考）：hp/mp 药水、强效药、太阳水、回城卷、地牢逃脱卷、沃玛号角、金币、鸡肉、鹿肉、骷髅骨头 仍用 WoW 图标（INV_*），公开前同样需替换。

## 2. 怪物立绘缺口（游戏内 22 种 + 召唤神兽 1）

判定：普通怪 / BOSS 借用其他怪的立绘（同图换名）。自有立绘的 19 种（deer bat wolf spider skeleton zombie orc darkmage woma_guard zuma_statue blood_zombie + 8 BOSS：wolf_king spider_queen skeleton_lord orc_chief boss_lich boss_woma boss_zuma boss_redmoon）无缺口。
建议文件：`public/assets/portraits/<id>_full.png` 透明 PNG，长边 960（普通怪约 760×960，BOSS 可横向 960×800）；可另备 `<id>_full@2x.png`（1920 长边）母版。交付后需开发在 assets-manifest 增加 key 并把 BOSS 的 art 改为新 key（本分支不改 src）。

| id | 名称 | 所在地图（层） | 等级 | BOSS | 当前贴图（借用） | 缺口类型 | 原作外观要点 | 来源 | 建议文件名 | 优先级 |
|---|---|---|---|---|---|---|---|---|---|---|
| tree_demon | 万年树妖（原版：千年树妖） | 4.毒蛇山谷 | 14 | 是 | `boss_spider_queen_full.png` | 借用他怪立绘 | 巨大古树：粗壮褐色树干、浓密绿色树冠，根部盘结；整体就是一棵树（无明显五官）。传说为封魔谷千年见证者 | [21cq Mob195](https://www.21cq.com/mir/Mob.Aspx?ID=195)；[17173 图鉴](https://mir.17173.com/monster/monster5.htm) | `tree_demon_full.png` | P1 |
| boss_chulong | 触龙神 | 7.蜈蚣洞 | 19 | 是 | `boss_spider_queen_full.png` | 借用他怪立绘 | 巨型多足虫形 BOSS：土黄/橙褐色分节甲壳，大量弯曲带刺的长腿/触须向外张开，从地下钻出（死亡棺材） | [21cq Mob124](https://www.21cq.com/mir/Mob.Aspx?ID=124) | `boss_chulong_full.png` | P1 |
| boss_white_boar | 白野猪 | 8.石墓·猪洞 | 21 | 是 | `boss_wolf_king_full.png` | 借用他怪立绘 | 灰白色直立野猪人，肥壮身躯，獠牙，单手挥带尖刺的流星锤 | [21cq Mob135](https://www.21cq.com/mir/Mob.Aspx?ID=135) | `boss_white_boar_full.png` | P1 |
| boss_bull_king | 牛魔王 | 11.牛魔寺庙 | 30 | 是 | `boss_orc_chief_full.png` | 借用他怪立绘 | 金橙色重甲牛头魔，双角，背后飘蓝色绸带/披风，手持弯刃长柄武器，威武站姿 | [21cq Mob224](https://www.21cq.com/mir/Mob.Aspx?ID=224) | `boss_bull_king_full.png` | P1 |
| boss_hongmo | 虹魔教主 | 12.封魔殿 | 31 | 是 | `boss_woma_full.png` | 借用他怪立绘 | 高大墨绿色恶魔，头顶一对长弯角，獠牙，肌肉粗壮弓背，腰挂红色饰物；背景：堕落英雄化身邪魔 | [21cq Mob193](https://www.21cq.com/mir/Mob.Aspx?ID=193)；[17173 图鉴](https://mir.17173.com/monster/monster5.htm) | `boss_hongmo_full.png` | P1 |
| woma_warrior | 沃玛战士 | 9.沃玛寺庙 | 20 | 否 | `orc_full.png` | 借用他怪立绘 | 深灰黑色魁梧兽人，驼背，皮肤粗糙，长尾，赤手/爪攻击 | [21cq Mob64](https://www.21cq.com/mir/Mob.Aspx?ID=64) | `woma_warrior_full.png` | P2 |
| zuma_guard | 祖玛卫士 | 10.祖玛阁 | 25 | 否 | `orc_full.png` | 借用他怪立绘 | 灰白石质雕像兵，粗壮人形、头有角饰，双手横持巨大石锤 | [21cq Mob156](https://www.21cq.com/mir/Mob.Aspx?ID=156) | `zuma_guard_full.png` | P2 |
| redmoon_spider | 赤月蜘蛛（原版无此名） | 13.赤月魔穴 | 29 | 否 | `spider_full.png` | 借用他怪立绘 | 原版无“赤月蜘蛛”，建议参照天狼蜘蛛：头顶红宝石般眼睛、背部布满尖刺、狼牙般突出獠牙、背上红色肉瘤 | [17173 图鉴](https://mir.17173.com/monster/monster5.htm)；[网易 天狼蜘蛛](https://www.163.com/dy/article/IJ28ETC20546NRAR.html) | `redmoon_spider_full.png` | P2 |
| bull_warrior | 牛魔战士 | 11.牛魔寺庙 | 25 | 否 | `orc_full.png` | 借用他怪立绘 | 深蓝铠甲牛头人，金色肩甲与角，双手持金色大斧/双刃战斧 | [21cq Mob212](https://www.21cq.com/mir/Mob.Aspx?ID=212) | `bull_warrior_full.png` | P2 |
| bull_mage | 牛魔法师 | 11.牛魔寺庙 | 26 | 否 | `darkmage_full.png` | 借用他怪立绘 | 瘦高牛头人法师，蓝色长袍带金纹，白色弯角，手持细长法杖 | [21cq Mob220](https://www.21cq.com/mir/Mob.Aspx?ID=220) | `bull_mage_full.png` | P2 |
| bull_guard | 牛魔侍卫 | 11.牛魔寺庙 | 26 | 否 | `orc_full.png` | 借用他怪立绘 | 深灰钢甲牛头人，双角，手持长柄大镰斧（月牙斧） | [21cq Mob216](https://www.21cq.com/mir/Mob.Aspx?ID=216) | `bull_guard_full.png` | P2 |
| hongmo_pig | 虹魔猪卫 | 12.封魔殿 | 27 | 否 | `orc_full.png` | 借用他怪立绘 | 黄褐色野猪头魔卫，白色鬃毛/角，獠牙，手持巨斧；背景：英雄的贴身护卫被诅咒 | [21cq Mob188](https://www.21cq.com/mir/Mob.Aspx?ID=188)；[17173 图鉴](https://mir.17173.com/monster/monster5.htm) | `hongmo_pig_full.png` | P2 |
| hongmo_scorpion | 虹魔蝎卫 | 12.封魔殿 | 27 | 否 | `spider_full.png` | 借用他怪立绘 | 巨大墨绿色蝎形魔，巨大双钳，尾巴高翘，身上有绿色晶刺；会放闪电 | [21cq Mob191](https://www.21cq.com/mir/Mob.Aspx?ID=191)；[17173 图鉴](https://mir.17173.com/monster/monster5.htm) | `hongmo_scorpion_full.png` | P2 |
| red_snake | 红蛇 | 4.毒蛇山谷 | 10 | 否 | `spider_full.png` | 借用他怪立绘 | 红/粉红色长蛇，鳞片带浅色斑纹，盘曲昂头 | [21cq Mob92](https://www.21cq.com/mir/Mob.Aspx?ID=92) | `red_snake_full.png` | P3 |
| tiger_snake | 虎蛇 | 4.毒蛇山谷 | 11 | 否 | `spider_full.png` | 借用他怪立绘 | 金黄底黑褐虎斑大蛇，盘曲 | [21cq Mob94](https://www.21cq.com/mir/Mob.Aspx?ID=94) | `tiger_snake_full.png` | P3 |
| scorpion | 蝎子 | 4.毒蛇山谷 | 11 | 否 | `spider_full.png` | 借用他怪立绘 | 土黄/沙色巨蝎，双钳前伸，尾针高翘 | [21cq Mob45](https://www.21cq.com/mir/Mob.Aspx?ID=45) | `scorpion_full.png` | P3 |
| centipede | 蜈蚣 | 7.蜈蚣洞 | 15 | 否 | `spider_full.png` | 借用他怪立绘 | 细长多节蜈蚣，橙黄色带黑节，大量细腿 | [21cq Mob110](https://www.21cq.com/mir/Mob.Aspx?ID=110) | `centipede_full.png` | P3 |
| jump_bee | 跳跳蜂 | 7.蜈蚣洞 | 16 | 否 | `bat_full.png` | 借用他怪立绘 | 绿褐色虫形，长弯曲尾/腹部，身体有灰白翼膜，伏地跳跃姿态 | [21cq Mob114](https://www.21cq.com/mir/Mob.Aspx?ID=114) | `jump_bee_full.png` | P3 |
| black_maggot | 黑色恶蛆 | 7.蜈蚣洞 | 17 | 否 | `zombie_full.png` | 借用他怪立绘 | 黑色圆形“轮胎”状：身体蜷成圈、坚硬外壳、背部尖刺、两只爪子撑地，旋转撞击 | [他也玩传奇](https://www.tayewan.com/thread-40833-1-1.html)；[17173](https://news.17173.com/z/cq2024/content/09302024/174833789.shtml) | `black_maggot_full.png` | P3 |
| red_boar | 红野猪 | 8.石墓·猪洞 | 18 | 否 | `wolf_full.png` | 借用他怪立绘 | 红褐色直立野猪人，肥壮，獠牙，手持带刺狼牙棒 | [21cq Mob129](https://www.21cq.com/mir/Mob.Aspx?ID=129) | `red_boar_full.png` | P3 |
| black_boar | 黑野猪 | 8.石墓·猪洞 | 19 | 否 | `wolf_full.png` | 借用他怪立绘 | 黑灰色直立野猪人，体型更壮，獠牙，持带刺狼牙棒 | [21cq Mob132](https://www.21cq.com/mir/Mob.Aspx?ID=132) | `black_boar_full.png` | P3 |
| scorpion_snake | 蝎蛇 | 8.石墓·猪洞 | 19 | 否 | `spider_full.png` | 借用他怪立绘 | 蛇身蝎首：橙褐色分节长蛇身，前端有一对大钳，尾部弯钩 | [21cq Mob138](https://www.21cq.com/mir/Mob.Aspx?ID=138) | `scorpion_snake_full.png` | P3 |
| summon_beast | 神兽（道士召唤，友方） | —（召唤物） | 1 | 否 | `wolf_full.png` | 借用他怪立绘 | 未查到（21cq 有“道士骷髅神兽属性”页但无外观描述） | [21cq 资料](https://www.21cq.com/mir/) | `summon_beast_full.png` | P3 |

### 2.1 规划中地图的怪（map-system-full.md §4，尚未进游戏，P4 预备）

| 名称 | 规划地图 | 原作外观要点（21cq 图标观察） | 来源 |
|---|---|---|---|
| 雪人王 | 白日门野外 | 披长毛的土黄色巨型雪人/猿形，弓背 | [21cq Mob33](https://www.21cq.com/mir/Mob.aspx?id=33) |
| 半兽统领 | 封魔谷野外 | 灰绿皮肤兽人头领，穿皮甲，持大斧 | [21cq Mob42](https://www.21cq.com/mir/Mob.aspx?id=42) |
| 恶灵尸王 | 尸魔洞 | 血肉模糊的红色腐尸，佝偻，身挂碎布 | [21cq Mob198](https://www.21cq.com/mir/Mob.aspx?id=198) |
| 黄泉教主 | 骨魔洞 | 白骨甲骷髅魔将，牛角盔，红披风，持白骨巨锤 | [21cq Mob208](https://www.21cq.com/mir/Mob.aspx?id=208) |
| 鹰卫 | 丛林迷宫 | 银甲弓手，背箭筒，持长弓 | [21cq Mob186](https://www.21cq.com/mir/Mob.aspx?id=186) |
| 双头金刚 / 双头血魔 | 赤月峡谷 | 双头融合的巨猿，肌肉外凸（金刚）；双头血红色魔（血魔）。仅文字描述，图像未查 | [17173 图鉴](https://mir.17173.com/monster/monster5.htm) |

## 3. 生成分批与优先级建议

| 批次 | 内容 | 数量 | 说明 |
|---|---|---|---|
| M1（P1） | 怪物 BOSS：千年树妖、触龙神、白野猪、牛魔王、虹魔教主 | 5 | BOSS 卡最显眼，且目前与其他 BOSS 撞图 |
| E1（P1） | 祖玛/赤月档 + req≥20 武器 | 37 | 高阶装备最常被展示 |
| M2（P2） | 沃玛战士、祖玛卫士、赤月蜘蛛、牛魔战士/法师/侍卫、虹魔猪卫/蝎卫 | 8 | 中后期地图主力怪 |
| E2（P2） | 沃玛档 + 其余武器 | 23 | |
| M3（P3） | 红蛇、虎蛇、蝎子、蜈蚣、跳跳蜂、黑色恶蛆、红/黑野猪、蝎蛇、神兽 | 10 | 前中期小怪 |
| E3（P3） | 基础档防具/首饰（青铜头盔、布衣、重盔甲、金戒指等） | 14 | |
| M4（P4，可选） | 规划地图怪（§2.1） | 6+ | 等地图进游戏再做 |

工作量估计：装备图标可按 4×4 网格一次生成 16 个再切图（每批 1–2 张 GenerateImage），74 件约 6–8 次生成 + 切图/抠图/统一描边，约 2–3 小时；怪物立绘每只 1 次生成（失败重试约 30%），23 只约 30 次生成 + 抠图自检，约 3–4 小时。合计约 5–7 小时（不含开发接入 src）。

## 4. 未查到清单

- pearl 黑珍珠项链、iron_ring 铁戒指、bracelet 翡翠手镯：本作自创，无 21cq 对应页，外观未查到（按名称原创设计）。
- 赤月蜘蛛：原版无此名，暂参照天狼蜘蛛。
- 神兽：外观未查到图文资料。
- 双头金刚 / 双头血魔：仅有文字图鉴，未核对图像。

<!-- DELIVERED -->
## 已交付（第二阶段，分支 art/gap-fill）

| 批次 | id | 名称 | 文件 | 尺寸 | 外观 |
|---|---|---|---|---|---|
| M1 | tree_demon | 千年树妖 | `public/assets/portraits/tree_demon_full.png` | 723×960 | 参考原作：原作为树形怪，此处做成人形树妖（有改编） |
| M1 | boss_chulong | 触龙神 | `public/assets/portraits/boss_chulong_full.png` | 727×960 | 参考原作 |
| M1 | boss_white_boar | 白野猪 | `public/assets/portraits/boss_white_boar_full.png` | 744×960 | 参考原作 |
| M1 | boss_bull_king | 牛魔王 | `public/assets/portraits/boss_bull_king_full.png` | 721×960 | 参考原作 |
| M1 | boss_hongmo | 虹魔教主 | `public/assets/portraits/boss_hongmo_full.png` | 712×960 | 参考原作：M2 批按原作墨绿色恶魔重做替换 |
| E1 | xiangmo | 降魔 | `public/assets/items/eq_xiangmo.png`（+@2x） | 64×64 | 参考原作 |
| E1 | yanyue | 偃月 | `public/assets/items/eq_yanyue.png`（+@2x） | 64×64 | 参考原作 |
| E1 | xiuluo | 修罗 | `public/assets/items/eq_xiuluo.png`（+@2x） | 64×64 | 参考原作 |
| E1 | zhanma | 斩马刀 | `public/assets/items/eq_zhanma.png`（+@2x） | 64×64 | 参考原作 |
| E1 | pohun | 破魂 | `public/assets/items/eq_pohun.png`（+@2x） | 64×64 | 参考原作 |
| E1 | ningshuang | 凝霜 | `public/assets/items/eq_ningshuang.png`（+@2x） | 64×64 | 参考原作 |
| E1 | lianyu | 炼狱 | `public/assets/items/eq_lianyu.png`（+@2x） | 64×64 | 参考原作 |
| E1 | jingzhongyue | 井中月 | `public/assets/items/eq_jingzhongyue.png`（+@2x） | 64×64 | 参考原作 |
| E1 | wujigun | 无极棍 | `public/assets/items/eq_wujigun.png`（+@2x） | 64×64 | 参考原作 |
| E1 | longwen | 龙纹剑 | `public/assets/items/eq_longwen.png`（+@2x） | 64×64 | 参考原作 |
| E1 | caijue | 裁决之杖 | `public/assets/items/eq_caijue.png`（+@2x） | 64×64 | 参考原作 |
| E1 | guyu | 骨玉权杖 | `public/assets/items/eq_guyu.png`（+@2x） | 64×64 | 参考原作 |
| E1 | war_armor | 战神盔甲 | `public/assets/items/eq_war_armor.png`（+@2x） | 64×64 | 参考原作 |
| E1 | ghost_robe | 幽灵战衣 | `public/assets/items/eq_ghost_robe.png`（+@2x） | 64×64 | 参考原作 |
| E1 | demon_robe | 恶魔长袍 | `public/assets/items/eq_demon_robe.png`（+@2x） | 64×64 | 参考原作 |
| E1 | black_iron_helm | 黑铁头盔 | `public/assets/items/eq_black_iron_helm.png`（+@2x） | 64×64 | 参考原作 |
| E1 | green_necklace | 绿色项链 | `public/assets/items/eq_green_necklace.png`（+@2x） | 64×64 | 参考原作 |
| E1 | power_ring | 力量戒指 | `public/assets/items/eq_power_ring.png`（+@2x） | 64×64 | 参考原作 |
| E1 | knight_bracelet | 骑士手镯 | `public/assets/items/eq_knight_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| E1 | demon_bell | 恶魔铃铛 | `public/assets/items/eq_demon_bell.png`（+@2x） | 64×64 | 参考原作 |
| E1 | zibiluo | 紫碧螺 | `public/assets/items/eq_zibiluo.png`（+@2x） | 64×64 | 参考原作 |
| E1 | dragon_bracelet | 龙之手镯 | `public/assets/items/eq_dragon_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| E1 | soul_necklace | 灵魂项链 | `public/assets/items/eq_soul_necklace.png`（+@2x） | 64×64 | 参考原作 |
| E1 | titan_ring | 泰坦戒指 | `public/assets/items/eq_titan_ring.png`（+@2x） | 64×64 | 参考原作 |
| E1 | sanyan_bracelet | 三眼手镯 | `public/assets/items/eq_sanyan_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| E1 | shengzhan_helm | 圣战头盔 | `public/assets/items/eq_shengzhan_helm.png`（+@2x） | 64×64 | 参考原作 |
| E1 | shengzhan_necklace | 圣战项链 | `public/assets/items/eq_shengzhan_necklace.png`（+@2x） | 64×64 | 参考原作 |
| E1 | shengzhan_ring | 圣战戒指 | `public/assets/items/eq_shengzhan_ring.png`（+@2x） | 64×64 | 参考原作 |
| E1 | shengzhan_bracelet | 圣战手镯 | `public/assets/items/eq_shengzhan_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| E1 | fashen_helm | 法神头盔 | `public/assets/items/eq_fashen_helm.png`（+@2x） | 64×64 | 参考原作 |
| E1 | fashen_necklace | 法神项链 | `public/assets/items/eq_fashen_necklace.png`（+@2x） | 64×64 | 参考原作 |
| E1 | fashen_ring | 法神戒指 | `public/assets/items/eq_fashen_ring.png`（+@2x） | 64×64 | 参考原作 |
| E1 | fashen_bracelet | 法神手镯 | `public/assets/items/eq_fashen_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| E1 | tianzun_helm | 天尊头盔 | `public/assets/items/eq_tianzun_helm.png`（+@2x） | 64×64 | 参考原作 |
| E1 | tianzun_necklace | 天尊项链 | `public/assets/items/eq_tianzun_necklace.png`（+@2x） | 64×64 | 参考原作 |
| E1 | tianzun_ring | 天尊戒指 | `public/assets/items/eq_tianzun_ring.png`（+@2x） | 64×64 | 参考原作 |
| E1 | tianzun_bracelet | 天尊手镯 | `public/assets/items/eq_tianzun_bracelet.png`（+@2x） | 64×64 | 参考原作 |
| M2 | woma_warrior | 沃玛战士 | `public/assets/portraits/woma_warrior_full.png` | 741×960 | 参考原作 |
| M2 | zuma_guard | 祖玛卫士 | `public/assets/portraits/zuma_guard_full.png` | 719×960 | 参考原作 |
| M2 | bull_warrior | 牛魔战士 | `public/assets/portraits/bull_warrior_full.png` | 762×960 | 参考原作 |
| M2 | bull_mage | 牛魔法师 | `public/assets/portraits/bull_mage_full.png` | 713×960 | 参考原作 |
| M2 | bull_guard | 牛魔侍卫 | `public/assets/portraits/bull_guard_full.png` | 705×960 | 参考原作 |
| M2 | hongmo_pig | 虹魔猪卫 | `public/assets/portraits/hongmo_pig_full.png` | 716×960 | 参考原作 |
| M2 | hongmo_scorpion | 虹魔蝎卫 | `public/assets/portraits/hongmo_scorpion_full.png` | 960×869 | 参考原作 |
| M2 | redmoon_spider | 赤月蜘蛛 | `public/assets/portraits/redmoon_spider_full.png` | 960×782 | 推测：原版无此怪，参照天狼蜘蛛 |
