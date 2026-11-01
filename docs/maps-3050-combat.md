# maps-3050 战斗字段（feat/maps-3050-combat）

基线 origin/main@85434e0。需求来源：origin/feat/maps-3050 `docs/maps-3050-plan.md` §4「给战斗开发的需求」+ 用户经魔兽转达的数值。本分支**只做战斗行为与怪物定义**，不新增地图层/spawns（地图侧 M-a/M-b 负责）。

## 1. 现有怪物战斗字段（src/combat/types.ts `UnitDef` / `Unit`）
| 字段 | 含义 | 备注 |
|---|---|---|
| `tier: 'player'\|'normal'\|'boss'` | 普通/BOSS | **BOSS 判定统一用 `tier === 'boss'`**；`Unit.boss` 已被占用为 BOSS 机制状态（BossState），不能再当布尔用 |
| `range` | 攻击距离（px，贴身间隙） | 近战 6–8；已有远程怪 掷斧骷髅 `range: 220` |
| `speed` / `atkInterval` / `atk` / `def` / `mdef` | 移速/攻速/攻/物防/魔防 | 主线层面板由 balance-sys `foeStatsAt` 覆盖 |
| `stunUntil` / `slowUntil` / `poisonUntil` … | 运行时状态（Unit） | `stunUntil` 已有：合击麻痹、困魔咒作用于怪；**怪→主角的眩晕此前不存在** |
| BOSS 重生 | 全局 `BOSS_RESPAWN = 600`（World.ts），按**层**记 `bossCdUntil[floor]` | 无单怪字段 |
| 不移动 | 无字段；仅 `boss_redmoon` 在 AI 里按 id 硬编码不移动 | |
| 魔法攻击 | `damage(..., magic)` 参数存在（0–1 魔法占比），但怪物普攻恒为物理 | |

无 `immobile` / `onHit` / `ranged` / `magic` 字段。

## 2. 五种怪现状
| 怪 | 数据 | 立绘 | 缺什么 |
|---|---|---|---|
| 幽影武士 `sq_youying` | **无**（仅 art-requests） | 已交付 `sq_youying_full.png` | 定义 + 命中眩晕 |
| 烈焰使 `sq_lieyan_shi` | **无** | 已交付 | 定义 + 不移动 |
| 禁地魔王 `boss_sq_jindi` | 有（Lv32 BOSS，克隆 boss_redmoon，range 8，speed 70），在「禁地·魔穴」 | 已有 | 不移动；重生已是 600 s |
| 闪电魔 | BOSS `boss_sq_shandian` **无**数据（立绘已交付）；普通怪「闪灵」`sq_shanling`（又名闪电魔，近战 range 6）在禁地各层 | 已交付 | BOSS 定义 + 远程雷系 |
| 利爪魔 | 普通怪 `sq_lizhua` 有（近战 range 6）；BOSS 版无 | 用 sq_lizhua 立绘 | BOSS 定义（近战，已满足） |

## 3. 「每层两只 BOSS」现状
- 主线已有 2 层双 BOSS：52 石墓七层（boss_shimu_lich + boss_evil_snake）、82 恶魔祭坛（双头金刚 + 双头血魔）。
- 出口在**任一** BOSS 存活时封印，同一次进入必须两只都打。
- 冷却按层：杀第一只就给整层记 600 s，重进时**两只都不刷**（未杀的那只也被跳过）。→ 改为按「层:怪 id」记冷却。
- 黑暗轮回（闪电魔+利爪魔）本身尚未入库（地图侧 C6），这里只保证机制支持。

## 4. 字段方案
| 字段 | 新增/复用 | 类型 | 含义 |
|---|---|---|---|
| `tier: 'boss'` | 复用 | — | BOSS（含眩晕免疫、重生） |
| `range` | 复用 | number | 远程射程 |
| `BOSS_RESPAWN` | 复用 | 600 s | 禁地魔王重生 |
| `stunUntil` | 复用 | Unit 运行时 | 眩晕状态（扩展到主角/召唤物/英雄） |
| `onHit` | **新增** | `{ stun?: { chance: number; dur: number } }` | 本怪普攻命中后按几率眩晕目标 dur 秒 |
| `immobile` | **新增** | `true` | 不追击不移动，只打射程内目标 |
| `ranged` | **新增** | `true` | 不必排队首位，射程内即可攻击（隔着前排） |
| `magic` | **新增** | number 0–1 | 普攻魔法伤害占比（走魔御），1 = 纯魔法；有 `magic` 的远程怪播雷击特效 |
| 存档 `bossCdId` | **新增**（可选） | `Record<"层:id", 剩余秒>` | 按 BOSS 记冷却；旧档无此字段时沿用整层冷却 |

（实现与规则见 §5，第 2 步补充。）

## 5. 实现规则（第 2 步）
- **onHit.stun**（`World.foeHit`）：怪普攻命中（打主角/召唤物/英雄均走同一函数）后，用 `lootRng`（不扰动主随机序列）判 `< chance`；命中则 `stunUntil = now + dur`，并 `cd = max(cd, dur)`。
  - BOSS 免疫：目标 `tier === 'boss'` 不判定。
  - 不叠加不刷新：目标眩晕中再次命中**不判定**，到期后才可再被晕（避免连锁永控）[适配]。
  - 主角眩晕中：不能移动（moveHero 跳过）、不自动普攻、`cast` 返回 `{ ok:false, reason:'眩晕中' }`（含自动施法）；吃药/回城不受限。召唤物眩晕中原地不动不攻击；英雄靠 `cd` 顺延。净化（cleanse）已有逻辑会清除友方 `stunUntil`。
  - 提示：日志「X被幽影武士击晕 2 秒」。
- **immobile**：`World.isImmobile(u) = u.immobile || id==='boss_redmoon'`（原赤月硬编码收编）。追击态不移动、不跳扑、仇恨在召唤物时也不走；仍按 `range` 打射程内目标。脱战（leash）规则不变：主角离开 `leashRange` → return → 已在原点立即 idle，idle/return 时按 `leashRegen` 回血。
- **禁地魔王**：`boss_sq_jindi.immobile = true`；重生沿用 `BOSS_RESPAWN = 600`。不在 BOSS_MECH，通用 BOSS 机制照旧。远程/AOE 补偿：**未做**，待评估（主角远程可无伤风筝它）。
- **ranged**：除常规「队首贴身」攻击外，追击态、非队首、主角在 `range` 内（`inMelee`）也能攻击，打主角。眩晕/BOSS_MECH/仇恨召唤物时不走这条。
- **magic**：普攻 `damage(..., magic)`，1 = 全额走魔御。`ranged && magic` 的攻击事件带 `skill:'thunder'`，BattleScene 播 `fx_thunder_strike`（缺图退回 Graphics 闪电）——复用雷电术，**无专属资源（缺口）**。
- **双 BOSS 冷却**：新增 `bossCdId["层:id"]`，`bossOnCd(i,id)` 判定；击杀同时写整层 `bossCdUntil`（UI/副本逻辑不变）。旧档只有整层冷却时整层跳过（兼容）。同层两只**同 id** BOSS 仍共用冷却（现无此情况）。
- **新怪定义**（只定义，不放刷怪点，主线 sim 不受影响；`boss_sq_jindi` 例外，它在禁地·魔穴）：

| id | 名 | Lv | 模板 | 字段 |
|---|---|---|---|---|
| sq_youying | 幽影武士 | 45 | sq_lizhua | onHit.stun {0.1, 2} |
| sq_lieyan_shi | 烈焰使 | 44 | sq_shanling | immobile |
| boss_sq_shandian | 闪电魔 | 34 | boss_sq_jindi | boss, ranged, magic 1, range 320, speed 90 |
| boss_sq_lizhua | 利爪魔 | 33 | boss_sq_jindi | boss, 近战 range 8, speed 100（立绘借 sq_lizhua，缺图） |
| boss_sq_jindi | 禁地魔王 | 32 | (原) | + immobile |

等级/模板/射程均 [适配]；官方仅有「麻痹」「极品不移动」「4h 刷新、爆圣战级」，技能数值**未查到**。
