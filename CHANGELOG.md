# CHANGELOG

## sim 工具合并审计（feat/sim-tools-merge，未合 main）
- 合并 feat/sim-gear-swap 214d73d（-X ours）：SIM_DROP_LOG / SIM_TUNE / gear40 文档 / simgear v3 评估 main 上都已有，树与 origin/main 一致，没有新增代码。详见 docs/sim-tools-merge.md。
- R78 合并后难度对照见 docs/sim-tools-merge.md。

## fix/r78-equip-tap：手机装备栏点击区 ≥44（基于 release/r78，未合 main）

- 手机装备栏由两列×6 行改为 3 列×4 行（行列距 70、格 56），立绘右移；属性文字上移到 top+338，不压底部提示。桌面两列×6 行不变。
- 实测点击区最小值：844×390 / 874×402 / 932×430 均为 44 CSS px（原 35），1280×720 仍为 48。腰带、靴子、血石栏都在内，腰带/靴子空栏底图（AI 生成，@2x）照常显示。
- e2e：新增 tests/e2e/equip-tap-shots.mjs（截图存 docs/shots/r78-equip-tap/）；belt-shots 不再写死 60；tapclose 按名字排除装备格；ui-slots 断言同步。

## 药水战斗侧 P4/P6（feat/potion-combat，未合 main）
- 用药：键盘 1/2/3 = 药水栏红/蓝/太阳水格当前选中的药（World.usePotionSlot / selectedPotionIndex）；键盘 4 保留中蓝；点格仍转发选中药。
- 太阳水/强效太阳水立刻回复（HP180+MP240 / HP300+MP480），独立冷却 hero.sunReady 1s，不占红蓝冷却、不产生 HoT；强效红蓝沿用 HoT。与血石 tickStone 独立叠加（只写文档，未合 lingfu-combat）。
- sim：tests/sim-lib.ts 加 SIM_POT=1 开关（默认关，轨迹不变），9 种子对比见 docs/potion-expand.md §9.3；1–39 偏差 ≤2%，40–50 未达标（战士过易、法师变难），建议见文档。
- e2e：hotbar-click「点击药水格 = 按 1」在 main/potion-expand 上失败的根因是 fix/town-hot 后城内 HoT 0.5s 即结算清空，断言「HoT 入队数不减」过时；改为「HoT 入队或 HP 回升」。
- 太阳水瞬回走 heal 事件，显示「+N」回血飘字。
- e2e：balance-battle 蓝药改按 2（3 = 太阳水格）；新增 tests/e2e/potion-combat-verify.mjs（键盘/点格用选中药、太阳水瞬回飘字，截图 docs/shots/potion-combat/）。
- 测试：tests/potion-combat.test.ts（28 项）。
- 第 5 轮调参（魔兽授权改价格）：强效金创药 180→360 金；强效红蓝/太阳水/强效太阳水包门槛统一 Lv40。9 种子战士 40–50 63→47、道士 27→25 达标，法师 4→33 仍未达标（价格杠杆无效，见 docs §9.5）。
- 桌面提示「药水 1-3」；药水拾取 999 上限拒收。
- 定值复核（数据 360/Lv40，不设 SIM_POT_LV）：战 115/47、法 73/33、道 97/25，与第 5 轮逐种子一致。e2e potion-expand 购买改为升到 Lv40 后买超级金创药（扣 2160）。
- 验收（c181930 之后）：tsc 0 错；npm test 全链跑完（equip-table 里「逐怪表 gen:monsters」✗ 只打印不退出，来自基线 maps-3050-combat 新怪未重生成文档，与药水无关）；build 通过；balance-battle / hj-battle / chuanshi / mobile-skills / potion-combat / potion-expand e2e 全部通过、0 JS 错误（potion-expand 手机双击解包偶发失败，重跑通过）。

## 默认 sim 换装（feat/sim-swap-default，未合 main）
- tests/sim-gear.ts：SIM_GEAR_SWAP 默认开（换装+清包），=0 复现旧行为。battle.test 阈值、PASS_MAX_DEATHS=14 不变。
- FOE_CLS_4050 恢复 r3（战1.04/法1.12/道1.12），EXP_LATE_CLS 战1.25/法1.25/道1.3；battle.test 9 种子全 Lv50。详见 docs/balance-4050-class.md。

## 40–50 按职业分倍率（feat/balance-4050-class，未合 main）
- FOE_CLS_4050（L≥41 分职业 atk/hp 倍率，最终值全 1.0）与 EXP_LATE_CLS（战1.25/法1.25/道1.3）；1–39 与 94f4a01 逐项一致。详见 docs/balance-4050-class.md。
- 已知偏差：真人反复刷 BOSS 时 40+ 装备获得更快，实际难度会比 sim 低；40+ 掉率不变。

## 阶段2 腰带图标与空栏底图（feat/drop-realign，未合 main）

- 合入 art/belt-icons（d581c18）：7 条腰带正式图标（AI 生成，64px + @2x），替换手镯占位；@2x 登记到 item-icons-2x。
- 装备面板腰带/靴子空栏接入 slot_empty_belt、slot_empty_boots（AI 生成，单图加载、不进图集，高清屏用 @2x），叠在格子中央；有装备时不显示。
- art-requests 腰带与空栏底图标为已交付。

## 掉落重新对齐：掉率、图标、H 链调参、阶段2 腰带（feat/drop-realign，未合 main）

- 掉率（魔兽批准）：天尊头盔/项链/戒指/手镯 boss_redmoon 1/40→1/120；烈焰项链/手镯/戒指/靴子 boss_leiyan 1/50→1/40（boss_molong 仍 1/50）。eg-dungeon 通过。
- 图标：合入 art/h-chain-icons（98351f6），29 件 H 链换正式图标并登记 @2x（item-icons-2x.ts）；36px 截图验收见 docs/shots/drop-realign/。
- H 链调参 v5（只动本作适配值）：属性 ×2.5，战士专属件 ×2，无职业防御件每点防御 +10 生命。修复 41b5a4c 中 8 件战士专属件误按 ×2.5 写入的问题（8fa1159）。9 seed 结果见 docs/sim-realign-h.md。
- 阶段2：Slot/EquipSlot 加 'belt'（魔兽确认，仅成员）；7 条腰带 [暂定]（烈焰/光芒 [待核]），暂无掉落、不上商店、不计套装、占位图标；装备面板加腰带栏；存档迁移：衣服位的靴子迁到 boots（不丢装备）；单测 tests/belt-boots.test.ts。
- 测试夹具：battle.test 戒指用例等级上调（金戒指需求 9→22），断言不变。

## 掉落重新对齐 H 章过渡链新物品（feat/drop-realign，未合 main）

- 新增 29 件 H 章过渡装备（项链 8 / 手镯 10 / 戒指 7 / 靴子 4）：`src/data/h-chain.ts`。属性按官方区间 [适配]，靴子数值与售价标「暂定」；21cq 编号与官方名写入 EQUIP_META（靴子 1.76 掉落未查到，cq=0）。
- 来源按需求曲线走怪物掉落（req ≤ 怪等级 + 6，Boss +8），不上商店；`applyRealign` 先剔除再按 H_PLAN 写入，避免自动掉落规划重复挂源。
- 图标暂复用同槽图标（程序内占位），目标文件名清单见 docs/art-requests.md，待美术2 出图（AI 生成）。
- 老存档兼容：新增 id 不影响旧 id；已穿戴物品不变。
- 修复：tests/drop-plan.test.ts 阶段1 引入的注释吞掉断言的问题；该测试改为与 gen:drops 一致加载运行时掉落表。
- 单测：drop-realign 新增 H 链校验（件数、注册、来源、需求≤怪等级+X、职业、存档往返）。

## 掉落重新对齐 阶段 1：数据层（feat/drop-realign，未合 main）
- 10 件装备的需求改为官方值。银蛇/屠龙只改显示名，id 不变。124 件按方案表重设来源和爆率（新曲线）。撤掉尸王搬迁。铁靴降数值。老存档读档时刷新名称和需求，已穿戴的保留。
- 新增 tests/drop-realign.test.ts。9 种子有回退（道士死亡中位 11→22，战士有 1 个种子只到 47 级）；battle 和 eg-dungeon 两个断言不过，没有放宽。详见 docs/drop-realign.md「实施记录」。

## 文档：装备需求/掉落重新对齐方案（feat/drop-realign，只出文档，未合 main）
- 新增 docs/drop-realign.md（A–I 章）和 docs/drop-realign.csv。内容：124 件逐件需求/来源/新爆率；新曲线（按档 K 换算＋上下限）；风险；9 种子评估方案；分阶段实施；待定问题；1–30 级过渡链（新增 25 件首饰）；腰带栏与靴子补全（新增 4 靴 7 腰带）。
- 新增只读脚本 scripts/drop-realign-plan.py，并扩展 scripts/drop-realign-dump.ts 的导出。art-requests 增加 36 个图标和腰带空栏底图的需求（AI 生成，未出图）。没有改任何游戏代码。

## 修复：手机药水图标/数量被框盖住（fix/mobile-potion-clip，未合 main）
- 根因 1：B6 皮肤给药水格（56px）套 btn_normal 框时，border-image-width 用了 1x 边距 14/16/14/16 CSS px。布局边框只有 2px，框图向内画到 padding 区，格内只剩 24×28 净空。图标 background-size 88%（≈45.8px）的上下左右边缘和右下角的数字都被框盖住。
- 根因 2：MobileHud 每帧用 potBtns[i].textContent 写数量，把角标 span 冲掉了。数字变成按钮里的居中文字，角标 CSS（right:3px/bottom:1px）不生效，2/3 位数会压到框上。
- 修复：新文件 src/ui/potFrame.ts 放 POT_CSS=56、POT_FRAME=[7,8,7,8] 和 POT_ICON=36。药水格的 border-image-width 改为 POT_FRAME（同一张 @2x 图，slice 不变，框画细一半），布局边框仍是 2px（回退外观和点击区不变）。图标固定 36px 居中。数量经 potCount() 写进角标 span，span 改为 12px 粗体 nowrap，right:7px、bottom:5px（算上 2px 边框后都在框内）。其他按钮、战斗/技能逻辑和 1280 桌面都没动。
- 测试：新单测 tests/potion-clip.test.ts（11 项）；新 e2e tests/e2e/potion-clip-verify.mjs，跑 844×390、932×430、874×402 三种视口，DPR 各 2/3，数量设为 5/99/999/0，断言图标和数字的包围盒都在框内区（边框宽取 max(CSS border, border-image-width)），并检查图标居中、格子 ≥44px、不压技能栏、无 JS 错误。修复前图标和数字的检查在 6 种组合下都不过。截图在 docs/shots/ui-art/potion-clip/（before-/after-<视口>@<DPR>x.png）。

## 修复：「下一层」与「上一层」入口统一用同一传送门素材（fix/portal-same，未合 main）
- 新增 src/ui/portalArt.ts（PORTAL_TEX/PORTAL_LOOK/PORTAL_TEXT）；BattleScene.syncPortalArt() 为两入口唯一创建函数：portal_exit_sheet 动画 → portal_exit 静图 → 程序椭圆占位（缺图兜底保留）。
- 方向区分：下一层水平镜像 + 淡紫色调，上一层原样；文字标签保留（「下一层」/「传送门：返回 XXX」）。删除旧的程序绘制石拱门。
- 下一层点击区 150×220（桌面+手机均可点，手机最小约 81×119 CSS px）。无新增美术需求。
- 追加：手机摇杆触发区 #mh-joy 由 34vw×60vh 缩为「移动」圆钮周边（约 90×84 CSS，含安全区），不再盖住左端「上一层」传送门，门本体在手机上可直接点；按下后 pointer capture，手指拖出触发区仍能控制；摇杆底盘改为在按下点出现。mobile-ui-verify 的按下点随之改为圆钮中心。
- 追加：「下一层」色调由 0xe8b8ff 加深为 0xc070ff。
- 测试：tests/portal-same.test.ts（15 项，含色调/摇杆区/pointer capture）；e2e 新增「摇杆区与门本体不重叠」「手机直接点门本体回上一层」「摇杆拖出区域仍控制」；debug 叠加图 docs/shots/portal-same/debug-*-m844x390-joy-vs-back.png。
- 初版测试：tests/portal-same.test.ts（12 项）、tests/e2e/portal-same-verify.mjs（4 视口 + NOART）；截图 docs/shots/portal-same/。

## 死亡复活回「最近待过的城镇」（feat/respawn-last-town，未合 main）
- 旧行为：World.respawn() 清空 units（召唤物一并丢失），在**本层起点**满血复活、本层怪物重置；BattleScene.heroDied 显示「3 秒后在本层起点复活」，3s 后调 respawn → onRespawn 建英雄卡、相机跟随。
- 新行为：进入任一城镇/新手村（enterTown：xinshou 银杏村、bichi 比奇城、mengzhong 盟重土城、bairimen 白日门、cangyue 苍月岛、fengmo 封魔谷）时记录 `World.lastTownId`（野外不改）；死亡后满血复活并 enterTown(respawnTown())，落点=该城现有进城出生点 TOWN_SPAWN_X；存活召唤物（含诱惑宠物、等级保留）跟随，经 placeSummonsNearHero ≤100px、snapSummonViews 对齐卡牌。无损失规则（no-death-drop）、血量规则（满血）不变，未改战斗数值。阵亡提示/日志改为城名。
- **存档字段变化（系统开发注意）**：SaveData 新增可选字段 `lastTownId?: string`（TOWNS 的 id，如 `"bichi"`）；仅在去过城镇后写出。读档：合法 id → 用之；缺省/非法 → 回退存档 `town`（若在城内存档）→ 再回退 `returnTownOf(floorIndex)`（本层原有「回城」城镇）。`v` 仍为 1，无迁移，旧档兼容。
- sim：sim-lib / scripts/balance-sim 复活后若在城，立即 leaveTown(死亡层)（失败则直接 loadFloor），轨迹同旧「本层起点复活」；差异仅召唤物复活后保留。
- 测试：tests/respawn-last-town.test.ts（多城切换回最近城、野外不改记录、旧档回退、非法字段、存档往返、召唤物 ≤100px/等级、多次死亡；修复前在 `lastTownId=bichi` 失败）；e2e tests/e2e/respawn-last-town-verify.mjs（比奇城→野外→阵亡→回比奇；盟重→野外→阵亡→回盟重，断言 town/城名/召唤物距离与等级/镜头内/0 console error；修复前阵亡提示仍为「本层起点」并超时失败）。

## 灵符商城·战斗侧接入（feat/lingfu-combat，未合 main）
- 血石 `World.tickStone`：**小血石无等级限制**（Lv1 起生效）；HP<40% 每 2s +3HP、不回 MP [适配]（官方 2023 魔血石每秒 +10HP/+15MP，为保持 1–39 级难度削弱，小血石单独评估 1–39 战−9%/法−11%/道+13%）。中/大/特 35/40/45：HP<20%/MP<10% 补上限 3%，8s 冷却 [适配]（原 15%/2s 过强；9 seed 1–39 合计 战−13%/法−14%/道−2%，40–50 为基线的 54%/50%/193%）。手动药水优先，城内不生效，储量随存档，耗尽保留空石，头顶飘字「血石 +N」。
- 技巧项链：熟练度 ×5。召唤直升 `boostSummon(7)`：在场与之后召唤均为 7 级，新增可选存档字段 `summonBoostLv`。回城石：战斗中/BOSS 房可用，瞬发，30s 冷却 [适配]，召唤物跟随。
- 测试：tests/lingfu-combat.test.ts 29 项进 npm test；e2e tests/e2e/lingfu-combat-verify.mjs。详见 docs/lingfu-shop.md §10.6。

## 修复：换图后召唤物留在旧坐标/从远处走过来（fix/summon-mapchange，未合 main）
- 根因：World.prevFloor（S 返回上一层）先 loadFloor 把召唤物放到本层起点附近，再把英雄挪到上一层终点（出口前），召唤物不跟着挪 → 相距约 8000px，要很久才走过来；enterTown（回城）完全不重置召唤物坐标；loadFloor 本身按 110+60k 排队，第 2/3 只已超 100px。另：读档恢复的召唤物（restoreSummons）不发 summon 事件，BattleScene 不建卡牌，直到换图前都看不见。
- 修复：新增 World.placeSummonsNearHero()（召唤物含诱惑宠物交替落在英雄身后/身前 50/50/75/75/100px，夹在地图/长街内），在 loadFloor（下一层/传送/副本/出城/上一层按钮）、prevFloor 英雄落位之后、enterTown 调用；BattleScene.snapSummonViews() 换图/进城时卡牌直接跳到新坐标，缺卡牌的召唤物补建（读档后立即可见）。不改任何战斗/平衡数值。
- 测试：tests/summon-mapchange.test.ts（法师 3 只 / 道士 2 只，下一层、S 返回上一层、上一层按钮、传送、进/出副本、回城、出城，断言距英雄 ≤100px、等级不丢；修复前挂）；e2e tests/e2e/summon-mapchange-verify.mjs（真实 S 键路径等，World 与卡牌显示坐标都 ≤100px，0 控制台错误；修复前 S 返回后召唤物距英雄 8500px 且无卡牌）。
## 城内喝药水回血（fix/town-hot）
- 根因：World.step 的城内分支只处理移动就 return，药水 HoT（tickHots）在城内不结算；HoT 用绝对时间 next，出城第一帧 while 一次补齐（单测实测 +120.25 一帧补上）。
- 修：城内分支末尾对主角调用 tickHots（只此一行）。其它计时（技能 buff/冷却/药水冷却/复活无敌）本来就用绝对 this.time，城内照常倒计时，不变；中毒伤害、自然回血、召唤物回血城内仍不结算（安全区原设计，未扩大范围）。
- HoT 不入存档（原设计），0.5 s 内结算完；读档兼容无变化。sim 不进城（sim-lib 无 enterTown），1–39 指纹不受影响。
- 测试：tests/town-hot.test.ts 8 项（城内 HP 涨、城内到期清空、出城不重复补、存读档）。
## fix/e2e-teleport（测试脚本更新，无游戏代码改动）
- tests/e2e/mobile-entrance-verify.mjs：第 8 步按 W2 两级世界地图改写（点区域两次进入插画 → 点非当前层节点 → 确认卡「传送」）；「侧线层」FAIL 系第 8 步失败后地图面板未关、游戏暂停的连带失败。第 2 步点传送门前等待 `!fading && state==='play'`，消除偶发 FAIL。
- tests/e2e/scroll-panels.py：W4 起传送列表按区域排序，最后一行不再是第 n 层；改为读屏上最底行「区域·层名」并断言传送到该层。
## sim 死亡口径与通过基线（fix/sim-baseline）
- 口径：选择「无损失死亡」单独计数，不设金币下限。理由是它只读、零扰动：1–39 指纹 27/27 不变。金币下限会从第一次死亡起改变买药和买书的时间点。sim-lib 用 respawn 前后金币、经验、等级、背包、装备是否变化来判定是否有损失。
- PASS_MAX_DEATHS=14 不变，卡每种子的有损失死亡（硬断言）。无损失死亡的新基线为 战 20/29、法 7/16、道 11/22（a6a9afa，9 种子），超出列 GAP。
- SIM_SET4 只在 Lv≥40 生效。开启时 41–50 段死亡 战 5→1、道 2→1，1–39 与关相同。
- 不动 FOE_BAND，也不动任何游戏数值；战士专属压难度不做。详见 docs/sim-baseline.md。

## 手机角色/背包/技能面板图集化 + 药水放大（feat/ui-mobile-panels，未合 main）
- 手机面板框改用 `panel_frame_s`（ui-art-plan §4.7），缺帧时回退 `panel_frame`，再缺就回退旧矩形；新增手机「角色背包 / 技能」页签（tab_on/tab_off 九宫格），点击层是透明矩形。
- 手机点击区：格子和行按钮的目标从 36 改为 44 CSS px，但不超过格距/行距；背包翻页按钮加宽；技能 ↑↓ 按钮宽度 56→60。只用 setSize。
- 修复：战斗中经验、熟练度几乎每帧变化，refreshIfStale 也就几乎每帧重建面板，新建的点击对象一直排在 Phaser 待插入队列里，导致触屏点击失效。现在限制为 800ms 内最多重绘一次。
- 药水 56 CSS px（原来更小，且压在最左技能键上）。右偏移改为 outerR+83，避开技能弧；面板打开时隐藏楼层进度条。
- 测试：新增 tests/ui-mobile-panels.test.ts 和 tests/e2e/mobile-panels-verify.mjs（NOATLAS=1 测回退）。对比截图在 docs/shots/ui-art/mobile-panels/。

## feat/maps-3050-combat（未合 main，待第 4 步回归）
- 新 UnitDef 字段：`immobile`、`onHit.stun`、`ranged`、`magic`；存档字段 `bossCdId`（按 id 记 BOSS 冷却，兼容旧档）。
- 主角/召唤物可被眩晕（不能移动、普攻、施法）；赤月恶魔不移动改为走 isImmobile。
- 新怪：幽影武士、烈焰使、闪电魔(BOSS)、利爪魔(BOSS)；禁地魔王改为不移动。详见 docs/maps-3050-combat.md。


## 召唤物：脱战回血 / 不叛变 / 继承英雄属性 / 移速=英雄 / 存读档保留（feat/summon-regen，未合 main）
- 详见 docs/CHANGELOG.md 对应条目；消融表与 9 种子前后对比见 docs/summon-regen-ablation.md。
- 存档新增可选字段 summons?（旧档无字段 = 无召唤物，兼容）；诱惑宠物同样存档。
## UI 美术 B6 手机 DOM HUD 换皮（border-image + @2x 图）feat/ui-art-b06（基于 feat/ui-art-b05 eb8ed3b；docs/ui-art-integration.md §1 B6、docs/ui-art-plan.md §3.5）
- 新增 `src/ui/domSkin.ts`：用 public/assets/ui/dom/<名>@2x 图，地址经 `domUrl()` 和 `mapAssetUrl()` 生成，生产环境为 webp。border-image-slice 取 slices.json 边距 ×2（图片像素，T R B L），border-image-width 取 1x 边距（CSS px），四角不拉伸。只用 dom:true 的 10 张图：btn_normal/pressed、bar_frame、bar_fill_hp/mp/exp、touch_round、btn_close、tooltip_frame、panel_frame_s。
- 回退开关：每张图先用 `new Image()` 预载，onload 成功后才给 #mhud 加 `sk-<名>` class。所有皮肤规则都挂在这个 class 下，图 404 或断网时不加 class，沿用原纯 CSS。按钮的 border-width 保持原来的 2px，border-image 画在 padding 区，所以布局、点击区和文字区与回退时一致。
- 映射：顶栏、自动、翻页、合击、总览「在世界地图中查看」用 btn_normal，按下或开启（:active / .on）用 btn_pressed。药水格用 btn_normal 但中心不填充，保留药水图标。互动键和摇杆提示用 touch_round（fixed，铺背景）。HP/MP/EXP 条框用 bar_frame（::after 叠层），填充用 bar_fill_*。日志用 tooltip_frame，总览框用 panel_frame_s，✕ 用 btn_close。技能圆钮保持技能图标不变。手机不出血球。
- MobileHud.ts 只加一行调用（`window.__mhudSkin`，供测试等待）。桌面不建 MobileHud，所以不受影响。
- 已知未改：顶栏设置图标缺失（mobile-ui-verify 的 2 个旧 FAIL），本批只记录。「自动/开」两行文字在 44px 高的按钮里下半截被裁，换皮前就是这样。
- 测试：新增 tests/ui-dom.test.ts（73 项，已加入 npm test）；新增 e2e tests/e2e/ui-dom-verify.mjs。截图在 docs/shots/ui-art/b06/。
- 9-seed：sim-band 的 esbuild metafile 共 31 个输入，没有一个是本批改动的文件。

## UI 美术 B5 桌面 HUD + 血球叠层 feat/ui-art-b05（基于 feat/ui-art-b04 44d8d2d；docs/ui-art-integration.md §1 B5、docs/ui-art-plan.md §3.1）
- `src/ui/uiSlices.ts`：新增 `orbLayers()`，按四层叠放：黑底圆（半径 D×52/128）→ orb_fill_red/blue（显示 D×104/128，setCrop 从上裁出水位）→ orb_glass → orb_frame。另加 `orbGeom()`、`orbCrop()`、`orbReady()`、`barFillW()`，只用 setDisplaySize / setSize。图集缺失或缺任一帧时返回 null，回退原来的代码 Orb（波浪液面）。
- 桌面血球直径 ORB_D=136：底栏 760×112（y 608–720），球心保持 (330/950, 652)，到屏幕底只剩 68，所以选 136（在 128–160 范围内），不越出屏幕底。水位仍按 hp/maxHp、mp/maxMp 和原来的 orbLerp 平滑，只改显示。
- Hud.ts（仅桌面）：层名牌匾改用 title_plate，底栏用 dialog_frame，经验条用 bar_frame + bar_fill_exp（宽度按比例 setSize），战斗日志底用 tooltip_frame，地图总览的 ✕ 用 btn_close（点击区仍是 48 矩形）。缺图时全部回退原绘制。位置条和小图标保留代码绘制。
- 手机（IS_MOBILE）：不建血球，也不用九宫格，沿用现状（Phaser HUD 隐藏，DOM HUD 不变）。
- tests/e2e/hotbar-click-verify.mjs：「点药水格 = 按 1」失败是脚本问题。脚本写在药水 1s 冷却（878a73f）之前，点击后 0.5s 就按 1，被冷却拦住。现在改为按游戏时间等过 1.1s 再按，断言改为瓶数和 HoT 入队。另外发现城内喝药 HP 不回升：World.step 城内分支提前 return，HoT 不结算。这属于战斗逻辑，没有改，脚本里输出 KNOWN 提示。
- 测试：新增 tests/ui-hud.test.ts（40 项，已加入 npm test）；新增 e2e tests/e2e/ui-hud-verify.mjs（27 项）。截图在 docs/shots/ui-art/b05/。
- 9-seed：sim-band 的 esbuild metafile 共 31 个输入，没有一个是本批改动的文件。

## UI 美术 B4 装备槽、品质框、血石空槽 feat/ui-art-b04（基于 feat/ui-art-b03 1a53fc2；docs/ui-art-integration.md §1 B4）
- `src/ui/uiSlices.ts`：新增 `slotBg()`（slot / slot_sel 九宫格）、`qualityFrame()`（qframe_common/magic/rare）、`bloodstoneSlot()`、`slotHitSize()`、`rowTint()` 和 `SKILL_ROW_TINT`。只用 setSize，边距从切片表读；图集被拦或缺帧时退回代码绘制。
- Panel.ts：背包、装备槽、仓库槽和装备对比图标改用切片槽底和品质框；有图集时用 slot_sel 表示选中，没有图集时仍用描边。手机上槽位点击区不低于 36 CSS px，但不超过槽距。技能行在有图集时恢复按状态着色的半透明叠层（已学、未解锁、可学），没有图集时不变。
- Hud.ts：桌面热键栏的技能格和药水格改用 slotBg，没有图集时退回原样。
- 血石空槽：游戏里还没有血石功能。为了不误导玩家，只接好帧和单元测试，`BLOODSTONE_SLOT_VISIBLE=false`，不显示。存档结构不变。
- 测试：新增 tests/ui-slots.test.ts（39 项，已加入 npm test）；新增 e2e tests/e2e/ui-slots-verify.mjs（33 项）。截图在 docs/shots/ui-art/b04/。
- 9-seed：sim-band 的 esbuild metafile 共 31 个输入，没有一个是本批改动的文件。

## UI 美术 B3 列表、页签与滚动条 feat/ui-art-b03（基于 feat/ui-art-b02 e948742；docs/ui-art-integration.md §1 B3）
- `src/ui/uiSlices.ts`：新增 `rowBg()`（list_row / list_row_sel 九宫格）和 `scrollBar()`（scroll_track + scroll_thumb，宽 8）。只用 setSize，边距从切片表读；图集被拦、缺帧或高度小于边距和时退回原矩形。
- `tabButton()`（TitleScene，mtext 带手机最小字号）：页签用 tab_on / tab_off，只有未选中的页签可点，点击区不低于最小点击高度；没有图集时退回 button()，当前页签前加 ▶。
- Panel.ts：商店页签改用 tabButton；杂货、书店、技能、城镇 NPC、任务、成就各行改用 rowBg，NPC 长列表滚动条改用 scrollBar。新增 `fitRow()`：把行内按钮点击区限制在行距内（手机 ≥36 CSS px），相邻行不重叠。手机上杂货和任务行距不低于 44 CSS px；书店在手机上按行高分页（◀ ▶）。技能行有图集时不再显示按状态着色的底色，改用 list_row / list_row_sel 区分。
- 多存档界面（844×390）：「返回」贴到屏幕底边、副标题太小，这两个问题在 B1 截图里已经有，不是 B2 引入的（B1→B2 的 TitleScene 改动只换了两处背景）。这次把面板上移到 60~700，「返回」放进面板内（底边约 369/390 CSS px）；手机上存档名改为 24、副标题改为 22 逻辑 px（约 12 CSS px），颜色调亮，最后游玩时间挪到第一行。
- tests/e2e/tapclose-verify.mjs：修正第 22 行 `sl` 未定义，加断言和失败退出码，12 项全过。
- 测试：新增 tests/ui-lists.test.ts（28 项，已加入 npm test）；新增 e2e tests/e2e/ui-lists-verify.mjs（1280×720 和 844×390 触屏，各跑有图集/图集被拦两遍，84 项）。覆盖页签切换、行点击区、背包 200 件翻到末页再翻回、传送员长列表真实拖动滚动且拖动不触发按钮或提示。截图在 docs/shots/ui-art/b03/。
- 9-seed：sim-band 的 esbuild metafile 共 31 个输入，没有一个是本批改动的文件，战斗结果不受影响。

## UI 美术 B2 面板与对话框 feat/ui-art-b02（基于 feat/ui-art-b01 9e8f363；docs/ui-art-integration.md §1 B2）
- `src/ui/uiSlices.ts`：新增 `frameBg()`。有图集且帧存在时画九宫格（只 setSize，边距从切片表读）；图集被拦、缺帧或尺寸小于边距和时退回原矩形（含描边）。另加 `listRowPitch()` / `rowHitHeight()` / `viewCss()`。
- Panel.ts：面板底改用 panel_frame，标题用 title_plate（仅有图集时画），角色卡与 NPC 立绘占位用 inset_frame，提示框与装备对比框用 tooltip_frame，对比框分隔线用 divider_v（高度不足时仍用 1px 线）。
- TitleScene：设置面板和多存档面板改用 panel_frame。Hud：地图总览改用 dialog_frame，底栏改用 panel_frame_s。WorldMapView：确认卡回退时用 dialog_frame（wm_frame 仍优先）。
- 手机城镇 NPC 列表：行距不低于 44 CSS px，行内按钮点击区不低于 36 CSS px 且不超过行距，相邻行不重叠。可视行数按行距自动减少，整列下移，避免盖住列表提示。滚动条和拖动换算改用新行距。桌面仍是 50 行距、44 点击区。
- 测试：新增 tests/ui-panels.test.ts（58 项，已加入 npm test）；新增 e2e tests/e2e/ui-panels-verify.mjs（1280×720 和 844×390 触屏，各跑有图集/图集被拦两遍），截图在 docs/shots/ui-art/b02/。
- 9-seed：sim-band 的 esbuild metafile 共 31 个输入，没有一个是本批改动的文件，战斗结果不受影响。

## UI 美术 B0 资源管线 + B1 按钮 feat/ui-art-b01（docs/ui-art-integration.md）
- 合并 origin/art/ui-plan 62d266c（美术2 最终图集）。`scripts/sync-ui-atlas.py`：把 docs/ui-preview/atlas/ui_atlas.{png,json}（512×512，46 帧 = 44 切片 + orb_fill_red/blue）拷到 public/assets/ui/，17 张手机 DOM 2x 图拷到 public/assets/ui/dom/，并从 slices.json（含 fixed/dom、最终边距）生成 src/data/ui-slices.ts。换图集只需重跑脚本，代码不改。
- `src/ui/uiSlices.ts`：边距只从表里读；`ns()` 九宫格工厂只用 setSize（禁 setScale）；`atlasReady()` 是唯一回退判断点；`minTapHeight()`：桌面 44 逻辑 px，手机 ≥36 CSS px；`domUrl()` 供 B6 用。
- 构建：vite compressAssets 加入 ui_atlas.png 与 ui/dom/*（无损 webp）；`assetUrl` 抽成纯函数 `mapAssetUrl`（src/assetUrlMap.ts）并映射这两类；json 帧表不改名。TitleScene preload 加载图集。
- B1：`button()` 签名不变，有图集时用 btn_normal/hover/pressed/disabled 九宫格，没有图集时退回原矩形绘制。点击区高度不低于最小点击高度，宽度等于按钮宽。
- 测试：tests/ui-atlas.test.ts（285 项：46 帧与表/slices.json 一致、边距合法、DOM 图与 dom 标记一致、src 无九宫格 setScale、assetUrl 映射、compressAssets 无损、缺图集/缺帧回退）已加入 npm test；e2e tests/e2e/ui-atlas-verify.mjs 截 1280×720、844×390 触屏的四态和图集 404 回退，截图在 docs/shots/ui-art/b01/。
- 9 seed：sim-band 的依赖图（esbuild metafile，31 个输入）不含本批改动的任何文件，结果不变。
## 三圣 4 件套装特效（feat/set-fx）
- 圣战 4 件：主角暴击率 +5%；暴击伤害 ×1.5，按额外部分算，倍率 1.8→2.2 [适配]。
- 法神 4 件：主角技能耗魔 ×0.9，向上取整，最低 1，0 耗魔不变；校验和扣除用同一个值 [适配]。
- 天尊 4 件：召唤物伤害 +10%（按继承后的伤害算，在减防前乘）；友方经 heal() 的治疗 +10%（治愈术、群疗、英雄治愈术、吸血、召唤重施回满），药水不算 [适配]。
- 官方数值未查到。setSpecials 去重，按当前装备实时计算，脱件、换装或读档后立即刷新。
- UI：面板显示暴击率和套装特效行；tooltip 的特效单独成行；技能耗魔显示折后值。
- 测试：tests/set-fx.test.ts 22 项；e2e set-fx-verify.mjs。9 种子不穿套时与 main 一致；SIM_SET4 下死亡中位数：战 20→9，法 11→8，道 17→13（道士最多 33→40）。

## 网络可达性测试页 feat/net-test
- 新增 public/net-test.html（部署后 /card-legend-proto/net-test.html）：串行测本站、Supabase REST、Supabase Auth，每项 8 秒超时，有状态码即可达；复制结果、重新测试；验证 tests/e2e/net-test-verify.mjs。

## feat/account-doc 账号与数据库方案（仅文档）

- docs/account-db.md：后端选型（CloudBase 推荐 / Supabase+自有域名备选；Firebase、LeanCloud、workers.dev 排除，附可达性来源）、账号体系、表设计（存档槽/灵符钱包与流水/订单）、云同步与冲突、防作弊底线、分阶段验收、需用户提供的账号密钥清单（均不进仓库）。未改代码、未建服务。

- 最终复核 m2：与 m1 一致；tsc/npm test/build/4 个 e2e 全过。

## balance-4050（feat/balance-4050，未合 main）[适配]
- r1 40–49 级升级经验 ×2（EXP_LATE_MUL），怪物经验仍按官方表定标 → 40–49 级用时 ×2.0，1–39 级 0 差异。详见 docs/balance-4050.md
- r2 FOE_BAND.atk 41–50 0.9→1.05：41–50 段中位 战3/法6/道5，整体中位 18/15/17（过头）
- r3 FOE_BAND.atk 41–50 1.05→0.97：41–50 段中位 战1/法1/道0（不足），整体中位 12/12/13
- r4 FOE_BAND.atk 41–50 0.97→1.01：41–50 段中位 战2/法3/道1，整体中位 14/14/13
- m1（合并 main 后）FOE_BAND.atk 41–50 1.03→1.05：41–50 段中位 4/6/5，整体中位 16/15/17（放宽 18），采用为终版
- r5 FOE_BAND.atk 41–50 1.01→1.03：41–50 段中位 3/3/3，整体中位 17/14/13（战士按放宽 18），采用为终版
## P3 eg-dungeon（feat/eg-dungeon）
- 6 个 Lv45–49 副本（赤月魔穴/恶魔祭坛[E7 双头]/卧龙/雷炎/魔龙血域/火龙神殿）：每日 3 次，用尽可进（600 s、掉率 ×0.25），首通必掉 1 件本职业套装件，之后 1/10 + D7 补正。
- D7 调率（只在副本击杀生效）：赤月恶魔 setChance 1→0.15，魔龙战神系 1/30→1/60；World.dungeons 开关，sim 关闭，9 seed 不变；凑齐一套中位 22–29 次。存档 dungeonRuns/dungeonFirst，旧档兼容。
- 命运之刃复核：官方为任务奖励，暂留祖玛 1/60 [适配]。docs/eg-dungeon.md；tests/eg-dungeon.test.ts。

- 验收：npm test 全量 EXIT 0（eg-dungeon 全过，D7 中位 22–29 次）；tsc/build 通过；Chromium 1280×720/844×390 进入赤月魔穴提示「今日剩余 2/3 次｜首通…」无报错，截图 docs/shots/eg-dungeon/。
## P2 eg-sets（feat/eg-sets）
- 新增 40–50 级 40 件装备（eg-equip.ts，图标用美术 E4 eq_<id> 64/128，id 恒等）；雷霆/烈焰/光芒、战神/圣魔/真魂 6 套；三圣 4 件档 + 职业特效接口 setSpecials()。
- 掉落 EG_DROPS（E1 ÷40，≤1/8，全部 ≥40 级层）；天尊进合击 BOSS；set_zuma/set_chiyue 停掉落、旧档保留。
- 修 equip-3050-plan 三行错表；docs/eg-sets.md；tests/eg-sets.test.ts（17 项）。

## feat/no-death-drop 死亡无损失

- 用户要求「死亡不再掉落任何东西」。全仓排查：唯一死亡惩罚是 World.respawn 扣 10% 金币（WORLD.deathGoldLoss=0.1，BattleScene 死亡提示文案）；无掉装备/背包/经验/耐久惩罚（本作无耐久）。已删除扣金币与该常量，提示改为「无损失」，README 同步。复活流程保留，deaths 计数口径不变。
- tests/no-death-drop.test.ts（3 职业：金币/经验/等级/背包/装备/药水/层/技能不变，死亡数 +1，读档一致）；battle.test 复活断言改为金币不变。
- 9 seed 对比（基线 3ba087e → 本分支，死亡数）：战士 中位 13→14，最多 17→23；法师 11→9，15→16；道士 12→11，26→26（道士种子 3/7/11/19/23/42/57/88/101：12/13/11/10/26/13/12/9/14 → 9/13/11/10/26/16/10/11/14）。三职业 9 seed 全部 50 级通关。
- 用时中位（模拟秒）：战士 13697→13773，法师 7925→8100，道士 16242→16874；法师/战士 0.58→0.59。原有 GAP（战士中位>12、道士最多 26/单层 6、法师/战士 <0.7）基线就有，非本分支引入。

## 手机版：装备对比面板点外部关闭 feat/mobile-tapclose
- 手机（IS_MOBILE）角色/背包界面：点装备弹出「身上/查看中」对比面板后，点面板外空白处即关闭并取消选中。
- 点面板内部不关；点其他装备格切换为对比该装备；按下到抬起移动 >8px（拖动/滚动）不算点击。
- 桌面行为不变（不挂监听，仍是悬停显示、移出隐藏）。
- 逻辑 src/ui/tapClose.ts，接线 Panel.tapOutside；测试 tests/tap-close.test.ts、tests/e2e/tapclose-verify.mjs。
## P2 eg-sets（feat/eg-sets）
- 新增 40–50 级 40 件装备（eg-equip.ts，图标用美术 E4 eq_<id> 64/128，id 恒等）；雷霆/烈焰/光芒、战神/圣魔/真魂 6 套；三圣 4 件档 + 职业特效接口 setSpecials()。
- 掉落 EG_DROPS（E1 ÷40，≤1/8，全部 ≥40 级层）；天尊进合击 BOSS；set_zuma/set_chiyue 停掉落、旧档保留。
- 修 equip-3050-plan 三行错表；docs/eg-sets.md；tests/eg-sets.test.ts（17 项）。


## 战斗平衡 balance-battle2 第三轮 [适配]
### 最终（r3-5；9 个 seed 跑 sim-bands，日志 r3-5-*）
改动：FOE_BAND.atk 41–50 段 0.97→0.9；FOE_BAND.spd 31–40 段 1.2→1.15；召唤物 summonNerfLv 15→11（只影响道士）。

| 职业 | 中位 R60/二轮/三轮 | 最大 | 单层最多 | 用时比（vs R60） | 段中位 1-10/11-20/21-30/31-40/41-50：R60 → 二轮 → 三轮 | seed19 | 通关50 |
|---|---|---|---|---|---|---|---|
| 战士 | 12/12/13 | 25/19/18 | 5/5/5 | 13736/12622=1.09 | 4/1/1/2/1 → 1/2/6/1/1 → 1/2/6/1/1 | 3/12/14 | 9/9 |
| 法师 | 11/18/11 | 14/28/16 | 6/5/5 | 8085/7417=1.09 | 4/5/0/0/0 → 2/3/0/2/9 → 2/3/0/2/0 | 10/8/7 | 9/9 |
| 道士 | 14/13/12 | 17/29/28 | 6/6/6 | 16262/15003=1.08 | 5/0/1/4/1 → 5/0/2/5/2 → 5/0/2/5/1 | 15/13/10 | 9/9 |

未达标：法师 21–30 段=0（已接受）、41–50 段=0；道士 11–20 段=0。召唤物已衰减到官方量级仍为 0，推测是治疗术 + 药，属玩家侧，不动。道士最多死亡 28，比 R60 的 17 高，但不在目标内。
验收：tsc ✓；npm test ✓（0 FAIL）；build ✓；4 个 e2e 覆盖三职业，全部通过，0 控制台报错，截图已查看。

## 战斗平衡 balance-battle2 第二轮（B 变体）[适配]
### 最终（HEAD 0a97e91，r2-11 加尸王殿修正；9 seed sim-bands，日志 r2-final-*）
| 职业 | 中位 R60→最终 | 最大 | 单层最多 | 用时比 | 段中位 1-10/11-20/21-30/31-40/41-50 | seed19 | 通关50 |
|---|---|---|---|---|---|---|---|
| 战士 | 12→12 | 25→19 | 5→5 | 13791/12622=1.09 | 4/1/1/2/1 → 1/2/6/1/1 | 3→12 | 9/9 |
| 法师 | 11→18 | 14→28 | 6→5 | 8320/7417=1.12 | 4/5/0/0/0 → 2/3/0/2/9 | 10→8 | 9/9 |
| 道士 | 14→13 | 17→29 | 6→6 | 16101/15003=1.07 | 5/0/1/4/1 → 5/0/2/5/2 | 15→13 | 9/9 |

未达标：法师中位 18（>14），21–30 段=0（r2-11 时为 1，尸王殿修正后掉回 0，这一段在 0/1 边缘、受随机性影响大）；道士 11–20 段=0（试过 atk/hp/spd/petAggro/dens/bossAtkEarly，均无效）。战士全部达标；单层 ≤6 ✓；三职业全通关 ✓；道士 s19=13 ✓。
验收：tsc ✓、npm test ✓（0 FAIL）、build ✓；4 个 e2e 覆盖三职业，全部通过，0 控制台报错，截图已查看。

## 法师/道士：保持 W 配置；未达标项与决策点见 docs/balance-battle2.md

## 战斗平衡 R60 草案 balance-battle2 W 战士（9 种子 sim-bands）
| 项 | 改前 | 改后 | 官方值 | 依据 |
|---|---|---|---|---|
| 普通怪段攻倍率 FOE_BAND.atk（按层目标等级 1–10/11–20/21–30/31–40/41–50） | 1/1/1/1/1 | 0.95/1.01/1.02/1.04/0.97 | 未查到 [适配] | 11–40 加压、1–10 与 41–50 小幅减压；新手图幽暗森林豁免不变 |
| 主线 BOSS 中期攻 bossAtkMid（15–30 级层） | 1.12 | 1.5 | 未查到 [适配] | 战士 21–30 段 0→1 |

| 职业 | 改前 中位/最大/单层/用时 · 段 | W 后 |
|---|---|---|
| 战士 | 10/23/5/12372s · 6/0/0/0/2 | 12/25/5/12622s · 4/1/1/2/1（种子19 3） |
| 法师 | 10/14/7/7489s · 6/3/0/0/1 | 11/14/6/7417s · 4/5/0/0/0（种子19 10） |
| 道士 | 11/36/5/14965s · 5/0/1/2/4 | 14/17/6/15003s · 5/0/1/4/1（种子19 15） |

## feat/world-map：两级世界大地图（W1–W4）
- W1 数据层 src/data/worldmap.ts：8 区域（bichi/woma/dushe/zuma/cangyue/fengmo/chiyue/hejiban，魔龙=hejiban），83 层全覆盖；异界裂隙挂在各自区域用 icon_wm_rift；东北紫雾浮岛仅装饰；区域出口用 portal 图标。节点坐标按 docs/art-requests.md W-1/W-2/W-3 锚点回填，无锚点者标 [适配]。
- 探索状态按存档位：沿用 reached，新增 townsSeen（旧存档无该字段 → 只点亮已到达层 + 当前城镇；坏值忽略）；Settings.wmZoom/wmArea 全局。
- 迷雾：未探索区显示 ？？？ + 等级段；传送沿用 World.canTeleport（费用 (层序+1)×20、冷却 30 秒、战斗中不可），未到达层「到达该层后解锁传送」。
- assets-manifest 登记 26 张世界地图美术（按需加载，加载失败回退占位）。
- 单测 tests/worldmap.test.ts（36 项）。
- W2 src/ui/WorldMapView.ts 接入 Panel 地图页：总图 ↔ 区域图、拖动/双指/滚轮/＋－缩放、群节点展开、确认卡传送/回城、Esc 逐级返回；手机 844×390 节点 82、字号 ≥24 逻辑像素，不与 HUD 重叠。e2e tests/e2e/worldmap-shots.mjs。
- W3 真图替换占位（底图/区域插画/图标/迷雾/边框），docs/art-requests.md 记 W 接入状态与 [适配] 节点。
- W4 地图总览新增「在世界地图中查看」（桌面按钮 / 手机 ≥44px），直接打开当前区域；传送员列表按世界地图区域分组并带区域名；docs/world-map-plan.md 更新决定（8 区域、hejiban=魔龙、裂隙留区域内、浮岛装饰、出口用 portal）。
## 战斗平衡 R56b（feat/balance-battle，合入 origin/main ae01726 balance-sys 后）
合并提交 acc05a5。9 种子（3/7/11/19/23/42/57/88/101），scripts/sim-bands.ts 口径。

| 轮 | 项 | 改前 | 改后 | 官方值 | 依据 |
|---|---|---|---|---|---|
| 0 | 模拟：卡关虚拟练级 | 只加经验 | 加经验和金币期望（掉率 × 金额均值 × 层系数） | — | 修模拟 bug：金币归零后买不到药，在尸王殿死循环（战士种子 88/101 卡 Lv29 未通关，单层 25 次）。游戏代码不变 |
| 1 | 精良/极品掉率 rarityRoll | 30% / 10% | 12% / 2% | 12% / 2% | 9 种子 × 3 职业都通关 50 级，一步到位，没有分步 |
| 1 | 战士防御成长 | 6/级（R56 改，原 5.5） | 6.5/级 | 未查到 [适配] | 改官方掉率后，战士在 6 时中位 19、种子23 单层 7；6.5 时中位 13、单层 ≤5。5.5 时种子101 未通关 |
| 2 | 战士防御成长 | 6.5/级 | 6.8/级 | 未查到 [适配] | 合入 main f937ee6 后复测与 6.5 相同（中位 13）；6.7 时中位 14，6.8 时中位 10、最大 23、单层 ≤5、用时中位 12372s |

| 口径 | 战士 中位/最大/单层/用时 | 法师 | 道士 | 法/战用时比 |
|---|---|---|---|---|
| main ae01726 原 sim | 22 / 35 / 20（尸王殿） / 14213s | 30 / 100 / 12 / 9579s | 5 / 10 / 7 / 12603s | 0.67 |
| main ae01726 + 修后 sim | 11 / 20 / 6 / 11383s | 30 / 91 / 8 / 9409s | 5 / 12 / 5 / 12743s | 0.83 |
| 合并 acc05a5 原 sim | 16 / 43，88/101 未通关 / 25 / 12519s | 9 / 19 / 6 / 7227s | 12 / 24 / 10 / 14172s | 0.58 |
| 合并 + 修后 sim | 11 / 25 / 5 / 11881s | 8 / 13 / 5 / 7227s | 11 / 22 / 5 / 14448s | 0.61 |
| 第 1 轮 | 13 / 18 / 5 / 12357s | 10 / 14 / 7 / 7489s | 11 / 36 / 5 / 14965s | 0.61 |
| 第 2 轮（最终，合入 f937ee6） | 10 / 23 / 5 / 12372s | 10 / 14 / 7 / 7489s | 11 / 36 / 5 / 14965s | 0.61 |

各 10 级段死亡中位（最终）：战士 6/0/0/0/2；法师 6/3/0/0/1；道士 5/0/1/2/4。

## 战斗平衡 R56 承接（feat/balance-battle，合入 origin/main e54c745 后）
基线 = 合并提交 5cc9854，9 种子（3/7/11/19/23/42/57/88/101），scripts/sim-bands.ts 口径。

| 轮 | 项 | 改前 | 改后 | 依据 |
|---|---|---|---|---|
| 1 | 战士防御成长 | 5.5/级 | 6/级 | 官方成长 未查到 [适配]；尸王殿为属性临界悬崖：种子3（24 级 def 185）死 140 次，种子7（def 194）0 次 |

| 职业 | 基线 中位/最大/单层最多 | 第1轮 |
|---|---|---|
| 战士 | 4 / 156（种子3）/ 140（尸王殿） | 5 / 8 / 6（蛛网晶洞，种子57） |

## 战斗平衡（feat/balance-battle，已直接合并 origin/feat/balance-sys 6c0643d）
本节的数值都是 [适配]：官方没有对应的公式，取值由 9 种子模拟（3,7,11,19,23,42,57,88,101）校准。

| 项 | 改前 | 改后 | 依据 |
|---|---|---|---|
| 伤害保底 | 无（最低 1） | 原始伤害 ×30% | 方案 B；官方公式未查到 [适配] |
| defFactor | 0.6 | 0.6（方案 B 的 0.5 已回退） | balance-sys 的怪物攻击按 0.6·DEF 校准，改成 0.5 后伤害整体偏高 |
| 主线 BOSS 攻击 | balance-sys 面板 | 目标≤15 级 ×0.6；16–30 级 ×1.12；≥31 级 ×1.15 | 模拟：×1.25 以上会在尸王殿形成死亡螺旋 |
| 主线 BOSS 攻速 1.2s、半血召唤 2 只 | — | 只在目标≥31 级的层生效 | 不限层时，尸王殿单层最多死 135 次 |
| 主线 BOSS 通用狂暴/AOE | — | 默认关闭（bossMainEnrageAoe=false）；自定义层照常 | 开 0.15/0.08 时，战士中位 9→18，法师 14→21 |
| 药水 | 立即回满 | 冷却 1s；0.5s 内分 2 跳回复；红药、蓝药各自计冷却 | 方案；红蓝分开计是 [适配] |
| 法师耗魔 | ×1 | ×1.15（方案为 ×1.3） | 用 ×1.3 时法师中位死亡 >25 |
| 火球/大火球倍率 | ×1 | ×0.9，所有法师技能再 ×0.75 | 让法战用时比接近 0.7 |
| 法师技能公共间隔 | 0.8s | 1.0s | 方案 G |
| 法师 HP | 300 + 33/级，防御成长 1.2 | 450 + 140/级，防御成长 4.5 | 模拟：法师中位死亡从 16 降到 8 |
| 烈火 / 半月 冷却 | 4s / 2s | 6s / 3s | 方案 G |
| 道士召唤物 | ×1 | 15→25 级线性降到 血、攻各 ×0.3 | HJ 统计：英雄伤害占比 ≤5%（目标 ≤35%） |
| 首图 幽暗森林 | — | 怪物面板不变（鹿 96/24、狼 224/47、狼王 1904/35） | 新手图豁免；法师 1 级 HP 有变化，见上行 |

9 种子死亡（改前 = 纯 balance-sys 6c0643d，改后 = 本分支）：

| 职业 | 改前 中位/单层最多/用时 | 改后 中位/单层最多/最多一种子/用时 |
|---|---|---|
| 战士 | 6 / 6 / 5141s | 9 / 5 / 21 / 5023s |
| 法师 | 16 / 24 / 2536s | 8 / 3 / 12 / 3426s（法战用时比 0.68） |
| 道士 | 7 / 20 / 6207s | 6 / 13 / 16 / 6811s |

未达标：
- 法战用时比 0.68，略低于 0.7。
- 战士、道士在 21–30 级段没有死亡。
- 道士种子 101 在蛛网晶洞死 13 次，改前就有 16 次，属于 balance-sys 的怪物生成问题。


## 平衡系统 阶段1+2（feat/balance-sys）
- 经验：怪物经验改为 21cq 官方值 ÷10（src/data/monsterExp.ts，55 只匹配，余者对数回归拟合，标 未查到[适配]）；层倍率按 plan-60h 段时长反推每级击杀数；叠加等级差衰减 高3/6/10 级 ×0.7/0.4/0.1；任务/环经验封顶 0.3×本层所需。升级表不变。
- 主线锚点 1→50（src/data/balance.ts MAIN_ANCHORS），支线取官方怪等级最近的主线锚点。
- 怪物面板按层目标等级公式生成（atk=0.6·DEF+k·HP，HP=PW×T，含模拟校准 [适配]），新手图豁免；BOSS 显示 L_f+5、面板按 L_f+2。
- 旧档：等级/经验保留，经验夹到本级所需−1，不掉级不报错。
- 测试：等级差衰减、锚点、官方经验、首清不跨级、任务封顶、旧档夹取；模拟按文档目标断言，未达标项打印 GAP（见报告）。scripts/sim-bands.ts 分段统计。


## 传世后续（fix/chuanshi-followup）
- 金甲骷髅按官方一次召唤 2 只：同时上限 2，再召唤补足/替换最旧；单只下调为骷髅 HP×1.1 攻×0.85 防×1.5（合计≈旧单只 1.1 倍，见 docs/skills-official.md）；自动施法：2 只健康时不重放。
- 手机 HUD 技能弧翻页：主动技能 >10 时出现「翻页 n/m」键，每页内 4 外 6，所有已学技能（含传世、F12 之后）均可点击施放；e2e tests/e2e/mobile-skills-verify.mjs。
- 商店「金币」标签上移缩小。
- R54 书店：只卖学习等级 ≤25 的书（覆盖之前的「传世秘籍」页，该页取消），按等级升序；书名不被「购买」按钮遮挡；每本显示「需LvXX」/「已学会」，等级不够按钮置灰并显示「差 N 级」；书店 NPC 两列先填满左列再右列，按等级连续阅读。
- R54 >25 级技能书（含传世）改为 BOSS 掉落：26–35 级只由尸王及以上 BOSS 掉、尸王掉率最高；>35 级由层等级≈书等级的 BOSS 掉。全表见 docs/skill-book-drops.md（数据 src/data/skillBookDrops.ts）。旧存档已学技能、背包里的书不受影响。
- R54 技能面板：按学习等级升序 + [Fn] 标签，两行不重叠，状态颜色，未学显示「需 LvX」及获取途径，全设备翻页，手机字号 ≥12。
- R54 动画不放大：攻击/受击/蓄力/待机呼吸关键帧 scale ≤1（src/ui/cardMotion.ts），主角、怪物、全部召唤物（骷髅/神兽/尸灵/金甲/替身，含升级变色骷髅）一致；e2e 实采 scale 全为 1.0。
- R54 快捷栏点击即用：桌面药水格新增点击（技能格原已支持），与按键同走 BattleScene.onKey/World 处理（数量不足、冷却、满血判断一致）；格子 pointerdown 即 stopPropagation。手机 HUD tap 同时拦截 touchstart/touchend/mousedown/mouseup，修复城里点药水槽导致角色走动的穿透 bug。商店书行：已学会/差 N 级时不显示价格，避免压按钮；掉落说明改单行。e2e tests/e2e/hotbar-click-verify.mjs。
- e2e 修正：mobile-skills-verify 诱惑之光目标改非免疫怪（骷髅在免疫表内）；chuanshi-verify 适配传世页取消（>25 级书模拟 BOSS 掉落入包后学习）并输出 ok/FAIL 判定。
- R54 技能数字整数显示（仅显示，不改计算）：统一 src/ui/fmt.ts（fmtInt/fmtText，四舍五入）。
## feat/multi-save
- 多存档位（默认 5，可配 5–10）：选择/新建/删除（二次确认）/改名，显示职业·等级·层数·最后游玩·游玩时长；旧档即槽 1 并写备份键（不覆盖已有备份）；设置全局；游戏内设置加「切换存档」。详见 docs/multi-save.md。

## feat/towns
- 盟重土城/白日门/封魔谷/苍月岛接入长街美术与 NPC/店铺摆位（TOWN_LAYOUT），龙人 x=5300，封魔谷/苍月岛用换色门面；装饰店不可进入；进店取最近门；城镇美术登记 assets-manifest 并懒加载。
- 新增 tests/towns.test.ts、tests/e2e/towns-shots.mjs。

## feat/balance-sys：21–30 死亡压力 + 掉落逐层测试
- 怪物侧：目标 21–30 级层普通怪攻 ×1.15；尸王殿普通怪攻 ×0.85、尸王攻 ×0.7 血 ×0.8；蛛网晶洞一只蜘蛛换蝙蝠。三职业 9 种子均 Lv50 通关，战士 20–29 段 5/9 种子有死亡（原 0/9）。数据见 docs/exp-curve.md。
- 新增 tests/drop-plan.test.ts：0–82 层逐怪校验装备需求封顶、docs/drop-plan.md 一致性。
- GAP：品质 12%/2% 未落地；食人花未放第 3 层；法师/战士时长比 0.62。

## 地图总览与位置条（feat/balance-sys）
- 点右上角层名弹「当前地图总览」：地图名、主线第 N/39、多层洞穴第 N/总层（地图组数据）、推荐等级、BOSS/精英/怪物、左右端出口名（与 backGate/nextFloorOf 一致，侧线显示回城，最后一层「已到尽头」）。
- 新位置条：整层宽、主角、BOSS、两端；≤1 屏高亮并提示「前方：下一张地图 X」/「后方出口：回 X」。
- 手机/桌面不与 HUD 重叠（e2e 重叠检查）；单测 tests/map-overview.test.ts（18 项）；docs/map-overview.md、docs/mobile-ui.md。
## 装备对比改版：左右并排（feat/balance-sys）
- 左=身上同部位、右=查看中；属性并集逐行对齐，缺项 0/「—」；差值涨绿降红，需要等级按「越低越好」反向；空部位右侧全绿。
- 戒指/手镯只列较弱一件（新 `cmpScore`），另一件注明；穿戴时同样替换较弱一件。
- 手机 844×390 字≥12px 不溢出；桌面 1280×720。单测 tests/equip-compare.test.ts（重写，14 项）；截图 equip-cmp-*.png。详见 docs/equip-compare.md。


## feat/balance-sys 技能书 extraDrops 钩子
- drop-plan.ts 新增空表 `BOSS_EXTRA_DROPS` + `applyExtraDrops`（只认 BOSS、已存在物品，几率夹 0–1，不重复）；数据归战斗开发，不断言具体技能书。tests/extra-drops.test.ts。

## feat/balance-sys 9:27 新手怪
- 注：第 1 层（兽人要塞）放雪人/食人花后，battle 模拟出现个别种子未通关（法师 1 种子、战士种子 11 卡 29 级），故第 1 层暂保持原布局；食人花数值已入表但未投放，待决定。
- 新增鸡/稻草人/多钩猫/钉耙猫/森林雪人/食人花，各用专属立绘（*_full.png）。官方 21cq 1.76 值写入 NOVICE_OFFICIAL / OFFICIAL_MON_EXP，折算 NOVICE_SCALE [适配]；羊未查到不加。
- 第 0 层：鸡/稻草人/双猫进前中段，森林雪人 ×2 做层尾守关（新 `Spawn.tail`，缩放不复制，计入目标总量）；第 0 层 15 只（旧 13），每屏 ≤6。第 1 层暂保持原布局（投放雪人/食人花会让 battle 模拟个别种子未通关，待决定）。新手怪掉落 [适配]：布衣/木剑/铁靴进第 0 层。
- 第 0 层蝙蝠移出；首章入口不跳级（测试：任意新手怪单杀 < 当前级经验 1/3）。
- docs/monsters-official.md 新手怪折算前后表（gen:monsters）、docs/floor-scale.md 更新；tests/novice-monsters.test.ts。

## 城内 NPC 长列表可滚动（传送员 / 比奇老兵等）
- 传送员、老兵的传送列表原来只显示前 8 个且超出面板；现在列出全部已到达楼层（最多 83 项），每列可视 7 行，超出即可滚动：手机触摸拖动、电脑滚轮/拖动。
- 只画可视窗口内的行（隐藏行不存在，不会被误点）；可滚动列的按钮改为抬起触发，拖动超过 8px 不算点击；右侧滚动条 + 「▲ 上面还有 N 项 / ▼ 下面还有 N 项」提示。
- 通用于 NPC 面板所有列（右侧环式任务/英雄列、书店、铁匠鉴定列等超过 7 行时同样滚动）。纯计算在 src/ui/scrollList.ts。
- 技能页电脑端底部说明文字上移 8px（原来压到面板边框外 6px）。
- 检查：背包、商店、技能、悬赏/成就、世界地图在 844×390 / 932×430 / 1280×720 内容都没超出面板框（技能页手机端本来就分页，世界地图本来可拖动/缩放）。
- 测试：tests/scroll-list.test.ts（单元）；tests/e2e/scroll-panels.py（e2e，需先 build 并起服务）；截图 shared-mobile/shots/scroll-*.png。

## 任务B：每层左端「返回上一层」传送门（feat/balance-sys）
- 去掉「回比奇城 [S]」红顶小房子和女头像，每层最左端换成传送门（public/assets/portal_exit_sheet.png 4 帧 8fps 循环，静态图 portal_exit.png 兜底，再缺就程序绘制）。
- 去向 `World.backGate()`：上一层（prevFloorOf）；第 1 层 / 区域首层 → 城镇（新手为小村）。文案「传送门：返回 XXX」，电脑端加 [S]；手机大按钮显示「上一层」/「回村」「回城」。
- assets-manifest 新增 SHEETS（portal_exit_sheet 256×384），loader 用 spritesheet 载入。
- 阶段4 补：普通怪原来的油/铁两次 lootRng 抽签位保留（弃用），BOSS 的油用原黑铁抽签位判定，避免掉落随机序列漂移把难度基线带偏（不改任何测试目标）。
- 测试：tests/back-portal.test.ts（门类型、目标、文案，manifest 两个 key 和文件）；battle.test 丢弃/出售用例补两件夹具。
- m4-monsters「再次进入重新刷新」：首领有刷新冷却（bossCdUntil），改为先断言小怪全刷、清冷却后整层全刷（7f5d285 合并 main 后即失败，非本次引入）。

## 祝福油只由高级 BOSS 掉 / 黑铁矿只能挖矿（feat/balance-sys 阶段4 追加）
- 祝福油：取消「BOSS 必掉」与 oilChance 小怪掉落；只在 OIL_BOSSES（祖玛教主、牛魔王、虹魔教主、赤月恶魔、黄泉教主、双头金刚、双头血魔；1.76 掉油名单 ∩ L≥28 BOSS）按 1/8 [适配] 掉；杂货铺停售（代码保留 SELL_OIL_IRON 开关）。
- 黑铁矿石：怪物不再掉（原 BOSS 必掉/小怪 5%），铁匠停售；新增最简挖矿 src/data/mining.ts：矿层 28–34 层（比奇矿区五层 + 山谷矿区两层，附官方链接），矿点在层宽 45%，W/空格 或手机大键「挖矿」读条 4s，移动/受伤/施法/死亡打断，产出纯度 1–2（31 层后 1–3），矿脉 300s 刷新，存档 mineCd（旧档兼容）。矿点图代码绘制，见 docs/art-requests.md F。
- 测试 tests/oil-mine.test.ts（进 npm test）；battle.test 中商店买油/买铁、BOSS 掉铁用例按新规则改为「停售/不掉」；赤月套用例角色等级 25→35（阶段3 赤月套需求 35）。docs/drop-plan.md 增「祝福油 / 黑铁矿」旧→新表。

## 立绘去复用 / 异界裂隙背景（feat/balance-sys art-wire）
- hj_guard、wolong_guard、fire_dragon_guard、leiyan_spider、cave_skel_warrior、cave_skel_general、axe_skeleton、cave_bat、cave_maggot 改用各自 `<id>_full.png`（main 重画·第1–8组）；其余 10 个已指向自身。
- 新测试 tests/art-unique.test.ts（进 npm test）：全部怪物立绘文件存在、不同单位不共用（显式允许名单附原因）、56–79 层出怪用自身立绘、bg_floor57–80 → 第 57–80 层且文件存在。
- 允许共用（缺图）：boss_hj_home↔boss_molong（有意共用），boss_wolong→boss_orc_chief、boss_leiyan/boss_fire_dragon→boss_redmoon（未交付）。

## BOSS 刷新 / 回城卷轴 / 装备需求 / 掉落计划（feat/balance-sys 任务 B、C、阶段 3、4）
- 任务B：BOSS 击杀后本层 600s（游戏时间，离线不走）内重进不刷 BOSS，小怪照常全刷，出口照开；冷却写入存档 bossCd，旧档视为无冷却。
- 任务C：回城卷轴读条 3s [适配]（官方瞬发），移动/受伤/主动施法/死亡打断且不消耗；H 键 / 手机顶栏「回城」/ 背包点击均可用；新角色送 3 张 [适配]，旧档不补发；杂货商有售。
- 阶段3：屠龙需求 15→34（官方）；自创沃玛/祖玛/赤月套需求 14/18/22 → 24/30/35（= TIER_REQ）[适配]。魔杖/银蛇（官方 26）、重盔甲/金戒指（官方 22）暂保留原值 [待决定]（模拟回归，见报告）。旧档已有实例不追溯。
- 阶段4：src/data/drop-plan.ts 覆盖层——武器按最低出现层 +8、其它装备 +14、普通怪 +6 封顶（万年树妖不再掉龙纹/裁决/无极/井中月、骷髅精灵不掉破魂）；移除条目下移到尸王（几率 ≤1/4）；圣战/法神/祖玛套/赤月套/铁戒指/中型盔甲补源；合击版 4 层 + 魔龙血域 BOSS 补本段装备。docs/drop-plan.md（npm run gen:drops，测试校验一致）。
- 8:37 校准：蛛网晶洞 3 只一包拆为 2+1；尝试 21–30 段怪物攻击 ×1.0/31+ ×0.92 后法师死亡中位翻倍，已回退。
- 测试：tests/balance-sys.test.ts 新增任务 B/C/阶段 3/4 断言；tests/sim-band.ts 每 10 级段死亡/击杀/耗时报告。

## 层长 + 怪量（feat/balance-sys 任务 A）
- 每层宽度改为可配置（Floor.widthScreens）：第一张图 5 屏、普通层 6–8 屏、洞穴/深层 8–10 屏，BOSS 房仍在最右端。出口、相机、背景、小地图都按当前层宽。
- 普通怪 ×1.8–2.5，按包均匀铺开，入口 800px 内不放怪，每屏最多 6 只。BOSS 数量不变。
- 离屏怪休眠。新增压力测试（单层 120 只怪）。
- 沃玛寺庙的门和分段按层宽等比缩放；保底号角改为门前小怪清完就给（修复 sim 卡在 38 级）。
- sim：SIM_MAX_T 放宽到 ×6（保护上限，不是验收指标）；同层连死 5 次回上一层练 1 级（玩家行为模拟）。三职业 9 seed 都在 50 级通关。
- 文档：docs/floor-scale.md。
## 传世后续（fix/chuanshi-followup）
- 金甲骷髅按官方一次召唤 2 只：同时上限 2，再召唤补足/替换最旧；单只下调为骷髅 HP×1.1 攻×0.85 防×1.5（合计≈旧单只 1.1 倍，见 docs/skills-official.md）；自动施法：2 只健康时不重放。
- 手机 HUD 技能弧翻页：主动技能 >10 时出现「翻页 n/m」键，每页内 4 外 6，所有已学技能（含传世、F12 之后）均可点击施放；e2e tests/e2e/mobile-skills-verify.mjs。
- 商店「金币」标签上移缩小。
- R54 书店：只卖学习等级 ≤25 的书（覆盖之前的「传世秘籍」页，该页取消），按等级升序；书名不被「购买」按钮遮挡；每本显示「需LvXX」/「已学会」，等级不够按钮置灰并显示「差 N 级」；书店 NPC 两列先填满左列再右列，按等级连续阅读。
- R54 >25 级技能书（含传世）改为 BOSS 掉落：26–35 级只由尸王及以上 BOSS 掉、尸王掉率最高；>35 级由层等级≈书等级的 BOSS 掉。全表见 docs/skill-book-drops.md（数据 src/data/skillBookDrops.ts）。旧存档已学技能、背包里的书不受影响。
- R54 技能面板：按学习等级升序 + [Fn] 标签，两行不重叠，状态颜色，未学显示「需 LvX」及获取途径，全设备翻页，手机字号 ≥12。
- R54 动画不放大：攻击/受击/蓄力/待机呼吸关键帧 scale ≤1（src/ui/cardMotion.ts），主角、怪物、全部召唤物（骷髅/神兽/尸灵/金甲/替身，含升级变色骷髅）一致；e2e 实采 scale 全为 1.0。
- R54 快捷栏点击即用：桌面药水格新增点击（技能格原已支持），与按键同走 BattleScene.onKey/World 处理（数量不足、冷却、满血判断一致）；格子 pointerdown 即 stopPropagation。手机 HUD tap 同时拦截 touchstart/touchend/mousedown/mouseup，修复城里点药水槽导致角色走动的穿透 bug。商店书行：已学会/差 N 级时不显示价格，避免压按钮；掉落说明改单行。e2e tests/e2e/hotbar-click-verify.mjs。
- e2e 修正：mobile-skills-verify 诱惑之光目标改非免疫怪（骷髅在免疫表内）；chuanshi-verify 适配传世页取消（>25 级书模拟 BOSS 掉落入包后学习）并输出 ok/FAIL 判定。
- R54 技能数字整数显示（仅显示，不改计算）：统一 src/ui/fmt.ts（fmtInt/fmtText，四舍五入）。

## 传世技能（feat/chuanshi-skills）
- 新增传世 16 技能（战士 雷霆剑/破击剑法/破盾斩/金刚护体/突斩；法师 冰箭术/冰龙破/玄冰刃/五雷轰/冰旋风；道士 赶尸/替身法符/灵魂墙/道心清明/神光术/解毒术）+ 金甲骷髅。学习等级取 DB 官方表，耗魔 DB×3，未查到项标 [适配]，详见 docs/skills-official.md。
- 书店新增「传世秘籍」页签（书店 NPC 第二栏），不进掉落池；旧存档不自动学会。
- 召唤：尸灵、金甲骷髅沿用骷髅规则（等级=技能等级、击杀升级变色、仇恨、自动重召）；替身法符转移仇恨；灵魂墙定身；破击/破盾几率破增益并破防。
- 快捷栏超过 10 个主动技能时改 3 行×6；F12 可用，更多技能点击施放。
- 测试：tests/chuanshi.test.ts；模拟新增 CS=1（购买传世秘籍）与 LEARNLOG=1。

## PWA 主屏幕全屏（feat/pwa-fullscreen）
- 修复 iPhone「添加到主屏幕」后画面偏小、四周黑边：
  - 手机上忽略旧的手动缩放（画布 transform）；
  - 视口改以 innerWidth/innerHeight 为准（独立模式下 visualViewport 可能停在旧值）；
  - pageshow、visibilitychange、旋转时多次重排。
- 元数据：manifest 改为 fullscreen，standalone 作回退，横屏，start_url/scope 为 /card-legend-proto/；新增 apple-touch-icon 180 和 icon-512（由 favicon 放大生成，见 art-requests）；theme 和背景改为黑色；html/body 用 dvh/svh/fill-available，position:fixed。
- e2e：tests/e2e/pwa-fullscreen-verify.mjs；文档：docs/mobile-ui.md「PWA」。

## 手机入口全覆盖（feat/mobile-fill）
- 右下大键按位置显示「进入/封印/上一层/回城/出城/对话」，入口在范围内高亮；左端回城与返回上一层可直接点大键。
- 手机端可直接点传送门本体进入；顶栏地图图标改名「传送」。
- 新增 e2e `tests/e2e/mobile-entrance-verify.mjs`：出口(键/本体)、BOSS 门、上一层、回城口、城门、传送员、地图传送、侧线出口全部触屏验证。
- 回城卷轴未实现，预留 `entranceHere/mobileAct` 扩展点。电脑端不变。

## 手机画面铺满（feat/mobile-fill）
- 手机模式下画布铺满整个可视区，iPhone 横屏两侧不再有黑边。逻辑高度固定 720，逻辑宽度按可视区宽高比扩展，范围 1280–2016（2.8:1），等比不变形。尺寸取自 visualViewport，地址栏收起或展开、旋转、resize 时实时重算（Phaser setGameSize + FIT）。
- 战斗相机加宽后能看到更多场景；World 坐标、碰撞、怪物位置不变。相机夹紧沿用 setBounds，按新相机宽度自动计算。
- 标题、城镇、面板：1280 内容居中，两侧显示延伸的背景（标题背景按最宽比例铺满并裁切，面板遮罩加宽）。
- sf0 屏幕固定物体统一用 fixedShiftX 补偿，宽度变化时增量修正。暗角贴真实屏幕边缘。
- Panel 拖动/滚轮坐标改用 toLogicX，已扣除居中偏移。
- 手机模式下 #game 不再加 safe-area padding，避开刘海由 DOM HUD 的 env(safe-area-inset-*) 处理。
- 电脑端逻辑宽保持 1280，代码路径不变；与 main 对比的截图差异为 0.03%。
- 测试：
  - 新增 tests/e2e/mobile-fill-verify.mjs，覆盖 7 种视口，包括地址栏展开和收起、CDP 模拟刘海。
  - mobile-ui-verify 和 lib 的坐标换算改为按相机 worldView 计算。

## 手机网页版界面（feat/mobile-ui）
- 新增 src/ui/MobileHud.ts：手机专用 DOM HUD，按 safe-area 布局，支持多点触控。
  - 左下浮动摇杆；右下技能弧（原图标、冷却、自动开关）、「进入/对话」键、4 个药水格、合击（有伙伴时）。
  - 左上细条 HP/MP/EXP（带数字）和可折叠日志（默认 3 行）。
  - 右上图标：角色/技能/悬赏/地图/回城/设置，每个只出现一次。商人与传送合并到「进入/对话」。
- 手机模式下隐藏 Phaser 版 HUD，旧的映射虚拟键（VirtualPad）不再创建。面板整体放大 1.2–1.28 倍，字号下限 18/20（src/ui/mtext.ts），关闭键 ≥44px。
- 场景提示去掉键位：「回xx城」「点「进入」」。
- 电脑端不变（IS_MOBILE 为假时代码路径与 main 相同）；?mobile=1/0、竖屏提示保留。
- 文档：docs/mobile-ui.md（桌面功能 → 手机入口对照表）。
- 测试：tests/e2e/mobile-ui-verify.mjs（四种横屏 + 面板 + 竖屏 + 桌面与 main 对比）。tests/e2e/lib.mjs 的 startPreview 新增可选 root 参数。


## sq-mir3 美术接入（feat/balance-sys）

- 63 个传世/传奇3 怪物与 BOSS 立绘（art/maps-sq-mir3 第1–7批）接入：`assets-manifest.ts` 增加同名 key，`units.ts` 中 SQMIR3 怪 art 改为自身 id（原占位贴图列保留作记录）。
- 第8批 10 张合层背景按交付表接入 bg_floor57–80（57–58、60–61、62–66、69–73、74–75、76–79 共图）。
- 测试：tests/balance-sys.test.ts（立绘文件存在、背景映射）。

## 平衡系统 阶段1+2（feat/balance-sys）
- 经验：怪物经验改为 21cq 官方值 ÷10（src/data/monsterExp.ts，55 只匹配，余者对数回归拟合，标 未查到[适配]）；层倍率按 plan-60h 段时长反推每级击杀数；叠加等级差衰减 高3/6/10 级 ×0.7/0.4/0.1；任务/环经验封顶 0.3×本层所需。升级表不变。
- 主线锚点 1→50（src/data/balance.ts MAIN_ANCHORS），支线取官方怪等级最近的主线锚点。
- 怪物面板按层目标等级公式生成（atk=0.6·DEF+k·HP，HP=PW×T，含模拟校准 [适配]），新手图豁免；BOSS 显示 L_f+5、面板按 L_f+2。
- 旧档：等级/经验保留，经验夹到本级所需−1，不掉级不报错。
- 测试：等级差衰减、锚点、官方经验、首清不跨级、任务封顶、旧档夹取；模拟按文档目标断言，未达标项打印 GAP（见报告）。scripts/sim-bands.ts 分段统计。
## 合击持续特效（feat/hj-fx-loop）
- 噬魂沼泽：起手段播完后，fx_combo_shihun 帧 8–11 往返循环作毒沼尾段，跟随主目标（主目标死后跟随仍中毒的目标），中毒 10s 结束 / 中毒目标全死即销毁。
- 末日审判：fx_combo_mori 帧 8–11 法阵循环跟随目标，持续掉血 8s 结束或目标死亡即销毁。
- 劈星斩：被麻痹目标头顶「⚡麻痹」闪烁标记 + fx_combo_pixing 帧 6–9 电弧循环（0.5×），3s 结束清除；BOSS 免疫麻痹不显示。
- 实现：src/ui/comboStatus.ts（ComboStatusTracker，无 Phaser 可单测）+ BattleScene 每帧按 world.time 与 Unit 状态同步；场景关闭全部清理。combo 事件新增表现字段 affected/statusUntil，战斗数值不变（9 种子死亡数与 main 一致）。
- 测试：tests/combo-status.test.ts（并入 npm test）；浏览器 tests/e2e/hj-fx-loop-verify.mjs。

## 传世/传奇3 地图（feat/maps-sq-mir3）
- 新层追加下标 56–79（旧档不变）：传世将军坟东一/二层、机关道一/中枢大殿、蛇魔谷/地穴入口/环道/百虫穴/五蛇殿、逆魔古刹一~四层/逆魔大殿、禁地 6 层（禁地之门→魔穴）；传奇3 蚂蚁洞穴、潘夜石窟、沙漠、潘夜神殿。全部「异界裂隙」侧线 [适配]，见 docs/maps-sq-mir3.md。
- 新怪 54 + BOSS 9（官方名；等级按相邻图递增、数值克隆同段怪 [适配]；官方数值未查到）；立绘/背景借用，缺图见 art-requests「feat/maps-sq-mir3」。
- 小地图在毒蛇山谷/比奇省/盟重省/封魔谷/白日门挂 24 个裂隙节点；经验倍率 SQMIR3_MULT_NEIGHBORS。
- 接入批3美术：7 张立绘（pincer_bug 等）与 bg_floor35/40/47/54 按区间复用到下标 34–55。

## 地图第 3 批（feat/maps-batch3，plan-60h B3）
- 新层追加在下标 34–55（旧档下标不变、无需迁移）：蜈蚣洞 12 层（地牢一层东/西/北/西二/北二 + 一线天/生死之间/黑暗地带/传奇部落/邪恶势力/幽名圣域/恐怖空间）、石墓一~四层/石墓阵/六层/七层、香石墓穴 3 层，均按 21cq 进出表与刷怪表，带来源链接。
- 去重：原下标 6「蜈蚣洞」= 死亡棺材 D606（触龙神），原下标 7「石墓·猪洞」= 石墓五层 D715（白野猪），只并入图群 wugong/shimu，不新增重复层。
- 通关顺序：尸王殿→地牢一层 5 层→蜈蚣洞→石墓一~四层→石墓·猪洞→沃玛寺庙；蜈蚣洞深层 7 层、石墓阵/六/七层、香石墓穴 3 层为侧线（清完回盟重土城）。
- 新怪 4 + BOSS 3：钳虫、巨型蠕虫、楔蛾、角蝇、邪恶钳虫、邪恶毒蛇、石墓尸王（等级/数值 [适配]，借用已有立绘）。邪恶钳虫2、红/黑野猪3、僵尸1–5 合并为已有怪 [适配]。
- 盟重省小地图新增 22 个节点（顺带挪开原蜈蚣洞/石墓节点避免重叠）；经验倍率 BATCH3_MULT_NEIGHBORS；背景占位 bg_floor35–56。

## 模拟补给策略（fix/sim-supply2）
- 仅改 tests/battle.test.ts 模拟脚本：进图前回村补红/蓝药，上限随层深增加（存钱期 min(3,1+层/4)，否则 3+层/2）；游戏数值未改
## 美术接入 batch2（feat/batch2-art）
- maps-batch2 6 个新怪（粪虫/沃玛勇士/沃玛战将/火焰沃玛/暗黑战士/僵尸·矿区）改用各自 `<id>_full.png` 立绘（新增 ASSETS key，art 指向），不再借用 zombie/woma_warrior。
- 背景：下标 24–26（沃玛寺庙入口/一/二层）→ bg_floor25.jpg，27–31（比奇矿区 5 层）→ bg_floor28.jpg，32–33（山谷矿区）→ bg_floor33.jpg，替换原 bg_floor6/5 占位。
- 传世技能图标 16 张（docs/chuanshi-skills.md）与现有技能 id 均无对应，未接入（不硬凑）；仅改图片路径，数值/战斗/技能逻辑未动。

## 地图第 2 批（feat/maps-batch2，plan-60h B2）
- 新层追加在下标 24–33（旧档下标不变、无需迁移）：沃玛寺庙入口/一层/二层（D021–D023，教主层=原沃玛寺庙下标 8）；比奇矿区 废矿入口→废矿区东部→矿区一层→桥 D412→矿区B二层（尸王）→尸王殿（原下标 5）；毒蛇矿区 山谷矿区 D421/D422（尸王）
- 通关顺序：沃玛自然洞穴·二→矿区 5 层→尸王殿；石墓→沃玛寺庙一/二层→沃玛寺庙。沃玛寺庙入口（只有蝙蝠/洞蛆）与山谷矿区 2 层为侧线练级层（SIDE_FLOORS），清完回城
- 全部练级图（farm）、不放商人、回城入口照旧（回比奇城）；小地图新增 10 个入口；尸王殿并入比奇矿区图群、教主层并入沃玛寺庙图群（S 上一层可逐层返回）
- BOSS 首杀必掉/官方刷新÷10：本作未实现该机制，层说明里已注明；官方刷新时间未查到
- 新怪 6 种：粪虫、沃玛勇士、沃玛战将、火焰沃玛、暗黑战士、僵尸（矿区，僵尸1–5 合一）。官方逐怪等级/数值未查到，全部 [适配]；矿区僵尸掉落沿用 zombie 的官方表
- 9 种子死亡数与改动前一致（战士 0/1/0/0/13/2/0/9/8、法师 6/1/0/6/3/14/1/14/3、道士 6/1/1/5/0/3/0/0/0）
- 新增测试（battle.test.ts B2 段）、e2e tests/e2e/maps-batch2-verify.mjs；缺图见 docs/art-requests.md「feat/maps-batch2」
## 模拟补给策略（fix/sim-supply2）
- 仅改 tests/battle.test.ts 模拟脚本：进图前回村补红/蓝药，上限随层深增加（存钱期 min(3,1+层/4)，否则 3+层/2）；游戏数值未改

## 合击版阶段 B（feat/hj-battle）
- 六合击各自效果（AOE/单体、无视防御/吸血/易伤/中毒/麻痹，数值 [适配]）；BOSS 免疫麻痹
- 6 个 fx_combo_* 美术需求；未到素材时 Graphics 占位（浏览器验证无报错）
- 新 BOSS 魔龙教主（HP 12000 官方；等级/攻防 [适配]）+ 支线层「魔龙血域」：不在主线，肃清回盟重不判通关；瞬移复用沃玛 fly
- 模拟 HJ_STATS 统计；英雄关闭时与 main 逐种子一致

## feat/art-integrate（接入 art/gap-fill 素材，只改图片路径/art 字段，数值未动）
- 物品图标：99 处 icon 改指 `assets/items/eq_<id>.png` / `assets/items/<id>.png`（装备 87、药水/卷轴/杂物 12；只指向实际存在的文件）；HUD 药水 potion_0..3 同步改为 items/hp_*/mp_*。
- 2x：新增 `itemIconUrl`，画质 >720p（Render.k>1）且存在 `@2x` 文件时加载 @2x（88 个，列表 src/data/item-icons-2x.ts）；显示尺寸不变。
- 怪物：23 个原借用他怪贴图的单位 art 改为独立立绘（M1 Boss 5、M2 8、M3 10 含神兽），ASSETS 补对应 key。
- 缺图回退：图标 404 → 纹理不存在 → 格子空/色块，无 JS 报错（tests/e2e/art-verify.mjs）。
- 召唤物姿态帧（L.2）：ASSETS 加 summon_skeleton_atk/hurt、summon_beast_atk/hurt；CardView.showPose 在召唤物攻击/受击时临时换帧（260/220ms）后切回原立绘，缺帧不换（保留原动画）。SUMMON_BEAST art=summon_beast。
- 未接入：M4（雪人王/钉耙猫王/半兽统领/恶灵尸王/黄泉教主/鹰卫/双头金刚/双头血魔）src 中无对应单位；boots 无 eq_boots 图仍用 gen_boots。
## 装备对比（feat/equip-compare）
- 物品提示新增与身上同部位装备的属性差：涨绿降红，属性相同显示「属性相同」；戒指/手镯分别对比左右两位；空位显示「未穿戴」；已穿的那件自身不对比
- 背包、商店、仓库共用同一提示，均生效；触屏点选即显示（沿用选中显示提示）
- 新增 tests/equip-compare.test.ts；e2e：tests/e2e/compare-verify.mjs、tests/e2e/maps-verify.mjs（洞穴群子层顺序/S 上一层/回城）
## 背包整理（feat/bag-sort）
- 背包页新增「整理」按钮：按品质（稀有→魔法→普通）再按需求等级降序；可叠加物（黑铁同纯度）合并，单堆上限 999 [适配]（官方上限未查到）；空格在后
- 兼容 200 格 / 每页 30 格，整理后回第 1 页；已穿装备不动；入参不被修改，旧存档无需迁移
- 新增 tests/bag-sort.test.ts（排序/合并/满包/空包/堆叠上限）；e2e：tests/e2e/bagsort-verify.mjs
## 合击版阶段 A 英雄战斗（feat/hj-battle）
- 英雄上场：攻击/跟随/休息三态（初始攻击，E 切换）、点击怪物卡指定目标、受伤/阵亡、复用召唤物仇恨与 playCombatAnim
- 召唤/收回（R），收回或阵亡后 60 秒冷却（官方 1 分钟），老兵面板同步
- 英雄自动用药（阈值 [适配]）
- 怒气：火龙之心储量补怒、储量 0 不补；满怒 G 爆发，同目标同范围自动释放占位合击，耗尽作废；combo 事件 + Graphics 占位特效
- 存档：burst 可选字段，旧档兼容；英雄不出战时模拟与 main 完全一致

## 合击版 #8 合击地图（feat/hj-maps）
- 追加合击层（合并 main 后下标 19–22，排在洞穴群之后）：保卫家园（四连本合一层 [适配]）、卧龙山庄（卧龙名将，H2）、雷炎洞穴（雷炎蛛王，2 层合 1 [适配]，H2/H8）、火龙神殿（火龙，H7；入口/等级未查到）
- 新区域「盟重·合击地图」接入世界地图与区域小地图；回城/逃脱卷 → 盟重；旧存档层号不变
- 新怪 8 种（小怪名称与全部数值 [适配]，官方怪物表未查到）；小怪 6–8% 掉书页，BOSS 必掉书页、50–100% 掉金条 [适配]
- 等级锚点延长到 49/50/51/52（≥43 合击，≥47 卧龙/雷炎）；模拟 3 职业死亡中位数 3/1/2

## 合击版 #7 龙人合书（feat/hj-books）
- 白日门新增龙人 NPC：书页×10→白日门技能书 [适配]；英雄 43 级 + 白日门技能书×2 + 金条×2（H1）学会对应组合合击（6 种名称官方），并获得火龙之心；书名官方未查到

## 合击版 #5 怒槽+火龙之心（feat/hj-rage）
- 火龙之心（储量 30000，H1/H5）、8 种补充物（蝎尾/鹿茸/阴阳仙草/九花玉露/九花雪露/元神丹/回气糕/补气丹，补充量 [适配]），肉/技能书也可补；怒槽满值 100 [适配]
- World.feedCompanionHeart；老兵面板显示怒槽/储量与「补充」；存档兜底夹值
- 战斗占位：rageTick / canUnleash / unleash（无结算）

## 合击版 #2 获取英雄（feat/hj-recruit）
- Lv40 在城镇老兵处免费领取英雄（选职业，默认名「职业+英雄」[适配]，H2/H3），一次性；召唤/收回开关写 recallAt（冷却结算留给战斗）

- fix/h-bugs aa7b2f2：修复 BUG-001（fx 图集最多重试 2 次）、BUG-002（低特效 Graphics 兜底共用上限）、BUG-003（贴图跨加载器去重），冒烟测试改为严格。

## 合击版 #1 英雄数据模型（feat/hj-hero）
- src/data/companion.ts：英雄（id companion，不与主角 hero 冲突）职业/名字/独立等级经验/英雄包裹 10 格 [适配]/英雄栏 9 格+火龙之心槽/模式 follow·fight·rest/怒槽字段
- 物品须经英雄包裹再穿（H5）；属性 = 同职业成长 ×0.8 [适配]；经验分成 50%、等级≤主人 [适配]（官方未查到）
- 存档新增 companion（缺省 null，旧档兼容）；tests/hejiban.test.ts

## 地图子层框架 + 洞穴群（feat/maps-more，plan-60h 第 1 批）
- Floor 新增 group（图群）/sub（官方子层名）/depth/src；通关按 FLOOR_ORDER，新层追加在下标 13–18，旧档下标不变、无需迁移（白骨墓穴=兽人古墓一层 D001，原样保留，不做 mapV 迁移）
- 新子层：兽人古墓二/三层（D002/D003）、骷髅洞·洞穴一/二层（D011/D012）、沃玛自然洞穴·一/二（E001/E002），全部练级图（farm），刷怪按 21cq 刷新表
- 起点「上一层」入口（S）按通关顺序返回前一层；World.upLayer() 同图群逐层返回；回城入口每层可用
- 层深难度 [适配]：官方第 d 层攻/血 ×(1+0.08×(d−1))（plan-60h §4），刷新怪同样加成；原有层与新手图不变
- 经验按子层：FLOOR_EXP_MULT 每个子层单独一项（白骨墓穴–尸王殿区间 ×0.3）
- 新怪：骷髅战士、骷髅战将、掷斧骷髅、洞蛆、山洞蝙蝠（数值 [适配]，官方名/刷新见 docs/monsters-official.md）
- 9 种子死亡中位数：战士 1 / 法师 2 / 道士 3

## 画质/分辨率选项（feat/hd-resolution）
- 设置新增「画质」：自动 / 720p / 1080p / 2K（存入设置 res；旧设置无此字段 → 自动）；自动按显示宽度 × devicePixelRatio 选最小够用档，手机最高 1080p
- 逻辑坐标仍为 1280×720：画布放大 k 倍（1/1.5/2），相机 zoom=k；文字按 k 倍分辨率栅格化，Graphics 矢量清晰；屏幕固定(scrollFactor 0)物体与面板拖拽坐标已换算
- 720p 保持原 pixelArt；高档位改线性过滤+抗锯齿（素材为手绘插画，非整数倍最近邻会锯齿）
- 切换档位保存后重载页面生效
- 2x 素材需求见 docs/art-requests.md；构建压缩会把图片缩到 ≤1280 宽，2K 下图片本身不会更清晰

## 背包 200 格（feat/bag-200）
- WORLD.bagSize 30→200（[适配]，用户要求）；所有满包判断仍走同一常量 WORLD.bagSize（拾取/商店/书店/祝福油/黑铁/仓库取回/卸装）；沃玛号角清怪保底仍按原设计满包也给
- 背包面板分页：30 格/页，◀ ▶ 翻页 + 末页；手机横屏同布局不溢出
- 存档版本不变，旧档背包原样读入
## 新手首图可反复刷（feat/first-map-farm）
- 幽暗森林（第 1 层）标记 farm：小怪/狼王死后 20 秒在原位刷新（[适配]，原版刷新间隔未查到）；英雄 400px 内延后 3 秒刷新，避免脸上刷怪；清图不锁图，可停留或回村再进，不强制下一层
- 狼王削弱 [适配]：血 900→680、攻 20→13（9 种子网格搜索选出，死亡中位数 战3/法2/道1、最大 9）
- 其他层难度不变；经验曲线：首图一轮 7 小怪约 20 经验、狼王 26；1→7 级约需 370，即 15–20 轮，8 级后每级需 170+、10 级需 600，刷首图收益自然递减，与原版 1–7 级区间一致
- 存档不变，旧档兼容
## charm（feat/charm）
- 法师新增诱惑之光（F11）：驯服 ≤ 自身等级+2 的生物系怪为宠物（上限 2/3/4/5），BOSS/不死/高智商免疫，失败飘「诱惑失败」/「免疫」，到时叛变；宠物不存档，旧档兼容；书按官方掉落接入（书店未查到不上架）；默认自动施放末位（成功率 ≥30%）。
- 9 种子模拟：法师种子 19 死亡 10→13（掉落序列漂移），可通关上限 12→14。

## town-return（feat/town-return）
- 新档出生在银杏村（新手村，官方 NPC 坐标），有药店/武器/服装/杂货/仓库/引导员；出村进第 0 层
- 每张战斗层起点的商人摊改为「回城/回村」入口（S 或点击），原路回进来的城镇；战斗地图不再有商人
- 存档新增可选 town 字段；旧档无此字段保持原层

- feat/taoist-skills（#12）：道士新增幽灵盾/神圣战甲术/群体治愈术（官方学习等级/修炼点；增益值/持续按官方公式缩放 [适配]，只加主角；持续中重复开启无效；群疗 ±170px 含召唤物）；占位特效复用魔法盾/治愈光柱；技能书 shop:false、drops:[] 暂不接入（沃玛教主 S9 群疗爆率由 PENDING_BOOKS 暂挡）。
- feat/mage-skills：法师新增大火球/爆裂火焰/地狱火/疾光电影/地狱雷光（官方学习等级/修炼点，耗魔·威力·冷却为卡牌适配，魔法伤害走魔御）；快捷栏/技能面板/手机扇形支持 10 技能、F1~F10；修复角色面板打开时升级/经验不刷新；技能书暂不接入书店与掉落。

- fix/h-bugs aa7b2f2：修复 BUG-001（fx 图集最多重试 2 次）、BUG-002（低特效 Graphics 兜底共用上限）、BUG-003（贴图跨加载器去重），冒烟测试改为严格。
- fix/h-bugs aa7b2f2：修复 BUG-001（fx 图集最多重试 2 次）、BUG-002（低特效 Graphics 兜底共用上限）、BUG-003（贴图跨加载器去重），冒烟测试改为严格。## R14 阶段 B（feat/town-stageB）
- #13 赤月恶魔改掉圣战/法神/天尊三职业套（按职业优先），套装加成 [适配]；屠龙改官方 req34、战士专用（21cq id=108）
- #14 沃玛寺庙分 一层/二层/三层/教主之家；教主需沃玛号角开门（消耗 1 个），沃玛战士/卫士 8% [适配] 掉号角，清怪保底
- #17 老兵处环式任务（20 级起，S12），铁匠处鉴定（35 级、1–3 条随机属性，500 金 [适配]）；旧存档兼容
- #15 docs/monsters-official.md 逐怪对照表（npm run gen:monsters，测试校验）；#18 docs/drop-rates-r14.md
- 修：844 宽街道店名标签与顶部 HUD 重叠（y 120→250）


