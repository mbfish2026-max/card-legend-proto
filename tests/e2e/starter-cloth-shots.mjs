// feat/starter-cloth：出生布衣（三职业护甲栏、绑定）+ 老存档补发 + T1/T2/T3 代表物品提示截图（不覆盖旧截图）
// 用法：npm run build && node tests/e2e/starter-cloth-shots.mjs [目录]（默认 docs/shots/starter-cloth）
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync, existsSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/starter-cloth'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const shot = async (p, f) => { let path = `${dir}/${f}.png`; if (existsSync(path)) path = `${dir}/${f}-${Date.now()}.png`; await p.screenshot({ path }); return path; };
const sv = await startPreview(), b = await launch();
const VPS = [[1280, 720, false], [844, 390, true], [874, 402, true], [932, 430, true]];
const TIPS = [['T1', 'h_hex_ring', 9], ['T2', 'iron_sword', 11], ['T3', 'tao_helm', 20]];
const page = async (VW, VH, mob, save) => {
  const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
  await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
  await p.evaluateOnNewDocument(s => { localStorage.clear(); if (s) localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save ?? null);
  return { p, w };
};
try {
  for (const [VW, VH, mob] of VPS) {
    for (const cls of ['warrior', 'mage', 'taoist']) {
      const { p, w } = await page(VW, VH, mob);
      await p.goto(sv.url + '?class=' + cls); await p.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
      const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, a = W.equip.armor, s = W.toSave(); return { item: a?.item, bound: !!a?.bound, req: a?.req, flag: s.starterClothGiven, wp: W.equip.weapon?.item }; });
      chk(r.item === 'cloth' && r.bound && r.req === 1 && r.flag === 1 && r.wp === 'wood_sword', `${VW}x${VH} ${cls} 新开局 护甲=布衣 绑定 req1 标记、武器=木剑（${JSON.stringify(r)}）`);
      await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
      console.log('shot', await shot(p, `equip-new-${cls}-${VW}x${VH}`));
      if (cls === 'warrior') {
        for (const [t, id, rq] of TIPS) {
          const req = await p.evaluate(id => { const g = window.__game, W = g.scene.getScene('Battle').world, U = g.scene.getScene('UI'); W.bag = W.bag.filter(i => !i.tmpShot); const it = W.makeItem(id); it.tmpShot = 1; W.bag.push(it);
            U.panel.toggle('bag'); U.panel.toggle('bag'); U.panel.lastDown = U.time.now; U.panel.showTip(it, U.scale.width * 0.45, U.scale.height * 0.3); return it.req; }, id);
          await sleep(60); const on = await p.evaluate(() => !!window.__game.scene.getScene('UI').panel.tip);
          chk(req === rq && on, `${VW}x${VH} ${t} ${id} 需求 ${req}（期望 ${rq}）提示显示`);
          console.log('shot', await shot(p, `tooltip-${t}-${id}-req${rq}-${VW}x${VH}`));
        }
      }
      chk(w.errs.length === 0, `${VW}x${VH} ${cls} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
    }
    // 老存档：有 starterGiven、无 starterClothGiven、护甲栏空 → 补发布衣
    const old = { v: 1, cls: 'mage', level: 12, exp: 0, gold: 50, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [], starterGiven: 1 };
    const { p, w } = await page(VW, VH, mob, old);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
    const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, a = W.equip.armor; return { item: a?.item, bound: !!a?.bound, flag: W.toSave().starterClothGiven, wp: W.equip.weapon?.item }; });
    chk(r.item === 'cloth' && r.bound && r.flag === 1, `${VW}x${VH} 老存档（有木剑标记、护甲栏空）补发布衣（${JSON.stringify(r)}）`);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
    console.log('shot', await shot(p, `equip-oldsave-${VW}x${VH}`));
    chk(w.errs.length === 0, `${VW}x${VH} 老存档 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.stop?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
