# sim 工具合并审计（feat/sim-tools-merge，基于 origin/main 665b01d，未合 main）

目的：把 feat/sim-gear-swap（214d73d）里 main 没有的东西（SIM_DROP_LOG、SIM_TUNE、gear40 文档、simgear v3 评估）合进来，只限 tests/ scripts/ docs/，冲突按 main 为准。

## 结论
214d73d 不是 origin/main 的祖先（`git merge-base --is-ancestor` = false），但它的 11 个提交涉及的 10 个文件在 main 上全都有：
- 内容一致：docs/gear40-eval.md、docs/simgear-eval.md、scripts/apply-sim-droplog.py、scripts/apply-sim-gear.py、scripts/apply-sim-tune.py、scripts/gear40-sources.ts
- 有差异，但差异都是 main 更新（main 多了 SIM_B4050、换装默认开、复活回城等）：tests/sim-droplog.ts（numstat 1/2）、tests/sim-gear.ts（2/2）、tests/sim-lib.ts（3/11）、tests/sim-tune.ts（0/6）
- `git diff --name-status origin/main 214d73d` 里没有新增（A）文件，只有 M/D。

处理方式：`git merge -X ours 214d73d` 只记录祖先关系，合并后的树和 origin/main 逐字节相同（`git diff --stat origin/main` 为空），src/data 没动。
