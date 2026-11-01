// B6：手机 DOM HUD border-image 皮肤。844×390 / 932×430 触屏 × 有图 / 拦图（回退纯 CSS）；各按钮按下态；1280×720 桌面不建 DOM HUD。截图 docs/shots/ui-art/b06/
// 用法：npm run build && node tests/e2e/ui-dom-verify.mjs
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b06/', import.meta.url).pathname;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['thrust', 'half_moon', 'slaying', 'fire_sword'] };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
const N = ['btn_normal', 'btn_pressed', 'bar_frame', 'bar_fill_hp', 'bar_fill_mp', 'bar_fill_exp', 'touch_round', 'btn_close', 'tooltip_frame', 'panel_frame_s'];
const runs = [['844', { width: 844, height: 390 }], ['932', { width: 932, height: 430 }]];
for (const [tag, vp] of runs) for (const blocked of [false, true]) {
  const name = tag + (blocked ? '-fallback' : ''), srv = await startPreview({ block: u => blocked && /assets\/ui\/dom\//.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  await page.setUserAgent(UA); await page.setViewport({ ...vp, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  { const p = await findPos(page, 'Title', '继'); await page.touchscreen.tap(p.x, p.y); }
  await page.waitForFunction(() => document.getElementById('mhud') && window.__mhudSkin, { timeout: 60000 });
  await page.evaluate(() => window.__mhudSkin); await sleep(1200);
  const st = await page.evaluate(() => { const r = document.getElementById('mhud'), cs = (s, p = null) => { const e = r.querySelector(s); return e ? getComputedStyle(e, p) : null; };
    const hits = window.__mhud.hits().filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map(e => { const bb = e.getBoundingClientRect(); return { id: e.id || e.dataset.id || e.className, w: bb.width, h: bb.height, l: bb.left, t: bb.top, r: bb.right, b: bb.bottom, ptr: getComputedStyle(e).pointerEvents }; });
    return { cls: [...r.classList].filter(c => c.startsWith('sk-')), top: cs('#mh-top .b')?.borderImageSource, topSlice: cs('#mh-top .b')?.borderImageSlice, bar: cs('.mh-bar.hp', '::after')?.borderImageSource,
      barSlice: cs('.mh-bar.hp', '::after')?.borderImageSlice, act: cs('#mh-act')?.backgroundImage, log: cs('#mh-log')?.borderImageSource, hpFill: cs('.mh-bar.hp i')?.backgroundImage, hits, W: innerWidth, H: innerHeight }; });
  if (blocked) {
    ok(st.cls.length === 0, `${name}：图全部被拦 → 无 sk-* class`);
    ok(st.top === 'none' && st.bar === 'none' && !/dom/.test(st.act) && st.log === 'none', `${name}：回退纯 CSS（无 border-image）`);
    ok(/gradient/.test(st.hpFill), `${name}：HP 条回退渐变`);
    ok(w.errs.filter(e => !/404|Failed to load/.test(e)).length === 0, `${name}：无其他报错 ${w.errs.slice(0, 2)}`);
  } else {
    ok(N.every(n => st.cls.includes('sk-' + n)), `${name}：${st.cls.length}/${N.length} 图 onload 后加 class`);
    ok(/btn_normal@2x/.test(st.top) && /^28 32( 28 32)? fill/.test(st.topSlice), `${name}：顶栏 btn_normal slice ${st.topSlice}`);
    ok(/bar_frame@2x/.test(st.bar) && st.barSlice === '12 20', `${name}：条框 bar_frame slice ${st.barSlice}`);
    ok(/touch_round@2x/.test(st.act), `${name}：互动键 touch_round`);
    ok(/tooltip_frame@2x/.test(st.log), `${name}：日志 tooltip_frame`);
    ok(/bar_fill_hp@2x/.test(st.hpFill), `${name}：HP 填充 bar_fill_hp`);
    ok(w.errs.length === 0, `${name}：无报错 ${w.errs.slice(0, 2)}`);
  }
  const small = st.hits.filter(h => h.ptr !== 'none' && (h.w < 36 || h.h < 36));
  ok(!small.length, `${name}：可点控件 ≥36px（共 ${st.hits.length}，最小 ${Math.min(...st.hits.filter(h => h.ptr !== "none").map(h => Math.min(h.w, h.h))).toFixed(0)}）${small.map(h => h.id).join(',')}`);
  const out = st.hits.filter(h => h.l < -1 || h.t < -1 || h.r > st.W + 1 || h.b > st.H + 1);
  ok(!out.length, `${name}：无控件出屏 ${out.map(h => h.id).join(',')}`);
  await page.screenshot({ path: `${OUT}${name}-hud.png` });
  // 按下态：逐个按住截图（pointerdown 后不松开会触发动作，改用 .on 等效态 + :active 计算样式）
  if (!blocked) {
    const ids = await page.evaluate(() => [...document.querySelectorAll('#mhud .b:not(.sk):not(#mh-act):not(#mh-pots>.b)')].filter(e => e.offsetParent).map((e, i) => (e.dataset.pid = 'p' + i)));
    const pr = await page.evaluate(ids => ids.map(id => { const e = document.querySelector(`[data-pid="${id}"]`); const had = e.classList.contains('on'); e.classList.add('on'); const s = getComputedStyle(e).borderImageSource; if (!had) e.classList.remove('on'); return [e.dataset.id || e.id || e.textContent.trim().slice(0, 4), s]; }), ids);
    ok(pr.length > 0 && pr.every(([, s]) => /btn_pressed@2x/.test(s)), `${name}：${pr.length} 个按钮按下态 = btn_pressed`);
    await page.evaluate(() => document.querySelectorAll('#mhud .b:not(.sk):not(#mh-act):not(#mh-pots>.b)').forEach(e => e.classList.add('on')));
    await page.screenshot({ path: `${OUT}${name}-pressed.png` });
    await page.evaluate(() => document.querySelectorAll('#mhud .b').forEach(e => e.classList.remove('on')));
    // 真 :active（鼠标按住顶栏第一个）
    const bb = await page.evaluate(() => { const r = document.querySelector('#mh-top .b').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.move(bb.x, bb.y); await page.mouse.down(); await sleep(100);
    await page.screenshot({ path: `${OUT}${name}-active-top.png`, clip: { x: Math.max(0, bb.x - 160), y: 0, width: 220, height: 70 } });
    await page.mouse.up(); await sleep(300); await page.keyboard.press('Escape').catch(() => {});
  }
  // 总览弹层（panel_frame_s + btn_close），点 ✕ 关闭
  await page.evaluate(() => { document.querySelectorAll('.ui-panel-close,[data-close]').forEach(() => {}); window.__mhud.toggleOverview(); }); await sleep(400);
  const ov = await page.evaluate(() => { const m = document.getElementById('mh-ovw'); if (!m) return null; const x = document.getElementById('mh-ovw-x').getBoundingClientRect(); return { box: getComputedStyle(m.querySelector('.box')).borderImageSource, x: { x: x.x + x.width / 2, y: x.y + x.height / 2, w: x.width } }; });
  if (ov) { ok(blocked ? ov.box === 'none' : /panel_frame_s@2x/.test(ov.box), `${name}：总览框 ${blocked ? '回退' : 'panel_frame_s'}`); await page.screenshot({ path: `${OUT}${name}-overview.png` });
    await page.touchscreen.tap(ov.x.x, ov.x.y); await sleep(300); ok(!(await page.evaluate(() => !!document.getElementById('mh-ovw'))), `${name}：✕(${ov.x.w}px) 点按关闭`); }
  else ok(false, `${name}：总览未打开`);
  await b.close(); srv.stop();
}
{ const srv = await startPreview({}), b = await launch(), page = await b.newPage(), w = watch(page);
  await page.setViewport({ width: 1280, height: 720 }); await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  { const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1500);
  const d = await page.evaluate(() => ({ m: !!document.getElementById('mhud'), css: !!document.getElementById('mhud-skin'), req: performance.getEntriesByType('resource').filter(e => /ui\/dom\//.test(e.name)).length }));
  ok(!d.m && !d.css && d.req === 0, `1280 桌面：无 DOM HUD、无皮肤 CSS、0 个 dom 图请求`); ok(w.errs.length === 0, '1280 无报错');
  await page.screenshot({ path: `${OUT}1280-desktop.png` }); await b.close(); srv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
