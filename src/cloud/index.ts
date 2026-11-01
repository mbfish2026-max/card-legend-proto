// 云存档入口：读 VITE_ 配置；未配置时为纯游客（status=off），游戏行为完全不变
import { CloudSync } from './sync';
import type { CloudApi, KV, LocalSlots } from './types';
import { Slots, saveHooks } from '../settings';

export const CLOUD_URL = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? '';
export const CLOUD_KEY = (import.meta.env?.VITE_SUPABASE_KEY as string | undefined) ?? '';
/** 防误配：只接受 publishable / anon key，拒绝 service_role 或 secret key */
export function keyLooksPublic(k: string) {
  if (!k || k.startsWith('sb_secret_')) return false;
  if (k.startsWith('sb_publishable_')) return true;
  try { const p = JSON.parse(atob(k.split('.')[1] ?? '')); return p?.role === 'anon'; } catch { return false; }
}
export const localSlots: LocalSlots = {
  count: () => Slots.count(), setCount: n => Slots.setCount(n), active: () => Slots.active(),
  read: i => Slots.read(i), write: (i, d) => Slots.writeRaw(i, d),
  playMs: i => Slots.list().find(x => x.i === i)?.playMs ?? 0, lastAt: i => Slots.list().find(x => x.i === i)?.lastAt ?? null,
};
let cloud: CloudSync | null = null;
const kv = (): KV => { try { return globalThis.localStorage; } catch { const m = new Map<string, string>(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k) }; } };
/** 启动一次。测试可经 window.__FCL_CLOUD_MOCK__ 注入 CloudApi（只用于 e2e，不连真实服务） */
export function initCloud(): CloudSync {
  if (cloud) return cloud;
  const mock = (globalThis as any).__FCL_CLOUD_MOCK__ as CloudApi | undefined;
  const ok = !!mock || (!!CLOUD_URL && keyLooksPublic(CLOUD_KEY));
  cloud = new CloudSync(null, localSlots, kv());
  if (!ok) return cloud;
  cloud.status = 'restoring';
  const ready = mock ? Promise.resolve(mock) : import('./supabaseApi').then(m => m.createSupabaseApi(CLOUD_URL, CLOUD_KEY));
  void ready.then(api => { cloud!.api = api; return cloud!.start(); }).catch(e => { cloud!.lastError = String(e?.message ?? e); cloud!.status = 'offline'; cloud!.onChange(); });
  saveHooks.onWrite = i => cloud!.markDirty(i);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.hidden) void cloud!.onHidden(); });
    addEventListener('pagehide', () => cloud!.onPageHide());
  }
  return cloud;
}
export const getCloud = () => cloud;
