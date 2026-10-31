/** 长列表滚动（纯计算，供 Panel 和测试共用）。列表按「行」滚动：只画可视窗口内的行，隐藏行不存在 → 不会被误点。 */
export const SCROLL_TAP_PX = 8; // 拖动超过这个逻辑像素就算滚动，不触发按钮
export const scrollMax = (n: number, vis: number) => Math.max(0, n - vis);
export const clampOff = (off: number, n: number, vis: number) => Math.max(0, Math.min(scrollMax(n, vis), Math.round(off)));
/** 可视窗口 [a, b) */
export const visibleRange = (off: number, n: number, vis: number): [number, number] => { const a = clampOff(off, n, vis); return [a, Math.min(n, a + vis)]; };
/** 拖动累计 dy（逻辑像素，向上拖为负）→ 新偏移 */
export const dragOff = (off0: number, dy: number, rowH: number, n: number, vis: number) => clampOff(off0 - dy / rowH, n, vis);
/** 滚轮：一格 1 行 */
export const wheelOff = (off: number, dy: number, n: number, vis: number) => clampOff(off + Math.sign(dy), n, vis);
export const isTap = (moved: number) => moved <= SCROLL_TAP_PX;
/** 滚动条滑块：轨道高 trackH 内的 y 偏移与高度 */
export const thumb = (off: number, n: number, vis: number, trackH: number) => {
  if (n <= vis) return { y: 0, h: trackH };
  const h = Math.max(20, trackH * vis / n); return { y: (trackH - h) * clampOff(off, n, vis) / scrollMax(n, vis), h };
};
