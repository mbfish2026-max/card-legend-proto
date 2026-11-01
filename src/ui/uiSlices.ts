/**
 * B0 UI 图集管线：九宫格工厂（docs/ui-art-integration.md §0）。
 * - 边距只从 src/data/ui-slices.ts 读（由 scripts/pack-ui-atlas.py 从美术 slices.json 生成），代码不写死。
 * - 改尺寸只用 setSize，禁止 setScale（会把角一起放大）。
 * - 图集未加载/加载失败时 ns() 返回 null，调用方必须退回原有代码绘制。
 */
import SLICES from '../data/ui-slices';

export const UI_ATLAS = 'ui_atlas';
export const UI_ATLAS_PNG = 'assets/ui/ui_atlas.png';
export const UI_ATLAS_JSON = 'assets/ui/ui_atlas.json';
export interface SliceDef { w: number; h: number; left: number; right: number; top: number; bottom: number; /** 固定尺寸图（不拉伸） */ fixed?: boolean; /** 手机 DOM 有 2x 图 public/assets/ui/dom/<名>@2x.png */ dom?: boolean }
export const UI_SLICES: Record<string, SliceDef> = SLICES as unknown as Record<string, SliceDef>;

/** 最小可点击高度：桌面 44 逻辑 px；手机按显示缩放折算，物理不低于 36 px */
export const MIN_TAP = 44, MIN_TAP_MOBILE_PHYS = 36;
/** cssPerLogical：每逻辑像素对应的 CSS 像素（Phaser scale.displayScale.y 的倒数）。返回逻辑像素 */
export function minTapHeight(mobile: boolean, cssPerLogical: number): number {
  return mobile ? MIN_TAP_MOBILE_PHYS / Math.max(cssPerLogical, 0.01) : MIN_TAP;
}

type TexHost = { textures: { exists(k: string): boolean; get?(k: string): { has(f: string): boolean } } };
/** 图集与帧都存在才算可用（失败回退的唯一判断点） */
export function atlasReady(s: TexHost, frame?: string): boolean {
  if (!s.textures.exists(UI_ATLAS)) return false;
  if (!frame) return true;
  const t = s.textures.get?.(UI_ATLAS); return !t || t.has(frame);
}

/** 九宫格：(x,y) 为中心；不可用时返回 null */
export function ns(s: Phaser.Scene, frame: string, x: number, y: number, w: number, h: number): Phaser.GameObjects.NineSlice | null {
  const d = UI_SLICES[frame]; if (!d || !atlasReady(s, frame)) return null;
  const o = s.add.nineslice(x, y, UI_ATLAS, frame, w, h, d.left, d.right, d.top, d.bottom);
  return o;
}
/** 切换状态帧并保持尺寸（setTexture 会把尺寸重置为帧尺寸，这里用 setSlices 复原；不碰 scale） */
export function nsFrame(o: Phaser.GameObjects.NineSlice, frame: string) {
  const d = UI_SLICES[frame]; if (!d || !o.scene || o.frame?.name === frame) return;
  const w = o.width, h = o.height; o.setTexture(UI_ATLAS, frame); o.setSlices(w, h, d.left, d.right, d.top, d.bottom); o.setSize(w, h);
}

/** 手机 DOM 2x 图路径（B6 使用；构建版经 assetUrl 映射为无损 webp） */
export const domUrl = (name: string) => `assets/ui/dom/${name}@2x.png`;

/** B2 面板/弹窗/提示框底：有图集用九宫格 frame（只 setSize），否则（或尺寸小于边距和）退回原矩形 fb。
 *  ox/oy 为原点（与原 rectangle 的 setOrigin 一致）。返回的对象可照常 setInteractive / setName / setDepth */
export interface RectFallback { fill: number; alpha?: number; stroke?: number; sw?: number; strokeAlpha?: number }
export function frameBg(s: Phaser.Scene, frame: string, x: number, y: number, w: number, h: number, fb: RectFallback, ox = 0.5, oy = 0.5): Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle {
  const d = UI_SLICES[frame];
  const o = d && w >= d.left + d.right && h >= d.top + d.bottom ? ns(s, frame, x, y, w, h) : null;
  if (o) return o.setOrigin(ox, oy);
  const r = s.add.rectangle(x, y, w, h, fb.fill, fb.alpha ?? 1).setOrigin(ox, oy);
  if (fb.stroke !== undefined) r.setStrokeStyle(fb.sw ?? 1, fb.stroke, fb.strokeAlpha ?? 1);
  return r;
}

/** 手机列表行：行高不低于 44 CSS px；行内按钮点击区 ≥36 CSS px 且不超过行距（相邻行不重叠）。
 *  cssPerUnit = 每个面板坐标单位对应的 CSS 像素（视口缩放 × 面板容器缩放） */
export const MOBILE_ROW_CSS = 44;
export function listRowPitch(mobile: boolean, base: number, cssPerUnit: number): number {
  return mobile ? Math.max(base, Math.ceil(MOBILE_ROW_CSS / Math.max(cssPerUnit, 0.01))) : base;
}
export function rowHitHeight(mobile: boolean, btnH: number, pitch: number, cssPerUnit: number): number {
  const want = mobile ? Math.max(btnH, MIN_TAP_MOBILE_PHYS / Math.max(cssPerUnit, 0.01)) : Math.max(btnH, MIN_TAP);
  return Math.min(want, pitch);
}
/** 视口 CSS px / 逻辑 px（手机 FIT：逻辑 lw×720） */
export function viewCss(lw: number): number {
  return typeof window !== 'undefined' ? Math.min(window.innerHeight / 720, window.innerWidth / (lw || 1280)) || 1 : 1;
}

/** B3 列表行底：list_row / list_row_sel 九宫格（高度 < 20 或无图集时退回原矩形 fb） */
export function rowBg(s: Phaser.Scene, x: number, y: number, w: number, h: number, sel: boolean, fb: RectFallback) {
  return frameBg(s, sel ? 'list_row_sel' : 'list_row', x, y, w, h, fb);
}
/** B3 滚动条：轨道 scroll_track + 滑块 scroll_thumb（宽 w，上下边距 8；滑块太短或无图集时退回原矩形）。trackY 为轨道顶，th 为 thumb() 结果 */
export const SCROLL_W = 8;
export function scrollBar(s: Phaser.Scene, x: number, trackY: number, trackH: number, th: { y: number; h: number }, w = SCROLL_W) {
  const track = frameBg(s, 'scroll_track', x, trackY + trackH / 2, w, trackH, { fill: 0x332a1c }).setName('scrollTrack');
  const thumb = frameBg(s, 'scroll_thumb', x, trackY + th.y + th.h / 2, w, th.h, { fill: 0xd4a64a }).setName('scrollThumb');
  return [track, thumb] as const;
}
