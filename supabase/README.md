# supabase/（只在仓库里，未部署）
- `migrations/0001_fcl_schema.sql`：fcl schema、表、RLS、注册发 5000 灵符触发器、扣费函数 `fcl.spend`。
- `functions/wallet/index.ts`：灵符扣费 Edge Function。
- 执行步骤见 docs/account-db.md §6。前端只用 `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY`（publishable）；service_role 永不进仓库与前端。
- 项目：**新建独立 Supabase 项目**（已决定，不使用暗夜挂机的项目）；等用户提供新项目 URL + anon/publishable key 再联调。
