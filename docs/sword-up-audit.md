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
- 需修共 13 张（不含未引用的 warrior_full_old）：战士批 4 张（已完成）；法师批 3 张；道士批 4 张；召唤骷髅攻击帧 1 张（待确认）；另 warrior_full_old 1 张未引用。

## 战士批做法
- warrior_full.png：以原图 + 法师立绘为参考重绘，只改持剑手：剑改竖握、剑尖朝上、贴在身体左侧（画面左），不遮脸；proc.py 抠图后缩回 856×857 RGBA。注意：持剑手由画面右侧换到了画面左侧。
- 三把战士武器层：为保持与 body.png 手位对齐，未重绘，而是以拳心为轴把剑身旋转为近竖直（向外倾约 12°）、拳头像素保留原样，剑柄从拳中穿过、剑首在拳下。手臂仍是 body.png 的前伸姿势（body 层未改）。
- 旧图备份：docs/sword-up-preview/old/；对比图：docs/sword-up-preview/*_compare.png。
