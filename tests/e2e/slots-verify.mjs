// 5.1 双戒双镯：旧存档读取 → 面板截图 → 背包点击装备第二枚戒指 → 点击卸下
// 用法：npm run build && node tests/e2e/slots-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const sv = await startPreview(), b = await launch(); const out = {};
const mkOld = cls => ({ v: 1, cls, level: 20, exp: 0, gold: 500, pots: [5, 0, 0], floorIndex: 0, kills: 0, nextUid: 100, mapV: 2,
  equip: { weapon: { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 },
    ring: { uid: 2, item: 'gold_ring', name: '金戒指', rarity: 'common', slot: 'ring', stats: { atk: 8, mag: 8, tao: 8 }, req: 9, price: 70 },
    bracelet: { uid: 3, item: 'bracelet', name: '翡翠手镯', rarity: 'common', slot: 'bracelet', stats: { def: 3, hp: 30 }, req: 4, price: 25 } },
  bag: [{ uid: 4, item: 'iron_ring', name: '铁戒指', rarity: 'common', slot: 'ring', stats: { atk: 3, hp: 20 }, req: 2, price: 15 }] });
try {
  for (const [name, vp, ua] of [['desktop', { width: 1280, height: 720 }], ['portrait', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'], ['landscape', { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 }, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1']]) {
    const page = await b.newPage(); if (ua) await page.setUserAgent(ua); await page.setViewport(vp); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), mkOld('warrior'));
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); await page.touchscreen?.tap && vp.hasTouch ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const r = await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'), w = s.world; s.openPanel('bag'); return { eq: Object.keys(w.equip), atk: w.stats().atk, hp: w.stats().hp }; });
    await sleep(800); await page.screenshot({ path: `${dir}/slots-${name}-1-old.png` });
    const tap = async q => { const p = await findPos(page, 'UI', q); if (!p) return false; if (vp.hasTouch) { await page.touchscreen.tap(p.x, p.y); await sleep(300); await page.touchscreen.tap(p.x, p.y); } else await page.mouse.click(p.x, p.y); await sleep(500); return p; };
    const r2pos = await findPos(page, 'UI', '^右戒指$');
    // 背包点击铁戒指：找背包第一格 → 用 world 状态确认
    const bagPos = await page.evaluate(() => { const s = window.__game.scene.getScene('UI'); let hit; const walk = l => l.forEach(o => { if (!hit && o.type === 'Image' && o.texture?.key === 'item_iron_ring') hit = o; if (o.list) walk(o.list); }); walk(s.children.list); if (!hit) return null; const bb = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(); return { x: cv.left + bb.centerX * cv.width / 1280, y: cv.top + bb.centerY * cv.height / 720 }; });
    if (bagPos) { if (vp.hasTouch) { await page.touchscreen.tap(bagPos.x, bagPos.y); await sleep(300); await page.touchscreen.tap(bagPos.x, bagPos.y); } else await page.mouse.click(bagPos.x, bagPos.y); await sleep(600); }
    const a = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { ring1: w.equip.ring1?.item, ring2: w.equip.ring2?.item, atk: w.stats().atk, bag: w.bag.length }; });
    await page.screenshot({ path: `${dir}/slots-${name}-2-tworings.png` });
    if (r2pos) { if (vp.hasTouch) { await page.touchscreen.tap(r2pos.x, r2pos.y); await sleep(300); await page.touchscreen.tap(r2pos.x, r2pos.y); } else await page.mouse.click(r2pos.x, r2pos.y); await sleep(600); }
    const c = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { ring2: w.equip.ring2?.item ?? null, bag: w.bag.map(i => i.item) }; });
    await page.screenshot({ path: `${dir}/slots-${name}-3-unequip.png` });
    const cv = await page.evaluate(() => { const r = window.__game.canvas.getBoundingClientRect(); return [r.left, r.top, r.width, r.height, innerWidth, innerHeight]; });
    out[name] = { loaded: r, afterBagClick: a, afterUnequip: c, canvas: cv, errs: w.errs.slice(0, 5) };
    await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
