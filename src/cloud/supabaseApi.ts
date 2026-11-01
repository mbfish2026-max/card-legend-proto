// Supabase 实现。supabase-js 由 vite 打包进本站 assets（动态 import 单独分块，自托管，不走 CDN）
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SaveData } from '../combat/World';
import type { CloudApi, CloudRow, CloudSession, PutResult } from './types';
import { emailToUsername, usernameToEmail, normUsername } from './account';
import { BEACON_MAX } from './sync';

export const AUTH_KEY = 'fcl_auth_v1', SCHEMA = 'fcl', TABLE = 'save_slots';
const IDB = 'fcl_auth', STORE = 'kv';
/** 会话存储：localStorage 为主，IndexedDB 镜像一份（localStorage 被清时还能恢复登录） */
export function mirrorStorage() {
  const mem = new Map<string, string>();
  const db: Promise<IDBDatabase | null> = new Promise(res => {
    try { const r = indexedDB.open(IDB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch { res(null); }
  });
  const idb = async (mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void) => { const d = await db; if (!d) return undefined; return new Promise<any>(res => { try { const t = d.transaction(STORE, mode), q = fn(t.objectStore(STORE)); t.oncomplete = () => res(q ? q.result : undefined); t.onerror = () => res(undefined); } catch { res(undefined); } }); };
  try { (navigator as any).storage?.persist?.(); } catch { /* 可选 */ }
  return {
    async getItem(k: string) { let v: string | null = null; try { v = localStorage.getItem(k); } catch { /* 无痕模式 */ } if (v == null) v = mem.get(k) ?? (await idb('readonly', s => s.get(k))) ?? null; if (v != null) try { localStorage.setItem(k, v); } catch { /* ignore */ } return v; },
    async setItem(k: string, v: string) { mem.set(k, v); try { localStorage.setItem(k, v); } catch { /* ignore */ } await idb('readwrite', s => { s.put(v, k); }); },
    async removeItem(k: string) { mem.delete(k); try { localStorage.removeItem(k); } catch { /* ignore */ } await idb('readwrite', s => { s.delete(k); }); },
  };
}
const netErr = (e: any) => { const m = String(e?.message ?? e); return /fetch|network|timeout|load failed/i.test(m) ? new Error('网络不可用：' + m) : null; };
const authErr = (e: any) => {
  const n = netErr(e); if (n) return n; const m = String(e?.message ?? e);
  if (/invalid login credentials/i.test(m)) return new Error('用户名或密码错误');
  if (/already registered|already exists/i.test(m)) return new Error('用户名已被注册');
  if (/email not confirmed/i.test(m)) return new Error('服务器开启了邮件确认，请在控制台关闭 Confirm email');
  return new Error(m);
};

export async function createSupabaseApi(url: string, key: string): Promise<CloudApi> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb: SupabaseClient<any, any, any> = createClient(url, key, { db: { schema: SCHEMA }, auth: { storage: mirrorStorage(), storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  let token = '', uid = '';
  const sess = (s: any): CloudSession => { token = s.access_token; uid = s.user.id; return { userId: uid, username: s.user.user_metadata?.username ?? emailToUsername(s.user.email ?? '') ?? '' }; };
  sb.auth.onAuthStateChange((_e, s) => { if (s) { token = s.access_token; uid = s.user.id; } else { token = ''; uid = ''; } });
  const row = (slot: number, d: SaveData, m: { playMs: number; clientAt: number | null }) => ({ slot, data: d, save_v: d.v, cls: d.cls, level: d.level, floor: d.floorIndex, play_ms: m.playMs, client_at: m.clientAt ? new Date(m.clientAt).toISOString() : null });
  return {
    async restore() { const { data, error } = await sb.auth.getSession(); if (error) throw authErr(error); return data.session ? sess(data.session) : null; },
    async signIn(u, p) { const { data, error } = await sb.auth.signInWithPassword({ email: usernameToEmail(u), password: p }); if (error) throw authErr(error); return sess(data.session); },
    async signUp(u, p) { const { data, error } = await sb.auth.signUp({ email: usernameToEmail(u), password: p, options: { data: { username: normUsername(u) } } }); if (error) throw authErr(error); if (!data.session) throw new Error('服务器开启了邮件确认，请在控制台关闭 Confirm email'); return sess(data.session); },
    async signOut() { await sb.auth.signOut(); },
    async list() { const { data, error } = await sb.from(TABLE).select('slot,data,updated_at,cls,level,floor,play_ms,client_at').eq('user_id', uid).order('slot'); if (error) throw netErr(error) ?? new Error(error.message); return (data ?? []) as CloudRow[]; },
    async put(slot, d, expected, m): Promise<PutResult> {
      if (expected == null) {
        const { data, error } = await sb.from(TABLE).insert({ user_id: uid, ...row(slot, d, m) }).select('updated_at').single();
        if (error) { if (error.code === '23505') return { ok: false, conflict: true }; throw netErr(error) ?? new Error(error.message); }
        return { ok: true, at: (data as any).updated_at };
      }
      const { data, error } = await sb.from(TABLE).update(row(slot, d, m)).eq('user_id', uid).eq('slot', slot).eq('updated_at', expected).select('updated_at');
      if (error) throw netErr(error) ?? new Error(error.message);
      return data && data.length ? { ok: true, at: (data[0] as any).updated_at } : { ok: false, conflict: true };
    },
    beacon(slot, d, expected) {
      if (!token || !uid) return false;
      const body = JSON.stringify(row(slot, d, { playMs: 0, clientAt: Date.now() })); if (body.length >= BEACON_MAX) return false;
      const q = `user_id=eq.${uid}&slot=eq.${slot}&updated_at=eq.${encodeURIComponent(expected)}`;
      try { void fetch(`${url}/rest/v1/${TABLE}?${q}`, { method: 'PATCH', keepalive: true, body, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Profile': SCHEMA, Prefer: 'return=minimal' } }); return true; } catch { return false; }
    },
  };
}
