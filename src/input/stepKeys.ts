/** 左右“一按一格”键盘识别：兼容远程控制（向日葵/ToDesk/RDP/VNC）下 keyup 丢失、repeat 误标、code 为空等情况 */
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
