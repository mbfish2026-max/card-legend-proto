# 美术需求清单 v1（交给「卡牌传奇·美术」）
统一风格：与现有 `public/assets/portraits/*_full.png` 一致——暗黑写实手绘、透明背景 PNG、角色立绘全身、朝左（artFacing=-1 时朝右请备注）。图标 64×64 PNG 透明底，类 WoW 图标质感。**全部原创，不得临摹传奇原作素材。**
交付后放到对应路径，我来接入；交付前用现有占位图运行。

## A. 怪物 / Boss 立绘（512×768 PNG 透明底）
| 文件名 | 用途 | 描述 | 当前占位 |
|---|---|---|---|
| portraits/woma_guard_full.png | R3 沃玛寺庙小怪 | 披甲兽人卫士，青铜色盔甲，持长戟 | orc_full |
| portraits/boss_woma_full.png | R3 沃玛教主 | 高大兽首祭司，火焰法杖，红黑长袍 | boss_orc_chief_full |
| portraits/zuma_statue_full.png | R3 祖玛阁小怪 | 会动的石像武士，灰石质感带裂纹 | skeleton_full |
| portraits/boss_zuma_full.png | R3 祖玛教主 | 金石巨像，四臂，宝石眼 | boss_skeleton_lord_full |
| portraits/blood_zombie_full.png | R3 赤月魔穴小怪 | 血红腐尸，滴血 | zombie_full |
| portraits/boss_redmoon_full.png | R3 赤月恶魔 | 巨大肉质恶魔心脏/虫母，触须，暗红光 | boss_lich_full |

## B. 场景背景（1920×1080 JPG）
| 文件 | 内容 | 现用占位 |
|---|---|---|
| bg/bg_floor6.jpg | 沃玛寺庙：火把石殿、兽人图腾 | 占位 bg_floor4 |
| bg/bg_floor7.jpg | 祖玛阁：金色石厅、石像列柱 | 占位 bg_floor3 |
| bg/bg_floor8.jpg | 赤月魔穴：血肉洞窟、红月光 | 占位 bg_floor5 |

## C. 物品图标（64×64 PNG）
| 文件名 | 用途 | 当前占位 |
|---|---|---|
| items/bless_oil.png | R1 祝福油（小瓶金色油） | 已放同名占位（复制自 INV_Misc_Gem_Pearl_01） |
| items/set_woma_helm.png / set_woma_necklace.png / set_woma_bracelet.png | R2 沃玛套（青铜+兽骨） | 已放同名占位（复制自现有图标） |
| items/set_zuma_helm.png / set_zuma_ring.png / set_zuma_boots.png | R2 祖玛套（金石+宝石） | 已放同名占位 |
| items/set_chiyue_necklace.png / set_chiyue_ring.png / set_chiyue_bracelet.png | R2 赤月套（暗红血玉） | 已放同名占位 |
> v2 变更：套装改为沃玛/祖玛/赤月，原 v1 的 set_bone_* / set_orc_* / set_lich_* 作废，请按上表文件名出图。
| items/black_iron.png | R4 黑铁矿石 | INV_Misc_Bone_01 |

## D. UI
| ui/set_badge.png 48×48 | 套装激活角标（绿色发光） | 文字代替 |

## E. R3 新层（已放同名占位，直接覆盖即可）
| 文件 | 内容 |
|---|---|
| portraits/woma_guard_full.png | 沃玛卫士 |
| portraits/boss_woma_full.png | 沃玛教主（Boss） |
| portraits/zuma_statue_full.png | 祖玛雕像 |
| portraits/boss_zuma_full.png | 祖玛教主（Boss） |
| portraits/blood_zombie_full.png | 血僵尸 |
| portraits/boss_redmoon_full.png | 赤月恶魔（Boss） |
| bg/bg_floor6.jpg | 沃玛寺庙 |
| bg/bg_floor7.jpg | 祖玛阁 |
| bg/bg_floor8.jpg | 赤月魔穴 |


## 交付记录
- **v1 已交付（2026-10-30，美术 Bot）并已接入**：portraits/ 6 张（woma_guard、boss_woma、zuma_statue、blood_zombie、boss_redmoon、boss_zuma，700–770×960 透明 PNG，按高度缩放、脚底锚点，宽度上限保护）、bg/bg_floor6–8.jpg、items/ 11 个（bless_oil、9 件套装、black_iron）、ui/set_badge.png。上方 A–E 节对应条目均为 ✅ 已交付。
  - black_iron.png 已入库，R5 强化已接入。
  - set_badge.png 用于装备栏：已穿套装达到首档加成时显示在右上角。

## F. 技能图标（R4，64×64 PNG，已放同名占位，直接覆盖）
| 文件 | 技能 |
|---|---|
| skills/skill_slaying.png | 攻杀剑术（战士） |
| skills/skill_thrust.png | 刺杀剑术（战士） |
| skills/skill_half_moon.png | 半月弯刀（战士） |
| skills/skill_fire_sword.png | 烈火剑法（战士） |
| skills/skill_fireball.png | 火球术（法师） |
| skills/skill_thunder.png | 雷电术（法师） |
| skills/skill_magic_shield.png | 魔法盾（法师） |
| skills/skill_ice_roar.png | 冰咆哮（法师） |
| skills/skill_heal.png | 治愈术（道士） |
| skills/skill_poison.png | 施毒术（道士） |
| skills/skill_soul_fire.png | 灵魂火符（道士） |
| skills/skill_summon_skeleton.png | 召唤骷髅（道士） |

## G. 世界地图（R4，已放同名占位）
| 文件 | 内容 |
|---|---|
| map/map_world.jpg 1920×840 | 世界地图底图：比奇→盟重→沃玛森林→祖玛寺庙→赤月峡谷，手绘羊皮卷风格 |
| map/map_node_bichi.png / map_node_mengzhong.png / map_node_woma.png / map_node_zuma.png / map_node_chiyue.png 128×128 圆形 | 地图区域节点缩略图（透明底） |

## H. 悬赏 / 成就（R5 研究文档 / CHANGELOG R6）
- 本轮无新立绘需求；悬赏与成就面板使用现有 UI 文字与菜单按钮。
- 若后续要做「悬赏」菜单专用图标，可替换 menu 第 2 槽（当前复用占位）。

## I. 技能扩充图标（R6 研究 / CHANGELOG R7，64×64 PNG，已放同名占位，直接覆盖）
| 文件 | 技能 |
|---|---|
| skills/skill_basic_sword.png | 基本剑术（战士被动） |
| skills/skill_rush.png | 野蛮冲撞（战士） |
| skills/skill_fire_wall.png | 火墙（法师） |
| skills/skill_spirit_force.png | 精神力战法（道士被动） |
| skills/skill_summon_beast.png | 召唤神兽（道士） |
| portraits 复用 | 神兽暂用狼立绘占位；若做专用神兽立绘请交 `portraits/summon_beast_full.png`（朝左，透明底） |

## R11 技能书图标（2026-10-31）
目前技能书道具图标直接复用对应技能图标（`item_book_<skill>` 未单独提供时用 `sk_<skill>` 占位）。需要：
| 文件 | 说明 |
|---|---|
| items/item_book.png | 通用技能书底图（古旧线装书，128×128 透明底），可按职业三色：`item_book_warrior.png` / `item_book_mage.png` / `item_book_taoist.png` |

## R13 地图扩充 / 掉落装备 / 超大世界地图（2026-10-31）
### 新层背景（1280×720，key 已在 world.ts，目前复用旧图）
bg_floor9 毒蛇山谷、bg_floor10 蜈蚣洞、bg_floor11 石墓·猪洞、bg_floor12 牛魔寺庙、bg_floor13 封魔殿
### 世界地图节点（128×128，目前复用旧节点图）
map_node_dushe 毒蛇山谷、map_node_cangyue 苍月岛、map_node_fengmo 封魔谷（代码 icon 字段改名后即可替换）
### 新怪立绘（目前 art 字段复用旧图，交付后改 units.ts 的 art）
红蛇、虎蛇、蝎子、万年树妖(BOSS)、蜈蚣、跳跳蜂、黑色恶蛆、触龙神(BOSS)、红野猪、黑野猪、蝎蛇、白野猪(BOSS)、牛魔战士、牛魔法师、牛魔侍卫、牛魔王(BOSS)、虹魔猪卫、虹魔蝎卫、虹魔教主(BOSS)
### 新装备图标（64×64，目前复用旧图标）
`short_sword` 短剑（占位用 assets/items/INV_Sword_01.png）、`bronze_sword` 青铜剑（占位用 assets/items/INV_Sword_01.png）、`dagger` 匕首（占位用 assets/items/INV_Sword_01.png）、`ebony_sword` 乌木剑（占位用 assets/items/INV_Sword_01.png）、`bronze_axe` 青铜斧（占位用 assets/items/INV_Sword_02.png）、`bahuang` 八荒（占位用 assets/items/INV_Sword_02.png）、`banyue` 半月（占位用 assets/items/INV_Sword_02.png）、`haihun` 海魂（占位用 assets/items/INV_Sword_03.png）、`lingfeng` 凌风（占位用 assets/items/INV_Sword_02.png）、`xiangmo` 降魔（占位用 assets/items/INV_Sword_04.png）、`yanyue` 偃月（占位用 assets/items/INV_Sword_03.png）、`xiuluo` 修罗（占位用 assets/items/INV_Sword_02.png）、`zhanma` 斩马刀（占位用 assets/items/INV_Sword_02.png）、`pohun` 破魂（占位用 assets/items/INV_Sword_02.png）、`ningshuang` 凝霜（占位用 assets/items/INV_Sword_02.png）、`lianyu` 炼狱（占位用 assets/items/INV_Sword_02.png）、`jingzhongyue` 井中月（占位用 assets/items/INV_Sword_05.png）、`wujigun` 无极棍（占位用 assets/items/INV_Sword_04.png）、`longwen` 龙纹剑（占位用 assets/items/INV_Sword_04.png）、`caijue` 裁决之杖（占位用 assets/items/INV_Sword_05.png）、`guyu` 骨玉权杖（占位用 assets/items/INV_Sword_03.png）、`light_armor` 轻型盔甲（占位用 assets/items/INV_Chest_Plate01.png）、`soul_robe` 灵魂战衣（占位用 assets/items/INV_Chest_Plate03.png）、`magic_robe` 魔法长袍（占位用 assets/items/INV_Chest_Plate03.png）、`war_armor` 战神盔甲（占位用 assets/items/INV_Chest_Plate03.png）、`ghost_robe` 幽灵战衣（占位用 assets/items/INV_Chest_Plate03.png）、`demon_robe` 恶魔长袍（占位用 assets/items/INV_Chest_Plate03.png）、`tao_helm` 道士头盔（占位用 assets/items/INV_Helmet_03.png）、`magic_helm` 魔法头盔（占位用 assets/items/INV_Helmet_01.png）
### 超大世界地图 / 区域小地图 / 入口图标（新 key，未提供时代码画占位色块）
- `map_world_big`：2400×1400 世界大地图（区域中心坐标见 src/data/map.ts REGIONS.x/y）
- `map_region_<id>`：960×320 区域小地图，id = bichi / woma / dushe / zuma / cangyue / fengmo / chiyue
- `map_entry_town` / `map_entry_cave` / `map_entry_dungeon` / `map_entry_exit`：64×64 入口图标（城镇/洞穴/副本/出口）
### R14 城镇 / NPC / 技能页（未提供时代码画占位色块与文字）
- `bg_town`：960×360 城镇背景（比奇城，可按城镇加 `bg_town_<id>`：bichi / mengzhong / bairimen / cangyue / fengmo）
- `npc_<kind>`：128×128 NPC 头像，kind = potion / weapon / armor / jewelry / book / general / smith / storage / teleport
- `icon_hp_strong` `icon_mp_strong` `icon_sun_water` `icon_return_scroll` `icon_dungeon_scroll` `icon_woma_horn`：64×64 消耗品图标（目前复用药瓶/卷轴图标）
- 技能页：`ui_drag_handle` 24×24 拖动把手、`ui_check_on/off` 24×24 勾选框（目前用文字 ≡ / ☑）


## J. 比奇城城镇（art/town）——✅ 已交付（2026-10-31）
对应 gap-vs-official §3.1 / §6.1 / §6.7。全部为原创卡通美术，未使用原版素材；NPC 名称沿用原版常见称呼（来源：传奇正传比奇省 NPC 坐标表、5PK 比奇地图指南、他也玩传奇比奇城攻略），查不到的标“待确认”。（注：本文件已有 H 节为悬赏/成就，故本章编号为 J。）

| 文件 | 尺寸 | 用途 | 状态 |
|---|---|---|---|
| public/assets/town/bg_bichi_town.jpg | 1920×1080 JPG | 比奇城城镇一屏背景：城墙+城门楼、旗帜、两侧瓦顶商铺/灯笼/布篷/木桶，石板广场；前景下方约 40% 为开阔空地，可站 NPC | ✅ |
| public/assets/town/npc_<id>.png | 768×960 PNG 透明底 | NPC 半身立绘，主体水平居中、底边贴画布下沿（腰部截断），头顶留白 | ✅ |

| id | 中文名（游戏内显示） | 店铺/功能 | 文件 | 外观特征 |
|---|---|---|---|---|
| pharmacist | 夏家店老板 | 药店 | npc_pharmacist.png | 中年男子，八字胡+山羊须，深蓝方巾（2026-10-31 重画：去掉原“厨师帽”观感），青绿长袍+深棕药铺围裙，手持红色药葫芦与草药 |
| weapon | 卫家店老板 | 武器店 | npc_weapon.png | 光头大胡子壮汉，棕色皮背心+深蓝内衫，皮护腕，竖握长剑、一手叉腰（2026-10-31 重画：人物含剑高约 870px，与其他 NPC 对齐） |
| clothes | 安家布衣 | 服装店 | npc_clothes.png | 年轻女子，盘发玉簪，粉色汉服，颈挂软尺，手捧蓝色布匹 |
| jewelry | 首饰店老板 | 首饰店 | npc_jewelry.png | 富态中年商人，卷翘小胡子，黑色商人帽，紫色金边绸袍，满手金戒指，举放大镜鉴赏红宝石项链 |
| book | 书香奇人 | 书店（技能书） | npc_book.png | 白须老学者，黑色高冠，圆框眼镜，靛蓝长袍白领，手捧发光技能书、夹卷轴（部分资料称“书店老板”） |
| grocer | 杂货铺老板 | 杂货店 | npc_grocer.png | 圆胖青年，头巾，芥黄短衫卷袖，棕色围裙口袋插卷轴，持算盘与布袋 |
| blacksmith | 铁匠铺老板 | 铁匠（修理/强化） | npc_blacksmith.png | 壮年男子，红头巾，脸颊煤灰，无袖+厚皮围裙，肩扛锻锤、手持铁钳 |
| storage | 仓库保管员 | 仓库 | npc_storage.png | 清瘦老者，灰发发髻、灰色长须，棕色长袍深色马甲，腰挂铜钥匙串，持账本与毛笔（另有资料称比奇仓库为“麦家铺子老板”） |
| teleporter | 传送员（待确认） | 城间/地图传送 | npc_teleporter.png | 中年术士，束发，红色带兜帽斗篷+白金长袍，持蓝水晶法杖，手边蓝色符文漩涡。原版比奇城传送多由“比奇老兵”承担，“传送员”为常见私服称呼，原版名待确认 |
| veteran | 比奇老兵 | 城门老兵/新手引导 | npc_veteran.png | 灰发老兵，独眼罩、脸颊刀疤，灰短须，铆钉鳞甲+褪色蓝衫，持长枪 |

预览：`docs/town-preview/bg_bichi_town_preview.jpg`、`npcs_light.png`、`npcs_dark.png`（NPC 拼图）、`bg_with_npcs.jpg`（背景+NPC 合成示意）。

> J 节补充（2026-10-31）：npc_pharmacist、npc_weapon 已重画并覆盖原文件（768×960，透明底，256 色量化），对照图 `docs/town-preview/npcs_redraw.jpg`。

## K. 比奇城横版街道（art/town）——✅ 已交付（2026-10-31）
需求：“城镇的贴图要做成横版的，走到不同店铺下不同的npc”。全部为原创卡通美术，白天明亮色调。街道总长 5760×1080，分三层：

| 文件 | 尺寸 | 用途 | 层/视差 |
|---|---|---|---|
| public/assets/town/bg_far.jpg | 1920×1080 JPG | 远景：蓝天白云、远山、城墙箭楼、草地。左右边缘已交叉淡化，可水平无缝平铺（TileSprite） | 远景层，建议 0.3x |
| public/assets/town/ground_strip.jpg | 1920×360 JPG | 地面石板路，左右可无缝平铺；放在 y=720~1080（下 1/3） | 与近景同速 1.0x |
| public/assets/town/street_near_1/2/3.png | 各 1920×1080 PNG 透明 | 近景店铺带，三段依次放在 x=0/1920/3840 即无缝拼成 5760 宽；店铺底边（台阶）在 y=760 | 近景层 1.0x |
| public/assets/town/shop_<id>.png | 640×720 PNG 透明 | 单个店铺门面（正面、招牌符号、屋檐、门前台阶），底边贴画布下沿，水平居中；可替代 street_near 自行排布 | 1.0x |

地面说明：需求示例为 1920×300，为恰好覆盖下 1/3（360px）改为 1920×360，且因不透明改用 JPG（体积更小）。

店铺 id：pharmacist(药店，葫芦招牌)、weapon(武器店，双剑)、clothes(服装店，衣架长袍)、jewelry(首饰店，宝石)、book(书店，翻开的书)、grocer(杂货铺，布袋)、blacksmith(铁匠铺，铁砧锤子，烟囱冒烟)、storage(仓库，宝箱+挂锁)、teleporter(传送阵摊位，石柱+蓝水晶+发光法阵，中间镂空)、veteran(卫兵岗/兵器架，盾牌+长枪+旗)。

### 拼接/分层用法（Phaser）
1. 远景：`tileSprite(0,0,1920,1080,'bg_far').setScrollFactor(0)`，每帧 `tilePositionX = camera.scrollX*0.3`。
2. 地面：`tileSprite(0,720,5760,360,'ground_strip')`，scrollFactor 1。
3. 近景：`image(0,0,'street_near_1')`、`(1920,0,'street_near_2')`、`(3840,0,'street_near_3')`，origin(0,0)。
4. 相机 bounds 设为 (0,0,5760,1080)。

### 店铺位置与 NPC 站位（street_near 中店铺按 0.85 倍缩放，即 544×612）
| 顺序 | id | 店铺中心 x | 门面底 y | NPC 建议位置（origin 0.5,1） |
|---|---|---|---|---|
| 1 | veteran | 288 | 760 | x=288, y=1040 |
| 2 | teleporter | 864 | 760 | x=864, y=1040 |
| 3 | pharmacist | 1440 | 760 | x=1440, y=1040 |
| 4 | weapon | 2016 | 760 | x=2016, y=1040 |
| 5 | clothes | 2592 | 760 | x=2592, y=1040 |
| 6 | jewelry | 3168 | 760 | x=3168, y=1040 |
| 7 | book | 3744 | 760 | x=3744, y=1040 |
| 8 | grocer | 4320 | 760 | x=4320, y=1040 |
| 9 | blacksmith | 4896 | 760 | x=4896, y=1040 |
| 10 | storage | 5472 | 760 | x=5472, y=1040 |

通式：店铺间距 576，中心 x = 288 + 576×i；NPC（768×960 立绘）缩放 0.45（约 346×432），水平与店铺中心对齐，脚底 y = 门面底 + 280（站在门前路面上）。玩家走到 |player.x − 店铺中心 x| < 200 时触发该店 NPC。若单独使用 shop_<id>.png（1.0 倍），NPC 偏移为相对店铺中心 (0, +330)、缩放约 0.53。

预览：`docs/town-preview/street_composite.jpg`（2880×540 缩略，远景+地面+近景+NPC 合成）、`shops_grid.jpg`（10 个门面暗底拼图）、`npcs_redraw.jpg`（两张重画 NPC）。

### K 章接入备注（R14-A2）
- 游戏画布 1280×720，素材整体按 2/3 缩放使用；已用 bg_far / ground_strip / street_near_1-3 / npc_<id>；shop_<id> 作为缺 street_near 时的后备。
- 仍缺：其它城镇（银杏村/沃玛村等）长街素材、西端城门/出城牌美术（当前为文字「◀出城」占位）。

## 合击版 #5（feat/hj-rage）
- 火龙之心图标（暂用 INV_Misc_Gem_Pearl_01）
- 蝎尾/鹿茸/阴阳仙草/九花玉露/九花雪露/元神丹/回气糕/补气丹 图标 ×8（暂用 INV_Misc_Food_15）
- 黄色怒槽 HUD 条（暂为老兵面板文字）

## 合击版 #7（feat/hj-books）
- 龙人立绘/店面（暂用首饰店位与立绘）
- 白日门技能书、书页、金条图标（暂用 Pearl）

## 合击版 #8（feat/hj-maps）
- 背景 bg_floor20–23（保卫家园/卧龙山庄/雷炎洞穴/火龙神殿），现回退为通用 bg
- 怪物立绘：家园守卫、卧龙护卫、火龙守卫（暂用 orc）、雷炎蜘蛛（暂用 spider）
- BOSS 立绘：魔龙守将（暂用 boss_woma）、卧龙名将（暂用 boss_orc_chief）、雷炎蛛王/火龙（暂用 boss_redmoon）
- 世界地图节点图标 map_node_hejiban（暂用 mengzhong）
## R14 阶段 B
- 圣战/法神/天尊 套 12 件图标（item_shengzhan_* / item_fashen_* / item_tianzun_*）：若缺图当前回退通用图标
- 沃玛教主之家大门（woma_door，x=2850，横版 256×384，可开/关两帧）
- 沃玛寺庙二/三层地面区分贴花（可选）
- 鉴定特效（小型金光，64×64 序列帧）

## town-return（feat/town-return）
- 银杏村（新手村）专属街景/门面（暂复用比奇长街素材）
- 战斗层起点「回城」入口门图（暂用原商人摊 Graphics）

## 高清/2K 画质所需 2x 素材（feat/hd-resolution，按优先级）
现状（public/assets 源文件）：注意构建脚本 compress-assets 会把非立绘缩到 ≤1280 宽、立绘缩到 ≤640，**即使源图更大，dist 里也只有 1x**；要 2K 真正清晰，需先放宽该限制（会增大包体，手机流量需权衡）。
1. 图标类（显示约 40–64 逻辑 px，2K 下需 128px）：items 39 张、skills 39 张、potions 20 张，现均 64×64；portraits 中 13 张 64×64 小怪头像 → 需 128×128。
2. 战斗/地图背景：bg_floor1–5、ui/bg_dungeon、map/map_world 现 1280×720 → 需 2560×1440（bg_floor6–8、town 背景已是 1920×1080，可补到 2560）。
3. 世界地图节点 map_node_* 128×72 → 256×144。
4. UI 九宫格/边框（ui/UI-*：48–256px）→ 2x 版本；set_badge 48 → 96。
5. 角色/NPC 立绘（600–960px 源图，构建缩到 640）：放宽构建上限即可，暂不需重画。
文字与 Graphics（血条、面板底、按钮框）为矢量/运行时栅格化，已按倍率清晰，无需素材。

<!-- CH-L -->
## L. 缺口补图（art/gap-fill）接入说明

只给接入说明，本分支未改任何 src 代码。

- 怪物立绘：`public/assets/portraits/<art>_full.png`。普通怪 art 默认等于单位 id；Boss 的 art 是 `src/data/units.ts` 中 `b()` 的第 2 个参数。接入时在 `src/assets-manifest.ts` 的 ASSETS 加 `<art>: P + '<art>_full.png'`，并确认 units 的 art 字段指向该 key（如原先借用别的怪图，改为下表 id）。
- 装备图标：`public/assets/items/eq_<id>.png`（64×64）+ `eq_<id>@2x.png`（128×128）。把 `src/data/items.ts` / `items-town.ts` 中 ITEMS[id].icon 改为 `items/eq_<id>.png`，加载 key 仍是 `item_<id>`。
- 道具图标（I1）：同上规则，文件名见下表，替换原 WoW 图标路径。

| 批次 | id | 名称 | 文件 | 接入改动 | 外观 |
|---|---|---|---|---|---|
| M1 | tree_demon | 千年树妖 | `public/assets/portraits/tree_demon_full.png` | ASSETS 加 `tree_demon`，units 中 art 指向 `tree_demon` | 参考原作 |
| M1 | boss_chulong | 触龙神 | `public/assets/portraits/boss_chulong_full.png` | ASSETS 加 `boss_chulong`，units 中 art 指向 `boss_chulong` | 参考原作 |
| M1 | boss_white_boar | 白野猪 | `public/assets/portraits/boss_white_boar_full.png` | ASSETS 加 `boss_white_boar`，units 中 art 指向 `boss_white_boar` | 参考原作 |
| M1 | boss_bull_king | 牛魔王 | `public/assets/portraits/boss_bull_king_full.png` | ASSETS 加 `boss_bull_king`，units 中 art 指向 `boss_bull_king` | 参考原作 |
| M1 | boss_hongmo | 虹魔教主 | `public/assets/portraits/boss_hongmo_full.png` | ASSETS 加 `boss_hongmo`，units 中 art 指向 `boss_hongmo` | 参考原作 |
| E1 | xiangmo | 降魔 | `public/assets/items/eq_xiangmo.png` | ITEMS.xiangmo.icon → `items/eq_xiangmo.png` | 参考原作 |
| E1 | yanyue | 偃月 | `public/assets/items/eq_yanyue.png` | ITEMS.yanyue.icon → `items/eq_yanyue.png` | 参考原作 |
| E1 | xiuluo | 修罗 | `public/assets/items/eq_xiuluo.png` | ITEMS.xiuluo.icon → `items/eq_xiuluo.png` | 参考原作 |
| E1 | zhanma | 斩马刀 | `public/assets/items/eq_zhanma.png` | ITEMS.zhanma.icon → `items/eq_zhanma.png` | 参考原作 |
| E1 | pohun | 破魂 | `public/assets/items/eq_pohun.png` | ITEMS.pohun.icon → `items/eq_pohun.png` | 参考原作 |
| E1 | ningshuang | 凝霜 | `public/assets/items/eq_ningshuang.png` | ITEMS.ningshuang.icon → `items/eq_ningshuang.png` | 参考原作 |
| E1 | lianyu | 炼狱 | `public/assets/items/eq_lianyu.png` | ITEMS.lianyu.icon → `items/eq_lianyu.png` | 参考原作 |
| E1 | jingzhongyue | 井中月 | `public/assets/items/eq_jingzhongyue.png` | ITEMS.jingzhongyue.icon → `items/eq_jingzhongyue.png` | 参考原作 |
| E1 | wujigun | 无极棍 | `public/assets/items/eq_wujigun.png` | ITEMS.wujigun.icon → `items/eq_wujigun.png` | 参考原作 |
| E1 | longwen | 龙纹剑 | `public/assets/items/eq_longwen.png` | ITEMS.longwen.icon → `items/eq_longwen.png` | 参考原作 |
| E1 | caijue | 裁决之杖 | `public/assets/items/eq_caijue.png` | ITEMS.caijue.icon → `items/eq_caijue.png` | 参考原作 |
| E1 | guyu | 骨玉权杖 | `public/assets/items/eq_guyu.png` | ITEMS.guyu.icon → `items/eq_guyu.png` | 参考原作 |
| E1 | war_armor | 战神盔甲 | `public/assets/items/eq_war_armor.png` | ITEMS.war_armor.icon → `items/eq_war_armor.png` | 参考原作 |
| E1 | ghost_robe | 幽灵战衣 | `public/assets/items/eq_ghost_robe.png` | ITEMS.ghost_robe.icon → `items/eq_ghost_robe.png` | 参考原作 |
| E1 | demon_robe | 恶魔长袍 | `public/assets/items/eq_demon_robe.png` | ITEMS.demon_robe.icon → `items/eq_demon_robe.png` | 参考原作 |
| E1 | black_iron_helm | 黑铁头盔 | `public/assets/items/eq_black_iron_helm.png` | ITEMS.black_iron_helm.icon → `items/eq_black_iron_helm.png` | 参考原作 |
| E1 | green_necklace | 绿色项链 | `public/assets/items/eq_green_necklace.png` | ITEMS.green_necklace.icon → `items/eq_green_necklace.png` | 参考原作 |
| E1 | power_ring | 力量戒指 | `public/assets/items/eq_power_ring.png` | ITEMS.power_ring.icon → `items/eq_power_ring.png` | 参考原作 |
| E1 | knight_bracelet | 骑士手镯 | `public/assets/items/eq_knight_bracelet.png` | ITEMS.knight_bracelet.icon → `items/eq_knight_bracelet.png` | 参考原作 |
| E1 | demon_bell | 恶魔铃铛 | `public/assets/items/eq_demon_bell.png` | ITEMS.demon_bell.icon → `items/eq_demon_bell.png` | 参考原作 |
| E1 | zibiluo | 紫碧螺 | `public/assets/items/eq_zibiluo.png` | ITEMS.zibiluo.icon → `items/eq_zibiluo.png` | 参考原作 |
| E1 | dragon_bracelet | 龙之手镯 | `public/assets/items/eq_dragon_bracelet.png` | ITEMS.dragon_bracelet.icon → `items/eq_dragon_bracelet.png` | 参考原作 |
| E1 | soul_necklace | 灵魂项链 | `public/assets/items/eq_soul_necklace.png` | ITEMS.soul_necklace.icon → `items/eq_soul_necklace.png` | 参考原作 |
| E1 | titan_ring | 泰坦戒指 | `public/assets/items/eq_titan_ring.png` | ITEMS.titan_ring.icon → `items/eq_titan_ring.png` | 参考原作 |
| E1 | sanyan_bracelet | 三眼手镯 | `public/assets/items/eq_sanyan_bracelet.png` | ITEMS.sanyan_bracelet.icon → `items/eq_sanyan_bracelet.png` | 参考原作 |
| E1 | shengzhan_helm | 圣战头盔 | `public/assets/items/eq_shengzhan_helm.png` | ITEMS.shengzhan_helm.icon → `items/eq_shengzhan_helm.png` | 参考原作 |
| E1 | shengzhan_necklace | 圣战项链 | `public/assets/items/eq_shengzhan_necklace.png` | ITEMS.shengzhan_necklace.icon → `items/eq_shengzhan_necklace.png` | 参考原作 |
| E1 | shengzhan_ring | 圣战戒指 | `public/assets/items/eq_shengzhan_ring.png` | ITEMS.shengzhan_ring.icon → `items/eq_shengzhan_ring.png` | 参考原作 |
| E1 | shengzhan_bracelet | 圣战手镯 | `public/assets/items/eq_shengzhan_bracelet.png` | ITEMS.shengzhan_bracelet.icon → `items/eq_shengzhan_bracelet.png` | 参考原作 |
| E1 | fashen_helm | 法神头盔 | `public/assets/items/eq_fashen_helm.png` | ITEMS.fashen_helm.icon → `items/eq_fashen_helm.png` | 参考原作 |
| E1 | fashen_necklace | 法神项链 | `public/assets/items/eq_fashen_necklace.png` | ITEMS.fashen_necklace.icon → `items/eq_fashen_necklace.png` | 参考原作 |
| E1 | fashen_ring | 法神戒指 | `public/assets/items/eq_fashen_ring.png` | ITEMS.fashen_ring.icon → `items/eq_fashen_ring.png` | 参考原作 |
| E1 | fashen_bracelet | 法神手镯 | `public/assets/items/eq_fashen_bracelet.png` | ITEMS.fashen_bracelet.icon → `items/eq_fashen_bracelet.png` | 参考原作 |
| E1 | tianzun_helm | 天尊头盔 | `public/assets/items/eq_tianzun_helm.png` | ITEMS.tianzun_helm.icon → `items/eq_tianzun_helm.png` | 参考原作 |
| E1 | tianzun_necklace | 天尊项链 | `public/assets/items/eq_tianzun_necklace.png` | ITEMS.tianzun_necklace.icon → `items/eq_tianzun_necklace.png` | 参考原作 |
| E1 | tianzun_ring | 天尊戒指 | `public/assets/items/eq_tianzun_ring.png` | ITEMS.tianzun_ring.icon → `items/eq_tianzun_ring.png` | 参考原作 |
| E1 | tianzun_bracelet | 天尊手镯 | `public/assets/items/eq_tianzun_bracelet.png` | ITEMS.tianzun_bracelet.icon → `items/eq_tianzun_bracelet.png` | 参考原作 |
| M2 | woma_warrior | 沃玛战士 | `public/assets/portraits/woma_warrior_full.png` | ASSETS 加 `woma_warrior`，units 中 art 指向 `woma_warrior` | 参考原作 |
| M2 | zuma_guard | 祖玛卫士 | `public/assets/portraits/zuma_guard_full.png` | ASSETS 加 `zuma_guard`，units 中 art 指向 `zuma_guard` | 参考原作 |
| M2 | bull_warrior | 牛魔战士 | `public/assets/portraits/bull_warrior_full.png` | ASSETS 加 `bull_warrior`，units 中 art 指向 `bull_warrior` | 参考原作 |
| M2 | bull_mage | 牛魔法师 | `public/assets/portraits/bull_mage_full.png` | ASSETS 加 `bull_mage`，units 中 art 指向 `bull_mage` | 参考原作 |
| M2 | bull_guard | 牛魔侍卫 | `public/assets/portraits/bull_guard_full.png` | ASSETS 加 `bull_guard`，units 中 art 指向 `bull_guard` | 参考原作 |
| M2 | hongmo_pig | 虹魔猪卫 | `public/assets/portraits/hongmo_pig_full.png` | ASSETS 加 `hongmo_pig`，units 中 art 指向 `hongmo_pig` | 参考原作 |
| M2 | hongmo_scorpion | 虹魔蝎卫 | `public/assets/portraits/hongmo_scorpion_full.png` | ASSETS 加 `hongmo_scorpion`，units 中 art 指向 `hongmo_scorpion` | 参考原作 |
| M2 | redmoon_spider | 赤月蜘蛛 | `public/assets/portraits/redmoon_spider_full.png` | ASSETS 加 `redmoon_spider`，units 中 art 指向 `redmoon_spider` | 推测 |
| E2 | wood_sword | 木剑 | `public/assets/items/eq_wood_sword.png` | ITEMS.wood_sword.icon → `items/eq_wood_sword.png` | 参考原作 |
| E2 | iron_sword | 铁剑 | `public/assets/items/eq_iron_sword.png` | ITEMS.iron_sword.icon → `items/eq_iron_sword.png` | 参考原作 |
| E2 | magic_staff | 魔杖 | `public/assets/items/eq_magic_staff.png` | ITEMS.magic_staff.icon → `items/eq_magic_staff.png` | 参考原作 |
| E2 | tao_sword | 银蛇剑 | `public/assets/items/eq_tao_sword.png` | ITEMS.tao_sword.icon → `items/eq_tao_sword.png` | 参考原作 |
| E2 | dragon_sword | 屠龙刀 | `public/assets/items/eq_dragon_sword.png` | ITEMS.dragon_sword.icon → `items/eq_dragon_sword.png` | 参考原作 |
| E2 | short_sword | 短剑 | `public/assets/items/eq_short_sword.png` | ITEMS.short_sword.icon → `items/eq_short_sword.png` | 参考原作 |
| E2 | bronze_sword | 青铜剑 | `public/assets/items/eq_bronze_sword.png` | ITEMS.bronze_sword.icon → `items/eq_bronze_sword.png` | 参考原作 |
| E2 | dagger | 匕首 | `public/assets/items/eq_dagger.png` | ITEMS.dagger.icon → `items/eq_dagger.png` | 参考原作 |
| E2 | ebony_sword | 乌木剑 | `public/assets/items/eq_ebony_sword.png` | ITEMS.ebony_sword.icon → `items/eq_ebony_sword.png` | 参考原作 |
| E2 | bronze_axe | 青铜斧 | `public/assets/items/eq_bronze_axe.png` | ITEMS.bronze_axe.icon → `items/eq_bronze_axe.png` | 参考原作 |
| E2 | bahuang | 八荒 | `public/assets/items/eq_bahuang.png` | ITEMS.bahuang.icon → `items/eq_bahuang.png` | 参考原作 |
| E2 | banyue | 半月 | `public/assets/items/eq_banyue.png` | ITEMS.banyue.icon → `items/eq_banyue.png` | 参考原作 |
| E2 | haihun | 海魂 | `public/assets/items/eq_haihun.png` | ITEMS.haihun.icon → `items/eq_haihun.png` | 参考原作 |
| E2 | lingfeng | 凌风 | `public/assets/items/eq_lingfeng.png` | ITEMS.lingfeng.icon → `items/eq_lingfeng.png` | 参考原作 |
| E2 | ghost_necklace | 幽灵项链 | `public/assets/items/eq_ghost_necklace.png` | ITEMS.ghost_necklace.icon → `items/eq_ghost_necklace.png` | 参考原作 |
| E2 | dragon_ring | 龙之戒指 | `public/assets/items/eq_dragon_ring.png` | ITEMS.dragon_ring.icon → `items/eq_dragon_ring.png` | 参考原作 |
| E2 | ghost_glove | 幽灵手套 | `public/assets/items/eq_ghost_glove.png` | ITEMS.ghost_glove.icon → `items/eq_ghost_glove.png` | 参考原作 |
| E2 | life_necklace | 生命项链 | `public/assets/items/eq_life_necklace.png` | ITEMS.life_necklace.icon → `items/eq_life_necklace.png` | 参考原作 |
| E2 | ruby_ring | 红宝石戒指 | `public/assets/items/eq_ruby_ring.png` | ITEMS.ruby_ring.icon → `items/eq_ruby_ring.png` | 参考原作 |
| E2 | sibeier_bracelet | 思贝儿手镯 | `public/assets/items/eq_sibeier_bracelet.png` | ITEMS.sibeier_bracelet.icon → `items/eq_sibeier_bracelet.png` | 参考原作 |
| E2 | tianzhu_necklace | 天珠项链 | `public/assets/items/eq_tianzhu_necklace.png` | ITEMS.tianzhu_necklace.icon → `items/eq_tianzhu_necklace.png` | 参考原作 |
| E2 | platinum_ring | 铂金戒指 | `public/assets/items/eq_platinum_ring.png` | ITEMS.platinum_ring.icon → `items/eq_platinum_ring.png` | 参考原作 |
| E2 | heart_bracelet | 心灵手镯 | `public/assets/items/eq_heart_bracelet.png` | ITEMS.heart_bracelet.icon → `items/eq_heart_bracelet.png` | 参考原作 |
| M3 | red_snake | 红蛇 | `public/assets/portraits/red_snake_full.png` | ASSETS 加 `red_snake`，units 中 art 指向 `red_snake` | 参考原作 |
| M3 | tiger_snake | 虎蛇 | `public/assets/portraits/tiger_snake_full.png` | ASSETS 加 `tiger_snake`，units 中 art 指向 `tiger_snake` | 参考原作 |
| M3 | scorpion | 蝎子 | `public/assets/portraits/scorpion_full.png` | ASSETS 加 `scorpion`，units 中 art 指向 `scorpion` | 参考原作 |
| M3 | centipede | 蜈蚣 | `public/assets/portraits/centipede_full.png` | ASSETS 加 `centipede`，units 中 art 指向 `centipede` | 参考原作 |
| M3 | jump_bee | 跳跳蜂 | `public/assets/portraits/jump_bee_full.png` | ASSETS 加 `jump_bee`，units 中 art 指向 `jump_bee` | 参考原作 |
| M3 | black_maggot | 黑色恶蛆 | `public/assets/portraits/black_maggot_full.png` | ASSETS 加 `black_maggot`，units 中 art 指向 `black_maggot` | 改编 |
| M3 | red_boar | 红野猪 | `public/assets/portraits/red_boar_full.png` | ASSETS 加 `red_boar`，units 中 art 指向 `red_boar` | 参考原作 |
| M3 | black_boar | 黑野猪 | `public/assets/portraits/black_boar_full.png` | ASSETS 加 `black_boar`，units 中 art 指向 `black_boar` | 参考原作 |
| M3 | scorpion_snake | 蝎蛇 | `public/assets/portraits/scorpion_snake_full.png` | ASSETS 加 `scorpion_snake`，units 中 art 指向 `scorpion_snake` | 参考原作 |
| M3 | summon_beast | 神兽 | `public/assets/portraits/summon_beast_full.png` | ASSETS 加 `summon_beast`，units 中 art 指向 `summon_beast` | 推测 |
| M4 | yeti_king | 雪人王 | `public/assets/portraits/yeti_king_full.png` | ASSETS 加 `yeti_king`，units 中 art 指向 `yeti_king` | 参考原作 |
| M4 | rake_cat_king | 钉耙猫王 | `public/assets/portraits/rake_cat_king_full.png` | ASSETS 加 `rake_cat_king`，units 中 art 指向 `rake_cat_king` | 推测 |
| M4 | orc_commander | 半兽统领 | `public/assets/portraits/orc_commander_full.png` | ASSETS 加 `orc_commander`，units 中 art 指向 `orc_commander` | 参考原作 |
| M4 | evil_lich | 恶灵尸王 | `public/assets/portraits/evil_lich_full.png` | ASSETS 加 `evil_lich`，units 中 art 指向 `evil_lich` | 参考原作 |
| M4 | huangquan_master | 黄泉教主 | `public/assets/portraits/huangquan_master_full.png` | ASSETS 加 `huangquan_master`，units 中 art 指向 `huangquan_master` | 参考原作 |
| M4 | hawk_guard | 鹰卫 | `public/assets/portraits/hawk_guard_full.png` | ASSETS 加 `hawk_guard`，units 中 art 指向 `hawk_guard` | 参考原作 |
| M4 | twinhead_kong | 双头金刚 | `public/assets/portraits/twinhead_kong_full.png` | ASSETS 加 `twinhead_kong`，units 中 art 指向 `twinhead_kong` | 推测 |
| M4 | twinhead_blood | 双头血魔 | `public/assets/portraits/twinhead_blood_full.png` | ASSETS 加 `twinhead_blood`，units 中 art 指向 `twinhead_blood` | 推测 |
| E3 | helmet | 青铜头盔 | `public/assets/items/eq_helmet.png` | ITEMS.helmet.icon → `items/eq_helmet.png` | 参考原作 |
| E3 | bone_helm | 骷髅头盔 | `public/assets/items/eq_bone_helm.png` | ITEMS.bone_helm.icon → `items/eq_bone_helm.png` | 参考原作 |
| E3 | cloth | 布衣 | `public/assets/items/eq_cloth.png` | ITEMS.cloth.icon → `items/eq_cloth.png` | 参考原作 |
| E3 | armor | 重盔甲 | `public/assets/items/eq_armor.png` | ITEMS.armor.icon → `items/eq_armor.png` | 参考原作 |
| E3 | pearl | 黑珍珠项链 | `public/assets/items/eq_pearl.png` | ITEMS.pearl.icon → `items/eq_pearl.png` | 推测 |
| E3 | iron_ring | 铁戒指 | `public/assets/items/eq_iron_ring.png` | ITEMS.iron_ring.icon → `items/eq_iron_ring.png` | 推测 |
| E3 | gold_ring | 金戒指 | `public/assets/items/eq_gold_ring.png` | ITEMS.gold_ring.icon → `items/eq_gold_ring.png` | 参考原作 |
| E3 | bracelet | 翡翠手镯 | `public/assets/items/eq_bracelet.png` | ITEMS.bracelet.icon → `items/eq_bracelet.png` | 推测 |
| E3 | light_armor | 轻型盔甲 | `public/assets/items/eq_light_armor.png` | ITEMS.light_armor.icon → `items/eq_light_armor.png` | 参考原作 |
| E3 | soul_robe | 灵魂战衣 | `public/assets/items/eq_soul_robe.png` | ITEMS.soul_robe.icon → `items/eq_soul_robe.png` | 参考原作 |
| E3 | magic_robe | 魔法长袍 | `public/assets/items/eq_magic_robe.png` | ITEMS.magic_robe.icon → `items/eq_magic_robe.png` | 参考原作 |
| E3 | tao_helm | 道士头盔 | `public/assets/items/eq_tao_helm.png` | ITEMS.tao_helm.icon → `items/eq_tao_helm.png` | 改编 |
| E3 | magic_helm | 魔法头盔 | `public/assets/items/eq_magic_helm.png` | ITEMS.magic_helm.icon → `items/eq_magic_helm.png` | 参考原作 |
| E3 | medium_armor | 中型盔甲 | `public/assets/items/eq_medium_armor.png` | ITEMS.medium_armor.icon → `items/eq_medium_armor.png` | 参考原作 |
| I1 | hp_small | 金创药(小量) | `public/assets/items/hp_small.png` | ITEMS.hp_small.icon → `items/hp_small.png` | 改编 |
| I1 | hp_mid | 金创药(中量) | `public/assets/items/hp_mid.png` | ITEMS.hp_mid.icon → `items/hp_mid.png` | 改编 |
| I1 | mp_small | 魔法药(小量) | `public/assets/items/mp_small.png` | ITEMS.mp_small.icon → `items/mp_small.png` | 改编 |
| I1 | mp_mid | 魔法药(中量) | `public/assets/items/mp_mid.png` | ITEMS.mp_mid.icon → `items/mp_mid.png` | 改编 |
| I1 | hp_strong | 强效金创药 | `public/assets/items/hp_strong.png` | ITEMS.hp_strong.icon → `items/hp_strong.png` | 改编 |
| I1 | mp_strong | 强效魔法药 | `public/assets/items/mp_strong.png` | ITEMS.mp_strong.icon → `items/mp_strong.png` | 改编 |
| I1 | sun_water | 太阳水 | `public/assets/items/sun_water.png` | ITEMS.sun_water.icon → `items/sun_water.png` | 改编 |
| I1 | return_scroll | 回城卷 | `public/assets/items/return_scroll.png` | ITEMS.return_scroll.icon → `items/return_scroll.png` | 改编 |
| I1 | dungeon_scroll | 地牢逃脱卷 | `public/assets/items/dungeon_scroll.png` | ITEMS.dungeon_scroll.icon → `items/dungeon_scroll.png` | 改编 |
| I1 | woma_horn | 沃玛号角 | `public/assets/items/woma_horn.png` | ITEMS.woma_horn.icon → `items/woma_horn.png` | 改编 |
| I1 | gold | 金币 | `public/assets/items/gold.png` | ITEMS.gold.icon → `items/gold.png` | 改编 |
| I1 | chicken | 鸡肉 | `public/assets/items/chicken.png` | ITEMS.chicken.icon → `items/chicken.png` | 改编 |
| I1 | meat | 鹿肉 | `public/assets/items/meat.png` | ITEMS.meat.icon → `items/meat.png` | 改编 |
| I1 | bone | 骷髅骨头 | `public/assets/items/bone.png` | ITEMS.bone.icon → `items/bone.png` | 改编 |

### L.2 召唤物姿态单帧（fx-requests「召唤物动作」）

与原立绘同尺寸、同脚底锚点（不透明区最低行对齐，水平按原图不透明像素均值 x 居中），混合模式 NORMAL。接入：攻击/受击时临时替换召唤物立绘纹理，结束后切回 `_full`。

| 文件 | 尺寸 | 基准立绘 | 用途 |
|---|---|---|---|
| `public/assets/fx/summon_skeleton_atk.png` | 836×1096 | `portraits/skeleton_full.png` | 骷髅（summon_skeleton）攻击帧：前倾挥砍 |
| `public/assets/fx/summon_skeleton_hurt.png` | 836×1096 | `portraits/skeleton_full.png` | 骷髅受击帧：后仰、骨屑飞溅 |
| `public/assets/fx/summon_beast_atk.png` | 960×747 | `portraits/summon_beast_full.png` | 神兽（summon_beast）攻击帧：前扑爪击、蓝色爪痕 |
| `public/assets/fx/summon_beast_hurt.png` | 960×747 | `portraits/summon_beast_full.png` | 神兽受击帧：闭眼后缩 |

注：SUMMON_BEAST 目前 art 仍为 `wolf`，需先改为 `summon_beast` 才能与这两帧配套；骷髅攻击帧因挥剑姿态较宽，按画布宽度限位，重心比原图右移约 23px。
## feat/maps-more（plan-60h B1）
1. 背景 3 张（1920×1080 起）：兽人古墓（bg_floor14/15）、天然洞穴（骷髅洞，bg_floor16/17）、沃玛自然洞穴（bg_floor18/19）；现占位复用 bg_floor3 / bg_floor2。
2. 怪物立绘 5 张：骷髅战士、骷髅战将、掷斧骷髅、洞蛆、山洞蝙蝠（现复用已有贴图）。
3. 特效：掷斧骷髅飞斧弹道 1 个。

## feat/maps-batch2（plan-60h B2）

规格按 L 章：怪物立绘 `public/assets/portraits/<id>_full.png`，透明底 PNG，最长边 960；接入时 ASSETS 加 `<id>` 并把 units 的 art 指向它。现均复用已有贴图（括号内）。

| id | 官方名 | 文件 | 现占位 | 来源 |
|---|---|---|---|---|
| dung_beetle | 粪虫 | `public/assets/portraits/dung_beetle_full.png` | zombie | [21cq 沃玛寺庙一层](https://www.21cq.com/mir/Map.aspx?id=313) |
| woma_brave | 沃玛勇士 | `public/assets/portraits/woma_brave_full.png` | woma_warrior | [21cq](https://www.21cq.com/mir/Map.aspx?id=313) |
| woma_general | 沃玛战将 | `public/assets/portraits/woma_general_full.png` | woma_warrior | [21cq](https://www.21cq.com/mir/Map.aspx?id=313) |
| fire_woma | 火焰沃玛 | `public/assets/portraits/fire_woma_full.png` | woma_warrior | [21cq](https://www.21cq.com/mir/Map.aspx?id=313) |
| dark_warrior | 暗黑战士 | `public/assets/portraits/dark_warrior_full.png` | woma_warrior | [21cq 沃玛寺庙二层](https://www.21cq.com/mir/Map.aspx?id=314) |
| mine_zombie | 僵尸（21cq 僵尸1–5 合一 [适配]） | `public/assets/portraits/mine_zombie_full.png` | zombie | [21cq 废矿入口](https://www.21cq.com/mir/Map.aspx?id=401) |

背景 3 套（1920×1080 起，jpg）：沃玛寺庙（bg_floor25–27，现占位 bg_floor6）、比奇矿区（bg_floor28–32，现占位 bg_floor5）、毒蛇矿区（bg_floor33–34，现占位 bg_floor5）。

## 传奇世界/传奇3 新增地图怪立绘（art/sq-mir3）

统一规格：`public/assets/portraits/<id>_full.png`，透明底 PNG，最长边 960，卡通厚描边、3/4 战斗姿态。「外观」列标「未查到/推测」「部分推测」者为原作外观资料不足、按名称与设定原创推测。

### 批次1：BOSS（10）

预览：`docs/art-gap-preview/sq_b1_boss.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| boss_shiba_full.png | 710x960 | boss_shiba | 尸霸 | 将军坟（传世） | 据描述 | 52pk 将军坟系：帝王亲信，紧握一双数百公斤巨锤 |
| boss_ant_general_full.png | 926x960 | boss_ant_general | 蚂蚁将军 | 蚂蚁洞穴（传奇3） | 据描述 | 17173 传奇3：巨大蚂蚁，前额巨钳，体格强壮 |
| boss_jiguan_beast_full.png | 960x737 | boss_jiguan_beast | 机关巨兽 | 机关洞·中枢大殿（传世） | 部分推测 | 17173 传世：机关洞最深处 BOSS，攻击时巨石从天而降；体型/兽形为推测 |
| boss_skeleton_cult_full.png | 699x960 | boss_skeleton_cult | 骷髅教主 | 潘夜石窟（传奇3） | 据描述 | 17173/新浪：控制亡灵，魔杖由含冤骷髅聚成；袍服/冠为推测 |
| boss_white_snake_full.png | 716x960 | boss_white_snake | 白蛇妖 | 蛇魔谷/五蛇殿（传世） | 据描述 | 17173 传世：蛇魔军团长，高大威猛，利爪 |
| boss_snake_king_full.png | 710x960 | boss_snake_king | 三头蛇王 | 五蛇殿（传世） | 据描述 | 17173：三头；妖气游戏网：不如白蛇妖高大，携三职业标志性武器 |
| boss_great_pharaoh_full.png | 729x960 | boss_great_pharaoh | 大法老 | 沙漠绿洲（传奇3） | 部分推测 | 新浪/17173：诺玛族守卫，用魔法拐棍，攻击为电；诺玛着皮衣骨甲；法老头饰为推测 |
| boss_nimo_full.png | 709x960 | boss_nimo | 逆魔 | 逆魔古刹/逆魔大殿（传世） | 据描述 | 17173：巨斧之下烈焰横生；角/体型为推测 |
| boss_jindi_king_full.png | 960x752 | boss_jindi_king | 禁地魔王 | 禁地（传世） | 未查到/推测 | 仅查到全屏攻击、不移动；外形未查到 |
| boss_panye_bull_full.png | 733x960 | boss_panye_bull | 潘夜牛魔王 | 潘夜神殿（传奇3） | 据描述 | 17173：统治畜界的魔王，牛的样子；武器为推测 |

### 批次2：将军坟 + 机关洞（10）

预览：`docs/art-gap-preview/sq_b2_tomb_mech.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| shiwei_full.png | 724x960 | shiwei | 尸卫 | 将军坟（传世） | 部分推测 | 殉葬帝王大军所化，千年不腐的尸兵 |
| shiwei_brave_full.png | 706x960 | shiwei_brave | 尸卫勇士 | 将军坟（传世） | 据描述 | 原百夫长，整条手臂化为巨刀 |
| shiwei_spear_full.png | 759x960 | shiwei_spear | 掷枪尸卫 | 将军坟（传世） | 据描述 | 掷枪兵所化，投枪 |
| shiwei_general_full.png | 715x960 | shiwei_general | 尸卫战将 | 将军坟（传世） | 部分推测 | 亲卫军所化，最恐怖的部队 |
| stone_man_full.png | 795x960 | stone_man | 石头人 | 机关洞（传世） | 据描述 | 巨石堆砌而成 |
| bronze_man_full.png | 713x960 | bronze_man | 铜人 | 机关洞（传世） | 据描述 | 纯铜组装，握铜矛 |
| bronze_beast_full.png | 960x720 | bronze_beast | 青铜兽 | 机关洞（传世） | 部分推测 | 兽化的铜机关；兽形为推测 |
| blade_roller_full.png | 790x960 | blade_roller | 滚刀手 | 机关洞（传世） | 据描述 | 迅猛刀手，双刃 |
| hammer_man_full.png | 721x960 | hammer_man | 铜锤手 | 机关洞（传世） | 据描述 | 持巨锤 |
| vajra_man_full.png | 702x960 | vajra_man | 金刚人 | 机关洞（传世） | 部分推测 | 金刚不坏的巨人 |

### 批次3：蚂蚁洞穴 + 潘夜石窟 + 诺玛（11）

预览：`docs/art-gap-preview/sq_b3_ant_skel_noma.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| ant_warrior_full.png | 882x960 | ant_warrior | 蚂蚁战士 | 蚂蚁洞穴（传奇3） | 据描述 | 兵蚁，块头大、外壳硬、前额利钳 |
| ant_armored_full.png | 960x673 | ant_armored | 盔甲蚂蚁 | 蚂蚁洞穴（传奇3） | 据描述 | 巨大蚂蚁，前额巨钳，破坏力强 |
| ant_poison_full.png | 960x687 | ant_poison | 爆毒蚂蚁 | 蚂蚁洞穴（传奇3） | 据描述 | 小腹有喷毒射管，钳/爪不发达 |
| ant_taoist_full.png | 783x960 | ant_taoist | 蚂蚁道士 | 蚂蚁洞穴（传奇3） | 据描述 | 畸形巨大腹部，可为同伴回血 |
| skel_samurai_full.png | 698x960 | skel_samurai | 骷髅武士 | 潘夜石窟（传奇3） | 据描述 | 刀背带两环的刀 |
| skel_general_full.png | 717x960 | skel_general | 骷髅武将 | 潘夜石窟（传奇3） | 据描述 | 庞大身躯，全身变异骨头 |
| skel_soldier_full.png | 755x960 | skel_soldier | 骷髅士兵 | 潘夜石窟（传奇3） | 据描述 | 带旗长枪 |
| skel_archer_full.png | 674x960 | skel_archer | 骷髅弓箭手 | 潘夜石窟（传奇3） | 据描述 | 弓箭，远程 |
| bone_ghost_general_full.png | 721x960 | bone_ghost_general | 骨鬼将 | 潘夜石窟（传奇3） | 据描述 | 与骷髅武将样子很像（17173 作「鬼骨将」） |
| noma_full.png | 754x960 | noma | 诺玛 | 沙漠绿洲（传奇3） | 据描述 | 皮衣、骨制护身服和骨制武器 |
| noma_pharaoh_full.png | 699x960 | noma_pharaoh | 诺玛法老 | 沙漠绿洲（传奇3） | 据描述 | 会魔法，持魔法拐棍 |

### 批次4：沙漠 + 逆魔古刹 + 蛇魔谷（上）（11）

预览：`docs/art-gap-preview/sq_b4_desert_nimo.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| desert_fish_full.png | 721x960 | desert_fish | 沙漠鱼魔 | 沙漠（传奇3） | 未查到/推测 | 只查到"毒特别厉害"、不死系 |
| desert_wind_full.png | 704x960 | desert_wind | 沙漠风魔 | 沙漠（传奇3） | 据描述 | 手持可呼风唤雨的扇子 |
| desert_tree_full.png | 724x960 | desert_tree | 沙漠树魔 | 沙漠（传奇3） | 据描述 | 与仙人掌一模一样，射带刺果实，不能移动 |
| desert_golem_full.png | 761x960 | desert_golem | 沙漠石人 | 沙漠（传奇3） | 据描述 | 石头垒成的巨大怪物 |
| underground_imp_full.png | 933x960 | underground_imp | 地下小鬼 | 逆魔古刹（传世） | 据描述 | 身高一尺，挥巨石弯锤 |
| nimo_archer_full.png | 695x960 | nimo_archer | 逆魔弓箭手 | 逆魔古刹（传世） | 部分推测 | 北方大漠善射民族被侵蚀 |
| nimo_guard_full.png | 728x960 | nimo_guard | 逆魔卫士 | 逆魔古刹（传世） | 部分推测 | 迅猛近战卫士 |
| nimo_attendant_full.png | 731x960 | nimo_attendant | 逆魔侍卫 | 逆魔古刹（传世） | 据描述 | 统领卫士，身后箭型巨尾 |
| nimo_statue_full.png | 708x960 | nimo_statue | 逆魔雕像 | 逆魔古刹（传世） | 据描述 | "死神"，巨镰 |
| red_snake_yao_full.png | 728x960 | red_snake_yao | 红蛇妖 | 蛇魔谷（传世） | 部分推测 | 蛇妖小喽啰 |
| black_snake_yao_full.png | 708x960 | black_snake_yao | 黑蛇妖 | 蛇魔谷（传世） | 部分推测 | 蛇王近卫军，防御极高 |

## 追加：魔龙教主（第23层 魔龙血域 BOSS）

- 文件：`public/assets/portraits/boss_molong_full.png`（738×960，RGBA 透明底，最长边 960，与其它 `<id>_full.png` 同规范）
- 预览：`docs/art-gap-preview/sq_molong.jpg`
- 美术键说明：已 merge origin/main（37469df 之后），但 main 的 `docs/fx-requests.md` 中**没有「魔龙教主」条目**（全仓仅 ROADMAP.md / legend-research.md 提及），文档未给键名/文件名，故按约定使用 `boss_molong_full.png`，键为 `boss_molong`。src 中当前占位为 `boss_woma`（沃玛教主着色），未改 src，接入由程序侧处理。
- 卡面：文档未要求另一尺寸/文件名，故未单独出卡面，卡面沿用本立绘。
- 外观依据（热血传奇官方背景，百度百科）：原为人们祭奠的神将，与龙共同守护人类，龙堕落后随之化为妖魔；「神所赐的双翅」「由天地灵气化成的短枪」；作为龙命令的执行者带来血与火。据此绘制：龙角头盔的堕落神将、暗红金边重甲、一对龙翼、紫红灵气短枪、血火缭绕。
- 未查到：原作具体配色与头部造型的官方立绘描述（配色暗红/黑红为玩家资料推测）；短枪画成两端带刃，属自由发挥。
- 原创绘制，未描摹原作素材。

## maps-batch2 交付（art/maps-batch2）

预览：`docs/art-gap-preview/maps_batch2.jpg`。原创绘制，外观参照原版传奇设定（名称/地图），未描摹原作贴图。

| 文件 | 尺寸 | id | 名称 | 外观依据 |
|---|---|---|---|---|
| portraits/dung_beetle_full.png | 960x831 | dung_beetle | 粪虫 | 甲虫推滚粪球（按名称推测） |
| portraits/woma_brave_full.png | 722x960 | woma_brave | 沃玛勇士 | 沃玛族獠牙兽人+弯刀（推测，与现有 woma_warrior 同族风格） |
| portraits/woma_general_full.png | 707x960 | woma_general | 沃玛战将 | 重甲+红披风+战斧（推测） |
| portraits/fire_woma_full.png | 722x960 | fire_woma | 火焰沃玛 | 熔岩裂纹+火球法杖（原作会喷火，造型推测） |
| portraits/dark_warrior_full.png | 705x960 | dark_warrior | 暗黑战士 | 黑甲角盔+巨剑+暗影（推测） |
| portraits/mine_zombie_full.png | 685x960 | mine_zombie | 僵尸（矿区） | 矿工僵尸+矿镐（21cq 僵尸1–5 合一 [适配]） |

背景（1920×1080 jpg）：
- `bg/bg_floor25.jpg` 沃玛寺庙（红石兽首柱神殿）
- `bg/bg_floor28.jpg` 比奇矿区（木支架矿道、矿车）
- `bg/bg_floor33.jpg` 毒蛇矿区（绿色毒雾矿洞）

说明：规格写的是区间（25–27 / 28–32 / 33–34），每套只出 1 张，用区间首号命名；其余层号可直接复用同套图或另行补图（存疑，接入方自定）。
## M. 传世独有技能图标（art/chuanshi-skills）
详见 `docs/chuanshi-skills.md`。16 个图标，64×64 + @2x 128×128，路径 `public/assets/skills/skill_<id>.png`：
thunder_sword 雷霆剑、break_strike 破击剑法、shield_break 破盾斩、vajra_body 金刚护体、dash_slash 突斩（战士）；ice_arrow 冰箭术、ice_dragon 冰龙破、frost_blade 玄冰刃、five_thunder 五雷轰、ice_whirl 冰旋风（法师）；drive_corpse 赶尸、decoy_talisman 替身法符、soul_wall 灵魂墙、clear_mind 道心清明、holy_light 神光术、cleanse 解毒术（道士）。
预览：`docs/art-gap-preview/chuanshi_skills.jpg`。src 未改，接入时在 classes.ts 增加技能并把 icon 指向对应文件。
### L.x 神兽改为直立站姿（2026-10-31）
- `public/assets/portraits/summon_beast_full.png` 重绘为直立站姿：后腿站立、身体直立、一爪前伸微抬、一爪垂于腹前，正面偏 3/4；配色与画风沿用旧版（米黄毛、浅色鬃毛、弯角、青蓝眼、紫蓝电光爪）。
- 尺寸保持 960×747，透明背景，脚底 y=745，内容水平重心 x≈480。
- 攻击帧 `fx/summon_beast_atk.png`、受击帧 `fx/summon_beast_hurt.png` 同步重绘为直立姿态，尺寸/脚底锚点/重心与立绘一致（960×747，脚底 y≈745，重心 x=480），代码无需改动。
- 旧立绘备份：`docs/art-gap-preview/summon_beast_full_old.png`；新旧对比：`docs/art-gap-preview/summon_beast_upright_compare.jpg`。
- 处理脚本：`/workspace/cardlegend/gap/beast_up.py`。
### 批次5：蛇魔谷（下） + 禁地（12）

预览：`docs/art-gap-preview/sq_b5_snake_jindi.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| three_head_snake_full.png | 859x960 | three_head_snake | 三头蛇 | 蛇魔谷（传世） | 据描述 | 红蛇妖受魔法感染变成三个脑袋 |
| scarab_full.png | 960x722 | scarab | 圣甲虫 | 蛇魔谷（传世） | 部分推测 | 防御极强的甲虫 |
| magic_beetle_full.png | 960x888 | magic_beetle | 魔甲虫 | 蛇魔谷（传世） | 部分推测 | 会石化魔法的甲虫 |
| termite_full.png | 960x701 | termite | 白蚁 | 蛇魔谷（传世） | 部分推测 | 蚁巢中的小生物 |
| thorn_demon_full.png | 709x960 | thorn_demon | 刺魔 | 禁地（传世） | 据描述 | 剪刀般利爪，背上六根背鳍 |
| claw_demon_full.png | 723x960 | claw_demon | 利爪魔 | 禁地（传世） | 未查到/推测 | 仅名称与掉落 |
| flash_demon_full.png | 715x960 | flash_demon | 闪灵 | 禁地（传世） | 未查到/推测 | 又名闪电魔，外形未查到 |
| vine_demon_full.png | 722x960 | vine_demon | 藤妖 | 禁地（传世） | 据描述 | 千年藤树化身，全身树藤 |
| blood_demon_full.png | 722x960 | blood_demon | 血妖 | 禁地（传世） | 据描述 | 远程吐血攻击，类似僵尸 |
| iron_wing_full.png | 960x702 | iron_wing | 铁翼魔 | 禁地（传世） | 据描述 | 像巨大蝙蝠 |
| yao_lishi_full.png | 720x960 | yao_lishi | 妖力士 | 禁地（传世） | 据描述 | 面目狰狞，一只手臂粗大无比 |
| ghost_bug_full.png | 960x830 | ghost_bug | 幽灵虫 | 禁地（传世） | 未查到/推测 | 仅名称（另有幽灵虫母） |

### 批次6：潘夜神殿（8）

预览：`docs/art-gap-preview/sq_b6_panye.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| panye_warrior_full.png | 701x960 | panye_warrior | 潘夜战士 | 潘夜神殿（传奇3） | 据描述 | 牛的样子的潘夜族战士 |
| panye_wind_full.png | 803x960 | panye_wind | 潘夜风魔 | 潘夜神殿（传奇3） | 据描述 | 牛形，黑甲，长柄斧 |
| panye_cloud_full.png | 769x960 | panye_cloud | 潘夜云魔 | 潘夜神殿（传奇3） | 据描述 | 牛形，绿甲，双铁锤 |
| panye_fire_full.png | 709x960 | panye_fire | 潘夜火魔 | 潘夜神殿（传奇3） | 据描述 | 牛形，黄甲，偃月刀 |
| panye_ice_full.png | 782x960 | panye_ice | 潘夜冰魔 | 潘夜神殿（传奇3） | 据描述 | 牛形，蓝甲，两把双刃斧 |
| panye_left_guard_full.png | 712x960 | panye_left_guard | 潘夜左护卫 | 潘夜神殿（传奇3） | 部分推测 | 黑太阳灵气，多种魔法；体型推测 |
| panye_right_guard_full.png | 722x960 | panye_right_guard | 潘夜右护卫 | 潘夜神殿（传奇3） | 部分推测 | 黑月亮灵气，多种魔法；体型推测 |
| panye_ghost_general_full.png | 708x960 | panye_ghost_general | 潘夜鬼将 | 潘夜神殿（传奇3） | 据描述 | 与潘夜战士非常像 |

### 修正：去乱码字/结构问题（7 张重画）

预览：`docs/art-gap-preview/sq_fix_glyphs.jpg`

| 文件 | 尺寸 | id | 名称 | 地图 | 外观 | 备注 |
|---|---|---|---|---|---|---|
| boss_jiguan_beast_full.png | 960x789 | boss_jiguan_beast | 机关巨兽 | 机关洞·中枢大殿（传世） | 部分推测 | 17173 传世：机关洞最深处 BOSS，攻击时巨石从天而降；体型/兽形为推测 |
| shiwei_full.png | 720x960 | shiwei | 尸卫 | 将军坟（传世） | 部分推测 | 殉葬帝王大军所化，千年不腐的尸兵 |
| shiwei_general_full.png | 739x960 | shiwei_general | 尸卫战将 | 将军坟（传世） | 部分推测 | 亲卫军所化，最恐怖的部队 |
| bronze_man_full.png | 699x960 | bronze_man | 铜人 | 机关洞（传世） | 据描述 | 纯铜组装，握铜矛 |
| bronze_beast_full.png | 960x720 | bronze_beast | 青铜兽 | 机关洞（传世） | 部分推测 | 兽化的铜机关；兽形为推测 |
| ant_poison_full.png | 960x490 | ant_poison | 爆毒蚂蚁 | 蚂蚁洞穴（传奇3） | 据描述 | 小腹有喷毒射管，钳/爪不发达 |
| red_snake_yao_full.png | 720x960 | red_snake_yao | 红蛇妖 | 蛇魔谷（传世） | 部分推测 | 蛇妖小喽啰 |
