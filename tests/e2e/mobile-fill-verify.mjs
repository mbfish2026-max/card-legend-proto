// 手机铺满验证：画布铺满可视区（含地址栏占用后的实际高度）、两侧无黑边、逻辑宽按宽高比扩展、刘海 safe-area
// 用法：npm run build && node tests/e2e/mobile-fill-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import sharp from 'sharp';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SAVE = { v: 1, level: 30, exp: 0, gold: 5000, pots: [5, 2, 5, 2], floorIndex: 3, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'mage', learned: [] };
// [宽, 高, 标签, safe-area]；844×345 / 932×380 = iPhone 横屏地址栏展开后的实际可视高度
const VPS = [[932, 430, ''], [844, 390, ''], [1024, 470, ''], [667, 375, ''], [844, 345, 'addrbar'], [932, 380, 'addrbar'], [844, 390, 'notch', { top: 0, left: 47, right: 47, bottom: 21 }]];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
// 左/右边缘 12px 列的平均亮度（黑边 #111 ≈ 17）
async function edges(png, W, H) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // 返回 {m 均值, sd 标准差}；纯黑边 = 均值≈17 且几乎无起伏
  const col = (x0) => { const v = []; for (let y = Math.floor(info.height * 0.1); y < info.height * 0.9; y += 2) for (let x = x0; x < x0 + 12; x++) { const i = (y * info.width + x) * 3; v.push((data[i] + data[i + 1] + data[i + 2]) / 3); }
    const m = v.reduce((a, b) => a + b, 0) / v.length; return { m, sd: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) }; };
  const bar = c => Math.abs(c.m - 17) < 3 && c.sd < 2;
  const l = col(0), r = col(info.width - 12); return { l: l.m, r: r.m, ok: !bar(l) && !bar(r), sd: [l.sd, r.sd] };
}
const sv = await startPreview(), b = await launch();
try {
  for (const [W, H, tag, sa] of VPS) {
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const ww = watch(p);
    if (sa) { const c = await p.target().createCDPSession(); try { await c.send('Emulation.setSafeAreaInsetsOverride', { insets: sa }); } catch (e) { console.log('  (CDP safe-area 不可用，注入 CSS 模拟)', e.message); await p.evaluateOnNewDocument(sa => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = `#mhud{--sl:${sa.left}px!important;--sr:${sa.right}px!important;--sb:${sa.bottom}px!important}`; document.head.appendChild(st); }); }, sa); } }
    await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), SAVE);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const name = `mf-${W}x${H}${tag ? '-' + tag : ''}`;
    await p.screenshot({ path: `${dir}/${name}-title.png` });
    const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(2000);
    const st = await p.evaluate(() => { const r = window.__game.canvas.getBoundingClientRect(), B = window.__game.scene.getScene('Battle').cameras.main;
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, lw: window.__render.lw, cw: B.worldView.width, ch: B.worldView.height }; });
    chk(st.l <= 1 && st.r >= W - 1 && st.t <= 1 && st.b >= H - 1, `${name} 画布铺满 (${st.l.toFixed(0)},${st.t.toFixed(0)})-(${st.r.toFixed(0)},${st.b.toFixed(0)})`);
    const want = Math.min(2016, Math.round(720 * W / H));
    chk(Math.abs(st.lw - want) <= 1 && Math.abs(st.cw - st.lw) <= 1 && Math.abs(st.ch - 720) <= 1, `${name} 逻辑 ${st.lw}×720（期望 ${want}），战斗相机可视 ${st.cw.toFixed(0)}×${st.ch.toFixed(0)}`);
    const sx = (st.r - st.l) / st.lw, sy = (st.b - st.t) / 720; chk(Math.abs(sx - sy) / sy < 0.01, `${name} 等比不变形 sx=${sx.toFixed(3)} sy=${sy.toFixed(3)}`);
    const png = `${dir}/${name}.png`; await p.screenshot({ path: png });
    const e = await edges(png, W, H); chk(e.ok, `${name} 两侧非纯色黑边（边缘均值 L=${e.l.toFixed(0)} R=${e.r.toFixed(0)}，起伏 ${e.sd.map(x => x.toFixed(1)).join('/')}）`);
    if (sa) { const g = await p.evaluate(() => Array.from(document.querySelectorAll('#mhud .b, #mh-joy .hint')).filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { x: r.left, r: r.right }; }));
      chk(g.every(o => o.x >= sa.left - 0.5 && o.r <= W - sa.right + 0.5), `${name} HUD 按钮全部避开左右刘海 ${sa.left}/${sa.right}px`); }
    // 打开面板：居中
    await p.evaluate(() => window.__game.scene.getScene('Battle').onKey?.('C')); await sleep(800);
    await p.screenshot({ path: `${dir}/${name}-panel.png` }); await p.evaluate(() => window.__game.scene.getScene('UI').panel?.close?.());
    // 地址栏收起：动态改视口 → 实时重算
    if (tag === 'addrbar') { await p.setViewport({ width: W, height: H + 45, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await sleep(900);
      const s2 = await p.evaluate(() => ({ R: JSON.stringify(window.__game.canvas.getBoundingClientRect()) + innerHeight + "/" + window.visualViewport?.height + "/" + document.getElementById("game").clientHeight, lw: window.__render.lw, b: window.__game.canvas.getBoundingClientRect().bottom, cw: window.__game.scene.getScene('Battle').cameras.main.worldView.width }));
      chk(Math.abs(s2.lw - Math.round(720 * W / (H + 45))) <= 1 && s2.b >= H + 44 && Math.abs(s2.cw - s2.lw) <= 1, `${name} 地址栏收起→${W}×${H + 45} 实时重排 逻辑宽 ${s2.lw} 底 ${s2.b} ${s2.R} 相机 ${s2.cw}`);
      await p.screenshot({ path: `${dir}/${name}-collapsed.png` }); }
    chk(ww.errs.length === 0, `${name} 无报错 ${ww.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
  // 电脑：逻辑宽保持 1280
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 });
  const d = await p.evaluate(() => ({ lw: window.__render.lw, w: window.__game.scale.width })); chk(d.lw === 1280 && d.w % 1280 === 0, `电脑逻辑宽保持 1280（画布 ${d.w}）`); await p.close();
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
