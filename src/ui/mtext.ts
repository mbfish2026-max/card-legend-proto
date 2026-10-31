import { txt as txt0, button as button0 } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
/** 手机：面板字号下限（面板再整体放大 1.2~1.28 倍 → 375~390px 高屏幕约 ≥12px）；电脑原样不变 */
export const MOBILE_MIN_FONT = 18;
const fs = (n: number, min: number) => IS_MOBILE ? Math.max(n, min) : n;
export const txtMin = (min: number): typeof txt0 => (s, x, y, t, size, color, extra) => txt0(s, x, y, t, fs(size, min), color, extra);
export const buttonMin = (min: number): typeof button0 => (s, x, y, w, h, label, fn, size = 22, en = true) => button0(s, x, y, w, h, label, fn, fs(size, min), en);
export const txt = txtMin(MOBILE_MIN_FONT), button = buttonMin(MOBILE_MIN_FONT);
