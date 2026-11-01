# 账号登录与数据库方案（feat/account-doc，仅方案，未改代码、未建服务）

用户原话：「开始做账号登录跟数据库」「先把数据库搞了」。本文只做方案。查证日期 2026-11-01，资料链接都打开过；查不到的写「未查到」。

## 0. 结论先行（待魔兽和用户拍板）

- **推荐 A：腾讯云开发 CloudBase**（国内节点）。负责账号、数据库和云函数，游戏前端暂时留在 GitHub Pages。理由：用户在厦门，用手机 Safari；境外 BaaS 在大陆都有阻断或干扰的实测记录（见 §1.2）。
- **备选 B：Supabase（新加坡）**，前面挂自有域名转发。功能最全，开发最快，但大陆移动网络有 SNI 阻断的实测记录，**必须挂自有域名转发**。
- **不选**：Firebase（认证端点在大陆被阻断），LeanCloud（2026-01-12 起停止新注册，2027-01-12 停服），只用 Cloudflare Workers 默认域名（workers.dev 全部被封）。
- 第一阶段只做三件事：账号（邮箱+密码，游客保留），存档上云（多槽），灵符余额（账号级，新账号 5000）。**不接入支付。**

## 1. 现状与后端选型

### 1.1 现状
- 纯前端静态页，Vite 构建，`base: '/card-legend-proto/'`，部署在 GitHub Pages（gh-pages）。
- 没有任何后端，存档全在 localStorage：
  - `fcl_save_v1`：槽 1，也是旧档和导出格式；
  - `fcl_save_v1_s<n>`：槽 2–10；
  - `fcl_slots_v1`：元数据 `{active, count, slots:{i:{name,lastAt,playMs}}}`；
  - `fcl_save_v1_backup`：首次迁移时的备份；
  - `fcl_settings_v1`：全局设置（见 src/settings.ts）。
- 存档结构是 `SaveData`（src/combat/World.ts，`v:1`），包含：
  - cls/level/exp/gold/pots/equip/bag；
  - skillTrain（技能修炼点）、learned；
  - companion（英雄）等。
  - **召唤物不存实体**。读档后重新召唤，召唤物等级由技能等级和 skillTrain 决定（summonNerfLv 等规则在战斗代码里），所以云端只需要原样存 SaveData。
- 游戏前端本身在大陆能否访问：github.io 整体是「mixed」（GreatFire 1,101 个 URL 中 161 个被封、302 个间歇）。本项目 `mbfish2026-max.github.io` 的单独结果：**未查到**。

### 1.2 对比（均为已打开的官方或实测页面）

| 方案 | 免费额度 | 部署位置 | 大陆可达性（厦门手机 Safari） | 成本 | 备注 |
|---|---|---|---|---|---|
| **CloudBase**（腾讯云开发） | 免费体验版 0 元/月，3,000 资源点/月；每账号 1 个；需手动每 6 个月续一次；不能加购或按量付费 | 国内（腾讯云） | 国内节点，预期可达。**厦门移动/电信的实测延迟：未查到**，需要第 0 阶段拨测 | 个人版 19.9 元/月（限时价），40,000 点；超出部分 1000 点≈1 元 | 文档型数据库和关系型数据库都有；内置身份认证。默认域名是否需要备案、跨域白名单细节：**未查到**，第 0 阶段核实 |
| **Supabase** | Free：500MB 数据库，5GB 出流量，5 万 MAU；**一周不活跃会暂停**；最多 2 个项目 | 境外（可选新加坡） | `*.supabase.co`：GreatFire 测了 33 个 URL，24 个间歇受干扰。另有实测：2026-09-22 起部分**移动**网络有 SNI 阻断，15 个家宽节点中固定 6 个被重置；**挂自有域名转发后只剩零星超时** | Pro $25/月；自定义域名 +$10/月（付费附加）；也可以用自建转发（需要 VPS） | Postgres + RLS + Auth，开发最快；免费档会暂停，不适合正式上线 |
| Firebase | 有免费档 | 境外 | `identitytoolkit.googleapis.com`（Auth）最近 5 次测试 100% 受干扰；实测北京匿名注册和邮箱登录都超时 | — | **排除** |
| Cloudflare Workers + D1 | D1 免费：每天读 500 万行、写 10 万行，5GB；2026-09-01 起超额直接报错 | 境外边缘节点 | `workers.dev` 测到的 209 个 URL **全部被封**；只能挂自有域名，且免费线路在大陆有拥塞记录 | Workers Paid（价格未在本文展开） | 不建议做第一选择 |
| 自建 Node + SQLite/Postgres | — | 国内 VPS 或境外 VPS | 国内 VPS 的 80/443 端口要用域名就**必须 ICP 备案**（同一篇实测文章提到）；境外 VPS 同样有线路风险 | VPS 费用（未查价） | 运维、安全、备份都要自己做，第一阶段不推荐 |
| LeanCloud | — | 国内 | — | — | 2026-01-12 起停止新注册，2027-01-12 停服。**排除** |

资料：
- CloudBase 价格：https://cloud.tencent.com/document/product/876/75213 ，https://tcb.cloud.tencent.com/pricing ，https://docs.cloudbase.net/quick-start/resource-point
- Supabase：https://supabase.com/pricing ；可达性 https://en.greatfire.org/domain/supabase.co ，实测 https://amefys.com/blog/china-reachability.html
- Firebase：https://en.greatfire.org/https/identitytoolkit.googleapis.com ，https://chinaready.co/insights/firebase-alternatives-for-china/
- D1：https://developers.cloudflare.com/d1/platform/pricing/ ；workers.dev：https://en.greatfire.org/domain/workers.dev
- github.io：https://en.greatfire.org/domain/github.io
- LeanCloud：https://docs.leancloud.cn/sdk/announcements/sunset-announcement/

**说明**：GreatFire 和上面那篇实测都是第三方测量，「机房节点能连」不代表「家宽能连」。**以用户本人在厦门的手机实测为准**（见第 0 阶段）。

## 2. 账号体系

- **登录方式**
  - 第一阶段用**邮箱+密码**。
  - **游客模式保留**：不登录也能玩，现有的本地存档行为不变。
  - **游客转正**：登录后把本地槽上传绑定到账号，见 §4。
  - 手机号短信登录需要短信服务、签名和模板审核，也有费用，放到第二阶段以后。微信登录需要公众号或开放平台资质，暂不做。
- **会话**
  - 用服务商 SDK 的访问令牌和刷新令牌，存在 localStorage，与存档键分开，键名如 `fcl_auth_v1`。
  - 令牌过期后自动刷新，刷新失败就回到游客态，**不清本地存档**。
- **找回密码**
  - 邮件链接重置，用服务商内置功能。
  - 如果要自定义发件，需要 SMTP（待决）。
- **安全**
  - 密码只由服务商哈希存储（Supabase 用 bcrypt，CloudBase 的实现细节**未查到**，由服务商负责）。前端和仓库里不保存任何密码。
  - 全程 HTTPS。
  - 限流：登录、注册、重置都用服务商自带限流。自写的云函数（灵符扣减、存档上传）按账号和 IP 限频，例如每分钟 30 次存档写入、每分钟 10 次扣费。
  - 数据库权限：只能读写自己的行（Supabase 用 RLS；CloudBase 用安全规则加云函数）。
  - **灵符余额前端不能直接改，只能由服务端函数改。**

## 3. 数据库表设计（以关系型写，文档库同构）

```text
accounts        id(uuid, =auth uid) | email | created_at | lingfu_granted(bool) | banned(bool)
save_slots      account_id | slot(1..10) | name | data(jsonb = SaveData 原样) | save_v(int, SaveData.v) |
                rev(int, 每次写+1) | updated_at(服务端时间) | client_at(客户端 lastAt) | play_ms | cls | level  -- cls/level 冗余便于列表
                PK(account_id, slot)
slot_meta       account_id | active | count(5..10)          -- 对应 fcl_slots_v1
lingfu_wallet   account_id PK | balance(int ≥0) | rev
lingfu_ledger   id | account_id | delta(+/-) | reason('signup_grant'|'shop'|'admin'|'refund') | ref(order_id) | balance_after | created_at
shop_orders     id | account_id | sku | qty | price_lingfu | status('done'|'failed') | slot | created_at | idem_key(唯一)
```

- **召唤物和等级**：放在 `data` 里，即 SaveData 的 skillTrain、learned、level、companion。召唤物本身不落库（与现有本地存档一致）。
- **灵符**按账号存，与 docs/lingfu-shop.md 对齐：
  - 新账号由服务端在注册时**一次性**写入 5000，同时写一条流水 `signup_grant`。用 `lingfu_granted` 防止重复发放。
  - 删槽、新建槽、导入存档都**不会**再发灵符，因为余额不在 SaveData 里。
- **扣费和发货**在一个服务端事务里完成：
  1. 校验余额；
  2. 扣减；
  3. 写流水；
  4. 写订单；
  5. 把物品写进指定槽的 `data.bag`；
  6. 返回新的存档 rev。
  - 用 `idem_key` 防止重复提交。
- 敏感字段只有 email，由服务商管理。不存手机号和真实姓名。

## 4. 存档云同步

- **离线可玩**：本地 localStorage 仍是运行时的主存档。云端是同步副本，断网时照常玩，联网后再同步。
- **首次登录迁移**：
  1. 列出本地的 1..count 槽和云端的槽；
  2. 只有一边有的直接上传或下载；
  3. 两边都有就进入冲突处理；
  4. 迁移前先把整个本地导出成备份键 `fcl_cloud_backup_<时间>`。
- **冲突解决**：
  - 每个槽带 `rev` 和 `updated_at`。上传时提交 `base_rev`，如果云端 rev ≠ base_rev 就判为冲突。
  - 冲突时**不自动覆盖**，弹窗并排显示两边的「职业/等级/层/最后游玩时间」，由玩家选保留哪一份。另一份存成备份槽或备份键。
  - 自动同步时机：进入城镇、存档写入后节流 30 秒、页面隐藏时（visibilitychange）。
- **多设备**：靠 rev 乐观锁。同一账号两台设备同时玩同一槽，后上传的一方会进入冲突处理。
- **旧档兼容**：上云时不改 SaveData 格式（`v:1`），老档原样上传，读档迁移仍走现有逻辑。

## 5. 防作弊底线（单机游戏，诚实说明）

**防得住：**
- 灵符余额和流水只能由服务端改，前端改 localStorage 无法增加灵符。
- 重复发放新号 5000（账号级标记）。
- 重复提交订单（idem_key）。
- 删槽、导入都刷不出灵符。

**防不住：**
- 存档内容本身：金币、装备、等级都在客户端计算，玩家可以改本地存档再上传。第一阶段只做基本校验（字段类型、等级 ≤ 上限、每件物品 id 存在），不做服务端战斗复算。
- 多开账号薅新号 5000。可以用邮箱验证、设备和 IP 限频来缓解，但做不到杜绝。
- 本地回滚：玩家可以回滚存档，比如在商城购买前后来回回档。服务端余额是权威数据，但已经发到槽里的物品可以随存档被复制。缓解办法是订单流水对账，并在服务端记录每槽最大 rev 作为参考。
- 结论：**防线是灵符，不是存档。** 在没有排行榜、交易和真钱支付之前，这个程度够用。等接入真钱支付时，必须把购买物品的发放改成服务端权威。

## 6. 分阶段实施与验收

| 阶段 | 内容 | 验收 | 估时 |
|---|---|---|---|
| 0 拨测 | 在选定服务商上建一个空项目和健康检查页，用户在厦门手机（移动、电信或 Wi-Fi 各一次）打开；同时用 Globalping 家宽节点拨测 | 用户手机能通，记录延迟；不通就换方案 | 0.5 天（需要用户先开通账号） |
| 1 账号 + 存档上云 | 邮箱注册、登录、找回密码；游客保留；槽同步（rev 冲突处理）；标题页加「登录/账号」入口，在 844×390 和 1280×720 下不遮挡 | 新设备登录后看到原有存档；断网可玩，恢复联网后同步；冲突弹窗；老档无损；tsc、npm test、build 通过；e2e 用 mock 后端 | 3–4 天 |
| 2 灵符钱包 | 注册赠 5000、余额显示、流水；服务端扣费函数（先不上架商品） | 余额只能由服务端改；重复注册、删槽、导入都不会多发；事务失败时不扣费 | 1.5 天 |
| 3 灵符商城接后端 | 按 docs/lingfu-shop.md 上架商品；订单幂等 | 购买后物品进入对应槽；断网时禁止购买 | 2 天 |
| 4 （另议）支付 | 需要商户资质，未接入 | — | — |

**测试隔离**：后端封装为 `CloudApi` 接口，测试和 9 seed 回归不接后端（默认游客态），不影响难度回归。

## 7. 需要用户提供或决定的事项（任何密钥都不进仓库）

| # | 事项 | 用途 | 获取方式 | 放在哪里 |
|---|---|---|---|---|
| 1 | 选定服务商（CloudBase 或 Supabase） | 决定整体实现 | 用户拍板 | — |
| 2 | 服务商账号（腾讯云实名，或 Supabase 账号） | 创建项目和环境 | 用户本人注册。腾讯云需要实名认证 | 用户自己保管，不交给仓库 |
| 3 | 环境 ID 或项目 URL | 前端连接后端 | 在控制台创建环境或项目后查看 | 构建时的环境变量 `VITE_CLOUD_ENV` / `VITE_SUPABASE_URL`，由 GitHub Actions secret 注入，不写进源码 |
| 4 | 前端公开 key（Supabase anon key；CloudBase 前端通常只需环境 ID） | 前端 SDK 初始化。公开 key 依靠 RLS 或安全规则保护 | 控制台 API 设置页 | CI secret `VITE_SUPABASE_ANON_KEY`。本地用 `.env.local`（已在 .gitignore 中，第一阶段需确认） |
| 5 | 服务端密钥（Supabase service_role / 腾讯云 SecretId 和 SecretKey） | 只在云函数或部署时使用，**绝不进前端包** | 控制台 | 只放在服务商的函数环境变量或 CI secret（部署云函数时用），不写进仓库和前端 |
| 6 | 域名（可选，Supabase 方案必需） | 转发入口，绕过 `*.supabase.co` 阻断 | 用户购买。如果用国内服务器做 80/443 转发，需要 ICP 备案 | DNS 在用户自己的注册商控制台管理 |
| 7 | 发件邮箱或 SMTP（可选） | 找回密码、验证邮件用自定义发件人 | 用户提供，例如企业邮箱 SMTP 授权码 | 服务商控制台中填写，不进仓库 |
| 8 | 付费档决定 | CloudBase 免费版需要每 6 个月手动续；Supabase 免费档一周不活跃就暂停 | 用户决定是否付费（19.9 元/月或 $25/月） | — |
| 9 | 隐私政策和用户协议文本 | 收集邮箱时需要 | 用户确认 | 仓库 docs（不含密钥） |

仓库侧要做的：
- `.env*` 加入 .gitignore；
- CI 加 secret 扫描（例如 gitleaks），PR 前检查；
- 文档只写变量名，不写值。

## 8. 待决项
1. 服务商选 A（CloudBase）还是 B（Supabase + 自有域名）。第 0 阶段拨测后定。
2. 是否需要邮箱验证才能领取 5000 灵符（防止多开薅号）。
3. 游客存档登录后是全部上云，还是逐槽选择。
4. 冲突时默认推荐「最近游玩」还是「等级更高」的一份。
5. 游戏前端是否迁到国内托管（需要备案），还是继续用 GitHub Pages。
6. 是否付费（免费档有暂停或续期限制）。
