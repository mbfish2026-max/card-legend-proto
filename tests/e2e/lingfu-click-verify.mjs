// fix/lingfu-click-close：电脑鼠标「点一下」（move/down/up，不按住）打开面板后应保持打开；点外面/✕ 才关；手机触摸不回归。
// 同时检查同类入口：灵符入口 + 右下 5 个菜单圆钮（角色/悬赏/技能/商店/设置）。用法：npm run build && node tests/e2e/lingfu-click-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/lingfu-click'; mkdirSync(dir, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch();
// 逻辑坐标 → 屏幕坐标（UI 场景相机）
const scr = (page, x, y) => page.evaluate((x, y) => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView; return { x: cv.left + (x - wv.x) * cv.width / wv.width, y: cv.top + (y - wv.y) * cv.height / wv.height }; }, x, y);
const mode = page => page.evaluate(() => window.__game.scene.getScene('UI').panel.mode);
// 事件记录：DOM pointerdown/pointerup/click + 面板打开/关闭（谁触发）
const trace = page => page.evaluate(() => { const L = window.__trace = []; const p = window.__game.scene.getScene('UI').panel, t0 = performance.now(), T = () => (performance.now() - t0).toFixed(0);
  for (const ev of ['pointerdown', 'pointerup', 'click']) window.addEventListener(ev, e => L.push(`${T()} ${ev}(${e.pointerType ?? ''})`), true);
  const oc = p.close.bind(p), ot = p.toggle.bind(p); p.close = () => { L.push(`${T()} panel.close mode=${p.mode} ${new Error().stack.split('\n').slice(2, 4).map(s => s.trim().replace(/\(.*\//, '(')).join(' < ')}`); return oc(); };
  p.toggle = m => { L.push(`${T()} panel.toggle(${m})`); return ot(m); }; });
const click = async (page, q) => { await page.mouse.move(q.x, q.y); await page.mouse.down(); await sleep(60); await page.mouse.up(); };
try {
  for (const touch of [false, true]) {
    const [vw, vh] = touch ? [844, 390] : [1280, 720], tag = touch ? 'm844' : 'd1280';
    const page = await b.newPage(); if (touch) await page.setUserAgent(UA);
    await page.setViewport({ width: vw, height: vh, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('UI')?.panel, { timeout: 60000 }); await sleep(1500);
    await trace(page);
    if (!touch) {
      const entries = [['灵符', 1226, 596, 'lingfu'], ...['角色', '悬赏', '技能', '商店', '设置'].map((n, i) => [n, 1070 + i * 48, 648, null])];
      for (const [nm, x, y, want] of entries) {
        await page.evaluate(() => { window.__trace.length = 0; const p = window.__game.scene.getScene('UI').panel; if (p.mode) p.close(); }); await sleep(300);
        await click(page, await scr(page, x, y)); await sleep(700);
        const m = await mode(page), tr = await page.evaluate(() => window.__trace.slice());
        console.log(`  ${tag} ${nm}: ${tr.join(' | ')}`);
        if (nm === '商店') { ok(m === null && !tr.some(l => /close/.test(l)), `${tag} 「商店」野外按设计不开面板（提示回城），无误关`); continue; } // BattleScene.openPanel：战斗地图没有商人
        ok(m !== null && (!want || m === want), `${tag} 鼠标点一下「${nm}」→ 面板保持打开（mode=${m}）`);
        if (nm === '灵符' && m) { await page.screenshot({ path: `${dir}/${tag}-lingfu-open.png` });
          await click(page, await scr(page, 640, 360)); await sleep(500); ok(await mode(page) === 'lingfu', `${tag} 点灵符面板内 → 不关`);
          await click(page, await scr(page, 70, 360)); await sleep(500); ok(await mode(page) === null, `${tag} 点灵符面板外 → 关闭`);
          await click(page, await scr(page, x, y)); await sleep(700); ok(await mode(page) === 'lingfu', `${tag} 再点入口 → 重新打开`); }
        if (m) { // ✕ 关闭（桌面 ✕ 在 640+W/2-26, top+22）
          const q = await page.evaluate(() => { let r = null; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.text === '✕' && o.visible) { const b = o.getBounds(); r = { x: b.centerX, y: b.centerY }; } if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').panel.root?.list ?? []); return r; });
          if (q) { await click(page, await scr(page, q.x, q.y)); await sleep(500); ok(await mode(page) === null, `${tag} 「${nm}」点 ✕ → 关闭`); } else ok(false, `${tag} 「${nm}」找不到 ✕`);
        }
      }
    } else {
      const q = await page.evaluate(() => { const r = document.getElementById('mh-shop').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.touchscreen.tap(q.x, q.y); await sleep(700); const tr = await page.evaluate(() => window.__trace.slice()); console.log(`  ${tag} 灵符: ${tr.join(' | ')}`);
      ok(await mode(page) === 'lingfu', `${tag} 触摸点「灵符商城」→ 保持打开`); await page.screenshot({ path: `${dir}/${tag}-lingfu-open.png` });
      const o = await scr(page, 640, 360); await page.touchscreen.tap(o.x, o.y); await sleep(500); ok(await mode(page) === 'lingfu', `${tag} 触摸点面板内 → 不关`);
      const out = await scr(page, 20, 700); await page.touchscreen.tap(out.x, out.y); await sleep(500); ok(await mode(page) === null, `${tag} 触摸点面板外 → 关闭`);
    }
    ok(w.errs.length === 0, `${tag} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fails ? `FAIL ${fails}` : 'ALL OK'); process.exit(fails ? 1 : 0);
