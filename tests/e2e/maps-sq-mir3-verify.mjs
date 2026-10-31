// feat/maps-sq-mir3：真实运行，真点小地图 4 个裂隙节点，再逐层传送到 56–79 验证进入/刷怪/回城；顺带看批3美术（下标 34/39/46/53）
// 用法：npm run build && node tests/e2e/maps-sq-mir3-verify.mjs [截图目录]
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
    await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (let k = 0; k < 80; k++) W.reached.add(k); W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.time += 10; W.step(0.05); W.teleportReadyAt = 0; W.gold = 1e6; window.__game.scene.getScene('Battle').openPanel('map'); }); await sleep(800);
    const mini = [];
    for (const [rg, nd] of [['^毒蛇山谷', '^异界裂隙·将军坟东一层'], ['^盟重省', '^异界裂隙·沙漠'], ['^封魔谷', '^异界裂隙·禁地·魔穴'], ['^白日门', '^异界裂隙·潘夜神殿']]) {
      await page.evaluate(() => { const S = window.__game.scene.getScene('Battle'); const W = S.world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.time += 10; W.step(0.05); W.teleportReadyAt = 0; window.__game.scene.getScene('UI').panel?.close?.(); S.openPanel('map'); }); await sleep(800);
      let reg = await findPos(page, 'UI', rg);
      for (const dx of [-0.4, 0.4, -0.4, 0.4]) { if (reg) break; for (let d = 0; d < 5 && !reg; d++) { await page.mouse.move(vw * 0.5, vh * 0.5); await page.mouse.down(); await page.mouse.move(vw * (0.5 + dx), vh * 0.5, { steps: 5 }); await page.mouse.up(); await sleep(250); reg = await findPos(page, 'UI', rg); } }
      if (reg) await tap({ x: reg.x, y: reg.y - 30 * vh / 720 });
      const node = await findPos(page, 'UI', nd); await page.screenshot({ path: `${dir}/sq-map-${vw}-${mini.length}.png` });
      let viaMap = null; if (node) { await tap({ x: node.x, y: node.y - 38 * vh / 720 }); const go = await findPos(page, 'UI', '^传送'); if (go) await tap(go); await sleep(1200); await page.keyboard.press('Escape'); await sleep(400); viaMap = await st(); }
      await page.evaluate(() => window.__game.scene.getScene('UI').panel?.close?.()); await page.keyboard.press('Escape'); await sleep(400);
      mini.push({ rg, nd, regionFound: !!reg, nodeFound: !!node, viaMap });
    }
    for (const i of [34, 39, 46, 53, ...Array.from({ length: 24 }, (_, k) => 56 + k)]) {
      await page.evaluate(i => { const W = window.__game.scene.getScene('Battle').world; W.reached.add(i); W.teleportReadyAt = 0; W.gold = 1e6; window.__r = W.town ? W.townTeleport(i) : W.teleport(i); W.hero.hp = W.hero.maxHp = 1e6; }, i); await sleep(1200);
      const r = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { i: W.floorIndex, name: W.floor.name, town: W.town, mobs: W.units.filter(u => u.team === 'enemy' && u.alive).length, bg: W.floor.bg, bgTex: window.__game.textures.exists(W.floor.bg), arts: [...new Set(W.units.filter(u => u.team === 'enemy').map(u => (u.art ?? u.id) + ':' + window.__game.textures.exists(u.art ?? u.id)))] }; });
      if (vw === 1280 || i === 56 || i === 79) await page.screenshot({ path: `${dir}/sq-${vw}-${i}.png` });
      // 回城：清怪后走到起点回城入口
      const t = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => W.kill(u)); W.time += 10; W.step(0.05); W.hero.x = 100; return [W.atReturnGate(), W.returnToTown()];  });
      await sleep(800); const town = await page.evaluate(() => window.__game.scene.getScene('Battle').world.town);
      rows.push({ ...r, gate: t, town });
    }
    report[`${vw}x${vh}`] = { mini, rows, errs: w.errs };
    (await import('node:fs')).appendFileSync(dir + '/sq-report.json', JSON.stringify(report[`${vw}x${vh}`]) + '\n'); await page.close();
  }
} finally { await b.close(); sv.stop(); process.exit(0); }
