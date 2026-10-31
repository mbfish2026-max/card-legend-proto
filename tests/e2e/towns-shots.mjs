// feat/towns e2e：存档 town 字段直接进四座大城；检查背景/门面/NPC 已渲染、相机边界=街宽、走到门口可进店；截图 towns-*.png
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const bad = m => { fail++; (out.fails ??= []).push(m); };
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) for (const town of ['mengzhong', 'bairimen', 'fengmo', 'cangyue']) {
    const tag = `${town}-${vw}x${vh}`, page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    const save = { v: 1, cls: 'warrior', level: 40, exp: 0, gold: 500, pots: [5, 0, 0, 9], floorIndex: 30, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [], town };
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(t => window.__game.scene.getScene('Battle')?.world?.town === t, { timeout: 30000 }, town);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle').street?.list.some(o => o.name?.startsWith('shop:')), { timeout: 30000 }); await sleep(1200);
    const r = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), L = B.street.list;
      return { shops: L.filter(o => o.name?.startsWith('shop:')).length, npcs: L.filter(o => o.name?.startsWith('npc:')).length, missing: L.filter(o => o.texture?.key === '__MISSING').length, bw: B.cameras.main.getBounds().width }; });
    const steps = [0.08, 0.5, 0.92]; let i = 0;
    for (const f of steps) { const d = await page.evaluate(f => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.x = B.cameras.main.getBounds().width * f; return null; }, f); await sleep(900);
      await page.screenshot({ path: `${dir}/towns-${tag}-${++i}.png` }); }
    r.door = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, ds = W.streetDoors?.() ?? null; const d = W.nearDoor?.(); return d?.npc.name ?? null; });
    if (!r.shops || !r.npcs || r.missing) bad(tag + ' 渲染 ' + JSON.stringify(r)); if (w.errs.length) bad(tag + ' 控制台错误 ' + w.errs.slice(0, 2).join('|'));
    out[tag] = r; await page.close();
  }
} finally { await b.close(); sv.close?.(); sv.kill?.(); }
console.log(JSON.stringify(out, null, 1)); console.log(fail ? `FAIL ${fail}` : 'towns-shots OK'); process.exit(fail ? 1 : 0);
