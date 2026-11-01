// B4：物品格 slot/slot_sel、品质框 qframe_*、快捷栏格、技能行状态着色；手机格子点击区（1280×720 / 844×390 触屏，有/无图集）。截图 docs/shots/ui-art/b04/
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b04/', import.meta.url).pathname;
const MOB = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const R3 = ['common', 'magic', 'rare'], CN = { common: '普通', magic: '精良', rare: '极品' };
const mkI = (uid, item, slot, rarity, stats) => ({ uid, item, name: CN[rarity] + item, rarity, slot, stats, req: 1, price: 30 });
const equip = { weapon: mkI(1, 'iron_sword', 'weapon', 'rare', { atk: 20 }), helmet: mkI(2, 'bronze_helmet', 'helmet', 'magic', { def: 3 }), boots: mkI(3, 'bronze_helmet', 'helmet', 'common', { def: 1 }) };
const bag = Array.from({ length: 24 }, (_, i) => mkI(100 + i, i % 2 ? 'bronze_helmet' : 'iron_sword', i % 2 ? 'helmet' : 'weapon', R3[i % 3], i % 2 ? { def: 2 } : { atk: 12 }));
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 3, 2, 9], town: 'bichi', floorIndex: 2, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: { weapon: equip.weapon, helmet: equip.helmet }, bag, learned: ['thrust', 'half_moon'] };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
const scan = (page, key) => page.evaluate(k => { const sc = window.__game.scene.getScene(k), ns = {}, slots = [], tints = {}; const walk = l => l.forEach(o => { if (!o.visible) return; if (o.type === 'NineSlice') ns[o.frame.name] = (ns[o.frame.name] ?? 0) + 1; if (o.getData?.('slot')) slots.push({ hit: o.getData('slotHit'), pitch: o.getData('slotPitch'), size: o.getData('slotSize'), ia: o.input?.hitArea ? [o.input.hitArea.width, o.input.hitArea.height] : null }); if (o.name === 'rowTint') tints[o.getData('tint')] = (tints[o.getData('tint')] ?? 0) + 1; if (o.list) walk(o.list); }); walk(sc.children.list);
  const U = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { ns, slots, tints, u: cv.width / wv.width * (U.panel?.mscale || 1) }; }, key);
for (const [tag, mobile] of [['1280', false], ['844', true]]) for (const blocked of [false, true]) {
  const name = tag + (blocked ? '-fallback' : ''), srv = await startPreview({ block: u => blocked && /ui_atlas/.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  if (mobile) { await page.setUserAgent(UA); await page.setViewport(MOB); } else await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  { const p = await findPos(page, 'Title', '继'); if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 60000 }); await sleep(1500);
  // 快捷栏（桌面 Hud；手机为 DOM HUD，B6 处理）
  if (!mobile) { const r = await scan(page, 'UI'); ok(blocked ? !r.ns.slot : r.ns.slot >= 6, `${name} 快捷栏技能/药水格 slot 九宫格 ×${r.ns.slot ?? 0}${blocked ? '（回退矩形）' : ''}`); await page.screenshot({ path: `${OUT}${name}-hotbar.png`, clip: { x: 300, y: 560, width: 680, height: 160 } }); }
  // 背包 + 装备
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(700);
  let r = await scan(page, 'UI');
  if (blocked) ok(!r.ns.slot && !r.ns.qframe_common, `${name} 背包/装备：图集被拦 → 原矩形+品质描边`);
  else { ok(r.ns.slot >= 30, `${name} 背包/装备格 slot ×${r.ns.slot}`); for (const q of R3) ok(r.ns['qframe_' + q] > 0, `${name} 品质框 qframe_${q} ×${r.ns['qframe_' + q]}`); }
  const bad = r.slots.filter(x => x.hit > Math.max(x.size, x.pitch) || x.hit < x.size); ok(r.slots.length >= 30 && !bad.length, `${name} ${r.slots.length} 格点击区 ≥ 格且 ≤ 格距（不重叠）`);
  if (mobile) { const bagS = r.slots.filter(x => x.size === 56), eqS = r.slots.filter(x => x.size === 60);
    ok(Math.min(...bagS.map(x => x.hit)) * r.u >= 36 - 0.5, `${name} 背包格点击区 ${(bagS[0].hit * r.u).toFixed(1)} CSS px ≥36`);
    ok(Math.min(...eqS.map(x => x.hit)) * r.u >= 36 - 0.5, `${name} 装备格点击区 ${(eqS[0].hit * r.u).toFixed(1)} CSS px ≥36`); }
  await page.screenshot({ path: `${OUT}${name}-bag-equip.png` });
  // 选中（手机点一次 → slot_sel + 提示；桌面悬停 → 提示）
  const pos = await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); let hit = null; const walk = l => l.forEach(o => { if (!hit && o.getData?.('slot') && o.getData('slotSize') === 56) hit = o; if (o.list) walk(o.list); }); walk(U.panel.root.list); const bb = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = U.cameras.main.worldView; return { x: cv.left + (bb.centerX - wv.x) / wv.width * cv.width, y: cv.top + (bb.centerY - wv.y) / wv.height * cv.height }; });
  if (mobile) await page.touchscreen.tap(pos.x, pos.y); else await page.mouse.move(pos.x, pos.y); await sleep(600);
  r = await scan(page, 'UI'); const tip = await page.evaluate(() => window.__game.scene.getScene('UI').panel.tip?.name ?? !!window.__game.scene.getScene('UI').panel.tip);
  ok(!!tip, `${name} ${mobile ? '点选' : '悬停'}背包格 → 装备对比/提示 (${tip})`);
  if (mobile && !blocked) ok(r.ns.slot_sel === 1, `${name} 选中格 slot_sel`);
  await page.screenshot({ path: `${OUT}${name}-select-compare.png` });
  // 技能行状态着色
  await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); U.panel.hideTip?.(); U.panel.close(); window.__game.scene.getScene('Battle').openPanel('skills'); }); await sleep(700);
  r = await scan(page, 'UI');
  if (blocked) ok(!Object.keys(r.tints).length, `${name} 技能行：无图集不叠色（原底色）`);
  else ok(r.tints.learned > 0 && r.tints.learnable > 0, `${name} 技能行状态着色 ${JSON.stringify(r.tints)}`);
  await page.screenshot({ path: `${OUT}${name}-skills.png` });
  const errs = w.errs.filter(e => !/404|Failed to load/i.test(e)); ok(!errs.length, `${name} 无脚本错误 ${errs.slice(0, 3).join(' | ')}`);
  await b.close(); srv.stop();
}
console.log(fail ? `FAIL ${fail}` : 'ui-slots e2e 全过'); process.exit(fail ? 1 : 0);
