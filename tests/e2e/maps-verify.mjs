// feat/maps-more B1：真实运行游戏，按 FLOOR_ORDER 走完洞穴群子层，验证 S 上一层、回城、小地图入口
// 用法：npm run build && node tests/e2e/maps-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 50000, pots: [50, 0, 0, 9], floorIndex: 4, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch(); const report = {};
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const st = () => page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; return { i: W.floorIndex, name: W.floor.name, town: W.town }; });
    const seq = [(await st()).name];
    for (let k = 0; k < 7; k++) {
      const i0 = (await st()).i;
      await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; h.hp = h.maxHp = 1e6; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); h.x = W.exitX; });
      for (let t = 0; t < 30 && (await st()).i === i0; t++) { await sleep(300); if (t % 5 === 4) await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.x = W.exitX; B.onKey(' '); }); }
      const s = await st(); seq.push(s.name); if (vw === 1280) await page.screenshot({ path: `${dir}/maps-${k + 1}-${s.i}.png` });
    }
    // 在尸王殿起点按 S → 应回沃玛自然洞穴·二
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.hero.x = 100; }); await sleep(300);
    await page.keyboard.press('KeyS'); await sleep(1500); const back = await st();
    await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.x = 100; }); await page.keyboard.press('KeyS'); await sleep(1500); const back2 = await st();
    // 小地图：打开地图面板，找骷髅洞节点并点击传送
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.world.teleportReadyAt = 0; B.openPanel('map'); }); await sleep(800);
    const tap = async q => { if (touch) await page.touchscreen.tap(q.x, q.y); else await page.mouse.click(q.x, q.y); await sleep(800); };
    for (let d = 0; d < 6 && !(await findPos(page, 'UI', '^沃玛森林')); d++) { await page.mouse.move(vw * 0.3, vh * 0.5); await page.mouse.down(); await page.mouse.move(vw * 0.7, vh * 0.5, { steps: 5 }); await page.mouse.up(); await sleep(300); }
    const reg = await findPos(page, 'UI', '^沃玛森林'); if (reg) await tap({ x: reg.x, y: reg.y - 30 * vh / 720 }); await page.screenshot({ path: `${dir}/maps-mini-${vw}.png` });
    const node = await findPos(page, 'UI', '自然洞穴·二'); await page.screenshot({ path: `${dir}/maps-map-${vw}.png` });
    let viaMap = null; if (node) { if (touch) await page.touchscreen.tap(node.x, node.y); else await page.mouse.click(node.x, node.y); await sleep(800); const go = await findPos(page, 'UI', '^传送'); if (go) { if (touch) await page.touchscreen.tap(go.x, go.y); else await page.mouse.click(go.x, go.y); } await sleep(1200); await page.keyboard.press('Escape'); await sleep(400); viaMap = await st(); }
    if (!viaMap || viaMap.i !== 18) { await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.teleportReadyAt = 0; W.teleport(15); }); await sleep(800); viaMap = { ...(await st()), api: true }; }
    await page.evaluate(() => window.__game.scene.getScene('UI').panel?.close?.()); await page.keyboard.press('Escape'); await sleep(500);
    const mobs = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return W.units.filter(u => u.team === 'enemy' && u.alive).length; });
    // 回城：洞穴一层起点回城入口
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.hero.x = 100; W.hero.x = 100; return null; }); await sleep(200); const gate = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; return [W.atReturnGate(), W.returnToTown(), B.paused]; }); await sleep(2000);
    const town = await st(); await page.screenshot({ path: `${dir}/maps-town-${vw}.png` });
    report[`${vw}x${vh}`] = { seq, sBack: back.name, sBack2: back2.name, mapNodeFound: !!node, viaMap, mobs, gate, town: town.town ?? town.name, errs: w.errs };
    (await import("node:fs")).appendFileSync(dir + "/maps-report.json", JSON.stringify(report[`${vw}x${vh}`]) + "\n"); await page.close();
  }
} finally { await b.close(); sv.stop(); process.exit(0); }
