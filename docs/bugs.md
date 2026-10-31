# 测试发现的 Bug（test/h-round1，基于 main be5718a）

> 只记录不修。复现脚本：`npm run build && node tests/e2e/h-verify.mjs [a|b|c]`（本地 dist，无头 Chromium/SwiftShader）。

## BUG-001 特效图集加载失败后无限重试（中）
- 位置：`src/loader.ts` `PreloadScene.pump()`（fx 分支：`fxLoadOrder(...).filter(k => !this.textures.exists(k))`）
- 复现：让 `assets/fx/*` 返回 404（`h-verify.mjs b`），进入战斗 ~9 秒。
- 实际：失败的图集 texture 不存在 → `complete` 后再次 pump → 同一批重新请求，循环不止；9 秒内 fx 相关 404 请求 312 次（全部 404）、116 次（仅 .json 404），持续占带宽/耗电，且后面的音乐永远排不到加载（音乐在 fx 之后）。
- 预期：失败的 key 记入失败集合，不再重试（或有限次退避），继续加载音乐。
- 游戏本身不崩溃，技能走 Graphics 兜底（见验证 b）。

## BUG-002 低特效下超上限的特效改走 Graphics 兜底，总特效量并未减少（低）
- 位置：`src/ui/FxPlayer.ts` `playFx()`（`if (live >= cap()) return null;`）+ `src/scenes/BattleScene.ts` 各技能 `if (!playFx(...)) fx.xxx(...)` 调用处
- 复现：`h-verify.mjs a`，法师学全技能连放 8 秒。
- 实际：精灵上限生效（低特效 10 / 普通 28），但返回 null 后调用方画 Graphics 兜底；低特效时同屏 Graphics 峰值 36 反而高于普通模式 31（基线 3）。
- 预期：超上限应直接丢弃（或区分「素材缺失」与「超上限」两种 null），低特效总绘制量应更低。

## BUG-003 重复加载同一贴图：控制台报 "Texture key already in use"（低）
- 位置：`src/loader.ts` `queueImages()` 只检查 `tex.exists(k)`，不检查加载器队列/正在加载；Title `startBattle` 与 `PreloadScene.pump` 同时把 `orc`/`bg_floor4`/`darkmage`/`boss_orc_chief` 入队。
- 复现：桌面 `?class=mage&lv=40` 进入战斗，每次 2–4 条 console.error。
- 预期：已在队列中的 key 不再入队（可用 `load.keyExists` / 记录 pending 集合），无报错、无重复下载。
