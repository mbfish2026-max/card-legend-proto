# 地图总览 + 位置条（feat/balance-sys）
分工：**总览 = 本层信息**（本文）；世界地图 = 全局导航（见 docs/world-map-plan.md）。
数据：`src/data/mapOverview.ts`（纯函数，tests/map-overview.test.ts）。
## 总览面板（点右上角层名打开，再点/✕ 关闭）
| 字段 | 来源 |
|---|---|
| 地图名 | `FLOORS[i].name` |
| 主线第 N / 39 张 | `FLOOR_ORDER`（侧线显示「侧线地图」） |
| 多层洞穴 第 N / 总层 | 地图组数据 `Floor.group/depth` + `FLOOR_GROUP`，总层 = 同组 depth 最大值；无组显示「单层地图」 |
| 推荐等级 | `FLOOR_TARGET_LV[i]`（适配曲线，非官方） |
| BOSS / 精英 / 怪物 | 本层 spawns 按 `ENEMIES.tier` 去重 |
| 左端 | 与 `World.backGate` 同规则：区域首层/第 1 层回城镇（银杏村等），其余回上一层 `prevFloorOf` |
| 右端 | `nextFloorOf` 下一层；侧线 = 肃清后回 `returnTownOf`；无下一层 =「已到尽头」 |
## 位置条
整层宽 `floorWidth(f)`；左端=出生/回程门（蓝），右端=出口（绿），红三角=BOSS 刷新 x，白点=主角。
距出口或起点 ≤1 屏（1280px）时该端高亮并显示：「前方：下一张地图 X」/「前方：肃清后返回 X」/「前方：已到尽头」/「后方出口：回 X」（第 1 层「回小村 银杏村」）。城内与自定义层表隐藏。
## 摆位与重叠
- 桌面：牌匾 (1130,36) 可点；条 x1000–1260 y102–120，提示右对齐 y128，在怪物图标行（y≤101）之下。
- 手机：`#mh-floor` 改可点（min 44px 高），条 `#mh-pos`（200×12，top+22）与提示 `#mh-posT`（12px，top+36）在其内，合成块与 `#mh-top/#mh-bars/#mh-log/按钮` 不相交。
- 重叠检查：tests/e2e/map-overview-shots.mjs（两种视口都断言 hits=[]，并点名打开/✕ 关闭），截图 map-overview-{posbar-start,posbar-end,panel}-{1280x720,844x390}.png。
