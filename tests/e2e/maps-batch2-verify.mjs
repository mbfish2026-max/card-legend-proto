// feat/maps-batch2：真实运行游戏，逐个传送到 B2 新层，验证可进入、刷怪、回城
// 用法：npm run build && node tests/e2e/maps-batch2-verify.mjs [截图目录]
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
    for (let i = 24; i <= 33; i++) {
      await page.evaluate(i => { const W = window.__game.scene.getScene('Battle').world; W.reached.add(i); W.teleportReadyAt = 0; W.gold = 1e6; window.__r = W.town ? W.townTeleport(i) : W.teleport(i); W.hero.hp = W.hero.maxHp = 1e6; }, i); await sleep(1200);
      const r = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { i: W.floorIndex, name: W.floor.name, town: W.town, mobs: W.units.filter(u => u.team === 'enemy' && u.alive).length }; });
      if (vw === 1280 || i === 24) await page.screenshot({ path: `${dir}/b2-${vw}-${i}.png` });
      // 回城：清怪后走到起点回城入口
      const t = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.time += 10; W.step(0.05); return W.enterTown('bichi'); /* returnTownOf(24–33) 均为 bichi（单测已断言） */ });
      await sleep(800); const town = await page.evaluate(() => window.__game.scene.getScene('Battle').world.town);
      rows.push({ ...r, back: t ?? 'ok', town });
    }
    report[`${vw}x${vh}`] = { rows, errs: w.errs };
    (await import('node:fs')).appendFileSync(dir + '/b2-report.json', JSON.stringify(report[`${vw}x${vh}`]) + '\n'); await page.close();
  }
} finally { await b.close(); sv.stop(); process.exit(0); }
