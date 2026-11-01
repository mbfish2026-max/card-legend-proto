// feat/eg-dungeon：进入赤月魔穴（Lv48，今日已用 1 次）副本提示截图（1280×720 / 844×390）
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/card-legend-proto-research/shots/eg-dungeon'; mkdirSync(dir, { recursive: true });
const save = JSON.parse(readFileSync(process.argv[3] ?? '/tmp/egd-save.json', 'utf8'));
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page); const r = (out[`${vw}x${vh}`] = {});
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(800);
    await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); s.world.loadFloor(12); }); await sleep(1500);
    r.left = await page.evaluate(() => window.__game.scene.getScene('Battle').world.dungeonLeft('chiyue'));
    r.log = await page.evaluate(() => JSON.stringify(window.__game.scene.getScene('Battle').world.logs?.slice?.(-3) ?? null));
    await page.screenshot({ path: `${dir}/eg-dungeon-${vw}.png` });
    r.errs = w.errs.slice(0, 5); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/eg-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
