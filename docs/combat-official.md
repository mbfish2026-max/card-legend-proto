# R13 战斗机制官方对照

原则：按官方/权威资料实现，每条附来源；查不到的标「未查到」，不编造；为卡牌横版战斗所做改动标 **[适配]**。
逻辑参数集中在 `src/combat/World.ts` 的 `OFFICIAL` 常量与 `bossStep()`；表现在 `src/scenes/BattleScene.ts` 的 `bossFx()`。**未改动 src/data。**

## 一、现有 BOSS / 怪物 / 状态清单与差异（实现前）

| 对象 | 游戏现状（R12） | 官方 | 差异 |
|---|---|---|---|
| 沃玛教主 boss_woma | 普通近战 | 电火花攻击；7 分血阶段发呆+狂暴；30 秒围攻瞬移 | 缺阶段与瞬移 |
| 祖玛教主 boss_zuma | 普通近战 | 丢火球；边攻击边召唤祖玛怪 | 缺远程、召唤 |
| 赤月恶魔 boss_redmoon | 普通近战，会移动 | 速度 0 不移动；全屏地刺落在目标所在格，可走位躲 | 全部不同 |
| 尸王 boss_lich | 近战 | 近身物理攻击 | 一致 |
| 狼王/蜘蛛女王/骷髅精灵/兽人酋长 | 近战首领 | 未查到（非 1.76 原版官方 BOSS 名） | — |
| 施毒术 | 每秒跳伤、扣防御、持续 8+2×级 | 绿毒 2.5 秒一跳、无视防御；红毒受伤 +20% | 不一致 |
| 魔法盾 | 固定减伤 40%，可刷新 | 分级减伤；持续中重开无效 | 不一致 |
| 麻痹 | 无 | 麻痹戒指 / race 90,105,106 怪 | 游戏中无来源 |
| 骷髅/神兽 | 跟随主角、攻击交战敌人、互斥 | race 100 / 113,114 | 基本一致 |
| 非命中特效 | 1.2–1.3× 放大 | — | F3 统一 1× |

## 二、对照表

| 机制 | 官方说法 | 来源 | 实现位置 | [适配] |
|---|---|---|---|---|
| 沃玛教主·攻击 | 电火花攻击，50% 物理 + 50% 魔法混合伤害 | https://www.21cq.com/chuanqi/839.html ；https://www.tayewan.com/thread-17128-1-1.html | bossStep 沃玛分支；bossFx 'spark'（闪电） | [适配] 本作无魔防属性，两半均按防御计算，数值不变 |
| 沃玛教主·发呆/狂暴 | 血量跌到 5/7、4/7、3/7、2/7、1/7 时先发呆 8 秒（不攻击），再狂暴 8 秒（每秒攻击 2 次、移动 2.5 次） | 同上 | OFFICIAL.womaStages/womaDaze/womaCrazy/womaCrazyInterval | 移速 2.5 次/秒未实现 [适配]（横版追击统一速度） |
| 沃玛教主·瞬移 | 有仇恨 + 围攻（周围 8 格≥5 格被占）+ 计时 30 秒 → 飞到目标背后 | 同上 | OFFICIAL.womaFlySec，bossStep | [适配] 横版无 8 格，「围攻」改为「主角贴身」；背后=主角另一侧 |
| 沃玛教主·不召唤 | 不召唤仆人；能看见隐身、有卫士相伴 | 同上；http://mir.17173.com/content/2001-12-26/n555_471855.html | 无召唤 | 隐身本作没有 |
| 祖玛教主·火球 | 丢火球攻击（racelmg 49） | https://www.444.mba/post/671.html ；https://cywlsoft.com/thread-4-1-1.html | bossStep 祖玛分支，OFFICIAL.zumaRange=420 | [适配] 射程 420px（约 3 张卡） |
| 祖玛教主·召唤 | race 102：边攻击边召唤 ZUMA1~4 | 同上；tayewan 17128；21cq 839 | 唤醒 zuma_statue / zuma_guard | [适配] 频率/上限未查到：12 秒 1 只、同时 ≤2（F4 平衡取值）；召唤物 0 经验 0 掉落防刷 |
| 祖玛教主·移速 | 每秒 3.33 次 | 444.mba/post/671 | 未实现 | [适配] 统一追击速度 |
| 赤月恶魔·不移动 | 速度 0 | https://www.thelegendofmir2.com/monster/394e0e167c91b39fba1f44e6c750e8bd.html | 队列移动中跳过 boss_redmoon | — |
| 赤月恶魔·地刺 | 全屏地刺（race 115），不锁定目标，在目标当时所在格冒刺，每 2~3 秒一次，可走位躲开 | https://www.21cq.com/chuanqi/639.html ；thelegendofmir2 同上 | OFFICIAL.spikeEvery=2.5；bossFx 'spike_warn'/'spike' | [适配] 预警 0.8 秒（红圈），判定半径 60px；只用地刺攻击，不再近战 |
| 赤月恶魔·召唤 | 有资料称会召月魔/黑锷/天狼蜘蛛 | http://chuanqi.wuduy.com/html/jishuwenzhang/chuanqi/247983.html（可信度低，与 race 115 资料矛盾） | 未实现 | 记为存疑 |
| 尸王 | 近身物理攻击，不死系 | https://www.thelegendofmir2.com/monster/b318ec2518b87a86ae8fb9d5c7cc4b56.html | 沿用通用近战 | 无需改动 |
| 施毒·绿毒 | 每 2.5 秒掉血，不受防御影响；持续 道术×2 + 20/27/33/40 秒 | http://mir.17173.com/content/2025-07-03/20250703074702052.shtml ；https://www.21cq.com/chuanqi/827.html | OFFICIAL.poisonTick/greenDur；damage(ignoreDef) | [适配] 每跳伤害沿用本作 道术×0.6×2.5（官方 (道术×k+b)/10 适用 1.76 数值体系）；施毒无直接伤害（官方） |
| 施毒·红毒 | 受到伤害 +20%；持续 道术×2 + 15/20/25/30 秒 | 同上 | OFFICIAL.redAmp/redDur；Unit.redUntil | [适配] 本作不区分黄/绿毒粉，一次施放同时上红绿毒 |
| 魔法盾·减伤 | 0~3 级减伤 15%/30%/45%/60%；盛大新百区实测 3 级 60% | https://www.bigknow.cc/a/2507/1290802.html ；https://www.rxcqbbk.com/jy/1019643.html | OFFICIAL.shieldReduce | 0–2 级来自问答站，可信度一般；私服引擎公式 伤害×8/((4+X/100)×(级+2)) 仅参考 https://www.5xi.net/421.html |
| 魔法盾·重开 | 持续期间再次开启不刷新，盾破后才可重开 | https://www.rxcqbbk.com/jy/1019643.html | cast() 返回「魔法盾持续中」 | — |
| 魔法盾·持续 | 3 级基础 16 秒 + 每点魔法 1 秒；受击频率越高掉得越快 | 同上 | 未改 | [适配] 沿用 12+4/级（本作魔法数值量级不同；受击缩短未实现） |
| 麻痹 | 麻痹戒指 1/15 概率使对手 5 秒瘫痪；怪物 race 90/105/106 为麻痹石化攻击 | https://games.sina.com.cn/o/z/cq/2013-10-31/1921506473.shtml ；444.mba/post/671 | 未实现 | 本作无麻痹戒指、无对应怪物 |
| 召唤骷髅 | race 100 | 444.mba/post/671 | 既有逻辑 | 跟随/攻击方式未查到细则 |
| 神兽 | race 113 小 / 114 大，大神兽喷火（racelmg 55） | 444.mba/post/671 | 既有逻辑（近战） | 变大条件未查到，未实现喷火 |
| 怪物选目标 | — | 未查到 | 近战对召唤物/主角各 50% | 沿用 |
| 非命中特效尺寸 | — | — | FxPlayer FX_DEFS 去掉 scale；魔法盾 sc=1 | F3 |

## 三、未查到

- 狼王、蜘蛛女王、骷髅精灵、兽人酋长：未查到官方机制（非 1.76 原版 BOSS 名），保持通用近战。
- 祖玛教主召唤频率与数量上限。
- 赤月恶魔是否召唤（仅低可信度资料）。
- 神兽小→大变身条件；骷髅/神兽索敌细则；怪物在召唤物与玩家间的选目标规则。
- 魔法盾 0–2 级精确值（官方原文未查到，取问答站表）。

## 四、F4 平衡

模拟（tests/battle.test.ts，seed 11）：战士 4、法师 1、道士 2 次死亡，均通关。仅调 World 内 `OFFICIAL.zumaCallSec/zumaCallMax`。
