// 内存版 CloudApi：模拟 Supabase 的 fcl.save_slots + Auth，不连任何真实服务
import type { CloudApi, CloudRow, CloudSession } from '../src/cloud/types';
export class MockCloud implements CloudApi {
  users = new Map<string, { id: string; pw: string }>(); rows = new Map<string, CloudRow>(); // key=uid:slot
  session: CloudSession | null = null; persisted: CloudSession | null = null; // persisted = 存储里的会话（模拟刷新页面后恢复）
  offline = false; beacons: { slot: number; body: number; expected: string }[] = []; calls: string[] = []; tick = 0;
  private net(op: string) { this.calls.push(op); if (this.offline) throw new Error('网络不可用：Failed to fetch'); }
  private at() { return new Date(Date.UTC(2026, 10, 1, 0, 0, ++this.tick)).toISOString(); }
  async restore() { this.net('restore'); this.session = this.persisted; return this.session; }
  async signUp(u: string, p: string) { this.net('signUp'); if (this.users.has(u)) throw new Error('用户名已被注册'); this.users.set(u, { id: 'uid-' + u, pw: p }); return this.login(u); }
  async signIn(u: string, p: string) { this.net('signIn'); const x = this.users.get(u); if (!x || x.pw !== p) throw new Error('用户名或密码错误'); return this.login(u); }
  private login(u: string) { this.session = this.persisted = { userId: this.users.get(u)!.id, username: u }; return this.session; }
  async signOut() { this.session = this.persisted = null; }
  async list() { this.net('list'); const uid = this.session!.userId; return [...this.rows.values()].filter((r: any) => r.uid === uid).map(r => ({ ...r, data: JSON.parse(JSON.stringify(r.data)) })).sort((a, b) => a.slot - b.slot); }
  async put(slot: number, data: any, expected: string | null) {
    this.net('put'); const k = this.session!.userId + ':' + slot, cur = this.rows.get(k);
    if (expected == null ? !!cur : cur?.updated_at !== expected) return { ok: false as const, conflict: true as const };
    const at = this.at(); this.rows.set(k, { uid: this.session!.userId, slot, data: JSON.parse(JSON.stringify(data)), updated_at: at, level: data.level, cls: data.cls } as any); return { ok: true as const, at };
  }
  beacon(slot: number, data: any, expected: string) {
    const body = JSON.stringify(data).length; this.beacons.push({ slot, body, expected });
    const k = this.session!.userId + ':' + slot; if (this.rows.get(k)?.updated_at === expected) this.rows.set(k, { ...this.rows.get(k)!, data: JSON.parse(JSON.stringify(data)), updated_at: this.at() });
    return true;
  }
  /** 另一台设备写云端 */
  remoteWrite(uid: string, slot: number, data: any) { this.rows.set(uid + ':' + slot, { uid, slot, data, updated_at: this.at() } as any); }
}
