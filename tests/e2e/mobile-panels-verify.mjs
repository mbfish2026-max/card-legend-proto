// 手机版角色/背包/技能面板与药水栏：截图 + 断言图集帧在用、药水点击区 ≥44px、不重叠不出屏
// 用法：npm run build && node tests/e2e/mobile-panels-verify.mjs [截图目录] [前缀]；NOATLAS=1 模拟图集缺失（应回退旧绘制且无 JS 错误）
import { startPreview, launch, watch, sleep, findPos, toScreen } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/m-panels'; const pre = process.argv[3] ?? 'after'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '844x390,932x430').split(',').map(s => s.split('x').map(Number));
const NOATLAS = !!process.env.NOATLAS;
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const frames = () => window.__game.scene.getScene('UI').children.list.flatMap(function walk(o) { return [o, ...(o.list ?? []).flatMap(walk)]; })
  .filter(o => o.visible && o.texture?.key === 'ui_atlas').map(o => o.frame.name);
try {
  for (const [VW, VH] of VPS) {
    const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const w = watch(p);
    if (NOATLAS) await p.setBypassServiceWorker(true), await p.setRequestInterception(true), p.on('request', r => /ui_atlas|\/ui\/dom\//.test(r.url()) ? r.abort() : r.continue());
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && document.getElementById('mhud'), { timeout: 30000 }); await sleep(1500);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (const s of W.skillPool.slice(0, 8)) W.learned.add(s.id); W.recompute?.();
      ['common', 'magic', 'rare'].forEach(r => W.bag.push(W.makeItem('black_iron', r), W.makeItem('return_scroll', r))); });
    const tag = `${VW}x${VH}`;
    // 药水栏
    const geo = await p.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
      const pots = [...document.querySelectorAll('#mh-pots .b')].map(r), sk = [...document.querySelectorAll('#mhud .sk, #mhud [data-id^="sk"], #mh-page')].filter(e => getComputedStyle(e).display !== 'none').map(r);
      return { pots, sk, vw: innerWidth, vh: innerHeight }; });
    const ov = (a, c) => a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
    chk(geo.pots.length === 3 && geo.pots.every(q => q.w >= 44 && q.h >= 44), `${tag} 药水点击区 ≥44px ${geo.pots.map(q => q.w.toFixed(0) + '×' + q.h.toFixed(0)).join(' ')}`);
    chk(geo.pots.every(q => q.l >= 0 && q.t >= 0 && q.r <= geo.vw && q.b <= geo.vh), `${tag} 药水不出屏`);
    chk(geo.pots.every((q, i) => geo.pots.every((o, j) => i === j || !ov(q, o))), `${tag} 药水之间不重叠`);
    chk(geo.sk.length > 0 && geo.pots.every(q => geo.sk.every(o => !ov(q, o))), `${tag} 药水不挤占技能栏（${geo.sk.length} 个技能键）`);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-hud.png` });
    let tabHit = null, hitsAll = [];
    for (const [mode, name] of [['bag', 'char'], ['skills', 'skills']]) {
      await p.evaluate(m => window.__game.scene.getScene('UI').panel.toggle(m), mode); await sleep(700);
      const fr = await p.evaluate(frames);
      const need = mode === 'bag' ? ['panel_frame_s', 'slot', 'qframe_common', 'qframe_magic', 'qframe_rare', 'tab_on', 'tab_off'] : ['panel_frame_s', 'list_row', 'tab_on', 'tab_off'];
      if (!NOATLAS) chk(need.every(n => fr.includes(n)) && fr.some(f => f.startsWith('btn')), `${tag} ${mode} 用到图集帧 ${[...new Set(fr)].sort().join(',')}`);
      else chk(fr.length === 0, `${tag} ${mode} 图集缺失 → 回退旧绘制 ${[...new Set(fr)].join(',')}`);
      await p.screenshot({ path: `${dir}/${pre}-${tag}-${name}.png` });
      { // 点击区：最小边 + 页签不与其它点击区重叠
        const hits = await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel, cv = window.__game.canvas.getBoundingClientRect(), R = window.__render ?? { lw: 1280 }, k = cv.width / R.lw, out = [];
          const walk = o => { (o.list ?? []).forEach(walk); if (o.input?.enabled && o.visible && o.input.hitArea?.width) { const m = o.getWorldTransformMatrix(), ha = o.input.hitArea; const sx = m.scaleX ?? 1;
            const x0 = m.tx + (ha.x - o.displayOriginX) * sx, y0 = m.ty + (ha.y - o.displayOriginY) * sx; out.push({ tab: o.getData?.('mtab') || false, n: o.name || o.type + ':' + (o.parentContainer?.list.find(c => c.type === 'Text')?.text ?? ''), l: cv.left + (x0 + (R.ox ?? 0)) * k, t: cv.top + y0 * cv.height / 720, r: cv.left + (x0 + (R.ox ?? 0) + ha.width * sx) * k, b: cv.top + (y0 + ha.height * sx) * cv.height / 720 }); } };
          window.__game.scene.getScene('UI').children.list.forEach(walk); return out; });
        const small = hits.filter(h => Math.min(h.r - h.l, h.b - h.t) < (VW <= 844 ? 36 : 44) - 0.5);
        chk(small.length === 0, `${tag} ${mode} 面板点击区最小边 ≥${VW <= 844 ? 36 : 44}px（${hits.length} 个，过小 ${small.length} ${JSON.stringify(small.map(h => [h.n, Math.round(h.r - h.l), Math.round(h.b - h.t)]))}）`);
        const tabs = hits.filter(h => h.tab); tabHit = tabs.find(h => h.tab === 'skills'); hitsAll = hits; const tov = hits.filter(o => !o.tab && (o.r - o.l) < geo.vw * 0.8 && tabs.some(t => ov(t, o))); chk(tabs.length === 2 && !ov(tabs[0], tabs[1]) && tov.length === 0, `${tag} ${mode} 页签点击区不与其它点击区重叠 ${JSON.stringify(tabs.concat(tov).map(h => [h.n, h.l, h.t, h.r, h.b].map(v => typeof v === "number" ? Math.round(v) : v)))}`);
        if (mode === 'bag') await p.screenshot({ path: `${dir}/${pre}-${tag}-bag.png` });
      }
      if (mode === 'bag') { // 点「技能」页签 → 切到技能面板（真实触屏点击页签点击区中心）
        const t = tabHit; if (t) {  await p.waitForFunction(() => window.__game.scene.getScene('UI').input._pendingInsertion.length === 0, { timeout: 20000 }).catch(() => {}); await p.touchscreen.tap((t.l + t.r) / 2, (t.t + t.b) / 2); await sleep(500); }
        chk(!!t && await p.evaluate(() => window.__game.scene.getScene('UI').panel.mode) === 'skills', `${tag} 点「技能」页签 → 技能面板`);
      }
      await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(300);
    }
    const errs = w.errs.filter(e => !(NOATLAS && /Failed to load resource: net::ERR_FAILED/.test(e))); chk(errs.length === 0, `${tag} 无 JS 错误 ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `${fail} FAIL` : 'ALL OK'); process.exit(fail ? 1 : 0);
