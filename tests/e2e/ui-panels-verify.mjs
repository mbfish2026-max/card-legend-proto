// B2：面板/弹窗底九宫格 + 手机列表行距/点击区 + 图集拦截回退（1280×720 / 844×390 触屏）。截图 docs/shots/ui-art/b02/
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b02/', import.meta.url).pathname;
const MOB = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const W1 = { uid: 1, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 14 }, req: 4, price: 30 };
const bag = [{ uid: 2, item: 'iron_sword', name: '好铁剑', rarity: 'rare', slot: 'weapon', stats: { atk: 20, mag: 1 }, req: 6, price: 30, enhance: 2 }, { uid: 4, item: 'bronze_helmet', name: '青铜头盔', rarity: 'common', slot: 'helmet', stats: { def: 2, mdef: 1 }, req: 3, price: 20 }];
const save = { v: 1, cls: 'warrior', level: 20, exp: 0, gold: 50000, pots: [5, 0, 0, 9], town: 'bichi', floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: W1 }, bag, learned: [] };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
// 场景内背景对象统计 + 文字是否越出面板底（截断检查）
const scan = (page, key) => page.evaluate(k => {
  const s = window.__game.scene.getScene(k), out = { ns: {}, rect: 0, over: [], minFont: 99 }; let bg = null;
  const walk = l => l.forEach(o => { if (!o.visible) return; if (o.type === 'NineSlice') out.ns[o.frame.name] = (out.ns[o.frame.name] ?? 0) + 1; if (o.name === 'panelBg') bg = o; if (o.list) walk(o.list); });
  walk(s.children.list);
  if (bg) { const B = bg.getBounds(); out.bg = bg.type; const tw = l => l.forEach(o => { if (!o.visible) return; if (o.type === 'Text' && o.text.trim()) { const b = o.getBounds(); out.minFont = Math.min(out.minFont, parseFloat(o.style.fontSize) * (o.parentContainer?.scaleX ?? 1)); if (b.right > B.right + 2 || b.x < B.x - 2) out.over.push(o.text.slice(0, 16)); } if (o.list) tw(o.list); }); tw((bg.parentContainer ?? s.children).list); }
  return out; }, key);
for (const [tag, mobile] of [['1280', false], ['844', true]]) for (const blocked of [false, true]) {
  const name = tag + (blocked ? '-fallback' : ''), srv = await startPreview({ block: u => blocked && /ui_atlas/.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  if (mobile) { await page.setUserAgent(UA); await page.setViewport(MOB); } else await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  const want = (r, frame, what) => blocked ? ok(!Object.keys(r.ns).length, `${name} ${what}：回退，无九宫格（背景 ${r.bg ?? '-'}）`) : ok(r.ns[frame] > 0, `${name} ${what}：${frame} 九宫格`);
  // 存档 / 设置（标题页）
  await page.evaluate(() => window.__game.scene.getScene('Title').slotsScreen()); await sleep(400);
  let r = await scan(page, 'Title'); want(r, 'panel_frame', '存档'); ok(!r.over.length, `${name} 存档文字不越出面板 ${r.over.join('|')}`);
  await page.screenshot({ path: `${OUT}${name}-slots.png` });
  await page.evaluate(() => window.__game.scene.getScene('Title').settings()); await sleep(400);
  r = await scan(page, 'Title'); want(r, 'panel_frame', '标题设置'); ok(!r.over.length, `${name} 设置文字不越出 ${r.over.join('|')}`);
  await page.screenshot({ path: `${OUT}${name}-settings.png` });
  await page.evaluate(() => window.__game.scene.getScene('Title').mainMenu()); await sleep(300);
  { const p = await findPos(page, 'Title', '继'); if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1500);
  const P = 'window.__game.scene.getScene("UI").panel';
  // 背包 + 装备对比
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
  r = await scan(page, 'UI'); want(r, 'panel_frame', '背包'); ok(!r.over.length, `${name} 背包文字不越出 ${r.over.join('|')}`);
  if (!blocked) ok(r.ns.title_plate > 0 && r.ns.inset_frame > 0, `${name} 背包标题底牌+人物内框`);
  await page.screenshot({ path: `${OUT}${name}-bag.png` });
  const cmp = await page.evaluate(t => { const U = window.__game.scene.getScene('UI'), W = window.__game.scene.getScene('Battle').world; U.panel.showTip(W.bag[0], 300, 150, t); const c = U.panel.tip, f = {}; c.list.forEach(o => o.type === 'NineSlice' && (f[o.frame.name] = 1)); const bd = c.getBounds(); return { name: c.name, f, inside: bd.x >= 0 && bd.y >= 0 && bd.bottom <= 720 }; }, mobile);
  ok(cmp.name === 'equipCompare' && cmp.inside && (blocked ? !Object.keys(cmp.f).length : cmp.f.tooltip_frame && cmp.f.divider_v), `${name} 装备对比 ${JSON.stringify(cmp.f)}`);
  await sleep(300); await page.screenshot({ path: `${OUT}${name}-compare.png` });
  await page.evaluate(() => window.__game.scene.getScene('UI').panel.hideTip());
  // 点面板外关闭（对比框 tapClose）由 tests/e2e/tapclose-verify.mjs 回归
  // 商店（长列表 + 滚动）
  await page.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_book')); await sleep(700);
  r = await scan(page, 'UI'); want(r, 'panel_frame', '书店');
  await page.screenshot({ path: `${OUT}${name}-book.png` });
  await page.evaluate(() => window.__game.scene.getScene('UI').panel.openNpc('bq_weapon')); await sleep(700);
  const rows = await page.evaluate(() => { const U = window.__game.scene.getScene('UI'), out = []; const walk = l => l.forEach(o => { if (o.getData?.('rowPitch') && o.visible) out.push({ p: o.getData('rowPitch'), h: o.getData('rowHit'), y: o.getWorldTransformMatrix().ty }); if (o.list) walk(o.list); }); walk(U.children.list); const c = window.__game.canvas.getBoundingClientRect(), cam = U.cameras.main; return { out, css: c.height / (cam.height / cam.zoom), k: U.panel.mscale, si: U.panel.scrollInfo }; });
  const u = rows.css * rows.k, R0 = rows.out[0] ?? { p: 0, h: 0 };
  ok(rows.out.length >= 4, `${name} 书店列表 ${rows.out.length} 行可见`);
  if (mobile) ok(R0.p * u >= 44 - 0.5 && R0.h * u >= 36 - 0.5 && R0.h <= R0.p, `${name} 手机行距 ${(R0.p * u).toFixed(1)} CSS px，按钮点击区 ${(R0.h * u).toFixed(1)} CSS px ≤ 行距（不重叠）`);
  else ok(R0.p === 50 && R0.h <= 50, `${name} 桌面行距 50 不变，点击区 ${R0.h}`);
  const si = Object.values(rows.si)[0];
  if (si) { await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); const p = U.panel; const k = Object.keys(p.scrollInfo)[0]; const v = p.scrollInfo[k]; p.npcScroll[v.key] = 2; p.render(); }); await sleep(300);
    ok(await page.evaluate(() => Object.values(window.__game.scene.getScene('UI').panel.scrollInfo)[0]?.off === 2), `${name} 长列表滚动（${si.n} 项 / 可视 ${si.vis}）`); }
  await page.screenshot({ path: `${OUT}${name}-shop.png` });
  await page.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(200);
  // 游戏内设置 / 世界地图
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('settings')); await sleep(500);
  r = await scan(page, 'UI'); want(r, 'panel_frame', '游戏内设置'); ok(!r.over.length, `${name} 设置文字不越出 ${r.over.join('|')}`);
  await page.screenshot({ path: `${OUT}${name}-settings-ingame.png` });
  await page.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(200);
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('map')); await sleep(900);
  r = await scan(page, 'UI'); want(r, 'panel_frame', '世界地图');
  await page.screenshot({ path: `${OUT}${name}-worldmap.png` });
  const bad = w.errs.filter(e => !/404|Failed to load/i.test(e)); ok(!bad.length, `${name} 无脚本错误 ${bad.slice(0, 3).join(' | ')}`);
  await b.close(); srv.stop();
}
console.log(fail ? `FAIL ${fail}` : 'ui-panels e2e 全过'); process.exit(fail ? 1 : 0);
