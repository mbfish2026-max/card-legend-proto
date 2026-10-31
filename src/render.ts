// 渲染分辨率（画质）：逻辑坐标恒为 1280×720，只把画布像素放大 k 倍，再用相机 zoom=k 映射回逻辑坐标
export type ResId = 'auto' | '720' | '1080' | '1440';
export const RES_OPTIONS: { id: Exclude<ResId, 'auto'>; k: number; label: string }[] = [
  { id: '720', k: 1, label: '720p' }, { id: '1080', k: 1.5, label: '1080p' }, { id: '1440', k: 2, label: '2K' },
];
export const LOGIC_W = 1280, LOGIC_H = 720;
export const isResId = (v: unknown): v is ResId => v === 'auto' || RES_OPTIONS.some(r => r.id === v);
/** 自动：按 CSS 实际显示宽度 × devicePixelRatio 选最小够用档；手机最高 1080p（性能） */
export function resolveResK(res: ResId | string | null | undefined, dpr: number, cssW: number, cssH: number, mobile: boolean): number {
  const o = RES_OPTIONS.find(r => r.id === res); if (o) return o.k;
  const fitW = Math.min(cssW, cssH * 16 / 9) * (dpr > 0 ? dpr : 1);
  const pick = RES_OPTIONS.find(r => LOGIC_W * r.k >= fitW * 0.95) ?? RES_OPTIONS[RES_OPTIONS.length - 1];
  return mobile ? Math.min(pick.k, 1.5) : pick.k;
}
/** 启动时确定，切换后重载页面生效 */
export const Render = { k: 1 };
/** scrollFactor=0 的屏幕固定物体：相机绕画布中心 (640k,360k) 缩放且 sf0 不做 scroll 补偿，需平移 (k-1)×(640,360) 才落回原屏幕位置 */
export function hdFixed<T extends { x: number; y: number }>(o: T): T { if (Render.k !== 1) { o.x += (Render.k - 1) * LOGIC_W / 2; o.y += (Render.k - 1) * LOGIC_H / 2; } return o; }
/** 屏幕坐标（画布像素）→ 逻辑坐标 */
export const toLogic = (v: number) => v / Render.k;
