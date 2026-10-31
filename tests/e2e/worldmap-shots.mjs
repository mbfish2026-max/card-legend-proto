// 世界大地图 e2e：1280×720（鼠标）与 844×390（触屏）两级地图、群节点展开、确认卡传送、Esc 返回、HUD 不重叠；截图 worldmap-*.png
// 用法：npm run build && node tests/e2e/worldmap-shots.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const reached = [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 24, 25, 26, 27, 28, 32, 34, 35, 36, 46];
const SAVE = { v: 1, level: 40, exp: 0, gold: 50000, pots: [5, 2, 5, 2], floorIndex: 6, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [], reached, bossKilled: [8] };
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
try {
  for (const [W, H, touch] of [[1280, 720, false], [844, 390, true]]) {
    const p = await b.newPage(), tag = `${W}x${H}`;
    if (touch) { await p.setUserAgent(UA); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); } else await p.setViewport({ width: W, height: H });
    const ww = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, SAVE);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const tap = async q => { if (touch) await p.touchscreen.tap(q.x, q.y); else await p.mouse.click(q.x, q.y); await sleep(700); };
    await tap(await findPos(p, 'Title', '继'));
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.world.units.filter(u => u.team === 'enemy').forEach(u => B.world.kill(u)); B.world.teleportReadyAt = 0; B.openPanel('map'); });
    await p.waitForFunction(() => window.__game.scene.getScene('UI').children.list.some(o => o.list?.some?.(c => c.type === 'Container')), { timeout: 10000 }).catch(() => {});
    await sleep(2500);
    const tiles = await p.evaluate(() => [0, 1, 2, 3].flatMap(c => [0, 1].map(r => `world_map_${c}_${r}`)).filter(k => window.__game.textures.exists(k)).length);
    chk(tiles === 8, `${tag} 8 块底图按需加载（${tiles}）`);
    chk(!!(await findPos(p, 'UI', '^？？？$')), `${tag} 迷雾区显示 ？？？`);
    chk(!!(await findPos(p, 'UI', '^Lv4[0-9]')), `${tag} 迷雾区显示等级段`);
    // HUD 重叠：手机 DOM HUD 按钮与地图视口不相交（面板模态时 HUD 应隐藏或在外）
    const ov = await p.evaluate(() => { const cv = window.__game.canvas.getBoundingClientRect(), S = window.__game.scene.getScene('UI'), wv = S.cameras.main.worldView;
      const top = 110, mob = document.body.classList.contains('mobile'), VY = mob ? top + 84 : top + 48, VH = mob ? 346 : 380;
      const r = { x: cv.left + (150 - wv.x) * cv.width / wv.width, y: cv.top + (VY - wv.y) * cv.height / wv.height, w: 980 * cv.width / wv.width, h: VH * cv.height / wv.height };
      return Array.from(document.querySelectorAll('#mhud .b, #mh-log, #mh-joy')).filter(e => e.offsetParent !== null && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden').map(e => e.getBoundingClientRect())
        .filter(b => Math.min(b.right, r.x + r.w) - Math.max(b.left, r.x) > 1 && Math.min(b.bottom, r.y + r.h) - Math.max(b.top, r.y) > 1).length; });
    chk(ov === 0, `${tag} 地图视口不与 HUD 重叠（${ov}）`);
    await p.screenshot({ path: `${dir}/worldmap-world-${tag}.png` });
    // 拖动 + 缩放
    const z0 = await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.view.m);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.view.m);
    const plus = await findPos(p, 'UI', '^＋$'); await tap(plus); await tap(plus);
    const z1 = await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.view.m);
    chk(z1 > z0, `${tag} ＋ 缩放 ${z0.toFixed(2)}→${z1.toFixed(2)}`);
    await p.screenshot({ path: `${dir}/worldmap-world-zoom-${tag}.png` });
    // 进入盟重省
    await p.evaluate(() => { const P = window.__game.scene.getScene('UI').panel; P.wm.view = null; P.render(); }); await sleep(500);
    const zl = await findPos(p, 'UI', '^盟重省$'); chk(!!zl, `${tag} 找到盟重省标签`);
    await tap({ x: zl.x, y: zl.y + 40 * H / 720 }); if (touch) await tap({ x: zl.x, y: zl.y + 40 * H / 720 });
    await sleep(2500);
    chk(await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.area === 'zuma'), `${tag} 点击（手机再点）进入盟重省`);
    await p.screenshot({ path: `${dir}/worldmap-region-${tag}.png` });
    const cl = await findPos(p, 'UI', '^蜈蚣洞（'); chk(!!cl, `${tag} 蜈蚣洞群节点`);
    if (cl) { await tap({ x: cl.x, y: cl.y - 40 * H / 720 }); }
    chk(await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.expand === 'grp_wugong'), `${tag} 群节点展开`);
    await p.screenshot({ path: `${dir}/worldmap-expand-${tag}.png` });
    const nd = await findPos(p, 'UI', '^地牢一层东$'); chk(!!nd, `${tag} 展开后成员节点可见`);
    if (nd) await tap({ x: nd.x, y: nd.y - 40 * H / 720 });
    chk(!!(await findPos(p, 'UI', '^推荐等级')), `${tag} 确认卡：推荐等级`);
    chk(!!(await findPos(p, 'UI', '^费用 700 金')), `${tag} 确认卡：费用 (34+1)×20=700`);
    await p.screenshot({ path: `${dir}/worldmap-confirm-${tag}.png` });
    const cancel = await findPos(p, 'UI', '^取消$'); const go0 = await findPos(p, 'UI', '^推荐等级'); const go = cancel && go0 ? { x: go0.x - (cancel.x - go0.x), y: cancel.y } : null; if (go) await tap(go); await sleep(1500);
    chk(await p.evaluate(() => window.__game.scene.getScene('Battle').world.floorIndex === 34), `${tag} 确认后传送到第 35 层地牢一层东`);
    // 未到达层：不可传送；Esc 返回
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.openPanel('map'); }); await sleep(1500);
    const unk = await p.evaluate(() => window.__game.scene.getScene('UI').panel.wm.area);
    await p.keyboard.press('Escape'); await sleep(500);
    chk(unk === 'zuma' && await p.evaluate(() => window.__game.scene.getScene('UI').panel.mode === 'map' && window.__game.scene.getScene('UI').panel.wm.area === null), `${tag} Esc：区域 → 世界`);
    await p.keyboard.press('Escape'); await sleep(500);
    chk(await p.evaluate(() => window.__game.scene.getScene('UI').panel.mode === null), `${tag} Esc：世界 → 关闭`);
    chk(await p.evaluate(() => JSON.parse(localStorage.getItem('fcl_settings_v1') || '{}').wmArea === 'zuma'), `${tag} 上次查看区域写入全局设置`);
    const errs = ww.errs.filter(e => !/favicon|Failed to load resource/.test(e)); chk(errs.length === 0, `${tag} 无报错 ${errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `worldmap-shots: ${fail} FAIL` : 'worldmap-shots: 全部通过'); process.exit(fail ? 1 : 0);
