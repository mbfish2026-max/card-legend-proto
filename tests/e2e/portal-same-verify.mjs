// 「下一层」/「上一层」两个传送门：同源素材、方向文字、点击区 ≥44 CSS、点击换层（fix/portal-same）
// 用法：npm run build && node tests/e2e/portal-same-verify.mjs [截图目录] [前缀]；ROOT=<dist> 拍修前图；NOASSERT=1 只拍图；NOART=1 屏蔽传送门贴图（应回退程序绘制且仍可点）
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/portal-same'; const pre = process.argv[3] ?? 'after'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '1280x720,844x390,932x430,874x402').split(',').map(s => s.split('x').map(Number));
const NOASSERT = !!process.env.NOASSERT, NOART = !!process.env.NOART;
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : (NOASSERT ? 'info' : 'FAIL'), m); if (!c && !NOASSERT) fail++; };
const sv = await startPreview(process.env.ROOT ? { root: process.env.ROOT } : {}), b = await launch();
// 页面内：传送门（which=next|back）的贴图来源、文字、点击区屏幕矩形
const probe = which => {
  const s = window.__game.scene.getScene('Battle'), c = which === 'next' ? s.portal : s.merchant;
  const walk = o => [o, ...(o.list ?? []).flatMap(walk)], all = walk(c);
  const tex = [...new Set(all.filter(o => o.texture && o.texture.key !== '__WHITE' && o.texture.key !== '__DEFAULT' && o.type !== 'Text').map(o => o.texture.key))];
  const txt = all.filter(o => o.type === 'Text' && o.visible).map(o => o.text);
  const hit = all.find(o => o.input?.enabled);
  let r = null;
  if (hit) {
    const cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, m = hit.getWorldTransformMatrix(), ha = hit.input.hitArea;
    const ox = hit.displayOriginX ?? 0, oy = hit.displayOriginY ?? 0; // Zone/Sprite 的 hitArea 以左上角为 0，需扣 displayOrigin（与 Phaser 命中测试一致）
    const pts = [[ha.x - ox, ha.y - oy], [ha.x + ha.width - ox, ha.y + ha.height - oy]].map(([x, y]) => { const p = m.transformPoint(x, y); return [cv.left + (p.x - wv.x) * cv.width / wv.width, cv.top + (p.y - wv.y) * cv.height / wv.height]; });
    r = { l: Math.min(pts[0][0], pts[1][0]), r: Math.max(pts[0][0], pts[1][0]), t: Math.min(pts[0][1], pts[1][1]), b: Math.max(pts[0][1], pts[1][1]) };
  }
  return { tex, txt, r, art: c.getData?.('portalArt') ?? null, flip: all.some(o => o.flipX), vis: c.visible };
};
// 可点的点：点击区与视口交集里、不被手机 DOM HUD 盖住（elementFromPoint 为 canvas）
const spot = r => {
  const vw = innerWidth, vh = innerHeight, l = Math.max(0, r.l), t = Math.max(0, r.t), R = Math.min(vw, r.r), B = Math.min(vh, r.b);
  if (R - l < 1 || B - t < 1) return null; const cvs = window.__game.canvas; let best = null, free = 0, tot = 0;
  for (let y = t + 2; y < B - 1; y += 4) for (let x = l + 2; x < R - 1; x += 4) { tot++; const e = document.elementFromPoint(x, y); if (e === cvs) { free++; const d = Math.hypot(x - (l + R) / 2, y - (t + B) / 2); if (!best || d < best.d) best = { x, y, d }; } }
  return { vis: { w: R - l, h: B - t }, free: free / Math.max(1, tot), p: best };
};
try {
  for (const [VW, VH] of VPS) {
    const mob = VW !== 1280, tag = `${mob ? 'm' : 'd'}${VW}x${VH}`;
    const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const w = watch(p);
    if (NOART) await p.setBypassServiceWorker(true), await p.setRequestInterception(true), p.on('request', r => /portal_exit/.test(r.url()) ? r.abort() : r.continue());
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t0 = await findPos(p, 'Title', '继'); mob ? await p.touchscreen.tap(t0.x, t0.y) : await p.mouse.click(t0.x, t0.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle').state === 'play', { timeout: 30000 }); await sleep(1500);
    const tap = async q => mob ? p.touchscreen.tap(q.x, q.y) : p.mouse.click(q.x, q.y);
    const floor = () => p.evaluate(() => window.__game.scene.getScene('Battle').world.floorIndex);
    // —— 下一层：清怪、英雄站到出口前
    await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.alive('enemy').forEach(u => { u.hp = 0; }); W.farmQueue = []; W.hero.x = W.exitX - 30; });
    await p.waitForFunction(() => { const W = window.__game.scene.getScene('Battle').world; W.alive('enemy').forEach(u => { u.hp = 0; }); W.farmQueue = []; if (Math.abs(W.hero.x - (W.exitX - 30)) > 60) W.hero.x = W.exitX - 30; return W.cleared && W.atExit; }, { timeout: 15000, polling: 200 }).catch(() => {}); await sleep(900);
    const nx = await p.evaluate(probe, 'next');
    // 截图：英雄退开 260px，免得卡牌挡住门（清怪后门为不透明）
    await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.hero.x = W.exitX - 300; }); await sleep(1500);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-next.png` });
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.x = W.exitX - 30; }); await sleep(600);
    // —— 上一层（先在本层拍，换层验证放最后）
    const bx0 = await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.hero.x = 220; const v = s.views.get(W.hero.uid); if (v) v.x = 220; s.cameras.main.setScroll(0, s.cameras.main.scrollY); return 0; }); await sleep(1200);
    await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.hero.x = 480; const v = s.views.get(W.hero.uid); if (v) v.x = 480; s.cameras.main.setScroll(0, s.cameras.main.scrollY); }); await sleep(900);
    await p.screenshot({ path: `${dir}/${pre}-${tag}-back.png` });
    await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.hero.x = 220; const v = s.views.get(W.hero.uid); if (v) v.x = 220; s.cameras.main.setScroll(0, s.cameras.main.scrollY); }); await sleep(900);
    const bk = await p.evaluate(probe, 'back');
    console.log(`  ${tag} next=${JSON.stringify({ tex: nx.tex, art: nx.art, txt: nx.txt })} back=${JSON.stringify({ tex: bk.tex, art: bk.art, txt: bk.txt })}`);
    chk(nx.tex.length > 0 && nx.tex.join() === bk.tex.join() || (NOART && nx.art && nx.art === bk.art), `${tag} 两入口素材同源 next=[${nx.tex}] back=[${bk.tex}]`);
    chk(nx.art && nx.art === bk.art, `${tag} 两入口同一创建函数（portalArt=${nx.art}/${bk.art}）`);
    chk(nx.flip !== bk.flip || (NOART && nx.art === 'portalArt:gfx'), `${tag} 下一层镜像区分方向（flip next=${nx.flip} back=${bk.flip}）`);
    chk(nx.txt.some(x => /下一层/.test(x)) && bk.txt.some(x => /上一层|返回/.test(x)), `${tag} 方向文字 next=${nx.txt.join('|')} back=${bk.txt.join('|')}`);
    for (const [nm, q] of [['下一层', nx], ['上一层', bk]]) chk(q.r && q.r.r - q.r.l >= 44 && q.r.b - q.r.t >= 44, `${tag} ${nm} 点击区 ≥44 CSS ${q.r ? `${(q.r.r - q.r.l).toFixed(0)}×${(q.r.b - q.r.t).toFixed(0)}` : '无'}`);
    // 上一层点击 → 换层
    { const sp = bk.r && await p.evaluate(spot, bk.r); chk(sp && sp.vis.w >= 44 && sp.vis.h >= 44, `${tag} 上一层 屏内（含 HUD 下）区域 ${sp ? `${sp.vis.w.toFixed(0)}×${sp.vis.h.toFixed(0)} 未被 HUD 盖 ${(sp.free * 100).toFixed(0)}%` : '无'}`);
      // 手机左下角摇杆区（#mh-joy）整块盖住左端传送门（main 上即如此）：门本体点不到时走「进入」大键（显示「上一层」），并如实记录
      const f0 = await floor(); let via = 'portal';
      if (sp?.p) await tap(sp.p); else if (mob) { via = '进入键'; const a = await p.evaluate(() => { const e = document.getElementById('mh-act'), r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: e.textContent }; }); console.log(`  ${tag} 上一层门被 HUD 盖住，改点「${a.t}」`); await tap(a); }
      const ok = await p.waitForFunction(f => window.__game.scene.getScene('Battle').world.floorIndex !== f && !window.__game.scene.getScene('Battle').fading, { timeout: 8000 }, f0).then(() => true, () => false);
      chk(ok, `${tag} 点上一层（${via}）→ 换层 ${f0}→${await floor()}`); }
    // 下一层点击 → 换层
    await sleep(800);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.alive('enemy').forEach(u => { u.hp = 0; }); W.farmQueue = []; W.hero.x = W.exitX - 30; });
    await p.waitForFunction(() => { const W = window.__game.scene.getScene('Battle').world; W.alive('enemy').forEach(u => { u.hp = 0; }); W.farmQueue = []; if (Math.abs(W.hero.x - (W.exitX - 30)) > 60) W.hero.x = W.exitX - 30; return W.cleared && W.atExit; }, { timeout: 15000, polling: 200 }).catch(() => {}); await sleep(900);
    { const q = await p.evaluate(probe, 'next'), sp = q.r && await p.evaluate(spot, q.r);
      chk(sp?.p && sp.vis.w >= 44 && sp.vis.h >= 44, `${tag} 下一层 屏内可点区 ${sp ? `${sp.vis.w.toFixed(0)}×${sp.vis.h.toFixed(0)} 未被 HUD 盖 ${(sp.free * 100).toFixed(0)}%` : '无'}`);
      const f0 = await floor(); console.log(`  ${tag} 下一层前 ${JSON.stringify(await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'); return { e: s.entranceHere(), st: s.state, pz: s.paused, fd: s.fading, cl: s.world.cleared, ax: s.world.atExit, sp: null }; }))} tap=${JSON.stringify(sp?.p)}`); if (sp?.p) await tap(sp.p);
      const ok = await p.waitForFunction(f => window.__game.scene.getScene('Battle').world.floorIndex !== f, { timeout: 8000 }, f0).then(() => true, () => false);
      if (!ok) console.log('  log:', await p.evaluate(() => window.__game.scene.getScene('Battle').hud?.lines?.slice(-4).map(l => l.t).join(' / ')));
      chk(ok, `${tag} 点下一层 → 换层 ${f0}→${await floor()}`); }
    const errs = w.errs.filter(e => !(NOART && /ERR_FAILED/.test(e))); chk(errs.length === 0, `${tag} 无 JS 错误 ${errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
