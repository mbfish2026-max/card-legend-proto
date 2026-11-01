# 账号登录与数据库方案（Supabase 路线，feat/account-doc）

> 2026-11-01 改版：用户已拍板「Supabase 就用这个」。本文只写方案与用户操作步骤；代码在 feat/account-p1 实现。
> 规则：前端与仓库**只允许出现 publishable（公开）key**；`service_role` / `secret` key **永远不进仓库、不进前端**。

## 0. 结论

| 项 | 决定 |
|---|---|
| 后端 | Supabase，**复用现有项目 `yzhjhyroekrcdqqjrlgm`**（idle-arpg 的 cloud.js 正在用），用**独立 schema `fcl`** 隔离，见 §2 |
| 登录 | **用户名 + 密码**（内部转假邮箱），关闭邮件确认，见 §3 |
| 存档 | 本地仍是主存档、可离线；云端是多槽副本；`updated_at` 乐观锁，冲突让玩家选，不自动覆盖 |
| 灵符 | 余额与流水只在服务端；客户端只读；扣费走 Edge Function `wallet` |
| supabase-js | **自托管**（打包进 bundle 或放 `public/vendor/`），不从 jsdelivr 加载 |
| 第 0 步 | 先用 `net-test.html` 在真实手机 / 大陆网络测一次可达性，见 §8 |

## 1. 从 cloud.js（idle-arpg）学到的 8 条，逐条核对结果

核对对象：idle-arpg 仓库的 `cloud.js` 与 `sw.js`（本盒实读）。

| # | 经验 | cloud.js 实际 | 本游戏做法 |
|---|---|---|---|
| 1 | 会话在 IndexedDB 再镜像一份，防 localStorage 被清 | **已实现**：`CL_IDB='anye_auth'`，并调 `navigator.storage.persist()` | 照做（自定义 storage adapter：localStorage + IDB 双写） |
| 2 | 先显示「正在恢复登录」，再决定是否弹登录框 | **已实现**：`restoringUI` | 照做，避免闪登录框 |
| 3 | 刷新令牌自动续期 | **已实现**：`createClient(..., {auth:{autoRefreshToken:true}})` | 照做；刷新失败回游客态，**不清本地存档** |
| 4 | 关页时 keepalive 上传 | **已实现**：`clBeacon`，body <60KB 时 `fetch(PATCH, keepalive)`，挂在 pagehide/beforeunload；`visibilitychange` 隐藏时 `flushNow` | 照做（keepalive 上限约 64KB，超出只在 hidden 时普通上传） |
| 5 | sw.js 不缓存认证请求 | **已实现**：idle-arpg sw.js 跳过 supabase 与跨域 | 本游戏 `public/sw.js` 本来只处理同源 GET，Supabase 是跨域，**天然不被拦截**（已读代码确认） |
| 6 | `updated_at` 乐观锁 | **已实现**：`.eq('updated_at', CLOUD.remoteAt)`，不匹配就 `clKick`，从不覆盖云端 | 照做，冲突进入玩家选择界面 |
| 7 | 不从 jsdelivr 加载 supabase-js | **未实现**：cloud.js 实际用 `SB_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'` | 本游戏改为自托管（这是对 cloud.js 的改进，不是照抄） |
| 8 | 灵符账本放服务端 | cloud.js **没有灵符**，未查到相关代码 | 本游戏新做：§5 的表 + Edge Function |

cloud.js 的假邮箱规则：`'u' + hex(utf8(用户名)) + '@anye-game.local'`。本游戏用**不同域名** `@fcl.local`（见 §3），同一个用户名在两款游戏里是两个账号，互不影响。

## 2. 复用现有项目 vs 新建隔离项目

**建议：复用 `yzhjhyroekrcdqqjrlgm`，所有表放独立 schema `fcl`。** 理由：免费层每个账号最多 2 个活跃项目（官方定价页 supabase.com/pricing；具体额度以控制台为准），且免费项目 1 周无活动会暂停，两款游戏共用一个项目反而更不容易被暂停；cloud.js 已经验证这个项目在用户网络下可用。

| 隔离手段 | 做法 |
|---|---|
| schema | 新建 `fcl` schema，不碰 `public.saves` / `public.profiles`（cloud.js 的表） |
| API 暴露 | 控制台 Settings → API → Exposed schemas 里加上 `fcl`（不加则 REST 访问不到） |
| RLS | `fcl` 下每张表都开 RLS，只允许 `auth.uid() = user_id` |
| 账号 | Auth 用户表是**共用**的（`auth.users` 只有一张）。靠假邮箱域名区分：`@fcl.local` 只属于本游戏 |

**风险（诚实说明）：**
- `auth.users` 共用：同一个项目的任何账号在技术上都能拿到 JWT。所以 RLS 必须以 `auth.uid()` 为准，`fcl` 的表只认有 `fcl.accounts` 行的用户（注册后由触发器建行，且只给 `@fcl.local` 邮箱建）。
- 共用配额：数据库 500MB、带宽、Auth 限流两款游戏共享（额度数字以控制台 Usage 页为准，此处未逐项核对）。
- 误操作面：在 SQL 编辑器里跑错脚本可能影响 cloud.js 的表。迁移脚本全部带 `fcl.` 前缀，不出现 `public.` 的 DDL。
- 如果以后要真钱支付或独立运营，再迁到新项目：`pg_dump --schema=fcl` 即可整体搬走。

## 3. 登录方式：用户名+密码（假邮箱） vs 邮箱

| | 用户名+密码（假邮箱） | 邮箱+密码 |
|---|---|---|
| 注册门槛 | 低，填用户名和密码即可 | 需要真实邮箱 |
| 邮件确认 | 必须**关闭** Confirm email（假邮箱收不到信） | 可开可关 |
| 找回密码 | **不能**邮件找回；只能人工（管理员用 service_role 后台重置） | 邮件重置 |
| 内置邮件限流 | 不发邮件，不受影响 | 内置 SMTP 发信额度很低（官方文档写明仅供测试），量大要自配 SMTP |
| 与 cloud.js 一致 | 一致，已验证可用 | — |

**建议：第一阶段用户名+密码。** 后续可在设置里「绑定真实邮箱」（`updateUser({email})`）作为找回手段。

- 映射：`email = 'u' + hex(utf8(trim(用户名))) + '@fcl.local'`；用户名 2–16 字，中英数字下划线；大小写不敏感（先转小写再编码）。
- 密码 ≥ 8 位（控制台 Auth → Providers → Email → Minimum password length 设为 8）。
- 昵称放 `options.data.nickname`，不参与登录。

## 4. 存档云同步

- **本地是主存档**：localStorage 的现有键与 SaveData 格式（`v:1`）完全不变；断网照常玩。
- **首次登录**：
  1. 先把整个本地导出到备份键 `fcl_cloud_backup_<时间戳>`；
  2. 列出本地槽和云端槽；只有一边有的直接上传/下载；
  3. 两边都有的进入冲突选择。
- **冲突**：每槽云端行带 `updated_at`。上传用 `update ... where updated_at = 上次读到的值`，0 行受影响即冲突。冲突界面并排显示两边的「职业 / 等级 / 层 / 最后游玩时间」，玩家选一份；另一份存进备份键，**绝不自动覆盖**。
- **时机**：存档写入后节流 30 秒；进城；`visibilitychange` 隐藏时立即；pagehide 时 keepalive。
- **会话恢复**：先显示「正在恢复登录」，读 IDB/localStorage 会话，成功则静默同步，失败回游客态。

## 5. 表、RLS、Edge Function

SQL 文件位置（feat/account-p1 中）：`supabase/migrations/0001_fcl_schema.sql`；Edge Function：`supabase/functions/wallet/index.ts`。

```text
fcl.accounts     user_id uuid PK → auth.users | username text unique | created_at | lingfu_granted bool
fcl.save_slots   user_id | slot int(1..10) | data jsonb(SaveData 原样) | save_v int | cls text | level int |
                 floor int | play_ms bigint | client_at timestamptz | updated_at timestamptz(服务端 now())
                 PK(user_id, slot)
fcl.wallet       user_id PK | balance int check(balance>=0) | updated_at
fcl.ledger       id bigserial | user_id | delta int | reason text('signup_grant'|'shop'|'admin'|'refund') |
                 ref text | balance_after int | created_at
fcl.orders       id uuid | user_id | sku text | qty int | price int | idem_key text unique | created_at
```

RLS：
- `accounts`、`save_slots`：`select/insert/update/delete using (auth.uid() = user_id)`。
- `wallet`、`ledger`、`orders`：**只开 select**（`auth.uid() = user_id`），不给 insert/update/delete 策略 → 客户端只读。
- 写入 `wallet/ledger/orders` 只有两条路：注册触发器（`security definer`，一次性发 5000 并写 `signup_grant`，靠 `lingfu_granted` 防重复）和 Edge Function `wallet`（内部用 service_role，key 只存在 Supabase 函数的环境变量里）。

Edge Function `wallet`（`POST /functions/v1/wallet`，带用户 JWT）：
1. 校验 JWT 得到 user_id；校验 sku 在服务端价目表里（价格**不信任客户端**）；
2. 调用数据库函数 `fcl.spend(user_id, sku, qty, idem_key)`：一个事务内锁行、校验余额、扣减、写流水、写订单；`idem_key` 重复则返回上次结果；
3. 返回新余额与订单；客户端再把物品放进本地背包。

防作弊边界：灵符余额与流水防得住；存档内容（金币、装备）在客户端计算，防不住改档，这是单机游戏的已知边界。接真钱支付前必须把物品发放改为服务端权威。

## 6. 用户需要做的操作（按顺序）

1. **跑 SQL**：Supabase 控制台 → 项目 `yzhjhyroekrcdqqjrlgm` → SQL Editor → New query → 粘贴仓库里 `supabase/migrations/0001_fcl_schema.sql` 全文 → Run。脚本只建 `fcl.*`，不改 `public`。
2. **暴露 schema**：Settings → API（Data API）→ Exposed schemas 加 `fcl` → Save。
3. **关闭邮件确认**：Authentication → Sign In / Providers → Email → 关掉 **Confirm email** → Save。（cloud.js 已在用这个项目，若它已关闭则无需再动；先看一眼当前状态。）
4. **部署 Edge Function**（需本机装 Supabase CLI）：
   ```bash
   supabase login
   supabase link --project-ref yzhjhyroekrcdqqjrlgm
   supabase functions deploy wallet
   ```
   `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 在 Edge Function 运行时由 Supabase 自动注入，**不需要也不要**手动放进仓库。
5. **给前端的配置**（只有公开值）：
   - `VITE_SUPABASE_URL=https://yzhjhyroekrcdqqjrlgm.supabase.co`
   - `VITE_SUPABASE_KEY=sb_publishable_...`（publishable key；cloud.js 里已公开的那个即可）
   - 放在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables（构建时注入），或本地 `.env.local`（已被 gitignore）。需要我在盒子上测试时，通过 RequestUserForm 提供。
   - **service_role / secret key：任何情况下都不要发给前端、不要提交、不要贴进聊天。**
6. 未配置 `VITE_SUPABASE_*` 时，游戏自动是纯游客模式，登录入口显示「未配置」。

## 7. 已否决：腾讯云 CloudBase

曾作为大陆可达性备选。否决原因：没有不建环境的公开测试地址（网关形如 `https://{env}.api.tcloudbasegateway.com`）；用户名密码登录虽支持，但**不能只凭用户名+密码注册**，需先手机或邮箱验证（docs.cloudbase.net/authentication-v2/method/username-login、docs.cloudbase.net/http-api/auth/auth-sign-up）；且与已在用的 Supabase 项目重复。用户已拍板 Supabase。

## 8. 第 0 阶段：网络可达性测试页 net-test.html

- **地址**：`https://mbfish2026-max.github.io/card-legend-proto/net-test.html`（合入并部署后生效；在此之前分支 feat/net-test 可本地 `npm run build && npm run preview` 打开）。
- **怎么用**：用要玩游戏的手机、在平时的网络（移动 / 联通 / 电信 / Wi-Fi 各测一次更好）打开页面，等三项跑完（每项最多 8 秒，串行），点「复制结果」，把文本发回来。点「重新测试」可再跑一次。
- **每项含义**：

| 项 | 测什么 | 通过说明 |
|---|---|---|
| 1. 本站 | GitHub Pages 本身 | 游戏页面能打开 |
| 2a. Supabase REST | `/rest/v1/`（带 apikey） | 存档读写接口可达。返回 **401 也算通过**——有状态码就说明网络到达了服务器 |
| 2b. Supabase Auth | `/auth/v1/health`（带 apikey） | 登录注册接口可达 |

- **判读**：「通过」= 收到了 HTTP 响应（任何状态码）；「失败」= 网络错误、被重置或 8 秒超时。2a/2b 任一失败 → 云存档在该网络下不可用（游戏本身仍可游客玩）；若大面积失败，下一步考虑自定义域名反代（Supabase 自定义域名为付费附加项，约 $10/月，以官方定价页为准）。
- **回传格式**（「复制结果」直接生成）：
  ```text
  网络测试 2026/11/1 12:44:47
  UA：……
  域名：mbfish2026-max.github.io
  网络类型：4g 1.4Mbps rtt100ms
  1. 本站（游戏所在站点）：通过 12ms 收到响应 HTTP 200
  2a. Supabase 数据接口 REST：通过 26ms 收到响应 HTTP 401（有状态码即网络可达）
  2b. Supabase 登录接口 Auth：通过 839ms 收到响应 HTTP 200
  ```
  另请注明运营商与所在城市。
- **盒子实测**（海外机房，不代表大陆）：三项全部通过；离线时三项都在 0.1 秒内判失败，不会卡住。**真实手机与大陆网络尚未验证。**

## 9. 分阶段

| 阶段 | 内容 | 验收 |
|---|---|---|
| P0 | net-test.html | 真实手机三项结果回传 |
| P1 | feat/account-p1：用户名登录、多槽云存档、冲突选择、自托管 supabase-js、SQL 与 wallet 函数代码（不部署） | tsc / npm test / build 通过；mock 测会话恢复、冲突、离线、keepalive；截图 |
| P2 | 用户执行 §6 后联调；灵符商城接 wallet | 真实账号注册→存档→换设备读档；扣费幂等 |
| P3 | 绑定真实邮箱找回密码；可选自定义域名反代 | — |
