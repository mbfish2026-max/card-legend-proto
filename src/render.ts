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
export const Render = { k: 1, lw: LOGIC_W, ox: 0 };
/** 手机铺满：逻辑高度恒 720，逻辑宽度按可视区宽高比扩展（≥1280，上限 2.8:1，覆盖 iPhone 地址栏展开后的 ~2.45:1）；电脑恒 1280 */
export const MAX_LW = Math.round(LOGIC_H * 2.8);
export function logicWidthFor(cssW: number, cssH: number, mobile: boolean): number {
  if (!mobile || !(cssW > 0 && cssH > 0)) return LOGIC_W;
  return Math.max(LOGIC_W, Math.min(MAX_LW, Math.round(LOGIC_H * cssW / cssH)));
}
/** sf0 物体需要的水平补偿：相机绕画布中心缩放 + 1280 内容在加宽画布里居中（ox） */
export const fixedShiftX = () => (Render.k - 1) * Render.lw / 2 + Render.ox;
/** scrollFactor=0 的屏幕固定物体：相机绕画布中心 (640k,360k) 缩放且 sf0 不做 scroll 补偿，需平移 (k-1)×(640,360) 才落回原屏幕位置 */
export function hdFixed<T extends { x: number; y: number }>(o: T): T { const sx = fixedShiftX(); o.x += sx; o.y += (Render.k - 1) * LOGIC_H / 2; (o as any).__hx = sx; return o; }
/** 屏幕坐标（画布像素）→ 逻辑坐标 */
export const toLogic = (v: number) => v / Render.k;
/** 屏幕 x（画布像素）→ 1280 内容坐标（扣除手机加宽的居中偏移） */
export const toLogicX = (v: number) => v / Render.k - Render.ox;
