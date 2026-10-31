/**
 * 阶段 B 合击持续状态表现（纯逻辑，无 Phaser 依赖，可无头测试）。
 * - shihun 噬魂沼泽：中毒期间毒沼循环段（fx_combo_shihun 帧 8–11）跟随主目标（主目标死后跟随仍中毒的目标）
 * - mori 末日审判：持续掉血期间法阵循环段（fx_combo_mori 帧 8–11）跟随目标
 * - pixing 劈星斩：麻痹期间目标头顶「麻痹」标记 + 电弧（fx_combo_pixing 帧 6–9）；BOSS 免疫麻痹 → World 不放进 affected → 不显示
 * 状态结束 / 目标全部死亡或离场 → 立即 destroy 句柄。只读 Unit 状态字段，不改任何战斗数值。
 * 素材（特效 Bot fx/combo-loop）：优先专用 loopKey（fx_combo_shihun_loop / fx_combo_mori_loop / fx_combo_pixing_stun），结束播 endKey 一次；
 * pixing_stun 每次麻痹播放 1 次（动画 cs_once_fx_combo_pixing_stun）。缺专用素材 → 回退起手图集帧区间往返（动画 key 用 cs_fallback_<id>，避免与素材同名 key 冲突）→ 再缺 → Graphics。
 */
export type ComboStatusField = 'poisonUntil' | 'stunUntil';
export interface ComboStatusDef { field: ComboStatusField; /** 起手段播放多久后才接循环段（秒） */ introSec: number; kind: 'loop' | 'mark'; loopFrames?: [number, number]; loopKey?: string; endKey?: string; icon?: string }
export const COMBO_STATUS: Record<string, ComboStatusDef> = {
  shihun: { field: 'poisonUntil', introSec: 0.4, kind: 'loop', loopFrames: [8, 11], loopKey: 'fx_combo_shihun_loop', endKey: 'fx_combo_shihun_end' },
  mori: { field: 'poisonUntil', introSec: 0.4, kind: 'loop', loopFrames: [8, 11], loopKey: 'fx_combo_mori_loop', endKey: 'fx_combo_mori_end' },
  pixing: { field: 'stunUntil', introSec: 0, kind: 'mark', loopFrames: [6, 9], loopKey: 'fx_combo_pixing_stun', icon: 'icon_status_stun' },
};
/** 回退动画 key：不得与任何素材/FX_DEFS key 同名（旧实现用 fx_combo_<id>_loop，与新素材 key 冲突） */
export const fallbackAnimKey = (id: string) => 'cs_fallback_' + id;
export interface ComboStatusPlan { loop: { tex: string; anim: string; fallback: boolean } | null; end: string | null; icon: string | null }
/** 按现有贴图决定表现方案（纯函数，可无头测）；has(key) = 贴图已加载 */
export function comboStatusPlan(id: string, has: (k: string) => boolean): ComboStatusPlan {
  const d = COMBO_STATUS[id], base = 'fx_combo_' + id;
  const loop = d.loopKey && has(d.loopKey) ? { tex: d.loopKey, anim: d.loopKey, fallback: false }
    : d.loopFrames && has(base) ? { tex: base, anim: fallbackAnimKey(id), fallback: true } : null;
  return { loop, end: d.endKey && has(d.endKey) ? d.endKey : null, icon: d.icon && has(d.icon) ? d.icon : null };
}
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
