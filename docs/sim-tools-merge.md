# sim 工具合并审计（feat/sim-tools-merge，基于 origin/main 665b01d，未合 main）

目的：把 feat/sim-gear-swap（214d73d）里 main 没有的东西（SIM_DROP_LOG、SIM_TUNE、gear40 文档、simgear v3 评估）合进来，只限 tests/ scripts/ docs/，冲突按 main 为准。

## 结论
214d73d 不是 origin/main 的祖先（`git merge-base --is-ancestor` = false），但它的 11 个提交涉及的 10 个文件在 main 上全都有：
- 内容一致：docs/gear40-eval.md、docs/simgear-eval.md、scripts/apply-sim-droplog.py、scripts/apply-sim-gear.py、scripts/apply-sim-tune.py、scripts/gear40-sources.ts
- 有差异，但差异都是 main 更新（main 多了 SIM_B4050、换装默认开、复活回城等）：tests/sim-droplog.ts（numstat 1/2）、tests/sim-gear.ts（2/2）、tests/sim-lib.ts（3/11）、tests/sim-tune.ts（0/6）
- `git diff --name-status origin/main 214d73d` 里没有新增（A）文件，只有 M/D。

处理方式：`git merge -X ours 214d73d` 只记录祖先关系，合并后的树和 origin/main 逐字节相同（`git diff --stat origin/main` 为空），src/data 没动。

## R78 ① 合并后难度对照（origin/main 665b01d，默认换装 sim，9 种子 3/7/11/19/23/42/57/88/101）
cmp 口径（死亡 = 9 种子合计，h = 中位数，通关 = Lv≥50 且单种子死亡 ≤14）：

| 组 | 职业 | 死1–39 | h1–39 | 死41–50 | h41–50 | 通关 |
|---|---|---|---|---|---|---|
| base 7817cd1 | 战/法/道 | 68/24/51 | 18.69/12.30/19.26 | 15/7/13 | 9.71/8.23/11.80 | 9/9/8 |
| 94f4a01 | 战/法/道 | 57/30/7 | 18.27/11.50/18.09 | 5/2/6 | 9.42/7.95/10.82 | 9/9/9 |
| r3 单独 | 战/法/道 | 57/30/7 | 18.27/11.50/18.09 | 24/18/29 | 11.52/9.96/13.93 | 8/9/9 |
| **main** | 战/法/道 | 57/30/7 | 18.27/11.50/18.09 | 24/18/29 | 11.52/9.96/13.93 | 8/9/9 |

- main 与 r3 单独版的 sim-bands JSON 共有字段逐项相同；main 只多了 potGold/goldAt40/learn/gearAt 等字段。没有漂移，40–50 仍达标（死亡 >15/7/13，h ≥10.68/9.05/12.98）。
- 为什么没差异：默认 sim 下血石 SIM_STONE、新用药 SIM_POT 都是关的（tests/sim-lib.ts:19、:95），灵符商城也不进 sim 路径。所以合进来的灵符/血石/药水扩充对默认 sim 结果的影响是 0。打开这两个开关后的数值本轮没跑（未查到）。
- battle.test 口径（cl-r78，EXIT=0，硬门全过）：战 死亡 10/10/3/6/16/9/6/14/8（中位 9），法 3/3/6/9/8/5/1/7/6（中位 6），道 9/6/1/10/4/0/0/2/4（中位 4），全部 Lv50，有损失死亡 0。GAP：战 单层最多 6（>5）；道 死亡中位 4（<6）；法/战用时比 0.50（<0.7）。
