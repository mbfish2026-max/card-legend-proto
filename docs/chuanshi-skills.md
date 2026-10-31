# 传世（传奇世界）独有技能整理

## 「传世」指哪个游戏
- 判定：**传奇世界**（盛大自研、2003 年上线的 2D MMORPG，与《热血传奇》平行，非升级版）。依据：本仓库 art/sq-mir3 已将将军坟、机关洞、五蛇殿、逆魔古刹等地图标为「传世」，这些均为传奇世界地图；社区（5woool 论坛）通用「传世」简称。来源：[https://bbs.5woool.com/forum.php?mod=viewthread&tid=11396](https://bbs.5woool.com/forum.php?mod=viewthread&tid=11396)、[无度游对比文](http://www.wuduy.com/html/jishuwenzhang/chuanqi/214699.html)
- 其它候选（未采用）：传奇世界3D / 传世手游、私服「传世」版本。技能以端游 1.x 版本 DB 表为准。

## 技能清单
数据来源：传奇世界 DB 技能表 [https://www.cywlsoft.com/thread-27-1-1.html](https://www.cywlsoft.com/thread-27-1-1.html)（技能 id 44、46–65，确认存在）；效果描述来源标注于「来源」列，未查到的效果标「未查到/推测」。重叠栏对照 src/data/classes.ts 现有 id 和 art-requests F/I 章图标。

| 图标 id | 名 | 职业 | 效果 | 外观要点 / 特效要点 | 来源 | 与现有技能重叠 |
|---|---|---|---|---|---|---|
| thunder_sword | 雷霆剑 | 战士 | 烈火剑法分支，对不死系额外加成，CD 比烈火短、伤害略低 | 剑身缠蓝白雷电；特效：剑落时一道落雷 | [5woool](https://bbs.5woool.com/forum.php?mod=viewthread&tid=11396) | 与 fire_sword 同定位（二选一分支），id 不重复 |
| break_strike | 破击剑法 | 战士 | 单体破甲重击（DB：36 级习得）；效果细节未查到/推测 | 剑尖刺碎甲片、金色火花；特效：命中爆碎片 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) | 无 |
| shield_break | 破盾斩 | 战士 | 有概率击破目标魔法盾并造成伤害 | 重剑劈碎蓝色护盾；特效：盾形碎裂 | [145z](http://games.145z.com/html/chuanqishijie/jishujiaocheng/33043.html) | 无（克制 magic_shield） |
| vajra_body | 金刚护体 | 战士 | 自身防御增益（DB：41 级）；数值未查到/推测 | 金色菱纹护体光；特效：全身金光罩 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) | 近似 holy_armor（道士），id 不重复 |
| dash_slash | 突斩 | 战士 | 高速冲向目标造成伤害+位移 | 冲刺残影紫色刀光；特效：拖尾残影 | [145z](http://games.145z.com/html/chuanqishijie/jishujiaocheng/33043.html) | 近似 rush（野蛮冲撞），id 不重复 |
| ice_arrow | 冰箭术 | 法师 | 雷电术分支，对生物系/玩家加成，施法更快 | 冰晶箭+霜尾；特效：命中冰花 | [5woool](https://bbs.5woool.com/forum.php?mod=viewthread&tid=11396) | 与 thunder 同定位分支 |
| ice_dragon | 冰龙破 | 法师 | 直线冰龙穿透（DB 参数同疾光电影）；效果为推测 | 冰龙头破冰而出；特效：冰龙直线冲出 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 近似 lightning_flash |
| frost_blade | 玄冰刃 | 法师 | 冰系攻击（DB 参数同疾光电影）；效果未查到/推测 | 新月形冰刃旋转；特效：冰刃飞旋 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 未查到/推测 | 无 |
| five_thunder | 五雷轰 | 法师 | 多道落雷范围攻击（DB：34 级）；具体范围未查到/推测 | 五道金色雷柱；特效：五点落雷 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 近似 hell_thunder |
| ice_whirl | 冰旋风 | 法师 | 冰系范围旋风（DB：37 级）；效果推测 | 冰晶龙卷；特效：旋风持续伤害区 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 近似 ice_roar |
| drive_corpse | 赶尸 | 道士 | 召唤骷髅分支，把怪物尸体变成宝宝（尸灵），属性高于骷髅 | 贴符跳尸、绿光；特效：尸体起身 | [5woool](https://bbs.5woool.com/forum.php?mod=viewthread&tid=11396) | 与 summon_skeleton 同定位分支 |
| decoy_talisman | 替身法符 | 道士 | 召唤替身吸引怪物（DB：20 级）；效果推测 | 稻草人贴黄符；特效：替身出现 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 无 |
| soul_wall | 灵魂墙 | 道士 | 生成阻挡墙（DB：28 级）；效果推测 | 紫色灵气墙；特效：竖起光墙 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 无 |
| clear_mind | 道心清明 | 道士 | 被动/自身增益（DB：30 级，无耗蓝）；效果未查到/推测 | 打坐+白莲光晕 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 未查到/推测 | 近似 spirit_force（被动） |
| holy_light | 神光术 | 道士 | 神圣光攻击/驱邪（DB：36 级）；效果推测 | 金色天降光柱；特效：光柱落下 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 部分推测 | 无 |
| cleanse | 解毒术 | 道士 | 解除中毒状态（DB：38 级） | 手托毒滴化清水 | [DB](https://www.cywlsoft.com/thread-27-1-1.html) 据名称 | 无 |

未做图标的传世技能（与现有重叠或资料过少）：诅咒术、风火轮、战魂真悟、乾坤一掷、冰霜雪雨、凝血离魂、兽灵术、天仙咒、阴阳法环、施毒大法（来源 145z，版本差异大，存疑）。

## 图标
- 文件：`public/assets/skills/skill_<id>.png`（64×64）+ `skill_<id>@2x.png`（128×128），RGBA，原创绘制，带暗钢斜边框，与现有图标风格接近。
- 预览：`docs/art-gap-preview/chuanshi_skills.jpg`
- 未做特效，仅列特效要点。
