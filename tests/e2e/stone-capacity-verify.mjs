// 血石容量显示（feat/stone-capacity-ui）：装备栏/背包/提示框显示「剩余/总」、耗尽状态、实时更新与重绘保护、手机点击区
// 用法：npm run build && node tests/e2e/stone-capacity-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/stone-capacity-ui'; mkdirSync(dir, { recursive: true });
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const it = (uid, item, name, extra = {}) => ({ uid, item, name, rarity: 'common', stats: {}, req: 1, price: 0, bound: true, slot: 'stone', ...extra });
const save = { v: 1, cls: 'taoist', level: 45, exp: 0, gold: 99999, pots: [0, 0, 0, 0], floorIndex: 3, kills: 0, nextUid: 200, mapV: 3, eqV: 2, expV: 2,
  equip: { stone: it(1, 'stone_m', '血石（中）', { req: 35, charge: { hp: 50000, mp: 12345 } }) },
  bag: [it(3, 'stone_s', '血石（小）', { charge: { hp: 19997, mp: 20000 } }), it(4, 'stone_x', '血石（特）', { req: 45, charge: { hp: 0, mp: 0 } }), it(5, 'stone_l', '血石（大）', { req: 40, charge: { hp: 0, mp: 80000 } }), it(6, 'stone_s', '血石（小）')], learned: [] };
const VP = [[1280, 720, false], [844, 390, true], [874, 402, true], [932, 430, true]];
const report = {};
// 收集 UI 场景内血石相关对象（屏幕 CSS 坐标）
const scan = p => p.evaluate(() => {
  const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, kx = cv.width / wv.width, ky = cv.height / wv.height;
  const sc = bb => ({ x: cv.left + (bb.x - wv.x) * kx, y: cv.top + (bb.y - wv.y) * ky, w: bb.width * kx, h: bb.height * ky });
  const ms = s.panel.mscale || 1, out = { caps: [], slots: [], icons: [], empty: [], kx };
  const walk = l => l.forEach(o => { if (!o.visible) return;
    if (o.type === 'Text' && /^stoneCap_/.test(o.name)) out.caps.push({ t: o.text, c: o.style.color, ...sc(o.getBounds()) });
    if (o.type === 'Text' && o.name === 'stoneEmpty') out.empty.push(sc(o.getBounds()));
    if (o.type === 'Image' && /^item_stone_/.test(o.texture?.key)) out.icons.push({ k: o.texture.key, tint: o.isTinted, ...sc(o.getBounds()) });
    if (o.getData?.('slot')) { const bb = o.getBounds(); out.slots.push({ n: o.name, hit: o.getData('slotHit') * ms * kx, ...sc(bb) }); }
    if (o.list) walk(o.list); });
  walk(s.children.list); return out; });
const inside = (a, r, e = 1) => a.x >= r.x - e && a.y >= r.y - e && a.x + a.w <= r.x + r.w + e && a.y + a.h <= r.y + r.h + e;
const ov = (a, r) => Math.max(0, Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x)) * Math.max(0, Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y));
try {
  for (const [vw, vh, touch] of VP) {
    const tag = `${vw}x${vh}${touch ? '' : '-desktop'}`, r = report[tag] = {};
    const page = await b.newPage(); if (touch) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch, isLandscape: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await page.goto(sv.url, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1200);
    // 冻结战斗，避免截图时数值漂移（只停 Battle 场景 update）
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.scene.pause(); window.__game.scene.getScene('Battle').openPanel('bag'); }); await sleep(900);
    let o = await scan(page);
    const capT = o.caps.map(c => c.t);
    chk(capT.includes('50k/50k') && capT.includes('12.3k/50k'), `${tag} 装备栏中血石 红 50k/50k 蓝 12.3k/50k（${capT.join(' | ')}）`);
    chk(capT.includes('19.9k/20k') && capT.includes('0/20k') && capT.length === 8, `${tag} 背包小血石只显示红（19.9k/20k；旧档无 charge 显示 0/20k）`);
    chk(capT.filter(t => t === '0/300k').length === 2 && capT.includes('0/120k') && capT.includes('80k/120k'), `${tag} 特血石 0/300k×2，大血石 0/120k + 80k/120k`);
    chk(o.caps.filter(c => c.t.startsWith('0/')).every(c => /ff4040/i.test(c.c)), `${tag} 储量为 0 的数字标红`);
    chk(o.empty.length === 2 && o.icons.filter(i => i.tint).map(i => i.k).sort().join() === 'item_stone_s,item_stone_x', `${tag} 耗尽：特血石与旧档小血石图标变灰 + 「耗尽」（${o.empty.length}）`);
    // 不超格、不压图标、不互相重叠
    let bad = 0, cover = 0, lap = 0;
    for (const c of o.caps) { const sl = o.slots.find(s => inside({ x: c.x + c.w / 2, y: c.y + c.h / 2, w: 0, h: 0 }, s, 0)); if (!sl || !inside(c, sl, 1)) bad++;
      for (const i of o.icons) if (sl && inside({ x: i.x + i.w / 2, y: i.y + i.h / 2, w: 0, h: 0 }, sl, 0) && ov(c, i) > 1) cover++;
      for (const d of o.caps) if (d !== c && ov(c, d) > 1) lap++; }
    chk(bad === 0, `${tag} 容量文字全部在格子内（越界 ${bad}）`); chk(cover === 0, `${tag} 容量文字不压图标（重叠 ${cover}）`); chk(lap === 0, `${tag} 容量文字互不重叠`);
    const eq = o.slots.filter(s => /^eq_/.test(s.n)); r.equipMinHit = Math.min(...eq.map(s => s.hit)).toFixed(1); r.equipSlots = eq.length;
    r.bagMinHit = Math.min(...o.slots.filter(s => !/^eq_/.test(s.n)).map(s => s.hit)).toFixed(1);
    if (touch) chk(+r.equipMinHit >= 44, `${tag} 装备栏最小点击区 ${r.equipMinHit} CSS px ≥ 44（${eq.length} 格）`);
    else console.log(`ok ${tag} 装备栏最小点击区 ${r.equipMinHit} CSS px（桌面鼠标，无 44 要求）`);
    await page.screenshot({ path: `${dir}/${tag}-equip-bag.png` });
    // 提示框：装备栏血石
    const es = o.slots.find(s => s.n === 'eq_stone'), cx = es.x + es.w / 2, cy = es.y + es.h / 2;
    if (touch) await page.touchscreen.tap(cx, cy); else await page.mouse.move(cx, cy); await sleep(500);
    const tip = await page.evaluate(() => { const t = window.__game.scene.getScene('UI').panel.tip; if (!t) return null; const out = []; const walk = l => l.forEach(o => { if (o.type === 'Text') out.push(o.text); if (o.list) walk(o.list); }); walk(t.list); const bb = t.getBounds(); return { out, bb: { x: bb.x, y: bb.y, w: bb.width, h: bb.height } }; });
    chk(tip && tip.out.includes('红储量 50000/50000') && tip.out.includes('蓝储量 12345/50000'), `${tag} 提示框精确储量 ${tip?.out.filter(t => /储量/.test(t)).join(' ')}`);
    chk(tip && tip.bb.x >= 0 && tip.bb.y >= 0 && tip.bb.x + tip.bb.w <= 1281 && tip.bb.y + tip.bb.h <= 721, `${tag} 提示框在屏内`);
    await page.screenshot({ path: `${dir}/${tag}-tip-equip.png` });
    // 提示框：背包耗尽血石
    o = await scan(page); const xs = o.icons.find(i => i.k === 'item_stone_x');
    if (touch) { await page.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; P.sel = null; P.render(); }); await sleep(300); o = await scan(page); }
    const xi = o.icons.find(i => i.k === 'item_stone_x');
    if (touch) await page.touchscreen.tap(xi.x + xi.w / 2, xi.y + xi.h / 2); else await page.mouse.move(xi.x + xi.w / 2, xi.y + xi.h / 2); await sleep(500);
    const tip2 = await page.evaluate(() => { const t = window.__game.scene.getScene('UI').panel.tip; if (!t) return []; const out = []; const walk = l => l.forEach(o => { if (o.type === 'Text') out.push(o.text); if (o.list) walk(o.list); }); walk(t.list); return out; });
    chk(tip2.some(t => /耗尽/.test(t)) && tip2.some(t => t === '红储量 0/300000'), `${tag} 耗尽血石提示框写明耗尽（${tip2.filter(t => /储量|耗尽/.test(t)).join(' ')}）`);
    await page.screenshot({ path: `${dir}/${tag}-tip-empty.png` });
    // 实时更新 + 重绘保护（不改 tickStone：直接走 World.tickStone 一次）
    const live = await page.evaluate(() => { const P = window.__game.scene.getScene('UI').panel, B = window.__game.scene.getScene('Battle'), w = B.world, now = () => P.s.time.now;
      P.sel = null; P.hideTip(); P.render(); const res = {};
      P.lastDown = -1e9; P.lastAuto = -1e9; res.same = P.refreshIfStale();                    // 无变化：不重绘
      w.town = null; w.hero.hp = 1; w.hero.potReady = 0; w.stoneHpReady = 0; w.hero.hots = []; const h0 = w.equip.stone.charge.hp; w.tickStone?.(); res.used = h0 - w.equip.stone.charge.hp;
      if (!res.used) w.equip.stone.charge.hp -= 1500;                                          // tickStone 条件不满足时直接模拟消耗
      P.sel = 'x'; res.selBlock = P.refreshIfStale(); P.sel = null;                            // 有选中：不重绘
      P.lastDown = now(); res.downBlock = P.refreshIfStale(); P.lastDown = -1e9;               // 按下 800ms 内：不重绘
      P.lastAuto = -1e9; res.redraw = P.refreshIfStale(); res.again = P.refreshIfStale();      // 变化：重绘一次，之后不再重绘
      return res; });
    chk(live.same === false, `${tag} 数值不变不重绘`); chk(live.selBlock === false && live.downBlock === false, `${tag} 有选中/按下 800ms 内不重绘（保护保留）`);
    chk(live.redraw === true && live.again === false, `${tag} 储量变化重绘一次（tickStone 消耗 ${live.used}）`);
    o = await scan(page); chk(o.caps.some(c => c.t !== '50k/50k' && /\/50k$/.test(c.t) && /ff9090/i.test(c.c)), `${tag} 装备栏红量已更新（${o.caps.filter(c => /\/50k$/.test(c.t)).map(c => c.t).join(' ')}）`);
    // 装备栏耗尽状态
    await page.evaluate(() => { const P = window.__game.scene.getScene('UI').panel, w = window.__game.scene.getScene('Battle').world; w.equip.stone.charge = { hp: 0, mp: 0 }; P.render(); }); await sleep(400);
    o = await scan(page); const eqs = o.slots.find(s => s.n === 'eq_stone');
    chk(o.empty.some(e => inside(e, eqs, 2)), `${tag} 装备栏血石耗尽显示「耗尽」且在格内`);
    await page.screenshot({ path: `${dir}/${tag}-equip-empty.png` });
    chk(w.errs.length === 0, `${tag} 无 console error ${w.errs.slice(0, 2).join(' | ')}`);
    await page.close();
  }
} catch (e) { console.error(e); fail++; } finally { await b.close(); sv.stop?.(); sv.kill?.(); }
console.log(JSON.stringify(report)); console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
