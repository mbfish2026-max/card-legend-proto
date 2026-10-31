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
