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
