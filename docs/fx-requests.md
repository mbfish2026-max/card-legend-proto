# 技能特效需求清单（fx-requests）

产出目录：`/Users/razer/card-legend-art-out/fx/`（透明 PNG 图集 + Phaser JSON Hash）。全部为程序化原创渲染；参考帧只用于参考颜色、形状、尺寸和节奏，参考帧位于 box 上的 `/workspace/fcl/video_frames/f_*.jpg` 和 `video2_frames/g_*.jpg`。「参考不足」表示视频里没有清晰对应的画面，按通用风格制作。
锚点类型：center 表示目标或施法者的视觉中心；ground 表示脚底地面（GROUND_Y）；caster_front 表示施法者朝向侧前方；projectile 为弹道头部。pivot 以单帧左上角为原点。

| 文件名 | 技能id | 阶段 | 帧数 | 帧尺寸 | 帧率 | 循环 | 锚点类型 | pivot px | 混合模式 | 时长ms | 说明 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fx_common_explosion.png | common/fireball/soul_fire(tint) | hit | 8 | 192×192 | 20 | 否 | target | 96,96 | ADD | 400 | 灰白通用爆炸，代码 setTint 改色复用；v2 放大至 192²（内容 ×1.5）；参考：f_015, g_055 (命中时白闪+向外火花) |
| fx_common_hitspark.png | common 普攻命中 | hit | 6 | 192×192 | 24 | 否 | target | 96,96 | ADD | 250 | 白色十字星芒+火花，tint 同普攻；v2 放大至 192²（内容 ×1.5）；参考：g_024, g_064 (命中处白色十字星芒+碎火花) |
| fx_common_slash.png | common 普攻 | hit | 6 | 128×128 | 24 | 否 | caster | 40,64 | ADD | 250 | 白色月牙挥砍，按职业 tint：战士 0xffb060 / 法师 0xa08cff / 道士 0xc0f070；参考：g_024, g_064 (白色交叉刀光) |
| fx_fire_sword_hit.png | fire_sword | hit | 8 | 192×192 | 18 | 否 | target | 96,96 | ADD | 444 | 烈火：先火精灵螺旋聚拢+斜斩，再红色火球炸开；比现有 bloodBlade 略小；参考：f_015 / f_017（目标身上红色火焰球体）、f_027（金红斩击） |
| fx_fire_wall_loop.png | fire_wall | loop | 8 | 192×192 | 16 | 是 | ground | 96,176 | ADD | 500（循环周期） | 目标脚下火墙循环；出现/消失由代码 scaleY 0→1 / alpha 渐隐；持续 (6+2*lv)s；参考：视频未见火墙（参考不足），通用火焰风格 |
| fx_fireball_cast.png | fireball | cast | 6 | 128×128 | 20 | 否 | caster | 64,64 | ADD | 300 | 法杖前小光爆，放在施法者前方 dir*w*0.4, cy-20；参考：f_009/f_013 施法者手前光爆（颜色不同，仅参考节奏） |
| fx_fireball_fly.png | fireball | projectile | 6 | 128×64 | 20 | 是 | screen-line | 96,32 | ADD | 300（循环周期） | 朝右的循环飞行火球，代码按方向 setFlipX 并平移；拖尾已含在图内；参考：视频无清晰火球弹道帧（参考不足），沿用现有 projectile fire 配色 |
| fx_fireball_hit.png | fireball | hit | 8 | 256×256 | 20 | 否 | target | 128,128 | ADD | 400 | 橙火爆炸，含后段烟（NORMAL 部分为暗色烟，ADD 下烟几乎不可见，可接受）；v2 放大至 256²（内容 ×1.9）；参考：f_015 / g_055（命中爆闪+外扩） |
| fx_half_moon_sweep.png | half_moon | hit | 8 | 256×192 | 20 | 否 | caster | 48,120 | ADD | 400 | 前方扁椭圆半月刀气扫过（rx185 ry75），pivot 放施法者中心偏下；覆盖前方约 1.5 张卡，第 2/3 目标可再叠 hitspark(tint 0x9933ff)；参考：f_009 / f_017（紫色刀气、命中紫白爆光）；半月扇形本身参考不足 |
| fx_heal_pillar.png | heal | hit | 8 | 128×256 | 16 | 否 | ground | 64,244 | ADD | 500 | 治愈术：脚下金绿光柱+上升光点+十字闪；对施法者自身；参考：g_110 金色光感（治疗本身参考不足） |
| fx_ice_roar_burst.png | ice_roar | hit | 10 | 256×192 | 20 | 否 | ground | 128,168 | NORMAL | 500 | 暴风雪冰刺爆发，放在每个受击目标脚下；含不透明冰晶，建议 NORMAL；参考：视频未见冰咆哮（参考不足），沿用现有 iceRoar 配色 0x9ae6ff |
| fx_magic_shield_cast.png | magic_shield | cast | 6 | 256×256 | 20 | 否 | caster | 128,128 | ADD | 300 | 护罩弹出：0.25→1 回弹+中心闪光；之后接 loop；参考：g_110（金橙色球形护罩、亮边、内淡填充） |
| fx_magic_shield_loop.png | magic_shield | loop | 8 | 256×256 | 12 | 是 | caster | 128,128 | ADD | 667（循环周期） | 护罩持续循环（弧光旋转、呼吸）；持续 (12+4*lv)s，结束用代码 alpha 300ms 淡出；参考：g_110 |
| fx_passive_glint.png | basic_sword / spirit_force (tint) | hit | 6 | 128×128 | 18 | 否 | ground | 64,100 | ADD | 333 | 被动增益小闪光：脚下光环上升+星点，白金色；基本剑术 tint 0xffb060，精神力战法 tint 0x9aff9a；参考：视频无被动特效（参考不足） |
| fx_poison_fly.png | poison | projectile | 6 | 128×64 | 20 | 是 | screen-line | 96,32 | ADD | 300（循环周期） | 毒球循环飞行，朝右；参考：视频未见施毒弹道（参考不足），沿用现有毒球配色 |
| fx_poison_loop.png | poison | loop | 8 | 128×128 | 12 | 是 | target | 64,72 | NORMAL | 667（循环周期） | 中毒持续毒雾，挂在目标中心；持续 (8+2*lv)s；配合 setTint 绿色更明显；参考：g_090/g_096/g_100（中毒目标整体泛绿，仅作颜色参考） |
| fx_rush_dash.png | rush | cast | 6 | 256×128 | 20 | 否 | caster | 200,64 | NORMAL | 300 | 冲撞：跟随施法者（挂在卡牌容器上，pivot=卡中心），身后速度线+地面尘土，身前冲击弧；参考：视频未见野蛮冲撞（参考不足） |
| fx_rush_hit.png | rush | hit | 6 | 192×192 | 20 | 否 | target | 96,96 | ADD | 300 | 冲撞命中冲击波环；配合代码击退 tween；v2 放大至 192²（内容 ×1.5）；参考：g_024（命中白闪） |
| fx_slaying_proc.png | slaying | hit | 6 | 128×128 | 24 | 否 | target | 64,64 | ADD | 250 | 攻杀剑术触发重击：金色 X 斩+星爆，叠在普攻命中处；参考：f_025 / f_027（金色斩击爆光） |
| fx_soul_fire_fly.png | soul_fire | projectile | 6 | 64×64 | 18 | 是 | screen-line | 32,32 | NORMAL | 333（循环周期） | 黄符纸+金绿灵光，循环闪烁；代码可旋转 720°（图内无拖尾，旋转不穿帮）；参考：视频未见符咒弹道（参考不足）；配色沿用现有 0xfff2a0/0xd4a020 |
| fx_soul_fire_hit.png | soul_fire | hit | 8 | 192×192 | 20 | 否 | target | 96,96 | ADD | 400 | 符咒命中金绿爆炸；v2 放大至 192²（内容 ×1.5）；参考：f_028 / g_090（绿色灵光） |
| fx_summon_beast_circle.png | summon_beast | summon | 10 | 256×128 | 16 | 否 | ground | 128,96 | NORMAL | 625 | 召唤神兽地面法阵（金红配色区别于骷髅）；参考：参考不足（视频未见神兽召唤） |
| fx_summon_circle.png | summon_skeleton | summon | 10 | 256×128 | 16 | 否 | ground | 128,96 | NORMAL | 625 | 召唤骷髅地面法阵（绿 0x7aff7a）：画出→高亮旋转→淡出；放在召唤位脚下，depth 低于卡牌；参考：f_028（召唤时绿色光芒/紫色传送漩涡，仅颜色参考） |
| fx_summon_pillar.png | summon_skeleton / summon_beast | summon | 8 | 128×256 | 16 | 否 | ground | 64,244 | ADD | 500 | 召唤光柱，法阵第 4 帧时叠加；神兽用 tint 0xffb060；参考：f_028（绿色光柱感） |
| fx_thrust_hit.png | thrust | hit | 7 | 256×128 | 24 | 否 | caster | 12,64 | ADD | 292 | 刺杀：pivot 放剑尖（攻击者前沿 x+dir*w/2, cy）；长 240px≈前方 2 格，可 scaleX 适配间距；参考：g_067 / f_013（水平紫白穿刺光束，贯穿前方两个单位） |
| fx_thunder_strike.png | thunder | hit | 8 | 128×640 | 20 | 否 | ground | 64,628 | ADD | 400 | 天雷：pivot 在目标脚底；图高 640，pivot 距顶 628px，1× 即可从目标上方约 630px（屏幕顶附近）劈下，无需拉伸；参考：g_033, g_078, g_055（蓝紫外辉+白芯竖直天雷、落地白色爆溅） |

## v2 修订（2026-10-31）
- fire_wall_loop：火舌高度下限加第二层错相噪声，每帧总亮度归一；中段空洞消除，首尾无缝。
- poison_loop：改为双层暗绿/亮绿不透明雾团加高光，雾体本身清晰可见。
- fireball_hit 放大到 256²（内容 ×1.9）；common_explosion、soul_fire_hit、common_hitspark、rush_hit 放大到 192²（内容 ×1.5）。pivot 仍在中心，1× 使用即可。
- thunder_strike 改为 128×640，pivot (64,628)，1× 从约 630px 高处劈下，无需拉伸。

## 仍存在的不足
- fire_wall_loop 第 3 帧中部火舌仍略低，属正常起伏，已无明显空洞。
- common_hitspark 放大后在卡上仍偏细，属点状星芒风格。
- 「参考不足」项：fireball_fly、fire_wall、ice_roar、rush、passive_glint、heal_pillar、poison_fly、soul_fire_fly、summon_beast_circle。
- magic_shield r=112 正好包卡；ice_roar 按目标逐个播放。

## #11 法师新技能特效需求（2026-10-31，当前复用旧图集 + Graphics 兜底，素材到位后在 FX_DEFS 注册即可）
| 文件名 | 技能id | 阶段 | 帧数 | 帧尺寸 | 帧率 | 循环 | 锚点类型 | pivot px | 混合模式 | 时长ms | 说明 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fx_big_fireball_fly.png | big_fireball | projectile | 6 | 192×96 | 20 | 是 | screen-line | 144,48 | ADD | 300（循环周期） | 大火球弹道，比火球大约 1.6 倍、拖尾更长，朝右；触发：施法后 150ms 从法杖前端飞出；命中点：目标卡中心（cx,cy）；现用 fx_fireball_fly |
| fx_big_fireball_hit.png | big_fireball | hit | 8 | 256×256 | 20 | 否 | target | 128,128 | ADD | 400 | 单体大爆炸（橙红火团+火星）；触发：弹道到达；命中点：目标卡中心；现用 fx_fireball_hit ×1.4 |
| fx_burst_fire_blast.png | burst_fire | hit | 10 | 512×256 | 20 | 否 | target | 256,200 | ADD | 500 | 爆裂火焰：首个目标为中心的地面爆炸，横向覆盖约 3 张卡（±170px）；触发：施法前摇结束；命中点：首目标脚下；范围内其余目标叠 hitspark；现用 fx_common_explosion ×1.6 |
| fx_hell_fire_line.png | hell_fire | hit | 10 | 512×192 | 20 | 否 | caster | 0,160 | ADD | 500 | 地狱火：从施法者前沿向前喷出的地面火浪，长约 425px（5 格≈2.5 卡），可 flipX；触发：前摇结束；命中点：沿途每个目标脚下（逐个延迟 60ms）；现用 fx_fire_wall_loop 500ms |
| fx_lightning_flash_beam.png | lightning_flash | hit | 8 | 768×128 | 24 | 否 | caster | 0,64 | ADD | 333 | 疾光电影：水平白蓝闪电光束，长约 680px（4 卡）贯穿前方，可 flipX、scaleX 适配；触发：前摇结束；命中点：光束经过的全部目标中心；现用每目标 fx_thunder_strike |
| fx_hell_thunder_burst.png | hell_thunder | hit | 10 | 1024×384 | 20 | 否 | caster | 512,320 | ADD | 500 | 地狱雷光：以自身为中心 5×5（左右各约 425px）的蓝紫雷暴环+落雷；触发：前摇结束；命中点：范围内每个目标再叠 thunder_strike（逐个延迟 50ms）；现用每目标 fx_thunder_strike + Graphics 圆环 |

## #12 道士新技能特效需求（2026-10-31，当前复用魔法盾图集着色 / 治愈光柱 + Graphics 兜底，素材到位后在 FX_DEFS 注册即可）
| 文件名 | 技能id | 阶段 | 帧数 | 帧尺寸 | 帧率 | 循环 | 锚点类型 | pivot px | 混合模式 | 时长ms | 说明 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fx_ghost_shield_cast.png | ghost_shield | cast | 16 | 256×256 | 20 | 否 | caster | 128,128 | ADD | 800 | 幽灵盾施放：蓝紫幽光符印自脚下升起包裹主角；触发：施法即刻；命中点：主角卡中心；现用 fx_magic_shield_cast 着色 0xb08cff，缺图 fx.holyLight |
| fx_ghost_shield_loop.png | ghost_shield | loop | 12 | 256×256 | 11 | 是 | caster | 128,128 | ADD | 持续时间（30+10×技能等级+5×⌊道术/10⌋ 秒） | 幽灵盾持续：淡紫半透明护罩，跟随主角；现用 fx_magic_shield_loop 着色 |
| fx_holy_armor_cast.png | holy_armor | cast | 16 | 256×256 | 20 | 否 | caster | 128,128 | ADD | 800 | 神圣战甲术施放：金色甲片光环合拢；触发：施法即刻；命中点：主角卡中心；现用 fx_magic_shield_cast 着色 0xffd860，缺图 fx.holyLight |
| fx_holy_armor_loop.png | holy_armor | loop | 12 | 256×256 | 11 | 是 | caster | 128,128 | ADD | 持续时间（同上公式） | 神圣战甲术持续：金色护甲微光，跟随主角；现用 fx_magic_shield_loop 着色 |
| fx_mass_heal_burst.png | mass_heal | hit | 12 | 512×256 | 20 | 否 | caster | 256,220 | ADD | 600 | 群体治愈术：以主角为中心绿色治愈光环，横向覆盖 ±170px（1 卡）；触发：施法即刻；命中点：主角及范围内每个召唤物叠治愈光柱（逐个延迟 80ms）；现用每目标 fx_heal_pillar，缺图 fx.holyLight |

## #11 产出记录（特效 Bot，2026-10-31，分支 fx/mage-fx）
资源位于 public/assets/fx/，全部为 ADD 混合，按 1× 使用；帧尺寸和 pivot 从 JSON 读取。

| 文件 | 帧 | 帧尺寸 | pivot | fps | 触发 / 命中 |
|---|---|---|---|---|---|
| fx_big_fireball_fly | 6（循环） | 192×96 | 144,48 | 20 | 施法后 150ms 从法杖前端飞出（前置 fx_fireball_cast 复用） |
| fx_big_fireball_hit | 8 | 256×256 | 128,128 | 20 | 弹道到达，目标卡中心 |
| fx_burst_fire_blast | 10 | 512×256 | 256,200 | 20 | 前摇结束，首目标脚下；其余目标 +60ms 叠 hitspark |
| fx_hell_fire_line | 10 | 512×192 | 0,160 | 20 | 施法者前沿脚下，可 flip；火浪前锋 250ms 推进到约 440px |
| fx_lightning_flash_beam | 8 | 768×128 | 0,64 | 24 | 施法者前沿 cy，可 flip；第 1 帧（≈42ms）全部命中 |
| fx_hell_thunder_burst | 10 | 1024×384 | 512,320 | 20 | 施法者脚下；目标逐个 +50ms 叠 thunder_strike |

已知不足：
- 地狱火火焰偏低（约膝高）；疾光电影光束偏细。
- 爆裂火焰、地狱火、大火球飞行、地狱雷光环为「参考不足」，按通用风格制作。
- 伤害仍按原逻辑立即结算（done()），未与特效帧对齐。
## #12 产出记录（特效 Bot，2026-10-31，分支 fx/taoist-fx）
资源位于 public/assets/fx/，全部为 ADD 混合，按 1× 使用，不需要再着色。

| 文件 | 帧 | 帧尺寸 | pivot | fps | 循环 | 触发 / 命中 |
|---|---|---|---|---|---|---|
| fx_ghost_shield_cast | 16 | 256×256 | 128,128 | 20 | 否 | 施法即刻，主角卡中心；符印环自脚下升起后护罩张开，播完接 loop |
| fx_ghost_shield_loop | 12 | 256×256 | 128,128 | 11 | 是 | 跟随主角，持续 buff 时长 |
| fx_holy_armor_cast | 16 | 256×256 | 128,128 | 20 | 否 | 施法即刻；8 片金甲合拢，护罩成型，十字闪 |
| fx_holy_armor_loop | 12 | 256×256 | 128,128 | 11 | 是 | 跟随主角 |
| fx_mass_heal_burst | 12 | 512×256 | 256,220 | 20 | 否 | 主角脚下 (cx, y)；光环约 375ms 扩到 ±190px；每目标仍叠 fx_heal_pillar（间隔 80ms） |

缺图时的兜底：回落到 fx_magic_shield_* 着色，再回落 fx.holyLight。
已知不足：参考帧里没有这三个技能，造型为原创；loop 的幽光点在循环接缝处有轻微跳变。

## #诱惑之光（feat/charm，2026-10-31）
- 施放：`fx_charm_light`（目标身上粉紫色光环/心形光点，约 0.6s，单体）。未注册/缺失 → `playFx` 返回 null，回落 `fx.holyLight`（Graphics 圣光占位），不崩溃。
- 宠物标识：当前用卡面粉色着色 + 粉色等级字占位；需要 `ui_pet_badge`（卡面角标）时在 CardView 接入。
- 飘字：诱惑成功（粉）/诱惑失败（灰）/免疫（灰）/叛变（红），用现有 floatNumber，无需素材。
- 音效：复用 `shockwave`。

## 召唤物动作（feat/summon-anim）
现状：召唤骷髅/召唤神兽/诱惑之光宠物的攻击与受伤，复用主角/怪物同一套 CardView 动作（attack 事件 → `swing` 立绘前冲前倾 + `lunge` 整卡突进 18px；damage 事件 → `hit` 闪白→偏红、后仰压缩、整卡后退震动 + 受击火花 + 飘字）。无专用帧，缺素材不报错。
可选美术/特效交付（有则替换占位，命名放 `public/assets/fx/`，图集 png+json，帧名 `<key>_00..`）：
| key | 用途 | 尺寸/帧 | 混合 |
|---|---|---|---|
| fx_skeleton_claw | 骷髅挥砍弧（替代 Graphics 挥砍） | 256×256，8 帧 @20fps | ADD |
| fx_beast_bite | 神兽撕咬/爪击 | 256×256，8 帧 @20fps | ADD |
| fx_pet_hit_pink | 宠物攻击命中（粉色调） | 192×192，6 帧 @20fps | ADD |
| summon_skeleton_atk / summon_beast_atk | 立绘攻击姿势单帧（与现立绘同尺寸、同脚底锚点） | 同立绘，1 帧 | NORMAL |
| summon_skeleton_hurt / summon_beast_hurt | 立绘受击后仰单帧 | 同立绘，1 帧 | NORMAL |


## 合击英雄（feat/hj-battle 阶段 A，2026-10-31）
当前为 Graphics 占位，素材到位后在 FX_DEFS 注册即可：
- `fx_combo_<id>`：6 种合击各一套（id：pohun/huolong/shihun 等，见 src/data/companion.ts COMBOS）；占位 = 金色光环 + 「合击名」飘字 + 震屏
- 英雄召唤/收回光效（占位：复用 summon 事件）
- 怒槽「爆发中」闪烁 UI（占位：面板文字）
- 英雄立绘×3 职业（现复用主角职业卡面）
## 召唤物动作 产出记录（特效 Bot，2026-10-31，分支 fx/summon-fx）
| 文件 | 帧 | 帧尺寸 | pivot | fps | 混合 | 触发 / 位置 |
|---|---|---|---|---|---|---|
| fx_skeleton_claw | 8 | 256×256 | 40,128 | 20 | ADD | 骷髅（summon_skeleton）attack 事件，攻击者前沿 (x+dir·(w/2+6), cy−10)，朝左 flip；替代 fx.slash |
| fx_beast_bite | 8 | 256×256 | 128,128 | 20 | ADD | 神兽（summon_beast）attack 事件，目标卡中心；约第 3 帧（150ms）咬合 |
| fx_pet_hit_pink | 6 | 192×192 | 96,96 | 20 | ADD | 诱惑之光宠物（pet）attack 事件，目标卡中心 |

- 按 1× 使用；缺图或超出特效上限时退回原 fx.slash，不报错。
- 宠物按 unit.pet 判断（优先于骷髅/神兽）；pet 原本是被诱惑的怪物，id 不是 summon_*。
- 已知不足：三者都参考不足，造型为原创；atk/hurt 立绘单帧不在本次范围内。

## 阶段 B 合击特效（fx_combo_<id>；未出图前用现有 Graphics 占位，不报错）
所有：PNG 序列帧，加色混合 ADD，播放 0.6s（12 帧 @20fps），以目标为锚点；伤害结算在第 6 帧（0.3s）。
| key | 合击 | 尺寸 | 帧数 | 混合 | 命中范围示意 |
|---|---|---|---|---|---|
| fx_combo_pohun | 破魂斩（战战） | 512×256 | 12 | ADD | 以目标为圆心 ±180px 横扫，红色刀光 |
| fx_combo_huolong | 火龙气焰（法法） | 768×384 | 14 | ADD | 以目标为圆心 ±300px 火龙盘旋 |
| fx_combo_shihun | 噬魂沼泽（道道） | 640×192 | 12 | ADD+循环尾 | 地面 ±250px 绿色毒沼，尾段可循环 10s |
| fx_combo_leiting | 雷霆一击（战法） | 256×512 | 10 | ADD | 单体，竖向落雷 |
| fx_combo_mori | 末日审判（法道） | 384×384 | 12 | ADD | 单体，紫色法阵+持续 8s 小循环 |
| fx_combo_pixing | 劈星斩（战道） | 384×384 | 10 | ADD | 单体，星形斩击+麻痹电弧 3s |

### 阶段 B 合击特效 产出记录（特效 Bot，2026-10-31，分支 fx/combo-fx）
| 文件 | 帧 | 帧尺寸 | pivot | fps | 混合 | 触发 / 命中 |
|---|---|---|---|---|---|---|
| fx_combo_pohun | 12 | 512×256 | 256,128 | 20 | ADD | combo 事件，目标卡中心 (t.cx,t.cy)；第 6 帧剑气交叉爆裂 |
| fx_combo_huolong | 14 | 768×384 | 384,200 | 20 | ADD | 同上；第 6 帧火龙收拢炸开 |
| fx_combo_shihun | 12 | 640×192 | 320,72 | 20 | ADD | 同上，毒沼铺在目标脚下；帧 8–11 可循环作 10s 尾段（当前只播一次） |
| fx_combo_leiting | 10 | 256×512 | 128,400 | 20 | ADD | 同上；第 6 帧雷暴最强 |
| fx_combo_mori | 12 | 384×384 | 192,192 | 20 | ADD | 同上；第 6 帧双龙爆裂；帧 8–11 法阵可循环作 8s 尾段（当前只播一次） |
| fx_combo_pixing | 10 | 384×384 | 192,192 | 20 | ADD | 同上；第 6 帧星芒最亮，之后麻痹电弧 |

- comboFx：有图播图，缺图仍走金环 Graphics；「合击名」飘字和震屏两种情况都保留。
- 原作合击帧「未查到」；box 参考视频帧中无合击画面，「参考不足」。形态只依据 21cq.com/chuanqi/743.html、百度百科「合击」的文字描述，原创绘制。
- 已知不足：shihun/mori 的循环尾段、pixing 的 3s 麻痹需要逻辑侧另外播放循环/状态，本次未接；huolong 用的是横向盘旋（照规格 ±300px），不是具象龙形。

## 阶段 B #9 魔龙教主 / 魔龙血域美术需求（立绘已到位：boss_molong_full.png（108d607），魔龙教主与魔龙守将 boss_hj_home 均指向 boss_molong，紫色 tint 占位已移除；背景 bg_floor24 缺图走现有回退）
| key | 内容 | 规格 |
|---|---|---|
| boss_molong | ✅ 已交付（108d607，feat/m4-monsters 接入）魔龙教主立绘：人形魔龙，背后巨翼（国服只用翅膀近战，21cq） | 与现有 boss_* 同规格 PNG 透明底，朝左，脚底锚点 |
| fx_molong_blink | 瞬移：原地黑紫烟散 + 主角身后现身 | 256×256，8 帧，ADD，0.4s |
| bg_floor24 | 魔龙血域背景（血红熔岩城寨） | 与 bg_floor* 同尺寸 |

## M4 新怪美术/特效缺口（feat/m4-monsters）
立绘 8 张已到位（yeti_king / rake_cat_king / orc_commander / evil_lich / huangquan_master / hawk_guard / twinhead_kong / twinhead_blood）。以下为缺口，当前用回退：
| key | 内容 | 当前占位 | 规格 |
|---|---|---|---|
| bg_floor81 | 白日门·雪域背景（雪原、冰封村落） | 复用 bg_floor5.jpg | 与 bg_floor* 同尺寸 |
| bg_floor82 | 骨魔洞五层背景（骨洞、黄泉祭坛） | 复用 bg_floor4.jpg | 同上 |
| bg_floor83 | 恶魔祭坛背景（赤月峡谷祭坛） | 复用 bg_floor8.jpg | 同上 |
| fx_huangquan_fireball | 黄泉教主火球（绿/黑色冥火） | 复用祖玛教主 fireball | 256×256，8 帧，ADD |
| fx_twinhead_petrify | 双头金刚麻痹/石化（机制未实装，需先有怪物控制主角机制） | 无 | 256×256，8 帧 |
| fx_twinhead_blood_bolt | 双头血魔闪电（血红色） | 复用沃玛教主 spark | 256×256，8 帧，ADD |
| map_node_gumo / map_node_altar | 区域小地图入口图标 | 复用现有节点图标 | 与 map_node_* 同规格 |
