/** 左右键识别（stepDir）+ 按住持续走（HoldKeys）；StepGate 为旧“一按一格”节流（已不在游戏中使用）。：兼容远程控制（向日葵/ToDesk/RDP/VNC）下 keyup 丢失、repeat 误标、code 为空等情况 */
export interface KeyLike { key?: string; code?: string; keyCode?: number; which?: number; repeat?: boolean }
/** key / code / keyCode 三重识别：返回 -1 左、1 右、0 非左右键 */
export function stepDir(e: KeyLike): -1 | 0 | 1 {
  const k = (e.key || '').toLowerCase(), c = e.code || '', kc = e.keyCode || e.which || 0;
  if (k === 'arrowleft' || k === 'left' || k === 'a' || c === 'ArrowLeft' || c === 'KeyA' || kc === 37 || kc === 65) return -1;
  if (k === 'arrowright' || k === 'right' || k === 'd' || c === 'ArrowRight' || c === 'KeyD' || kc === 39 || kc === 68) return 1;
  return 0;
}
/** 每个 keydown 都算一次；仅 repeat=true 时要求距上次触发 ≥ minRepeatMs（按住可慢速逐格走）。不依赖 keyup。 */
export class StepGate {
  private last = -Infinity;
  constructor(public minRepeatMs = 150) {}
  accept(e: KeyLike, now: number): boolean {
    if (e.repeat && now - this.last < this.minRepeatMs) return false;
    this.last = now; return true;
  }
  reset() { this.last = -Infinity; }
}

/** 按住持续移动（兼容远程控制丢 keyup / repeat 误标 / 只有 keyCode）：
 *  - 每个 keydown（含 repeat）都刷新该方向的“最近按下时间”；不依赖 repeat 标志
 *  - keyup 正常到达立即停（但保证短按至少走 minTapMs，点按有明显位移）
 *  - keyup 丢失时看门狗：首次按下后 graceMs 宽限（覆盖系统首次重复延迟 ~500ms），之后 watchdogMs 内没有新 keydown 视为松开
 *  - 左右同时按：以后按下的为准 */
export const HOLD = { minTapMs: 100, graceMs: 560, watchdogMs: 230 };
interface DirState { first: number; last: number; up: number | null; order: number }
export class HoldKeys {
  private s = new Map<number, DirState>(); private n = 0;
  constructor(public cfg = HOLD) {}
  down(d: number, now: number) {
    if (!d) return; const o = this.s.get(d);
    if (o && o.up === null && this.alive(o, now)) { o.last = now; return; } // 持续按住（repeat 或丢 keyup 后的再次 keydown）
    this.s.set(d, { first: now, last: now, up: null, order: ++this.n });
  }
  up(d: number, now: number) { const o = this.s.get(d); if (o && o.up === null) o.up = now; }
  private alive(o: DirState, now: number) {
    if (now - o.first < this.cfg.minTapMs) return true;
    if (o.up !== null) return false;
    return now - o.first < this.cfg.graceMs || now - o.last < this.cfg.watchdogMs;
  }
  dir(now: number): -1 | 0 | 1 {
    let best: [number, number] | null = null;
    for (const [d, o] of this.s) { if (!this.alive(o, now)) { this.s.delete(d); continue; } if (!best || o.order > best[1]) best = [d, o.order]; }
    return (best ? Math.sign(best[0]) : 0) as -1 | 0 | 1;
  }
  reset() { this.s.clear(); }
}
