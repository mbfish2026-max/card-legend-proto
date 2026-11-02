# 自动挂机方案（feat/auto-hang，P1/MVP 已实现，未合 main）

> 基线：origin/main 665b01d。本文只写设计，**未改任何 src 代码，未跑任何 sim**。标「适配」的是本作自定规则，非官方；查不到的写「未查到」。
> 只读了：src/combat/World.ts（step/moveHero/自动普攻/autoCast/usePotionSlot/tickStone/pickup/respawn/useRecallScroll/出口逻辑）、src/scenes/BattleScene.ts（update/tryAutoSkills/onKey/walkTo/heroDied/onRespawn/saveGame）、src/settings.ts、src/ui/Hud.ts、src/ui/MobileHud.ts、src/ui/SettingsView.ts、tests/sim-lib.ts、src/data/world.ts 相关常量、CHANGELOG.md、docs/CHANGELOG.md。

## 0. 官方资料

| 来源 | 内容 | 用法 |
|---|---|---|
| 腾讯《热血传奇手机版》官网资料库 mir.qq.com/act/a20150615data/xtjs.shtml | 「在线挂机：玩家安全地图即可点击挂机按钮…所有技能将会自动释放，战斗都会自动完成」；「点击切换地图」；「点击boss挑战按钮…挑战成功后可以进入下一层」；「离线挂机：玩家下线之后，将自动进入离线挂机系统，再次上线将获得相应的金币和经验奖励」 | 官方手游：有开关按钮、技能全自动、**换图与 BOSS 由玩家手动点**；有离线收益 |
| 17173 转载盛趣《热血传奇》经典区更新公告（2024-06-14）mir.17173.com/content/2024-06-14/20240614152328159.shtml | 「新增自动挂机功能」；「个人副本爆出道具自动拾取」；「全部回收、全部出售道具功能」 | 端游经典区：挂机 + 拾取 + 一键出售是分开的功能；挂机具体规则（阈值、BOSS、换图）**未查到** |
| 第三方文章（非官方，仅参考）：html5.qq.com 转载怀旧服技巧、wuduy.com | 怀旧服 7 级后内挂 Ctrl+K 开挂机，含保护/回城/拾取；复古区「背包满或死亡时不会自动回城或出售」 | 非官方，只作印证，不作依据 |

官方挂机的用药阈值、巡逻方式、离线收益数值：**未查到**。

## 1. 现有代码事实（决定设计的约束）

- 地图是**横版一维通道**：英雄只有 x（左右）和小幅纵深 y（WORLD.laneMin −40 ~ laneMax 30）。没有二维墙体/障碍，也没有寻路；moveHero 只做边界夹紧（World.ts `moveHero`、`queueStep` 注释「被地图边界挡住：结束本格」）。所以「遇墙」= 撞到地图左右边界或被前排怪挡住。
- 起点 `WORLD.heroStartX = 220`；左端 `atReturnGate()` = x ≤ heroStartX+150（回城/上一层入口）；右端出口 `exitX`，`exitRadius = 90`。
- `BattleScene` 设 `world.requireUse = true`：到出口必须 `Input.use`（W/空格/手机「进入」）才切层；不给 use 就只提示「到达传送门：按 W/空格 进入下一层」。BOSS 层 BOSS 活着时出口封印。
- 自动普攻：`step()` 里 `inp.autoAttack !== false` 且 `meleeSide() !== null` 才打，**不追怪**（Settings.autoAttack 注释同）。
- 自动技能：`BattleScene.tryAutoSkills()` → `World.autoCast(Settings.skillsFor(cls), cds, lastAuto)` 轮转；召唤类已有召唤物且血 ≥ `AUTO_RESUMMON_HP = 0.5` 跳过；诱惑之光走 `charmAutoOk()`（成功率 ≥50%）；施毒 auto 跳过已中毒。
- 药水：`usePotionSlot(0/1/2)`（红/蓝/太阳水格选中药）、`selectedPotionIndex`、`potionCooldown`。现网游戏内**没有自动喝药**，只有 sim 喝药。
- 血石：`tickStone()` 每帧自动生效（野外）；小血石 HP<40% 每 2s +3HP；中/大/特 HP<20%/MP<10% 补 3%，8s 冷却（`World.STONE / STONE_S`，均为「适配」）。
- 拾取：`step()` 末尾对 `pickupRadius = 0.45 卡宽` 内落地物品自动 `pickup()`；背包满（`WORLD.bagSize = 200`）/药水 999 满时只打日志「背包已满，无法拾取」「药水已满，无法拾取」（3 秒节流）。
- 死亡：`heroDied` 3 秒后 `respawn()` → `enterTown(respawnTown())`，落点 `lastTownId`（feat/respawn-last-town 已合入 main，e3f73de），无损失，召唤物跟随。
- 回城卷：`useRecallScroll()` 读条 `RECALL_CAST = 3` 秒，受伤/移动打断（`cancelRecall`）；回城石（灵符商城）瞬发 30s 冷却（docs/CHANGELOG lingfu-combat 条目）。
- sim 的「AI」（tests/sim-lib.ts `simRun`）：每 tick `dx = 前方 queue(1)[0] 贴脸 ? 0 : 1`（只向右推进、不回头）；HP<40% 喝红、MP<40 喝蓝、SIM_POT=1 时 HP<30% 喝太阳水（`SUN_HP` 默认 0.3）；`potSelBest` 每格选有货里最强；全技能 cast + auto cast；补药 `potBuy`；死亡后 `respawn()` 再 `leaveTown(死亡层)`。**这些是 sim 参数，不是官方数值。**

## 2. 行为设计（①）

### 2.1 状态机（适配）
`OFF → PATROL ⇄ CHASE/FIGHT → (LOOT) → PATROL`；异常转 `STOPPED(原因)`。每帧在 `BattleScene.update` 里、`world.step` 之前算出一个 `Input`（dx/dy），与玩家输入同一通道，不在 World 内部偷改坐标。

### 2.2 巡逻路线与锚点（适配）
- 锚点 = 当前层的两端安全点：左锚 `L = heroStartX + 150 + 40`（避开回城/上一层入口，防误触；入口本身也要 use 才触发，属双保险），右锚 `R = exitX − exitRadius − 40`（不进出口判定圈，避免反复刷「按 W 进入」提示）。
- 在 L↔R 之间来回走；到锚点掉头。y 保持 0（不做纵深游走）。
- BOSS 层且「不打 BOSS」时：右锚改为 `min(R, BOSS 出生点 x − aggroRange − 60)`（aggroRange = 2.5 卡宽），不靠近 BOSS。
- 遇「墙」：本作无墙，只有边界和怪物排队。规则：① 到边界/锚点立即掉头；② 卡住检测：2 秒内 |Δx| < 8px 且附近无可打目标 → 掉头；连续 3 次卡住 → STOPPED「挂机卡住」。
- 矿点（MINE_FLOORS）不自动挖矿（挖矿读条会被移动打断，且属另一玩法）。

### 2.3 找怪、追击、脱战（适配）
- 选目标：存活敌人中，按 |x 差| 最近；搜索半径建议 `leashRange`（6 卡宽，1020px）内，且只选锚点区间内的怪；排除 `tier==='boss'`（若设置不打 BOSS）与 `pet`。
- 追击：dx = sign(目标.x − 英雄.x)；进入近战（`inMelee`）即 dx=0 站桩，交给现有自动普攻与 autoCast（与 sim 的「前方贴脸站定」一致）。法师/道士远程技能射程内也可站定：射程内有目标（autoCast 能放）时 dx=0。
- 脱战/回巡逻：目标死亡、或目标距锚点区间外 > leashRange、或 8 秒内对目标无伤害（够不着/被召唤物仇恨带走）→ 放弃，回 PATROL 继续原方向。怪自己的 leash（`u.ai = 'return'`）不改。
- 召唤物：跟随与接战逻辑在 World.step 已有（召唤物找 700px 内追击中的怪），无需改。

### 2.4 技能与召唤物（全部复用）
- 直接调用现有 `tryAutoSkills()`；挂机期间**强制视为 autoAttack 开**（挂机关闭后恢复玩家原 Settings.autoAttack）。
- 技能列表用 `Settings.skillsFor(cls)`（设置页勾选/优先级），不另建一套。召唤补召（AUTO_RESUMMON_HP 0.5）、诱惑门槛、施毒跳过已中毒都已在 `autoCast/cast(auto)` 内。
- 合击（G）、英雄召唤（R）：不自动（合击属手动爆发技；是否自动见待拍板 #8）。

### 2.5 自动用药（建议起点，均为 sim 参数非官方）
| 项 | 阈值 | 依据 |
|---|---|---|
| 红（槽 0） | HP < 40% → `usePotionSlot(0)` | sim-lib `h.hp < h.maxHp * 0.4` |
| 蓝（槽 1） | MP < 40（绝对值）→ `usePotionSlot(1)` | sim-lib `(h.mp ?? 0) < 40`；建议实装改为 `MP < 30% 或 < 最贵自动技能耗蓝` 二选一（待拍板 #3） |
| 太阳水（槽 2） | HP < 30% → `usePotionSlot(2)` | sim-lib `SUN_HP = 0.3` |
| 血石 | 不需额外代码 | `tickStone` 已自动 |
- 冷却中由 `usePotion` 自己拒绝，挂机层每帧调用即可（与 sim 一致）。用当前选中药，不自动换格（sim 的 potSelBest 是模拟玩家长按换药；可作为 P2 选项）。
- 用药消耗计入正常药水数，**不免费**。

### 2.6 血量过低 / 死亡（推荐）
- 「危险」判定：HP < 20% 且 红+太阳水 两格当前选中药都为 0（或冷却中超过 3 秒）。
- 推荐处理：**停止挂机 + 醒目提示**（日志红字 + 按钮闪烁），不自动用回城卷。理由：回城卷 3 秒读条受伤即打断（`cancelRecall`），低血时大概率失败白费；回城石瞬发但是灵符付费品，不宜替玩家消耗。可选 P2：背包有回城石且未冷却 → 自动用。
- 药水全部耗尽（三格都 0）即使血量健康：继续挂机但提示一次「药水已用完」；HP<40% 时按上条停止。
- 死亡：沿用 `respawn()` 回 `lastTownId` 城镇（无损失）。**推荐死后不自动恢复挂机**，挂机状态置 STOPPED「阵亡」；复活界面提示「挂机已停止」。理由：城内是安全区不能打怪，要恢复就得自动出城+走回死亡层（sim 就是这么做的 `leaveTown(df)`），这等于自动换图，且会形成「死→复活→再死」循环刷时间。

### 2.7 拾取与背包（推荐）
- 拾取：现有走过即拾（pickupRadius）。挂机推荐**开启拾取绕行**：PATROL 时锚点区间内 ≤ 400px 有落地物品（`world.ground`，`landAt <= time`）且无追击中的怪，先走过去捡，再回巡逻。官方经典区也把「自动拾取」作为挂机相关便利（见 §0，仅限个人副本）。
- 背包满：推荐 **停止挂机 + 提示「背包已满，挂机已停止」**（监听现有 log 文本不可靠，建议判断 `bag.length >= WORLD.bagSize` 且附近有捡不起的物品）。不做自动出售：战斗地图没有商人（BattleScene「战斗地图没有商人」提示），出售/回收属背包商店系统，归系统开发。P2 可与系统开发协作「一键出售白装/回收」（官方经典区有「全部出售」）。
- 药水满 999：只跳过该物品，不停。

### 2.8 BOSS 与换层（推荐）
- **BOSS 默认不打**：巡逻避开 BOSS（§2.2）。若 BOSS 主动追击（进入 chase）→ 不追不跑，停止挂机提示「遭遇首领，已停止挂机」交还玩家。理由：BOSS 有狂暴/AOE/召唤与装备卡点 `bossGearGate`（适配），挂机打 BOSS 会绕过「卡点」设计；官方手游也是 BOSS 由玩家点「boss挑战」手动触发（§0）。
- **不自动换层/不自动走传送门**：挂机从不发 `use`；锚点避开出口和左端入口。理由：requireUse 已天然保证；自动换层会让挂机跨难度段推进（层怪等级、FOE_BAND 递增），风险大；官方手游换图也是玩家点「切换地图」。
- 支线层（SIDE_FLOORS）到出口自动回城的分支在 `else if (this.atExit)` 里，requireUse 且未 use 时先走提示分支，按代码阅读不会触发（**未在游戏内验证**）；且锚点不进出口圈。

## 3. 开关入口与接管（②）

### 3.1 电脑版
- 按钮：桌面 Hud 右下，灵符商城按钮 `LINGFU_BTN = { x:1226, y:596, w:88, h:44 }` 正上方，建议 `{ x:1226, y:546, w:88, h:44 }`，文字「挂机 开/关」，`stopPropagation` 防穿透（同 LINGFU_BTN 写法）。是否与战斗日志/队列卡重叠：**未截图验证**。
- 快捷键：建议 `J`。BattleScene.onKey 已用：空格 B C E ESC G H I K L M N Q R S T W、1–4、F1–F10、方向键/A/D；J 不在该列表（只 grep 了 onKey 段，实现时需全局再确认）。
- 设置页（SettingsView）在「自动攻击」下加一行说明，不放开关（避免两处状态）。

### 3.2 手机版
- `MobileHud` 右侧竖排现为：技能弧 → `#mh-auto`（自动普攻开关，底 outerR+58，52×44）→ `#mh-shop`（`mobileShopBottom(outerR) = outerR+58+44+8`，52×44）。
- 建议新增 `#mh-hang` 52×44（≥44px），放 `#mh-shop` 正上方：bottom = `mobileShopBottom(outerR) + 44 + 8`。按 outerR=152（技能>4 个）算底边 314、顶 358 CSS px + safe-area；在 390px 高横屏上距顶约 26px，可能贴近右上 `#mh-top`（高 46）——**未实测，需 844×390/874×402/932×430 截图验证**；不行则备选：与 `#mh-page` 同行左移（right 124）。
- 不放进 `#mh-top`：顶栏已有 6 个 48px 图标，再加会压中间层名 `#mh-floor`（推断，未截图）。
- 挂机中按钮高亮 + 屏幕顶部小字「挂机中」。

### 3.3 接管规则（推荐）
| 玩家操作 | 结果 |
|---|---|
| 方向键/A/D/摇杆/手机方向（产生 dx 或 queueStep） | **立即关闭挂机**，本帧起玩家控制 |
| 再点挂机按钮/J | 关闭 |
| 手动放技能（F 键/点技能格）、喝药（1–4/点药格） | 不关闭（辅助操作），手动优先占冷却（现状即如此） |
| 打开背包/商城/地图/设置面板（paused） | 挂机暂停，面板关闭后继续 |
| W/空格/进入、H 回城卷、S 回入口、传送面板传送 | 关闭挂机后执行 |
| 战斗场景点地 | 战斗地图无点地行走（`walkTo` 仅城内），无需处理 |
| 城内 | 挂机按钮置灰「城内不可挂机」 |

## 4. 存档（③）
- 推荐：**挂机状态不写 SaveData**，读档/刷新后一律 OFF。理由：读档落点可能在城内；自动恢复会让玩家不知情地消耗药水。若要「记住偏好」，只把阈值等参数存 `Settings`（localStorage，同 autoSkills），开关本身不存。
- 离线：**默认不做离线收益**。官方手游有离线挂机金币/经验奖励（§0），但本作 BOSS 冷却 `BOSS_RESPAWN` 等均按游戏时间计、「离线不走」（docs/endgame-plan.md），离线收益需新的经济/经验公式与防刷，属系统+数值联合议题，列入待拍板 #10，不进 MVP。
- 标签页切后台：Phaser 默认后台暂停 update（未在本项目验证），即后台不挂机，视为与「不做离线」一致。

## 5. 可复用代码与改动清单（④）

### 5.1 复用
| 位置 | 复用点 |
|---|---|
| World.ts `step(dt, Input)` | 挂机只产出 Input.dx/dy，移动/普攻/拾取/血石全走原逻辑 |
| World.ts `autoCast` / BattleScene `tryAutoSkills` / `Settings.skillsFor` | 技能与召唤自动施放 |
| World.ts `queue(side)`、`inMelee`、`meleeSide`、`alive('enemy')`、`ground` | 找怪/站桩/拾取绕行 |
| World.ts `usePotionSlot`、`selectedPotionIndex`、`potionCooldown`、`pots` | 自动用药 |
| World.ts `tickStone` | 血石（无需改） |
| World.ts `respawn`/`respawnTown`、BattleScene `heroDied/onRespawn` | 死亡衔接（挂机只需监听 respawn 事件置 STOPPED） |
| World.ts `exitX`、`atReturnGate`、`requireUse`、`WORLD.heroStartX/exitRadius/aggroRange/leashRange` | 锚点 |
| tests/sim-lib.ts `simRun` 内 dx 规则与喝药阈值、`potSelBest` | 起点参数；**sim-lib 本身不改**（避免基线轨迹变化） |

### 5.2 预计改动（估算）
| 文件 | 改动 |
|---|---|
| 新增 src/combat/autoHang.ts | 纯函数状态机 `autoHangTick(w, st, dt): { input, potions, stop? }`，不依赖 Phaser，可单测 |
| src/scenes/BattleScene.ts | update 中接入；接管检测；onKey 加 J；respawn/面板/城内处理 |
| src/ui/Hud.ts | 桌面按钮 |
| src/ui/MobileHud.ts | `#mh-hang` + 布局 |
| src/settings.ts | 可选：阈值参数 |
| src/ui/SettingsView.ts | 说明文字 |
| tests/auto-hang.test.ts（新） | 状态机单测（巡逻掉头、卡住、不进出口、不打 BOSS、低血停、背包满停、接管） |
| tests/e2e/auto-hang-verify.mjs（新） | 4 分辨率截图 + 点击区 ≥44 断言 |

工作量（**估算**，未实现验证）：任务约 8 个；MVP 约 12–16 人时（状态机 4–5、场景接入/接管 3–4、两端 UI 2–3、单测+e2e 3–4）；P2 另约 8–12 人时。

## 6. 风险（⑤）
- 难度：挂机等于「无限耐心的玩家」，刷低层经验/掉落变轻松。MVP 限制：不打 BOSS、不换层、低血停、死亡停、背包满停、药水照常消耗、城内不可挂。是否加经验/掉落折扣：待拍板 #9（推荐不打折）。
- 数值与 sim 基线（定性，未跑 sim）：sim 本就模拟「自动打+自动喝药」，所以挂机在**单层内**的战斗强度与 sim 假设接近；差异在于 sim 只向右推进、清层即走（另有 SIM_REPLAYS 重刷），挂机是同层反复刷，会让玩家在某层停留时间远超 sim，等级/装备曲线比 sim 基线更快——即真人实际难度低于 sim（docs/CHANGELOG 已有类似已知偏差「真人反复刷 BOSS 时 40+ 装备获得更快」）。挂机不改任何数值，sim 基线本身不变。
- 怪物刷新：进层时普通怪全量重刷（loadFloor「任务B」），层内打完是否再刷：**未查到**层内定时刷新逻辑（只读了 loadFloor 段）。若层内不刷新，挂机清完后只会空巡逻——需要「清空后停止/提示」或协作加刷新（待拍板 #6）。
- 边界协作（系统开发负责：背包/商店/存档）：背包满处理、一键出售/回收、离线收益、任何存档字段——本方案 MVP 不加存档字段，不碰商店。
- 性能：每帧多一次 O(敌人数) 扫描，量级同 sim，风险低（未测）。
- 与回城读条、挖矿读条冲突：挂机产生的移动会打断读条；规则上读条期间挂机让出（dx=0）。

## 7. 待魔兽/用户拍板
| # | 问题 | 推荐 |
|---|---|---|
| 1 | 挂机解锁等级 | 不限等级（官方怀旧服内挂 7 级来自第三方文章，未查到官方） |
| 2 | 用药阈值 | 红 HP<40%、太阳水 HP<30%（sim 参数）；可在设置里调 |
| 3 | 蓝药阈值 | MP<30%（sim 用绝对值 40，高等级不合理） |
| 4 | 低血无药 | 停止挂机并提示，不自动用回城卷/回城石 |
| 5 | 死亡后 | 不自动恢复挂机 |
| 6 | 层内怪清空 | 提示「本层已清空」后停止（或协作加层内刷新） |
| 7 | BOSS | 不打，被 BOSS 追击即停 |
| 8 | 合击/英雄召唤 | MVP 不自动 |
| 9 | 挂机收益折扣 | 不打折 |
| 10 | 离线收益 | 不做 |
| 11 | 背包满 | 停止+提示；一键出售另立项（系统开发） |
| 12 | 拾取绕行 | 开（400px 内） |
| 13 | 自动换层/传送门 | 不做 |
| 14 | 快捷键 | J |
| 15 | 读档恢复 | 不恢复，一律关闭 |

## 8. MVP 与分阶段
- **MVP（P1）**：两端开关 + J 键；L↔R 巡逻、卡住掉头；找怪追击站桩；复用自动普攻/autoCast；三格自动用药（§2.5）；低血/死亡/背包满/BOSS 追击/城内 → 停止并提示；方向输入接管；不存档、不离线、不换层、不打 BOSS；单测 + 4 分辨率截图。
- **P2**：拾取绕行；设置页阈值调节；自动换最强药（potSelBest 思路）；回城石自动回城（可选）；层清空处理。
- **P3（需拍板/协作）**：一键出售/回收（系统开发）；离线收益（系统+数值）；可选「指定挂机层」。

## 9. 未验证项
- 桌面/手机按钮位置未截图，是否与日志、#mh-top、技能弧冲突未验证。
- J 键是否被其他场景占用只查了 BattleScene.onKey。
- 层内怪物是否定时刷新未查到。
- Phaser 后台标签页暂停行为未在本项目验证。
- 支线层在 requireUse 下的出口分支按代码阅读推断，未在游戏内验证。
- 未跑 tsc/test/sim（本分支只加文档）。

## 10. 实现状态（P1/MVP，按 15 项推荐值）

已实现：src/combat/autoHang.ts（状态机），BattleScene 接入，Hud 桌面按钮 1226,546 88×44 + J 键，MobileHud #mh-hang 52×44，设置页红药/太阳水/蓝药阈值（默认 40%/30%/30%，20–60% 循环），tests/auto-hang.test.ts（22 项），tests/e2e/auto-hang-verify.mjs、tests/e2e/auto-hang-layout10.mjs。
停止条件：低血且无药（停+提示）、死亡（复活后不恢复）、本层清空、遇首领/被首领追、背包满、卡住 3 次。连招、召唤物不自动；不存档，读档后为关；开面板暂停；方向键/A/D/摇杆接管，手动技能/药不关闭。

### 与方案的偏差（均为「适配」）
- 「用户新增」：本层清空不再 cleared 停止，改为换层往返循环，详见 §12；cleared 停止只在测试 / 旧逻辑里保留类型。
- **手机入口位置**：方案写「#mh-shop 正上方」。实测法师学满 10 技能（outerR=152）时，844×390 / 874×402 宽下按钮与顶栏按钮重叠，所以改到 #mh-shop **同一行左侧，留 8px**（right = 8+52+8）。
- 远程站桩只是近似：非战士、MP≥10、距离≤300px 时原地输出。
- 低血停止阈值固定为 20%，只在红药格（0）和太阳水格（2）都没药时触发。
- 「本层清空」= 没有非首领怪、farmQueue 为空、地上没有物品。
- 横幅放在 UI 场景，位于屏幕宽度中线、高度 18% 处，5 秒后消失。
- 放弃目标：连续 8 秒打不出伤害就放弃，此后 10 秒内忽略该目标。
- 卡住：2 秒内移动不到 8px 算一次，掉头；累计 3 次停止。只有单测验证，游戏内未复现。

### 未验证
- 卡住后掉头和停止只在单测里验证过。真机触屏、iOS 安全区、长时间挂机的性能都未查到。

## 11. fix/hang-stuck：道士站在远处不靠近、不攻击

**现象**：挂机时，英雄停在离怪约 300px 处，既不靠近也不出手。用户确认是道士。

**根因**（src/combat/autoHang.ts，修复前）：
- 远程站桩条件是 `w.cls !== 'warrior' && h.mp >= 10 && gap <= 300`。满足时 dx=0，英雄停在原地，只靠 autoCast 出手。
- 道士 Lv5–20 的默认自动技能只有 `heal`（DEFAULT_AUTO_SKILLS）。另外几种情况也一样放不出攻击技能：施毒已挂上、没有护身符、技能在冷却。这时 MP 仍 ≥10，英雄停在 gap≈297px 处，什么都不放。
- 普攻只在 meleeSide() 找到近战距离内的敌人时才会触发（gap ≤ max(range)+0.5），所以也不出手。
- 要等 giveUpSec=8s 内目标不掉血，才会放弃目标。换到下一只怪后，又会照样站桩。骷髅或施毒造成的零星伤害还会不断重置这 8 秒。
- 复现：
  - 单测：修复前 6 FAIL，全部是道士。Lv10 只会治愈术，左右两侧 290/600px 空转 7.3–8.0s；施毒+骷髅，左 250/290px 空转 3.7/4.1s。日志 /workspace/pcsim/hangstuck-before-unit.log。
  - e2e：用旧构建跑道士。道士 Lv10 在 1280×720 和 844×390 下，左右 290/600px 共 8 FAIL，空转 7.1–9.0s（墙钟）。日志 /workspace/pcsim/hangstuck-e2e-before.log。

**修复**（只改挂机决策，没有改战斗数值）：
- 站桩改成看实际出手：`acted()` 检测 h.cd 上跳（普攻）或 MP 下降（施法）。站桩超过 `HANG.standSec=1.5s` 仍没有出手，就对该目标设 `meleeOnly`，走到近战距离普攻。
- 兜底：dx=0 且超过 `HANG.idleSec=4s` 没有出手，就忽略该目标 10s，掉头巡逻。英雄不会原地发呆。
- 顺带修了一个 UI 问题：`Fx.frostTint` 在冰箭飞行途中目标已经死亡销毁时（scene=undefined），原先会抛 TypeError。挂机法师 e2e 会触发它，现在直接跳过。

**回归测试**：
- tests/hang-stuck.test.ts（已接入 npm test）：真实 World，6 组用例 × 左右两侧 × 60/250/290/600px，共 48 项。
- tests/e2e/hang-stuck-verify.mjs（`npm run verify:hang-stuck`）：1280×720 和 844×390 两种尺寸，空转按游戏时间计（W.time），要求 ≤3s 且怪掉血，控制台 0 报错。

## 12. 清层后换层循环（「用户新增」，fix/hang-stuck）

> 用户新增：这一节推翻 §2.8 和 §10 原定的「不换层，本层清空即停止（cleared）」。

**行为**（src/combat/autoHang.ts 的 `phase: farm | toNext | back`）：
1. farm：本层怪清空（无活怪、无待刷、无掉落），且 `canCycle()` 返回 null 时，进入 toNext。横幅显示「本层已清空，正在进入下一层…」。
2. toNext：每帧 dx=+1、use=true，走到出口后由 World 现有的出口逻辑 loadFloor(下一层)。途中 `fight:false`：BattleScene 关掉普攻和自动技能，也不拾取。
3. back：到了下一层就不战斗。横幅显示「正在返回原层…（途中不战斗）」，并往左走到返回入口（x ≤ heroStartX+150）。到达后 BattleScene 做淡出，再调用 `world.prevFloor()`。prevFloor → loadFloor 会把普通怪全部重刷。首领在冷却期内不会重刷，冷却沿用现有 BOSS_RESPAWN。
4. 回到原层后，`cycles++`，横幅显示「已返回原层，怪物已刷新，继续挂机」，回到 farm。如此循环。
5. 召唤物：沿用 loadFloor/prevFloor 里已有的 placeSummonsNearHero（与 fix/summon-mapchange 同一机制），换层时保留召唤物并放到英雄身边。本分支没有改召唤逻辑。

**无法往返时：选择「停止并提示」**（新增停止原因 `nocycle`，提示文案为「本层已清空，下一层无法往返刷新，挂机已停止（原因）」）。
- 原因有四种：本层是侧层（出口直接回城）；已是最后一层；出口被首领封印；下一层的返回入口不通往本层（例如区域首层回城）。
- 另预留 `minLevel` 钩子。代码里没有进层等级门槛（未查到），所以「等级不够」分支只在单测里注入 minLevel 验证。
- 不选「原地等刷新」，理由：非练级层不重新加载就不会刷怪，原地等只会无限空转，违背「不发呆」。

**保留的停止条件**：死亡、低血无药、背包满、遇首领、卡住。
- 换层途中（toNext/back）跳过首领和背包检查，不战斗、只赶路。下一层的首领或追来的怪都不理，继续往回走。死亡和低血无药照常停止。
- 返回入口 4s 仍未换层（例如 prevFloor 失败），按卡住停止。
- 偏差（适配）：如果首领不在冷却期（副本次数内每次进层都会刷），返回原层后首领会重刷，按既有规则 `boss` 停止，最多完成 1 轮（单测覆盖）。

**测试**：
- tests/hang-cycle.test.ts（已接入 npm test，20 项）：真实 World，3 职业各循环 2 轮；末层和等级门槛 → nocycle；下一层低血无药 / 死亡；循环中背包满；首领无冷却 → boss；道士召唤物跟随。
- tests/e2e/hang-cycle-verify.mjs（`npm run verify:hang-cycle`，44 项）：
  - 道士在 1280×720、844×390、874×402、932×430 四种尺寸下测，法师和战士只测 1280×720。
  - 每个用例跑 2 轮循环，检查怪物重刷、途中普攻 0 次、横幅三条文案和控制台 0 报错。
  - 另测侧层 nocycle，以及循环中死亡、低血、背包满。
  - 适配：e2e 清层后会把英雄放到出口前 400px 处，以缩短用时；单测走完整地图。
