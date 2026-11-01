// feat/net-test：build 产物 /net-test.html 截图 + 复制 + 离线（1280×720 / 844×390 触屏）
import { startPreview, launch, sleep } from './lib.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots'; mkdirSync(dir, { recursive: true });
const sv = await startPreview(), b = await launch(); const out = {};
const results = p => p.evaluate(() => [...document.querySelectorAll('.it')].map(e => e.innerText.replace(/\s+/g, ' ')));
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const r = (out[`${vw}x${vh}`] = {});
    const t0 = Date.now(); await page.goto(sv.url + 'net-test.html'); await page.waitForFunction(() => window.__ntDone, { timeout: 40000 }); r.sec = (Date.now() - t0) / 1000;
    r.items = await results(page); await page.screenshot({ path: `${dir}/net-test-${vw}.png`, fullPage: true });
    if (touch) await page.tap('#copy'); else await page.click('#copy'); await sleep(500);
    r.copied = await page.evaluate(() => ({ text: window.__ntCopied?.slice(0, 400), btn: document.getElementById('copy').textContent, fb: !!document.getElementById('fbt') }));
    await page.screenshot({ path: `${dir}/net-test-${vw}-copied.png`, fullPage: true });
    // 离线：同源也断开，三项都应失败而不是卡住
    await page.setOfflineMode(true); const t1 = Date.now(); await page.evaluate(() => document.getElementById('again').click());
    await page.waitForFunction(() => window.__ntDone, { timeout: 40000 }); r.offSec = (Date.now() - t1) / 1000; r.offline = await results(page);
    await page.screenshot({ path: `${dir}/net-test-${vw}-offline.png`, fullPage: true }); await page.setOfflineMode(false); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/net-test-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
