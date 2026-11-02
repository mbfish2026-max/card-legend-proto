// feat/potion-expand：3 格药水栏 / 长按换药 / 双击解包 / 药店购买 / 图集缺失回退
// 用法：npm run build && node tests/e2e/potion-expand-verify.mjs [截图目录]；NOATLAS=1 模拟图集缺失；VPS=1280x720,844x390,...（1280x720 = 桌面）
import { startPreview, launch, watch, sleep, findPos, toScreen } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/potion-expand'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '1280x720,844x390,932x430,874x402').split(',').map(s => s.split('x').map(Number));
const NOATLAS = !!process.env.NOATLAS, pre = NOATLAS ? 'noatlas-' : '';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const ov = (a, c) => a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
const W = p => p.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { pots: [...w.pots], sel: [0, 1, 2].map(i => w.getSelectedPotion(i)), gold: w.gold, bag: w.bag.map(b => ({ item: b.item, qty: b.qty ?? 1 })) }; });
const sv = await startPreview(), b = await launch();
try {
  for (const [VW, VH] of VPS) {
    const mob = VW !== 1280, tag = `${pre}${mob ? 'mobile' : 'desktop'}-${VW}x${VH}`;
    const save = { v: 1, cls: 'warrior', level: 22, town: 'bichi', exp: 0, gold: 99999, pots: [5, 3, 2, 9, 4, 0, 7, 0], floorIndex: 2, kills: 0, nextUid: 900, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['thrust', 'half_moon'] };
    const p = await b.newPage(); const w = watch(p); if (process.env.DBG) { p.on('pageerror', e => console.log('STACK', e.stack)); p.on('console', m => m.type() === 'error' && console.log('CERR', m.text(), JSON.stringify(m.location()))); }
    if (mob) { await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); } else await p.setViewport({ width: VW, height: VH });
    if (NOATLAS) await p.setBypassServiceWorker(true), await p.setRequestInterception(true), p.on('request', r => /ui_atlas|\/ui\/dom\//.test(r.url()) ? r.abort() : r.continue());
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(m => window.__game.scene.getScene('Battle')?.world?.hero && (!m || document.getElementById('mhud')), { timeout: 30000 }, mob); await sleep(2000);
    await p.evaluate(() => { const w = window.__game.scene.getScene('Battle').world, it = w.makeItem('bundle_hp_big'); it.qty = 2; w.bag = [it]; });
    const tap = async q => { if (mob) await p.touchscreen.tap(q.x, q.y); else await p.mouse.click(q.x, q.y); await sleep(350); };
    const press = async (q, ms) => { if (mob) { await p.touchscreen.touchStart(q.x, q.y); await sleep(ms); await p.touchscreen.touchEnd(); } else { await p.mouse.move(q.x, q.y); await p.mouse.down(); await sleep(ms); await p.mouse.up(); } await sleep(300); };
    // ① 3 格：尺寸 / 位置 / 不重叠 / 不挤技能栏
    const geo = await p.evaluate(mob => {
      const R = r => ({ l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height });
      if (mob) return { pots: [...document.querySelectorAll('#mh-pots .b')].map(e => R(e.getBoundingClientRect())), sk: [...document.querySelectorAll('#mhud .sk, #mh-page, #mh-act, #mh-comp .b')].filter(e => e.offsetParent).map(e => R(e.getBoundingClientRect())) };
      const U = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), k = cv.width / 1280, S = o => { const b = o.getBounds(); return { l: cv.left + b.x * k, t: cv.top + b.y * k, r: cv.left + b.right * k, b: cv.top + b.bottom * k, w: b.width * k, h: b.height * k }; };
      const by = re => U.children.list.filter(o => re.test(o.name ?? ''));
      return { pots: by(/^potSlot\d$/).map(S), sk: by(/^skSlot\d+$/).map(S) };
    }, mob);
    chk(geo.pots.length === 3, `${tag} 恰好 3 格（${geo.pots.length}）`);
    const minS = mob ? 56 : 36; chk(geo.pots.every(q => q.w >= minS - 0.5 && q.h >= minS - 0.5), `${tag} 格尺寸 ≥${minS}px（${geo.pots.map(q => q.w.toFixed(0) + '×' + q.h.toFixed(0)).join(' ')}）`);
    chk(geo.pots.every(q => q.l >= 0 && q.t >= 0 && q.r <= VW && q.b <= VH), `${tag} 不出屏`);
    chk(geo.pots.every((q, i) => geo.pots.every((o, j) => i === j || !ov(q, o))), `${tag} 3 格互不重叠`);
    chk(geo.sk.length > 0 && geo.pots.every(q => geo.sk.every(o => !ov(q, o))), `${tag} 不挤占技能栏（${geo.sk.length} 个键）`);
    const ctr = i => ({ x: (geo.pots[i].l + geo.pots[i].r) / 2, y: (geo.pots[i].t + geo.pots[i].b) / 2 });
    const s0 = await W(p); chk(s0.sel.join() === 'hp_small,mp_small,sun', `${tag} 默认选中 ${s0.sel.join()}`);
    await p.screenshot({ path: `${dir}/${tag}-bar.png` });
    // ② 长按换药
    await press(ctr(0), 700);
    const popOpen = () => p.evaluate(mob => mob ? !!document.getElementById('mh-popop') || !!document.getElementById('mh-potpop') : !!window.__game.scene.getScene('UI').children.getByName('potPop'), mob);
    chk(await popOpen(), `${tag} 长按 → 弹出换药层`);
    const opt = await p.evaluate(mob => { if (mob) { const e = document.querySelector('[data-id=potopt_hp_big]'); const r = e?.getBoundingClientRect(); return r && { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }
      const U = window.__game.scene.getScene('UI'), c = U.children.getByName('potPop'), o = c?.list.find(o => o.name === 'potOpt_hp_big'); if (!o) return null; const b = o.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), k = cv.width / 1280; return { x: cv.left + b.centerX * k, y: cv.top + b.centerY * k, w: b.width * k, h: b.height * k }; }, mob);
    chk(!!opt && opt.w >= (mob ? 44 : 36) && opt.h >= (mob ? 44 : 36), `${tag} 弹层选项点击区 ${opt?.w.toFixed(0)}×${opt?.h.toFixed(0)}`);
    await p.screenshot({ path: `${dir}/${tag}-longpress.png` });
    if (opt) await tap(opt);
    const s1 = await W(p); chk(s1.sel[0] === 'hp_big' && !(await popOpen()), `${tag} 选中强效金创药且弹层关闭（sel=${s1.sel[0]}）`);
    const cnt0 = await p.evaluate(mob => mob ? document.querySelector('[data-id=pot0] span').textContent : window.__game.scene.getScene('Battle').hud?.potBar?.cnt[0].text ?? null, mob);
    if (cnt0 !== null) chk(cnt0 === '4', `${tag} 格内数量 = 强效金创药 4（${cnt0}）`);
    await press(ctr(1), 700); chk(await popOpen(), `${tag} 再次长按（蓝）打开`);
    await tap({ x: VW * 0.3, y: VH * 0.3 }); chk(!(await popOpen()), `${tag} 点弹层外关闭`);
    chk((await W(p)).sel[1] === 'mp_small', `${tag} 点外关闭不改选择`);
    // 短按 = 用选中药（转发 onKey('P4')；用药规则归战斗侧）
    await p.evaluate(() => { const h = window.__game.scene.getScene('Battle').world.hero; h.hp = Math.round(h.maxHp * 0.3); });
    const u0 = await W(p); await tap(ctr(0)); let u1 = await W(p);
    for (let k = 0; k < 10 && u1.pots[4] === u0.pots[4]; k++) { await sleep(150); u1 = await W(p); }
    if (u1.pots[4] === u0.pots[4]) console.log('dbg hit', await p.evaluate(c => { const e = document.elementFromPoint(c.x, c.y); return e ? (e.id || e.className || e.tagName) + ' ' + (e.dataset?.id ?? '') : 'none'; }, ctr(0)));
    chk(u1.pots[4] === u0.pots[4] - 1, `${tag} 短按红格 → 强效金创药 ${u0.pots[4]}→${u1.pots[4]}`);
    // ③ 背包双击解包
    await p.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(800);
    const bq = await p.evaluate(() => { let o = null; const U = window.__game.scene.getScene('UI'); const walk = l => l.forEach(x => { if (x.name === 'bundleQty' && x.visible) o = x; if (x.list) walk(x.list); }); walk(U.children.list); if (!o) return null;
      const c = o.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { x: cv.left + (c.centerX - wv.x) * cv.width / wv.width, y: cv.top + (c.centerY - wv.y) * cv.height / wv.height, t: o.text }; });
    chk(!!bq && bq.t === '2', `${tag} 背包捆显示数量角标（${bq?.t}）`);
    if (bq) { const q = { x: bq.x - 12, y: bq.y - 12 }; const b0 = await W(p);
      if (mob) { await p.touchscreen.tap(q.x, q.y); const gap = process.env.GAP ? 200 + Math.floor(Math.random() * 900) : 900; globalThis.__gap = gap; await sleep(gap); if (process.env.DBG) console.log('dbg sel', await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; return P.sel + ' mode=' + P.mode + ' tip=' + !!P.tip; }), await p.evaluate(q => { const U = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; const x = wv.x + (q.x - cv.left) * wv.width / cv.width, y = wv.y + (q.y - cv.top) * wv.height / cv.height; const hits = U.input.hitTestPointer({ x, y, worldX: x, worldY: y, camera: U.cameras.main, updateWorldPoint(){}, positionToCamera(c){ return { x, y }; } }); return x.toFixed(0) + ',' + y.toFixed(0) + ' ' + hits.map(h => h.type + ':' + (h.name || '') + ':' + h.depth).join(' '); }, q)); await p.touchscreen.tap(q.x, q.y); if (process.env.DBG) { await sleep(300); console.log('dbg sel2', await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; return P.sel + ' mode=' + P.mode + ' ' + window.__game.scene.getScene('Battle').world.bag.map(b => b.item + 'x' + b.qty); })); } } else { await p.mouse.click(q.x, q.y); await sleep(120); await p.mouse.click(q.x, q.y); }
      await sleep(500); let b1 = await W(p); for (let k = 0; k < 10 && b1.pots[4] === b0.pots[4]; k++) { await sleep(150); b1 = await W(p); }
      if (b1.pots[4] !== b0.pots[4] + 6) console.log('diag', 'gap=' + globalThis.__gap, await p.evaluate(q => { const P = window.__game.scene.getScene('UI').panel, e = document.elementFromPoint(q.x, q.y); return 'sel=' + P.sel + ' mode=' + P.mode + ' tip=' + !!P.tip + ' el=' + (e ? e.id || e.tagName : 'none') + ' pop=' + !!document.getElementById('mh-potpop'); }, q));
      chk(b1.pots[4] === b0.pots[4] + 6 && b1.bag.find(x => x.item === 'bundle_hp_big')?.qty === 1, `${tag} 双击解包：强效金创药 ${b0.pots[4]}→${b1.pots[4]}，捆 2→${b1.bag.find(x => x.item === 'bundle_hp_big')?.qty}`);
      await p.screenshot({ path: `${dir}/${tag}-unbundle.png` });
      if (!mob) { await p.mouse.click(q.x, q.y); await sleep(700); await p.mouse.click(q.x, q.y); await sleep(400); const b2 = await W(p); chk(b2.pots[4] === b1.pots[4], `${tag} 两次单击间隔 >450ms 不解包`); }
    }
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(400);
    // ④ 药店购买（比奇药店）
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_potion')); await sleep(800);
    const locked = await findPos(p, 'UI', '强效太阳水包 需Lv40'); 
    if (!locked) { await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; for (const k of Object.keys(P.npcScroll)) P.npcScroll[k] = 99; P.render(); }); await sleep(400); }
    chk(!!(await findPos(p, 'UI', '强效太阳水包 需Lv40')), `${tag} 强效太阳水包 Lv40 门槛灰显`);
    await p.evaluate(() => { window.__game.scene.getScene('Battle').world.level = 40; window.__game.scene.getScene('UI').panel.render(); }); await sleep(300); // 第5轮：强效捆 Lv40 起卖，升到 40 再测购买
    const findBuy = () => p.evaluate(() => { const U = window.__game.scene.getScene('UI'), all = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) all.push(o); if (o.list) walk(o.list); }); walk(U.children.list);
      const nm = all.find(o => o.text === '超级金创药'); if (!nm) return null; const y = nm.getBounds().centerY; const bt = all.filter(o => o.text === '购买' && Math.abs(o.getBounds().centerY - y) < 24).sort((a, b) => Math.abs(a.getBounds().centerX - nm.getBounds().centerX) - Math.abs(b.getBounds().centerX - nm.getBounds().centerX))[0];
      if (!bt) return null; const c = bt.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { x: cv.left + (c.centerX - wv.x) * cv.width / wv.width, y: cv.top + (c.centerY - wv.y) * cv.height / wv.height }; });
    let btn = await findBuy();
    for (let sc = 0; !btn && sc < 20; sc++) { await p.evaluate(v => { const P = window.__game.scene.getScene('UI').panel; for (const k of Object.keys(P.npcScroll)) P.npcScroll[k] = v; P.render(); }, sc); await sleep(250); btn = await findBuy(); }
    if (!btn && process.env.DBG) console.log(await p.evaluate(() => { const U = window.__game.scene.getScene('UI'), all = []; const walk = l => l.forEach(o => { if (o.type === 'Text') all.push(o); if (o.list) walk(o.list); }); walk(U.children.list); return JSON.stringify(U.panel.npcScroll) + all.filter(o => /超级|购买/.test(o.text)).map(o => o.visible + o.text + '@' + o.getBounds().centerY).join(' | '); }));
    chk(!!btn, `${tag} 找到「超级金创药」购买键`);
    if (btn) { const g0 = await W(p); await tap(btn); await sleep(400); const g1 = await W(p);
      chk(g0.gold - g1.gold === 2160 && (g1.bag.find(x => x.item === 'bundle_hp_big')?.qty ?? 0) === (g0.bag.find(x => x.item === 'bundle_hp_big')?.qty ?? 0) + 1, `${tag} 购买超级金创药：金 -${g0.gold - g1.gold}，捆 +1`); }
    await p.screenshot({ path: `${dir}/${tag}-shop.png` });
    const errs = w.errs.filter(e => !(NOATLAS && /Failed to load resource/.test(e))); chk(errs.length === 0, `${tag} 无 JS 错误${NOATLAS ? '（图集被拦的加载失败除外）' : ''} ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
