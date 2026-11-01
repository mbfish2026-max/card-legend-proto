# 持剑姿势盘点（sword-up）

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

## 汇总
- 需修共 12 张（不含未引用的 warrior_full_old，含则 13 张）：战士批 4 张（已完成）；法师批 3 张；道士批 4 张；召唤骷髅攻击帧 1 张（待确认）；另 warrior_full_old 1 张未引用。

## 战士批做法
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

### 分层重画样张（战士木剑，待确认）
- 用户反馈 171f568 手部糊成一团、护手像贴上去、剑柄未穿过手心，改为分层合成，仅出样张，正式武器层未改。
- 部件：单独生成「握竖直圆棍的拳头」（四指自上而下包握、拇指压在食指/中指上）和「不带手的竖直木剑」；剑拆为剑身+护手、剑柄（按拳高平铺加长）、剑首。
- 合成（自下而上）：整把剑 → 拳头（去掉棍的像素，让剑柄从指缝透出）→ 拳头上沿以上的剑柄+护手+剑身。剑柄从拳头上下两端穿出，护手在拳头上方不压手；按棍的倾角（约 9°外倾）旋转。缩放 0.48 贴到 body.png 原拳位置，body 未改，1024×1024。
- 样张：docs/sword-up-preview/sample_warrior_wood.png、sample_warrior_wood_3x.png；部件与脚本：docs/sword-up-preview/sample_src/。
