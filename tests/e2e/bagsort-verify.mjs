// feat/bag-sort：真实点击「整理」按钮（桌面点击 + 844×390 触屏点按），检查排序/合并/回第 1 页/已穿不动
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = []; for (let i = 0; i < 70; i++) bag.push({ uid: 10 + i, item: 'iron_sword', name: '剑' + i, rarity: ['common', 'magic', 'rare'][i % 3], slot: 'weapon', stats: { atk: i }, req: i % 30, price: 1 });
bag.push({ uid: 200, item: 'black_iron', name: '黑铁矿石', rarity: 'common', stats: {}, req: 1, price: 1, qty: 2, purity: 1 }, { uid: 201, item: 'black_iron', name: '黑铁矿石', rarity: 'common', stats: {}, req: 1, price: 1, qty: 3, purity: 1 });
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 1, kills: 0, nextUid: 300, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const tap = async q => { if (touch) await page.touchscreen.tap(q.x, q.y); else await page.mouse.click(q.x, q.y); await sleep(600); };
    await tap(await findPos(page, 'Title', '继'));
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
    await tap(await findPos(page, 'UI', '^末页$'));
    const pg0 = await page.evaluate(() => window.__game.scene.getScene('UI').panel.bagPage);
    await tap(await findPos(page, 'UI', '^整理$')); await page.screenshot({ path: `${dir}/bagsort-${vw}.png` });
    out[`${vw}x${vh}`] = await page.evaluate(pg0 => { const W = window.__game.scene.getScene('Battle').world, P = window.__game.scene.getScene('UI').panel;
      return { pageBefore: pg0, pageAfter: P.bagPage, len: W.bag.length, first: W.bag.slice(0, 3).map(x => x.rarity + x.req), ore: W.bag.filter(x => x.item === 'black_iron').map(x => x.qty), worn: W.equip.weapon?.name }; }, pg0);
    out[`${vw}x${vh}`].errs = w.errs.slice(0, 5); await page.close();
  }
} catch (e) { out.err = String(e); } finally { (await import('node:fs')).writeFileSync(dir + '/bagsort-report.json', JSON.stringify(out)); await b.close(); sv.stop(); process.exit(0); }
