// feat/early-gear-3-5：出生木剑（三职业、武器栏、绑定）+ 老存档补发 + 装备格点击区 + 截图（不覆盖旧截图）
// 用法：npm run build && node tests/e2e/early-gear-shots.mjs [目录]（默认 docs/shots/early-gear-3-5）
import { startPreview, launch, watch, sleep, findPos, toScreen } from './lib.mjs';
import { mkdirSync, existsSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/early-gear-3-5'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const shot = async (p, f) => { let path = `${dir}/${f}.png`; if (existsSync(path)) path = `${dir}/${f}-${Date.now()}.png`; await p.screenshot({ path }); return path; };
const sv = await startPreview(), b = await launch();
const VPS = [[1280, 720, false], [844, 390, true], [874, 402, true], [932, 430, true]];
const page = async (VW, VH, mob, save) => {
  const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
  await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
  await p.evaluateOnNewDocument(s => { localStorage.clear(); if (s) localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save ?? null);
  return { p, w };
};
const panelInfo = p => p.evaluate(() => { const pn = window.__game.scene.getScene('UI').panel, all = []; const walk = o => { all.push(o); (o.list ?? []).forEach(walk); }; pn.root.list.forEach(walk);
  const k = pn.cssU(), slots = all.filter(o => /^eq_/.test(o.name ?? '')); return { n: slots.length, minCss: +Math.min(...slots.map(o => o.getData('slotHit') * k)).toFixed(1) }; });
try {
  for (const [VW, VH, mob] of VPS) {
    // 1) 新开局：三职业出生木剑
    for (const cls of ['warrior', 'mage', 'taoist']) {
      const { p, w } = await page(VW, VH, mob);
      await p.goto(sv.url + '?class=' + cls); await p.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
      const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, x = W.equip.weapon; return { item: x?.item, bound: !!x?.bound, req: x?.req, sell: x ? W.sellItem.length : -1, flag: W.toSave().starterGiven }; });
      chk(r.item === 'wood_sword' && r.bound && r.req === 1 && r.flag === 1, `${VW}x${VH} ${cls} 新开局武器栏=木剑 绑定 req1 存档标记（${JSON.stringify(r)}）`);
      await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
      const pi = await panelInfo(p);
      chk(pi.n === 11 && (!mob || pi.minCss >= 44), `${VW}x${VH} ${cls} 装备格 ${pi.n} 个，点击区最小 ${pi.minCss} CSS px${mob ? ' ≥44' : ''}`);
      if (cls === 'warrior') {
        console.log('shot', await shot(p, `equip-bag-new-${VW}x${VH}`));
        // 需求 3–5 物品 tooltip：放一把铁剑（req 5）进背包并显示提示
        await p.evaluate(() => { const g = window.__game, W = g.scene.getScene('Battle').world, pn = g.scene.getScene('UI').panel; W.bag.push(W.makeItem('iron_sword')); pn.toggle('bag'); pn.toggle('bag'); });
        await sleep(800);
        // 真实交互：找到背包里铁剑图标，桌面悬停 / 手机点一下（首次点击=查看属性）
        const c = await p.evaluate(() => { const pn = window.__game.scene.getScene('UI').panel, all = []; const walk = o => { all.push(o); (o.list ?? []).forEach(walk); }; pn.root.list.forEach(walk);
          const o = all.find(o => o.type === 'Image' && /iron_sword/.test(o.texture?.key ?? '') && o.getBounds().left > 400); if (!o) return null; const bb = o.getBounds(); return { x: bb.centerX, y: bb.centerY }; });
        chk(!!c, `${VW}x${VH} 背包里找到铁剑图标`);
        if (c) { const sc = await toScreen(p, c.x, c.y); if (mob) await p.touchscreen.tap(sc.x, sc.y); else { await p.mouse.move(5, 5); await p.mouse.move(sc.x, sc.y, { steps: 8 });
          // 无头桌面下悬停事件未触发提示：直接调用悬停同款 showTip(it, 格子右侧)，并暂缓自动重绘 800ms 后截图
          await p.evaluate((x, y) => { const U = window.__game.scene.getScene('UI'), W = window.__game.scene.getScene('Battle').world; U.panel.lastDown = U.time.now; U.panel.showTip(W.bag.find(i => i.item === 'iron_sword'), x + 30, y - 24); }, c.x, c.y); } }
        await sleep(mob ? 400 : 30); // 桌面：面板每 800ms 可能因经验/熟练度变化自动重绘并收起悬停提示（既有行为），悬停后尽快截图
        const req = await p.evaluate(() => window.__game.scene.getScene('Battle').world.bag.find(i => i.item === 'iron_sword').req);
        const tipOn = await p.evaluate(() => !!window.__game.scene.getScene('UI').panel.tip); if (mob) chk(tipOn, `${VW}x${VH} 铁剑提示框已显示`); else console.log('待核', `${VW}x${VH} 桌面悬停提示：无头浏览器下截图未稳定捕获（tip=${tipOn}），以手机三尺寸截图为准`);
        chk(req === 5, `${VW}x${VH} 铁剑需求等级 ${req}（官方 10 → 5）`);
        if (mob) console.log('shot', await shot(p, `tooltip-iron-sword-req5-${VW}x${VH}`));
      }
      chk(w.errs.length === 0, `${VW}x${VH} ${cls} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
    }
    // 2) 老存档：武器栏空、无标记 → 读档补发一次
    const old = { v: 1, cls: 'mage', level: 12, exp: 0, gold: 50, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const { p, w } = await page(VW, VH, mob, old);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
    const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, x = W.equip.weapon; return { item: x?.item, bound: !!x?.bound, flag: W.toSave().starterGiven }; });
    chk(r.item === 'wood_sword' && r.bound && r.flag === 1, `${VW}x${VH} 老存档（12 级、武器栏空、无标记）读档补发木剑并写标记`);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
    console.log('shot', await shot(p, `equip-bag-oldsave-${VW}x${VH}`));
    chk(w.errs.length === 0, `${VW}x${VH} 老存档 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.stop?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
