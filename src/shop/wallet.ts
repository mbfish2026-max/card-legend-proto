/**
 * 灵符钱包（docs/lingfu-shop.md §1、§4）。
 * - 游客：本机单一钱包 localStorage `fcl_lingfu_v1`，与存档槽无关、不进 SaveData；首次创建发 5000（只发一次）。
 * - 登录：预留 RemoteWallet 适配层，形状对齐 feat/account-p1 的 Edge Function `wallet`
 *   （POST /functions/v1/wallet，body { sku, qty, idem_key }，返回 { ok, order, item, qty, balance } / { ok:false, error }）。
 *   本分支不依赖 account-p1 代码，RemoteWallet 只是空实现（返回 not_configured）。
 * 1 元 = 10 灵符只用于价格显示；本阶段不接真实支付。
 */
export const LINGFU_KEY = 'fcl_lingfu_v1';
/** 新账号/游客首次赠送 [用户要求] */
export const SIGNUP_GRANT = 5000;
/** 1 元 = 10 灵符 [用户要求]，只作显示 */
export const LINGFU_PER_YUAN = 10;
export const LEDGER_MAX = 50;
export const yuanOf = (lingfu: number) => lingfu / LINGFU_PER_YUAN;

export interface LedgerEntry { t: number; delta: number; reason: 'signup_grant' | 'shop' | 'refund'; ref?: string; balanceAfter: number }
export interface WalletState { v: 1; balance: number; granted: boolean; createdAt: number; ledger: LedgerEntry[] }
/** 扣费结果（与 Edge Function 返回对齐：ok/error/balance/order） */
export type SpendResult = { ok: true; order: string; balance: number; dup?: boolean } | { ok: false; error: 'balance' | 'sku' | 'qty' | 'not_configured' | 'readonly' | 'io'; balance: number };

/** 统一钱包接口：本地钱包同步实现，远端钱包返回 Promise（UI 层两者都按 await 处理） */
export interface WalletBackend {
  readonly kind: 'local' | 'remote';
  balance(): number;
  /** price 只由客户端价目表给（本地）；远端只传 sku，价格只信服务端 fcl.shop_skus */
  spend(sku: string, price: number, qty: number, idemKey: string): SpendResult | Promise<SpendResult>;
}

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };
const ls = (): Store | undefined => { try { return (globalThis as any).localStorage; } catch { return undefined; } };

export function newWallet(now = Date.now()): WalletState {
  return { v: 1, balance: SIGNUP_GRANT, granted: true, createdAt: now, ledger: [{ t: now, delta: SIGNUP_GRANT, reason: 'signup_grant', balanceAfter: SIGNUP_GRANT }] };
}
/** 解析/迁移钱包；坏数据视为不存在（返回 null → 调用方新建并发 5000） */
export function parseWallet(raw: string | null): WalletState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw); if (!o || typeof o !== 'object' || typeof o.balance !== 'number' || !Number.isFinite(o.balance)) return null;
    return { v: 1, balance: Math.max(0, Math.floor(o.balance)), granted: o.granted !== false, createdAt: Number(o.createdAt) || 0, ledger: Array.isArray(o.ledger) ? o.ledger.slice(-LEDGER_MAX) : [] };
  } catch { return null; }
}

/** 游客本机钱包 */
export class LocalWallet implements WalletBackend {
  readonly kind = 'local' as const;
  state: WalletState;
  /** 本次加载是否刚发放了 5000（首次） */
  justGranted = false;
  constructor(private store: Store | undefined = ls(), now = Date.now()) {
    const s = parseWallet(store?.getItem(LINGFU_KEY) ?? null);
    if (s) this.state = s; else { this.state = newWallet(now); this.justGranted = true; this.persist(); }
  }
  balance() { return this.state.balance; }
  /** 重新读 localStorage（多标签页 storage 事件后调用） */
  reload() { const s = parseWallet(this.store?.getItem(LINGFU_KEY) ?? null); if (s) this.state = s; }
  persist(): boolean { try { this.store?.setItem(LINGFU_KEY, JSON.stringify(this.state)); return true; } catch { return false; } }
  spend(sku: string, price: number, qty: number, idemKey: string): SpendResult {
    this.reload();
    const st = this.state;
    if (st.ledger.some(l => l.ref === idemKey)) return { ok: true, dup: true, order: idemKey, balance: st.balance };
    if (!(qty >= 1 && qty <= 99) || !Number.isInteger(qty)) return { ok: false, error: 'qty', balance: st.balance };
    if (!(price >= 0) || !sku) return { ok: false, error: 'sku', balance: st.balance };
    const cost = price * qty; if (st.balance < cost) return { ok: false, error: 'balance', balance: st.balance };
    const prev = JSON.stringify(st);
    st.balance -= cost; st.ledger.push({ t: Date.now(), delta: -cost, reason: 'shop', ref: idemKey, balanceAfter: st.balance }); st.ledger = st.ledger.slice(-LEDGER_MAX);
    if (!this.persist()) { this.state = JSON.parse(prev); return { ok: false, error: 'io', balance: this.state.balance }; }
    return { ok: true, order: idemKey, balance: st.balance };
  }
  /** 发货失败时退款（同一次购买内调用，保证「扣款+发货」要么都成要么都不成） */
  refund(idemKey: string, amount: number) {
    const st = this.state; st.balance += amount; st.ledger.push({ t: Date.now(), delta: amount, reason: 'refund', ref: idemKey + ':refund', balanceAfter: st.balance }); st.ledger = st.ledger.slice(-LEDGER_MAX); this.persist();
  }
}

/**
 * 登录态钱包适配层（预留，未接入）。对接时：
 *   POST `${VITE_SUPABASE_URL}/functions/v1/wallet`，Header Authorization: Bearer <用户 JWT>、apikey: <anon key>，
 *   body { sku, qty, idem_key }；200 → { ok:true, order, item, qty, balance }；409 → { ok:false, error:'balance'|'sku'|'qty' }。
 *   余额读 fcl.wallet（RLS 只读），本地只做显示缓存 `fcl_lingfu_cache_<uid>`。service_role 只在 Edge Function secret，绝不进前端。
 */
export interface RemoteWalletConfig { url: string; anonKey: string; jwt: () => Promise<string | null>; uid: string }
export class RemoteWallet implements WalletBackend {
  readonly kind = 'remote' as const;
  cached = 0;
  constructor(readonly cfg: RemoteWalletConfig | null = null) {}
  balance() { return this.cached; }
  async spend(_sku: string, _price: number, _qty: number, _idem: string): Promise<SpendResult> {
    return { ok: false, error: 'not_configured', balance: this.cached }; // TODO(account-p2)：fetch Edge Function `wallet`
  }
}

let cur: LocalWallet | null = null;
/** 当前钱包（本阶段只有游客本机钱包） */
export function wallet(): LocalWallet { return cur ??= new LocalWallet(); }
/** 测试用 */
export function setWallet(w: LocalWallet | null) { cur = w; }
export const newIdem = () => 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
