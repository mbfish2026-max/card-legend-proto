# UI 美术方案：生成式九宫格切片替换代码绘制界面（art/ui-plan）

负责人：卡牌传奇·美术2。本轮只出方案和样张，**未改 src 代码**。风格目标：热血传奇 1.76 的金属暗金红质感。1.76 官方 UI 原图没有找到可核实的来源，下文色板和结构是参照现有图标/人物采样定的，标「推测」。

样张：`docs/ui-preview/preview_all.jpg`（汇总图）、`preview_1280x720.jpg`、`preview_844x390.jpg`；切片在 `docs/ui-preview/slices/`（25 个）；参数在 `slices.json`；生成脚本 `build_slices.py`；预览合成 `compose_preview.py`（只用来出预览，不是游戏代码）。

## 1. 界面清单

| # | 界面 | 代码位置 | 现状（代码绘制） | 替换切片 |
|---|---|---|---|---|
| 1 | 开始界面·加载条 | TitleScene.ts:36-37, 80-81 | 604×22 描边框 + 金色 rectangle 填充 | bar_frame + bar_fill_exp |
| 2 | 开始界面·按钮 | TitleScene.ts:20 `button()`（全局通用，Panel 也经 mtext 用） | 0x2a1a0c 矩形 + 2px 金边，hover 换色 | btn_normal/hover/pressed/disabled |
| 3 | 存档槽面板 | TitleScene.ts:90, 100, 104 | 640×H / 1000×640 面板，960×(rowH-8) 槽行，active 金边 | panel_frame + list_row / list_row_sel |
| 4 | 选职业卡 | TitleScene.ts:121, 126 | 卡底 + 0xb8a070 边、名字底条 | inset_frame（卡框归卡面美术时另议） |
| 5 | 全屏遮罩 | TitleScene.ts:52；Panel.ts:92；WorldMapView.ts:228；BattleScene.ts:704, 858 | 半透明黑 rectangle | **不换**（纯遮罩，代码保留） |
| 6 | 战斗 HUD·血蓝球 | Hud.ts:18-33（Orb，圆形遮罩填充） | 代码多边形水位 | 建议另出 orb_frame（下一轮），本轮不出 |
| 7 | 战斗 HUD·地图名牌 | Hud.ts:94-95 | 270×46 红底 + 双层金边 | title_plate |
| 8 | HUD 底部技能栏底座 | Hud.ts:105 | 760×112 暗底 + 0x6a5030 边 | dialog_frame（或 panel_frame） |
| 9 | 经验条 | Hud.ts:108-109 | 480×10 黑框 + 0xc8a020 填充 | bar_frame + bar_fill_exp |
| 10 | 技能快捷栏格 | Hud.ts:118, 127 | SK×SK 0x1a1a1a + 0xbbaa77 边 | slot / slot_sel |
| 11 | 药品格 | Hud.ts:132 | 44×44 同上 | slot |
| 12 | 战斗日志底 | Hud.ts:154 | 252×124 黑 35% | tooltip_frame（可选，保持低调） |
| 13 | 层进度条/路线条 | Hud.ts:63-68 | 黑底框 + 线段 + 三角/圆点 | bar_frame（底）；节点符号保留代码 |
| 14 | 地图总览浮层 | Hud.ts:76-84 | W×H 0x05060c + 金边；48×48 关闭；240×44 按钮 | panel_frame + btn_close + btn_* |
| 15 | 雷达/小地图 | Hud.ts:167 | graphics 黑底 | 建议外框用 inset_frame，内容保留代码 |
| 16 | 卡牌单位框 | CardView.ts:51-56, 84-104 | 圆角卡底 + 三层描边、HP 条、等级圆、BOSS 金框 | bar_frame/bar_fill_hp（HP 条）；卡框本身属于卡面，**留给主Bot决定**是否纳入 |
| 17 | 通用大面板（背包/商店/技能/地图/任务/设置/城镇） | Panel.ts:95 | 1000×500（设置 640×580）0x15100b + 3px 金边 | panel_frame + title_plate |
| 18 | 面板关闭钮 | Panel.ts:100-101 | button() 36×32「✕」，手机 84×76 | btn_close |
| 19 | 装备栏格/背包格 | Panel.ts:113（slotBox） | size×size + 品质色描边 | slot / slot_sel；品质色用代码在格外叠 1px 细框或 tint |
| 20 | 装备栏人物框 | Panel.ts:137 | 170×260 + 0xb8a070 边 | inset_frame（人物图不改） |
| 21 | 商店列表行 | Panel.ts:170, 177, 184 | 320×56 + 1px 边 | list_row |
| 22 | 商店标签（杂货/书店） | Panel.ts:166 | button() 76×32 带「▶」 | tab_on / tab_off |
| 23 | 书店列表行 | Panel.ts:197 | 320×(rh-6)，cs 高亮边 | list_row / list_row_sel |
| 24 | 背包翻页/整理/末页按钮 | Panel.ts:215-219 | button() 40~56×30 | btn_* |
| 25 | 技能页列表行 | Panel.ts:268 | 820×(rowH-4) 按状态换底色 | list_row / list_row_sel |
| 26 | 技能训练进度条 | Panel.ts:279 | 220×3 灰条 | bar_frame + bar_fill_exp（建议高度提到 ≥8） |
| 27 | 技能页 ▲▼/自动/↑↓ 按钮 | Panel.ts:258, 282-288 | button() | btn_* |
| 28 | 城镇 NPC 立绘框 | Panel.ts:305 | 200×250 + 边 | inset_frame |
| 29 | 传送员/NPC 列表行 + 按钮 | Panel.ts:316-319 | 230×44 行 + 50×30 按钮 | list_row + btn_* |
| 30 | 滚动条 | Panel.ts:329-330（scrollList.ts 计算） | 6px 轨道/金色滑块 | scroll_track / scroll_thumb |
| 31 | 回到街上按钮 | Panel.ts:306 | button() 170×36 | btn_* |
| 32 | 任务行 | Panel.ts:420 | 460×52，完成绿边 | list_row / list_row_sel |
| 33 | 成就行 | Panel.ts:430 | 360×44 | list_row |
| 34 | 物品提示框 | Panel.ts:466 | 220×(n·20+16) 0x05060c + 灰边 | tooltip_frame |
| 35 | 装备对比面板 | Panel.ts:473, 486-499（equipCompare.ts 出数据） | 110×150 列框、W×H 框、竖分隔线、斑马纹 | tooltip_frame + divider（竖向需另出 divider_v，下一轮） |
| 36 | 世界地图视窗框 | WorldMapView.ts:58 | VW×VH 2px 边 | inset_frame |
| 37 | 世界地图确认弹框 | WorldMapView.ts:230 | CW×CH 0x1c140c + 3px 金边 | dialog_frame + btn_* |
| 38 | 世界地图区块/连线 | WorldMapView.ts:81-171 | 地图瓦片缺图时的色块、区域多边形描边、连线 | **不换**（属于地图内容，非 UI 框） |
| 39 | 设置页 | SettingsView.ts（经 Panel settings 模式） | 用 button()/面板 | panel_frame + btn_* + list_row |
| 40 | 手机虚拟摇杆/技能钮 | VirtualPad.ts:15, 54 | 圆形 0x000000 35% + 浅金边、CD 扇形 | touch_round（底）；CD 扇形保留代码 |
| 41 | 手机 HUD（DOM） | MobileHud.ts:10-30（CSS） | CSS 渐变按钮 + 2px #b8893a 边、血蓝条 div | 同一套切片走 CSS `border-image`（见 §6） |
| 42 | 灵符商城（**需求占位**） | 尚无代码 | — | panel_frame + tab_* + list_row + slot + btn_*；需补「灵符」货币图标、限时角标、充值档位卡底（等主Bot给需求） |

统计：盘点 **18 个界面**（开始/存档、选职业、战斗 HUD、快捷栏、背包、装备栏、对比面板、商店、技能页、传送员/NPC、城镇、世界地图、地图总览/小地图、任务/成就、提示框、弹窗、设置、手机触控），外加灵符商城占位。上表有 **42 项**，其中 **36 项** 是要换成切片的代码绘制元素；另有 4 项建议保留代码（#5 遮罩、#38 地图内容，以及 #13、#40 里的符号/CD 扇形部分），2 项留到下一轮或待决定（#6 血蓝球、#16 卡框）。

战斗特效（Fx.ts、BattleScene 场景装饰，比如传送门拱、陷阱、光柱）不属于 UI 框，本方案不涉及。

## 2. 统一风格规范（推测：按 1.76 印象和现有素材采样）

- 现有图标采样主色：近黑 #202020、#000000，暗棕金 #402000、#604020，铁灰 #606060，暗红 #200000（采了 items/skills 90 张、16×16 缩略后量化）。现有代码色 #d4a64a、#b8893a、#15100b 继续沿用，作为色板锚点。
- **色板**：金边亮 #F0C878，金边中 #B8893A，金边暗 #5A3A14；底板 #1A0E0C~#2A1210（暗红褐皮革）；按钮红 #5C1810→#280A08；高亮金 #FFDC96；禁用灰 #3A3530；品质色沿用代码 RARITY_NUM。
- **材质**：边框用 GenerateImage 生成的锤纹古铜金属（src/tex_metal_256.jpg）乘色。底板用暗红褐皮革（src/tex_dark_256.jpg）。大面板和弹框四角是生成的雕花金角、带红宝石（src/corner_src.png 抠黑底）。
- **描边/高光**：外沿亮、内沿暗的斜角（0.5→0.35 明度渐变），顶边和左边有 1px 高光，底边和右边 1px 暗线。框内 6px 内阴影。大面板内沿有 1px 暗红线 #6E1E14。按钮常态和悬停时上缘有一条 35% 透明的暖光线，按下时上下反相、底色变深。禁用态整体去色、压暗 20%。
- 切片里不放任何文字，文字都由代码渲染，沿用 txt() 的描边 3px 黑。

## 3. 切片规格表（边距单位 px，left/right/top/bottom）

| 文件 | 原尺寸 | 边距 L/R/T/B | 使用场景 |
|---|---|---|---|
| panel_frame.png | 192×192 | 52/52/52/52 | 全屏大面板底+框（Panel 1000×500、存档 1000×640、设置 640×580） |
| dialog_frame.png | 128×128 | 34/34/34/34 | 小窗弹框/确认框/传送员面板 |
| title_plate.png | 160×40 | 24/24/12/12 | 面板标题底牌、HUD 地图名牌（Hud.ts 1130,36 270×46） |
| inset_frame.png | 64×64 | 12/12/12/12 | 子区域内框：人物展示框、列表容器、对比面板列 |
| tooltip_frame.png | 48×48 | 10/10/10/10 | 物品提示框/装备对比框（原 0x05060c + 灰边） |
| btn_normal.png | 96×40 | 16/16/14/14 | 通用按钮（normal）；button() / 手机触控按钮 |
| btn_hover.png | 96×40 | 16/16/14/14 | 通用按钮（hover）；button() / 手机触控按钮 |
| btn_pressed.png | 96×40 | 16/16/14/14 | 通用按钮（pressed）；button() / 手机触控按钮 |
| btn_disabled.png | 96×40 | 16/16/14/14 | 通用按钮（disabled）；button() / 手机触控按钮 |
| btn_close.png | 40×40 | 0/0/0/0 | 面板关闭 ✕（固定尺寸，可 setDisplaySize 等比放大到 48/84） |
| list_row.png | 128×40 | 10/10/10/10 | 商店/技能/任务/传送/存档 列表行 |
| list_row_sel.png | 128×40 | 10/10/10/10 | 列表行选中/当前存档/已完成高亮 |
| tab_on.png | 96×36 | 16/16/12/4 | 标签页选中（商店 杂货/书店、背包页码、地图分区） |
| tab_off.png | 96×36 | 16/16/12/4 | 标签页未选中 |
| bar_frame.png | 128×20 | 10/10/6/6 | 血/蓝/经验/读条/训练进度条框 |
| bar_fill_hp.png | 8×14 | 2/2/0/0 | HP 填充（横向拉伸，宽=当前比例） |
| bar_fill_mp.png | 8×14 | 2/2/0/0 | MP 填充 |
| bar_fill_exp.png | 8×14 | 2/2/0/0 | 经验/读条/进度 填充 |
| slot.png | 64×64 | 14/14/14/14 | 技能快捷栏格/药品格/背包格/装备格（品质色由代码叠一层细框或 tint） |
| slot_sel.png | 64×64 | 14/14/14/14 | 格子选中/可用高亮 |
| divider_gem.png | 12×12 | 0/0/0/0 | 分隔线中央宝石（固定尺寸，代码叠在 divider 中点） |
| divider.png | 128×8 | 40/40/0/0 | 分隔线（横向拉伸，两端渐隐 40px 不拉伸） |
| scroll_track.png | 12×48 | 0/0/8/8 | 滚动条轨道（纵向拉伸） |
| scroll_thumb.png | 12×32 | 0/0/8/8 | 滚动条滑块 |
| touch_round.png | 112×112 | 0/0/0/0 | 手机虚拟摇杆/技能圆钮底（固定比例缩放，图标由代码叠加） |

说明：
- 边距 0/0/0/0 的是固定比例图，用 Image + setDisplaySize 等比缩放，不走九宫格。
- bar_fill_* 是 8×14 的竖向渐变，只拉宽度；按比例时用 `setCrop` 或改 `width` 都可以，两端 2px 不拉伸。
- tab_* 的 bottom=4，并且裁掉了底边，这样标签和面板能接上。
- divider 两端 40px 是渐隐，不拉伸；divider_gem 是固定 12×12，叠在分隔线中点。
- 九宫格的中心区域是低对比的皮革或渐变，拉伸后看不出纹理变形。四角的雕花只在 corner 区域内（panel 52px、dialog 34px），拉伸时保持不变。
- 最小尺寸：九宫格的目标宽度要 ≥ L+R，高度要 ≥ T+B。比如 panel_frame 至少 104×104，按钮至少 32×28。手机端按钮最小 44×44，满足这个要求。

## 4. 接入建议（给系统开发）

1. **加载**：在 assets-manifest 里加 atlas `ui_atlas`（png/webp + json），帧名就是切片文件名去掉 .png。样例见 `docs/ui-preview/atlas_ui_preview.png/.json`，这是 512×356 的简易 shelf 打包，正式打包建议用 TexturePacker 或 free-tex-packer，padding 2、extrude 1，防止 NineSlice 采样渗色。
2. **九宫格**：Phaser 3.60+ 有 `scene.add.nineslice(x, y, 'ui_atlas', 'panel_frame', w, h, L, R, T, B)`，项目用的 ^3.80.1 支持。改尺寸用 `setSize(w, h)`，不要用 setScale（setScale 会把角也一起放大）。血蓝条这类只横向拉伸的，用 nineslice 并把 T/B 设为 0（三宫格）。
3. **替换点**：`button()`（TitleScene.ts:18）是唯一的按钮工厂，改成 nineslice + 4 态切换帧，pointerover 换 hover，pointerdown 换 pressed，enabled=false 用 disabled。这一处改完，全游戏的按钮就都换了。Panel.ts:95 的面板底，以及 slotBox()、各列表行 rectangle，按 §1 表逐项换。
4. **品质色**：slot 保持中性金。品质用代码在格内叠一个 1~2px 的 rectangle 描边，或者 `setTint` 一层 slot_sel，不需要为每种品质单独出图。
5. **命名约定**：`<组件>_<变体>[_<状态>]`，状态固定用 normal/hover/pressed/disabled/on/off/sel。新增切片时同步更新 slices.json 的 L/R/T/B，代码可以直接读这个表，不用写死数字。
6. **深度/交互**：九宫格对象只负责显示，交互区还是用现在的透明 rectangle 或 setInteractive，不影响 tapClose、scrollList 的逻辑。
7. **长列表**：列表行是独立的 nineslice，跟着容器一起滚动、一起被 mask 裁剪。行高变了只需要 setSize，不会变形。

## 5. 手机横屏适配（844×390 等）

- 现在手机面板会按 `k=min(1280/W,700/H)` 整体放大（Panel.ts:99）。nineslice 放进被缩放的 Container 后，角也会跟着等比缩放，这在视觉上是对的（整体放大，比例不变，不会变形）。
- 角饰的实际显示大小：panel_frame 的角是 52px，在 844×390 设备上约 0.54×1.28 ≈ 0.7 倍，显示约 36 物理 px，仍然清晰。如果嫌角太大，可以为手机单独准备 `panel_frame_s`（边距 32），下一轮再出。
- MobileHud 是 DOM/CSS 写的，可以直接用同一批 PNG 做 `border-image`，例如 `border-image: url(btn_normal.png) 14 16 fill / 14px 16px`，这里的数字就是 §3 的边距。血条用 bar_frame 做 border-image，内层 div 用 bar_fill_* 作背景，并设 background-size: 100% 100%。
- 预览 `preview_844x390.jpg` 是把 1280 的布局等比缩到 0.54 后合成的，用来看拉伸效果，不代表最终的手机排版。

## 6. 包体积与加载评估（实测）

| 项 | 实测 |
|---|---|
| 25 个切片 PNG 合计 | **160,299 B（约 157 KB）**，其中 panel_frame 62,460 B、dialog_frame 28,301 B，两者占 57% |
| 合并 atlas（512×356 PNG，PIL optimize） | **156,670 B** |
| 同 atlas 转 WebP 无损 | **109,588 B** |
| 同 atlas 转 WebP q90/alpha95 | **36,752 B** |
| atlas 显存（RGBA） | 512×356×4 = **729,088 B（约 0.7 MB）** |
| 对比：现有 public/assets/ui 目录 | 564,581 B；整个 public/assets 约 314 MB（du -sh） |
| 生成源材质 docs/ui-preview/src | 198,889 B（只放在 docs，不进 public/dist） |

compress-assets 流程（vite.config.ts 里的 `compressAssets`）：构建时只把 portraits、bg、map 和 ui/bg_dungeon.jpg 转成 webp，运行时由 loader.ts 的 `assetUrl()` 改扩展名。**ui 目录不在这个范围里**。

建议：
1. 打一张 `assets/ui/ui_atlas.png`（+json），25 个文件变成 1 次请求。
2. 不要套用现有的 72/80 有损参数，金边细线会出现色带。可以把 ui_atlas 加进 targets，用 `{ lossless: true }` 或 quality ≥ 90（实测 110 KB / 37 KB）。需要系统开发同时改 compressAssets 的 targets 和 assetUrl 的正则，这部分是代码改动，本轮没做。
3. **加载时机**：ui_atlas 只有 37~157 KB，建议放进 Boot/Title 预加载，一次就够，不建议懒加载，因为开始界面和所有面板都要用。以后的灵符商城如果有大图（banner），单独做 atlas，打开商城时再懒加载。
4. 合计增量：WebP 无损约 +110 KB，相对 314 MB 的资源可以忽略。
