/** 手机/触屏检测、自动横屏与竖屏提示（纯 DOM，不依赖 Phaser） */
export function detectMobile(w: Window = window): boolean {
  const q = new URLSearchParams(w.location.search);
  if (q.has('mobile')) return q.get('mobile') !== '0';
  const n = w.navigator, ua = n.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|HarmonyOS|OpenHarmony|MicroMessenger|Windows Phone|webOS|BlackBerry/i.test(ua)) return true;
  const tp = n.maxTouchPoints || 0;
  // iPadOS 13+ 伪装成 Mac
  if (/Macintosh/.test(ua) && tp > 1) return true;
  const touch = tp > 0 || 'ontouchstart' in w;
  const mm = (m: string) => { try { return w.matchMedia?.(m).matches ?? false; } catch { return false; } };
  const coarse = mm('(pointer: coarse)') || mm('(any-pointer: coarse)') && !mm('(pointer: fine)');
  const small = Math.min(w.screen?.width || w.innerWidth, w.screen?.height || w.innerHeight) <= 1024;
  // 手机“桌面版网站”模式 / 国产浏览器桌面 UA：有触屏 + (粗指针 或 小屏) 即视为手机
  return touch && (coarse || small);
}
/** 运行期可变（ES live binding）：首次真实触摸时会自动切到手机模式，防止检测失败导致无按键 */
export let IS_MOBILE = typeof window !== 'undefined' && detectMobile();
function forced() { const q = new URLSearchParams(location.search); return q.has('mobile'); }
export function enableMobileOnTouch() {
  if (IS_MOBILE || forced()) return;
  const on = () => { window.removeEventListener('touchstart', on); if (IS_MOBILE) return; IS_MOBILE = true; (window as any).__mobile = true; setupMobile(); };
  window.addEventListener('touchstart', on, { passive: true });
}

export async function goLandscape(): Promise<boolean> {
  const d: any = document, el: any = document.documentElement;
  try {
    if (!d.fullscreenElement && !d.webkitFullscreenElement) await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
  } catch { /* iOS Safari 不支持全屏 */ }
  try { await (screen.orientation as any)?.lock?.('landscape'); return true; } catch { return false; }
}

/** 竖屏遮罩：提示旋转；点击尝试全屏+锁定横屏（失败则仅提示） */
export function setupMobile() {
  if (!IS_MOBILE || document.getElementById('rotate')) return;
  document.body.classList.add('mobile');
  const ov = document.createElement('div'); ov.id = 'rotate';
  ov.innerHTML = '<div class="phone">📱</div><div class="t1">请把手机横过来</div><div class="t2">点击此处进入全屏横屏</div><div class="t3">iPhone 请关闭“竖排方向锁定”后旋转；可“添加到主屏幕”获得全屏体验</div>';
  document.body.appendChild(ov);
  const portrait = () => window.innerHeight > window.innerWidth;
  const upd = () => ov.classList.toggle('show', portrait());
  ov.addEventListener('click', () => { goLandscape().finally(upd); });
  window.addEventListener('resize', upd); window.addEventListener('orientationchange', () => setTimeout(upd, 200));
  // 首次触摸游戏时也尝试横屏全屏（需用户手势）
  let tried = false;
  document.addEventListener('touchend', () => { if (!tried && !portrait()) { tried = true; goLandscape(); } }, { passive: true });
  // 禁止双指缩放/长按菜单
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());
  upd();
}
