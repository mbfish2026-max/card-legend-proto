# 手机横屏技能页文字发虚

基线：`main` `4db831d6da0c173b7e2fb0802766726a2eed0e13`（R86，已与 `origin/main` 对齐）。只改文字栅格化。战斗技能数值、装备掉落、存档格式、画布档位（手机自动仍最高 k=1.5）都没动。

## 根因（测量，不是猜测）

逻辑坐标仍是 1280×720（手机按宽高比加宽）。画布像素 = 逻辑尺寸 × k，相机 zoom = k。手机自动档 `resolveResK` 把 k 封在 1.5。技能页在手机上再 `setScale(1.28)`（`min(1280/1000, 700/500)`）。

Phaser 文字的 `resolution` 原先在 `main.ts` 里写成 k。WebGL 用 `style.resolution` 决定显示尺寸（`TextWebGLRenderer`：纹理宽 / resolution）。父容器再放大时，纹理像素盖不满它在画布上占的像素，线性过滤把字形拉虚。画布本身又短于设备像素，浏览器把整张画布再放大一次。

Chromium 无头，`deviceScaleFactor=3`，打开 `?mobile=1&class=mage&floor=1&lv=15&panel=skills`，法师 15 级，已学火球术（修炼 3000）和诱惑之光（修炼 4000）。渲染器是 WebGL（`renderer.type=2`）。

932×430 CSS，DPR 3（截图像素 2796×1290）：

| 项 | 修改前 |
|---|---|
| `Render.k` / 相机 zoom | 1.5 |
| 逻辑宽 `lw` | 1561 |
| canvas backing | 2341×1080 |
| canvas CSS | 932×429.88，transform 空 |
| 设备像素 / 画布像素 | 1.194 |
| 面板 `mscale` | 1.28 |
| 说明字号 | 18px（手机下限），描边 2 |
| `style.resolution` | 1.5 |
| `frame.source.resolution` | 1（构造时写入，`setResolution` 没有改它；WebGL 不读它，显示尺寸仍按 style） |
| 该行纹理 | 544×33 |
| 该行在画布上的尺寸 | 696.96×42.24 |
| 纹理像素 / 画布像素 | 0.781（= 1/1.28） |
| 纹理像素 / 设备像素 | **0.654** |

同一行在 844×390、DPR 3：画布 2337×1080，设备/画布 = 1.083，纹理/设备 = **0.721**。

桌面 1280×720、DPR 1：k=1，mscale=1，画布 1280×720，resolution=1，纹理/设备 = **1**。这条路径本来就是齐的。

字体：页面字体栈是 `"PingFang SC","Microsoft YaHei",sans-serif`。本机 `fc-list` 没有这两款，只有文泉驿微米黑和 Droid Sans Fallback。`measureText('火球术修炼')` 对 PingFang、雅黑、文泉驿、Droid、sans-serif 宽度都是 80，实际落到同一套回退字。发虚的比例和字体族无关，真机 PingFang 的笔画观感没有在这里验证。

## 修复

`textResolution(parentScale)`（`src/render.ts`）：

`resolution = parentScale × k × max(画布 CSS×DPR / 画布像素, 1)`，夹到 `[1, 3]`。

- 面板构建期间 `setUiTextScale(fitK)`，文字工厂按这个父缩放栅格化，结束改回 1。地图面板不放大，fitK=1。
- 画布已经比屏幕更细（boost<1，例如手动 2K）时不再加码。
- `frame.source.resolution` 改成和 `style.resolution` 一致。Canvas 渲染器按 source.resolution 缩放；不改的话，回退到 Canvas 时字形会按分辨率被画大。WebGL 测量里显示尺寸不变（仍是 696.96×42.24）。

不提高 k，不改 `Scale.FIT`，不改点击区算法。

修改后，同一视口、同一技能：

| 视口 | resolution | 纹理 | 画布上的尺寸 | 纹理/设备像素 | 画布 backing |
|---|---|---|---|---|---|
| 932×430 DPR3 | 2.29 | 831×50 | 696.96×42.24（与前相同） | 0.998 | 2341×1080（未变） |
| 844×390 DPR3 | 2.08 | 755×45 | 696.96×42.24 | 1.000 | 2337×1080（未变） |
| 1280×720 DPR1 | 1 | 348×16 | 348×16 | 1 | 1280×720（未变） |

桌面技能区裁剪 780×160 与修改前逐像素相同（变化像素 0）。

同一裁剪里，修炼行水平边缘宽度（亮度从 >30 升到 <180 的像素数，丢掉 >12px 的字间距）：932×430 从 4.44 降到 3.42；844×390 从 4.00 降到 3.40；1280×720 两边都是 4.58。剩下的过渡是 18px 字加 2px 描边的抗锯齿，不再是把 0.65 倍纹理拉到整像素。

点击区高度：932 与 844 的技能行按钮都是 44 CSS px，和修改前相同。844 上 ▲/↓ 的宽度仍是 41.6 CSS px（逻辑宽 60 × 视口缩放），修改前就是这个数，这次没有改按钮尺寸。

## 性能和显存

画布帧缓冲没变。932×430：2341×1080×4 ≈ **10.1 MB**。若把 k 从 1.5 抬到贴齐设备像素（×1.194），帧缓冲约 ×1.43，大约 **+4.3 MB**，填充率同样约 +43%。没有这么做。

技能页打开时，场景里全部 Phaser 文字纹理（UI + 战斗，RGBA）：

| 视口 | 修改前 | 修改后 | 差 |
|---|---|---|---|
| 932×430 DPR3 | 130 张，1.60 MB | 129 张，3.12 MB | **+1.52 MB** |
| 844×390 DPR3 | 128 张，1.59 MB | 129 张，2.56 MB | **+0.97 MB** |
| 1280×720 DPR1 | 160 张，0.82 MB | 160 张，0.82 MB | **0** |

火球术说明那一张：544×33（72 KB）→ 831×50（166 KB）。张数差 1 是当场飘字/日志，不是漏画。上限 `TEXT_RES_MAX=3`：再高面积按平方涨，2–3x 屏上这档已经贴到约 1 设备像素。

## 未验证

- 没有真机。没有 iOS Safari / Android Chrome，没有刘海、地址栏动画、独立模式（PWA）。
- 截图字体不是苹方 / 雅黑，是 Linux 上的回退中文黑。分辨率比例在真机上同样成立，笔画粗细观感未在真机确认。
- 未跑 npm test、sim、e2e。只跑了 `tsc --noEmit` 和 `npm run build`（通过）。

## 截图方法

独立脚本 `scripts/shot-skill-text.mjs`（只开页面、读数、存 PNG，没有断言）。不要用 `tests/e2e` 里的脚本。

1. `npm run dev -- --host 127.0.0.1 --port 5180`
2. `node scripts/shot-skill-text.mjs <目录> <before|after>`
3. 三个视口，前后用同一套 CSS 尺寸和 DPR，不要把不同缩放的图放在一起比：
   - 932×430，DPR 3，`?mobile=1&class=mage&floor=1&lv=15&panel=skills`
   - 844×390，DPR 3，同一查询
   - 1280×720，DPR 1，`?mobile=0` 其余相同
4. 进页后把火球术修炼写成 3000、诱惑之光写成 4000，学会这两项，再 `panel.render()`。
5. 记录：`devicePixelRatio`、`innerWidth/innerHeight`、canvas `width/height` 与 `getBoundingClientRect`、`Render.k/lw`、相机 zoom、`style.resolution`、文字 canvas 宽高、父容器缩放。
6. 整屏是视口×DPR。局部裁剪用设备像素里的固定矩形（布局没变，所以前后是同一块）：
   - 932：技能行 `(280,248,1000×110)`，修炼行 `(410,298,860×48)`
   - 844：`(240,210,980×110)`，`(360,268,820×46)`
   - 1280：`(120,110,780×160)`，`(200,182,560×24)`

产物在 `/opt/cursor/artifacts/text-blur/before` 与 `after`，按 `m932` / `m844` / `d1280` 分目录。
