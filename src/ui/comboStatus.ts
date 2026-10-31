/**
 * 阶段 B 合击持续状态表现（纯逻辑，无 Phaser 依赖，可无头测试）。
 * - shihun 噬魂沼泽：中毒期间毒沼循环段（fx_combo_shihun 帧 8–11）跟随主目标（主目标死后跟随仍中毒的目标）
 * - mori 末日审判：持续掉血期间法阵循环段（fx_combo_mori 帧 8–11）跟随目标
 * - pixing 劈星斩：麻痹期间目标头顶「麻痹」标记 + 电弧（fx_combo_pixing 帧 6–9）；BOSS 免疫麻痹 → World 不放进 affected → 不显示
 * 状态结束 / 目标全部死亡或离场 → 立即 destroy 句柄。只读 Unit 状态字段，不改任何战斗数值。
 */
export type ComboStatusField = 'poisonUntil' | 'stunUntil';
export interface ComboStatusDef { field: ComboStatusField; /** 起手段播放多久后才接循环段（秒） */ introSec: number; kind: 'loop' | 'mark'; loopFrames?: [number, number] }
export const COMBO_STATUS: Record<string, ComboStatusDef> = {
  shihun: { field: 'poisonUntil', introSec: 0.4, kind: 'loop', loopFrames: [8, 11] },
  mori: { field: 'poisonUntil', introSec: 0.4, kind: 'loop', loopFrames: [8, 11] },
  pixing: { field: 'stunUntil', introSec: 0, kind: 'mark', loopFrames: [6, 9] },
};
export interface StatusUnit { uid: number; alive: boolean; poisonUntil?: number; stunUntil?: number }
export interface StatusHandle { update(u: StatusUnit): void; destroy(): void }
interface Entry { id: string; uids: number[]; until: number; showAt: number; handle: StatusHandle | null }
export class ComboStatusTracker {
  readonly entries = new Map<string, Entry>();
  constructor(private make: (id: string, u: StatusUnit) => StatusHandle | null) {}
  /** 合击事件：primary 为主目标，affected 为被施加状态的目标（World 事件字段） */
  start(id: string, primary: number, affected: number[] | undefined, until: number | undefined, now: number) {
    const d = COMBO_STATUS[id]; if (!d || until === undefined || !affected?.length) return;
    const uids = [...new Set(affected.includes(primary) ? [primary, ...affected] : affected)];
    // 每个合击每个主目标一个句柄；同目标再次合击 → 替换（先清理旧的）
    const keys = d.kind === 'mark' ? uids.map(u => `${id}:${u}`) : [`${id}:${uids[0]}`];
    keys.forEach((k, i) => { this.drop(k); this.entries.set(k, { id, uids: d.kind === 'mark' ? [uids[i]] : uids, until, showAt: now + d.introSec, handle: null }); });
  }
  /** 每帧：look 返回当前仍在场景中的 unit（死亡/离场返回 undefined） */
  sync(now: number, look: (uid: number) => StatusUnit | undefined) {
    for (const [k, e] of this.entries) {
      const f = COMBO_STATUS[e.id].field;
      const live = now < e.until ? e.uids.map(look).filter((u): u is StatusUnit => !!u && u.alive && (u[f] ?? 0) > now) : [];
      if (!live.length) { this.drop(k); continue; }
      if (now < e.showAt) continue;
      e.handle ??= this.make(e.id, live[0]);
      e.handle?.update(live[0]);
    }
  }
  drop(k: string) { const e = this.entries.get(k); if (!e) return; e.handle?.destroy(); this.entries.delete(k); }
  clear() { [...this.entries.keys()].forEach(k => this.drop(k)); }
  get size() { return this.entries.size; }
  get liveHandles() { let n = 0; this.entries.forEach(e => { if (e.handle) n++; }); return n; }
}
