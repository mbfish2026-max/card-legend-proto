/**
 * feat/exp-scroll：屏幕上的「5 倍经验」小图标 + 倒计时（DOM 浮层，电脑/手机共用）。
 * - 电脑：游戏坐标 EXP_BADGE（挂机按钮左侧，不压药水栏/菜单钮/灵符/挂机），按画布缩放换算成 CSS。
 * - 手机：放在 #mh-hang（挂机）左侧 8px、同一行、高 44（点击区 ≥44×44）；位于屏幕右半，不进浮动摇杆的左半屏触发区，
 *   且是 DOM 元素（事件目标不是画布），浮动摇杆本身也不会响应。
 * - 悬停（电脑）/点按（手机）显示说明；到期时屏幕中上方提示 3 秒。只在显示文本变化时改 DOM。
 */
import { fmtLeft } from '../shop/expScroll';
import { EXP_SCROLL_MUL, EXP_SCROLL_MAX_SEC } from '../shop/catalog';
/** 电脑版位置（游戏坐标 1280×720）：挂机按钮 HANG_BTN(1226,546,88×44) 左边留 8px */
export const EXP_BADGE = { x: 1124, y: 546, w: 100, h: 44 };
export const EXP_BADGE_ICON = 'assets/icons/shop_exp_scroll.png';
const CSS = `#exp-badge{position:fixed;z-index:30;display:none;box-sizing:border-box;align-items:center;gap:4px;padding:0 6px;background:rgba(30,18,6,.82);border:2px solid #d4a64a;border-radius:6px;color:#ffe070;font:bold 13px/1 sans-serif;cursor:help;user-select:none;-webkit-user-select:none;touch-action:manipulation;white-space:nowrap}
#exp-badge img{width:24px;height:24px;flex:none;pointer-events:none}#exp-badge .t{display:flex;flex-direction:column;gap:2px;pointer-events:none}#exp-badge .m{color:#7fff7f;font-size:12px}
#exp-badge.low{border-color:#ff7040}#exp-badge.low .c{color:#ff9060}
#exp-tip{position:fixed;z-index:31;display:none;max-width:240px;padding:6px 8px;background:rgba(10,8,4,.94);border:1px solid #d4a64a;border-radius:4px;color:#eee;font:12px/1.5 sans-serif;pointer-events:none;white-space:normal}
#exp-end{position:fixed;z-index:32;left:50%;top:18%;transform:translateX(-50%);display:none;padding:8px 16px;background:rgba(20,10,4,.9);border:2px solid #d4a64a;border-radius:6px;color:#ffe070;font:bold 15px sans-serif;pointer-events:none}`;
export class ExpScrollBadge {
  el: HTMLDivElement; tip: HTMLDivElement; end: HTMLDivElement; private c: HTMLElement; private sig = ''; private last = 0; private tipOn = false; private endT = 0;
  constructor(private canvas: () => HTMLCanvasElement) {
    if (!document.getElementById('exp-badge-css')) { const st = document.createElement('style'); st.id = 'exp-badge-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.el = document.createElement('div'); this.el.id = 'exp-badge';
    this.el.innerHTML = `<img src="${EXP_BADGE_ICON}" alt=""><span class="t"><span class="m">经验×${EXP_SCROLL_MUL}</span><span class="c"></span></span>`;
    this.c = this.el.querySelector('.c')!;
    this.tip = document.createElement('div'); this.tip.id = 'exp-tip'; this.end = document.createElement('div'); this.end.id = 'exp-end';
    document.body.append(this.el, this.tip, this.end);
    this.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') this.showTip(true); });
    this.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') this.showTip(false); });
    this.el.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.pointerType !== 'mouse') this.showTip(!this.tipOn); });
  }
  private showTip(v: boolean) {
    this.tipOn = v; this.tip.style.display = v ? 'block' : 'none'; if (!v) return;
    this.tip.innerHTML = `<b style="color:#ffe070">5倍经验卷轴</b><br>击杀经验 ×${EXP_SCROLL_MUL}（只乘击杀经验，任务奖励不乘）<br>剩余 ${this.c.textContent}（在线游戏时间，暂停/打开面板/关页面不计时）<br>可续用累加，上限 ${EXP_SCROLL_MAX_SEC / 3600} 小时`;
    const r = this.el.getBoundingClientRect(), tw = this.tip.offsetWidth, th = this.tip.offsetHeight;
    this.tip.style.left = Math.max(4, Math.min(innerWidth - tw - 4, r.right - tw)) + 'px'; this.tip.style.top = Math.max(4, r.top - th - 6) + 'px';
  }
  /** 每帧调用：left 秒；hidden = 面板打开/手机 HUD 隐藏等 */
  update(left: number, hidden: boolean, now = performance.now()) {
    if (this.last > 0 && left <= 0) { this.end.textContent = '5倍经验效果已结束'; this.end.style.display = 'block'; this.endT = now + 3000; }
    this.last = left;
    if (this.endT && now > this.endT) { this.endT = 0; this.end.style.display = 'none'; }
    const hang = document.getElementById('mh-hang'), mob = !!hang && hang.isConnected; // 手机 HUD 存在 = 手机布局；HUD 隐藏（面板打开）时一并隐藏
    const show = left > 0 && !hidden && (!mob || hang!.offsetParent !== null), txt = show ? fmtLeft(left) : '';
    let pos = '';
    if (show) {
      if (mob) { const r = hang!.getBoundingClientRect(); pos = `m${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.height)}`; }
      else { const r = this.canvas().getBoundingClientRect(), k = r.width / 1280; pos = `d${Math.round(r.left)},${Math.round(r.top)},${k.toFixed(3)}`; }
    }
    const sig = `${show}|${txt}|${pos}`; if (sig === this.sig) return; this.sig = sig;
    this.el.style.display = show ? 'flex' : 'none'; if (!show) { this.showTip(false); return; }
    this.c.textContent = txt; this.el.classList.toggle('low', left < 300);
    if (mob) {
      const r = hang!.getBoundingClientRect(), w = 92, h = Math.max(44, r.height);
      Object.assign(this.el.style, { left: (r.left - 8 - w) + 'px', top: r.top + 'px', width: w + 'px', height: h + 'px', transform: '' });
    } else {
      const r = this.canvas().getBoundingClientRect(), k = r.width / 1280, b = EXP_BADGE;
      Object.assign(this.el.style, { left: (r.left + (b.x - b.w / 2) * k) + 'px', top: (r.top + (b.y - b.h / 2) * k) + 'px', width: b.w + 'px', height: b.h + 'px', transform: `scale(${k})`, transformOrigin: '0 0' });
    }
    if (this.tipOn) this.showTip(true);
  }
  destroy() { this.el.remove(); this.tip.remove(); this.end.remove(); }
}
