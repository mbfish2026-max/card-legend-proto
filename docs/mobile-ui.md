# 手机网页版界面（feat/mobile-ui）

自动识别：`src/mobile.ts` 的 `detectMobile`（UA + 触屏 + 小屏）→ `IS_MOBILE`。手机浏览器用本界面，电脑浏览器用原界面（不变）。
`?mobile=1` 强制手机版，`?mobile=0` 强制电脑版；竖屏显示「请横屏」。

实现：`src/ui/MobileHud.ts` 是 DOM 覆盖层（CSS 像素，`env(safe-area-inset-*)`，pointer 事件多点触控）。所有动作只转发给 `BattleScene.onKey(k)` 和摇杆 dx/dy，不复制游戏逻辑。
手机模式下 Phaser 版 HUD（大血球、底栏、圆形菜单、左上日志、楼层怪物格）隐藏，旧的「映射」虚拟键盘（VirtualPad）不再创建。面板（Panel/SettingsView）在手机上整体放大 1.2–1.28 倍，字号下限 18/20 逻辑 px（≈12px），关闭键 ≥44px。

## 桌面功能 → 手机入口

| 桌面功能（键位/按钮） | 手机入口 |
|---|---|
| 左右移动 ←→/A D，上下 ↑↓ | 左下浮动摇杆（左下区域任意处按下即出现，平时只在角落留 56px「移动」提示） |
| 角色/背包 B/C/I、圆形「角色」 | 右上「角色」 |
| 技能 K、圆形「技能」 | 右上「技能」 |
| 悬赏 Q、圆形「悬赏」 | 右上「悬赏」 |
| 地图 M | 右上「地图」 |
| 设置 Esc、圆形「设置」 | 右上「设置」 |
| 静音 N | 设置面板「静音」 |
| 回城 / 回上一层 S（场景内「回xx城 [S]」牌子） | 右上「回城」（唯一入口；场景牌子只做提示，去掉 [S]） |
| 传送门/门面/NPC W/空格；城里商人 T（= townUse） | 右下大键「进入」（城里显示「对话」）。商人和传送合并到这一个键 |
| 商店圆形按钮（战斗地图只提示「没有商人」） | 不单列（城里走到商人处点「对话」） |
| 技能 F1–F8/数字键、底栏技能格 | 右下技能弧（内圈 4、外圈 ≤6，用原技能图标，冷却扇形+秒数，蓝不够半透明；被动技能不放） |
| 自动战斗/自动施法开关（设置） | 技能弧上方「自动 开/关」 |
| 药水 1–4 | 技能弧左侧 4 个药水格（显示数量） |
| 合击 R/E/G | 有合击伙伴时出现在药水上方：召唤/状态/合击 |
| 血球/蓝球、经验条、Lv/金币 | 左上细条 HP/MP/EXP（带数字）+「职业 金币」 |
| 左下战斗日志 | 左上可折叠日志（默认 3 行，点开显示全部 6 条） |
| 右上楼层名+怪物格 | 顶部居中「楼层名 怪 剩余/总数」 |
| 装备对比、整理、黑铁强化 | 角色面板内原功能（手机点一下选中显示对比提示，再点执行） |

## 验证
`npm run build && node tests/e2e/mobile-ui-verify.mjs [截图目录] [main 的 dist]`：
- 844×390、932×430、1024×470、667×375 四种横屏。
- 检查触控区 ≥44、在视口内、互不重叠、无重复入口、主角不被遮挡。
- 摇杆移动加多点触控（按住摇杆同时点技能）。
- 各面板打开、字号、关闭键。
- 竖屏提示、`?mobile=0`、桌面 1280×720 与 main 的对象清单和像素对比。

未在真机（iOS Safari / Android Chrome）测试，只用 Chromium 的触屏模拟验证。

## 铺满方案（feat/mobile-fill）
- **尺寸**：手机模式（IS_MOBILE）读取 `visualViewport.width/height`，缺省时用 innerWidth×innerHeight。
  - 逻辑宽 `lw = clamp(round(720 × w / h), 1280, 2016)`，逻辑高恒为 720。
  - 画布为 `lw·k × 720·k`，Phaser `Scale.FIT` 等比铺满。
  - 在 resize、orientationchange 和 visualViewport resize 时调用 `applyFill()`，内部用 `scale.setGameSize` 加 `refresh`。iPhone 地址栏展开（844×345 → lw 1761）和收起（844×390 → lw 1558）都会实时重排。
- **战斗**：相机宽度改为 lw，能看到更多场景；World 坐标、碰撞、怪物位置都不变。相机边界仍由 `setBounds(0,0,层宽,720)` 夹紧，Phaser 按新相机宽度计算。背景本来就沿整层镜像平铺。
- **非跟随相机**（标题、UI 面板）：`centerOn(640,360)`，1280 内容居中，`Render.ox = (lw − 1280) / 2`。
  - 两侧露出延伸背景：标题背景按 2016 宽铺满并裁切，面板遮罩为 2016 宽。
- **屏幕固定物体（sf0）**：统一用 `fixedShiftX() = (k−1)·lw/2 + ox` 补偿。hdFixed 会记下 `__hx`；main.ts 每帧对 sf0 物体增量修正，宽度变化后也会跟着改。
- **暗角**：按 ox 画到真实屏幕边缘；远景 tileSprite 和渐变按 2016 宽绘制。
- **输入**：Phaser 指针自动换算；Panel 自己的拖动/滚轮用 `toLogicX`，已扣除 ox。
- **安全区**：手机模式下 #game 不再加 padding，画布铺到刘海下面。HUD 按钮是 DOM，用 `env(safe-area-inset-*)`（--sl/--sr/--st/--sb）避开刘海。
- **电脑**：lw 恒为 1280，代码路径和 main 相同；1280×720 截图与 main 的差异为 0.03%（≤0.1%）。
- **验证**：
  - `node tests/e2e/mobile-fill-verify.mjs` 覆盖 932×430、844×390、1024×470、667×375、844×345（地址栏展开 → 收起）、932×380（地址栏展开 → 收起），以及 844×390 加刘海 47/47/21（CDP Emulation.setSafeAreaInsetsOverride）。
  - 检查项：画布铺满、逻辑宽、等比、两侧不是纯色黑边、HUD 避开刘海、无报错。
  - 截图在 /workspace/shared-mobile/shots/mf-*.png。
- **未验证**：iPhone 真机 Safari（刘海实测、地址栏动画过程中的抖动）；首次触摸才切成手机模式的设备要等下一次 resize 才会铺满。

## 入口对照表（电脑按键 ↔ 手机触屏）

| 入口类型 | 位置/条件 | 电脑触发 | 手机触发 | 去向 | e2e |
|---|---|---|---|---|---|
| 右端出口传送门 | 本层右端 `atExit` | W / 空格（或走入，需「按键进门」关闭时） | 右下大键显示「进入」并高亮；或直接点传送门本体 | 下一层（`nextFloorOf`） | ✅ 两种 |
| BOSS 门 | BOSS 层出口，首领存活 | 同上（提示封印） | 大键显示「封印」不高亮，点击只提示；击杀后变「进入」 | 下一层 | ✅ |
| 返回上一层 | 非区域首层，左端起点 | S | 大键显示「上一层」并高亮（顶栏「回城」也发 S） | 上一层出口前 | ✅ |
| 回城口（左端） | 第 0 层或区域首层左端 | S / 点回城商人 | 大键显示「回城」；或点回城商人；顶栏「回城」 | 所属城镇 | ✅ |
| 侧线 / 异界裂隙出口 | 侧线层右端 | W / 空格 | 大键「进入」 | 回城 | ✅ |
| 侧线 / 裂隙入口 | 地图面板中的洞穴节点（无关卡内门） | M → 点节点 | 顶栏「🗺 传送」→ 点区域 → 点节点 | 该层 | ✅ |
| 城门 | 城内西端 | W / 空格 / T | 大键显示「出城」；点城门 | 区域首层 | ✅ |
| NPC 门面（含传送员/老兵） | 城内店门口 | W / 空格 / T；点门面 | 大键「对话」；点门面；面板内点「传送」 | 面板 / 目标层 | ✅ 传送员 |
| 传送面板 | 任意（战斗中禁用） | M | 顶栏「🗺 传送」（原「地图」改名） | 已到达层 | ✅ |
| 回城卷轴后传送 | 卷轴未实现 | — | 预留：`BattleScene.entranceHere()` 增加分支、`mobileAct()` 分发即可，大键文字自动跟随 | — | 未实现 |

修复的缺口：①「进入」键原来只发空格，左端回城/上一层在手机上只能靠顶栏「回城」且无提示 → 改为按 `entranceHere()` 上下文执行并显示去向、在范围内高亮；② 传送门本体不可点 → 手机端可点（电脑不加交互）；③ 顶栏无「传送」字样 → 地图图标改名「传送」。
验证：`node tests/e2e/mobile-entrance-verify.mjs`（844×390 触屏，截图 me-*.png）。

## PWA / 添加到主屏幕全屏（feat/pwa-fullscreen）
- 元数据（index.html）：
  - `viewport-fit=cover`、`apple-mobile-web-app-capable=yes`、`mobile-web-app-capable=yes`、`apple-mobile-web-app-status-bar-style=black-translucent`；
  - `theme-color` 为 #000；
  - `apple-touch-icon` 180×180。
- `public/manifest.webmanifest`：
  - `display: fullscreen`，`display_override` 为 `[fullscreen, standalone]`；
  - `orientation: landscape`；
  - `start_url`、`scope`、`id` 都是 `/card-legend-proto/`（与 vite build 的 base 一致；HTML 里的 /xxx 链接由 vite 自动加 base）。
- 尺寸：
  - html 依次回退 `100dvh → 100svh → -webkit-fill-available`；body 和 #game 用 `position:fixed; inset:0`，背景 #000。
  - 手机模式下 #game 不留 safe-area 内边距，画布和场景背景铺到物理屏幕边缘（含刘海/圆角区域）。只有 HUD（#mhud）用 `env(safe-area-inset-*)` 避让。
  - 不依赖 screen.height。
- 用户截图（画面约 60% 高、四周黑边）的根因，已用 e2e 在 main 上复现：
  1. 旧设置里的手动缩放（`zoomAuto=false`、zoom≈0.85）在手机上也给画布加了 `transform: scale(z)`，铺满后的画布被缩小，四周露出 #game 背景。修复：手机上一律按 1 渲染；存档里的缩放值保留，回到电脑上仍生效。
  2. iOS 独立模式启动或旋转后，`visualViewport` 可能停在旧的竖屏尺寸，逻辑宽被算成 1280（16:9）。修复：以 `innerWidth/innerHeight` 为准，只有 visualViewport 同宽且未缩放时才取较小的高（浏览器地址栏的情况）。
  3. 重排时机补全：在 `pageshow`、`visibilitychange`（回到前台）、`orientationchange`、`screen.orientation change` 时重排，并在 0/120/400/1000/2000ms 多次重算；游戏 ready 后也重算一次。
- 验证：`tests/e2e/pwa-fullscreen-verify.mjs`，截图在 `/workspace/shared-mobile/shots/pwa-*.png`。
  - 覆盖 standalone 932×430 / 852×393（含刘海 59/59/21）、旧缩放存档 1024×471、竖屏启动后旋转（visualViewport 停在旧值）、地址栏 844×345，以及桌面与 main 的像素对比。
- 未真机验证：旋转、切后台恢复、manifest 是否生效、刘海实际 inset。iOS 会缓存 manifest 和图标，**旧的主屏幕图标要先删掉，再在 Safari 里重新「添加到主屏幕」**才会生效。
