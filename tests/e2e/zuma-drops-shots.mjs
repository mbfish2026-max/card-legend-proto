// feat/zuma-drops：祖玛三件（祖玛头盔即法/道 T5 头盔）提示截图，四尺寸；不覆盖旧截图
// 用法：npm run build && node tests/e2e/zuma-drops-shots.mjs [目录]（默认 docs/shots/zuma-drops）
import { startPreview, launch, watch, sleep } from './lib.mjs';
import { mkdirSync, existsSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/zuma-drops'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const shot = async (p, f) => { let path = `${dir}/${f}.png`; if (existsSync(path)) path = `${dir}/${f}-${Date.now()}.png`; await p.screenshot({ path }); return path; };
const sv = await startPreview(), b = await launch();
const VPS = [[1280, 720, false], [844, 390, true], [874, 402, true], [932, 430, true]];
const IDS = ['set_zuma_helm', 'set_zuma_ring', 'set_zuma_boots'];
try {
  for (const [VW, VH, mob] of VPS) for (const cls of ['mage', 'taoist']) {
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(() => localStorage.clear());
    await p.goto(sv.url + '?class=' + cls); await p.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.level = 30; window.__game.scene.getScene('UI').panel.toggle('bag'); }); await sleep(1200);
    for (const id of (cls === 'mage' ? IDS : ['set_zuma_helm'])) {
      const r = await p.evaluate(id => { const g = window.__game, W = g.scene.getScene('Battle').world, U = g.scene.getScene('UI'); W.bag = W.bag.filter(i => !i.tmpShot); const it = W.makeItem(id); it.tmpShot = 1; W.bag.push(it);
        U.panel.toggle('bag'); U.panel.toggle('bag'); U.panel.lastDown = U.time.now; U.panel.showTip(it, U.scale.width * 0.45, U.scale.height * 0.3); return { req: it.req, lv: W.level }; }, id);
      await sleep(80); const on = await p.evaluate(() => !!window.__game.scene.getScene('UI').panel.tip);
      chk(r.req === 30 && r.lv === 30 && on, `${VW}x${VH} ${cls} ${id} 需求30 提示显示（${JSON.stringify(r)}）`);
      console.log('shot', await shot(p, `tooltip-${cls}-${id}-${VW}x${VH}`));
    }
    chk(w.errs.length === 0, `${VW}x${VH} ${cls} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.stop?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
