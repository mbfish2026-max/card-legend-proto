// 阶段2：腰带栏 + 靴子独立栏 + 旧档「衣服位靴子」迁移，桌面/手机截图。用法：npm run build && node tests/e2e/belt-shots.mjs [目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/drop-realign'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const boot = { uid: 7, item: 'h_cloth_shoes', name: '布鞋', rarity: 'common', slot: 'boots', stats: { def: 5, hp: 90 }, req: 15, price: 20 };
const belt = { uid: 8, item: 'belt_hide', name: '兽皮腰带', rarity: 'common', slot: 'belt', stats: { def: 4, hp: 70 }, req: 15, price: 30 };
try {
  for (const [VW, VH, mob] of [[1280, 720, false], [844, 390, true]]) {
    const save = { v: 1, cls: 'warrior', level: 50, exp: 0, gold: 999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { armor: boot, belt }, bag: [], learned: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
    const eq = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { armor: W.equip.armor?.item ?? null, boots: W.equip.boots?.item ?? null, belt: W.equip.belt?.item ?? null }; });
    chk(eq.boots === 'h_cloth_shoes' && !eq.armor, `${VW}x${VH} 旧档衣服位靴子迁到靴子栏 ${JSON.stringify(eq)}`);
    chk(eq.belt === 'belt_hide', `${VW}x${VH} 腰带栏读档保留`);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
    await p.screenshot({ path: `${dir}/belt-${VW}x${VH}.png` });
    chk(w.errs.length === 0, `${VW}x${VH} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.close?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
