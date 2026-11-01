# UI 切片接入计划（feat/ui-art-plan，仅计划，不改代码）

> 依据：docs/ui-art-plan.md（§3 切片规格、§4 接入建议、§5 手机、§6 包体积）与 docs/ui-preview/slices/ + slices.json。基线 origin/main（本分支创建时最新）。
> 现状核对：slices.json 实有 **44** 个切片（队列说明写的是 40，第四轮新增了 lingfu_icon_xs、qframe_common/magic/rare 等）。其中已包含 orb_frame/orb_glass（血球）、灵符商城整套（lingfu_icon_*、goods_slot_*、recharge_card_*、ribbon_limited、badge_corner）、slot_bloodstone（血石空槽）。
> 音效来源不变（仍为 WoW），本计划只涉及界面贴图。

## 0. 硬性技术约定
1. **九宫格**：`scene.add.nineslice(x, y, 'ui_atlas', frame, w, h, L, R, T, B)`（Phaser ^3.80.1 已支持）。改尺寸**只用 `setSize(w,h)`**，禁止 `setScale`（会把角一起拉大变形）。L/R/T/B **从 slices.json 读**，新建 `src/ui/uiSlices.ts` 导出 `ns(scene, frame, x, y, w, h)` 工厂，代码里不写死边距。血蓝经验条用三宫格（T=B=0）。
2. **先改 `button()` 工厂**（`TitleScene.ts:19`，全游戏唯一按钮工厂，Panel 21 处、Settings 13 处、WorldMap 6 处、Title 8 处都走它）：底板换 nineslice，状态帧 `btn_normal/hover/pressed/disabled`；交互区仍是现有透明 rectangle，返回值签名不变 → 调用方零改动。
3. **手机 DOM HUD**（`MobileHud.ts`，DOM/CSS）不用 Phaser：用同一批 PNG 做 CSS `border-image`，如 `border-image: url(btn_normal.png) 14 16 fill / 14px 16px`，数字取 slices.json；血条外框 `bar_frame` 做 border-image，内层 div 背景 `bar_fill_*` + `background-size:100% 100%`。DOM 用单图（不走 atlas），由构建一并压成 webp。
4. **构建压缩**：`vite.config.ts` 的 `compressAssets()` 现在只处理 portraits/bg/map + bg_dungeon.jpg（第 29 行用 80/85 或 72 质量）。新增 `assets/ui/ui_atlas.png` 与 DOM 用单图，参数**只能 `{lossless:true}`（实测 202 KB）或 `{quality:90, alphaQuality:95}`（实测 74 KB）**；套用 72/80 会让金边细线出现色带。同步改 `src/loader.ts:19 assetUrl()` 正则，把 `assets/ui/ui_atlas.png` 及 DOM 单图映射到 `.webp`。atlas 的 json 帧表不压缩。
5. **启动页预加载**：ui_atlas 在 TitleScene 的 preload（或 Boot）一次性加载，开始界面就要用；商城切片与主 UI 同一张 atlas，不懒加载。加载失败时保留现有代码绘制作为兜底（`tex.exists('ui_atlas')` 判断）。
6. **atlas 打包**：脚本 `scripts/pack-ui-atlas.mjs`（free-tex-packer-core 或现有 build_slices.py 改造），padding 2、extrude 1，目标 ≤ 512×512；帧名 = 切片文件名去 .png。

## 1. 批次顺序（每批独立分支、独立提交、各自截图验收）
| 批 | 内容 | 涉及文件 | 涉及画面 | 切片 |
|---|---|---|---|---|
| B0 | 管线：打包 atlas、compressAssets/assetUrl、预加载、`uiSlices.ts` 工厂、单测 | scripts/、vite.config.ts、src/loader.ts、assets-manifest.ts、TitleScene preload | 无可见变化 | 全部 |
| B1 | `button()` 工厂 | TitleScene.ts | 开始界面、存档位、选职业、设置、全部面板按钮 | btn_* 、btn_close |
| B2 | 面板与弹窗底 | Panel.ts（:95 面板底、slotBox）、SettingsView.ts、TitleScene 弹窗 | 角色/背包/技能/悬赏/传送/设置/确认框 | panel_frame(_s)、dialog_frame、title_plate、inset_frame、tooltip_frame、divider* |
| B3 | 列表、页签、滚动条 | Panel.ts 列表行、scrollList 调用处、WorldMapView.ts | 背包、悬赏、传送、地图 | list_row(_sel)、tab_on/off、scroll_track/thumb |
| B4 | 装备格与品质框，**血石空槽** | Panel.ts:143 坐标表、equipCompare 显示、CardView.ts | 装备界面、对比面板、卡牌 | slot、slot_sel、qframe_*、slot_bloodstone（血石栏落地前先只放资源，等 lingfu 实现时启用） |
| B5 | 桌面 HUD：血蓝经验条、**血球叠层** | Hud.ts（21 处矩形绘制）、BattleScene.ts 局部 | 战斗画面 | bar_frame、bar_fill_*、orb_frame + orb_glass（3 层 Image，填充遮罩半径 = 直径×52/128） |
| B6 | 手机 DOM HUD（border-image） | MobileHud.ts、VirtualPad.ts、index.html/CSS | 844×390 战斗画面 | btn_*、bar_*、touch_round |
| B7 | 灵符商城界面（随 lingfu 实现分支，不单独做） | 新 src/ui/ShopView.ts | 商城 | lingfu_icon_*、goods_slot_*、recharge_card_*（全部标「未接入支付」）、ribbon_limited、badge_corner |

顺序理由：B0 不改画面先打底；B1 一处改动覆盖面最大、风险最小；Hud（B5）与 MobileHud（B6）是两套系统，分开做、分开验收。

## 2. 风险与对策
| 风险 | 对策 |
|---|---|
| 变形（角被拉伸） | 只 setSize；单测扫描 src 中对 nineslice 对象调用 setScale 即失败（grep 型测试）；截图人工核对四角 |
| 被缩放容器里的角（Panel k=min(1280/W,700/H)） | 等比放大属正常；手机用 panel_frame_s（角 24px） |
| 长列表滚动 | 列表行 nineslice 放进现有容器，跟随 mask 裁剪；只画可视行的逻辑（scrollList.ts）不动；交互区仍是透明 rectangle，tapClose 拖动>8px 不算点击规则不变；scroll-list.test 必须照过 |
| 金边色带 | 只用无损或 q≥90；B0 验收时 1:1 截图对比 PNG 原图 |
| 采样渗色（atlas 相邻帧） | padding 2 + extrude 1 |
| 包体积/首屏 | atlas +74 KB（q90）或 +202 KB（无损），显存约 1.0–1.4 MB；首屏增加一次请求，记录 Title 首帧时间前后对比（e2e 打点） |
| 两套系统（canvas vs 手机 DOM） | 分批（B5/B6）；DOM 单图与 atlas 来自同一切片源，打包脚本同时输出，避免两边版本不一致 |
| atlas 加载失败 | 回退现有代码绘制 |
| 文字可读性（深色底+金边） | 保持现有字号与描边；844×390 文本不小于现最小字号 |

## 3. 测试与 e2e
- 单测（加入 npm test）：
  - `tests/ui-slices.test.ts`：slices.json 与 atlas json 帧名一一对应（44 个）、L+R<宽、T+B<高、源码中无对 nineslice 的 setScale。
  - `tests/asset-url.test.ts`：assetUrl 对 ui_atlas.png 在 OPT 下返回 .webp，其他 ui 小图不变。
  - 现有 scroll-list、tap-close、multi-save 必须照过；battle.test / 9 seed 不受影响（纯显示）。
- 构建：`npm run build` 后检查 dist 里 ui_atlas.webp 存在、体积在预期范围、compressAssets 参数为无损或 q90。
- e2e（puppeteer，tests/e2e/ 新增 `ui-art.mjs`），每批跑：
  - 尺寸：1280×720、844×390（触屏 UA）、另加 1920×1080 与 667×375 抽查；
  - 画面：开始界面、存档位、选职业、设置、角色/背包/技能/悬赏/传送、装备对比、地图、战斗 HUD；
  - 长列表：背包装满（200 格）滚到底再回顶，截图 + 断言最后一行可点、隐藏行不可点；
  - 不变形：对每个 nineslice 对象读 `width/height` 与 `scaleX/scaleY===1`；
  - 截图存 `docs/shots/ui-art/<批>/<画面>-<尺寸>.png`，CHANGELOG 记验收行；Chromium 实测为准。

## 4. 工作量（估，系统开发）
| 批 | 估时 |
|---|---|
| B0 管线 + 单测 | 1 天 |
| B1 按钮 | 0.5 天 |
| B2 面板/弹窗 | 1 天 |
| B3 列表/页签/滚动 | 1 天 |
| B4 装备格/品质框/血石空槽 | 0.5 天 |
| B5 桌面 HUD + 血球 | 1 天 |
| B6 手机 DOM HUD | 1 天 |
| e2e 与截图（贯穿） | 1 天 |
| 合计 | 约 7 天（B7 商城计入 lingfu 实现） |

## 5. 依赖美术2 的清单
1. 正式 atlas 打包（或确认由系统开发用脚本打包，美术只交切片）+ 最终 slices.json 边距。
2. 手机 DOM 用单图是否需要单独 2x 版本（高 DPI 手机）。
3. 血球三层（orb_frame/orb_glass + 填充）最终尺寸与填充色；手机端是否也用血球（现手机为横条）。
4. 血石空槽 `slot_bloodstone` 已出；血石四个等级的物品图标未出。
5. 灵符商城：商品图标（7 级卷轴、技巧项链、回城石、双倍经验卷、经验药水、复活符、补充包、外观）未出；空态/售罄态已有 goods_slot_soldout。
6. 页签、列表行在 844×390 的最小可点高度确认（≥ 44 物理 px）。
7. 暗色/低画质下是否需要简化版切片（目前无）。

## 6. 本计划不做
不改代码、不改 public/ 资源、不合并 main。实施时每批开 `feat/ui-art-b<N>` 分支。
