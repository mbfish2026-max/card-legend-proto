// feat/batch2-art：真实运行，进 B2 各层截图，检查新怪立绘/背景纹理已加载、技能栏图标无报错
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'taoist', level: 40, exp: 0, gold: 50000, pots: [50, 0, 0, 9], floorIndex: 5, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch(); const out = [];
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const tex = await page.evaluate(() => { const T = window.__game.textures; const ids = ['dung_beetle', 'woma_brave', 'woma_general', 'fire_woma', 'dark_warrior', 'mine_zombie', 'summon_beast', 'divine_beast', 'shenshou', 'bg_floor25', 'bg_floor28', 'bg_floor33']; return Object.fromEntries(ids.map(k => [k, T.exists(k) ? T.get(k).getSourceImage().width : 0])); });
    const rows = [];
    for (const i of [24, 25, 27, 29, 31, 32]) {
      await page.evaluate(i => { const W = window.__game.scene.getScene('Battle').world; W.reached.add(i); W.teleportReadyAt = 0; W.gold = 1e6; W.town ? W.townTeleport(i) : W.teleport(i); W.hero.hp = W.hero.maxHp = 1e6; }, i); await sleep(1500);
      rows.push(await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { i: W.floorIndex, bg: W.floor.bg, mobs: [...new Set(W.units.filter(u => u.team === 'enemy' && u.alive).map(u => u.def?.id ?? u.id))] }; }));
      await page.screenshot({ path: `${dir}/ba-${vw}-${i}.png` });
    }
    out.push({ vw, tex, rows, errs: w.errs }); await page.close();
  }
} finally { (await import('node:fs')).writeFileSync(dir + '/ba-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
