// feat/auto-hang P1：自动挂机 e2e（真实浏览器）。电脑 1280×720 + 手机 844×390/874×402/932×430：
//  入口点一下开 / 再点关 / 不闪（逐帧采样 hang.on）；J 键；巡逻击杀（位置变化 + 击杀数增加）；方向键接管关闭；
//  背包满 / 低血无药 / 阵亡 / 首领 / 清空 自动停止并出提示；测量按钮点击区与顶栏间距；0 控制台错误；截图。
// 用法：npm run build && node tests/e2e/auto-hang-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/auto-hang'; mkdirSync(dir, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const bag = Array.from({ length: 200 }, (_, i) => ({ uid: 1000 + i, item: 'iron_sword', name: '剑' + i, rarity: 'common', slot: 'weapon', stats: { atk: 1 }, req: 1, price: 1 }));
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [50, 50, 50, 50], floorIndex: 1, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch();
const run = (page, code, arg) => page.evaluate(new Function('arg', 'const B = window.__game.scene.getScene("Battle"), W = B.world; ' + code), arg);
const scr = (page, x, y) => page.evaluate((x, y) => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView; return { x: cv.left + (x - wv.x) * cv.width / wv.width, y: cv.top + (y - wv.y) * cv.height / wv.height }; }, x, y);
// 逐帧记录 hang.on 变化（判断「开了又关」闪烁）
const rec = page => page.evaluate(() => { const L = window.__hl = []; let last = null; const f = () => { const on = window.__game.scene.getScene('Battle').hang.on; if (on !== last) { L.push(on); last = on; } window.__hraf = requestAnimationFrame(f); }; cancelAnimationFrame(window.__hraf); f(); });
const flips = page => page.evaluate(() => window.__hl.slice());
const banner = page => run(page, 'const t = window.__game.scene.getScene("UI").children.list.find(o => o.name === "hangBanner"); return t && t.visible ? t.text : "";');
const reset = async (page, extra = '') => { await run(page, `if (B.hang.on) B.stopHang('toggle'); B.state = 'play'; W.loadFloor(1); B.handle(W.drainEvents()); W.hero.hp = W.hero.maxHp; W.pots = [50, 50, 50, 50]; W.bag = []; ${extra}`); await sleep(900); };
const startHang = page => run(page, 'B.hangToggleAt = -1e9; B.toggleHang(); return B.hang.on;');
const waitStop = async (page, re, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const r = await run(page, 'return [B.hang.on, B.hangStopMsg];'); if (!r[0] && re.test(r[1])) return r[1]; await sleep(100); } return null; };
const report = {};
try {
  for (const [vw, vh] of [[1280, 720], [844, 390], [874, 402], [932, 430]]) {
    const touch = vw !== 1280, tag = `${vw}x${vh}`;
    const page = await b.newPage(); if (touch) await page.setUserAgent(UA);
    await page.setViewport({ width: vw, height: vh, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoAttack: false })); }, save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('UI')?.panel, { timeout: 60000 }); await sleep(1500);
    ok(!(await run(page, 'return B.hang.on;')), `${tag} 读档后挂机默认关`);
    // 1) 入口：点一下开、再点关、不闪
    let q, hit;
    if (!touch) { const r = await run(page, 'const o = window.__game.scene.getScene("UI").children.list.find(o => o.name === "hangEntry"); return o && { x: o.x, y: o.y, w: o.width, h: o.height };');
      q = await scr(page, r.x, r.y); const q2 = await scr(page, r.x + r.w / 2, r.y + r.h / 2), q1 = await scr(page, r.x - r.w / 2, r.y - r.h / 2); hit = { w: Math.round(q2.x - q1.x), h: Math.round(q2.y - q1.y), logical: r };
      const lf = await run(page, 'const o = window.__game.scene.getScene("UI").children.list.find(o => o.name === "lingfuEntry"); return { y: o.y, h: o.height };'); hit.gapToLingfu = Math.round((lf.y - lf.h / 2) - (r.y + r.h / 2));
    } else { const r = await page.evaluate(() => { const g = id => document.getElementById(id).getBoundingClientRect(); const h = g('mh-hang'), s = g('mh-shop'), tops = [...document.querySelectorAll('#mh-top .b')].map(e => e.getBoundingClientRect()); const topBottom = Math.max(...tops.map(t => t.bottom)); const hg = document.getElementById('mh-hang'); const all = [...document.querySelectorAll('#mhud *')].filter(e => e !== hg && !e.contains(hg) && !hg.contains(e) && getComputedStyle(e).display !== 'none').map(e => e.getBoundingClientRect()).filter(t => t.width); const ov = all.filter(t => !(t.right <= h.left || t.left >= h.right || t.bottom <= h.top || t.top >= h.bottom)).length; return { h: { l: h.left, t: h.top, w: h.width, hh: h.height }, gapShop: s.left - h.right, topBottom, gapTop: h.top - topBottom, ov, vh: innerHeight }; });
      q = { x: r.h.l + r.h.w / 2, y: r.h.t + r.h.hh / 2 }; hit = { w: Math.round(r.h.w), h: Math.round(r.h.hh), top: Math.round(r.h.t), gapToShop: Math.round(r.gapShop), topBarBottom: Math.round(r.topBottom), gapToTopBar: Math.round(r.gapTop), overlapTopBtns: r.ov }; }
    report[tag] = { hit }; console.log(`  ${tag} 挂机按钮`, JSON.stringify(hit));
    ok(hit.w >= 44 && hit.h >= 44, `${tag} 挂机按钮点击区 ≥44px（${hit.w}×${hit.h}）`);
    if (touch) ok(hit.overlapTopBtns === 0, `${tag} 挂机按钮不与顶栏按钮重叠（间距 ${hit.gapToTopBar}px）`);
    const press = async () => { if (touch) await page.touchscreen.tap(q.x, q.y); else { await page.mouse.move(q.x, q.y); await page.mouse.down(); await sleep(60); await page.mouse.up(); } };
    await rec(page); await press(); await sleep(800);
    ok(await run(page, 'return B.hang.on;') && JSON.stringify(await flips(page)) === '[false,true]', `${tag} 点一下 → 开启并保持（逐帧 ${JSON.stringify(await flips(page))}）`);
    await page.screenshot({ path: `${dir}/${tag}-hang-on.png` });
    await rec(page); await press(); await sleep(800);
    ok(!(await run(page, 'return B.hang.on;')) && JSON.stringify(await flips(page)) === '[true,false]', `${tag} 再点一下 → 关闭并保持（逐帧 ${JSON.stringify(await flips(page))}）`);
    if (!touch) { await page.keyboard.press('j'); await sleep(400); const on1 = await run(page, 'return B.hang.on;'); await sleep(300); await page.keyboard.press('j'); await sleep(400); ok(on1 && !(await run(page, 'return B.hang.on;')), `${tag} J 键开 / 再按关`); }
    // 2) 巡逻击杀
    if (!touch) {
      await reset(page); const x0 = await run(page, 'return W.hero.x;'), k0 = await run(page, 'return W.kills;'); await startHang(page);
      const xs = []; for (let i = 0; i < 25; i++) { await sleep(1000); xs.push(await run(page, 'return Math.round(W.hero.x);')); if (await run(page, 'return W.kills;') > k0 + 1) break; }
      const k1 = await run(page, 'return W.kills;'), on = await run(page, 'return [B.hang.on, B.hangStopMsg];');
      report.patrol = { x0: Math.round(x0), xs, kills: [k0, k1], on };
      ok(Math.max(...xs.map(x => Math.abs(x - x0))) > 100, `${tag} 挂机巡逻：位置变化（起 ${Math.round(x0)} → ${xs.join(',')}）`);
      ok(k1 > k0, `${tag} 挂机击杀数增加（${k0} → ${k1}）`);
      // 手动接管：方向键
      if (!on[0]) await startHang(page); await sleep(300);
      await page.keyboard.down('ArrowLeft'); await sleep(150); await page.keyboard.up('ArrowLeft'); await sleep(200);
      ok(!(await run(page, 'return B.hang.on;')) && /手动/.test(await run(page, 'return B.hangStopMsg;')), `${tag} 方向键 → 挂机关闭（${await run(page, 'return B.hangStopMsg;')}）`);
      await startHang(page); await sleep(200); await page.keyboard.press('d'); await sleep(200); ok(!(await run(page, 'return B.hang.on;')), `${tag} D 键 → 挂机关闭`);
      await startHang(page); await sleep(200); await page.keyboard.press('1'); await sleep(300); ok(await run(page, 'return B.hang.on;'), `${tag} 手动喝药（1）不关闭挂机`);
      await run(page, 'B.openPanel("bag");'); await sleep(300); const xp = await run(page, 'return [B.paused, W.hero.x, W.time];'); await sleep(800); const xq = await run(page, 'return [B.hang.on, W.hero.x, W.time];');
      ok(xp[0] && xq[0] && xq[1] === xp[1] && xq[2] === xp[2], `${tag} 打开面板 → 挂机暂停（仍为开启，位置/时间不变）`); await run(page, 'window.__game.scene.getScene("UI").panel.close();'); await sleep(300);
      await run(page, 'if (B.hang.on) B.stopHang("toggle");');
    } else {
      await reset(page); const x0 = await run(page, 'return W.hero.x;'); await startHang(page); await sleep(3000);
      ok(Math.abs(await run(page, 'return W.hero.x;') - x0) > 50, `${tag} 手机挂机巡逻：位置变化`);
      // 摇杆接管：模拟 pad.dx
      await run(page, 'window.__game.scene.getScene("UI").pad.dx = 1;'); await sleep(200); await run(page, 'window.__game.scene.getScene("UI").pad.dx = 0;');
      ok(!(await run(page, 'return B.hang.on;')), `${tag} 摇杆方向 → 挂机关闭`);
    }
    // 3) 自动停止条件
    const stops = [
      ['bagfull', /背包已满/, `W.bag = arg.bag.map(x => ({ ...x })); const h = W.hero; W.ground.push({ gid: 99001, item: 'iron_sword', name: '测试剑', rarity: 'common', x: h.x + 120, y: 0, landAt: W.time - 1, atk: 1, hp: 0, amount: 1, inv: { ...arg.bag[0], uid: 99001 } });`],
      ['lowhp', /血量过低/, 'W.pots = W.pots.map(() => 0); W.hero.hp = Math.ceil(W.hero.maxHp * 0.1);'],
      ['boss', /首领/, `const ids = [...new Set(W.floors.flatMap(f => f.spawns.map(s => s.id)))]; for (const id of ids) { W.spawnFoe(id, W.hero.x + 300, 0); const u = W.units[W.units.length - 1]; if (u.tier === 'boss') break; u.alive = false; } W.drainEvents();`],
      ['cleared', /已清空/, 'W.units.forEach(u => { if (u.team === "enemy") u.alive = false; }); W.ground = []; W.farmQueue = [];'],
    ];
    for (const [nm, re, code] of stops) {
      await reset(page); await startHang(page); await sleep(200); await page.evaluate(new Function('arg', 'const B = window.__game.scene.getScene("Battle"), W = B.world; ' + code), { bag });
      const m = await waitStop(page, re); await sleep(250); const bn = await banner(page);
      ok(!!m && re.test(bn), `${tag} ${nm} → 自动停止 + 提示「${m}」横幅「${bn}」`);
      if (nm === 'bagfull' || touch) await page.screenshot({ path: `${dir}/${tag}-stop-${nm}.png` });
    }
    { await reset(page); await startHang(page); await sleep(200); await run(page, 'W.kill(W.hero); B.handle(W.drainEvents());'); const m = await waitStop(page, /阵亡/, 2000); await sleep(300); const bn = await banner(page);
      ok(!!m && /阵亡/.test(bn), `${tag} 阵亡 → 停止 + 提示「${m}」`); await page.screenshot({ path: `${dir}/${tag}-stop-dead.png` });
      await page.waitForFunction(() => window.__game.scene.getScene('Battle').state === 'play', { timeout: 8000 }); await sleep(600);
      ok(!(await run(page, 'return B.hang.on;')), `${tag} 复活后不自动恢复挂机`); }
    report[tag].errs = w.errs.slice(0, 3); ok(w.errs.length === 0, `${tag} 0 控制台错误 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
} catch (e) { console.log('ERR', e); fails++; } finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(report)); console.log(fails ? `auto-hang FAIL ${fails}` : 'auto-hang ALL OK'); process.exit(fails ? 1 : 0);
