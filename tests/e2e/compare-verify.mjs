// feat/equip-compare：真实运行，背包/商店物品提示中出现与身上装备的对比行（桌面悬停 + 触屏选中）
import { startPreview, launch, watch, texts, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20, mag: 1 }, req: 4, price: 30 }, { uid: 3, item: 'iron_sword', name: '戒指样本', rarity: 'common', slot: 'ring', stats: { atk: 2 }, req: 1, price: 5 }];
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const tip = async (expr, name) => { await page.evaluate((e, t) => { const U = window.__game.scene.getScene('UI'), W = window.__game.scene.getScene('Battle').world; U.panel.showTip(eval(e), 300, 150, t); }, expr, touch); await sleep(300); await page.screenshot({ path: `${dir}/cmp-${name}-${vw}.png` }); return (await texts(page, 'UI')).filter(t => /对比|^  /.test(t)); };
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
    const r = { weapon: await tip('W.bag[0]', 'bag'), ring: await tip('W.bag[1]', 'ring') };
    await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); U.panel.hideTip(); U.panel.close(); W = window.__game.scene.getScene('Battle').world; }).catch(() => {});
    out[`${vw}x${vh}`] = { ...r, errs: w.errs.slice(0, 5) }; await page.close();
  }
} catch (e) { out.err = String(e); } finally { (await import('node:fs')).writeFileSync(dir + '/cmp-report.json', JSON.stringify(out)); await b.close(); sv.stop(); process.exit(0); }
