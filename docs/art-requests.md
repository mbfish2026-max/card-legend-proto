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
