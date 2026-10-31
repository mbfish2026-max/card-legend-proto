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
