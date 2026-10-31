// #10 魔御：旧存档读取 → 面板显示魔御 → 背包点击穿上带魔御衣服（旧档 stats 无 mdef）→ 数值变化；桌面/竖屏/横屏
// 用法：npm run build && node tests/e2e/mdef-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, texts, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const sv = await startPreview(), b = await launch(); const out = {};
const save = { v: 1, cls: 'taoist', level: 24, exp: 0, gold: 500, pots: [5, 0, 0], floorIndex: 0, kills: 0, nextUid: 100, mapV: 2,
  equip: { helmet: { uid: 1, item: 'tao_helm', name: '道士头盔', rarity: 'common', slot: 'helmet', stats: { def: 5, hp: 40 }, req: 24, price: 50 } },
  bag: [{ uid: 4, item: 'soul_robe', name: '灵魂战衣', rarity: 'common', slot: 'armor', stats: { def: 14, hp: 112, tao: 6 }, req: 22, price: 100 }] };
const statLine = async page => (await texts(page, 'UI')).find(t => t.includes('魔御'));
const lineBox = page => page.evaluate(() => { const s = window.__game.scene.getScene('UI'); let hit; const walk = l => l.forEach(o => { if (!hit && o.type === 'Text' && o.visible && o.text.includes('魔御')) hit = o; if (o.list) walk(o.list); }); walk(s.children.list); if (!hit) return null; const bb = hit.getBounds(); return [Math.round(bb.left), Math.round(bb.right)]; });
try {
  for (const [name, vp, ua] of [['desktop', { width: 1280, height: 720 }], ['portrait', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'], ['landscape', { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 }, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1']]) {
    const page = await b.newPage(); if (ua) await page.setUserAgent(ua); await page.setViewport(vp); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); vp.hasTouch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const r = await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'), w = s.world; s.openPanel('bag'); return { mdef: w.stats().mdef, def: w.stats().def }; });
    await sleep(800); const l1 = await statLine(page), box1 = await lineBox(page); await page.screenshot({ path: `${dir}/mdef-${name}-1-old.png` });
    const bagPos = await page.evaluate(() => { const s = window.__game.scene.getScene('UI'); let hit; const walk = l => l.forEach(o => { if (!hit && o.type === 'Image' && o.texture?.key === 'item_soul_robe') hit = o; if (o.list) walk(o.list); }); walk(s.children.list); if (!hit) return null; const bb = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(); return { x: cv.left + bb.centerX * cv.width / 1280, y: cv.top + bb.centerY * cv.height / 720 }; });
    if (bagPos) { if (vp.hasTouch) { await page.touchscreen.tap(bagPos.x, bagPos.y); await sleep(300); await page.touchscreen.tap(bagPos.x, bagPos.y); } else await page.mouse.click(bagPos.x, bagPos.y); await sleep(700); }
    const a = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { armor: w.equip.armor?.item, mdef: w.stats().mdef, heroMdef: w.hero.mdef }; });
    const l2 = await statLine(page), box2 = await lineBox(page); await page.screenshot({ path: `${dir}/mdef-${name}-2-robe.png` });
    out[name] = { loaded: r, line1: l1, box1, afterEquip: a, line2: l2, box2, errs: w.errs.slice(0, 5) };
    await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
