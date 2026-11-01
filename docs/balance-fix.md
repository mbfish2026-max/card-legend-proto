# feat/balance-fix：main 平衡回归定位

结果文件：/workspace/cl-balance-sim/fix/（各合并点用 git archive 导出到 fix/src-<sha>，不加 worktree）。

## 1. 口径核对（balance-4050 合并 93b9417 之后的 main 合并）

| 合并 | 对战士 sim 的影响（读 diff） |
|---|---|
| 93b9417 Merge feat/balance-4050 | 与 c30ede0 相比只有 UI/groundAura 文件差异，sim 逻辑一致 |
| 3d5976e Merge feat/eg-dungeon (P3) | sim-lib 显式 `dungeons:false`；掉落过滤/BOSS 冷却在 dg=null 时等价；drop-plan 只改注释 → 预期 sim 不变 |
| 764189c Merge feat/no-death-drop | **respawn 不再扣 10% 金币**（删除 WORLD.deathGoldLoss）。sim 死亡计数口径不变（仍 w.deaths++），但金币多→买药/书时间点变→全程轨迹变 |
| 5d5ed0b Merge ground-aura-ally | 道士幽灵盾/神圣战甲术作用于召唤物/英雄；战士/法师无影响 |
| 85434e0 Merge feat/summon-regen | 召唤物回血+继承属性、宠物不叛变、雷电术 CD 2.5→1.5；战士无影响 |

- sim-bands 参数：9 种子（3/7/11/19/23/42/57/88/101），SIM_REPLAYS=2，未变；PASS_MAX_DEATHS=14（battle.test）未变。
- eg-sets：sim 只把掉落装备穿空槽，不强制穿套；SIM_SET4 只存在于 feat/set-fx（未合 main）。
- 注意：「main 基线 战士 20/29」出自 feat/set-fx docs/set-fx.md，该分支基于 summon-regen 合并前的 main。
