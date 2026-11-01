# UI 美术方案：生成式九宫格切片替换代码绘制界面（art/ui-plan）

负责人：卡牌传奇·美术2。本轮只出方案和样张，**未改 src 代码**。风格目标：热血传奇 1.76 的金属暗金红质感。1.76 官方 UI 原图没有找到可核实的来源，下文色板和结构是参照现有图标/人物采样定的，标「推测」。

第二轮（补齐）新增 15 个切片，共 40 个；新增预览 `docs/ui-preview/preview_extra.jpg`，生成脚本 `build_extra.py`（会先重建前 25 个，结果逐字节不变）、`compose_extra.py`、`pack_atlas.py`。

样张：`docs/ui-preview/preview_all.jpg`（汇总图）、`preview_1280x720.jpg`、`preview_844x390.jpg`；切片在 `docs/ui-preview/slices/`（25 个）；参数在 `slices.json`；生成脚本 `build_slices.py`；预览合成 `compose_preview.py`（只用来出预览，不是游戏代码）。

## 1. 界面清单

| # | 界面 | 代码位置 | 现状（代码绘制） | 替换切片 |
|---|---|---|---|---|
| 1 | 开始界面·加载条 | TitleScene.ts:36-37, 80-81 | 604×22 描边框 + 金色 rectangle 填充 | bar_frame + bar_fill_exp |
| 2 | 开始界面·按钮 | TitleScene.ts:20 `button()`（全局通用，Panel 也经 mtext 用） | 0x2a1a0c 矩形 + 2px 金边，hover 换色 | btn_normal/hover/pressed/disabled |
| 3 | 存档槽面板 | TitleScene.ts:90, 100, 104 | 640×H / 1000×640 面板，960×(rowH-8) 槽行，active 金边 | panel_frame + list_row / list_row_sel |
| 4 | 选职业卡 | TitleScene.ts:121, 126 | 卡底 + 0xb8a070 边、名字底条 | inset_frame（卡框归卡面美术时另议） |
| 5 | 全屏遮罩 | TitleScene.ts:52；Panel.ts:92；WorldMapView.ts:228；BattleScene.ts:704, 858 | 半透明黑 rectangle | **不换**（纯遮罩，代码保留） |
| 6 | 战斗 HUD·血蓝球 | Hud.ts:18-33（Orb，圆形遮罩填充） | 代码多边形水位 | orb_frame + orb_glass（第二轮已出；填充仍走代码遮罩，见 §3.1） |
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
| 35 | 装备对比面板 | Panel.ts:473, 486-499（equipCompare.ts 出数据） | 110×150 列框、W×H 框、竖分隔线、斑马纹 | tooltip_frame + divider_v（第二轮已出） |
| 36 | 世界地图视窗框 | WorldMapView.ts:58 | VW×VH 2px 边 | inset_frame |
| 37 | 世界地图确认弹框 | WorldMapView.ts:230 | CW×CH 0x1c140c + 3px 金边 | dialog_frame + btn_* |
| 38 | 世界地图区块/连线 | WorldMapView.ts:81-171 | 地图瓦片缺图时的色块、区域多边形描边、连线 | **不换**（属于地图内容，非 UI 框） |
| 39 | 设置页 | SettingsView.ts（经 Panel settings 模式） | 用 button()/面板 | panel_frame + btn_* + list_row |
| 40 | 手机虚拟摇杆/技能钮 | VirtualPad.ts:15, 54 | 圆形 0x000000 35% + 浅金边、CD 扇形 | touch_round（底）；CD 扇形保留代码 |
| 41 | 手机 HUD（DOM） | MobileHud.ts:10-30（CSS） | CSS 渐变按钮 + 2px #b8893a 边、血蓝条 div | 同一套切片走 CSS `border-image`（见 §6） |
| 42 | 灵符商城 | 尚无代码 | — | 第二轮已出正式切片，见 §3.2 |
| 43 | 装备栏·血石位 | Panel.ts:113 slotBox（血石位尚无专门格） | 同普通格 | slot_bloodstone |

统计：盘点 **18 个界面**（开始/存档、选职业、战斗 HUD、快捷栏、背包、装备栏、对比面板、商店、技能页、传送员/NPC、城镇、世界地图、地图总览/小地图、任务/成就、提示框、弹窗、设置、手机触控），外加灵符商城占位。上表有 **42 项**，其中 **36 项** 是要换成切片的代码绘制元素；另有 4 项建议保留代码（#5 遮罩、#38 地图内容，以及 #13、#40 里的符号/CD 扇形部分），#6 血蓝球第二轮已出切片；#16 卡牌单位框按主Bot决定**不纳入**。第二轮新增 #43 血石位。

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
| orb_frame.png | 128×128 | 0/0/0/0 | HUD 血球/蓝球外框（固定比例；内圆可用区 圆心(64,64) 半径 52） |
| orb_glass.png | 128×128 | 0/0/0/0 | 血/蓝球玻璃高光层（叠在填充之上、orb_frame 之下或之上均可） |
| divider_v.png | 8×128 | 0/0/40/40 | 竖分隔线（对比面板两列之间；纵向拉伸，两端 40px 渐隐不拉伸；中点可叠 divider_gem） |
| panel_frame_s.png | 96×96 | 20/20/20/20 | 手机小屏面板/小弹窗：角饰 24px，边距 20，适合 ≤ 390 高的屏幕和半屏面板 |
| lingfu_icon_s.png | 32×32 | 0/0/0/0 | 灵符货币小图标 32×32（价格旁、顶栏余额） |
| lingfu_icon_l.png | 96×96 | 0/0/0/0 | 灵符货币大图标 96×96（充值档位卡、获得弹窗） |
| ribbon_limited.png | 112×28 | 24/24/0/0 | 限时/热卖丝带（横向拉伸，燕尾两端 24px 不拉伸；文字代码渲染） |
| badge_corner.png | 40×40 | 0/0/0/0 | 商品格右上红色斜角丝带（不含文字），按 80 格原尺寸设计；setOrigin(1,0) 贴格子右上角，随格子等比 setDisplaySize(size/2) |
| recharge_card_normal.png | 128×160 | 30/30/30/30 | 充值档位卡底（常态）；图标/价格/赠送文字由代码叠加 |
| recharge_card_sel.png | 128×160 | 30/30/30/30 | 充值档位卡底（选中）；图标/价格/赠送文字由代码叠加 |
| recharge_card_rec.png | 128×160 | 30/30/30/30 | 充值档位卡底（推荐）；图标/价格/赠送文字由代码叠加 |
| goods_slot_normal.png | 80×80 | 20/20/20/20 | 灵符商城/商店商品格（常态）：7px 铜金粗边+四角金三角角饰（10px）+不透明深色内底；对齐用户参考图；图标居中叠加 |
| goods_slot_sel.png | 80×80 | 20/20/20/20 | 灵符商城/商店商品格（选中）：7px 铜金粗边+四角金三角角饰（10px）+不透明深色内底；对齐用户参考图；图标居中叠加 |
| goods_slot_soldout.png | 80×80 | 20/20/20/20 | 灵符商城/商店商品格（售罄）：7px 铜金粗边+四角金三角角饰（10px）+不透明深色内底；对齐用户参考图；图标居中叠加 |
| slot_bloodstone.png | 64×64 | 0/0/0/0 | 装备栏血石位空槽（与 slot 同 64 体系；中央暗纹宝石，等比缩放，不走九宫格） |
| qframe_common.png | 32×32 | 5/5/5/5 | 品质框·普通（rarity=common）；细边 3px+内光，中心透明，叠在 slot/goods_slot 或图标之上，任意尺寸 nineslice |
| qframe_magic.png | 32×32 | 5/5/5/5 | 品质框·精良（rarity=magic）；细边 3px+内光，中心透明，叠在 slot/goods_slot 或图标之上，任意尺寸 nineslice |
| qframe_rare.png | 32×32 | 5/5/5/5 | 品质框·极品（rarity=rare）；细边 3px+内光，中心透明，叠在 slot/goods_slot 或图标之上，任意尺寸 nineslice |
| lingfu_icon_xs.png | 16×16 | 0/0/0/0 | 价格前小灵符（显示 16~20px，与 12~16px 价格字等高） |

说明：
- 边距 0/0/0/0 的是固定比例图，用 Image + setDisplaySize 等比缩放，不走九宫格。
- bar_fill_* 是 8×14 的竖向渐变，只拉宽度；按比例时用 `setCrop` 或改 `width` 都可以，两端 2px 不拉伸。
- tab_* 的 bottom=4，并且裁掉了底边，这样标签和面板能接上。
- divider 两端 40px 是渐隐，不拉伸；divider_gem 是固定 12×12，叠在分隔线中点。
- 九宫格的中心区域是低对比的皮革或渐变，拉伸后看不出纹理变形。四角的雕花只在 corner 区域内（panel 52px、dialog 34px），拉伸时保持不变。
- 最小尺寸：九宫格的目标宽度要 ≥ L+R，高度要 ≥ T+B。比如 panel_frame 至少 104×104，按钮至少 32×28。手机端按钮最小 44×44，满足这个要求。

### 3.1 第二轮补齐切片说明

- **血蓝球 orb_frame / orb_glass（128×128，固定比例）**：内圆可用区圆心 (64,64)、半径 52（按显示尺寸等比缩放，例如显示 140px 时半径 = 140×52/128）。叠放顺序从下到上：
  1. 代码画的黑底圆；
  2. 代码画的红/蓝液面，用 GeometryMask 圆形裁切，现有 Hud.ts Orb 的水位逻辑保持不变，只把遮罩半径对齐到 52；
  3. orb_glass 高光层；
  4. orb_frame 外框，四颗红宝石铆钉。
  orb_glass 也可以放在 frame 之上。两层都只用 `setDisplaySize(D, D)` 等比缩放，不走九宫格。
- **divider_v（8×128，T/B=40）**：对比面板两列之间用 nineslice，左右边距 0、上下各 40（两端渐隐），只拉高度，宽度保持 8。中点可以叠 divider_gem。
- **panel_frame_s（96×96，边距 20/20/20/20，角饰 24px）**：用于手机横屏（高度 ≤ 430）的全屏面板、半屏面板、小弹窗，以及桌面端 ≤ 300px 的小浮窗。最小尺寸 40×40。在 844×390 下，配合 Panel 的 k 放大以后，角饰实际显示约 20~25px，不占内容区。
- **slot_bloodstone（64×64，固定）**：装备栏血石位的空槽，和 slot 同属 64 尺寸体系，中央有暗红宝石暗纹。暗纹在中心，所以不走九宫格，用 `setDisplaySize(size, size)` 跟普通格同尺寸显示。装上血石以后改用 slot 加物品图标。

### 3.2 灵符商城切片（正式）

| 切片 | 用法 |
|---|---|
| lingfu_icon_s 32×32 / lingfu_icon_l 96×96 | 灵符货币图标，固定尺寸。小图用于价格旁和顶栏余额（显示 16~28px），大图用于充值档位卡和获得弹窗 |
| ribbon_limited 112×28，L/R=24 | 限时/热卖/推荐丝带，燕尾两端不拉伸，只拉宽；文字由代码渲染（白或金字、黑描边） |
| badge_corner 40×40，固定（第四轮由 64 改为 40） | 红色斜角丝带，不含文字，见 §3.4 |
| recharge_card_normal / sel / rec 128×160，边距 30 | 充值档位卡底：常态 / 选中（亮金描边）/ 推荐（红框加红光，建议再配 ribbon_limited） |
| goods_slot_normal / sel / soldout 80×80，边距 20（第四轮重做，见 §3.4） | 商品格底，通用于卷轴、项链、血石等各类商品。售罄态是去色压暗，图标也由代码 `setTint(0x777777)` 并把 alpha 设为 0.5 |
| 共用 | panel_frame（桌面）/ panel_frame_s（手机）、title_plate、tab_on/off（分类页）、divider_v（档位区与商品区之间）、btn_*（购买） |

商城接入：充值档位和商品格都是九宫格 nineslice，内容（图标、名称、价格）放在同一个 Container 里叠加。长列表沿用 scrollList 加 mask 滚动。示意图是 `preview_extra.jpg` 的上半部分。商品价格、档位金额都是示意数字，不是需求。

### 3.3 品质框（第三轮）

**现有品质等级（以代码为准，共 3 档，没有自造等级）**

- 类型定义：`src/combat/types.ts:54` 中 `type Rarity = 'common' | 'magic' | 'rare'`。
- 后缀：`World.ts:586/607` 生成名字后缀 [精良]/[极品]。
- 排序：`bagSort.ts:3` 中 RARITY_RANK 为 rare 2 > magic 1 > common 0。

| key | 中文（Panel.ts:43 RARITY_CN） | 格子描边 Panel.ts:42 RARITY_NUM | 名字文字 Panel.ts:41 RARITY_HEX | 地面光柱 BattleScene.ts:32 RARITY_COLOR / :33 RARITY_TEXT |
|---|---|---|---|---|
| common | 普通 | 0x8a8a8a | #ffffff | 0xf0e6c0 / #f0e6c0 |
| magic | 精良 | 0x3a7aff | #5aa8ff | 0x3d9bff / #3d9bff |
| rare | 极品 | 0xffa020 | #ffb020 | 0xffa020 / #ffa020 |

- 无物品的空格描边是 0x4a3a28（Panel.ts:113/489）。
- data/fx.ts:24 中的 pillarCommon 0xffff00、pillarRare 0xff0000、pillarMagic 0x3388ff 是按物品 id 指定的特效光柱色（fx.ts:31 RARITY 表），不是 Rarity 品质色，品质框不采用。
- **套装**（items.ts 的 `set: 'woma'` 等，以及 SETS / r14b CLASS_SETS）是独立字段，不属于品质档。代码里没有「传说」「史诗」这类等级。所以本轮只出 3 个框；套装标识如果需要，建议另出角标，待定。

**切片**：qframe_common / qframe_magic / qframe_rare，尺寸 32×32，边距 5/5/5/5，中心透明。

- 结构：1px 黑外描 → 2px 主色斜面（左上亮、右下暗）→ 1px 暗内线 → 1px 主色半透明内光。
- 主色取 RARITY_NUM，第四轮有调整，见 §3.4。
- 各档只差颜色和高光强度：rare 左上高光略强。没有雕花，也没有厚角饰。

**为什么只出一个尺寸**：边框只有约 3px，九宫格拉伸时边宽保持不变，32~96px 都能用同一张：

- 小格 32/40/48（列表行、手机）用 setSize 缩小；
- 标准格 54/64（背包、装备栏）；
- 商品格 80（商城）。

预览图里各尺寸都清晰，再出一档小图收益不大。

**叠放与接入**（只写文档，代码由系统开发改）：

1. 叠放顺序：底格（slot / goods_slot_* / slot_bloodstone）→ 物品图标（约占格宽 78%）→ `scene.add.nineslice(x, y, 'ui', 'qframe_' + item.rarity, size, size, 5, 5, 5, 5)`。
2. 帧名直接用 `item.rarity` 拼接，和 RARITY_NUM / RARITY_HEX 用同一个 key，新增等级时三处同步加。
3. 替换点：Panel.ts:113（slotBox）和 Panel.ts:489（对比面板图标格）中的 `rectangle(...).setStrokeStyle(2, RARITY_NUM[rarity])`，改成「底格 + qframe」。空格不叠 qframe，保留底格原样。
4. 名字文字色继续用 RARITY_HEX；售罄格同样叠 qframe，统一 alpha 0.5。
5. 商城价格标签旁的品质文字也用 RARITY_HEX。

预览图：`docs/ui-preview/preview_quality.jpg`，生成脚本 `build_quality.py`（追加到 slices.json）和 `compose_quality.py`。重建顺序：build_extra.py → build_quality.py → pack_atlas.py。

### 3.4 第四轮：对齐用户灵符商城参考图 + 品质框微调

**goods_slot_normal / sel / soldout（80×80，边距 20/20/20/20，尺寸不变；边距由 18 改为 20）**

- 结构从外到内：
  1. 1px 黑外描；
  2. 7px 铜金粗边，斜面处理，左上亮、右下暗，最外 1px 是高光线；
  3. 1px 暗内线；
  4. 四角各一个金色直角三角角饰，腰长 10px；
  5. **不透明深色内底**：常态 #1E120C、选中 #24160C、售罄 #141416。
- 边距 20 = 9px 边框 + 10px 角饰 + 1px 余量，九宫格拉伸时角饰不变形。中心是纯色，拉伸不会糊。
- 三种状态：
  - 选中：边框换亮金（#FFD46E / #BA8228），角饰也提亮；
  - 售罄：灰黑冷色格（#4E5054 / #2C2D30），图标由代码去色，alpha 0.5，价格文字改成「售罄」。
- 推荐显示 96~110px（参考图约 108px），最小 48px。
- 背包、装备栏的普通 slot 不变。商城和商店用 goods_slot。

**badge_corner（40×40，固定，透明底）**：红色斜带，从上边 x≈14 斜向右边 y≈26，带宽约 7px，带深色描边和一条亮线，不烘焙文字。

- 叠放：`add.image(slotX + size, slotY, 'ui', 'badge_corner').setOrigin(1, 0).setDisplaySize(size/2, size/2)`，放在图标之上。
- 设计基准是 80 格，原尺寸 40 即格宽的一半。
- 文字需要时由代码旋转 45° 叠加，建议不写字，只做「限时/热卖」标识，和参考图一致。

**lingfu_icon_xs（16×16，新增）**：竖向黄符纸加红色朱砂纹，用于价格前的小图标。

- 显示 16~20px，与 12~16px 的价格字等高。
- 叠放：图标 `setOrigin(0, 0.5)` 和价格文字放在同一基线行，图标在左，文字左对齐，间距 4px。
- lingfu_icon_s（32）保留给顶栏余额，lingfu_icon_l（96）保留给充值卡。

**品质框微调**（qframe 仍是 32×32，边距 5/5/5/5，结构和尺寸都不变）

| key | 代码色值（Panel.ts:42 RARITY_NUM） | 切片主色 | 差异原因 |
|---|---|---|---|
| common | 0x8a8a8a | **0xb4b4b4** | 0x8a 在暗底和暗金底格上偏闷，提亮后仍是中性灰，可以识别 |
| magic | 0x3a7aff | 0x3a7aff | 不变 |
| rare | 0xffa020 | 0xffa020 | 主色不变；最外 1px 黑描边改为亮暖金 #FFBE50，内光 alpha 70→120。发光做在切片内部，不另出 qglow 叠层，九宫格结构和尺寸都不变，接入方式也不变 |

- 代码里的 RARITY_NUM 描边色**不需要改**。改用 qframe 以后，描边色以切片为准。
- 如果仍保留 rectangle 描边的地方，可以把 common 改成 0xb4b4b4 以保持一致。这一条由系统开发决定，本分支不改代码。

预览：
- `preview_shop_ref.jpg`：左边是用户参考图，右边是新切片按同样布局拼的两行十格。
- `preview_extra.jpg`：商城示意已更新。
- `preview_quality.jpg`：已更新。

脚本 `build_shop.py`、`compose_shop_ref.py`。重建顺序：build_extra → build_quality → build_shop → pack_atlas → compose_*。

## 4. 接入建议（给系统开发）

1. **加载**：在 assets-manifest 里加 atlas `ui_atlas`（png/webp + json），帧名就是切片文件名去掉 .png。样例见 `docs/ui-preview/atlas_ui_preview.png/.json`，这是 512×356 的简易 shelf 打包，正式打包建议用 TexturePacker 或 free-tex-packer，padding 2、extrude 1，防止 NineSlice 采样渗色。
2. **九宫格**：Phaser 3.60+ 有 `scene.add.nineslice(x, y, 'ui_atlas', 'panel_frame', w, h, L, R, T, B)`，项目用的 ^3.80.1 支持。改尺寸用 `setSize(w, h)`，不要用 setScale（setScale 会把角也一起放大）。血蓝条这类只横向拉伸的，用 nineslice 并把 T/B 设为 0（三宫格）。
3. **替换点**：`button()`（TitleScene.ts:18）是唯一的按钮工厂，改成 nineslice + 4 态切换帧，pointerover 换 hover，pointerdown 换 pressed，enabled=false 用 disabled。这一处改完，全游戏的按钮就都换了。Panel.ts:95 的面板底，以及 slotBox()、各列表行 rectangle，按 §1 表逐项换。
4. **品质色**：slot 保持中性金。品质用代码在格内叠一个 1~2px 的 rectangle 描边，或者 `setTint` 一层 slot_sel，不需要为每种品质单独出图。
5. **命名约定**：`<组件>_<变体>[_<状态>]`，状态固定用 normal/hover/pressed/disabled/on/off/sel。新增切片时同步更新 slices.json 的 L/R/T/B，代码可以直接读这个表，不用写死数字。
6. **深度/交互**：九宫格对象只负责显示，交互区还是用现在的透明 rectangle 或 setInteractive，不影响 tapClose、scrollList 的逻辑。
7. **第二轮新增**：orb 用 Image 叠 3 层，填充遮罩半径 = 显示直径×52/128；手机端判断 IS_MOBILE 时，面板帧名从 panel_frame 换成 panel_frame_s，边距从 slices.json 读，不用写死；商城切片和主 UI 共用一张 atlas（总量不大，不必拆）。
8. **长列表**：列表行是独立的 nineslice，跟着容器一起滚动、一起被 mask 裁剪。行高变了只需要 setSize，不会变形。

## 5. 手机横屏适配（844×390 等）

- 现在手机面板会按 `k=min(1280/W,700/H)` 整体放大（Panel.ts:99）。nineslice 放进被缩放的 Container 后，角也会跟着等比缩放，这在视觉上是对的（整体放大，比例不变，不会变形）。
- 角饰的实际显示大小：panel_frame 的角是 52px，在 844×390 设备上约 0.54×1.28 ≈ 0.7 倍，显示约 36 物理 px，仍然清晰。第二轮已出手机专用 `panel_frame_s`（边距 20，角饰 24px），手机端建议默认用它。
- MobileHud 是 DOM/CSS 写的，可以直接用同一批 PNG 做 `border-image`，例如 `border-image: url(btn_normal.png) 14 16 fill / 14px 16px`，这里的数字就是 §3 的边距。血条用 bar_frame 做 border-image，内层 div 用 bar_fill_* 作背景，并设 background-size: 100% 100%。
- 预览 `preview_844x390.jpg` 是把 1280 的布局等比缩到 0.54 后合成的，用来看拉伸效果，不代表最终的手机排版。

## 6. 包体积与加载评估（实测，第四轮更新）

| 项 | 实测 |
|---|---|
| 44 个切片 PNG 合计 | **308,291 B**（第四轮重做 goods_slot×3（共 8,927 B，原约 20.9 KB）、badge_corner 531 B；新增 lingfu_icon_xs 497 B；品质框 3 个 698 B） |
| 其中最大 | panel_frame 62,460 B；recharge_card_* 三张约 28.7~29.1 KB；dialog_frame 28,301 B；panel_frame_s 15,031 B |
| 合并 atlas（512×718 PNG，PIL optimize） | **295,031 B**（docs/ui-preview/atlas_ui_preview.png，帧表 .json） |
| 同 atlas WebP 无损 | **202,136 B**（atlas_ui_preview_lossless.webp） |
| 同 atlas WebP q90 / alpha95 | **74,338 B**（atlas_ui_preview_q90.webp） |
| atlas 显存（RGBA） | 512×718×4 = **1,470,464 B（约 1.40 MB）** |
| 对比：现有 public/assets/ui | 564,581 B；整个 public/assets 约 314 MB（第一轮 du -sh） |
| 生成源材质 docs/ui-preview/src | 461,604 B（只在 docs，不进 public/dist） |

compress-assets（vite.config.ts 里的 `compressAssets`）现在只处理 portraits/bg/map 和 ui/bg_dungeon.jpg，**ui 目录不在范围内**。

建议（需要系统开发改代码，本分支不改）：
1. 正式打包成 `assets/ui/ui_atlas.png` + json，44 个文件变成 1 次请求。预览 atlas 用的是简易 shelf 打包，有空隙；正式打包建议用 TexturePacker 或 free-tex-packer，padding 2、extrude 1，可以压到 512×512 左右。
2. **只用无损或 q≥90**：在 compressAssets 的 targets 里加 ui_atlas，用 `{ lossless: true }`（实测 202 KB）或 `{ quality: 90, alphaQuality: 95 }`（实测 74 KB）。不要套用立绘的 80/85 或背景的 72，金边细线会出现色带。同时要改 loader.ts `assetUrl()` 的正则，让 `assets/ui/ui_atlas.png` 映射到 .webp。
3. **加载时机**：ui_atlas 放在 Boot/Title 预加载，一次加载，开始界面就要用。商城切片已经并进同一张 atlas，额外只有约 +160 KB PNG，不单独懒加载。以后商城如果有大 banner 或活动图，再单独打 atlas，打开商城时懒加载。
4. 增量：WebP 无损约 +202 KB，q90 约 +74 KB，相对 314 MB 的资源可以忽略。显存 1.40 MB，手机端也可以接受。
