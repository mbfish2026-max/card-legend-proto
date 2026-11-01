// 手机版：装备对比面板（身上/查看中）点面板外空白处关闭。纯逻辑，界面接线在 Panel（feat/mobile-tapclose）。
// 规则：移动 >8px 视为拖动/滚动不算点击；点面板内部不关；点到装备格交给格子自己处理（切换查看/再点执行）。
export const TAP_SLOP = 8;
export interface TapInfo { downX: number; downY: number; upX: number; upY: number; insidePanel: boolean; onSlot: boolean }
export function isTap(t: Pick<TapInfo, 'downX' | 'downY' | 'upX' | 'upY'>): boolean { return Math.hypot(t.upX - t.downX, t.upY - t.downY) <= TAP_SLOP; }
/** true = 应关闭对比面板 */
export function shouldTapClose(t: TapInfo, mobile: boolean, open: boolean): boolean {
  return mobile && open && isTap(t) && !t.insidePanel && !t.onSlot;
}
