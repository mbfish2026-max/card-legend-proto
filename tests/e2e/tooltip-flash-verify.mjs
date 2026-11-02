// fix/tooltip-flash：电脑鼠标悬停装备，提示框须稳定显示（≥1s 仍在、不闪），连续 ≥6 次悬停同一件每次都出现；移出才消失。
// 覆盖：野外战斗中 背包格/身上装备格；城内 武器店货架+背包、仓库。用法：npm run build && node tests/e2e/tooltip-flash-verify.mjs
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const N = +(process.env.N ?? 6), TRACE = !!process.env.TRACE;
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20 }, req: 4, price: 30 }, { uid: 3, item: 'iron_sword', name: '次铁剑', rarity: 'magic', slot: 'weapon', stats: { atk: 16 }, req: 4, price: 30 }];
const base = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
const sv = await startPreview(), b = await launch();
const instr = page => page.evaluate(() => { const p = window.__game.scene.getScene('UI').panel, L = window.__tl = [], t0 = performance.now(), T = () => (performance.now() - t0).toFixed(0);
  for (const f of ['showTip', 'hideTip', 'render', 'showCompare']) { const o = p[f].bind(p); p[f] = (...a) => { L.push(`${T()} ${f}`); return o(...a); }; }
  const r = p.refreshIfStale.bind(p); p.refreshIfStale = () => { const v = r(); if (v) L.push(`${T()} refreshIfStale→render snap=${p.statSnap()}`); return v; }; });
// 装备格屏幕坐标：which = bag | eq | any（全部 slot）
const slots = (page, which) => page.evaluate(w => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, r = [];
  const walk = l => l.forEach(o => { if (o.getData?.('slot') && o.input?.enabled) { const eq = /^eq_/.test(o.name ?? ''); if (w === 'any' || (w === 'eq') === eq) { const bb = o.getBounds(); r.push({ n: o.name, x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY - wv.y) * cv.height / wv.height }); } } if (o.list) walk(o.list); }); walk(s.children.list); return r; }, which);
const tip = page => page.evaluate(() => !!window.__game.scene.getScene('UI').panel.tip?.active);
// 一轮悬停：移到空处 → 移入格子（分 3 步，像真实鼠标）→ 每 100ms 采样 1.2s
async function hover(page, q, tag) {
  const res = [];
  for (let i = 0; i < N; i++) {
    await page.mouse.move(20, 700, { steps: 3 }); await sleep(250); await page.evaluate(() => { window.__tl.length = 0; });
    await page.mouse.move(q.x, q.y, { steps: 4 }); const smp = [];
    for (let k = 0; k < 12; k++) { await sleep(100); smp.push(await tip(page)); }
    const tl = await page.evaluate(() => window.__tl.slice()); res.push(smp);
    const good = smp.slice(1).every(Boolean);
    if (TRACE || !good) console.log(`  ${tag} #${i + 1} ${smp.map(v => v ? '█' : '·').join('')} ${tl.join(' | ')}`);
  }
  ok(res.every(s => s.slice(1).every(Boolean)), `${tag} 连续 ${N} 次悬停，提示每次都稳定显示 ≥1.1s`);
  await page.mouse.move(20, 700, { steps: 3 }); await sleep(300); ok(!(await tip(page)), `${tag} 移出 → 提示消失`);
}
try {
  for (const [nm, save, open] of [
    ['野外背包', base, async p => p.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag'))],
    ['城内武器店', { ...base, town: 'bichi' }, async p => p.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_weapon'))],
    ['城内仓库', { ...base, town: 'bichi', storage: [{ uid: 9, item: 'iron_sword', name: '仓库铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 18 }, req: 4, price: 30 }] }, async p => p.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_storage'))],
  ]) {
    const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    { const q = await findPos(page, 'Title', '继'); await page.mouse.click(q.x, q.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('UI')?.panel, { timeout: 60000 }); await sleep(1500);
    await open(page); await sleep(800); await instr(page);
    const all = await slots(page, 'any'); console.log(`  ${nm} mode=${await page.evaluate(() => window.__game.scene.getScene('UI').panel.mode)} slots=${all.map(s => s.n).join(',')}`);
    const bs = await slots(page, 'bag'), es = await slots(page, 'eq');
    if (nm === '野外背包') { ok(bs.length && es.length, `${nm} 找到背包格/装备格`); if (bs[0]) await hover(page, bs[0], `${nm}·背包格`); const ew = es.find(s => /weapon/.test(s.n)) ?? es[0]; if (ew) await hover(page, ew, `${nm}·装备栏`); }
    else { ok(all.length > 0, `${nm} 找到格子 ${all.length}`); if (all[0]) await hover(page, all[0], `${nm}·${all[0].n}`); const last = all[all.length - 1]; if (last && last !== all[0]) await hover(page, last, `${nm}·${last.n}`); }
    ok(w.errs.length === 0, `${nm} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fails ? `FAIL ${fails}` : 'ALL OK'); process.exit(fails ? 1 : 0);
