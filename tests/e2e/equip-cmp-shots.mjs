// 装备对比改版：真实运行截图（1280×720 桌面 + 844×390 触屏），并检查面板不溢出画布
import { startPreview, launch, watch, texts, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const R1 = { uid: 5, item: 'iron_ring', name: '铁戒指', rarity: 'common', slot: 'ring', stats: { atk: 1 }, req: 1, price: 5 }, R2 = { uid: 6, item: 'gold_ring', name: '金戒指', rarity: 'magic', slot: 'ring', stats: { atk: 3, def: 1 }, req: 9, price: 50 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20, mag: 1 }, req: 6, price: 30, enhance: 2 }, { uid: 3, item: 'iron_ring', name: '新戒指', rarity: 'magic', slot: 'ring', stats: { atk: 2, hp: 20 }, req: 1, price: 5 }, { uid: 4, item: 'bronze_helmet', name: '青铜头盔', rarity: 'common', slot: 'helmet', stats: { def: 2, mdef: 1 }, req: 3, price: 20 }];
const save = { v: 1, cls: 'warrior', level: 5, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1, ring1: R1, ring2: R2 }, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0;
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
    const r = {};
    for (const [i, name] of [[0, 'weapon'], [1, 'ring'], [2, 'empty']]) {
      r[name] = await page.evaluate((i, t) => { const U = window.__game.scene.getScene('UI'), W = window.__game.scene.getScene('Battle').world; if (i === 2) delete W.equip.helmet; U.panel.showTip(W.bag[i], 300, 150, t); const c = U.panel.tip, bd = c.getBounds(); const fonts = []; c.list.forEach(o => o.type === 'Text' && fonts.push(parseFloat(o.style.fontSize))); return { name: c.name, x: bd.x, y: bd.y, r: bd.right, b: bd.bottom, minFont: Math.min(...fonts) }; }, i, touch);
      await sleep(300); await page.screenshot({ path: `${dir}/equip-cmp-${name}-${vw}x${vh}.png` });
      const k = vh / 720; r[name].minFontPx = +(r[name].minFont * k).toFixed(1); r[name].inside = r[name].x >= 0 && r[name].y >= 0 && r[name].b <= 720 && r[name].r <= 1600;
      if (r[name].name !== 'equipCompare' || !r[name].inside || r[name].minFontPx < 12 && touch) fail++;
    }
    r.texts = (await texts(page, 'UI')).filter(t => /^[+-]\d|^=|空|另一件/.test(t)).slice(0, 12);
    out[`${vw}x${vh}`] = { ...r, errs: w.errs.slice(0, 5) }; await page.close();
  }
} catch (e) { out.err = String(e); fail++; } finally { console.log(JSON.stringify(out, null, 1)); console.log(fail ? 'FAIL ' + fail : 'OK'); await b.close(); sv.stop(); process.exit(fail ? 1 : 0); }
