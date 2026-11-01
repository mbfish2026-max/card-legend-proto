// feat/mobile-tapclose：手机版点对比面板外关闭；桌面行为不变
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20 }, req: 4, price: 30 }, { uid: 3, item: 'iron_sword', name: '次铁剑', rarity: 'magic', slot: 'weapon', stats: { atk: 16 }, req: 4, price: 30 }];
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {};
const slots = page => page.evaluate(() => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, r = [];
  const walk = l => l.forEach(o => { if (o.getData?.('slot')) { const bb = o.getBounds(); r.push({ x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY - wv.y) * cv.height / wv.height }); } if (o.list) walk(o.list); }); walk(s.children.list); return r; });
const state = page => page.evaluate(() => { const p = window.__game.scene.getScene('UI').panel; return { sel: p.sel, tip: !!p.tip, cmp: p.tip?.name ?? null }; });
try {
  for (const [vw, vh, touch] of [[844, 390, true], [1280, 720, false]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page); const r = (out[`${vw}x${vh}`] = { steps: [] });
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(800);
    const step = async (name) => { await sleep(400); const st = await state(page); r.steps.push({ name, ...st }); await page.screenshot({ path: `${dir}/tapclose-${name}-${vw}.png` }); return st; };
    // 背包第 1 格（好铁剑）：EQUIP_SLOTS 9 个在前
    const s0 = sl[9], s1 = sl[10];
    if (touch) {
      await page.touchscreen.tap(s0.x, s0.y); await step('1-open');
      const pb = await page.evaluate(() => { const t = window.__game.scene.getScene('UI').panel.tip, s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, bb = t.getBounds(); return { x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.bottom - 20 - wv.y) * cv.height / wv.height }; });
      await page.touchscreen.tap(pb.x, pb.y); await step('2-inside');
      await page.touchscreen.tap(s1.x, s1.y); await step('3-switch');
      // 拖动 30px（面板外）
      const bx = 20, by = vh - 20; await page.touchscreen.touchStart(bx, by); await page.touchscreen.touchMove(bx + 30, by); await page.touchscreen.touchEnd(); await step('4-drag');
      await page.touchscreen.tap(bx, by); await step('5-blank');
    } else {
      await page.mouse.move(s0.x, s0.y); await step('1-hover');
      await page.mouse.click(20, vh - 20); await step('2-blank-click');
      await page.mouse.move(s0.x, s0.y); await sleep(200); await page.mouse.move(20, vh - 20); await step('3-hoverout');
    }
    r.errs = w.errs.slice(0, 5); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/tapclose-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
