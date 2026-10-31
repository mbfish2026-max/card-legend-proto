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
