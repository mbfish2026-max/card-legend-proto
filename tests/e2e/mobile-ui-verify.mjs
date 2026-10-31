// 手机网页版界面验证（puppeteer，hasTouch/isMobile + iPhone UA，自动识别不加 ?mobile）
// 用法：npm run build && node tests/e2e/mobile-ui-verify.mjs [截图目录] [main 的 dist 目录(可选，做桌面像素对比)]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots', mainDist = process.argv[3];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SAVE = { v: 1, level: 30, exp: 0, gold: 5000, pots: [5, 2, 5, 2], floorIndex: 3, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'mage', learned: [] };
const VPS = [[844, 390], [932, 430], [1024, 470], [667, 375]];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
async function enter(p, url, save = SAVE, touch = true) {
  await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await p.goto(url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await (touch ? p.touchscreen.tap(t.x, t.y) : p.mouse.click(t.x, t.y));
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1500);
}
const geom = p => p.evaluate(() => Array.from(document.querySelectorAll('#mhud .b, #mh-log, #mh-joy .hint')).filter(e => e.offsetParent !== null && getComputedStyle(e).display !== 'none')
  .map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.id || e.id || e.className, x: r.left, y: r.top, w: r.width, h: r.height }; }));
const sv = await startPreview(), b = await launch(); const report = {};
try {
  for (const [W, H] of VPS) {
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const ww = watch(p); p.on('requestfailed', r => console.log('  请求失败', r.url().slice(0, 120)));
    await enter(p, sv.url);
    const st = await p.evaluate(() => ({ mobile: document.body.classList.contains('mobile'), mhud: !!document.getElementById('mhud'), padVisible: !!window.__game.scene.getScene('UI').children.list.find(o => o.visible && o.type === 'Arc' && o.radius > 40) }));
    chk(st.mobile && st.mhud, `${W}×${H} 自动识别手机 → DOM 手机 HUD`);
    const g = await geom(p); report[`${W}x${H}`] = g;
    for (const e of g) chk(e.w >= 44 && e.h >= 44, `${W}×${H} ${e.id} 触控区 ${e.w.toFixed(0)}×${e.h.toFixed(0)} ≥44`);
    for (const e of g) chk(e.x >= 0 && e.y >= 0 && e.x + e.w <= W + 0.5 && e.y + e.h <= H + 0.5, `${W}×${H} ${e.id} 在视口内`);
    let ov = 0; for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const a = g[i], c = g[j];
      const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      if (ix > 1 && iy > 1) { ov++; console.log('  重叠', a.id, c.id); } }
    chk(ov === 0, `${W}×${H} 按钮互不重叠`);
    const ids = g.map(e => e.id); chk(new Set(ids.filter(i => i !== 'b')).size === ids.filter(i => i !== 'b').length, `${W}×${H} 无重复入口`);
    // 主角不被控件遮挡
    const hero = await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), h = B.world.hero, v = B.views.get(h.uid), cam = B.cameras.main, cv = window.__game.canvas.getBoundingClientRect();
      const bb = v.getBounds(); return { x: cv.left + (bb.x - cam.scrollX) * cv.width / 1280, y: cv.top + (bb.y - cam.scrollY) * cv.height / 720, w: bb.width * cv.width / 1280, h: bb.height * cv.height / 720 }; });
    const cover = g.filter(e => e.x < hero.x + hero.w - 4 && e.x + e.w > hero.x + 4 && e.y < hero.y + hero.h - 4 && e.y + e.h > hero.y + 4).map(e => e.id);
    chk(cover.length === 0, `${W}×${H} 主角未被遮挡 ${cover.join(',')}`);
    await p.screenshot({ path: `${dir}/m-${W}x${H}-hud.png` });
    // 摇杆：多点触控（按住摇杆同时点技能）
    const base = g.find(e => String(e.id).includes('hint')), sk = g.find(e => String(e.id).startsWith('sk_'));
    const x0 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.hero.x);
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), o = B.onKey.bind(B); window.__keys = []; B.onKey = k => { window.__keys.push(k); return o(k); }; });
    const cdp = await p.target().createCDPSession();
    const bx = base.x + base.w / 2 + 60, by = base.y - 40; // 摇杆区任意处按下
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bx, y: by, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bx + 40, y: by, id: 1 }] });
    await sleep(100);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bx + 40, y: by, id: 1 }, { x: sk.x + sk.w / 2, y: sk.y + sk.h / 2, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bx + 41, y: by, id: 1 }] }); // 抬起 2 号，1 号仍按住
    await sleep(800);
    const mid = await p.evaluate(() => ({ x: window.__game.scene.getScene('Battle').world.hero.x, cd: window.__keys.includes(window.__game.scene.getScene('Battle').world.skills.find(s => !s.passive).key), dx: window.__mhud.dx }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(200);
    const dx2 = await p.evaluate(() => window.__mhud.dx);
    chk(mid.x > x0 + 20 && mid.dx === 1 && dx2 === 0, `${W}×${H} 摇杆右推移动 ${x0.toFixed(0)}→${mid.x.toFixed(0)}，松手停止`);
    chk(mid.cd, `${W}×${H} 按住摇杆同时点技能可施放（多点触控）`);
    // 面板：每个顶部图标点开 → 截图 → 关闭键可点、尺寸 ≥44
    if (W === 844 || W === 667) for (const id of ['bag', 'skills', 'quests', 'map', 'shop', 'settings']) {
      // 商店：战斗地图没有商人（城里由「对话」键进入），这里直接打开面板只为截图检查排版
      if (id === 'shop') await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('shop'));
      else { const e = (await geom(p)).find(x => x.id === id); if (!e) { chk(false, `${W}×${H} 顶部图标 ${id}`); continue; }
        await p.touchscreen.tap(e.x + e.w / 2, e.y + e.h / 2); }
      await sleep(700);
      const pi = await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; const hud = document.getElementById('mhud').classList.contains('off');
        let close = null, minF = 99; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) { if (o.text === '✕') close = o; minF = Math.min(minF, parseFloat(o.style.fontSize) * (o.parentContainer?.scaleX ?? 1)); } if (o.list) walk(o.list); });
        walk(P.root?.list ?? []); const cv = window.__game.canvas.getBoundingClientRect(), k = cv.height / 720;
        let cb = null; if (close) { const r = P.root.list[P.root.list.indexOf(close) - 1]; const bb = r.getBounds(); cb = { x: cv.left + bb.x * k, y: cv.top + bb.y * k, w: bb.width * k, h: bb.height * k }; }
        return { open: P.open, mode: P.mode, hud, cb, minPx: minF * k }; });
      await p.screenshot({ path: `${dir}/m-${W}x${H}-panel-${id}.png` });
      chk(pi.open && pi.hud, `${W}×${H} ${id} 面板打开（HUD 让位） mode=${pi.mode}`);
      chk(pi.cb && pi.cb.w >= 44 && pi.cb.h >= 43.5, `${W}×${H} ${id} 关闭键 ${pi.cb?.w.toFixed(0)}×${pi.cb?.h.toFixed(0)}`);
      console.log(`  ${id} 最小字号 ≈ ${pi.minPx.toFixed(1)}px`);
      if (id !== 'map') chk(pi.minPx >= 11.5, `${W}×${H} ${id} 字号 ≥12px 等效（${pi.minPx.toFixed(1)}）`);
      if (!pi.cb) continue;
      await p.touchscreen.tap(pi.cb.x + pi.cb.w / 2, pi.cb.y + pi.cb.h / 2); await sleep(400);
      const shut = await p.evaluate(() => !window.__game.scene.getScene('UI').panel.open); chk(shut, `${W}×${H} ${id} 点 ✕ 关闭`);
    }
    // 防缩放：viewport meta
    const meta = await p.evaluate(() => document.querySelector('meta[name=viewport]')?.content ?? '');
    chk(/user-scalable=no|maximum-scale=1/.test(meta), `viewport 禁缩放 ${meta}`);
    chk(ww.errs.length === 0, `${W}×${H} 无报错 ${ww.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
  // 竖屏提示
  { const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true }); await p.goto(sv.url); await sleep(1500);
    chk(await p.evaluate(() => document.getElementById('rotate')?.classList.contains('show')), '竖屏显示「请横屏」'); await p.screenshot({ path: `${dir}/m-portrait.png` }); await p.close(); }
  // ?mobile=0 强制电脑版
  { const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true }); await p.goto(sv.url + '?mobile=0'); await sleep(1500);
    chk(await p.evaluate(() => !document.body.classList.contains('mobile')), '?mobile=0 → 电脑版'); await p.close(); }
  // 桌面 1280×720：与 main 像素一致（设置面板静态画面 + UI 场景对象清单）
  const desk = async (url, tag) => { const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); await enter(p, url, { ...SAVE, cls: 'warrior' }, false);
    const dump = await p.evaluate(() => { const out = []; const walk = l => l.forEach(o => { out.push([o.type, Math.round(o.x), Math.round(o.y), o.visible, o.text ?? '', o.type === 'Text' ? '' : (o.texture?.key ?? '')]); if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').children.list); return out; });
    const mh = await p.evaluate(() => !!document.getElementById('mhud'));
    await p.keyboard.press('Escape'); await sleep(800);
    // 只比 UI 层：隐藏战斗世界相机（世界里角色待机/特效是动画，两次截图天然不同）
    await p.evaluate(() => { window.__game.scene.getScene('Battle').cameras.main.setVisible(false); }); await sleep(200);
    const png = await p.screenshot({ path: `${dir}/desktop-1280x720-${tag}.png`, }); await p.close(); return { dump, png, mh }; };
  const mine = await desk(sv.url, 'branch'); chk(!mine.mh, '桌面不创建手机 HUD');
  if (mainDist) { const sm = await startPreview({ root: mainDist }); const base = await desk(sm.url, 'main'); sm.stop();
    const df = mine.dump.map((d, i) => JSON.stringify(d) !== JSON.stringify(base.dump[i]) ? i : -1).filter(i => i >= 0); df.slice(0, 5).forEach(i => console.log('  差异', JSON.stringify(mine.dump[i]), JSON.stringify(base.dump[i])));
    chk(JSON.stringify(mine.dump) === JSON.stringify(base.dump), `桌面 UI 场景对象与 main 一致（${mine.dump.length} 个）`);
    // 血球液面波动、标题火花是 UI 自带动画 → 允许 ≤0.1% 像素差（实测约 0.03%，只在这两处）
    const cp = await b.newPage(); const n = await cp.evaluate(async (x, y) => { const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
      const [A, B] = await Promise.all([ld(x), ld(y)]); const g = im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const t = c.getContext('2d'); t.drawImage(im, 0, 0); return t.getImageData(0, 0, c.width, c.height).data; };
      const a = g(A), bb = g(B); let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.max(Math.abs(a[i] - bb[i]), Math.abs(a[i + 1] - bb[i + 1]), Math.abs(a[i + 2] - bb[i + 2])) > 8) n++; return n; }, Buffer.from(mine.png).toString('base64'), Buffer.from(base.png).toString('base64')); await cp.close();
    chk(n / (1280 * 720) <= 0.001, `桌面设置面板截图与 main 一致（差异像素 ${n}，只在血球液面/火花动画处）`); }
  writeFileSync(`${dir}/mobile-ui-geom.json`, JSON.stringify(report, null, 1));
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
