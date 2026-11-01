-- 卡牌传奇 云存档 + 灵符账本（schema fcl）。只建 fcl.*，不改 public（独立项目，表统一放 fcl 便于迁移）
-- 执行：Supabase 控制台 → SQL Editor → 粘贴全文 → Run。可重复执行（IF NOT EXISTS / OR REPLACE）
create schema if not exists fcl;
grant usage on schema fcl to anon, authenticated, service_role;

-- 账号（只给 @fcl.local 假邮箱建行；同项目其他游戏的用户不会进入本表）
create table if not exists fcl.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  lingfu_granted boolean not null default false,
  created_at timestamptz not null default now()
);
-- 存档槽：data 为客户端 SaveData 原样（v:1），格式不改
create table if not exists fcl.save_slots (
  user_id uuid not null references fcl.accounts(user_id) on delete cascade,
  slot int not null check (slot between 1 and 10),
  data jsonb not null,
  save_v int, cls text, level int, floor int, play_ms bigint default 0,
  client_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot),
  constraint save_size check (pg_column_size(data) < 1048576)
);
create table if not exists fcl.wallet (
  user_id uuid primary key references fcl.accounts(user_id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists fcl.ledger (
  id bigserial primary key,
  user_id uuid not null references fcl.accounts(user_id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('signup_grant','shop','admin','refund')),
  ref text, balance_after int not null,
  created_at timestamptz not null default now()
);
-- 商城价目表：价格只信服务端；内容由管理员填写（官方价格未查到，不预置）
create table if not exists fcl.shop_skus (
  sku text primary key, item_id text not null, price int not null check (price > 0), active boolean not null default true
);
create table if not exists fcl.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references fcl.accounts(user_id) on delete cascade,
  sku text not null references fcl.shop_skus(sku), qty int not null check (qty between 1 and 99),
  price int not null, idem_key text not null unique,
  created_at timestamptz not null default now()
);

-- updated_at 由服务端写（客户端乐观锁依据）
create or replace function fcl.touch() returns trigger language plpgsql as $$
begin new.updated_at := clock_timestamp(); return new; end $$;
drop trigger if exists save_touch on fcl.save_slots;
create trigger save_touch before insert or update on fcl.save_slots for each row execute function fcl.touch();

-- 注册触发器：@fcl.local 新用户 → 建账号 + 钱包，一次性发 5000 灵符（lingfu_granted 防重复）
create or replace function fcl.on_signup() returns trigger language plpgsql security definer set search_path = fcl, public as $$
begin
  if new.email not like '%@fcl.local' then return new; end if;
  insert into fcl.accounts(user_id, username, lingfu_granted)
    values (new.id, coalesce(new.raw_user_meta_data->>'username', new.email), true)
    on conflict (user_id) do nothing;
  if found then
    insert into fcl.wallet(user_id, balance) values (new.id, 5000) on conflict do nothing;
    insert into fcl.ledger(user_id, delta, reason, balance_after) values (new.id, 5000, 'signup_grant', 5000);
  end if;
  return new;
exception when others then
  -- 本触发器出错绝不能阻断任何注册（缺的账号行由客户端首次登录时报错提示，管理员补）
  raise warning 'fcl.on_signup failed: %', sqlerrm; return new;
end $$;
drop trigger if exists fcl_on_signup on auth.users;
create trigger fcl_on_signup after insert on auth.users for each row execute function fcl.on_signup();

-- 扣费：一个事务内锁钱包、校验、扣减、写流水与订单；idem_key 重复返回上次结果。只允许 service_role（Edge Function）调用
create or replace function fcl.spend(p_user uuid, p_sku text, p_qty int, p_idem text)
returns jsonb language plpgsql security definer set search_path = fcl, public as $$
declare v_price int; v_item text; v_bal int; v_order fcl.orders;
begin
  select * into v_order from fcl.orders where idem_key = p_idem and user_id = p_user;
  if found then select balance into v_bal from fcl.wallet where user_id = p_user;
    return jsonb_build_object('ok', true, 'dup', true, 'order', v_order.id, 'balance', v_bal); end if;
  select price, item_id into v_price, v_item from fcl.shop_skus where sku = p_sku and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'sku'); end if;
  if p_qty < 1 or p_qty > 99 then return jsonb_build_object('ok', false, 'error', 'qty'); end if;
  select balance into v_bal from fcl.wallet where user_id = p_user for update;
  if not found or v_bal < v_price * p_qty then return jsonb_build_object('ok', false, 'error', 'balance', 'balance', coalesce(v_bal, 0)); end if;
  update fcl.wallet set balance = balance - v_price * p_qty, updated_at = now() where user_id = p_user returning balance into v_bal;
  insert into fcl.orders(user_id, sku, qty, price, idem_key) values (p_user, p_sku, p_qty, v_price, p_idem) returning * into v_order;
  insert into fcl.ledger(user_id, delta, reason, ref, balance_after) values (p_user, -v_price * p_qty, 'shop', v_order.id::text, v_bal);
  return jsonb_build_object('ok', true, 'order', v_order.id, 'item', v_item, 'qty', p_qty, 'balance', v_bal);
end $$;
revoke all on function fcl.spend(uuid, text, int, text) from public, anon, authenticated;
grant execute on function fcl.spend(uuid, text, int, text) to service_role;

-- RLS：存档只能读写自己的；钱包/流水/订单客户端只读；价目表只读
alter table fcl.accounts enable row level security;
alter table fcl.save_slots enable row level security;
alter table fcl.wallet enable row level security;
alter table fcl.ledger enable row level security;
alter table fcl.orders enable row level security;
alter table fcl.shop_skus enable row level security;
drop policy if exists acc_sel on fcl.accounts;   create policy acc_sel on fcl.accounts for select to authenticated using (auth.uid() = user_id);
drop policy if exists save_sel on fcl.save_slots; create policy save_sel on fcl.save_slots for select to authenticated using (auth.uid() = user_id);
drop policy if exists save_ins on fcl.save_slots; create policy save_ins on fcl.save_slots for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists save_upd on fcl.save_slots; create policy save_upd on fcl.save_slots for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists save_del on fcl.save_slots; create policy save_del on fcl.save_slots for delete to authenticated using (auth.uid() = user_id);
drop policy if exists wal_sel on fcl.wallet;     create policy wal_sel on fcl.wallet for select to authenticated using (auth.uid() = user_id);
drop policy if exists led_sel on fcl.ledger;     create policy led_sel on fcl.ledger for select to authenticated using (auth.uid() = user_id);
drop policy if exists ord_sel on fcl.orders;     create policy ord_sel on fcl.orders for select to authenticated using (auth.uid() = user_id);
drop policy if exists sku_sel on fcl.shop_skus;  create policy sku_sel on fcl.shop_skus for select to authenticated using (active);

grant select on fcl.accounts, fcl.wallet, fcl.ledger, fcl.orders, fcl.shop_skus to authenticated;
grant select, insert, update, delete on fcl.save_slots to authenticated;
grant all on all tables in schema fcl to service_role;
grant usage, select on all sequences in schema fcl to service_role;
-- 最后：控制台 Settings → API → Exposed schemas 加入 fcl
