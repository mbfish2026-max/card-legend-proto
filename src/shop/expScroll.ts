/**
 * 5 倍经验卷轴（灵符商城）：纯函数 + 使用入口。计时 = World.expScrollLeft（秒，在线游戏时间，World.step 里扣）。
 * 设计见 docs/exp-scroll.md。倍率只乘「击杀经验」（World 击杀结算处读 getExpMultiplier()）。
 */
import type { World } from '../combat/World';
import { EXP_SCROLL_MUL, EXP_SCROLL_SEC, EXP_SCROLL_MAX_SEC } from './catalog';

/** 当前倍率：剩余 >0 → ×5，否则 ×1。重复使用不叠倍率 */
export const expScrollMult = (left: number) => left > 0 ? EXP_SCROLL_MUL : 1;
/** 扣减（dt 秒）；返回 [新剩余, 是否本次到期] */
export function tickExpScroll(left: number, dt: number): [number, boolean] {
  if (!(left > 0) || !(dt > 0)) return [Math.max(0, left || 0), false];
  const n = Math.max(0, left - dt); return [n, n === 0];
}
/** 续时：剩余 + 2h；若会超过上限 8h 则拒绝（不浪费卷轴） */
export function extendExpScroll(left: number): { ok: boolean; left: number } {
  const cur = Math.max(0, left || 0);
  if (cur + EXP_SCROLL_SEC > EXP_SCROLL_MAX_SEC) return { ok: false, left: cur };
  return { ok: true, left: cur + EXP_SCROLL_SEC };
}
/** 存档读：非法/缺省 → 0（无增益），超上限钳到上限 */
export const loadExpScroll = (v: unknown) => typeof v === 'number' && isFinite(v) && v > 0 ? Math.min(EXP_SCROLL_MAX_SEC, v) : 0;
/** 倒计时文本：≥1h → h:mm:ss，否则 mm:ss（向上取整秒） */
export function fmtLeft(sec: number): string {
  const s = Math.max(0, Math.ceil(sec)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`;
}
export function useExpScroll(w: World, bagIdx: number): { ok: boolean; msg: string } {
  const it = w.bag[bagIdx]; if (!it || it.item !== 'exp_scroll') return { ok: false, msg: '无此物品' };
  const r = extendExpScroll(w.expScrollLeft);
  if (!r.ok) return { ok: false, msg: `剩余时间已超过 ${(EXP_SCROLL_MAX_SEC - EXP_SCROLL_SEC) / 3600} 小时，续用会超过上限 ${EXP_SCROLL_MAX_SEC / 3600} 小时（未消耗）` };
  const was = w.expScrollLeft > 0; w.expScrollLeft = r.left;
  w.bag.splice(bagIdx, 1); w.events.push({ type: 'inventory' });
  return { ok: true, msg: `${was ? '续用' : '使用'} 5倍经验卷轴：击杀经验 ×${EXP_SCROLL_MUL}，剩余 ${fmtLeft(r.left)}` };
}
