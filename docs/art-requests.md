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
