// PWA/主屏幕独立模式全屏验证：四边无黑边、逻辑高 720 铺满、HUD 在安全区内、按钮可点；地址栏尺寸无回归；桌面与 main 像素差 ≤0.1%
// 用法：npm run build && node tests/e2e/pwa-fullscreen-verify.mjs [截图目录] [main 的 dist 目录(可选，桌面像素对比)]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots', mainDist = process.argv[3];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SAVE = { v: 1, level: 30, exp: 0, gold: 5000, pots: [5, 2, 5, 2], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'mage', learned: [] };
// [宽, 高, 标签, 选项]
const CASES = [
  [932, 430, 'standalone', { sa: { top: 0, left: 59, right: 59, bottom: 21 } }],
  [852, 393, 'standalone', { sa: { top: 0, left: 59, right: 59, bottom: 21 } }],
  // 用户截图复现：旧设置里手动缩放 0.86（zoomAuto=false）
  [1024, 471, 'standalone-oldzoom', { settings: { zoomAuto: false, zoom: 0.86 } }],
  // 竖屏启动后旋转，visualViewport 停在旧竖屏尺寸（iOS 独立模式已知行为）
  [852, 393, 'standalone-rotate', { rotateFrom: [393, 852], staleVV: true }],
  [844, 345, 'addrbar', {}],
];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
// 四边 8px 条带：纯黑/纯 #111 且无起伏 = 黑边
async function edges(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const W = info.width, H = info.height;
  const band = (x0, y0, w, h) => { const v = []; for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x0 + w; x += 2) { const i = (y * W + x) * 3; v.push((data[i] + data[i + 1] + data[i + 2]) / 3); } const m = v.reduce((a, b) => a + b, 0) / v.length; return { m, sd: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) }; };
  const s = { L: band(0, H * 0.2 | 0, 8, H * 0.6 | 0), R: band(W - 8, H * 0.2 | 0, 8, H * 0.6 | 0), T: band(W * 0.4 | 0, 0, W * 0.2 | 0, 8), B: band(W * 0.4 | 0, H - 8, W * 0.2 | 0, 8) };
  const bar = c => c.m < 20 && c.sd < 1.5; return { s, bad: Object.entries(s).filter(([, c]) => bar(c)).map(([k]) => k) };
}
const sv = await startPreview(), b = await launch();
try {
  const man = JSON.parse(await (await fetch(sv.url + 'manifest.webmanifest')).text());
  chk(man.display === 'fullscreen' && man.display_override?.includes('standalone') && man.orientation === 'landscape' && man.start_url === '/card-legend-proto/' && man.scope === '/card-legend-proto/', 'manifest: fullscreen + standalone 回退 + 横屏 + /card-legend-proto/');
  const html = await (await fetch(sv.url)).text();
  chk(/viewport-fit=cover/.test(html) && /apple-mobile-web-app-capable" content="yes/.test(html) && /black-translucent/.test(html) && /apple-touch-icon[^>]*\/card-legend-proto\/apple-touch-icon\.png/.test(html) && /manifest" href="\/card-legend-proto\/manifest/.test(html), 'index.html: iOS 全屏元数据 + apple-touch-icon + manifest 路径带 base');
  for (const [W, H, tag, o] of CASES) {
    const name = `pwa-${W}x${H}-${tag}`;
    const p = await b.newPage(); await p.setUserAgent(UA); const ww = watch(p);
    const [W0, H0] = o.rotateFrom ?? [W, H];
    await p.setViewport({ width: W0, height: H0, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const c = await p.target().createCDPSession();
    if (tag.startsWith('standalone')) await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'display-mode', value: 'standalone' }] }).catch(() => {});
    if (o.sa) { try { await c.send('Emulation.setSafeAreaInsetsOverride', { insets: o.sa }); } catch (e) { console.log('  (CDP safe-area 不可用，注入变量)'); await p.evaluateOnNewDocument(sa => document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = `#mhud{--sl:${sa.left}px!important;--sr:${sa.right}px!important;--sb:${sa.bottom}px!important}`; document.head.appendChild(st); }), o.sa); } }
    if (o.staleVV) await p.evaluateOnNewDocument((w, h) => { const v = window.visualViewport; Object.defineProperty(v, 'width', { get: () => w }); Object.defineProperty(v, 'height', { get: () => h }); }, W0, H0);
    await p.evaluateOnNewDocument((s, st) => { localStorage.setItem('fcl_save_v1', JSON.stringify(s)); if (st) localStorage.setItem('fcl_settings_v1', JSON.stringify(st)); }, SAVE, o.settings ?? null);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1200);
    if (o.rotateFrom) { await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await p.evaluate(() => window.dispatchEvent(new Event('orientationchange'))); await sleep(2500); }
    const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(2000);
    const st = await p.evaluate(() => { const r = window.__game.canvas.getBoundingClientRect(), B = window.__game.scene.getScene('Battle').cameras.main; return { l: r.left, r: r.right, t: r.top, b: r.bottom, lw: window.__render.lw, cw: B.worldView.width, ch: B.worldView.height, tf: window.__game.canvas.style.transform }; });
    chk(st.l <= 1 && st.r >= W - 1 && st.t <= 1 && st.b >= H - 1, `${name} 画布铺到物理屏幕四边 (${st.l.toFixed(0)},${st.t.toFixed(0)})-(${st.r.toFixed(0)},${st.b.toFixed(0)}) transform='${st.tf}'`);
    const want = Math.min(2016, Math.round(720 * W / H)); chk(Math.abs(st.lw - want) <= 1 && Math.abs(st.ch - 720) <= 1, `${name} 逻辑 ${st.lw}×720（期望 ${want}）`);
    const png = `${dir}/${name}.png`; await p.screenshot({ path: png });
    // 四角/四边中点命中的元素必须是画布或 HUD（不是 body/#game 背景 = 无黑边）；边缘像素亮度仅供记录（场景本身偏暗）
    const hit = await p.evaluate((W, H) => [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2], [W / 2, 1], [W / 2, H - 2], [1, H / 2], [W - 2, H / 2]].map(([x, y]) => { const e = document.elementFromPoint(x, y); return e?.tagName === 'CANVAS' || !!e?.closest?.('#mhud,#mh-joy') ? '' : (e?.id || e?.tagName); }).filter(Boolean), W, H);
    const e = await edges(png); chk(!hit.length, `${name} 四角/四边全是画布（无背景露出 ${hit.join(',')}）边缘亮度 ${Object.entries(e.s).map(([k, v]) => k + v.m.toFixed(0)).join(' ')}`);
    const sa = o.sa ?? { top: 0, left: 0, right: 0, bottom: 0 };
    const g = await p.evaluate(() => Array.from(document.querySelectorAll('#mhud .b, #mh-joy .hint')).filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { x: r.left, r: r.right, b: r.bottom, t: r.top }; }));
    chk(g.length > 3 && g.every(q => q.x >= sa.left - 0.5 && q.r <= W - sa.right + 0.5 && q.b <= H - sa.bottom + 0.5 && q.t >= sa.top - 0.5), `${name} HUD ${g.length} 个按钮在安全区内`);
    // 按钮可点：点顶栏第一个图标（角色）→ 面板打开
    const btn = await p.evaluate(() => { const e = Array.from(document.querySelectorAll('#mhud .b')).find(e => /角色/.test(e.textContent || '')); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    if (btn) { await p.touchscreen.tap(btn.x, btn.y); await sleep(700); const open = await p.evaluate(() => !!window.__game.scene.getScene('UI').panel); chk(open, `${name} 点「角色」按钮打开面板`); await p.screenshot({ path: `${dir}/${name}-panel.png` }); }
    else chk(false, `${name} 找不到「角色」按钮`);
    chk(ww.errs.length === 0, `${name} 无报错 ${ww.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
  // 桌面 1280×720：与 main 像素差 ≤0.1%
  const shot = async (url, path) => { const ctx = await (b.createBrowserContext?.() ?? b.createIncognitoBrowserContext()); const p = await ctx.newPage(); await p.setViewport({ width: 1280, height: 720 }); await p.evaluateOnNewDocument(() => { Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); }); await p.goto(url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await p.waitForFunction(() => !window.__game.scene.getScene('Preload')?.sys.isActive(), { timeout: 60000 }).catch(() => {}); await sleep(4000); await p.evaluate(() => { const g = window.__game; g.loop.sleep(); for (const sc of g.scene.getScenes(true)) { sc.tweens?.killAll?.(); sc.children.list.forEach(o => o.setAlpha?.(1)); } g.loop.wake(); g.loop.step(performance.now()); g.loop.sleep(); }); await sleep(300); await p.screenshot({ path }); const lw = await p.evaluate(() => window.__render.lw); await ctx.close(); return lw; };
  const lw = await shot(sv.url, `${dir}/pwa-desktop-1280x720.png`); chk(lw === 1280, '桌面逻辑宽 1280');
  if (mainDist) { const sm = await startPreview({ root: mainDist }); try { await shot(sm.url, `${dir}/pwa-desktop-1280x720-main.png`); } finally { sm.stop(); }
    const A = await sharp(`${dir}/pwa-desktop-1280x720.png`).removeAlpha().raw().toBuffer(), B = await sharp(`${dir}/pwa-desktop-1280x720-main.png`).removeAlpha().raw().toBuffer();
    let d = 0; for (let i = 0; i < A.length; i += 3) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 30) d++;
    const pct = d / (A.length / 3) * 100; chk(pct <= 0.1, `桌面 1280×720 与 main 像素差 ${pct.toFixed(3)}% ≤0.1%`); }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
