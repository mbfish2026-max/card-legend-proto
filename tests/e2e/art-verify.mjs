// feat/art-integrate：真实运行，装备/药水图标改用 assets/items/*、2x 画质走 @2x、怪物独立立绘已加载；故意拦截一张图标 404 验证回退无报错
import { startPreview, launch, watch, texts, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const it = (uid, item, slot) => ({ uid, item, name: item, rarity: 'common', slot, stats: { atk: 1 }, req: 1, price: 1 });
const bag = [it(2, 'xiangmo', 'weapon'), it(3, 'dragon_ring', 'ring'), it(4, 'tianzun_helm', 'helmet'), { uid: 5, item: 'black_iron', name: '黑铁矿石', qty: 2 }];
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [5, 3, 2, 9], floorIndex: 1, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag, learned: [] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const [vw, vh, touch, dpr] of [[1280, 720, false, 1], [1280, 720, false, 2], [844, 390, true, 1]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch, deviceScaleFactor: dpr }); const w = watch(page);
    const blocked = []; await page.setRequestInterception(true);
    page.on('request', r => { if (/eq_dragon_ring(@2x)?\.png/.test(r.url())) { blocked.push(r.url().split('/').pop()); r.respond({ status: 404, body: '' }); } else r.continue(); });
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(6000);
    const tex = await page.evaluate(() => { const T = window.__game.textures; const info = k => T.exists(k) ? { w: T.get(k).getSourceImage().width, src: (T.get(k).getSourceImage().src || '').split('/').slice(-2).join('/') } : null;
      return Object.fromEntries(['item_xiangmo', 'item_tianzun_helm', 'item_hp_small', 'item_return_scroll', 'item_dragon_ring', 'item_boots', 'potion_0', 'boss_hongmo', 'woma_warrior', 'summon_beast'].map(k => [k, info(k)])); });
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(800);
    await page.screenshot({ path: `${dir}/art-bag-${vw}-${dpr}x.png` });
    out[`${vw}x${vh}@${dpr}`] = { k: await page.evaluate(() => window.__game.scene.getScene('Battle').cameras.main.zoom), tex, blocked, bagTexts: (await texts(page, 'UI')).slice(0, 6), errs: w.errs.slice(0, 5) }; await page.close();
  }
} catch (e) { out.err = String(e); } finally { (await import('node:fs')).writeFileSync(dir + '/art-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
