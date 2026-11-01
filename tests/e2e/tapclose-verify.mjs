// feat/mobile-tapclose：手机版点对比面板外关闭；桌面行为不变
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/ui-art/b03'; mkdirSync(dir, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20 }, req: 4, price: 30 }, { uid: 3, item: 'iron_sword', name: '次铁剑', rarity: 'magic', slot: 'weapon', stats: { atk: 16 }, req: 4, price: 30 }];
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {};
const slots = page => page.evaluate(() => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, r = [];
  const walk = l => l.forEach(o => { if (o.getData?.('slot')) { const bb = o.getBounds(); r.push({ x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY - wv.y) * cv.height / wv.height }); } if (o.list) walk(o.list); }); walk(s.children.list); return r; });
const state = page => page.evaluate(() => { const p = window.__game.scene.getScene('UI').panel; return { sel: p.sel, tip: !!p.tip, cmp: p.tip?.name ?? null }; });
try {
  for (const [vw, vh, touch] of [[844, 390, true], [1280, 720, false]]) {
    const page = await b.newPage(); if (touch) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch, isLandscape: touch }); const w = watch(page); const r = (out[`${vw}x${vh}`] = { steps: [] });
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(800);
    const step = async (name) => { await sleep(400); const st = await state(page); r.steps.push({ name, ...st }); await page.screenshot({ path: `${dir}/tapclose-${name}-${vw}.png` }); return st; };
    // 背包第 1 格（好铁剑）：EQUIP_SLOTS 10 个在前（灵符商城加了血石栏 stone）
    const sl = await slots(page); ok(sl.length >= 12, `${vw} 找到 ${sl.length} 个格子`); // 原脚本漏了这一行（sl 未定义）
    const s0 = sl[10], s1 = sl[11];
    if (touch) {
      { const st = await (await page.touchscreen.tap(s0.x, s0.y), step('1-open')); ok(st.tip, '844 点格子 → 对比面板打开'); }
      const pb = await page.evaluate(() => { const t = window.__game.scene.getScene('UI').panel.tip, s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, bb = t.getBounds(); return { x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.bottom - 20 - wv.y) * cv.height / wv.height }; });
      { await page.touchscreen.tap(pb.x, pb.y); const st = await step('2-inside'); ok(st.tip, '844 点面板内 → 不关'); }
      { const before = (await state(page)).sel; await page.touchscreen.tap(s1.x, s1.y); const st = await step('3-switch'); ok(st.tip && st.sel !== before, `844 点另一格子 → 不关、切换 ${before}→${st.sel}`); }
      // 拖动 30px（面板外）
      const bx = 20, by = vh - 20; await page.touchscreen.touchStart(bx, by); await page.touchscreen.touchMove(bx + 30, by); await page.touchscreen.touchEnd(); { const st = await step('4-drag'); ok(st.tip, '844 面板外拖动 30px（>8px）→ 不关'); }
      await page.touchscreen.tap(bx, by); { const st = await step('5-blank'); ok(!st.tip, '844 点面板外空白 → 关闭'); }
    } else {
      await page.mouse.move(s0.x, s0.y); ok((await step('1-hover')).tip, '1280 悬停 → 提示');
      await page.mouse.click(20, vh - 20); ok(!(await step('2-blank-click')).tip, '1280 点空白 → 提示关');
      await page.mouse.move(s0.x, s0.y); await sleep(200); await page.mouse.move(20, vh - 20); ok(!(await step('3-hoverout')).tip, '1280 移出 → 提示关（桌面行为不变）');
    }
    r.errs = w.errs.slice(0, 5); ok(!w.errs.filter(e => !/404|Failed to load/.test(e)).length, `${vw} 无脚本报错 ${r.errs.join(' | ')}`); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); ok(false, out.err); } finally { writeFileSync(dir + '/tapclose-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); console.log(fails ? `FAIL ${fails}` : 'tapclose 全过'); process.exit(fails ? 1 : 0); }
