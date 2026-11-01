// Edge Function：灵符扣费（POST /functions/v1/wallet，Authorization: Bearer <用户 JWT>）
// body: { sku: string, qty?: number, idem_key: string }。价格只信服务端 fcl.shop_skus。
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 由 Supabase 运行时自动注入；service_role 永不进仓库与前端。
// 部署（用户执行）：supabase functions deploy wallet --project-ref yzhjhyroekrcdqqjrlgm
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ ok: false, error: 'auth' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false }, db: { schema: 'fcl' } });
  const { data: u, error: ue } = await admin.auth.getUser(jwt);
  if (ue || !u?.user) return json({ ok: false, error: 'auth' }, 401);
  let body: any; try { body = await req.json(); } catch { return json({ ok: false, error: 'body' }, 400); }
  const sku = String(body?.sku ?? ''), qty = Math.floor(Number(body?.qty ?? 1)), idem = String(body?.idem_key ?? '');
  if (!/^[\w.-]{1,64}$/.test(sku) || !/^[\w-]{8,80}$/.test(idem) || !(qty >= 1 && qty <= 99)) return json({ ok: false, error: 'args' }, 400);
  const { data, error } = await admin.rpc('spend', { p_user: u.user.id, p_sku: sku, p_qty: qty, p_idem: idem });
  if (error) return json({ ok: false, error: 'db' }, 500);
  return json(data, (data as any)?.ok ? 200 : 409);
});
