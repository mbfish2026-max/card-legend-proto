// feat/eg-sets：背包真实 E4 图标 + 套装 tooltip 截图（1280×720 / 844×390）
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/card-legend-proto-research/shots/eg-sets'; mkdirSync(dir, { recursive: true });
const save = JSON.parse(readFileSync(process.argv[3] ?? '/tmp/eg-save.json', 'utf8'));
const sv = await startPreview(), b = await launch(); const out = {};
const slots = page => page.evaluate(() => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, r = [];
  const walk = l => l.forEach(o => { if (o.getData?.('slot')) { const bb = o.getBounds(); r.push({ x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY - wv.y) * cv.height / wv.height }); } if (o.list) walk(o.list); }); walk(s.children.list); return r; });
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page); const r = (out[`${vw}x${vh}`] = {});
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(1500);
    r.icons = await page.evaluate(() => Object.keys(window.__game.textures.list).filter(k => /^item_(leiting|zhanshen|nuzhan|tianmo|shenglong|shengzhan|fengtian|bazhe|kaitian|longya|xuantian|molong)/.test(k)).length);
    await page.screenshot({ path: `${dir}/eg-bag-${vw}.png` });
    const cv = await page.evaluate(() => { const c = window.__game.canvas.getBoundingClientRect(); return { l: c.left, t: c.top, w: c.width, h: c.height }; });
    const at = (fx, fy) => ({ x: cv.l + fx * cv.w, y: cv.t + fy * cv.h }); const sl = { 4: at(160 / 1024, 197 / 576), 9: at(479 / 1024, 167 / 576) };
    const pick = async (i, name) => { const p = sl[i]; if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.move(p.x, p.y); await sleep(600);
      r[name] = await page.evaluate(() => window.__game.scene.getScene('UI').panel.tip ? 'tip' : null); await page.screenshot({ path: `${dir}/eg-${name}-${vw}.png` }); };
    await pick(4, 'tip-equipped'); if (touch) { await page.touchscreen.tap(10, vh - 10); await sleep(400); }
    await pick(9, 'tip-bag');
    r.errs = w.errs.slice(0, 5); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/eg-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
