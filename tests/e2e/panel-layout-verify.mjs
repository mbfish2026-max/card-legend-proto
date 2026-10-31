// R54：技能面板（按学习等级排序、两行不重叠）与书店（≤25 级全部有售）截图，电脑 1280×720 / 手机 932×430；0 控制台报错
// 用法：npm run build && node tests/e2e/panel-layout-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/panel-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
try {
  for (const [VW, VH, mob] of [[1280, 720, false], [932, 430, true], [844, 390, true]]) for (const cls of ['warrior', 'mage', 'taoist']) {
    const tag = `${mob ? 'm' : 'd'}${VW}-${cls}`;
    const save = { v: 1, cls, level: 22, town: 'bichi', exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('shop')); await sleep(600);
    const bs = await findPos(p, 'UI', '^▶?书店$'); if (bs) { await p.mouse.click(bs.x, bs.y); await sleep(600); }
    await p.screenshot({ path: `${dir}/${tag}-shop.png` });
    const overlap = (key) => p.evaluate((key) => { const S = window.__game.scene.getScene('UI'), out = { rows: 0, bad: [], noLv: [] }; const all = []; const walk = l => l.forEach(o => { if (o.list) walk(o.list); else if (o.visible !== false) all.push(o); }); walk(S.children.list);
      const T = all.filter(o => o.type === 'Text'), buys = T.filter(o => o.text === '购买');
      for (const bt of buys) { const bb = bt.getBounds(), cy = bb.centerY; const btnL = bb.centerX - 25; const row = T.filter(o => o !== bt && Math.abs(o.getBounds().centerY - cy) < 24 && o.getBounds().right <= bb.right + 2 && o.getBounds().right > bb.centerX - 260);
        out.rows++; const nm = row.sort((a, b) => a.getBounds().top - b.getBounds().top)[0]; if (nm && nm.getBounds().right > btnL) out.bad.push(nm.text); if (!row.some(o => /需 ?Lv\d+/.test(o.text))) out.noLv.push(nm?.text); }
      return out; }, key);
    { const o = await overlap(); chk(o.rows > 0 && !o.bad.length && !o.noLv.length, `${tag} 商店面板 ${o.rows} 行：名称不压按钮 ${JSON.stringify(o.bad)}；每行含需求等级 ${JSON.stringify(o.noLv)}`); }
    const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; const lv = b => W.needLevel(W.skillPool.find(x => x.id === b.skill)); const L = W.shopBooks(); return { ids: L.map(b => `${b.skill}:${lv(b)}`), sorted: L.every((b, i) => !i || lv(L[i - 1]) <= lv(b)), all25: L.every(b => lv(b) <= 25 || b.shop) }; });
    chk(r.sorted && r.all25, `${tag} 书店 ${r.ids.join(' ')}`);
    await p.keyboard.press('Escape'); await sleep(300);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_book')); await sleep(700);
    await p.screenshot({ path: `${dir}/${tag}-town-book.png` });
    { const o = await overlap(); chk(o.rows > 0 && !o.bad.length && !o.noLv.length, `${tag} 城镇书店 ${o.rows} 行：名称不压按钮 ${JSON.stringify(o.bad)}；每行含需求等级 ${JSON.stringify(o.noLv)}`); }
    await p.keyboard.press('Escape'); await sleep(300);
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.world.learned.add(B.world.skillPool[2]?.id); B.openPanel('skills'); }); await sleep(800);
    await p.screenshot({ path: `${dir}/${tag}-skills-1.png` });
    const nx = await findPos(p, 'UI', '^▶$'); if (nx) { if (mob) await p.touchscreen.tap(nx.x, nx.y); else await p.mouse.click(nx.x, nx.y); await sleep(600); await p.screenshot({ path: `${dir}/${tag}-skills-2.png` }); }
    chk(!!nx, `${tag} 技能面板翻页键`);
    const errs = w.errs.filter(e => !/404|Failed to load/.test(e)); chk(errs.length === 0, `${tag} 控制台 0 报错 ${errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
