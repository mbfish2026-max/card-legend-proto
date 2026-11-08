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

/**
 * 文字工厂读取的「即将套上的父容器缩放」。
 * 手机面板会先把整页放大（约 1.2–1.28），若文字仍按相机 zoom 栅格化，放大时就是在拉一张偏小的纹理。
 * 只在构建这块 UI 期间抬高，结束必须改回 1。
 */
export let uiTextScale = 1;
export function setUiTextScale(v: number) { uiTextScale = v > 0 ? v : 1; }
/** 单张文字纹理的 resolution 上限。2–3x 屏上再高几乎看不出，面积却按平方涨。 */
export const TEXT_RES_MAX = 3;

/** 画布 backing 被浏览器放大到设备像素的倍数。画布已经比屏幕更细时返回值 < 1。 */
function canvasToDevice(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
  try {
    const canvas = document.querySelector('#game canvas') as HTMLCanvasElement | null;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const r = canvas.getBoundingClientRect();
      const sx = r.width > 0 ? (r.width * dpr) / canvas.width : 0;
      const sy = r.height > 0 ? (r.height * dpr) / canvas.height : 0;
      const b = Math.max(sx, sy);
      if (b > 0) return b;
    }
  } catch { /* 无 DOM */ }
  const cssH = window.innerHeight || 0;
  const k = Render.k > 0 ? Render.k : 1;
  return cssH > 0 ? (cssH * dpr) / (LOGIC_H * k) : 1;
}

/**
 * Phaser Text.resolution：内部画布像素 / 对象本地尺寸。
 * 相机 zoom=k 且父容器缩放为 parentScale 时，要让纹理像素贴近设备像素：
 * resolution = parentScale × k × max(画布→设备放大, 1)。
 * 画布短于屏幕时，多出来的倍率是画进画布之前的超采样，浏览器再放大边缘更干净；不加大整张 framebuffer。
 * 画布已经细过屏幕（boost<1）时不再加码，避免无谓的纹理。
 */
export function textResolution(parentScale = 1): number {
  const k = Render.k > 0 ? Render.k : 1;
  const ps = parentScale > 0 ? parentScale : 1;
  let res = ps * k * Math.max(canvasToDevice(), 1);
  if (!(res > 1.01)) return 1;
  res = Math.min(TEXT_RES_MAX, Math.round(res * 100) / 100);
  return res < 1 ? 1 : res;
}
