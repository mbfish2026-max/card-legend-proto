# 地面光环 · 友方目标（feat/ground-aura-ally）设计

## 1. 现状调查（origin/main 29dcf25）

| 技能 | 职业 | 现施放目标 | 现范围 | 代码 |
|---|---|---|---|---|
| 神圣战甲术 holy_armor | 道士 | **仅主角** | 无 area（不看范围） | World.cast buffStat 分支，注释「官方 5×5 友方；21cq 资料称宝宝不受益 → 只作用于主角」 |
| 幽灵盾 ghost_shield | 道士 | **仅主角** | 同上 | 同上 |
| 金刚护体 vajra_body | 战士 | 仅自身 | — | buffBoth 分支 |

- 道士**不能**给友方召唤物（骷髅/神兽/宠物）或合击英雄（companion）加防/魔御：这是有意的适配（skills-official.md #12 [适配]1）。
- 施放：`cast()` → 校验耗魔/冷却 → buffStat：若主角 `defUpUntil/mdefUpUntil > now` 则「持续中」无效（不扣魔、不进冷却）→ 写 `defUp/mdefUp = taoBuffValue(人物等级)`、`…Until = now + taoBuffDur(技能等级, 道术)`、`auraSkill`。
- 生效：`mitigate` 读取**目标单位**的 defUp/mdefUp，对任何 Unit 通用（召唤物带上字段即可生效）。
- 自动施法：`autoCast` / 模拟每 tick 对全部技能 `cast(i,{auto:true})`；主角持续中即被拒，所以不会刷屏。
- 合击英雄 AI（World ~1300）：只有普攻/简单治愈术（固定 8 魔），**不会施放**神圣战甲术/幽灵盾。
- 换图：`loadFloor` 保留 hero/summon/companion 单位并重定位，buff 字段与 world.time 连续；上一任务 `GroundAuras.endAll` 换图后**抑制**光环直到重施——本任务改为恢复显示。

## 2. 官方规则（docs/skills-official.md）

- 幽灵盾、神圣战甲术：「5×5 友方」（来源 C 21cq 技能表，L62–63、L157–158）。
- 21cq 600 号文称「宝宝不受加成」（L153）——与「友方含宝宝」说法**冲突**；本任务按需求取「5×5 友方含召唤物、合击英雄」，冲突在此记录。
- 金刚护体：自身增益（L434），**保持仅自身**，不扩展。
- 5×5 换算为像素：未查到官方像素值；按本作群体治愈术 3×3 = area 170 等比，5×5 ≈ 170×5/3 ≈ **280**（半径，以施法者为中心）。[适配]
- 重复施放/叠加：官方未查到；沿用本作规则：同一单位不叠加，只刷新。

## 3. 方案

1. holy_armor / ghost_shield 增 `area: 280`；目标 = 主角 + 280 内存活的召唤物 + 合击英雄。
2. 「持续中」判定改为：范围内**全部**目标都已有该 buff 才拒绝（不扣魔/不冷却）；否则施放，给所有范围内目标写同值（刷新时长，不叠加数值）。耗魔/冷却/数值不变。
3. 自动施法优先级：主角缺 buff → 施；否则有宠物/英雄缺 buff → 施；全部有 → 不施（与 2 一致，天然不浪费魔）。
4. 光环：`GroundAuras.sync` 已对所有 view 按 `auraSkill`+buff 状态驱动 → 给受益单位写 `auraSkill` 即显示；单位死亡/消失/buff 结束销毁。
5. 换图：`endAll` 去掉 suppress，仅销毁旧 sprite；新图首帧 sync 按未过期 buff 重新创建。
6. 风险：道士召唤物更硬 → 9 种子对比；若明显变强，报告+建议，不悄悄削数值。
