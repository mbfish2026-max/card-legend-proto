// B5：桌面 HUD 血球四层 + 牌匾/底栏/经验条/日志框/总览 ✕；1280×720 满/半/空血 有/无图集；844×390 手机无血球、HUD 不变。截图 docs/shots/ui-art/b05/
// 用法：npm run build && node tests/e2e/ui-hud-verify.mjs
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const OUT = new URL('../../docs/shots/ui-art/b05/', import.meta.url).pathname;
const MOB = { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true, deviceScaleFactor: 2 };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['thrust', 'half_moon'] };
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fail++; };
const scan = page => page.evaluate(() => { const U = window.__game.scene.getScene('UI'), r = { names: {}, ns: {}, orb: [], vis: 0 };
  U.children.list.forEach(o => { if (!o.visible) return; r.vis++; if (o.name) r.names[o.name] = (r.names[o.name] ?? 0) + 1; if (o.type === 'NineSlice') r.ns[o.frame.name] = (r.ns[o.frame.name] ?? 0) + 1;
    if (/^orb/.test(o.name)) r.orb.push({ n: o.name, d: o.depth, w: o.displayWidth, crop: o.isCropped ? [o._crop.y, o._crop.height] : null, sx: o.scaleX }); });
  return r; });
for (const [tag, mobile] of [['1280', false], ['844', true]]) for (const blocked of [false, true]) {
  const name = tag + (blocked ? '-fallback' : ''), srv = await startPreview({ block: u => blocked && /ui_atlas/.test(u) });
  const b = await launch(), page = await b.newPage(), w = watch(page);
  if (mobile) { await page.setUserAgent(UA); await page.setViewport(MOB); } else await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(srv.url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
  { const p = await findPos(page, 'Title', '继'); if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle').hud, { timeout: 60000 }); await sleep(1500);
  // 只改显示：暂停战斗场景后直接驱动 HUD 显示（不改 HP 逻辑）
  const setOrb = r => page.evaluate(r => { const B = window.__game.scene.getScene('Battle'); B.scene.pause(); const h = B.world.hero, H = B.hud;
    for (const [o, max] of [[H.hp, h.maxHp], [H.mp, h.maxMp]]) { o.shown = r; o.update(r * max, max, 0); } }, r);
  if (!mobile) {
    for (const [r, lab] of [[1, 'full'], [0.5, 'half'], [0, 'empty']]) {
      await setOrb(r); await sleep(300); const s = await scan(page);
      if (blocked) ok(!s.orb.length && !s.ns.title_plate && !s.ns.dialog_frame, `${name} ${lab}：图集被拦 → 代码血球/牌匾/底栏`);
      else {
        const n = s.orb.map(o => o.n); ok(n.filter(x => x === 'orbFrame').length === 2 && n.filter(x => x === 'orbFill').length === 2 && n.filter(x => x === 'orbGlass').length === 2 && n.filter(x => x === 'orbBase').length === 2, `${name} ${lab}：红蓝两球各四层`);
        const f = s.orb.filter(o => o.n === 'orbFill'), fr = s.orb.find(o => o.n === 'orbFrame');
        ok(f.every(o => o.crop && Math.abs(o.crop[1] - 64 * r) < 0.01 && Math.abs(o.crop[0] - 64 * (1 - r)) < 0.01), `${name} ${lab}：setCrop 水位 ${f.map(o => o.crop?.join('/')).join(' ')}`);
        ok(Math.abs(fr.w - 136) < 0.01 && Math.abs(f[0].w - 136 * 104 / 128) < 0.01, `${name} ${lab}：框 ${fr.w}、液面 ${f[0].w.toFixed(1)}（D×104/128）`);
        if (r === 1) { ok(s.ns.title_plate === 1 && s.ns.dialog_frame >= 1 && s.ns.bar_frame >= 1 && s.ns.tooltip_frame >= 1, `${name} 牌匾 title_plate / 底栏 dialog_frame / 经验条 bar_frame / 日志 tooltip_frame`); }
      }
      await page.screenshot({ path: `${OUT}${name}-orb-${lab}.png` });
      await page.screenshot({ path: `${OUT}${name}-orb-${lab}-crop.png`, clip: { x: 200, y: 540, width: 880, height: 180 } });
      await page.evaluate(() => window.__game.scene.getScene('Battle').scene.resume()); await sleep(200);
    }
    // 总览 ✕
    await page.evaluate(() => window.__game.scene.getScene('Battle').hud.onOverview?.()); await sleep(400);
    const ov = await page.evaluate(() => { const c = window.__game.scene.getScene('UI').children.getByName('mapOverview'); return c ? { img: !!c.getByName('ovwCloseImg'), hit: !!c.getByName('ovwClose') } : null; });
    ok(ov && ov.hit && ov.img === !blocked, `${name} 总览面板 ✕ ${blocked ? '回退矩形' : 'btn_close'}，点击区保留`);
    await page.screenshot({ path: `${OUT}${name}-overview.png` });
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.hud.toggleOverview(null); }); await sleep(200);
    const gone = await page.evaluate(() => !window.__game.scene.getScene('UI').children.getByName('mapOverview')); ok(gone, `${name} 总览可关闭`);
  } else {
    await sleep(500); const s = await scan(page);
    ok(!s.orb.length, `${name} 手机：无血球图层`);
    const anyNs = await page.evaluate(() => window.__game.scene.getScene('UI').children.list.filter(o => o.visible && (o.type === 'NineSlice' || /^orb/.test(o.name))).length);
    ok(anyNs === 0, `${name} 手机：Phaser HUD 无可见九宫格/血球（DOM HUD 照旧）`);
    const dom = await page.evaluate(() => !!document.querySelector('[data-id=pot0]')); ok(dom, `${name} 手机 DOM HUD 存在`);
    await page.screenshot({ path: `${OUT}${name}-hud.png` });
  }
  { const e = w.errs.filter(x => !(blocked && /404/.test(x))); ok(!e.length, `${name} 控制台 0 报错（图集被拦的 404 除外）${e.slice(0, 2).join(' | ')}`); }
  await b.close(); srv.close?.();
}
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
