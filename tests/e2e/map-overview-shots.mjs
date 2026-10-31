// 地图总览 + 位置条 e2e：点击层名打开/关闭总览；位置条贴近端点高亮；手机/桌面 HUD 重叠检查；截图 map-overview-*.png
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const save = { v: 1, cls: 'warrior', level: 20, exp: 0, gold: 500, pots: [5, 0, 0, 9], floorIndex: 14, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const bad = m => { fail++; (out.fails ??= []).push(m); };
const hit = (a, c) => a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const tag = `${vw}x${vh}`, page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const r = {};
    const cv = await page.evaluate(() => { const c = window.__game.canvas.getBoundingClientRect(); return { x: c.x, y: c.y, k: c.width / 1280 }; });
    // 1) 位置条：起点（贴近左端，回上一层）
    await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.x = 260; }); await sleep(400);
    r.startHint = await page.evaluate(() => window.__game.scene.getScene('Battle').mapPos()?.hint);
    await page.screenshot({ path: `${dir}/map-overview-posbar-start-${tag}.png` });
    // 2) 贴近终点
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.x = W.exitX - 600; }); await sleep(400);
    r.endHint = await page.evaluate(() => window.__game.scene.getScene('Battle').mapPos()?.hint);
    if (!/^后方出口：回 /.test(r.startHint || '') || !/^前方：下一张地图 /.test(r.endHint || '')) bad(tag + ' 位置条提示 ' + r.startHint + ' / ' + r.endHint);
    await page.screenshot({ path: `${dir}/map-overview-posbar-end-${tag}.png` });
    // 3) 重叠检查
    if (touch) {
      r.overlap = await page.evaluate(() => { const R = e => { const b = e.getBoundingClientRect(); return { id: e.id || e.dataset.id || e.className, x: b.x, y: b.y, w: b.width, h: b.height, fs: parseFloat(getComputedStyle(e).fontSize) }; };
        const mine = ['#mh-floor', '#mh-pos', '#mh-posT'].map(s => R(document.querySelector(s))), U = { x: Math.min(...mine.map(m => m.x)), y: Math.min(...mine.map(m => m.y)), w: 0, h: 0 }; U.w = Math.max(...mine.map(m => m.x + m.w)) - U.x; U.h = Math.max(...mine.map(m => m.y + m.h)) - U.y;
        const others = [...document.querySelectorAll('#mhud .b, #mh-log, #mh-bars, #mh-top, #mh-pots')].filter(e => e.offsetParent).map(R);
        return { block: U, floorH: mine[0].h, fonts: mine.map(m => m.fs), hits: others.filter(o => U.x < o.x + o.w && o.x < U.x + U.w && U.y < o.y + o.h && o.y < U.y + U.h).map(o => o.id), right: U.x + U.w, vw: innerWidth }; });
      if (r.overlap.hits.length || r.overlap.floorH < 44 || Math.min(...r.overlap.fonts) < 12 || r.overlap.right > vw) bad(tag + ' 重叠/尺寸 ' + JSON.stringify(r.overlap));
    } else {
      r.overlap = await page.evaluate(() => { const U = window.__game.scene.getScene('UI'), B = window.__game.scene.getScene('Battle'), objs = [...U.children.list, ...B.children.list].filter(o => o.visible && o.getBounds && o.scrollFactorX === 0);
        const H = B.hud, bars = [H.posG && { x: 996, y: 102, w: 268, h: 18 }, H.posT?.text && (b => ({ x: b.x, y: b.y, w: b.width, h: b.height }))(H.posT.getBounds())].filter(Boolean);
        const hits = []; for (const o of objs) { if (o === H.posG || o === H.posT || o.depth < 0) continue; let b; try { b = o.getBounds(); } catch { continue; } if (b.width >= 1200 || b.height >= 600 || !b.width) continue; for (const a of bars) if (a.x < b.x + b.width && b.x < a.x + a.w && a.y < b.y + b.height && b.y < a.y + a.h) hits.push(`${o.type}:${o.name || o.text || ''}@${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)}x${Math.round(b.height)}`); }
        return { bars, hits: hits.slice(0, 10) }; });
      if (r.overlap.hits.length) bad(tag + ' 重叠 ' + r.overlap.hits.join(' '));
    }
    // 4) 点击层名打开总览
    const tapAt = async (x, y) => { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    if (touch) { const p = await page.evaluate(() => { const b = document.querySelector('#mh-floor').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await tapAt(p.x, p.y); }
    else await tapAt(cv.x + 1130 * cv.k, cv.y + 36 * cv.k);
    await sleep(500);
    r.open = await page.evaluate(t => { if (t) { const m = document.querySelector('#mh-ovw .box'); if (!m) return null; const b = m.getBoundingClientRect(), x = document.querySelector('#mh-ovw-x').getBoundingClientRect(); return { text: m.innerText.slice(0, 400), inside: b.x >= 0 && b.y >= 0 && b.right <= innerWidth && b.bottom <= innerHeight, scrollOverflow: m.scrollHeight > m.clientHeight, close: [x.width, x.height], minFont: Math.min(...[...m.querySelectorAll('p,h3')].map(e => parseFloat(getComputedStyle(e).fontSize))) }; }
      const H = window.__game.scene.getScene('Battle').hud, c = H.ovw; if (!c) return null; const b = c.getBounds(); return { text: c.list.filter(o => o.type === 'Text').map(o => o.text).join('\n'), inside: b.x >= 0 && b.y >= 0 && b.right <= 1280 && b.bottom <= 720, close: [48, 48], minFont: Math.min(...c.list.filter(o => o.type === 'Text').map(o => parseFloat(o.style.fontSize))) }; }, touch);
    await page.screenshot({ path: `${dir}/map-overview-panel-${tag}.png` });
    if (!r.open || !r.open.inside || !/推荐等级/.test(r.open.text) || !/第 3 \/ 3 层/.test(r.open.text) || Math.min(...r.open.close) < 44 || r.open.minFont < (touch ? 12 : 13)) bad(tag + ' 总览 ' + JSON.stringify(r.open));
    // 5) 关闭
    if (touch) { const p = await page.evaluate(() => { const b = document.querySelector('#mh-ovw-x').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await tapAt(p.x, p.y); }
    else { const p = await page.evaluate(() => { const H = window.__game.scene.getScene('Battle').hud; return { x: H.ovw.x + 600 - 30, y: H.ovw.y + 28 }; }); await tapAt(cv.x + p.x * cv.k, cv.y + p.y * cv.k); }
    await sleep(400);
    r.closed = await page.evaluate(t => t ? !document.querySelector('#mh-ovw') : !window.__game.scene.getScene('Battle').hud.ovw, touch);
    if (!r.closed) bad(tag + ' 未关闭');
    out[tag] = { ...r, errs: w.errs.slice(0, 5) }; if (w.errs.length) bad(tag + ' 页面错误'); await page.close();
  }
} catch (e) { out.err = String(e?.stack || e); fail++; } finally { console.log(JSON.stringify(out, null, 1)); console.log(fail ? 'FAIL ' + fail : 'OK'); await b.close(); sv.stop(); process.exit(fail ? 1 : 0); }
