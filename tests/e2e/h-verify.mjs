// H1–H4 未验证项的浏览器验证：a 低特效上限 / b 特效素材 404 降级 / c 手机横屏触屏整局
// 用法：npm run build && node tests/e2e/h-verify.mjs [a|b|c]
import { startPreview, launch, watch, texts, findPos, sleep } from './lib.mjs';
const only = process.argv[2];
const MOBILE = { viewport: { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 3 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const out = {};

/** 法师 40 级、学会全部技能、蓝无限，连续释放所有技能 dur 毫秒，每帧统计同屏 fx_ 精灵数 */
async function stress(page, dur = 8000) {
  await page.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world, { timeout: 30000 });
  await sleep(4000); // 等 Preload 分批加载特效图集
  return page.evaluate(async dur => {
    const s = window.__game.scene.getScene('Battle'), w = s.world;
    w.learned = new Set(w.skillPool.map(x => x.id));
    const keys = w.skills.map(x => x.key);
    const fxTex = Object.keys(window.__game.textures.list).filter(k => k.startsWith('fx_'));
    let maxFx = 0, maxGfx = 0, frames = 0; const baseGfx = s.children.list.filter(o => o.type === 'Graphics').length;
    const count = () => { let n = 0, g = 0; s.children.list.forEach(o => { if (o.type === 'Sprite' && o.texture?.key?.startsWith('fx_')) n++; if (o.type === 'Graphics') g++; }); maxFx = Math.max(maxFx, n); maxGfx = Math.max(maxGfx, g); frames++; };
    s.events.on('postupdate', count);
    const t0 = performance.now();
    while (performance.now() - t0 < dur) {
      const h = w.hero; if (h) { h.hp = h.maxHp = 1e9; h.mp = h.maxMp = 1e9; }
      w.alive('enemy').forEach(e => { e.hp = e.maxHp = 1e9; });
      for (const k of keys) { s.cds.fill(0); try { s.onKey(k); } catch (e) { return { err: String(e) }; } }
      await new Promise(r => setTimeout(r, 60));
    }
    s.events.off('postupdate', count);
    return { maxFx, maxGfx, baseGfx, frames, skills: keys.length, fxTexLoaded: fxTex.length };
  }, dur);
}

const b = await launch();
try {
  if (!only || only === 'a') {
    const sv = await startPreview();
    for (const low of [true, false]) {
      const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
      await page.evaluateOnNewDocument(low => localStorage.setItem('fcl_settings_v1', JSON.stringify({ lowFx: low })), low);
      await page.goto(sv.url + '?class=mage&lv=40');
      const r = await stress(page);
      out[`a_lowFx_${low ? 'on' : 'off'}`] = { ...r, expectedCap: low ? 10 : 28, errors: w.errs.length, errSample: w.errs.slice(0, 3) };
      await page.close();
    }
    sv.stop();
  }
  if (!only || only === 'b') {
    for (const [name, block, low] of [['fx_all_404', u => u.includes('/assets/fx/')], ['fx_json_404', u => u.includes('/assets/fx/') && u.endsWith('.json')], ['fx+sfx_404', u => u.includes('/assets/fx/') || u.includes('/assets/sfx/')], ['fx_all_404_lowFx', u => u.includes('/assets/fx/'), true]]) {
      const sv = await startPreview({ block }); const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
      if (low) await page.evaluateOnNewDocument(() => localStorage.setItem('fcl_settings_v1', JSON.stringify({ lowFx: true })));
      await page.goto(sv.url + '?class=mage&lv=40');
      const r = await stress(page, 5000);
      const alive = await page.evaluate(() => !!window.__game.scene.getScene('Battle').sys.isActive() && window.__game.loop.actualFps);
      out['b_' + name] = { ...r, sceneAliveFps: alive, pageErrors: w.errs.filter(e => !/Failed to load resource/.test(e)), http404: w.errs.filter(e => /404/.test(e)).length, fallbackWarns: w.warns.filter(x => /回退|fallback|missing|缺失/i.test(x)).length };
      await page.close(); sv.stop();
    }
  }
  if (!only || only === 'c') {
    const sv = await startPreview(); const page = await b.newPage(); await page.emulate(MOBILE); const w = watch(page);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const tap = async (k, re) => { const p = await findPos(page, k, re); if (!p) throw new Error('找不到按钮 ' + re); await page.touchscreen.tap(p.x, p.y); await sleep(800); };
    await tap('Title', '新'); await tap('Title', '^战士$');
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const layout = await page.evaluate(() => {
      const cv = window.__game.canvas.getBoundingClientRect(), ui = window.__game.scene.getScene('UI'); const bad = [];
      const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible && o.text) { const b = o.getBounds(); if (b.left < -1 || b.top < -1 || b.right > 1281 || b.bottom > 721) bad.push(o.text.slice(0, 20)); } if (o.list) walk(o.list); });
      walk(ui.children.list);
      return { canvas: [Math.round(cv.left), Math.round(cv.top), Math.round(cv.width), Math.round(cv.height)], inViewport: cv.left >= 0 && cv.top >= 0 && cv.right <= innerWidth + 0.5 && cv.bottom <= innerHeight + 0.5, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], textOverflow: bad, padOn: !!ui.pad || !!document.querySelector('canvas') };
    });
    const right = await findPos(page, 'UI', '^▶$');
    const st = () => page.evaluate(() => { const s = window.__game.scene.getScene('Battle'), w = s.world, h = w.hero; return { x: h ? Math.round(h.x) : null, hp: h?.hp, maxHp: h?.maxHp, floor: w.floorIndex, state: s.state, atExit: w.atExit, kills: w.kills, near: h ? w.alive('enemy').filter(e => Math.abs(e.x - h.x) < 260).length : 0, left: w.alive('enemy').length, fps: window.__game.loop.actualFps }; });
    const fps = []; let holding = false, s0 = await st(), deaths = 0, potions = 0, lastX = s0.x, moved = 0; const t0 = Date.now(); let s = s0;
    while (Date.now() - t0 < 240000) {
      s = await st(); fps.push(s.fps);
      if (s.floor >= 1) break;
      if (s.state === 'dead') { deaths++; if (holding) { await page.touchscreen.touchEnd(); holding = false; } await sleep(3500); continue; }
      if (s.hp / s.maxHp < 0.35) { const p = await findPos(page, 'UI', '^1$'); void p; await page.evaluate(() => window.__game.scene.getScene('Battle').onKey('1')); potions++; }
      if (s.atExit && s.left === 0 || s.atExit) { if (holding) { await page.touchscreen.touchEnd(); holding = false; } await tap('UI', '^传送$'); await sleep(1500); continue; }
      const want = s.near === 0;
      if (want && !holding) { await page.touchscreen.touchStart(right.x, right.y); holding = true; }
      if (!want && holding) { await page.touchscreen.touchEnd(); holding = false; }
      if (s.x > lastX) moved++; lastX = s.x;
      await sleep(400);
    }
    if (holding) await page.touchscreen.touchEnd();
    const f = fps.filter(Boolean);
    out.c_mobile_844x390 = { layout, start: s0, end: s, secs: Math.round((Date.now() - t0) / 1000), deaths, potionsUsed: potions, touchMoveTicks: moved, fps: { min: Math.round(Math.min(...f)), avg: Math.round(f.reduce((a, b) => a + b, 0) / f.length), max: Math.round(Math.max(...f)) }, errors: w.errs, completedFloor1: s.floor >= 1 };
    await page.close(); sv.stop();
  }
} finally { await b.close(); }
console.log(JSON.stringify(out, null, 1));
