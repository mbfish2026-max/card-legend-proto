// bounty-icon：手机悬赏按钮改用 INV_Misc_Bag_08 图标；检查图片加载、点击区 ≥44px；三种手机尺寸截图（不覆盖旧图）
import { startPreview, launch, watch, sleep } from './lib.mjs';
import { mkdirSync, existsSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/bounty-icon'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const shot = async (p, f) => { let path = `${dir}/${f}.png`; if (existsSync(path)) path = `${dir}/${f}-${Date.now()}.png`; await p.screenshot({ path }); return path; };
const sv = await startPreview(), b = await launch();
try {
  for (const [VW, VH] of [[844, 390], [874, 402], [932, 430]]) {
    const p = await b.newPage(); await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(() => localStorage.clear());
    await p.goto(sv.url + '?class=warrior'); await p.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const r = await p.evaluate(() => { const e = document.querySelector('#mh-top [data-id="quests"]'), img = e?.querySelector('img'), bb = e?.getBoundingClientRect();
      return { w: bb?.width, h: bb?.height, loaded: !!img && img.complete && img.naturalWidth > 0, src: img?.getAttribute('src'), emoji: e?.textContent.includes('🎯') }; });
    chk(r.loaded && !r.emoji && r.w >= 44 && r.h >= 44, `${VW}x${VH} 悬赏按钮图标加载、无 🎯、点击区 ${r.w}x${r.h}`);
    console.log('shot', await shot(p, `mobile-hud-${VW}x${VH}`));
    const e = await p.$('#mh-top [data-id="quests"]'), bb = await e.boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(1000);
    const open = await p.evaluate(() => window.__game.scene.getScene('UI').panel?.mode ?? window.__game.scene.getScene('UI').panel?.open);
    console.log('panel', JSON.stringify(open)); console.log('shot', await shot(p, `mobile-bounty-open-${VW}x${VH}`));
    chk(w.errs.length === 0, `${VW}x${VH} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.stop?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
