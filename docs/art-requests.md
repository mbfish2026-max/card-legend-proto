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
对应 gap-vs-official §3.1 / §6.1 / §6.7。全部为AI 生成卡通美术，未使用原版素材；NPC 名称沿用原版常见称呼（来源：传奇正传比奇省 NPC 坐标表、5PK 比奇地图指南、他也玩传奇比奇城攻略），查不到的标“待确认”。（注：本文件已有 H 节为悬赏/成就，故本章编号为 J。）

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
需求：“城镇的贴图要做成横版的，走到不同店铺下不同的npc”。全部为AI 生成卡通美术，白天明亮色调。街道总长 5760×1080，分三层：

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
- AI 生成，未描摹原作素材。

## feat/maps-batch3（plan-60h B3）

规格按 L 章：怪物立绘 `public/assets/portraits/<id>_full.png`，透明底 PNG，最长边 960；接入时 ASSETS 加 `<id>` 并把 units 的 art 指向它。现均复用已有贴图（括号内为占位）。

| id | 官方名 | 文件 | 现占位 | 来源 |
|---|---|---|---|---|
| pincer_bug | 钳虫 | `public/assets/portraits/pincer_bug_full.png` | centipede | [21cq 地牢一层西](https://www.21cq.com/mir/Map.aspx?id=1379) |
| giant_worm | 巨型蠕虫 | `public/assets/portraits/giant_worm_full.png` | black_maggot | [21cq 地牢一层东](https://www.21cq.com/mir/Map.aspx?id=1378) |
| wedge_moth | 楔蛾 | `public/assets/portraits/wedge_moth_full.png` | jump_bee | [21cq 石墓一层](https://www.21cq.com/mir/Map.aspx?id=1198) |
| horn_fly | 角蝇 | `public/assets/portraits/horn_fly_full.png` | jump_bee | [21cq 石墓三层](https://www.21cq.com/mir/Map.aspx?id=1200) |
| boss_evil_pincer | 邪恶钳虫（BOSS） | `public/assets/portraits/boss_evil_pincer_full.png` | boss_chulong | [21cq 地牢一层北](https://www.21cq.com/mir/Map.aspx?id=1380) |
| boss_evil_snake | 邪恶毒蛇（BOSS） | `public/assets/portraits/boss_evil_snake_full.png` | boss_white_boar | [21cq 石墓七层](https://www.21cq.com/mir/Map.aspx?id=1233) |
| boss_shimu_lich | 石墓尸王（BOSS） | `public/assets/portraits/boss_shimu_lich_full.png` | boss_lich | [21cq 石墓七层](https://www.21cq.com/mir/Map.aspx?id=1233) |

背景 4 套（1920×1080 起，jpg）：蜈蚣洞地牢（bg_floor35–39，下标 34–38）、蜈蚣洞深层（bg_floor40–46，下标 39–45）、石墓（bg_floor47–53，下标 46–52）、香石墓穴（bg_floor54–56，下标 53–55）；现占位 bg_floor3 / bg_floor4 / bg_floor5。外观均「未查到」官方原图，按地名推测。
## maps-batch2 交付（art/maps-batch2）

预览：`docs/art-gap-preview/maps_batch2.jpg`。AI 生成，外观参照原版传奇设定（名称/地图），未描摹原作贴图。

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

## art/maps-batch3 交付（对应 feat/maps-batch3 章）

AI 生成，未描摹原作/WoW 素材；立绘透明底 PNG 最长边 960，背景 1920×1080 JPG（下 40% 空地面）。预览：docs/art-gap-preview/maps_batch3.jpg

| 文件 | 尺寸 | 外观依据 |
|---|---|---|
| portraits/pincer_bug_full.png 钳虫 | 941×960 | 新浪游戏：额前巨钳、硬壳、六足、无眼靠触角 |
| portraits/giant_worm_full.png 巨型蠕虫 | 865×960 | 新浪游戏：形似蜈蚣；颜色为推测 |
| portraits/wedge_moth_full.png 楔蛾 | 960×913 | 搜狐：会喷毒；外观未查到/推测 |
| portraits/horn_fly_full.png 角蝇 | 960×945 | 搜狐：会放蝙蝠；外观未查到/推测（独角苍蝇） |
| portraits/boss_evil_pincer_full.png 邪恶钳虫 | 932×960 | 新浪游戏：巨型变异钳虫、锻造般坚硬外壳；配色推测 |
| portraits/boss_evil_snake_full.png 邪恶毒蛇 | 915×960 | 未查到/推测（巨型毒蛇） |
| portraits/boss_shimu_lich_full.png 石墓尸王 | 921×960 | 未查到/推测（尸王/巫妖形象） |
| bg/bg_floor35.jpg 蜈蚣洞地牢（35–39） | 1920×1080 | 未查到/推测 |
| bg/bg_floor40.jpg 蜈蚣洞深层（40–46） | 1920×1080 | 未查到/推测 |
| bg/bg_floor47.jpg 石墓（47–53） | 1920×1080 | 未查到/推测 |
| bg/bg_floor54.jpg 香石墓穴（54–56） | 1920×1080 | 未查到/推测 |

存疑：钳虫/邪恶钳虫腿数画成约 8 条（原作描述六足）；楔蛾、角蝇、邪恶毒蛇、石墓尸王外观均为推测。

## art/maps-sq-mir3 交付·第 1 批（9 BOSS）

AI 生成，透明底 PNG 最长边 960。预览：docs/art-gap-preview/sq_mir3_batch1.jpg。外观依据：传奇3 资料取自中华网《传奇3》怪物介绍（game.china.com/zh_cn/hotspot/mir3/monster/10.html、11.html），传奇世界 BOSS 外观官方描述未查到。

| 文件 | 尺寸 | 外观依据 |
|---|---|---|
| boss_sq_shiba_full.png 尸霸 | 901×960 | 未查到/推测（尸卫首领：腐尸巨汉+角盔巨剑） |
| boss_m3_ant_general_full.png 蚂蚁将军 | 818×960 | 未查到/推测（人立巨蚁持弯刃，六肢） |
| boss_sq_jiguan_full.png 机关巨兽 | 960×930 | 未查到/推测（青铜机关狮兽） |
| boss_sq_snake_king_full.png 三头蛇王 | 960×941 | 名称即三头；配色推测（白绿，呼应白蛇妖） |
| boss_m3_skel_master_full.png 骷髅教主 | 936×960 | 中华网：控制潘夜洞的魔王，魔杖由含冤骷髅聚成；其余推测 |
| boss_m3_great_pharaoh_full.png 大法老 | 942×960 | 未查到/推测（沙漠木乃伊法老） |
| boss_sq_nimo_full.png 逆魔 | 929×960 | 未查到/推测（红肤双角魔将） |
| boss_sq_jindi_full.png 禁地魔王 | 801×960 | 未查到/推测（灰蓝四角魔王，青玉晶体呼应青玉宫） |
| boss_m3_panye_bull_full.png 潘夜牛魔王 | 960×958 | 中华网/百度百科：牛面牛身的畜界魔王；装备推测 |

存疑：机关巨兽腿甲有类似「2/9」的螺旋装饰纹（非文字，第一版有类字母刻纹已重做）；机关巨兽蒸汽、禁地魔王雾气边缘略带粉色残边；逆魔武器为斧而非扇；骷髅教主首版偏紫已改绿底重做。

## feat/maps-sq-mir3

规格按 L 章：立绘 `public/assets/portraits/<id>_full.png` 透明底 PNG 最长边 960，接入时 ASSETS 加 `<id>` 并把 units 的 art 指向它；背景 1920×1080 JPG，接入时改 `bg_floorN` 路径（N=下标+1）。现均为占位（括号列为借用贴图）。外观官方描述未查到的一律按名推测并注明。

### 立绘（54 普通怪 + 9 BOSS）

| id | 官方名 | 文件 | 现占位 | 来源 |
|---|---|---|---|---|
| sq_shiwei | 尸卫 | `public/assets/portraits/sq_shiwei_full.png` | skeleton | [来源](https://woool.52pk.com/data/100995.shtml) |
| sq_shiwei_yong | 尸卫勇士 | `public/assets/portraits/sq_shiwei_yong_full.png` | skeleton | [来源](https://woool.52pk.com/data/100995.shtml) |
| sq_shiwei_qiang | 掷枪尸卫 | `public/assets/portraits/sq_shiwei_qiang_full.png` | skeleton | [来源](https://woool.52pk.com/data/100995.shtml) |
| sq_shiwei_zhan | 尸卫战将 | `public/assets/portraits/sq_shiwei_zhan_full.png` | skeleton | [来源](https://woool.52pk.com/data/100995.shtml) |
| sq_bat | 蝙蝠 | `public/assets/portraits/sq_bat_full.png` | bat | [来源](https://woool.52pk.com/data/100995.shtml) |
| m3_ant_warrior | 蚂蚁战士 | `public/assets/portraits/m3_ant_warrior_full.png` | jump_bee | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_ant_armor | 盔甲蚂蚁 | `public/assets/portraits/m3_ant_armor_full.png` | black_maggot | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_ant_bomb | 爆毒蚂蚁 | `public/assets/portraits/m3_ant_bomb_full.png` | jump_bee | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_ant_tao | 蚂蚁道士 | `public/assets/portraits/m3_ant_tao_full.png` | centipede | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| sq_stone_man | 石人 | `public/assets/portraits/sq_stone_man_full.png` | zuma_statue | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_bronze_man | 铜人 | `public/assets/portraits/sq_bronze_man_full.png` | zuma_guard | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_bronze_beast | 青铜兽 | `public/assets/portraits/sq_bronze_beast_full.png` | zuma_statue | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_blade_man | 滚刀手 | `public/assets/portraits/sq_blade_man_full.png` | zuma_guard | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_hammer_man | 铜锤手 | `public/assets/portraits/sq_hammer_man_full.png` | zuma_guard | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_jingang | 金刚人 | `public/assets/portraits/sq_jingang_full.png` | zuma_statue | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| sq_red_snake_yao | 红蛇妖 | `public/assets/portraits/sq_red_snake_yao_full.png` | red_snake | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_black_snake_yao | 黑蛇妖 | `public/assets/portraits/sq_black_snake_yao_full.png` | tiger_snake | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_scarab | 圣甲虫 | `public/assets/portraits/sq_scarab_full.png` | dung_beetle | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_magic_beetle | 魔甲虫 | `public/assets/portraits/sq_magic_beetle_full.png` | dung_beetle | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_termite | 白蚁 | `public/assets/portraits/sq_termite_full.png` | centipede | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_three_snake | 三头蛇 | `public/assets/portraits/sq_three_snake_full.png` | scorpion_snake | [来源](https://woool.52pk.com/data/101224.shtml) |
| sq_white_snake_yao | 白蛇妖 | `public/assets/portraits/sq_white_snake_yao_full.png` | red_snake | [来源](https://woool.52pk.com/data/101224.shtml) |
| m3_skel_wushi | 骷髅武士 | `public/assets/portraits/m3_skel_wushi_full.png` | skeleton | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_skel_wujiang | 骷髅武将 | `public/assets/portraits/m3_skel_wujiang_full.png` | skeleton | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_skel_soldier | 骷髅士兵 | `public/assets/portraits/m3_skel_soldier_full.png` | skeleton | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_skel_archer | 骷髅弓箭手 | `public/assets/portraits/m3_skel_archer_full.png` | skeleton | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_bone_general | 骨鬼将 | `public/assets/portraits/m3_bone_general_full.png` | skeleton | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_noma | 诺玛 | `public/assets/portraits/m3_noma_full.png` | zuma_statue | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_noma_pharaoh | 诺玛法老 | `public/assets/portraits/m3_noma_pharaoh_full.png` | zuma_guard | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_desert_fish | 沙漠鱼魔 | `public/assets/portraits/m3_desert_fish_full.png` | scorpion_snake | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_desert_wind | 沙漠风魔 | `public/assets/portraits/m3_desert_wind_full.png` | jump_bee | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_desert_tree | 沙漠树魔 | `public/assets/portraits/m3_desert_tree_full.png` | tree_demon | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_desert_stone | 沙漠石人 | `public/assets/portraits/m3_desert_stone_full.png` | zuma_statue | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| sq_imp | 地下小鬼 | `public/assets/portraits/sq_imp_full.png` | darkmage | [来源](https://woool.52pk.com/data/100994.shtml) |
| sq_nimo_archer | 逆魔弓箭手 | `public/assets/portraits/sq_nimo_archer_full.png` | zuma_guard | [来源](https://woool.52pk.com/data/100994.shtml) |
| sq_nimo_guard | 逆魔卫士 | `public/assets/portraits/sq_nimo_guard_full.png` | zuma_guard | [来源](https://woool.52pk.com/data/100994.shtml) |
| sq_nimo_shiwei | 逆魔侍卫 | `public/assets/portraits/sq_nimo_shiwei_full.png` | bull_guard | [来源](https://woool.52pk.com/data/100994.shtml) |
| sq_nimo_statue | 逆魔雕像 | `public/assets/portraits/sq_nimo_statue_full.png` | zuma_statue | [来源](https://woool.52pk.com/data/100994.shtml) |
| sq_cimo | 刺魔 | `public/assets/portraits/sq_cimo_full.png` | hongmo_pig | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_lizhua | 利爪魔 | `public/assets/portraits/sq_lizhua_full.png` | hongmo_scorpion | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_shanling | 闪灵 | `public/assets/portraits/sq_shanling_full.png` | darkmage | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_tengyao | 藤妖 | `public/assets/portraits/sq_tengyao_full.png` | tree_demon | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_xueyao | 血妖 | `public/assets/portraits/sq_xueyao_full.png` | blood_zombie | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_tieyi | 铁翼魔 | `public/assets/portraits/sq_tieyi_full.png` | jump_bee | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_yaolishi | 妖力士 | `public/assets/portraits/sq_yaolishi_full.png` | bull_warrior | [来源](https://woool.52pk.com/data/101222.shtml) |
| sq_youling_bug | 幽灵虫 | `public/assets/portraits/sq_youling_bug_full.png` | black_maggot | [来源](https://woool.52pk.com/data/101222.shtml) |
| m3_panye_fire | 潘夜火魔 | `public/assets/portraits/m3_panye_fire_full.png` | fire_woma | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_wind | 潘夜风魔 | `public/assets/portraits/m3_panye_wind_full.png` | woma_brave | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_ice | 潘夜冰魔 | `public/assets/portraits/m3_panye_ice_full.png` | woma_general | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_cloud | 潘夜云魔 | `public/assets/portraits/m3_panye_cloud_full.png` | darkmage | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_warrior | 潘夜战士 | `public/assets/portraits/m3_panye_warrior_full.png` | bull_warrior | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_left | 潘夜左护卫 | `public/assets/portraits/m3_panye_left_full.png` | bull_guard | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_right | 潘夜右护卫 | `public/assets/portraits/m3_panye_right_full.png` | bull_guard | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| m3_panye_ghost | 潘夜鬼将 | `public/assets/portraits/m3_panye_ghost_full.png` | dark_warrior | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| boss_sq_shiba | 尸霸 | `public/assets/portraits/boss_sq_shiba_full.png` | boss_lich | [来源](https://woool.52pk.com/data/100995.shtml) |
| boss_m3_ant_general | 蚂蚁将军 | `public/assets/portraits/boss_m3_ant_general_full.png` | boss_chulong | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| boss_sq_jiguan | 机关巨兽 | `public/assets/portraits/boss_sq_jiguan_full.png` | boss_zuma | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| boss_sq_snake_king | 三头蛇王 | `public/assets/portraits/boss_sq_snake_king_full.png` | boss_white_boar | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| boss_m3_skel_master | 骷髅教主 | `public/assets/portraits/boss_m3_skel_master_full.png` | boss_skeleton_lord | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| boss_m3_great_pharaoh | 大法老 | `public/assets/portraits/boss_m3_great_pharaoh_full.png` | boss_zuma | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| boss_sq_nimo | 逆魔 | `public/assets/portraits/boss_sq_nimo_full.png` | boss_hongmo | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| boss_sq_jindi | 禁地魔王 | `public/assets/portraits/boss_sq_jindi_full.png` | boss_redmoon | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| boss_m3_panye_bull | 潘夜牛魔王 | `public/assets/portraits/boss_m3_panye_bull_full.png` | boss_bull_king | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |

### 背景（24 层，可按图群合并为 10 张）

| key | 层 | 文件 | 现占位 | 来源 |
|---|---|---|---|---|
| bg_floor57 | 异界裂隙·将军坟东一层 | `public/assets/bg/bg_floor57.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100995.shtml) |
| bg_floor58 | 异界裂隙·将军坟东二层 | `public/assets/bg/bg_floor58.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100995.shtml) |
| bg_floor59 | 异界裂隙·蚂蚁洞穴 | `public/assets/bg/bg_floor59.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| bg_floor60 | 异界裂隙·机关道一 | `public/assets/bg/bg_floor60.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| bg_floor61 | 异界裂隙·中枢大殿 | `public/assets/bg/bg_floor61.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](http://woool.17173.com/content/2025-05-07/20250507220209240.shtml) |
| bg_floor62 | 异界裂隙·蛇魔谷 | `public/assets/bg/bg_floor62.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101224.shtml) |
| bg_floor63 | 异界裂隙·地穴入口 | `public/assets/bg/bg_floor63.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101224.shtml) |
| bg_floor64 | 异界裂隙·环道 | `public/assets/bg/bg_floor64.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101224.shtml) |
| bg_floor65 | 异界裂隙·百虫穴 | `public/assets/bg/bg_floor65.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101224.shtml) |
| bg_floor66 | 异界裂隙·五蛇殿 | `public/assets/bg/bg_floor66.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| bg_floor67 | 异界裂隙·潘夜石窟 | `public/assets/bg/bg_floor67.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| bg_floor68 | 异界裂隙·沙漠 | `public/assets/bg/bg_floor68.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |
| bg_floor69 | 异界裂隙·逆魔古刹一层 | `public/assets/bg/bg_floor69.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100994.shtml) |
| bg_floor70 | 异界裂隙·逆魔古刹二层 | `public/assets/bg/bg_floor70.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100994.shtml) |
| bg_floor71 | 异界裂隙·逆魔古刹三层 | `public/assets/bg/bg_floor71.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100994.shtml) |
| bg_floor72 | 异界裂隙·逆魔古刹四层 | `public/assets/bg/bg_floor72.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/100994.shtml) |
| bg_floor73 | 异界裂隙·逆魔大殿 | `public/assets/bg/bg_floor73.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| bg_floor74 | 异界裂隙·禁地·禁地之门 | `public/assets/bg/bg_floor74.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101222.shtml) |
| bg_floor75 | 异界裂隙·禁地·冰石之地 | `public/assets/bg/bg_floor75.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101222.shtml) |
| bg_floor76 | 异界裂隙·禁地·青玉宫 | `public/assets/bg/bg_floor76.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101222.shtml) |
| bg_floor77 | 异界裂隙·禁地·生死门 | `public/assets/bg/bg_floor77.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101222.shtml) |
| bg_floor78 | 异界裂隙·禁地·尸上行 | `public/assets/bg/bg_floor78.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.52pk.com/data/101222.shtml) |
| bg_floor79 | 异界裂隙·禁地·魔穴 | `public/assets/bg/bg_floor79.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://woool.17173.com/content/2014-11-30/20141130225158263.shtml) |
| bg_floor80 | 异界裂隙·潘夜神殿 | `public/assets/bg/bg_floor80.jpg`（1920×1080 JPG，下 40% 空地面） | 借用相邻原层背景 | [来源](https://mir3.17173.com/content/2012-09-12/20120912115140056.shtml) |


## art/maps-sq-mir3 交付·第 2 批（尸卫+蚂蚁，9 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch2.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| sq_shiwei_full.png | 720x960 | 尸卫 | 复用 art/sq-mir3 的 shiwei_full.png |
| sq_shiwei_yong_full.png | 706x960 | 尸卫勇士 | 复用 art/sq-mir3 的 shiwei_brave_full.png |
| sq_shiwei_qiang_full.png | 759x960 | 枪尸卫 | 复用 art/sq-mir3 的 shiwei_spear_full.png |
| sq_shiwei_zhan_full.png | 739x960 | 尸卫战将 | 复用 art/sq-mir3 的 shiwei_general_full.png |
| sq_bat_full.png | 960x707 | 蝙蝠 | 新画（AI 生成，据常见蝙蝠外形，具体外观未查到/推测） |
| m3_ant_warrior_full.png | 882x960 | 蚂蚁战士 | 复用 art/sq-mir3 的 ant_warrior_full.png |
| m3_ant_armor_full.png | 960x673 | 盔甲蚂蚁 | 复用 art/sq-mir3 的 ant_armored_full.png |
| m3_ant_bomb_full.png | 960x490 | 爆毒蚂蚁 | 复用 art/sq-mir3 的 ant_poison_full.png |
| m3_ant_tao_full.png | 783x960 | 蚂蚁道士 | 复用 art/sq-mir3 的 ant_taoist_full.png |


## art/maps-sq-mir3 交付·第 3 批（机关+潘夜石窟骷髅，11 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch3.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| sq_stone_man_full.png | 795x960 | 石人 | 复用 art/sq-mir3 的 stone_man_full.png |
| sq_bronze_man_full.png | 699x960 | 铜人 | 复用 art/sq-mir3 的 bronze_man_full.png |
| sq_bronze_beast_full.png | 960x720 | 铜兽 | 复用 art/sq-mir3 的 bronze_beast_full.png |
| sq_blade_man_full.png | 790x960 | 滚刀手 | 复用 art/sq-mir3 的 blade_roller_full.png |
| sq_hammer_man_full.png | 721x960 | 锤手 | 复用 art/sq-mir3 的 hammer_man_full.png |
| sq_jingang_full.png | 702x960 | 金刚人 | 复用 art/sq-mir3 的 vajra_man_full.png |
| m3_skel_wushi_full.png | 698x960 | 骷髅武士 | 复用 art/sq-mir3 的 skel_samurai_full.png |
| m3_skel_wujiang_full.png | 717x960 | 骷髅武将 | 复用 art/sq-mir3 的 skel_general_full.png |
| m3_skel_soldier_full.png | 755x960 | 骷髅士兵 | 复用 art/sq-mir3 的 skel_soldier_full.png |
| m3_skel_archer_full.png | 674x960 | 骷髅弓箭手 | 复用 art/sq-mir3 的 skel_archer_full.png |
| m3_bone_general_full.png | 721x960 | 骨鬼将 | 复用 art/sq-mir3 的 bone_ghost_general_full.png |


## art/maps-sq-mir3 交付·第 4 批（蛇谷/百虫+逆魔古刹，12 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch4.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| sq_red_snake_yao_full.png | 720x960 | 红蛇妖 | 复用 art/sq-mir3 的 red_snake_yao_full.png |
| sq_black_snake_yao_full.png | 708x960 | 黑蛇妖 | 复用 art/sq-mir3 的 black_snake_yao_full.png |
| sq_scarab_full.png | 960x722 | 圣甲虫 | 复用 art/sq-mir3 的 scarab_full.png |
| sq_magic_beetle_full.png | 960x888 | 魔甲虫 | 复用 art/sq-mir3 的 magic_beetle_full.png |
| sq_termite_full.png | 960x701 | 白蚁 | 复用 art/sq-mir3 的 termite_full.png |
| sq_three_snake_full.png | 859x960 | 三头蛇 | 复用 art/sq-mir3 的 three_head_snake_full.png |
| sq_white_snake_yao_full.png | 716x960 | 白蛇妖 | 复用 art/sq-mir3 的 boss_white_snake_full.png |
| sq_imp_full.png | 933x960 | 地下小鬼 | 复用 art/sq-mir3 的 underground_imp_full.png |
| sq_nimo_archer_full.png | 695x960 | 逆魔弓箭手 | 复用 art/sq-mir3 的 nimo_archer_full.png |
| sq_nimo_guard_full.png | 728x960 | 逆魔卫士 | 复用 art/sq-mir3 的 nimo_guard_full.png |
| sq_nimo_shiwei_full.png | 731x960 | 逆魔侍卫 | 复用 art/sq-mir3 的 nimo_attendant_full.png |
| sq_nimo_statue_full.png | 708x960 | 逆魔雕像 | 复用 art/sq-mir3 的 nimo_statue_full.png |


## art/maps-sq-mir3 交付·第 5 批（沙漠，6 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch5.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| m3_noma_full.png | 754x960 | 诺玛 | 复用 art/sq-mir3 的 noma_full.png |
| m3_noma_pharaoh_full.png | 699x960 | 诺玛法老 | 复用 art/sq-mir3 的 noma_pharaoh_full.png |
| m3_desert_fish_full.png | 721x960 | 沙漠鱼 | 复用 art/sq-mir3 的 desert_fish_full.png |
| m3_desert_wind_full.png | 704x960 | 沙漠风魔 | 复用 art/sq-mir3 的 desert_wind_full.png |
| m3_desert_tree_full.png | 724x960 | 沙漠树魔 | 复用 art/sq-mir3 的 desert_tree_full.png |
| m3_desert_stone_full.png | 761x960 | 沙漠石人 | 复用 art/sq-mir3 的 desert_golem_full.png |


## art/maps-sq-mir3 交付·第 6 批（禁地，8 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch6.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| sq_cimo_full.png | 709x960 | 刺魔 | 复用 art/sq-mir3 的 thorn_demon_full.png |
| sq_lizhua_full.png | 723x960 | 利爪 | 复用 art/sq-mir3 的 claw_demon_full.png |
| sq_shanling_full.png | 715x960 | 闪灵 | 复用 art/sq-mir3 的 flash_demon_full.png |
| sq_tengyao_full.png | 722x960 | 藤妖 | 复用 art/sq-mir3 的 vine_demon_full.png |
| sq_xueyao_full.png | 722x960 | 血妖 | 复用 art/sq-mir3 的 blood_demon_full.png |
| sq_tieyi_full.png | 960x702 | 铁翼 | 复用 art/sq-mir3 的 iron_wing_full.png |
| sq_yaolishi_full.png | 720x960 | 妖力士 | 复用 art/sq-mir3 的 yao_lishi_full.png |
| sq_youling_bug_full.png | 960x830 | 幽灵虫 | 复用 art/sq-mir3 的 ghost_bug_full.png |


## art/maps-sq-mir3 交付·第 7 批（潘夜神殿，8 张）

路径：`public/assets/portraits/<id>_full.png`，透明 PNG，最长边 960。预览：`docs/art-gap-preview/sq_mir3_batch7.jpg`。

| 文件 | 尺寸 | 名称 | 来源 |
|---|---|---|---|
| m3_panye_fire_full.png | 709x960 | 潘夜火魔 | 复用 art/sq-mir3 的 panye_fire_full.png |
| m3_panye_wind_full.png | 803x960 | 潘夜风魔 | 复用 art/sq-mir3 的 panye_wind_full.png |
| m3_panye_ice_full.png | 782x960 | 潘夜冰魔 | 复用 art/sq-mir3 的 panye_ice_full.png |
| m3_panye_cloud_full.png | 769x960 | 潘夜云魔 | 复用 art/sq-mir3 的 panye_cloud_full.png |
| m3_panye_warrior_full.png | 701x960 | 潘夜战士 | 复用 art/sq-mir3 的 panye_warrior_full.png |
| m3_panye_left_full.png | 712x960 | 潘夜左护卫 | 复用 art/sq-mir3 的 panye_left_guard_full.png |
| m3_panye_right_full.png | 722x960 | 潘夜右护卫 | 复用 art/sq-mir3 的 panye_right_guard_full.png |
| m3_panye_ghost_full.png | 708x960 | 潘夜鬼将 | 复用 art/sq-mir3 的 panye_ghost_general_full.png |


## art/maps-sq-mir3 交付·第 8 批（背景 10 张，全部新画）

路径：`public/assets/bg/<id>.jpg`，1920x1080，JPG 质量 90，底部约 40% 留空地面。预览：`docs/art-gap-preview/sq_mir3_batch8_bg.jpg`。

**合层方案**（每组同一张图，文件以首层命名；需要分层时，代码可直接用首层图，或者 copy 出 bg_floorNN.jpg）：

| 文件 | 覆盖楼层 | 场景 |
|---|---|---|
| bg_floor57.jpg | 57–58 | 将军坟东一/二层：石棺、武将石像、火盆 |
| bg_floor59.jpg | 59 | 蚂蚁洞穴：土洞、琥珀、蚁卵 |
| bg_floor60.jpg | 60–61 | 机关道一、中枢大殿：青铜齿轮、锁链、青色晶石 |
| bg_floor62.jpg | 62–66 | 蛇魔谷、地穴入口、环道、百虫穴、五蛇殿：缠蛇石柱、绿色毒雾 |
| bg_floor67.jpg | 67 | 潘夜石窟：骨堆、残旗、蓝火 |
| bg_floor68.jpg | 68 | 沙漠：沙丘、残垣、枯树 |
| bg_floor69.jpg | 69–73 | 逆魔古刹一~四层、逆魔大殿：朱漆残柱、倒塌石像、红烛 |
| bg_floor74.jpg | 74–75 | 禁地之门、冰石之地：巨石门、冰晶 |
| bg_floor76.jpg | 76–79 | 青玉宫、生死门、尸上行、魔穴：青玉残殿、血红裂纹 |
| bg_floor80.jpg | 80 | 潘夜神殿：牛角石柱、牛魔石像王座、熔岩裂缝 |

存疑：场景细节由地图名推测（未查到/推测）。沙漠图比其他图亮。潘夜神殿石柱上的牛头浮雕为原创图形。

## 手机界面（feat/mobile-ui）
按钮底板、摇杆、技能圆框都用 CSS 代码绘制（暗金边框 + 径向渐变）。顶部功能图标暂用 emoji（🎒📜🎯🗺🏯⚙）。
待美术：6 个手机顶部图标（48×46 CSS px，2x 出图 96×92）、摇杆底盘和摇杆头、「进入/对话」大圆键底板。

## PWA 图标（feat/pwa-fullscreen）
- apple-touch-icon.png（180×180）和 icon-512.png 目前是用 favicon.png（192）放大生成的占位图，512 会发糊。需要 1024×1024 的正式 App 图标（不透明、黑底、不带圆角，iOS 会自己加圆角）。

## art/maps-sq-mir3 重画·第1组（15 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo1.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| sq_shiwei_full.png | 525x960 | 尸卫 | 新画（取代原复用图） | 部分推测：殉葬尸兵，绷带木乃伊+青铜札甲+长戟 |
| sq_shiwei_yong_full.png | 735x960 | 尸卫勇士 | 新画（取代原复用图） | 据描述：手臂化为巨刀；圆盾、铁面具为推测 |
| sq_shiwei_qiang_full.png | 699x960 | 尸卫投枪兵 | 新画（取代原复用图） | 据描述：掷枪兵所化，投枪 |
| sq_shiwei_zhan_full.png | 724x960 | 尸卫战将 | 新画（取代原复用图） | 部分推测：亲卫军所化，金黑重甲+偃月大刀 |
| m3_ant_warrior_full.png | 960x636 | 蚂蚁战士 | 新画（取代原复用图） | 据描述：兵蚁，大头硬壳前额利钳；黑亮外壳为新设计 |
| m3_ant_armor_full.png | 960x549 | 盔甲蚂蚁 | 新画（取代原复用图） | 据描述：前额巨钳；钢蓝铆甲为新设计（重画1次） |
| m3_ant_bomb_full.png | 960x543 | 爆毒蚂蚁 | 新画（取代原复用图） | 据描述：小腹喷毒射管，钳不发达 |
| m3_ant_tao_full.png | 751x960 | 蚂蚁道士 | 新画（取代原复用图） | 据描述：畸形巨大腹部、为同伴回血；骨杖叶披风为新设计 |
| sq_stone_man_full.png | 747x960 | 石人 | 新画（取代原复用图） | 据描述：巨石堆砌；苔藓藤根为新设计 |
| sq_bronze_man_full.png | 486x960 | 铜人 | 新画（取代原复用图） | 据描述：纯铜组装、握铜矛 |
| sq_bronze_beast_full.png | 943x960 | 铜兽 | 新画（取代原复用图） | 部分推测：铜机关兽，狮犬形与蒸汽为推测 |
| sq_blade_man_full.png | 695x960 | 滚刀手 | 新画（取代原复用图） | 据描述：迅猛刀手双刃；背负锯盘、白面具为新设计 |
| sq_hammer_man_full.png | 651x960 | 锤手 | 新画（取代原复用图） | 据描述：持巨锤；矮胖黄铜机关身为新设计 |
| sq_jingang_full.png | 690x960 | 金刚人 | 新画（取代原复用图） | 部分推测：金刚不坏巨人；铸铁肤色、袈裟为新设计 |
| m3_skel_wushi_full.png | 683x960 | 骷髅武士 | 新画（取代原复用图） | 据描述：刀背带两环的刀 |


## art/maps-sq-mir3 重画·第2组（9 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo2.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| m3_skel_soldier_full.png | 438x960 | 骷髅士兵 | 新画（取代原复用图） | 据描述：持带旗长枪 |
| m3_skel_archer_full.png | 674x960 | 骷髅弓箭手 | 新画（取代原复用图） | 据描述：弓箭手；兜帽跪射为新设计 |
| m3_bone_general_full.png | 603x960 | 骨鬼将 | 新画（取代原复用图） | 未查到/推测：骷髅系将领，鬼烟下身、长柄刀为推测 |
| sq_red_snake_yao_full.png | 746x960 | 红蛇妖 | 新画（取代原复用图） | 据描述：蛇妖喽啰；眼镜蛇兜帽、短弯刀为新设计 |
| sq_black_snake_yao_full.png | 723x960 | 黑蛇妖 | 新画（取代原复用图） | 据描述：近卫、高防；塔盾三叉戟为新设计 |
| sq_scarab_full.png | 960x703 | 圣甲虫 | 新画（取代原复用图） | 据描述：高防甲虫；翠玉壳、日珠为新设计 |
| sq_magic_beetle_full.png | 960x785 | 魔甲虫 | 新画（取代原复用图） | 据描述：石化魔法；石纹壳、灰雾为新设计 |
| sq_termite_full.png | 960x588 | 白蚁 | 新画（取代原复用图） | 据描述：小生物；兵蚁大头、朽木为新设计 |
| sq_three_snake_full.png | 696x960 | 三头蛇 | 新画（取代原复用图） | 据描述：三头 |


## art/maps-sq-mir3 重画·第3组（7 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo3.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| m3_skel_wujiang_full.png | 728x960 | 骷髅武将 | 新画（取代原复用图） | 据描述：骨骼变异成巨躯；骨刺、劈刀为新设计 |
| sq_white_snake_yao_full.png | 629x960 | 白蛇妖 | 新画（取代原复用图） | 据描述：蛇魔军团长、高大、利爪 |
| sq_imp_full.png | 780x960 | 地下小鬼 | 新画（取代原复用图） | 据描述：一尺高、持石锤（弯柄改直柄，存疑） |
| sq_nimo_archer_full.png | 628x960 | 逆魔弓箭手 | 新画（取代原复用图） | 部分推测：大漠善射民族被侵蚀；头巾面纱为新设计 |
| sq_nimo_shiwei_full.png | 697x960 | 逆魔侍卫 | 新画（取代原复用图） | 据描述：身后箭型巨尾；蜥蜴形、盾矛为推测 |
| sq_nimo_guard_full.png | 687x960 | 逆魔卫士 | 新画（取代原复用图） | 部分推测：迅猛近战卫士；双弯刀为新设计 |
| sq_nimo_statue_full.png | 653x960 | 逆魔雕像 | 新画（取代原复用图） | 据描述："死神"、巨镰；砂岩活化为新设计 |


## art/maps-sq-mir3 重画·第4组（8 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo4.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| m3_noma_full.png | 746x960 | 诺玛 | 新画（取代原复用图） | 据描述：皮衣骨甲、骨制武器；兽颅盔为新设计 |
| m3_noma_pharaoh_full.png | 689x960 | 诺玛法老 | 新画（取代原复用图） | 据描述：魔法拐棍；法老头饰木乃伊为推测 |
| m3_desert_fish_full.png | 714x960 | 沙漠鱼魔 | 新画（取代原复用图） | 据描述：毒强、不死系；腐烂鱼形为新设计 |
| m3_desert_wind_full.png | 693x960 | 沙漠风魔 | 新画（取代原复用图） | 据描述：持扇；沙旋风下身为新设计（无五官，存疑） |
| m3_desert_tree_full.png | 703x960 | 沙漠树魔 | 新画（取代原复用图） | 据描述：仙人掌、射刺果 |
| m3_desert_stone_full.png | 730x960 | 沙漠石人 | 新画（取代原复用图） | 据描述：石垒；红砂岩层叠、胸晶为新设计（与 sq_stone_man 区分） |
| sq_cimo_full.png | 679x960 | 刺魔 | 新画（取代原复用图） | 据描述：剪刀爪、六背鳍（剪刀爪画成钩爪，存疑） |
| sq_lizhua_full.png | 740x960 | 利爪魔 | 新画（取代原复用图） | 未查到/推测：按名称画长爪兽魔 |


## art/maps-sq-mir3 重画·第5组（6 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo5.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| sq_shanling_full.png | 717x960 | 闪灵 | 新画（取代原复用图） | 未查到/推测：闪电魔，雷纹暗影躯体为推测 |
| sq_tengyao_full.png | 724x960 | 藤妖 | 新画（取代原复用图） | 据描述：藤树化身；紫花为新设计（与 tree_demon 同类，存疑） |
| sq_xueyao_full.png | 700x960 | 血妖 | 新画（取代原复用图） | 据描述：吐血、似僵尸 |
| sq_tieyi_full.png | 960x695 | 铁翼魔 | 新画（取代原复用图） | 据描述：巨蝙蝠；铁板翼为新设计 |
| sq_yaolishi_full.png | 722x960 | 妖力士 | 新画（取代原复用图） | 据描述：一臂粗大；独角、锁链为新设计 |
| sq_youling_bug_full.png | 960x746 | 幽灵虫 | 新画（取代原复用图） | 未查到/推测：按名称画幽灵螳蜂（重画1次） |


## art/maps-sq-mir3 重画·第6组（8 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo6.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| m3_panye_fire_full.png | 728x960 | 潘夜火魔 | 新画（取代原复用图） | 据描述：黄甲、偃月刀；火焰为新设计（牛形只画了牛角，存疑） |
| m3_panye_wind_full.png | 732x960 | 潘夜风魔 | 新画（取代原复用图） | 据描述：黑甲、长柄斧；风旋为新设计（牛形只画了牛角，存疑） |
| m3_panye_ice_full.png | 726x960 | 潘夜冰魔 | 新画（取代原复用图） | 据描述：蓝甲、双刃斧×2（牛形只画了牛角，存疑） |
| m3_panye_cloud_full.png | 727x960 | 潘夜云魔 | 新画（取代原复用图） | 据描述：绿甲、双锤（牛形只画了角，存疑） |
| m3_panye_warrior_full.png | 753x960 | 潘夜战士 | 新画（取代原复用图） | 据描述：牛形战士；狼牙棒、圆盾为推测 |
| m3_panye_left_full.png | 629x960 | 潘夜左护卫 | 新画（取代原复用图） | 部分推测：黑太阳灵气、施法；法袍体型为推测 |
| m3_panye_right_full.png | 551x960 | 潘夜右护卫 | 新画（取代原复用图） | 部分推测：黑月亮灵气、施法；冰雾、体型为推测 |
| m3_panye_ghost_full.png | 724x960 | 潘夜鬼将 | 新画（取代原复用图） | 据描述：与潘夜战士相似的牛形；亡灵化、长刃为推测 |


## art/maps-sq-mir3 重画·第7组（9 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo7.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| hj_guard_full.png | 488x960 | 家园守卫 | 新画（取代原复用图） | 未查到/推测：外形无资料，画成持矛提灯的人类守卫 |
| wolong_guard_full.png | 507x960 | 卧龙护卫 | 新画（取代原复用图） | 未查到/推测：外形无资料，按“卧龙山庄”画成龙纹札甲护院+偃月刀 |
| fire_dragon_guard_full.png | 724x960 | 火龙守卫 | 新画（取代原复用图） | 未查到/推测：外形无资料，按“火龙神殿”画成赤鳞龙人+火焰戟 |
| leiyan_spider_full.png | 960x729 | 雷炎蜘蛛 | 新画（取代原复用图） | 部分推测：按名称画成熔岩甲壳+雷电蜘蛛 |
| cave_skel_warrior_full.png | 727x960 | 骷髅战士 | 新画（取代原复用图） | 部分推测：天然洞穴骷髅战士，持刀盾；苔藓铁锅盔为新设计 |
| cave_skel_general_full.png | 466x960 | 骷髅战将 | 新画（取代原复用图） | 部分推测：青铜角盔+双手大剑；锈绿配色为新设计 |
| axe_skeleton_full.png | 526x960 | 掷斧骷髅 | 新画（取代原复用图） | 据名称：投掷手斧；红头巾为新设计（胸前斧袋画得像子弹带，存疑） |
| cave_bat_full.png | 960x562 | 山洞蝙蝠 | 新画（取代原复用图） | 据名称：洞穴蝙蝠；棕毛、白瞳为推测 |
| cave_maggot_full.png | 794x960 | 洞蛆 | 新画（取代原复用图） | 据名称：蛆虫；圆口利齿为推测 |


## art/maps-sq-mir3 重画·第8组（1 张，取消复用）

用户要求不再复用小怪素材，以下 id 的复制图都换成了各自的新立绘，外形和配色都与原图明显不同。路径：`public/assets/portraits/<id>_full.png`。预览：`docs/art-gap-preview/sq_mir3_redo8.jpg`。

| 文件 | 尺寸 | 名称 | 状态 | 依据 |
|---|---|---|---|---|
| boss_evil_pincer_full.png | 960x759 | 邪恶钳虫 | 新画（取代原复用图） | 部分推测：原图与 pincer_bug 同构图仅换色，重画为直立巨钳虫后；外形细节为推测（毒液绿边可能被抠，存疑） |

## 说明：旧「复用」记录作废

上文 art/maps-sq-mir3 第2–7批中标为「复用」的行，已由「重画·第1–8组」各章取代。所有 sq_/m3_ 小怪、9 个借用他怪 art 的单位，以及 boss_evil_pincer（原图与 pincer_bug 同构图、只换了颜色），现在都是独立新画。src 里的 `art` 字段仍指向旧图，本分支不改 src，需要开发把它们改成各自的 id。

需改 `art` 的单位：hj_guard、wolong_guard、fire_dragon_guard、leiyan_spider、cave_skel_warrior、cave_skel_general、axe_skeleton、cave_bat、cave_maggot，以及 dark_warrior、dung_beetle、fire_woma、giant_worm、horn_fly、mine_zombie、pincer_bug、wedge_moth、woma_brave、woma_general。SQMIR3_BOSS 元组的第 4/5 字段也引用了其他 BOSS 的图（例如蚂蚁将军→boss_evil_pincer），但这些 BOSS 都已有自己的 `<id>_full.png`，建议一并改为自身 id。

## F. 矿点（阶段4 挖矿，feat/balance-sys）
- 现状：BattleScene.syncMine() 代码绘制（灰色岩堆 + 4 颗蓝边黑铁矿粒 + 「矿点」标签；挖空时 45% 透明）。位置 = 本层宽 45%，仅矿层 下标 27–33（废矿入口…山谷矿区·二）。
- 需求：矿点图 256×192 PNG 透明底（可挖 / 枯竭 两态），参考传奇比奇矿区矿壁；交付后挂 ASSETS key `mine_node` / `mine_node_empty` 替换代码绘制。
## 替换魔兽头像图标（art/replace-wow-heads，2026-10-31）

用 AI 生成重画 public/assets/portraits/ 下全部 13 个魔兽来源图标，卡通粗描边，同名覆盖，尺寸与原图一致：64x64 RGBA PNG，代码零改动。对比图：docs/wow-heads-preview/wow_heads_old_vs_new.jpg

| 文件（旧→新同名） | 尺寸 | 新内容 | 用途 |
|---|---|---|---|
| portraits/INV_Misc_Head_Human_01.png | 64x64 | 人类战士头像 | 主菜单 menu_0（assets-manifest.ts:46） |
| portraits/INV_Misc_Head_Scourge_01.png | 64x64 | 亡灵骷髅头（兜帽+鬼火） | 未引用 |
| portraits/INV_Misc_Head_Human_02.png | 64x64 | 女商人头像 | 商人 merchant（assets-manifest.ts:29） |
| portraits/INV_Misc_Bone_HumanSkull_01.png | 64x64 | 枯骨头骨 | 未引用 |
| portraits/INV_Misc_Head_Dragon_Black.png | 64x64 | 黑龙头 | 未引用 |
| portraits/INV_Misc_Head_Gnoll_01.png | 64x64 | 鬣狗兽人头像 | 未引用 |
| portraits/INV_Misc_Head_Kobold_01.png | 64x64 | 矿工鼠人（蜡烛盔） | 未引用 |
| portraits/INV_Misc_Head_Murloc_01.png | 64x64 | 鱼人头像 | 未引用 |
| portraits/INV_Misc_Head_Undead_01.png | 64x64 | 亡灵男子头像 | 未引用 |
| portraits/INV_Misc_Head_Undead_02.png | 64x64 | 亡灵女术士头像 | 未引用 |
| portraits/Ability_Hunter_Pet_Wolf.png | 64x64 | 灰狼头 | 未引用 |
| portraits/INV_Misc_MonsterHead_01.png | 64x64 | 独眼黄蜥怪头 | 未引用 |
| portraits/Ability_Druid_TravelForm.png | 64x64 | 风灵雄鹿 | 未引用 |

注：Scourge_01 原图其实是带血的人头，这里按要求画成了亡灵骷髅。

### 仓库里剩下的魔兽素材（只列出，本次没替换）

共 81 个：
- items：25 个
- potions：20 个
- skills：22 个
- ui：14 个

完整路径：

```
public/assets/items/INV_Chest_Plate01.png
public/assets/items/INV_Chest_Plate02.png
public/assets/items/INV_Chest_Plate03.png
public/assets/items/INV_Helmet_01.png
public/assets/items/INV_Helmet_02.png
public/assets/items/INV_Helmet_03.png
public/assets/items/INV_Helmet_04.png
public/assets/items/INV_Helmet_05.png
public/assets/items/INV_Jewelry_Ring_01.png
public/assets/items/INV_Jewelry_Ring_02.png
public/assets/items/INV_Jewelry_Ring_03.png
public/assets/items/INV_Jewelry_Ring_04.png
public/assets/items/INV_Jewelry_Ring_05.png
public/assets/items/INV_Misc_Bag_08.png
public/assets/items/INV_Misc_Bone_01.png
public/assets/items/INV_Misc_Book_09.png
public/assets/items/INV_Misc_Coin_01.png
public/assets/items/INV_Misc_Food_14.png
public/assets/items/INV_Misc_Food_15.png
public/assets/items/INV_Misc_Gem_Pearl_01.png
public/assets/items/INV_Sword_01.png
public/assets/items/INV_Sword_02.png
public/assets/items/INV_Sword_03.png
public/assets/items/INV_Sword_04.png
public/assets/items/INV_Sword_05.png
public/assets/potions/INV_Potion_50.png
public/assets/potions/INV_Potion_51.png
public/assets/potions/INV_Potion_52.png
public/assets/potions/INV_Potion_53.png
public/assets/potions/INV_Potion_54.png
public/assets/potions/INV_Potion_55.png
public/assets/potions/INV_Potion_56.png
public/assets/potions/INV_Potion_57.png
public/assets/potions/INV_Potion_58.png
public/assets/potions/INV_Potion_59.png
public/assets/potions/INV_Potion_70.png
public/assets/potions/INV_Potion_71.png
public/assets/potions/INV_Potion_72.png
public/assets/potions/INV_Potion_73.png
public/assets/potions/INV_Potion_74.png
public/assets/potions/INV_Potion_75.png
public/assets/potions/INV_Potion_76.png
public/assets/potions/INV_Potion_77.png
public/assets/potions/INV_Potion_78.png
public/assets/potions/INV_Potion_79.png
public/assets/skills/Ability_Warrior_BattleShout.png
public/assets/skills/Ability_Warrior_Charge.png
public/assets/skills/Ability_Warrior_Cleave.png
public/assets/skills/Ability_Warrior_DefensiveStance.png
public/assets/skills/Ability_Warrior_Revenge.png
public/assets/skills/Ability_Warrior_SavageBlow.png
public/assets/skills/Ability_Warrior_ShieldWall.png
public/assets/skills/Ability_Warrior_Sunder.png
public/assets/skills/Ability_Warrior_WarCry.png
public/assets/skills/Ability_Whirlwind.png
public/assets/skills/Spell_Fire_Fireball.png
public/assets/skills/Spell_Fire_FlameBolt.png
public/assets/skills/Spell_Frost_FrostNova.png
public/assets/skills/Spell_Holy_FlashHeal.png
public/assets/skills/Spell_Holy_Heal.png
public/assets/skills/Spell_Holy_HolyBolt.png
public/assets/skills/Spell_Holy_Renew.png
public/assets/skills/Spell_Nature_Lightning.png
public/assets/skills/Spell_Nature_ThunderClap.png
public/assets/skills/Spell_Shadow_AnimateDead.png
public/assets/skills/Spell_Shadow_RaiseDead.png
public/assets/skills/Spell_Shadow_ShadowBolt.png
public/assets/ui/LoadScreenCave.png
public/assets/ui/UI-Backpack-EmptySlot.png
public/assets/ui/UI-DialogBox-Background.png
public/assets/ui/UI-DialogBox-Border-9slice.png
public/assets/ui/UI-DialogBox-Border.png
public/assets/ui/UI-DialogBox-Gold-Border-9slice.png
public/assets/ui/UI-DialogBox-Gold-Border.png
public/assets/ui/UI-DialogBox-Header.png
public/assets/ui/UI-EmptySlot.png
public/assets/ui/UI-Panel-Button-Up.png
public/assets/ui/UI-Quickslot2.png
public/assets/ui/UI-Tooltip-Background.png
public/assets/ui/UI-Tooltip-Border-9slice.png
public/assets/ui/UI-Tooltip-Border.png
```

另外 src/assets-manifest.ts 第 2 行还留着魔兽来源的版权注释，以后全部替换完再删。音效有没有魔兽来源：未查到/推测，本次没核查。
## 新手地图传奇原有怪物立绘（art/novice-monsters，2026-10-31）

先对照 src/data/units.ts 和 docs/monsters-official.md：鹿（deer）、僵尸（zombie）、半兽人（orc）已经有立绘，这次跳过。下面 6 只是新画的，每只单独一张，没有复用已有图。都是透明底 PNG，最长边 960，卡通半身、粗描边，放在 public/assets/portraits/。数值和刷新地点来自 21cq（1.76 版资料站）。外观是 21cq 上查不到的，按名字自己设计，标「推测」。

| id | 中文名 | 来源 | 原版等级/HP/攻击/经验 | 原版刷新 | 建议层位 | 文件 | 尺寸 | 外观 |
|---|---|---|---|---|---|---|---|---|
| hen | 鸡 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=14) | 5 / 5 / 1-1 / 5 | 比奇省 | 第1层 幽暗森林（和鹿同档） | hen_full.png | 883x960 | 推测 |
| scarecrow | 稻草人 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=21) | 10 / 15 / 1-2 / 12，不死系 | 比奇省 | 第1层 | scarecrow_full.png | 960x955 | 推测 |
| hook_cat | 多钩猫 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=24) | 13 / 22 / 2-4 / 17 | 比奇省 | 第1层 | hook_cat_full.png | 960x940 | 推测 |
| rake_cat | 钉耙猫 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=26) | 13 / 23 / 2-4 / 18 | 比奇省 | 第1层 | rake_cat_full.png | 900x960 | 推测 |
| forest_yeti | 森林雪人 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=28) | 16 / 36 / 7-10 / 30 | 比奇省 | 第1层末到第2层 | forest_yeti_full.png | 925x960 | 推测 |
| man_eater_flower | 食人花 | [21cq](https://www.21cq.com/mir/Mob.Aspx?ID=30) | 20 / 28 / 6-9 / 28 | 比奇省 | 第2层 | man_eater_flower_full.png | 928x960 | 推测 |

- 羊：21cq 怪物 ID 1–40 里没有，未查到，所以没画。
- 本作数值曲线和原版不同，表里的"建议层位"是推测；这次只加了立绘，units.ts 没改。
- 预览拼图：docs/art-gap-preview/novice_monsters.jpg

## 传送门（替换地图「回城小房子」入口，art/portal，2026-10-31）

AI 生成的 Legend of Mir 风格的蓝紫发光椭圆光圈漩涡，没有用 WoW 素材。先在纯黑底上生成一张基础图，再按亮度换算透明度（发光边缘自然淡出，不会留下抠底色边），漩涡内部保留约 85% 不透明。4 帧由脚本 docs/art-gap-preview/portal_gen.py 生成：内部漩涡转 0°/+6°/0°/-6°，整体缩放 0.97→1.0、亮度 1.0→1.13 脉动，首尾衔接可循环，外圈位置不动、不抖。

| 文件 | 尺寸 | 帧数 | 说明 |
|---|---|---|---|
| public/assets/portal_exit.png | 256x384，透明底 | 1 | 静态图（第 1 帧） |
| public/assets/portal_exit_sheet.png | 1024x384，透明底 | 4，横向排列，每帧 256x384 | 循环动画精灵表 |

- 帧率建议 8fps，循环播放。
- 锚点建议底部中心 (0.5, 1)。光圈下沿离底边约 4px，需要贴地时可以把 y 往下偏一点。
- 用途：替换地图里的回城/出口入口「小房子」。只加了素材，src 没改，接入要另外改代码。
- **状态：已满足、已接入（feat/balance-sys 任务B）**：`assets-manifest` 注册 `portal_exit` / `portal_exit_sheet`（SHEETS 256×384 切 4 帧），BattleScene 每层最左端播 `portal_exit_loop` 8fps 循环、origin (0.5,1)、显示 150×225（约主角 1.6 倍高）；贴图缺失时退回程序绘制椭圆。文案「传送门：返回 XXX」，第 1 层返回小村。测试 tests/back-portal.test.ts。
- 预览：docs/art-gap-preview/portal_preview.jpg（上排深色底，下排棋盘格底，用来检查边缘）

## L. 大城街景（docs/towns-plan.md，2026-10-31，待美术）

规格同 K 章：横版长街 5760×1080 每 3 屏，游戏内按 2/3 缩到 720 高；门面可单独出图，3:4 透明 PNG。NPC 立绘同现有 npc_* 规格。

| 优先级 | 城 | 街景 | 门面 | NPC 立绘 |
|---|---|---|---|---|
| P1 | 盟重土城 | `bg_town_mengzhong` 7680×1080（4 屏），土城黄土墙、东端沙巴克城门远景 | 武器/铁匠铺、药店、书店、仓库(王家)、服装、首饰、杂货(罗家铺子)、客栈、肉店、炼金师 | 盟重老兵、书店老板、药店老板、武器店老板、仓库保管员 |
| P2 | 白日门 | `bg_town_bairimen` 5760×1080（3 屏） | 武器、药店、仓库、首饰、服装、神秘书商、神秘铁匠 | 向导、神秘书商、神秘铁匠（龙人已有） |
| P3 | 封魔谷据点 | `bg_town_fengmo` 3840×1080（2 屏） | 通用 basic 门面换色 | 老兵（可复用比奇老兵换色） |
| P3 | 苍月岛 | `bg_town_cangyue` 3840×1080（2 屏），码头 | 通用 basic 门面换色 | — |

- 城门 / 西端出口要留传送门位置（portal_exit 可复用）。
- 每个门面上方留招牌区，文字由程序写。

## W 世界大地图（docs/world-map-plan.md，WoW 式两级地图）
全部为新图，未有现成素材；风格与现有立绘一致（暗金传奇风，俯视手绘地图）。
| 文件 | 尺寸 | 说明 |
|---|---|---|
| world_map_{0..3}_{0..1}.jpg | 1024×1152 ×8 块（拼 4096×2304） | 连续大陆底图，分块（推荐）；或整图 world_map.jpg 4096×2304 |
| world_region_{bichi,woma,dushe,zuma,cangyue,fengmo,chiyue,hejiban}.jpg | 2048×1152 | 区域放大插画（每区 1 张，节点摆在其上） |
| world_fog.png | 512×512 可平铺，带透明 | 迷雾覆盖 |
| icon_wm_town.png / icon_wm_cave.png / icon_wm_dungeon.png / icon_wm_boss.png / icon_wm_portal.png / icon_wm_rift.png / icon_wm_player.png / icon_wm_locked.png | 128×128 透明 | 城、洞穴、副本、BOSS、传送点、异界裂隙、玩家标记、未探索 |
| wm_frame.png | 9-slice 96×96 | 面板/确认卡边框 |
摆位坐标表格式（美术交付时一并回填）：
| 区域 id | 底图多边形（4096×2304 像素，顺时针） | 标签锚点 | 区域主色 | 插画内节点 node id | 节点 x,y（2048×1152 像素） |
|---|---|---|---|---|---|
| bichi | (x1,y1) (x2,y2) … | (x,y) | #c8a050 | bichi_town | (x,y) |
大陆相对位置（适配）：比奇西南、沃玛其北、毒蛇其东、盟重最东荒漠、白日门西北雪山、封魔东北峡谷、苍月东海外岛、合击/魔龙盟重以北。
## L-P1. 盟重土城街景（art/towns 分支交付）

规格来源：feat/balance-sys 分支 docs/art-requests.md 第 L 章，以及 docs/towns-plan.md 的盟重排序。所有素材都是AI 生成，没有用、也没有描摹任何 WoW 或传奇原作素材。画风对齐 art/town 分支的比奇街道。

### 文件

| 文件 | 尺寸 | 用途 |
|---|---|---|
| public/assets/town/bg_town_mengzhong.jpg | 7680×1080（4 屏）| 盟重长街背景：沙黄土街，下部地面留空；西端是城门，留出传送门位置；东端远处是沙巴克城门 |
| public/assets/town/shop_mz_weapon.png | 540×720 透明 | 武器店/铁匠 |
| public/assets/town/shop_mz_pharmacy.png | 540×720 透明 | 药店 |
| public/assets/town/shop_mz_book.png | 540×720 透明 | 书店 |
| public/assets/town/shop_mz_storage.png | 540×720 透明 | 仓库（王家） |
| public/assets/town/shop_mz_clothes.png | 540×720 透明 | 服装店 |
| public/assets/town/shop_mz_jewelry.png | 540×720 透明 | 首饰店 |
| public/assets/town/shop_mz_grocer.png | 540×720 透明 | 杂货（罗家铺子） |
| public/assets/town/shop_mz_inn.png | 540×720 透明 | 客栈（悦来客栈） |
| public/assets/town/shop_mz_butcher.png | 540×720 透明 | 肉店（黄家肉店） |
| public/assets/town/shop_mz_alchemist.png | 540×720 透明 | 炼金师（外观为推测） |
| public/assets/town/npc_mz_veteran.png | 768×960 透明 | 盟重老兵 |
| public/assets/town/npc_mz_book.png | 768×960 透明 | 书店老板 |
| public/assets/town/npc_mz_pharmacy.png | 768×960 透明 | 药店老板 |
| public/assets/town/npc_mz_weapon.png | 768×960 透明 | 武器店老板 |
| public/assets/town/npc_mz_storage.png | 768×960 透明 | 仓库保管员 |
| docs/town-preview/mengzhong_preview.jpg | 3840×540 | 摆位预览（半尺寸，白线是屏分隔） |

说明：
- 门面按第 L 章做成 3:4（540×720）。这和第 K 章比奇门面的 640×720 不一致，如果需要统一，可以在加载时缩放，或者让美术重新留边。
- 门面底边贴画布底，水平居中。门头上方都有空白木招牌，店名由游戏绘制，图上没有任何文字。
- 文件名 shop_mz_* / npc_mz_* 是本分支自己定的（第 L 章没有给出具体文件名），id 可以按代码需要再改。
- NPC 外观在资料里未查到，均为推测。炼金师的原版坐标也未查到。

### 摆位表（背景坐标，x 为中心点）

门面底边 y=760（和比奇台阶线一致），origin (0.5, 1)。NPC 脚底 y=1040，origin (0.5, 1)，预览里按 0.35 倍显示（约 269×336）。

| 屏 | x 范围 | 内容 | x 中心 |
|---|---|---|---|
| 1 | 0–1920 | 城门 / 传送门位 | 约 300（背景自带城门）|
| 1 | | npc_mz_veteran | 520 |
| 1 | | shop_mz_grocer | 1000 |
| 1 | | shop_mz_storage + npc_mz_storage | 1650 / 1880 |
| 2 | 1920–3840 | shop_mz_inn | 2250 |
| 2 | | shop_mz_weapon + npc_mz_weapon | 2950 / 3200 |
| 2 | | shop_mz_clothes | 3550 |
| 3 | 3840–5760 | shop_mz_jewelry | 4150 |
| 3 | | shop_mz_alchemist | 4850 |
| 3 | | shop_mz_butcher | 5450 |
| 4 | 5760–7680 | shop_mz_pharmacy + npc_mz_pharmacy | 6050 / 6290 |
| 4 | | shop_mz_book + npc_mz_book | 6700 / 6940 |
| 4 | | 远景沙巴克城门（背景自带） | 约 7300 |

顺序依据 towns-plan（由西向东）：城门·老兵 → 杂货 → 仓库·客栈 → 武器·服装·首饰 → 炼金·肉店·药店 → 书店。每屏最多 3 间店。屏 1 的仓库中心在 1650，右半跨到 1920 附近，接入时可按需微调。

## L-P2. 白日门街景（art/towns 分支交付）

规格来源：feat/balance-sys 分支 docs/art-requests.md 第 L 章（P2 行），排序依据 towns-plan（标了 [适配]）。素材全部AI 生成，没有用、也没有描摹任何 WoW 或传奇原作素材，图里也没有文字。白日门的建筑外观在资料里未查到，做成了山谷边寨风格（灰石墙、深色木构、坡顶瓦），属于推测。门面画风和盟重、比奇一致，只是建筑形制不同。

### 文件

| 文件 | 尺寸 | 用途 |
|---|---|---|
| public/assets/town/bg_town_bairimen.jpg | 5760×1080（3 屏）| 白日门长街：西端城门（传送门位），中段石墙木栅加松林群山，东端远景是山崖上的龙形古祠（给龙人做背景呼应）|
| public/assets/town/shop_brm_weapon.png | 540×720 透明 | 武器店 |
| public/assets/town/shop_brm_pharmacy.png | 540×720 透明 | 药店 |
| public/assets/town/shop_brm_storage.png | 540×720 透明 | 仓库 |
| public/assets/town/shop_brm_jewelry.png | 540×720 透明 | 首饰店 |
| public/assets/town/shop_brm_clothes.png | 540×720 透明 | 服装店 |
| public/assets/town/shop_brm_mystic_book.png | 540×720 透明 | 神秘书商（外观推测）|
| public/assets/town/shop_brm_mystic_smith.png | 540×720 透明 | 神秘铁匠（外观推测）|
| public/assets/town/npc_brm_guide.png | 768×960 透明 | 向导（外观推测）|
| public/assets/town/npc_brm_mystic_book.png | 768×960 透明 | 神秘书商（外观推测）|
| public/assets/town/npc_brm_mystic_smith.png | 768×960 透明 | 神秘铁匠（外观推测）|
| public/assets/town/npc_brm_dragon.png | 768×960 透明 | 龙人 brm_dragon（外观推测）|
| docs/town-preview/bairimen_preview.jpg | 2880×540 | 摆位预览（半尺寸；白线是屏分隔，龙人已画在 x=5300）|

说明：
- 门面同 L-P1，采用 3:4（540×720），底边贴画布底，水平居中，门头上方有空白木招牌，店名由游戏绘制。
- 文件名 shop_brm_* / npc_brm_* 是本分支自定的，第 L 章没有给出具体文件名。
- 龙人：brm_dragon 原来只是 src/data/towns.ts 里的 NPC id，没有对应的图。现已出图：public/assets/town/npc_brm_dragon.png（768×960 透明，与 npc_brm_* 同风格；龙首人身、红金长袍、持珠杖，外观推测）。预览中已放在 x=5300。

### 摆位表（背景坐标，x 为中心点）

门面底边 y=760，NPC 脚底 y=1040，origin 都是 (0.5, 1)。NPC 在预览里按 0.35 倍显示。

| 屏 | x 范围 | 内容 | x 中心 |
|---|---|---|---|
| 1 | 0–1920 | 城门 / 传送门位（背景自带）| 约 560 |
| 1 | | npc_brm_guide | 820 |
| 1 | | shop_brm_mystic_book + npc_brm_mystic_book | 1150 / 1400 |
| 1 | | shop_brm_weapon | 1750 |
| 2 | 1920–3840 | shop_brm_storage | 2350 |
| 2 | | shop_brm_pharmacy | 2950 |
| 2 | | shop_brm_jewelry | 3550 |
| 3 | 3840–5760 | shop_brm_clothes | 4150 |
| 3 | | shop_brm_mystic_smith + npc_brm_mystic_smith | 4800 / 5050 |
| 3 | | npc_brm_dragon（龙人）| 5300 |
| 3 | | 远景龙形古祠（背景自带）| 约 5400 |

顺序依据 towns-plan：城门·向导 → 神秘书商·武器 → 仓库·药店 → 首饰·服装 → 神秘铁匠·龙人。原计划是两两一组，这里按 3 屏重新分配，每屏最多 3 间店。

## L-P3. 封魔谷 / 苍月岛街景：通用换色方案（art/towns 分支交付）

两座城都是 2 屏（3840×1080），门面都是 basic 通用门面换色（见 src/data/towns.ts 的 basic('fm') / basic('cy')）。做法：先画一套**低饱和、偏灰白的中性底图和门面**，再按城换色。

### 换色方式

- 原理：乘色（multiply）。Phaser 的 `setTint(0xRRGGBB)` 本身就是乘色，所以底图必须是浅色、中性的，换色才明显；深色或高饱和的部分基本不变色。
- 方案 A（运行时）：直接用 shop_basic_* 和 bg_town_basic_*，代码里 `sprite.setTint(色值)`。CSS 也可以用 `mix-blend-mode: multiply` 叠一层纯色做到同样的效果。
- 方案 B（预出色版，已交付）：脚本把原图和乘色结果按比例混合，生成 shop_fm_* / shop_cy_* 和 bg_town_fengmo / bg_town_cangyue。直接加载就行，不用写 tint 代码。

| 用途 | 色值 | 混合比例（方案 B） |
|---|---|---|
| 封魔谷底图（冷蓝紫） | #8C90D0 | 0.85 |
| 封魔谷门面 | #C0C0EC | 0.90 |
| 封魔谷老兵 | #B4B8F0 | 0.80 |
| 苍月岛底图（海青） | #80C8C0 | 0.85 |
| 苍月岛门面 | #B8E4DC | 0.90 |

方案 A 用 Phaser 时，对应的色值直接写成 0x8C90D0 这种形式即可。setTint 是 100% 乘色，会比方案 B 暗一点，可以把色值调亮一些。

### 文件（public/assets/town/）

| 文件 | 尺寸 | 说明 |
|---|---|---|
| bg_town_basic_gate.jpg | 3840×1080 | 中性底图：城门（左 1/3，留传送门/出口位）+ 城墙、望楼 |
| bg_town_basic_dock.jpg | 3840×1080 | 中性底图：码头、帆船（左 1/3，当作苍月岛「城门」）+ 城墙 |
| bg_town_fengmo.jpg | 3840×1080 | 封魔谷色版（gate 底图换色） |
| bg_town_cangyue.jpg | 3840×1080 | 苍月岛色版（dock 底图换色） |
| shop_basic_{potion,weapon,storage,general,clothes,jewelry,book}.png | 540×720 透明 | 中性通用门面；招牌板留空，可以叠字 |
| shop_fm_{potion,weapon,storage,general}.png | 540×720 透明 | 封魔谷色版 |
| shop_cy_{weapon,general,storage,clothes,potion,jewelry,book}.png | 540×720 透明 | 苍月岛色版 |
| npc_fm_veteran.png | 768×960 透明 | 封魔谷老兵，用比奇 npc_veteran.png 换色复用 |
| docs/town-preview/fengmo_preview.jpg、cangyue_preview.jpg | 1920×540 | 摆位预览（半尺寸，白线是屏分隔） |

门面 id 和 towns.ts 的对应关系：potion→_potion（药店），general→_general（杂货铺），storage→_storage（仓库）。传送员 _tele 没有单独做门面，沿用比奇的 shop_teleporter.png，或者用城门处的传送门（推测，可按需要再补）。

### 位置表（x 为中心点，单位像素，原点在左边）

门面 origin (0.5,1)，底边 y=760；NPC origin (0.5,1)，脚底 y=1040，预览里缩到 269×336。

封魔谷（bg_town_fengmo，门面 1.0 倍）：

| 元素 | x |
|---|---|
| 城门（传送门位） | 约 300–760 |
| npc_fm_veteran（老兵） | 900 |
| shop_fm_potion | 1400 |
| shop_fm_weapon | 2000 |
| shop_fm_storage | 2650 |
| shop_fm_general | 3250 |

苍月岛（bg_town_cangyue，门面缩到 0.85 倍，也就是 459×612，7 家才放得下）：

| 元素 | x |
|---|---|
| 码头（城门 / 传送门位） | 约 0–560 |
| shop_cy_weapon | 860 |
| shop_cy_general | 1310 |
| shop_cy_storage | 1760 |
| shop_cy_clothes | 2210 |
| shop_cy_potion | 2660 |
| shop_cy_jewelry | 3110 |
| shop_cy_book | 3560 |

### 注意

- 两城的官方外观和坐标都**未查到**。配色（封魔谷冷蓝紫、苍月岛海青）是**推测**。商店顺序按 docs/towns-plan.md 排（苍月岛的顺序标的是 [适配]）。
- 苍月岛只有 basic 店铺（药/杂/仓）有数据。武器、服装、首饰、书店是按 towns-plan 预先出的，代码里没有的话可以不用。
- 苍月岛没有 NPC。封魔谷的老兵是比奇老兵换色，其余 NPC 未查到。
- 全部是AI 生成，没有文字；招牌板是空白的。
## L. 大城街景（docs/towns-plan.md，2026-10-31，待美术）

规格同 K 章：横版长街 5760×1080 每 3 屏，游戏内按 2/3 缩到 720 高；门面可单独出图，3:4 透明 PNG。NPC 立绘同现有 npc_* 规格。

| 优先级 | 城 | 街景 | 门面 | NPC 立绘 |
|---|---|---|---|---|
| P1 | 盟重土城 | `bg_town_mengzhong` 7680×1080（4 屏），土城黄土墙、东端沙巴克城门远景 | 武器/铁匠铺、药店、书店、仓库(王家)、服装、首饰、杂货(罗家铺子)、客栈、肉店、炼金师 | 盟重老兵、书店老板、药店老板、武器店老板、仓库保管员 |
| P2 | 白日门 | `bg_town_bairimen` 5760×1080（3 屏） | 武器、药店、仓库、首饰、服装、神秘书商、神秘铁匠 | 向导、神秘书商、神秘铁匠（龙人已有） |
| P3 | 封魔谷据点 | `bg_town_fengmo` 3840×1080（2 屏） | 通用 basic 门面换色 | 老兵（可复用比奇老兵换色） |
| P3 | 苍月岛 | `bg_town_cangyue` 3840×1080（2 屏），码头 | 通用 basic 门面换色 | — |

- 城门 / 西端出口要留传送门位置（portal_exit 可复用）。
- 每个门面上方留招牌区，文字由程序写。

## W 世界大地图（docs/world-map-plan.md，WoW 式两级地图）
全部为新图，未有现成素材；风格与现有立绘一致（暗金传奇风，俯视手绘地图）。
| 文件 | 尺寸 | 说明 |
|---|---|---|
| world_map_{0..3}_{0..1}.jpg | 1024×1152 ×8 块（拼 4096×2304） | 连续大陆底图，分块（推荐）；或整图 world_map.jpg 4096×2304 |
| world_region_{bichi,woma,dushe,zuma,cangyue,fengmo,chiyue,hejiban}.jpg | 2048×1152 | 区域放大插画（每区 1 张，节点摆在其上） |
| world_fog.png | 512×512 可平铺，带透明 | 迷雾覆盖 |
| icon_wm_town.png / icon_wm_cave.png / icon_wm_dungeon.png / icon_wm_boss.png / icon_wm_portal.png / icon_wm_rift.png / icon_wm_player.png / icon_wm_locked.png | 128×128 透明 | 城、洞穴、副本、BOSS、传送点、异界裂隙、玩家标记、未探索 |
| wm_frame.png | 9-slice 96×96 | 面板/确认卡边框 |
摆位坐标表格式（美术交付时一并回填）：
| 区域 id | 底图多边形（4096×2304 像素，顺时针） | 标签锚点 | 区域主色 | 插画内节点 node id | 节点 x,y（2048×1152 像素） |
|---|---|---|---|---|---|
| bichi | (x1,y1) (x2,y2) … | (x,y) | #c8a050 | bichi_town | (x,y) |
大陆相对位置（适配）：比奇西南、沃玛其北、毒蛇其东、盟重最东荒漠、白日门西北雪山、封魔东北峡谷、苍月东海外岛、合击/魔龙盟重以北。

## W-1. 世界大地图：大陆底图 4×2 分块（art/world-map 分支交付，第一批）

先生成一张完整总图，再切成 8 块，所以接缝处的像素完全连续（预览里的白线只是分块示意）。风格是手绘羊皮纸奇幻大陆，AI 生成，不用 WoW 素材，图上没有任何文字，区域名称由游戏叠加。

| 文件 | 尺寸 | 用途 |
|---|---|---|
| public/assets/worldmap/world_map_{0..3}_{0..1}.jpg | 1024×1152 ×8（单块约 240KB，共约 1.9MB） | 大陆底图分块。文件名为 `world_map_{列}_{行}`，第 c 列第 r 行的块放在 (c*1024, r*1152)，拼起来是 4096×2304 |
| docs/world-map-preview/world_map_full_preview.jpg | 2048×1152 | 把 8 块拼回去的半尺寸预览 |
| docs/world-map-preview/world_map_tiles_preview.jpg | 2048×1152 | 同上，白线标出分块边界 |

- 分辨率：交付的是 1x 逻辑尺寸。母图是 1280×720 的AI 生成图，放大 3.2 倍后做了锐化，再加一层轻微的纸纹颗粒，所以近看偏软。如果需要 2x（每块 2048×2304），需要另外重绘细节。我试过逐块 AI 重绘，但地形会漂移，接缝对不上，所以这一批没有采用。
- 地貌和区域对应关系是**推测/[适配]**（官方大陆地貌未查到），按 world-map-plan.md 的相对位置排布。

### 区域位置表（底图像素，4096×2304，多边形顺时针）

| 区域 id | 地貌 | 底图多边形 | 标签锚点 | 区域主色（建议） |
|---|---|---|---|---|
| bichi 比奇省 | 西南草原 + 城堡 | (240,1000) (1700,1000) (1750,2050) (260,1900) | (720,1300) | #c8a050 |
| woma 沃玛森林 | 比奇正北的大片针叶林 | (640,560) (1880,560) (1880,1240) (640,1240) | (1240,900) | #4f7a3a |
| dushe 毒蛇山谷 | 比奇以东的蛇形石谷 | (1720,880) (2280,880) (2200,2000) (1640,2000) | (1920,1480) | #8a7a5a |
| zuma 盟重省 | 东部荒漠 + 土城 | (2240,1000) (3400,1000) (3400,2050) (2200,2050) | (2880,1200) | #d8b060 |
| chiyue 白日门·赤月峡谷 | 西北雪山 | (440,100) (1840,100) (1840,560) (440,560) | (1120,320) | #c8d8e8 |
| fengmo 封魔谷 | 东北红岩峡谷 | (2600,420) (3560,420) (3560,1020) (2600,1020) | (3080,720) | #a04830 |
| hejiban 盟重·合击（魔龙） | 盟重以北的火山高地 | (2080,140) (2600,140) (2600,700) (2080,700) | (2480,420) | #c04020 |
| cangyue 苍月岛 | 东海外岛（海路连接，[适配]） | (3160,1360) (3900,1360) (3900,2100) (3160,2100) | (3520,1720) | #6aa8a0 |
| （异界浮岛） | 东北海角，紫雾上的浮空岩 | (3400,120) (3900,120) (3900,560) (3400,560) | (3620,320) | #8050c0 |

- 异界浮岛：W 章的 8 区列表里**没有「异界」区域**，异界裂隙层在文档里属于各自所在的区域，只挂一个 icon_wm_rift。这座浮岛只是预留的装饰位，可以用来放统一的裂隙入口，也可以不用。魔龙对应文档里的 hejiban（合击地图）。
- 城镇的大致位置：比奇城约 (720,1480)，盟重土城约 (2900,1330)。

## W-2. 世界大地图：8 张区域插画（art/world-map 分支交付，第二批）

区域 id 以 W 章为准。风格与大陆底图一致（同一张总图作参考生成：羊皮纸、手绘、俯视略带斜角），地貌和主色与 W-1 位置表对应。AI 生成，图上没有文字。

| 文件 | 尺寸 | 内容（地貌和建筑都是**推测**，官方区域外观未查到） |
|---|---|---|
| public/assets/worldmap/world_region_bichi.jpg | 2048×1152 | 西南草原和海岸，城堡城镇、村落，东侧是墓穴门、洞窟和废矿口 |
| world_region_woma.jpg | 2048×1152 | 针叶林，兽人要塞、紫晶蛛网洞、林中古寺、自然洞穴、溪流 |
| world_region_dushe.jpg | 2048×1152 | 蛇形石谷：左边草地、右边沙漠；矿口和矿车，崖壁上有墓门 |
| world_region_zuma.jpg | 2048×1152 | 荒漠绿洲土城，蜈蚣洞，几座石墓丘和半埋古塔 |
| world_region_cangyue.jpg | 2048×1152 | 海岛：码头小镇和帆船、牛首神庙、骨洞；左侧有一条海路虚线（适配） |
| world_region_fengmo.jpg | 2048×1152 | 红岩峡谷：崖顶据点营地、谷壁魔殿、古刹遗迹，左上角是冰石禁地之门 |
| world_region_chiyue.jpg | 2048×1152 | 雪山，白日门木石小镇和龙祠、丛林迷宫、赤红月形峡谷魔穴，崖上祭坛和古神殿 |
| world_region_hejiban.jpg | 2048×1152 | 火山高地：城堡山庄、熔岩火山、血湖火坑（魔龙）、被围攻的村寨 |
| docs/world-map-preview/world_regions_preview.jpg | 2048×576 | 8 张缩略拼图，从左上到右下依次是 bichi、woma、dushe、zuma、cangyue、fengmo、chiyue、hejiban |

### 插画内地标锚点（2048×1152 像素，供摆放节点参考，[适配]）

| 区域 | 地标 → 建议对应 | x,y |
|---|---|---|
| bichi | 城堡 → bichi 城镇 | (630,540) |
| bichi | 墓穴门 → 白骨墓穴 / 尸王殿 | (1320,200) |
| bichi | 洞窟 → 骷髅洞 / 兽人古墓 | (1720,370) |
| bichi | 矿口 → 废矿 / 矿区 | (1660,740) |
| woma | 要塞 → 兽人要塞 | (920,580) |
| woma | 蛛网晶洞 → 蛛网晶洞 | (1720,560) |
| woma | 古寺 → 沃玛寺庙 | (1260,170) |
| woma | 自然洞穴 | (310,900) |
| woma | 自然洞穴 | (1400,870) |
| dushe | 谷底 → 毒蛇山谷 | (1000,600) |
| dushe | 矿口 → 山谷矿区 | (680,560) |
| dushe | 墓门 → 将军坟（裂隙） | (1280,300) |
| dushe | 墓门 → 将军坟（裂隙） | (1400,580) |
| zuma | 土城 → 盟重土城 | (1060,600) |
| zuma | 蜈蚣洞 | (1420,220) |
| zuma | 石墓丘 → 石墓 | (550,350) |
| zuma | 石墓丘 → 石墓 | (1320,960) |
| zuma | 古塔 → 祖玛阁 | (250,550) |
| zuma | 古塔 → 香石墓穴 | (1640,800) |
| cangyue | 码头 → 码头 / 城镇 | (680,760) |
| cangyue | 牛首神庙 → 牛魔寺庙 | (1100,250) |
| cangyue | 骨洞 → 骨魔洞 | (1410,580) |
| fengmo | 营地 → 封魔谷据点 | (1340,200) |
| fengmo | 谷壁魔殿 → 封魔殿 | (1270,560) |
| fengmo | 古刹 → 逆魔古刹 | (860,760) |
| fengmo | 冰门 → 禁地 | (400,200) |
| chiyue | 小镇 → 白日门 | (500,420) |
| chiyue | 迷宫 → 丛林迷宫 | (640,800) |
| chiyue | 红月峡谷 → 赤月魔穴 | (1440,720) |
| chiyue | 崖上祭坛 → 恶魔祭坛 | (1420,180) |
| chiyue | 神殿 → 潘夜神殿 | (1720,110) |
| chiyue | 雪原 → 雪域 | (1050,330) |
| hejiban | 城堡 → 卧龙山庄 | (860,500) |
| hejiban | 火山口 → 雷炎洞穴 / 火龙神殿 | (1030,130) |
| hejiban | 血湖 → 魔龙血域 | (1540,640) |
| hejiban | 村寨 → 保卫家园 | (1200,900) |

- 节点 id 要等代码里的 NodeGeo 确定后再回填，上表只给地标位置。多层地图群建议收拢成一个节点，放在对应地标上。
- hejiban 村寨里有一面小旗，旗面上没有字。

## W-3. 世界大地图：节点图标、迷雾、边框（art/world-map 分支交付，第三批）

| 文件 | 尺寸 | 用途 |
|---|---|---|
| public/assets/worldmap/icon_wm_town.png | 128×128 透明 | 城镇（城堡徽章） |
| icon_wm_cave.png | 128×128 透明 | 洞穴 |
| icon_wm_dungeon.png | 128×128 透明 | 副本（铁闸石门） |
| icon_wm_boss.png | 128×128 透明 | BOSS（角骷髅）。已击杀可以用 setTint(0x666666) 或去色处理来灰化 |
| icon_wm_portal.png | 128×128 透明 | 传送点（蓝色漩涡）。区域出口也用它 |
| icon_wm_rift.png | 128×128 透明 | 异界裂隙（紫色裂缝） |
| icon_wm_player.png | 128×128 透明 | 当前位置（金色头盔标记），脉冲效果由代码实现 |
| icon_wm_locked.png | 128×128 透明 | 未探索（锁） |
| world_fog.png | 512×512 RGBA，四边无缝可平铺 | 迷雾覆盖。灰白雾色，alpha 约 0.40–0.95，带云状起伏 |
| wm_frame.png | 96×96 RGBA | 九宫格面板/确认卡边框，切片边距 24px（四角各 24×24），中间是深褐半透明底 |
| docs/world-map-preview/world_icons_fog_frame_preview.jpg | 1408×560 | 预览：图标原尺寸和 64px 缩小版、迷雾叠在底图上的效果、九宫格拉伸到 600×220 的效果 |

- 图标 128×128 是文档规定的尺寸，同时可以当作 64×64 的 @2x 使用（缩小后的效果见预览第二行）。文档没有单独的「出口」图标，用 portal 代替。
- 迷雾用周期噪声程序化生成，平铺时没有接缝。Phaser 里可以用 TileSprite 铺满再用区域多边形做遮罩，也可以整张铺满后在已探索区域挖洞。要更透的话调 alpha 就行。
- 边框是从一张 1024 的生成图缩到 96 的，角花缩小后细节较少。原图两侧边中点的菱形装饰已经抹掉，避免九宫格拉伸后变形。
- 全部 AI 生成，没有文字。传送点图标特意用了素面金环，没有符文。

## W 状态（feat/world-map 接入，2026-11-01）
- 三批真图已接入游戏（assets-manifest WM_ASSETS，按需加载）；节点坐标按 W-1/W-2/W-3 锚点回填。
- 无锚点、手工放置 [适配] 的节点：bichi_xinshou、bichi_newbie、rift_58、sq_jiguan 群、bichi_to_woma、bichi_to_dushe、sq_snake 群、rift_66、rift_67、hj_town；其余未列锚点的节点按旧 0–1 比例换算（[适配]）。
- 东北角紫雾浮岛仅装饰；出口用 icon_wm_portal；无需新增美术。

## E3 30–50 级装备图标（docs/equip-3050-plan.md，方案阶段，未接入）
- 规格同现有物品图标：assets/items/eq_<id>.png，透明底，与 eq_shengzhan_helm 等同尺寸同风格；名称用官方原名，图上不要文字。
- 武器 9：怒斩、龙牙、逍遥扇（折扇）、嗜魂法杖、命运之刃、霸者之刃、开天（巨剑）、镇天、玄天
- 衣服 7：天魔神甲、法神披风、天尊道袍、雷霆战甲、烈焰魔衣、光芒道袍、凤天魔甲（男女是否分款，待 E3 决定）
- 头盔 3：圣龙盔、魔龙盔、天龙盔
- 首饰/靴 21：雷霆 项链/护腕/战戒/战靴，烈焰 项链/护腕/魔戒/魔靴，光芒 项链/护腕/道戒/道靴，战神 项链/手镯/戒指，圣魔 项链/手镯/戒指，真魂 项链/手镯/戒指
- 纸娃娃层：9 把武器 + 7 件衣服 + 3 顶头盔，按 equipLayers 规格分三职业。
## E4. 40–50 级装备图标（art/equip-40-50 分支交付）

清单依据 origin/feat/equip-3050 的 docs/art-requests.md 第 E3 章和 equip-3050-plan.md §3（共 40 个 id）。规格跟现有物品图标一致：public/assets/items/eq_<id>.png 64×64 透明，另有 eq_<id>@2x.png 128×128 透明。

| id | 中文名 | 部位 | 文件 | 尺寸 | 对应原作装备 | 外观 | 是否推测 |
|---|---|---|---|---|---|---|---|
| nuzhan | 怒斩 | 武器 | eq_nuzhan.png / eq_nuzhan@2x.png | 64×64 / 128×128 透明 | 热血传奇「怒斩」 | 血红锯齿宽刃大剑，金龙护手 | 推测 |
| longya | 龙牙 | 武器 | eq_longya.png / eq_longya@2x.png | 64×64 / 128×128 透明 | 热血传奇「龙牙」 | 象牙色弯月龙牙刃，翡翠金柄，蓝色灵光 | 推测 |
| xiaoyao_fan | 逍遥扇 | 武器 | eq_xiaoyao_fan.png / eq_xiaoyao_fan@2x.png | 64×64 / 128×128 透明 | 热血传奇「逍遥扇」 | 金骨白蓝绢折扇，翡翠坠白穗 | 推测 |
| shihun_staff | 嗜魂法杖 | 武器 | eq_shihun_staff.png / eq_shihun_staff@2x.png | 64×64 / 128×128 透明 | 热血传奇「嗜魂法杖」 | 黑木扭杖，骨爪托紫色魂晶 | 推测 |
| mingyun_blade | 命运之刃 | 武器 | eq_mingyun_blade.png / eq_mingyun_blade@2x.png | 64×64 / 128×128 透明 | 热血传奇「命运之刃」 | 银白直长剑，星蓝宝石剑首 | 推测 |
| bazhe_blade | 霸者之刃 | 武器 | eq_bazhe_blade.png / eq_bazhe_blade@2x.png | 64×64 / 128×128 透明 | 热血传奇「霸者之刃」 | 黑金宽弯刀，金虎头护手，红柄 | 推测 |
| kaitian | 开天 | 武器 | eq_kaitian.png / eq_kaitian@2x.png | 64×64 / 128×128 透明 | 热血传奇「开天」 | 巨型双手大刀，熔金裂纹橙光 | 推测 |
| zhentian | 镇天 | 武器 | eq_zhentian.png / eq_zhentian@2x.png | 64×64 / 128×128 透明 | 热血传奇「镇天」 | 银杖顶新月环托蓝色法球 | 推测 |
| xuantian | 玄天 | 武器 | eq_xuantian.png / eq_xuantian@2x.png | 64×64 / 128×128 透明 | 热血传奇「玄天」 | 青色云纹剑身，白玉云形护手，黑白穗 | 推测 |
| tianmo_armor | 天魔神甲 | 衣服 | eq_tianmo_armor.png / eq_tianmo_armor@2x.png | 64×64 / 128×128 透明 | 热血传奇「天魔神甲」 | 黑钢金边重甲，骷髅角肩，胸嵌红宝石 | 推测 |
| fashen_cape | 法神披风 | 衣服 | eq_fashen_cape.png / eq_fashen_cape@2x.png | 64×64 / 128×128 透明 | 热血传奇「法神披风」 | 深蓝丝绒金绣披风，绿宝石扣 | 推测 |
| tianzun_robe | 天尊道袍 | 衣服 | eq_tianzun_robe.png / eq_tianzun_robe@2x.png | 64×64 / 128×128 透明 | 热血传奇「天尊道袍」 | 白金宽袖道袍，绿腰带，金鹤纹 | 推测 |
| leiting_armor | 雷霆战甲 | 衣服 | eq_leiting_armor.png / eq_leiting_armor@2x.png | 64×64 / 128×128 透明 | 热血传奇「雷霆战甲」 | 银蓝雷纹板甲，翼肩，蓝色电弧 | 推测 |
| lieyan_robe | 烈焰魔衣 | 衣服 | eq_lieyan_robe.png / eq_lieyan_robe@2x.png | 64×64 / 128×128 透明 | 热血传奇「烈焰魔衣」 | 橙金火焰长袍，火焰缭绕 | 推测 |
| guangmang_robe | 光芒道袍 | 衣服 | eq_guangmang_robe.png / eq_guangmang_robe@2x.png | 64×64 / 128×128 透明 | 热血传奇「光芒道袍」 | 淡金象牙道袍，领后日轮光环，珍珠串 | 推测 |
| fengtian_armor | 凤天魔甲 | 衣服 | eq_fengtian_armor.png / eq_fengtian_armor@2x.png | 64×64 / 128×128 透明 | 热血传奇「凤天魔甲」 | 翠绿金鳞甲，凤首胸饰与凤羽 | 推测 |
| shenglong_helm | 圣龙盔 | 头盔 | eq_shenglong_helm.png / eq_shenglong_helm@2x.png | 64×64 / 128×128 透明 | 热血传奇「圣龙盔」 | 金色全盔，顶部金龙，白金双翼 | 推测 |
| molong_helm | 魔龙盔 | 头盔 | eq_molong_helm.png / eq_molong_helm@2x.png | 64×64 / 128×128 透明 | 热血传奇「魔龙盔」 | 暗紫黑钢盔，黑色弯龙角，额嵌紫晶 | 推测 |
| tianlong_helm | 天龙盔 | 头盔 | eq_tianlong_helm.png / eq_tianlong_helm@2x.png | 64×64 / 128×128 透明 | 热血传奇「天龙盔」 | 玉白银盔，顶缠青龙，云纹侧翼，额嵌绿松石 | 推测 |
| leiting_necklace | 雷霆项链 | 项链 | eq_leiting_necklace.png / eq_leiting_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「雷霆项链」 | 银链，翼形银框托蓝色闪电晶石 | 推测 |
| leiting_bracelet | 雷霆护腕 | 手镯 | eq_leiting_bracelet.png / eq_leiting_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「雷霆护腕」 | 银钢护腕，蓝色雷纹与电弧，蓝宝石 | 推测 |
| leiting_ring | 雷霆战戒 | 戒指 | eq_leiting_ring.png / eq_leiting_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「雷霆战戒」 | 粗银戒，闪电爪托蓝色宝石 | 推测 |
| leiting_boots | 雷霆战靴 | 靴子 | eq_leiting_boots.png / eq_leiting_boots@2x.png | 64×64 / 128×128 透明 | 热血传奇「雷霆战靴」 | 银钢战靴，蓝色雷纹，踝部小银翼 | 推测 |
| lieyan_necklace | 烈焰项链 | 项链 | eq_lieyan_necklace.png / eq_lieyan_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「烈焰项链」 | 金链，金框托水滴形火红宝石，火焰环绕 | 推测 |
| lieyan_bracelet | 烈焰护腕 | 手镯 | eq_lieyan_bracelet.png / eq_lieyan_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「烈焰护腕」 | 赤红漆甲护腕，金色火焰纹，橙色宝石 | 推测 |
| lieyan_ring | 烈焰魔戒 | 戒指 | eq_lieyan_ring.png / eq_lieyan_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「烈焰魔戒」 | 金戒托圆形火欧泊，火焰升腾 | 推测 |
| lieyan_boots | 烈焰魔靴 | 靴子 | eq_lieyan_boots.png / eq_lieyan_boots@2x.png | 64×64 / 128×128 透明 | 热血传奇「烈焰魔靴」 | 赤红皮金饰法靴，火焰纹靴口，踝部橙宝石 | 推测 |
| guangmang_necklace | 光芒项链 | 项链 | eq_guangmang_necklace.png / eq_guangmang_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「光芒项链」 | 珍珠金链，金色日轮吊坠，中心白钻发光 | 推测 |
| guangmang_bracelet | 光芒护腕 | 手镯 | eq_guangmang_bracelet.png / eq_guangmang_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「光芒护腕」 | 象牙白金护腕，日芒纹，白珍珠 | 推测 |
| guangmang_ring | 光芒道戒 | 戒指 | eq_guangmang_ring.png / eq_guangmang_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「光芒道戒」 | 金戒，日芒托淡黄黄晶 | 推测 |
| guangmang_boots | 光芒道靴 | 靴子 | eq_guangmang_boots.png / eq_guangmang_boots@2x.png | 64×64 / 128×128 透明 | 热血传奇「光芒道靴」 | 象牙白布金边道靴，日芒金饰托珍珠 | 推测 |
| zhanshen_necklace | 战神项链 | 项链 | eq_zhanshen_necklace.png / eq_zhanshen_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「战神项链」 | 暗铜金链，交叉战斧盾形吊坠嵌深红石榴石 | 推测 |
| zhanshen_bracelet | 战神手镯 | 手镯 | eq_zhanshen_bracelet.png / eq_zhanshen_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「战神手镯」 | 粗暗铜手镯，金刺，三颗深红石榴石 | 推测 |
| zhanshen_ring | 战神戒指 | 戒指 | eq_zhanshen_ring.png / eq_zhanshen_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「战神戒指」 | 暗铜金戒，金狮头衔深红石榴石 | 推测 |
| shengmo_necklace | 圣魔项链 | 项链 | eq_shengmo_necklace.png / eq_shengmo_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「圣魔项链」 | 黑银链，一侧白羽翼一侧黑蝠翼，托紫水晶 | 推测 |
| shengmo_bracelet | 圣魔手镯 | 手镯 | eq_shengmo_bracelet.png / eq_shengmo_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「圣魔手镯」 | 银黑双股扭绞手镯，紫晶与小白钻，紫雾 | 推测 |
| shengmo_ring | 圣魔戒指 | 戒指 | eq_shengmo_ring.png / eq_shengmo_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「圣魔戒指」 | 黑银戒，白翼黑翼夹大紫水晶 | 推测 |
| zhenhun_necklace | 真魂项链 | 项链 | eq_zhenhun_necklace.png / eq_zhenhun_necklace@2x.png | 64×64 / 128×128 透明 | 热血传奇「真魂项链」 | 铂金细链，冰蓝魂晶吊坠，银环环绕，灵气缭绕 | 推测 |
| zhenhun_bracelet | 真魂手镯 | 手镯 | eq_zhenhun_bracelet.png / eq_zhenhun_bracelet@2x.png | 64×64 / 128×128 透明 | 热血传奇「真魂手镯」 | 铂金细手镯，云纹，三颗冰蓝月光石 | 推测 |
| zhenhun_ring | 真魂戒指 | 戒指 | eq_zhenhun_ring.png / eq_zhenhun_ring@2x.png | 64×64 / 128×128 透明 | 热血传奇「真魂戒指」 | 铂金戒，银莲花托冰蓝月光石 | 推测 |

- 「是否推测」：原作图标的具体外观没有逐件查证（未查到），所以这里的造型、配色都是按名称和职业原创推测的，没有描摹原作或其他游戏素材，图里没有文字和符号。
- 比 35 级以下的图标更华丽：金属雕花、宝石和光效更多。每件的造型和配色都不一样，同一套的首饰共用一个主色调。
- 男女款衣服按 plan 合并成一件，只做一个图标。
- 预览：docs/art-gap-preview/equip_40_50.jpg（每格是放大的 128 版本，右下角是 64 原尺寸）。副本：/workspace/shared-gap/equip-40-50/。
## M3-A. 30–50 级新地图首批：背景与新怪立绘（art/maps-3050 分支交付）

范围：feat/maps-3050 规划的 C1–C8 共 8 张地图。所有 id 均为美术侧「拟」定，接入时以程序侧为准；场景细节以官方资料为准的部分未查到，均为**推测**。

### 背景（1920×1080 jpg，下 40% 为空旷地面）

| 文件 | 对应地图/区段 | 画面 | 备注 |
|---|---|---|---|
| bg_floor84.jpg | 灌木林 | 夜间灌木丛林、萤火 | 推测 |
| bg_floor85.jpg | 环冰道 | 冰洞长廊 | 推测 |
| bg_floor86.jpg | 玄冰殿 | 冰殿、冰王座、蛇形冰雕 | 推测 |
| bg_floor87.jpg | 通天塔 1–3 层 | 砂岩走廊、灯笼 | 推测 |
| bg_floor88.jpg | 通天塔 4–6 层 | 五行祭坛大厅 | 推测；中央帷幔纹样已模糊处理 |
| bg_floor89.jpg | 通天塔 7–9 层 | 落日云台 | 推测 |
| bg_floor90.jpg | 失乐园·北部丛林 | 巨树藤蔓、遗迹 | 推测 |
| bg_floor91.jpg | 禁地·黑暗轮回 | 紫色漩涡深渊、游魂 | 推测 |
| bg_floor92.jpg | 铁血魔城·叹息回廊 | 铁壁、吊笼、血色火把 | 推测 |
| bg_floor93.jpg | 铁血魔宫 | 角状铁王座、熔岩 | 推测；两侧旗帜纹样已模糊处理 |

预览：docs/art-gap-preview/maps3050_bg.jpg

### 新怪立绘（RGBA png，最长边 960，public/assets/portraits/<id>_full.png）

| id（拟） | 怪物 | 所在地图 | 画面要点 | 备注 |
|---|---|---|---|---|
| m3_flower_spider | 花色蜘蛛 | 灌木林 | 橙紫花斑巨蛛 | 推测 |
| m3_blackhorn_spider | 黑角蜘蛛 | 灌木林 | 黑甲双角蜘蛛 | 推测 |
| boss_m3_bajiao | 八脚首领（BOSS） | 灌木林 | 半人形四臂蛛魔 | 推测 |
| boss_sq_snake_yao_king | 蛇妖王（BOSS） | 玄冰殿 | 三头冰蛇，持冰杖与冰球 | 推测 |
| sq_lieyan_shi | 烈焰使 | 通天塔 | 熔岩火焰魔使，持火刃 | 推测 |
| boss_sq_tongtian | 通天教主（BOSS） | 通天塔 | 白须道袍老者，持光剑、五色元素球 | 推测 |
| m3_giant_elephant | 巨象兽 | 失乐园 | 披骨甲四牙巨象 | 推测 |
| m3_moshen_guai | 魔神怪 | 失乐园 | 三眼羊角魔，持钉棒 | 推测 |
| m3_ape_warrior | 猿猴战士 | 失乐园 | 皮甲巨猿，持铁棍 | 推测 |

预览：docs/art-gap-preview/maps3050_mon1.jpg
| m3_ape_general | 猿猴战将 | 失乐园 | 银毛巨猿将，重甲红披风，持长戟 | 推测 |
| boss_m3_mad_moshen_thief | 疯狂魔神盗（BOSS） | 失乐园 | 兜帽角魔，双匕首、金币袋 | 推测；去绿溢色后肤色偏紫红 |
| boss_sq_shandian | 闪电魔（BOSS） | 黑暗轮回 | 雷电元素魔，持闪电 | 推测 |
| sq_moyan | 魔眼 | 黑暗轮回 | 紫色独眼触手球 | 推测 |
| sq_youying | 幽影武士 | 叹息回廊 | 黑甲幽灵武士，持长刀 | 推测；脚下保留少量烟影 |
| sq_yanmo | 炎魔 | 叹息回廊 | 熔岩有翼炎魔，持火鞭 | 推测 |
| sq_dihuo_rider | 地火兽骑将 | 铁血魔宫 | 熔岩犀兽坐骑＋火枪骑将 | 推测 |
| boss_sq_tiexue | 铁血魔王（BOSS） | 铁血魔宫 | 血染铁甲魔王，持锯齿巨剑 | 推测 |

预览：docs/art-gap-preview/maps3050_mon2.jpg

### 因同 id 已有立绘而跳过（不重画）

| 怪物 | 已有文件 |
|---|---|
| 月魔蜘蛛 | redmoon_spider_full.png |
| 三头蛇王 | boss_sq_snake_king_full.png |
| 白蛇妖 / 红蛇妖 / 黑蛇妖 | sq_*_snake_yao_full.png |
| 利爪魔 | sq_lizhua_full.png |

通天塔低层小怪、逆魔系列：官方怪物名单未查到，规划中沿用已有 id，故未新画（未查到/推测）。
## 持剑姿势盘点（sword-up）

基准：origin/main 6aba894。判定标准：持剑/单手近战武器的角色，剑尖朝下或横着向侧面伸出 → 需修；目标姿势参考 `portraits/mage_full.png` 魔杖握法（竖握、剑尖朝上、贴近身体一侧、不遮脸）。

| 文件 | 尺寸 | 持剑/单手近战 | 剑尖方向 | 需修 | 批次 |
|---|---|---|---|---|---|
| portraits/warrior_full.png | 856×857 | 是（阔剑） | 横向右侧伸出、略朝下 | 是 | 战士批（已完成） |
| portraits/warrior_full_old.png | 537×1006 | 是 | 朝下 | 是（旧图） | 未处理：代码未引用（grep src 无结果），保留待定 |
| portraits/mage_full.png | 813×900 | 否（魔杖） | 杖头朝上 | 否 | 姿势参考图 |
| portraits/taoist_full.png | 853×979 | 手持符箓，剑在背后入鞘 | — | 否 | — |
| portraits/summon_beast_full.png | 960×747 | 否 | — | 否 | — |
| equip/warrior/weapon/wood_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 战士批（已完成） |
| equip/warrior/weapon/iron_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 战士批（已完成） |
| equip/warrior/weapon/dragon_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 战士批（已完成） |
| equip/mage/weapon/wood_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续法师批 |
| equip/mage/weapon/iron_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续法师批 |
| equip/mage/weapon/dragon_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续法师批 |
| equip/mage/weapon/magic_staff.png | 1024×1024 | 否（魔杖） | 朝上 | 否 | — |
| equip/taoist/weapon/wood_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续道士批 |
| equip/taoist/weapon/iron_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续道士批 |
| equip/taoist/weapon/dragon_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续道士批 |
| equip/taoist/weapon/tao_sword.png | 1024×1024 | 是 | 斜向右下 | 是 | 后续道士批 |
| equip/*/body.png、armor/*.png（共 9 张） | 1024×1024 | 否 | — | 否 | — |
| fx/summon_skeleton_atk.png | 836×1096 | 是（剑+盾） | 朝下（斜劈） | 是 | 后续召唤物批（攻击帧，是否改需确认） |
| fx/summon_skeleton_hurt.png | 836×1096 | 是 | 朝上 | 否 | — |
| fx/summon_beast_atk/hurt.png | — | 否 | — | 否 | — |
| town/npc_weapon.png | 768×960 | 是（阔剑） | 朝上举起 | 否 | — |
| town/npc_blacksmith、npc_mz_weapon | 768×960 | 锤 | 朝上 | 否 | — |
| town/npc_brm_guide、npc_fm_veteran、npc_mz_veteran、npc_veteran | 768×960 | 长枪（非剑） | 竖握朝上 | 否 | — |
| town/npc_brm_mystic_smith | 768×960 | 发光工具（推测非剑） | 朝下 | 否（推测） | — |
| town/npc_teleporter、npc_brm_dragon | 768×960 | 法杖 | 朝上 | 否 | — |
| town/ 其余 NPC | 768×960 | 无武器 | — | 否 | — |

怪物立绘不属于角色，未纳入盘点。

### 汇总
- 需修共 12 张（不含未引用的 warrior_full_old，含则 13 张）：战士批 4 张（已完成）；法师批 3 张；道士批 4 张；召唤骷髅攻击帧 1 张（待确认）；另 warrior_full_old 1 张未引用。

### 战士批做法
- warrior_full.png：以原图 + 法师立绘为参考重绘，只改持剑手：剑改竖握、剑尖朝上、贴在身体左侧（画面左），不遮脸；proc.py 抠图后缩回 856×857 RGBA。注意：持剑手由画面右侧换到了画面左侧。
- 三把战士武器层：为保持与 body.png 手位对齐，未重绘，而是以拳心为轴把剑身旋转为近竖直（向外倾约 12°）、拳头像素保留原样，剑柄从拳中穿过、剑首在拳下。手臂仍是 body.png 的前伸姿势（body 层未改）。
- 旧图备份：docs/sword-up-preview/old/；对比图：docs/sword-up-preview/*_compare.png。

### 武器层重新生成（替代旋转方案）
- 用户反馈战士木剑旋转版「手的细节有问题」，旋转补丁方案作废（aa8b8d1 中的战士旋转版已被覆盖）。
- 10 个武器层全部重新生成：战士 wood/iron/dragon、法师 wood/iron/dragon、道士 wood/iron/dragon/tao。做法：以 body.png + 原武器层为参考整图重绘，只改右手和剑（剑竖握、剑尖朝上略向外倾、手指包住握把、剑首在拳下、不遮脸），再与 body.png 逐像素比对抠出「手+剑」为一体的新武器层，1024×1024 RGBA，对齐偏移 0,0，同名替换。先出战士木剑样张自检通过后再批量。
- body.png 与护甲层未改（单独重画武器层已能对齐，无需重绘整套 body）；手臂仍是原前伸姿势。
- 法师批 3 张、道士批 4 张已完成。fx/summon_skeleton_atk.png 按用户要求不改；战士 body 不重画（等用户决定）。
- 旧图备份：docs/sword-up-preview/old/equip_{warrior,mage,taoist}/（战士为最初原图，旋转版不再保留）；对比图（上旧下新）：docs/sword-up-preview/{warrior,mage,taoist}_equip_compare.png。
- 注意：各剑倾角略有差异（约 10–25°）；法师木剑首版拳边有杂线，已重新生成。

### 分层重画批量（10 个武器层）
- 用户确认战士木剑分层样张后，用同法完成其余 9 个：战士 iron/dragon、法师 wood/iron/dragon、道士 wood/iron/dragon/tao；战士木剑直接用已确认的样张层。全部同名替换为 1024×1024 RGBA，body/护甲层未改。
- 剑部件：单独生成不带手的竖直剑（参考 old/ 原图保留外观）：木剑、铁剑、直刃龙剑（法师）、弯刃龙剑（战士/道士）、道士剑（银色角形护手+紫宝石+蓝银柄+红剑穗）。法师/道士木剑、三职业铁剑共用同款部件（原图本就近似）。
- 手部：共用样张拳头；脚本 comp2.py 在 body 袖口（非肤色）处裁掉手腕，让手从法师/道士袖口伸出；拳内只在拳头上沿去掉棍像素，避免剑柄色从指缝透出。
- 每层 3 倍放大自检：指节分段、拇指压在食指/中指上、护手在拳头上方、剑柄从拳头上下两端穿出、剑尖朝上，均通过。
- portraits/warrior_full.png 已 3 倍检查：戴手套握拳，护手在拳上方，剑柄从拳下穿出并露出剑首，无同类问题，未改。
- 备份：最初原图在 old/equip_{warrior,mage,taoist}/；171f568 版在 old/regen_171f568/。对比图（上原图、中新图、下手部 3 倍）：{warrior,mage,taoist}_equip_compare.png。部件与脚本：sample_src/（swords/、comp2.py）。

## 清除魔兽素材（art/remove-wow，2026-11-01）

以仓库实际核对（git ls-files + rg）：public/assets/{items,potions,skills,ui} 下 INV_/Ability_/Spell_/UI- 前缀文件实际为 80 个（转述为 81 个），其中 src 仍引用 10 个、未引用 70 个。另有 portraits/ 下 13 个同前缀 WoW 头像不在本次范围（其中 INV_Misc_Head_Human_01/02 仍被 assets-manifest 的 menu_0、merchant 引用），未处理。

### 重画的 10 个（同名同路径覆盖，64×64 RGBA PNG，AI 生成，未描摹任何 WoW 原图）
| 文件 | 引用处 | 新图内容 |
|---|---|---|
| items/INV_Misc_Bag_08.png | assets-manifest menu_1（背包） | 棕皮背包，金边、红色皮扣，透明底 |
| items/INV_Misc_Book_09.png | menu_2（书） | 暗红皮面古书，金色包角与搭扣，封面无字 |
| items/INV_Misc_Coin_01.png | menu_3（金币） | 一堆光面金币（无图案），透明底 |
| items/INV_Misc_Food_15.png | companion.ts 火龙之心喂食物品 | 烤鸡腿，透明底 |
| items/INV_Misc_Gem_Pearl_01.png | companion.ts 火龙之心/白日门技能书/书页/金条 | 紫白发光宝珠嵌金爪托，透明底 |
| skills/Ability_Warrior_BattleShout.png | menu_4 | 红金铠甲战士怒吼、橙红声波，满版方图，暗金边 |
| skills/Ability_Warrior_DefensiveStance.png | classes.ts 神圣战甲术 | 红面金边盾 + 金蓝护体光罩，满版方图 |
| skills/Spell_Holy_Renew.png | classes.ts 群体治愈术 | 掌心升起的绿叶治疗光流，满版方图 |
| ui/UI-Backpack-EmptySlot.png | slot_empty | 程序绘制：深色凹槽 + 暗金斜面边框 + 暗红内线，四边对称可平铺 |
| ui/UI-Quickslot2.png | slot_bg | 程序绘制：同款暗金边框，中心透明（与原图一样作为叠加框） |

物品图标为洋红/绿幕生成后抠图；技能图标整图缩放；两张 UI 格子用 PIL 直接绘制（脚本在仓库外 /workspace/cardlegend/rw/build.py）。对比图（左旧右新）只放仓库外 /workspace/shared-gap/remove-wow/remove_wow_compare.jpg，不入库，避免在仓库保留 WoW 原图。

### 删除的 70 个（git rm，src/tests/public 均无引用）
- items/INV_Chest_Plate01.png
- items/INV_Chest_Plate02.png
- items/INV_Chest_Plate03.png
- items/INV_Helmet_01.png
- items/INV_Helmet_02.png
- items/INV_Helmet_03.png
- items/INV_Helmet_04.png
- items/INV_Helmet_05.png
- items/INV_Jewelry_Ring_01.png
- items/INV_Jewelry_Ring_02.png
- items/INV_Jewelry_Ring_03.png
- items/INV_Jewelry_Ring_04.png
- items/INV_Jewelry_Ring_05.png
- items/INV_Misc_Bone_01.png
- items/INV_Misc_Food_14.png
- items/INV_Sword_01.png
- items/INV_Sword_02.png
- items/INV_Sword_03.png
- items/INV_Sword_04.png
- items/INV_Sword_05.png
- potions/INV_Potion_50.png
- potions/INV_Potion_51.png
- potions/INV_Potion_52.png
- potions/INV_Potion_53.png
- potions/INV_Potion_54.png
- potions/INV_Potion_55.png
- potions/INV_Potion_56.png
- potions/INV_Potion_57.png
- potions/INV_Potion_58.png
- potions/INV_Potion_59.png
- potions/INV_Potion_70.png
- potions/INV_Potion_71.png
- potions/INV_Potion_72.png
- potions/INV_Potion_73.png
- potions/INV_Potion_74.png
- potions/INV_Potion_75.png
- potions/INV_Potion_76.png
- potions/INV_Potion_77.png
- potions/INV_Potion_78.png
- potions/INV_Potion_79.png
- skills/Ability_Warrior_Charge.png
- skills/Ability_Warrior_Cleave.png
- skills/Ability_Warrior_Revenge.png
- skills/Ability_Warrior_SavageBlow.png
- skills/Ability_Warrior_ShieldWall.png
- skills/Ability_Warrior_Sunder.png
- skills/Ability_Warrior_WarCry.png
- skills/Ability_Whirlwind.png
- skills/Spell_Fire_Fireball.png
- skills/Spell_Fire_FlameBolt.png
- skills/Spell_Frost_FrostNova.png
- skills/Spell_Holy_FlashHeal.png
- skills/Spell_Holy_Heal.png
- skills/Spell_Holy_HolyBolt.png
- skills/Spell_Nature_Lightning.png
- skills/Spell_Nature_ThunderClap.png
- skills/Spell_Shadow_AnimateDead.png
- skills/Spell_Shadow_RaiseDead.png
- skills/Spell_Shadow_ShadowBolt.png
- ui/UI-DialogBox-Background.png
- ui/UI-DialogBox-Border-9slice.png
- ui/UI-DialogBox-Border.png
- ui/UI-DialogBox-Gold-Border-9slice.png
- ui/UI-DialogBox-Gold-Border.png
- ui/UI-DialogBox-Header.png
- ui/UI-EmptySlot.png
- ui/UI-Panel-Button-Up.png
- ui/UI-Tooltip-Background.png
- ui/UI-Tooltip-Border-9slice.png
- ui/UI-Tooltip-Border.png

核查范围：rg 全仓库（含 src、tests、docs、public 下 json/webmanifest）；vite.config.ts 与 tests/regress.mjs 的目录遍历只处理 dist 中已有文件（压缩/线上 HEAD 检查），不按文件名加载，删除不影响运行。仅文档引用：docs/art-requests.md、docs/art-gap-audit.md 中的旧清单文字；docs/ui-preview/compose_shop_ref.py（旧商店参考图拼图脚本）引用了 INV_Chest_Plate01/02、INV_Helmet_02/04，重跑会找不到文件，属于历史预览脚本，未修改。

### 署名修改位置
- src/assets-manifest.ts 第 2 行：改为「// 图标为原创/AI 生成。」
- src/scenes/TitleScene.ts 第 68 行：标题页署名改为「素材：原创与 AI 生成」
- README.md 第 5、47、56 行仍写着魔兽来源，本次未改（任务只允许改上面两处）。

### 音效与音乐来源（sfx 27 个、music 7 个）
核查手段：git log 首次加入提交、ffprobe 元数据标签、README、scripts/ 下脚本（无音频生成脚本）。

| 文件 | 首次加入 | 元数据 | 结论 |
|---|---|---|---|
| sfx/cleave.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/click.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/click2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/coin.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/death.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/death2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/death_boss.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/deer_death.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/fireball_cast.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/fireball_impact.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/ghoul_death.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/heal.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/heal2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/hit.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/hit2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/levelup.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/lich_death.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/loot.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/potion.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/shockwave.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/shockwave2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/shout.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/skeleton_death.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/summon.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/summon2.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/swing.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| sfx/swing_crit.ogg | 5e11453 init | 无标签（Lavc libvorbis 转码） | WoW 来源（README「音效导出自魔兽世界 1.12.1 客户端」，文件本身无标签佐证） |
| music/boss.ogg | a2d1dc6 背景音乐 | genre=Blues，无标题/作者 | 来源不明（未查到；与同批 WoW 曲目同提交同转码参数，推测 WoW） |
| music/floor1.ogg | a2d1dc6 | title=DayEvilForest01，artist=Jason Hayes，album=World of Warcraft mp3s | WoW 来源 |
| music/floor2.ogg | a2d1dc6 | genre=Blues，无标题/作者 | 来源不明（未查到；推测 WoW） |
| music/floor3.ogg | a2d1dc6 | title=haunted01，album=World of Warcraft，Jason Hayes | WoW 来源 |
| music/floor4.ogg | a2d1dc6 | genre=Blues，无标题/作者 | 来源不明（未查到；推测 WoW） |
| music/floor5.ogg | a2d1dc6 | title=undercity01-zone，artist=Derek Duke，album=World of Warcraft | WoW 来源 |
| music/title.ogg | a2d1dc6 | title=magic01-zone1，album=World of Warcraft mp3s，Jason Hayes | WoW 来源 |

结论：没有任何音频能确认是原创或 AI 生成。27 个音效与 4 首音乐为 WoW 来源，另 3 首来源不明（推测 WoW），公开前需要全部替换。标题页新署名「素材：原创与 AI 生成」在音频替换前并不准确。

## 灵符商城（feat/lingfu-shop）缺图
当前用 ui_atlas 已有帧（panel_frame_s/list_row/tab_on/tab_off/btn_normal/title_plate/lingfu_icon_s）+ 借用物品图标；以下为专用图缺口，交付前保持借用/回退绘制。
| 文件名 | 用途 | 规格 | 当前占位 |
|---|---|---|---|
| icons/shop_summon_scroll.png | 召唤直升卷轴 | 64×64 透明底，金边卷轴+召唤符文 | dungeon_scroll.png |
| icons/shop_return_stone.png | 回城石（10 次） | 64×64，蓝白发光石 | INV_Misc_Gem_Pearl_01.png |
| icons/shop_skill_necklace.png | 技巧项链 | 64×64，绿宝石项链带书卷纹 | eq_green_necklace.png |
| icons/bloodstone_s/m/l/xl.png | 血石 小/中/大/特 | 64×64 ×4，红色宝石体积递增 | eq_pearl.png |
| ui_atlas 帧 lingfu_entry | 右下常驻入口按钮（桌面 88×44、手机 52×44 CSS） | 九宫格可拉伸，金色符纸 | btn_normal + 文字 |

## P1. 药水扩展图标（docs/potion-expand.md，方案阶段，未接入）
- 尺寸：64×64 PNG 透明底（游戏内缩到 36px 显示：手机药水格 56px，扣掉框后净空 36px；桌面热键同样缩放）。风格和现有 hp_small/mp_small 药瓶一致：写实手绘、1.76 传奇药瓶轮廓，缩到 36px 仍能分辨。
- 散装：强效金创药（大红瓶）、强效魔法药（大蓝瓶）、太阳水（金黄小瓶）、强效太阳水（金黄大瓶，带光晕）。
- 捆（6 瓶捆在一起，用麻绳或布包，颜色和单瓶对应）：金创药(小)包、魔法药(小)包、金创药(中)包、魔法药(中)包、超级金创药、超级魔法药、太阳水包、强效太阳水包。
- 共 12 张；文件名建议 `assets/items/pot_<key>.png`、`assets/items/bundle_<key>.png`。
- **状态：已出图**（art/potion-icons，美术2）。public/assets/items/ 下 pot_hp_big / pot_mp_big / pot_sun / pot_sun_big；bundle_hp_small / bundle_mp_small / bundle_hp_mid / bundle_mp_mid / bundle_hp_big（超级金创药）/ bundle_mp_big（超级魔法药）/ bundle_sun / bundle_sun_big，均 64×64 透明 PNG，无 @2x。预览 docs/ui-preview/preview_potion_icons.jpg；脚本 docs/ui-preview/build_potion.py。区分：小包=麻绳捆、中包=布袋、超级=木箱、太阳水包=皮袋、强效太阳水包=红绣袋+金光。

## 装备重新对齐：新增物品图标与腰带栏（feat/drop-realign，提案，未生成）

- 来源：全部 **AI 生成**，像素风，参照现有 gen_* 图标；本次不生成图。
- 共 36 个图标 + 1 个腰带空栏底图。

| # | 物品 | 部位 | 需求 | 来源 |
|---|---|---|---|---|
| 1 | 金项链 | necklace | 2 | AI 生成 |
| 2 | 黑色水晶项链 | necklace | 13 | AI 生成 |
| 3 | 黑檀项链 | necklace | 13 | AI 生成 |
| 4 | 黄色水晶项链 | necklace | 13 | AI 生成 |
| 5 | 魔鬼项链 | necklace | 17 | AI 生成 |
| 6 | 琥珀项链 | necklace | 17 | AI 生成 |
| 7 | 凤凰明珠 | necklace | 17 | AI 生成 |
| 8 | 蓝翡翠项链 | necklace | 23 | AI 生成 |
| 9 | 皮制手套 | bracelet | 7 | AI 生成 |
| 10 | 钢手镯 | bracelet | 8 | AI 生成 |
| 11 | 大手镯 | bracelet | 9 | AI 生成 |
| 12 | 魔法手镯 | bracelet | 18 | AI 生成 |
| 13 | 坚固手套 | bracelet | 18 | AI 生成 |
| 14 | 黑檀手镯 | bracelet | 19 | AI 生成 |
| 15 | 道士手镯 | bracelet | 19 | AI 生成 |
| 16 | 魔力手镯 | bracelet | 20 | AI 生成 |
| 17 | 死神手套 | bracelet | 22 | AI 生成 |
| 18 | 金手镯 | bracelet | 23 | AI 生成 |
| 19 | 六角戒指 | ring | 7 | AI 生成 |
| 20 | 玻璃戒指 | ring | 7 | AI 生成 |
| 21 | 牛角戒指 | ring | 9 | AI 生成 |
| 22 | 蓝色水晶戒指 | ring | 16 | AI 生成 |
| 23 | 黑色水晶戒指 | ring | 20 | AI 生成 |
| 24 | 蛇眼戒指 | ring | 20 | AI 生成 |
| 25 | 珍珠戒指 | ring | 20 | AI 生成 |
| 26 | 布鞋 | boots | 15 | AI 生成 |
| 27 | 鹿皮靴 | boots | 22 | AI 生成 |
| 28 | 紫绸靴 | boots | 30 | AI 生成 |
| 29 | 避魂靴 | boots | 35 | AI 生成 |
| 30 | 兽皮腰带 | belt | 15 | AI 生成 |
| 31 | 铁腰带 | belt | 22 | AI 生成 |
| 32 | 青铜腰带 | belt | 30 | AI 生成 |
| 33 | 钢铁腰带 | belt | 35 | AI 生成 |
| 34 | 雷霆腰带 | belt | 45 | AI 生成 |
| 35 | 烈焰腰带 | belt | 45 | AI 生成 |
| 36 | 光芒腰带 | belt | 45 | AI 生成 |
| 37 | 腰带空栏底图（实际交付名 slot_empty_belt，另加 slot_empty_boots） | ui | - | AI 生成 ✅ 已交付 |

### H 章过渡链图标（29 件）——✅ 已交付（art/h-chain-icons 98351f6，已接入 feat/drop-realign，含 @2x）

已接入：`icon` 已改为目标文件名，@2x 已登记 item-icons-2x。下表「当前占位」列为接入前的占位，留作记录。

| 名称 | 需求等级 | 用途（槽位/职业） | 当前占位 | 目标文件名 |
|---|---|---|---|---|
| 金项链 | 2 | 项链/通用 | gen_necklace.png | items/h_gold_necklace.png |
| 黑色水晶项链 | 13 | 项链/战 | gen_necklace.png | items/h_black_crystal_necklace.png |
| 黑檀项链 | 13 | 项链/法 | gen_necklace.png | items/h_ebony_necklace.png |
| 黄色水晶项链 | 13 | 项链/道 | gen_necklace.png | items/h_yellow_crystal_necklace.png |
| 魔鬼项链 | 17 | 项链/战 | gen_necklace.png | items/h_devil_necklace.png |
| 琥珀项链 | 17 | 项链/法 | gen_necklace.png | items/h_amber_necklace.png |
| 凤凰明珠 | 17 | 项链/道 | gen_necklace.png | items/h_phoenix_pearl.png |
| 蓝翡翠项链 | 23 | 项链/战 | gen_necklace.png | items/h_blue_jade_necklace.png |
| 皮制手套 | 7 | 手镯/通用 | gen_bracelet.png | items/h_leather_glove.png |
| 钢手镯 | 8 | 手镯/通用 | gen_bracelet.png | items/h_steel_bracelet.png |
| 大手镯 | 9 | 手镯/通用 | gen_bracelet.png | items/h_big_bracelet.png |
| 魔法手镯 | 18 | 手镯/通用 | gen_bracelet.png | items/h_magic_bracelet.png |
| 坚固手套 | 18 | 手镯/通用 | gen_bracelet.png | items/h_sturdy_glove.png |
| 黑檀手镯 | 19 | 手镯/法 | gen_bracelet.png | items/h_ebony_bracelet.png |
| 道士手镯 | 19 | 手镯/道 | gen_bracelet.png | items/h_tao_bracelet.png |
| 魔力手镯 | 20 | 手镯/战 | gen_bracelet.png | items/h_power_bracelet.png |
| 死神手套 | 22 | 手镯/战 | gen_bracelet.png | items/h_death_glove.png |
| 金手镯 | 23 | 手镯/通用 | gen_bracelet.png | items/h_gold_bracelet.png |
| 六角戒指 | 7 | 戒指/法 | eq_iron_ring.png | items/h_hex_ring.png |
| 玻璃戒指 | 7 | 戒指/道 | eq_iron_ring.png | items/h_glass_ring.png |
| 牛角戒指 | 9 | 戒指/战 | eq_iron_ring.png | items/h_horn_ring.png |
| 蓝色水晶戒指 | 16 | 戒指/战 | eq_iron_ring.png | items/h_blue_crystal_ring.png |
| 黑色水晶戒指 | 20 | 戒指/战 | eq_iron_ring.png | items/h_black_crystal_ring.png |
| 蛇眼戒指 | 20 | 戒指/法 | eq_iron_ring.png | items/h_snake_eye_ring.png |
| 珍珠戒指 | 20 | 戒指/道 | eq_iron_ring.png | items/h_pearl_ring.png |
| 布鞋 | 15 | 靴子/通用 | gen_boots.png | items/h_cloth_shoes.png |
| 鹿皮靴 | 22 | 靴子/通用 | gen_boots.png | items/h_deer_boots.png |
| 紫绸靴 | 30 | 靴子/通用 | gen_boots.png | items/h_silk_boots.png |
| 避魂靴 | 35 | 靴子/通用 | gen_boots.png | items/h_soul_boots.png |

**状态：已出图（art/h-chain-icons）** 29 张 64×64 RGBA + 同名 @2x 128×128，位于 `public/assets/items/`：
- 项链：h_gold_necklace 金项链 / h_black_crystal_necklace 黑色水晶项链 / h_ebony_necklace 黑檀项链 / h_yellow_crystal_necklace 黄色水晶项链 / h_devil_necklace 魔鬼项链 / h_amber_necklace 琥珀项链 / h_phoenix_pearl 凤凰明珠 / h_blue_jade_necklace 蓝翡翠项链
- 手镯：h_leather_glove 皮制手套 / h_steel_bracelet 钢手镯 / h_big_bracelet 大手镯 / h_magic_bracelet 魔法手镯 / h_sturdy_glove 坚固手套 / h_ebony_bracelet 黑檀手镯 / h_tao_bracelet 道士手镯 / h_power_bracelet 魔力手镯 / h_death_glove 死神手套 / h_gold_bracelet 金手镯
- 戒指：h_hex_ring 六角戒指 / h_glass_ring 玻璃戒指 / h_horn_ring 牛角戒指 / h_blue_crystal_ring 蓝色水晶戒指 / h_black_crystal_ring 黑色水晶戒指 / h_snake_eye_ring 蛇眼戒指 / h_pearl_ring 珍珠戒指
- 靴子：h_cloth_shoes 布鞋 / h_deer_boots 鹿皮靴 / h_silk_boots 紫绸靴 / h_soul_boots 避魂靴

脚本 `docs/ui-preview/build_h_chain.py`、`compose_h_chain.py`；源图 `docs/ui-preview/src/h_*_src.jpg`；预览 `docs/ui-preview/preview_h_chain_icons.jpg`。**v2（主Bot 审后修正）**：①暗色提亮+左上轮廓高光：h_black_crystal_necklace/h_black_crystal_ring（紫青）、h_ebony_necklace/h_ebony_bracelet（暖棕）、h_death_glove（紫）；②8 条项链裁短链条放大吊坠，占比对齐 eq_* 项链；③h_steel_bracelet 改为带铰链锁扣铆钉的扁平宽钢箍，h_ebony_bracelet 改为雕纹粗圆木镯（源图 src/h_br_v2_src.jpg）。64 与 @2x 同步重出，预览底部加修正前后对比。
待系统开发把对应物品 icon 从 gen_necklace/gen_bracelet/eq_iron_ring/gen_boots 换为上述文件。

## 阶段2 腰带 7 条 + 空栏底图——✅ 已交付（art/belt-icons d581c18，含 @2x，AI 生成）
已接入：belts.ts 用 items/belt_*.png 并登记 @2x（28c85e1）；规格 64px + @2x，透明底。
| id | 名称 | 需求 | 备注 |
|---|---|---|---|
| belt_hide | 兽皮腰带 | 15 | |
| belt_iron | 铁腰带 | 22 | |
| belt_bronze | 青铜腰带 | 30 | 等级保守 |
| belt_steel | 钢铁腰带 | 35 | |
| belt_leiting | 雷霆腰带 | 45 | 战士；外观与雷霆套一致 |
| belt_lieyan | 烈焰腰带 | 45 | 法师；待核 |
| belt_guangmang | 光芒腰带 | 45 | 道士；待核 |

空栏底图（装备面板空槽剪影，60px + @2x）：slot_empty_belt（腰带）、slot_empty_boots（靴子）。血石空槽由灵符分支提供，不在此列。

**状态：✅ 已交付并接入（28c85e1）**
- 腰带（`public/assets/items/`，64×64 RGBA + 同名 @2x 128×128）：belt_hide 兽皮腰带（毛边兽皮+骨扣）/ belt_iron 铁腰带（铆钉皮带+方铁扣，已提亮加冷色边缘高光）/ belt_bronze 青铜腰带（铜片+卷纹椭圆扣）/ belt_steel 钢铁腰带（钢片+盾形扣嵌蓝宝石）/ belt_leiting 雷霆腰带（蓝紫金属+闪电盾扣+电光）/ belt_lieyan 烈焰腰带（红皮金饰+火焰扣+火光）/ belt_guangmang 光芒腰带（白金片+日芒扣白宝石+金白圣光）
- 空栏底图（`public/assets/ui/`，60×60 + @2x 120×120，透明底暗纹剪影，叠在 slot 空格中央）：slot_empty_belt、slot_empty_boots
- 未进 ui_atlas：图集 512×512 已用高度 509，放不下，改单图交付；如需进图集要先扩图集或重排（由主Bot决定）。
- 脚本 `docs/ui-preview/build_belt.py`、`compose_belt.py`；源图 `docs/ui-preview/src/belt{1,2}_src.jpg`、`slot_empty_src.jpg`；预览 `docs/ui-preview/preview_belt_icons.jpg`。
- 待系统开发：src/data/belts.ts 的 icon 由 gen_bracelet 占位换为 items/belt_*.png 并登记 @2x；装备面板腰带/靴子空槽接入 ui/slot_empty_*.png。
