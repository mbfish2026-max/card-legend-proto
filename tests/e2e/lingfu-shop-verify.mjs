// 灵符商城：右下入口（桌面/手机）位置、点击区、不重叠；打开/购买/灵符不足/关闭；NOATLAS=1 图集缺失回退
// 用法：npm run build && node tests/e2e/lingfu-shop-verify.mjs [截图目录]；VPS=844x390,... 覆盖尺寸
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/lingfu-shop'; mkdirSync(dir, { recursive: true });
const NOATLAS = !!process.env.NOATLAS, pre = NOATLAS ? 'noatlas' : 'atlas';
const UA_M = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
// 尾缀 d = 桌面鼠标（无触屏）；其余均为触屏（触屏一碰即切手机布局）
const VPS = (process.env.VPS ?? '844x390,932x430,874x402,1280x720,1280x720d').split(',').map(s => [...s.replace('d', '').split('x').map(Number), s.endsWith('d')]);
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const ov = (a, c) => a.l < c.r - 0.5 && c.l < a.r - 0.5 && a.t < c.b - 0.5 && c.t < a.b - 0.5;
const sv = await startPreview(), b = await launch();
// UI 场景所有可点对象 → 页面 CSS 像素矩形
const HITS = () => { const cv = window.__game.canvas.getBoundingClientRect(), R = window.__render ?? { lw: 1280, ox: 0 }, k = cv.width / R.lw, out = [];
  const walk = o => { (o.list ?? []).forEach(walk); if (o.input?.enabled && o.visible && o.input.hitArea?.width) { const m = o.getWorldTransformMatrix(), ha = o.input.hitArea, sx = m.scaleX ?? 1;
    const x0 = m.tx + (ha.x - o.displayOriginX) * sx, y0 = m.ty + (ha.y - o.displayOriginY) * sx;
    out.push({ n: o.name || o.type, sku: o.getData?.('sku') ?? null, tab: o.getData?.('lfTab') ?? null, l: cv.left + (x0 + (R.ox ?? 0)) * k, t: cv.top + y0 * cv.height / 720, r: cv.left + (x0 + (R.ox ?? 0) + ha.width * sx) * k, b: cv.top + (y0 + ha.height * sx) * cv.height / 720 }); } };
  window.__game.scene.getScene('UI').children.list.forEach(walk); return out; };
const FRAMES = () => window.__game.scene.getScene('UI').children.list.flatMap(function walk(o) { return [o, ...(o.list ?? []).flatMap(walk)]; }).filter(o => o.visible && o.texture?.key === 'ui_atlas').map(o => o.frame.name);
const bal = p => p.evaluate(() => { let t = null; const walk = o => { if (o.name === 'lingfuBalance') t = o.text; (o.list ?? []).forEach(walk); }; window.__game.scene.getScene('UI').children.list.forEach(walk); return t; });
let DESK = false; const tap = (p, x, y) => DESK ? p.mouse.click(x, y) : p.touchscreen.tap(x, y);
const tapC = (p, h) => tap(p, (h.l + h.r) / 2, (h.t + h.b) / 2);
const idle = p => p.waitForFunction(() => window.__game.scene.getScene('UI').input._pendingInsertion.length === 0, { timeout: 20000 }).catch(() => {});
async function open(VW, VH, wallet) {
  const touch = !DESK, uaM = VW < 1000, save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
  const p = await b.newPage(); if (uaM) await p.setUserAgent(UA_M);
  await p.setViewport({ width: VW, height: VH, isMobile: uaM, hasTouch: touch, deviceScaleFactor: uaM ? 2 : 1 }); const w = watch(p);
  if (NOATLAS) await p.setBypassServiceWorker(true), await p.setRequestInterception(true), p.on('request', r => /ui_atlas|\/ui\/dom\//.test(r.url()) ? r.abort() : r.continue());
  await p.evaluateOnNewDocument((s, wl) => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); if (wl) localStorage.setItem('fcl_lingfu_v1', JSON.stringify(wl)); }, save, wallet);
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await tap(p, t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1800);
  const mobile = await p.evaluate(() => !!window.__mobile || !!document.getElementById('mhud'));
  return { p, w, mobile };
}
try {
  for (const [VW, VH, desk] of VPS) {
    DESK = desk; const tag = `${VW}x${VH}${desk ? '-desktop' : ''}`, minTap = VW <= 844 ? 36 : 44;
    const { p, w, mobile } = await open(VW, VH, null);
    // 1) 入口位置/尺寸/不重叠
    let entry;
    if (mobile) {
      const g = await p.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return { n: e.id || e.dataset.id || e.className, l: b.left, t: b.top, r: b.right, b: b.bottom }; };
        const vis = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
        const shop = document.getElementById('mh-shop'); const others = [...document.querySelectorAll('#mh-act, #mh-auto, #mh-page, #mh-pots .b, #mh-comp .b, #mhud .sk, #mh-top .b, #mh-joy .hint, #mh-log, #mh-floor')].filter(e => e !== shop && vis(e)).map(r);
        return { shop: shop && r(shop), others, vw: innerWidth, vh: innerHeight }; });
      entry = g.shop;
      chk(!!entry, `${tag} 手机入口 #mh-shop 存在`); if (!entry) { await p.close(); continue; }
      const ww = entry.r - entry.l, hh = entry.b - entry.t;
      chk(ww >= 44 && hh >= 44, `${tag} 入口点击区 ${ww.toFixed(0)}×${hh.toFixed(0)} ≥44`);
      chk(entry.l > g.vw / 2 && entry.b > g.vh * 0.25 && entry.r <= g.vw && entry.t >= 0, `${tag} 入口在右侧下半区内且不出屏 (${entry.l.toFixed(0)},${entry.t.toFixed(0)})-(${entry.r.toFixed(0)},${entry.b.toFixed(0)})`);
      const hit = g.others.filter(o => ov(entry, o)); chk(hit.length === 0, `${tag} 入口不与 进入键/药水/技能键/自动/摇杆/顶栏 重叠 ${JSON.stringify(hit.map(h => h.n))}`);
    } else {
      const hs = await p.evaluate(HITS); entry = hs.find(h => h.n === 'lingfuEntry');
      chk(!!entry, `${tag} 桌面入口存在`); if (!entry) { await p.close(); continue; }
      chk(entry.r - entry.l >= 44 && entry.b - entry.t >= 44, `${tag} 入口点击区 ${(entry.r - entry.l).toFixed(0)}×${(entry.b - entry.t).toFixed(0)} ≥44`);
      chk(entry.l > VW * 0.75 && entry.t > VH * 0.6, `${tag} 入口在右下`);
      const hit = hs.filter(h => h !== entry && ov(entry, h) && (h.r - h.l) < VW * 0.8); chk(hit.length === 0, `${tag} 入口不与其它点击区重叠 ${JSON.stringify(hit.map(h => h.n))}`);
    }
    await p.screenshot({ path: `${dir}/${pre}-${tag}-entry.png` });
    // 2) 点入口打开
    await tapC(p, entry); await sleep(700);
    chk(await p.evaluate(() => window.__game.scene.getScene('UI').panel.mode) === 'lingfu', `${tag} 点入口 → 灵符商城打开`);
    chk(/5000/.test(await bal(p) ?? ''), `${tag} 新钱包 5000 灵符（${await bal(p)}）`);
    const fr = await p.evaluate(FRAMES);
    if (NOATLAS) chk(fr.length === 0, `${tag} 图集缺失 → 回退绘制`); else chk(fr.some(f => /panel_frame|dialog_frame/.test(f)) && fr.some(f => /list_row|row/.test(f)) && fr.some(f => /^tab_/.test(f)), `${tag} 用到图集帧 ${[...new Set(fr)].sort().join(',')}`);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-open.png` });
    await idle(p);
    let hs = await p.evaluate(HITS);
    const small = hs.filter(h => /^lf/.test(h.n) && Math.min(h.r - h.l, h.b - h.t) < minTap - 0.5);
    chk(small.length === 0, `${tag} 商城点击区最小边 ≥${minTap}px（${hs.filter(h => /^lf/.test(h.n)).length} 个，过小 ${JSON.stringify(small.map(h => [h.n, Math.round(h.r - h.l), Math.round(h.b - h.t)]))}）`);
    const tabs = hs.filter(h => h.n === 'lfTab'); chk(tabs.length >= 5 && tabs.every((a, i) => tabs.every((c, j) => i === j || !ov(a, c))), `${tag} 页签 ${tabs.length} 个互不重叠`);
    const buys = hs.filter(h => h.n === 'lfBuy'); chk(buys.length > 0 && buys.every((a, i) => buys.every((c, j) => i === j || !ov(a, c))), `${tag} 购买键 ${buys.length} 个互不重叠`);
    // 3) 购买：切「补给」页签买回城石（100）
    const sup = tabs.find(t => t.tab === 'util') ?? tabs[4]; await tapC(p, sup); await sleep(500); await idle(p);
    hs = await p.evaluate(HITS); const rb = hs.find(h => h.n === 'lfBuy' && h.sku === 'return_stone') ?? hs.find(h => h.n === 'lfBuy');
    await tapC(p, rb); await sleep(500); await idle(p);
    hs = await p.evaluate(HITS); const ok = hs.find(h => h.n === 'lfOk'); chk(!!ok, `${tag} 购买 → 确认框`);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-confirm.png` });
    const bag0 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.bag.length);
    if (ok) { await tapC(p, ok); await sleep(600); }
    const after = await bal(p), bag1 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.bag.length);
    chk(/4900/.test(after ?? '') && bag1 === bag0 + 1, `${tag} 确认购买 → 扣 100 灵符（${after}），背包 +1（${bag0}→${bag1}）`);
    chk(await p.evaluate(() => JSON.parse(localStorage.getItem('fcl_lingfu_v1')).balance) === 4900, `${tag} 余额已写入本机钱包`);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-bought.png` });
    // 4) 充值页：置灰「未接入支付」
    const rc = tabs.find(t => t.tab === 'recharge') ?? tabs[tabs.length - 1]; await tapC(p, rc); await sleep(500);
    chk(await p.evaluate(() => { let f = false; const walk = o => { if (o.name === 'lfNoPay' && /未接入支付/.test(o.text)) f = true; (o.list ?? []).forEach(walk); }; window.__game.scene.getScene('UI').children.list.forEach(walk); return f; }), `${tag} 充值页显示「未接入支付」`);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-recharge.png` });
    // 5) 点面板外关闭
    await idle(p); await tap(p, 4, VH - 4); await sleep(500);
    let mode = await p.evaluate(() => window.__game.scene.getScene('UI').panel.mode);
    chk(mode === null, `${tag} 点面板外空白 → 关闭（mode=${mode}）`);
    if (mode) await p.evaluate(() => window.__game.scene.getScene('UI').panel.close());
    chk(await p.evaluate(() => !window.__game.scene.getScene('Battle').paused && !window.__game.scene.getScene('UI').panel.mode), `${tag} 关闭后回到战斗`);
    const errs = w.errs.filter(e => !(NOATLAS && /Failed to load resource|ERR_FAILED/.test(e))); chk(errs.length === 0, `${tag} 无 JS 错误 ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
    // 6) 灵符不足（只 50 灵符）
    if (VW === VPS[0][0]) {
      const { p: q, w: w2 } = await open(VW, VH, { v: 1, balance: 50, granted: true, createdAt: 1, ledger: [] });
      await q.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('lingfu')); await sleep(600); await idle(q);
      let h2 = await q.evaluate(HITS); const bb = h2.find(h => h.n === 'lfBuy'); await tapC(q, bb); await sleep(500); await idle(q);
      h2 = await q.evaluate(HITS); chk(!!h2.find(h => h.n === 'lfLackOk') && !h2.find(h => h.n === 'lfOk'), `${tag} 灵符 50 → 提示「灵符不足」，不出确认框`);
      chk(/50/.test(await bal(q) ?? '') && await q.evaluate(() => JSON.parse(localStorage.getItem('fcl_lingfu_v1')).balance) === 50, `${tag} 灵符不足不扣费`);
      await q.screenshot({ path: `${dir}/${pre}-${tag}-lack.png` });
      const lk = h2.find(h => h.n === 'lfLackOk'); if (lk) { await tapC(q, lk); await sleep(400); }
      chk(!(await q.evaluate(HITS)).find(h => h.n === 'lfLackOk'), `${tag} 「知道了」关闭提示`);
      chk(w2.errs.filter(e => !(NOATLAS && /Failed to load resource|ERR_FAILED/.test(e))).length === 0, `${tag} 灵符不足流程无 JS 错误`);
      await q.close();
    }
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'lingfu-shop e2e 全部通过'); process.exit(fail ? 1 : 0);
