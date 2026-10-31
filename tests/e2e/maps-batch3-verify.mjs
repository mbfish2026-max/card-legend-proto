// feat/maps-batch3：真实运行游戏，逐个传送到 B3 新层，验证可进入、刷怪、回城
// 用法：npm run build && node tests/e2e/maps-batch3-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 50000, pots: [50, 0, 0, 9], floorIndex: 5, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch(); const report = {};
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const rows = [];
    const st = () => page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { i: W.floorIndex, name: W.floor.name, town: W.town }; });
    const tap = async q => { if (touch) await page.touchscreen.tap(q.x, q.y); else await page.mouse.click(q.x, q.y); await sleep(800); };
    // 真点小地图：打开地图→拖到盟重省→点区域→点「石墓七层」节点→点「传送」
    await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (let k = 0; k < 56; k++) W.reached.add(k); W.teleportReadyAt = 0; W.gold = 1e6; window.__game.scene.getScene('Battle').openPanel('map'); }); await sleep(800);
    for (let d = 0; d < 8 && !(await findPos(page, 'UI', '^盟重省')); d++) { await page.mouse.move(vw * 0.7, vh * 0.5); await page.mouse.down(); await page.mouse.move(vw * 0.3, vh * 0.5, { steps: 5 }); await page.mouse.up(); await sleep(300); }
    const reg = await findPos(page, 'UI', '^盟重省'); if (reg) await tap({ x: reg.x, y: reg.y - 30 * vh / 720 });
    const node = await findPos(page, 'UI', '^石墓七层'); await page.screenshot({ path: `${dir}/b3-map-${vw}.png` });
    let viaMap = null; if (node) { await tap(node); const go = await findPos(page, 'UI', '^传送'); if (go) await tap(go); await sleep(1200); await page.keyboard.press('Escape'); await sleep(400); viaMap = await st(); }
    await page.evaluate(() => window.__game.scene.getScene('UI').panel?.close?.()); await page.keyboard.press('Escape'); await sleep(500);
    const mini = { regionFound: !!reg, nodeFound: !!node, viaMap };
    for (let i = 34; i <= 55; i++) {
      await page.evaluate(i => { const W = window.__game.scene.getScene('Battle').world; W.reached.add(i); W.teleportReadyAt = 0; W.gold = 1e6; window.__r = W.town ? W.townTeleport(i) : W.teleport(i); W.hero.hp = W.hero.maxHp = 1e6; }, i); await sleep(1200);
      const r = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { i: W.floorIndex, name: W.floor.name, town: W.town, mobs: W.units.filter(u => u.team === 'enemy' && u.alive).length }; });
      if (vw === 1280 || i === 34) await page.screenshot({ path: `${dir}/b3-${vw}-${i}.png` });
      // 回城：清怪后走到起点回城入口
      const t = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.time += 10; W.step(0.05); W.hero.x = 100; return [W.atReturnGate(), W.returnToTown()]; /* 起点回城入口；returnTownOf(34–55) 均为 mengzhong（单测已断言） */ });
      await sleep(800); const town = await page.evaluate(() => window.__game.scene.getScene('Battle').world.town);
      rows.push({ ...r, gate: t, town });
    }
    report[`${vw}x${vh}`] = { mini, rows, errs: w.errs };
    (await import('node:fs')).appendFileSync(dir + '/b3-report.json', JSON.stringify(report[`${vw}x${vh}`]) + '\n'); await page.close();
  }
} finally { await b.close(); sv.stop(); process.exit(0); }
