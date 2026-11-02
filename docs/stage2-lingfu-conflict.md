# 阶段2 × 灵符商城（stone 栏）冲突说明与布局方案

状态（2026-11-02 04:0x UTC+8 fetch）：origin/main（e3f73de）**未含** stone 栏；灵符商城在 origin/feat/lingfu-combat（5958141 系列）。按合并顺序：灵符先发，本分支 merge 最新 main 之后再落地下方布局。本分支未合并 lingfu-*。

## 冲突点
| 文件 | 本分支（feat/drop-realign） | lingfu-combat | 处理 |
|---|---|---|---|
| src/combat/types.ts Slot/EquipSlot | 末尾加 `'belt'` | 末尾加 `'stone'` | 文本冲突；合并后两者都保留：`… 'boots' \| 'belt' \| 'stone'` |
| src/data/items.ts SLOTS/EQUIP_SLOTS/名称表 | 加 belt/腰带 | 加 stone（并改 equipSlotsFor 等） | 两者都保留 |
| src/ui/Panel.ts 装备栏坐标 | `belt: [Rx, y0+dy*2]` | `stone: [Rx, y0+dy*2]` | **同一格位置冲突**，见下方案 |
| src/combat/World.ts migrateEquip | 加「衣服位靴子→boots」 | 周边有改动（行号偏移） | 逻辑无交叉，按块保留 |
| e2e/截图基线 | 新增 belt 栏 | 新增血石空槽底图 | 合并后重拍 |

## 布局方案（合并后落地）
现状每列 5 行（dy=58，60px），右列第 3 行空位只有一个，belt 与 stone 抢同一格。
- 桌面 1280×720：两列各 6 行，dy 58→50、格子 60→48（点击区仍 ≥44 CSS px，用 slotHitSize 扩到行距）。
  - 左：头盔/项链/武器/左手镯/左戒指/**腰带**
  - 右：衣服/靴子/**血石(stone)**/右手镯/右戒指/(空，预留)
  - 末行底边 y0+5·50+24 = top+354，需要把属性文字下移约 12px（或属性区缩行距），验收以截图不压字为准。
- 手机 844×390（面板缩放 mscale）：同坐标系，验收点击区 ≥44 CSS px（rowHitHeight/slotHitSize），不足时改为装备栏 3 列（左 4/中立绘/右 4 + 底部一行 腰带/血石 横排）。
- 空栏底图：stone 用灵符的 bloodstoneSlot；belt 待美术空栏底图（已列 art-requests），到图前用通用 slotBg。

## 迁移
两边都只“加栏位”，旧存档无 belt/stone 字段即空栏；本分支另有衣服位靴子→boots 迁移（单测 tests/belt-boots.test.ts）。EQUIP_VERSION 两边都未改，合并后保持 2。
