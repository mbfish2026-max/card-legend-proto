# 血石容量显示（feat/stone-capacity-ui，未合 main）

需求（魔兽转用户）：每块血石都显示「剩余/总容量」，装备栏血石格、背包里的血石、悬浮提示都要有，电脑版和手机版都要。

## 数据
- 只读现有字段 `InvItem.charge = { hp, mp }`（购买时由 `makeShopItem` 写入）与 `BLOODSTONES` 的总量；不改 `World.tickStone`、不改战斗数值。
- 小血石只补红（`World.STONE_S.mp = 0`），所以只显示红一行；中/大/特显示红、蓝两行。
- 异常值钳制到 [0, 总量]。旧存档里没有 `charge` 的血石：`tickStone` 本来就不会补给，所以如实显示 `0/总量` 并按耗尽处理，不报错；存档格式不变。
- 代码：`src/ui/stoneCap.ts`（纯函数 `fmtCap / stoneCap / isStoneEmpty / fmtPool / stoneSig / stoneTipLines`）。

## 显示
- 格子（装备栏、背包、仓库共用 `Panel.slotBox`）：格子下部按行显示 `剩余/总`，红 `#ff9090`、蓝 `#90c0ff`；图标缩小并上移，文字不压图标、不出格（e2e 量过包围盒）。文字太宽时等比缩小。
- 数字格式 `fmtCap`：<1000 原样；1000–99,999 保留一位小数 k（`1.2k`、`19.9k`、`20k`）；100k–999k 取整 k（`120k`、`300k`）；≥1M 用 M。剩余量**向下取整**，所以没满时不会显示成满（19997 → `19.9k`）。
- 提示框：`红储量 剩余/总`（蓝同理，精确到个位），小血石多一行「小血石只补红」。手机点一下装备栏/背包血石即显示，桌面悬停显示。
- **耗尽提示（选定方案）**：某一池为 0 时那行数字变红 `#ff4040`；全部池为 0（小血石看红）时，图标变灰（tint 0x555555、半透明），图标上叠红色「耗尽」，提示框加「储量耗尽（不再补给）」。中/大/特只有一池为 0 时不算耗尽，只把那行标红。

## 实时更新与点击时序
- `Panel.statSnap()` 拼入 `stoneSig(装备栏血石, 背包)`；只有储量数值变化时快照才变，才走 `refreshIfStale` 重绘。
- 原有保护全部保留：有选中物品（`sel`）、按下 800ms 内（`lastDown`）、两次自动重绘间隔 <800ms 时都不重绘；重绘后仍 `flushInput`。e2e 直接断言了这三种情况，以及「变化只重绘一次」。

## 点击区
- 未改格子尺寸与 `slotHitSize`。实测（e2e stone-capacity-verify）装备栏最小点击区：1280×720 桌面 48 CSS px；844×390 / 874×402 / 932×430 手机均为 44.0 CSS px。

## 测试
- 单测 `tests/stone-capacity-ui.test.ts`（已加入 npm test）：格式化、变化检测、耗尽判定、真实 tickStone 消耗后签名变化、存档往返、旧档无 charge。
- e2e `tests/e2e/stone-capacity-verify.mjs`：四个尺寸；截图 `docs/shots/stone-capacity-ui/<尺寸>-{equip-bag,tip-equip,tip-empty,equip-empty}.png`。

## 已知限制
- 手机上格子里的数字约 7–9 CSS px，偏小；精确值看提示框。
- 桌面悬停提示打开时如果储量变化，面板重绘会关掉提示（与经验变化时的旧行为一致），需重新悬停。
- 背包血石在已装备血石时会走「对比」提示框，容量行作为附加行显示；没有并排显示已装备血石的容量。
