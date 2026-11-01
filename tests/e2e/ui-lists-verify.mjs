// B3：列表行/页签/滚动条九宫格 + 手机长列表滚动与 tapClose 互不干扰（1280×720 / 844×390 触屏，有/无图集）。截图 docs/shots/ui-art/b03/
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b03/', import.meta.url).pathname;
const MOB = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const bag = Array.from({ length: 200 }, (_, i) => ({ uid: 1000 + i, item: 'iron_sword', name: '铁剑' + i, rarity: i % 7 ? 'common' : 'rare', slot: 'weapon', stats: { atk: 10 + (i % 9) }, req: 4, price: 30 }));
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 0, 0, 9], town: 'bichi', floorIndex: 2, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag, learned: [] };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
const ns = page => page.evaluate(() => { const out = {}; const walk = l => l.forEach(o => { if (!o.visible) return; if (o.type === 'NineSlice') out[o.frame.name] = (out[o.frame.name] ?? 0) + 1; if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').children.list); return out; });
const rows = page => page.evaluate(() => { const U = window.__game.scene.getScene('UI'), out = []; const walk = l => l.forEach(o => { if (!o.visible) return; if (o.getData?.('rowPitch')) out.push({ p: o.getData('rowPitch'), h: o.getData('rowHit') }); if (o.list) walk(o.list); }); walk(U.children.list);
  const cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { out, u: cv.width / wv.width * (U.panel.mscale || 1) }; });
const named = (page, n) => page.evaluate(n => { let c = 0; const walk = l => l.forEach(o => { if (o.visible && o.name === n) c++; if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').children.list); return c; }, n);
const objPos = (page, data) => page.evaluate(d => { const U = window.__game.scene.getScene('UI'); let hit = null; const walk = l => l.forEach(o => { if (!hit && o.visible && o.getData?.('scrollBtn') && (!d || o.getData('scrollBtn') === d)) hit = o; if (o.list) walk(o.list); }); walk(U.children.list); if (!hit) return null;
  const b = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { x: cv.left + (b.centerX - wv.x) / wv.width * cv.width, y: cv.top + (b.centerY - wv.y) / wv.height * cv.height, label: hit.getData('scrollBtn') }; }, data);
// 只在面板内找文字（HUD 的「◀ 出城」同名）
const panelPos = (page, src) => page.evaluate(src => { const U = window.__game.scene.getScene('UI'), re = new RegExp(src); let hit = null; const walk = l => l.forEach(o => { if (!hit && o.visible && o.type === 'Text' && re.test(o.text)) hit = o; if (o.list) walk(o.list); }); walk(U.panel.root.list);
  const b = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { x: cv.left + (b.centerX - wv.x) / wv.width * cv.width, y: cv.top + (b.centerY - wv.y) / wv.height * cv.height }; }, src);
for (const [tag, mobile] of [['1280', false], ['844', true]]) for (const blocked of [false, true]) {
  const name = tag + (blocked ? '-fallback' : ''), srv = await startPreview({ block: u => blocked && /ui_atlas/.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  if (mobile) { await page.setUserAgent(UA); await page.setViewport(MOB); } else await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  const tap = async p => mobile ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y);
  const want = (r, f, what) => blocked ? ok(!r[f], `${name} ${what}：图集被拦 → 代码回退（无 ${f}）`) : ok(r[f] > 0, `${name} ${what}：${f} 九宫格 ×${r[f]}`);
  const rowChk = async what => { const r = await rows(page), R0 = r.out[0]; if (!R0) return console.log(`-- ${name} ${what}：当前进度无行内按钮，跳过点击区检查`);
    const bad = r.out.filter(x => x.h > x.p); ok(!bad.length, `${name} ${what} 点击区 ≤ 行距（${r.out.length} 行，不重叠）`);
    if (mobile) ok(Math.min(...r.out.map(x => x.h)) * r.u >= 36 - 0.5, `${name} ${what} 最小点击区 ${(Math.min(...r.out.map(x => x.h)) * r.u).toFixed(1)} CSS px ≥36`); };
  // 多存档（B1 起即有的「返回」贴边 / 小字问题，B3 修）
  await page.evaluate(() => window.__game.scene.getScene('Title').slotsScreen()); await sleep(400);
  { const r = await page.evaluate(() => { const T = window.__game.scene.getScene('Title'), cv = window.__game.canvas.getBoundingClientRect(), wv = T.cameras.main.worldView, k = cv.height / wv.height; let back = null, minF = 99; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) { if (/返回/.test(o.text)) back = o.getBounds(); if (/Lv|空/.test(o.text)) minF = Math.min(minF, parseFloat(o.style.fontSize) * k); } if (o.list) walk(o.list); }); walk(T.children.list); return { bot: (back.bottom - wv.y) * k, vh: cv.height, minF }; });
    ok(r.bot <= r.vh - 8, `${name} 存档「返回」底 ${r.bot.toFixed(1)} ≤ ${r.vh - 8} CSS px（完整在屏内）`); ok(!mobile || r.minF >= 11.5, `${name} 存档小字 ${r.minF.toFixed(1)} CSS px`); }
  await page.screenshot({ path: `${OUT}${name}-slots.png` });
  await page.evaluate(() => window.__game.scene.getScene('Title').mainMenu()); await sleep(300);
  await tap(await findPos(page, 'Title', '继'));
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1500);
  // 商店页签 + 列表行
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('shop')); await sleep(600);
  let r = await ns(page); want(r, 'tab_on', '商店页签'); if (!blocked) ok(r.tab_off > 0 && r.list_row > 0, `${name} tab_off + list_row`);
  await rowChk('杂货'); await page.screenshot({ path: `${OUT}${name}-shop-goods.png` });
  await tap(await findPos(page, 'UI', '^书店$')); await sleep(500);
  ok(await page.evaluate(() => window.__game.scene.getScene('UI').panel.shopTab === 'books'), `${name} 点页签切到书店`);
  await rowChk('书店'); r = await ns(page); r.row = (r.list_row ?? 0) + (r.list_row_sel ?? 0); want(r, 'row', '书店行(list_row/_sel)');
  // 书店仅卖 Lv≤25 的 2 本，手机分页（PER≥3）在当前数据下不出现；分页逻辑见 Panel.renderBooks
  await page.screenshot({ path: `${OUT}${name}-shop-books.png` });
  // 技能 / 任务 / 成就
  for (const m of ['skills', 'quests']) { await page.evaluate(m => { const U = window.__game.scene.getScene('UI'); U.panel.close(); window.__game.scene.getScene('Battle').openPanel(m); }, m); await sleep(600);
    r = await ns(page); want(r, 'list_row', m); await rowChk(m); await page.screenshot({ path: `${OUT}${name}-${m}.png` }); }
  // 背包 200 格：末页并返回，tapClose 不受分页影响
  await page.evaluate(() => { window.__game.scene.getScene('UI').panel.close(); window.__game.scene.getScene('Battle').openPanel('bag'); }); await sleep(600);
  await tap(await findPos(page, 'UI', '末页')); await sleep(400);
  const last = await page.evaluate(() => window.__game.scene.getScene('UI').panel.bagPage); ok(last > 0, `${name} 背包 200 件 → 末页 ${last + 1}`);
  await page.screenshot({ path: `${OUT}${name}-bag-last.png` });
  await tap(await panelPos(page, '^◀$')); await sleep(300);
  ok(await page.evaluate(() => window.__game.scene.getScene('UI').panel.bagPage) === last - 1, `${name} 背包 ◀ 翻页`);
  for (let i = 1; i < last; i++) { await tap(await panelPos(page, '^◀$')); await sleep(300); }
  ok(await page.evaluate(() => window.__game.scene.getScene('UI').panel.bagPage) === 0, `${name} 背包翻回第 1 页`);
  // 城镇 NPC 长列表：拖动滚动不触发按钮、不开/关提示
  await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); U.panel.close(); const w = window.__game.scene.getScene('Battle').world; w.level = 60; w.recompute(); w.reached = new Set(w.floors.map((_, i) => i)); w.teleportReadyAt = 0; U.panel.openNpc('bq_tele'); }); await sleep(700);
  r = await ns(page); want(r, 'scroll_thumb', '传送员滚动条'); ok(await named(page, 'scrollThumb') > 0, `${name} scrollThumb 存在`); await rowChk('传送员');
  const si0 = await page.evaluate(() => Object.values(window.__game.scene.getScene('UI').panel.scrollInfo)[0] ?? null);
  ok(si0 && si0.n > si0.vis, `${name} 传送列表 ${si0?.n} 项 > 可视 ${si0?.vis}`);
  const p0 = await objPos(page); const before = await page.evaluate(() => ({ tip: !!window.__game.scene.getScene('UI').panel.tip, npc: window.__game.scene.getScene('UI').panel.npc, town: window.__game.scene.getScene('Battle').world.town }));
  if (p0) {
    if (mobile) { await page.touchscreen.touchStart(p0.x, p0.y); for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(p0.x, p0.y - k * 20); await sleep(16); } await page.touchscreen.touchEnd(); }
    else { await page.mouse.move(p0.x, p0.y); await page.mouse.down(); for (let k = 1; k <= 6; k++) { await page.mouse.move(p0.x, p0.y - k * 20); await sleep(16); } await page.mouse.up(); }
    await sleep(400);
    const after = await page.evaluate(() => ({ off: Object.values(window.__game.scene.getScene('UI').panel.scrollInfo)[0]?.off, tip: !!window.__game.scene.getScene('UI').panel.tip, npc: window.__game.scene.getScene('UI').panel.npc, town: window.__game.scene.getScene('Battle').world.town }));
    ok(after.off > 0, `${name} 拖动滚动 off 0→${after.off}`);
    ok(after.tip === before.tip && after.npc === before.npc && after.town === before.town, `${name} 拖动后未触发按钮 / 未开关提示（${p0.label}）`);
  }
  await page.screenshot({ path: `${OUT}${name}-town-scroll.png` });
  const bad = w.errs.filter(e => !/404|Failed to load/i.test(e)); ok(!bad.length, `${name} 无脚本错误 ${bad.slice(0, 3).join(' | ')}`);
  await b.close(); srv.stop();
}
console.log(fail ? `FAIL ${fail}` : 'ui-lists e2e 全过'); process.exit(fail ? 1 : 0);
