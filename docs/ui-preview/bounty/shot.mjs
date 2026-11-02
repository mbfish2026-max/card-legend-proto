// 悬赏图标实机截图（复用 tests/e2e/lib.mjs）。用法：npm run build && node docs/ui-preview/bounty/shot.mjs
import { startPreview, launch, sleep, findPos } from '../../../tests/e2e/lib.mjs';
const dir = 'docs/ui-preview/bounty';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 5000, pots: [50, 50, 50, 50], floorIndex: 1, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
const sv = await startPreview(), b = await launch();
try {
  for (const [vw, vh] of [[1280, 720], [844, 390]]) {
    const touch = vw !== 1280, page = await b.newPage(); if (touch) await page.setUserAgent(UA);
    await page.setViewport({ width: vw, height: vh, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('UI')?.panel, { timeout: 60000 }); await sleep(2000);
    await page.screenshot({ path: `${dir}/shot_${vw}x${vh}.png` });
    if (!touch) await page.screenshot({ path: `${dir}/shot_${vw}x${vh}_menu.png`, clip: { x: 1030, y: 610, width: 250, height: 110 } });
    await page.close();
  }
} finally { await b.close(); sv.close?.(); sv.kill?.(); }
process.exit(0);
