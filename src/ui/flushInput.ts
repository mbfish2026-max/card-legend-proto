/** feat/potion-expand：把本帧 setInteractive 的新对象立即并入 Phaser 命中表（Phaser 3.90 默认等下一帧 preUpdate 才并入，
 *  DOM 触摸事件是即时处理的——重绘后到下一帧之间的点击会落空，卡顿时窗口更长：手机双击解包偶发失败的根因）。
 *  只做 InputPlugin.preUpdate 的列表合并部分，不发 PRE_UPDATE 事件。 */
export function flushInput(s: { input?: unknown }) {
  const ip = s.input as any; if (!ip?._pendingInsertion) return;
  const rm: any[] = ip._pendingRemoval, ins: any[] = ip._pendingInsertion; if (!rm.length && !ins.length) return;
  const cur: any[] = ip._list;
  for (const g of rm) { const k = cur.indexOf(g); if (k > -1) { cur.splice(k, 1); ip.clear(g, true); } }
  rm.length = 0; ip._list = cur.concat(ins.splice(0));
}
