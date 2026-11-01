// B0/B1：UI 图集按钮四态 + 图集加载失败回退（1280×720 桌面 / 844×390 手机触屏）。截图 docs/shots/ui-art/b01/
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b01/', import.meta.url).pathname;
const MOBILE = { viewport: { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
const info = page => page.evaluate(() => { const s = window.__game.scene.getScene('Title'); const out = []; const walk = l => l.forEach(o => { if (o.type === 'NineSlice' || (o.type === 'Rectangle' && o.input)) out.push({ t: o.type, f: o.frame?.name, w: o.width, h: o.height, sx: o.scaleX, sy: o.scaleY, hit: o.input?.hitArea?.height, en: !!o.input?.enabled }); if (o.list) walk(o.list); }); walk(s.children.list); const c = s.cameras.main; return { atlas: window.__game.textures.exists('ui_atlas'), list: out, ds: (c.height / (c.zoom || 1)) / window.__game.canvas.getBoundingClientRect().height }; });
for (const [tag, mobile] of [['1280', false], ['844', true]]) for (const blocked of [false, true]) {
  const srv = await startPreview({ block: u => blocked && /ui_atlas/.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  if (mobile) { await page.setUserAgent(MOBILE.userAgent); await page.setViewport(MOBILE.viewport); } else await page.setViewport({ width: 1280, height: 720 });
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  const name = `${tag}${blocked ? '-fallback' : ''}`, I = await info(page);
  const ns = I.list.filter(o => o.t === 'NineSlice');
  if (!blocked) {
    ok(I.atlas && ns.length >= 4, `${name} 图集已加载，九宫格按钮 ${ns.length} 个`);
    ok(ns.some(o => o.f === 'btn_normal') && ns.some(o => o.f === 'btn_disabled'), `${name} 有 normal/disabled 态（无存档「继续」禁用）`);
    ok(ns.every(o => o.sx === 1 && o.sy === 1), `${name} 九宫格 scale 全为 1（只 setSize）`);
    ok(ns.filter(o => o.f === 'btn_normal').every(o => o.w === 280 && o.h === 56), `${name} 按钮尺寸 280×56 保持`);
  } else {
    ok(!I.atlas && ns.length === 0 && I.list.length >= 3, `${name} 图集 404 → 回退代码绘制（矩形按钮 ${I.list.length} 个）`);
    ok(!w.errs.some(e => !/404|Failed to load|ui_atlas/i.test(e)), `${name} 无脚本错误 ${w.errs.filter(e => !/404|Failed to load/i.test(e)).join(' | ')}`);
  }
  const minHit = Math.min(...I.list.filter(o => o.en).map(o => o.hit)), css = minHit / I.ds;
  ok(mobile ? css >= 36 - 1e-6 : minHit >= 44, `${name} 最小点击高度 ${minHit.toFixed(1)} 逻辑 px ≈ ${css.toFixed(1)} CSS px`);
  await page.screenshot({ path: `${OUT}${name}-normal-disabled.png` });
  // hover（桌面真鼠标；手机无 hover，仍截图示意）
  const p = await findPos(page, 'Title', '存 档 位'); await page.mouse.move(p.x, p.y); await sleep(200);
  if (!blocked && !mobile) ok((await info(page)).list.some(o => o.f === 'btn_hover'), `${name} 悬停 → btn_hover`);
  await page.screenshot({ path: `${OUT}${name}-hover.png` });
  // pressed：把「设置」的跳转临时改成空操作，真实按下
  await page.evaluate(() => { window.__game.scene.getScene('Title').settings = () => {}; });
  const q = await findPos(page, 'Title', '设 置'); await page.mouse.move(q.x, q.y); await page.mouse.down(); await sleep(150);
  if (!blocked) ok((await info(page)).list.some(o => o.f === 'btn_pressed'), `${name} 按下 → btn_pressed`);
  await page.screenshot({ path: `${OUT}${name}-pressed.png` });
  await page.mouse.up(); await sleep(100);
  if (!blocked && !mobile) ok((await info(page)).list.some(o => o.f === 'btn_hover'), `${name} 抬起 → 回 hover`);
  await b.close(); srv.stop();
}
console.log(fail ? `FAIL ${fail}` : 'ui-atlas e2e 全过'); process.exit(fail ? 1 : 0);
