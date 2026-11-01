// 云存档同步核心（不依赖 supabase-js，便于 mock 测试）。原则：本地是主版本；冲突由玩家选；任何情况下不自动覆盖任一方
import type { SaveData } from '../combat/World';
import type { CloudApi, CloudRow, CloudSession, KV, LocalSlots } from './types';

export const STATE_KEY = 'fcl_cloud_v1', BACKUP_PREFIX = 'fcl_cloud_backup_';
export const BEACON_MAX = 60_000; // keepalive 请求体上限约 64KB，留余量
export const FLUSH_DELAY = 30_000;
export type CloudStatus = 'off' | 'guest' | 'restoring' | 'online' | 'offline' | 'conflict';
export interface Conflict { slot: number; local: SaveData; cloud: CloudRow }
interface State { userId: string; username: string; remoteAt: Record<string, string>; dirty: number[]; migrated: boolean }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** 首次登录迁移计划：只一边有的直接上/下传；两边都有且内容不同的进冲突 */
export function planMigration(local: (SaveData | null)[], remote: CloudRow[]) {
  const up: number[] = [], down: CloudRow[] = [], conflict: number[] = [], adopt: CloudRow[] = [];
  const byslot = new Map(remote.map(r => [r.slot, r]));
  const n = Math.max(local.length, ...remote.map(r => r.slot), 0);
  for (let i = 1; i <= n; i++) {
    const l = local[i - 1] ?? null, r = byslot.get(i);
    if (l && !r) up.push(i); else if (!l && r) down.push(r);
    else if (l && r) { if (same(l, r.data)) adopt.push(r); else conflict.push(i); }
  }
  return { up, down, conflict, adopt };
}

export class CloudSync {
  status: CloudStatus = 'guest'; session: CloudSession | null = null; conflicts: Conflict[] = []; lastError = '';
  private st: State | null = null; private timer: ReturnType<typeof setTimeout> | null = null;
  onChange: () => void = () => {};
  constructor(public api: CloudApi | null, private local: LocalSlots, private kv: KV, private now = () => Date.now(),
    private schedule: (fn: () => void, ms: number) => ReturnType<typeof setTimeout> = (fn, ms) => setTimeout(fn, ms)) {
    if (!api) this.status = 'off';
    try { const s = JSON.parse(kv.getItem(STATE_KEY) ?? 'null'); if (s?.userId) this.st = { remoteAt: {}, dirty: [], migrated: false, ...s }; } catch { /* 坏状态忽略 */ }
  }
  get configured() { return !!this.api; }
  private save() { if (this.st) this.kv.setItem(STATE_KEY, JSON.stringify(this.st)); else this.kv.removeItem(STATE_KEY); }
  private set(s: CloudStatus) { this.status = s; this.onChange(); }
  /** 启动：先显示「正在恢复登录」，恢复成功静默同步；网络失败保持账号但标离线 */
  async start() {
    if (!this.api) return this.set('off');
    this.set('restoring');
    try {
      const s = await this.api.restore();
      if (!s) { this.session = null; return this.set('guest'); }
      this.bind(s); this.set('online');
      if (!this.st!.migrated) await this.migrate(); else await this.flush();
    } catch (e) { this.lastError = String((e as Error)?.message ?? e); this.session = this.st ? { userId: this.st.userId, username: this.st.username } : null; this.set(this.session ? 'offline' : 'guest'); }
  }
  private bind(s: CloudSession) {
    this.session = s;
    if (!this.st || this.st.userId !== s.userId) this.st = { userId: s.userId, username: s.username, remoteAt: {}, dirty: [], migrated: false };
    this.save();
  }
  async login(username: string, password: string, signup = false) {
    if (!this.api) throw new Error('未配置');
    const s = signup ? await this.api.signUp(username, password) : await this.api.signIn(username, password);
    this.bind(s); this.set('online');
    if (!this.st!.migrated) await this.migrate(); else await this.flush();
    return s;
  }
  async logout() { try { await this.api?.signOut(); } catch { /* 离线也允许退出 */ } this.session = null; this.st = null; this.conflicts = []; this.save(); this.set(this.api ? 'guest' : 'off'); }
  /** 整个本地存档（所有槽原始字符串 + 元数据）备份到 fcl_cloud_backup_<时间> */
  backup(tag = '') {
    const out: Record<string, string> = {};
    const n = this.kv.length ?? 0;
    for (let i = 0; i < n; i++) { const k = this.kv.key?.(i); if (k && k.startsWith('fcl_') && !k.startsWith(BACKUP_PREFIX) && k !== STATE_KEY) out[k] = this.kv.getItem(k) ?? ''; }
    const key = BACKUP_PREFIX + this.now() + tag; this.kv.setItem(key, JSON.stringify(out)); return key;
  }
  /** 首次登录：先备份，再迁移；冲突不处理，交给玩家 */
  async migrate() {
    const st = this.st!; this.backup();
    const rows = await this.api!.list();
    const local = Array.from({ length: this.local.count() }, (_, k) => this.local.read(k + 1));
    const p = planMigration(local, rows);
    const maxSlot = Math.max(...rows.map(r => r.slot), 0); if (maxSlot > this.local.count()) this.local.setCount(maxSlot);
    for (const r of p.down) { this.local.write(r.slot, r.data); st.remoteAt[r.slot] = r.updated_at; }
    for (const r of p.adopt) st.remoteAt[r.slot] = r.updated_at;
    for (const i of p.up) { const d = this.local.read(i)!; const res = await this.api!.put(i, d, null, this.meta(i)); if (res.ok) st.remoteAt[i] = res.at; else { const r = (await this.api!.list()).find(x => x.slot === i); if (r) this.conflicts.push({ slot: i, local: d, cloud: r }); } }
    for (const i of p.conflict) this.conflicts.push({ slot: i, local: this.local.read(i)!, cloud: rows.find(r => r.slot === i)! });
    st.migrated = true; this.save(); this.set(this.conflicts.length ? 'conflict' : 'online');
    return p;
  }
  private meta(i: number) { return { playMs: this.local.playMs(i), clientAt: this.local.lastAt(i) }; }
  /** 玩家选择：被放弃的一方先写备份键，再处理；choice=local 用乐观锁上传，cloud 覆盖本地槽 */
  async resolve(slot: number, choice: 'local' | 'cloud') {
    const c = this.conflicts.find(x => x.slot === slot); if (!c) return;
    const st = this.st!;
    const lose = choice === 'local' ? c.cloud.data : c.local;
    this.kv.setItem(`${BACKUP_PREFIX}${this.now()}_s${slot}_${choice === 'local' ? 'cloud' : 'local'}`, JSON.stringify(lose));
    if (choice === 'cloud') { this.local.write(slot, c.cloud.data); st.remoteAt[slot] = c.cloud.updated_at; st.dirty = st.dirty.filter(x => x !== slot); }
    else {
      const res = await this.api!.put(slot, c.local, c.cloud.updated_at, this.meta(slot));
      if (!res.ok) { const r = (await this.api!.list()).find(x => x.slot === slot); if (r) c.cloud = r; this.save(); this.onChange(); return; } // 期间云端又变了：重新让玩家选
      st.remoteAt[slot] = res.at; st.dirty = st.dirty.filter(x => x !== slot);
    }
    this.conflicts = this.conflicts.filter(x => x !== c); this.save();
    this.set(this.conflicts.length ? 'conflict' : 'online');
  }
  /** 本地写档后调用：标脏，节流 30 秒上传 */
  markDirty(slot: number) {
    if (!this.st || !this.session) return;
    if (!this.st.dirty.includes(slot)) this.st.dirty.push(slot); this.save();
    if (!this.timer) this.timer = this.schedule(() => { this.timer = null; void this.flush(); }, FLUSH_DELAY);
  }
  async flush() {
    const st = this.st; if (!st || !this.session || !this.api || !st.migrated) return;
    for (const slot of [...st.dirty]) {
      if (this.conflicts.some(c => c.slot === slot)) continue;
      const d = this.local.read(slot); if (!d) { st.dirty = st.dirty.filter(x => x !== slot); continue; }
      try {
        const res = await this.api.put(slot, d, st.remoteAt[slot] ?? null, this.meta(slot));
        if (res.ok) { st.remoteAt[slot] = res.at; st.dirty = st.dirty.filter(x => x !== slot); }
        else {
          const r = (await this.api.list()).find(x => x.slot === slot);
          if (r && same(r.data, d)) { st.remoteAt[slot] = r.updated_at; st.dirty = st.dirty.filter(x => x !== slot); } // keepalive 已送达：内容相同直接采纳
          else if (r) this.conflicts.push({ slot, local: d, cloud: r });
        }
        if (this.status === 'offline') this.status = 'online';
      } catch (e) { this.lastError = String((e as Error)?.message ?? e); this.save(); return this.set('offline'); }
    }
    this.save(); this.set(this.conflicts.length ? 'conflict' : this.status === 'restoring' ? 'online' : this.status);
  }
  /** 页面隐藏：立即上传 */
  onHidden() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } return this.flush(); }
  /** pagehide/beforeunload：对当前槽的脏数据发 keepalive（需有已知 updated_at，且体积 < 60KB） */
  onPageHide() {
    const st = this.st; if (!st || !this.session || !this.api) return false;
    const slot = this.local.active(); if (!st.dirty.includes(slot) || !st.remoteAt[slot]) return false;
    const d = this.local.read(slot); if (!d || JSON.stringify(d).length >= BEACON_MAX) return false;
    return this.api.beacon(slot, d, st.remoteAt[slot]);
  }
  get dirty() { return [...(this.st?.dirty ?? [])]; }
  get username() { return this.session?.username ?? this.st?.username ?? ''; }
}
