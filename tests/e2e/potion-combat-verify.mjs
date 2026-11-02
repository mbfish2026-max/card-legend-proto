// feat/potion-combat：键盘 1/3 与点格 = 药水栏选中药；太阳水瞬回 + 回血飘字；0 控制台错误
// 用法：npm run build && node tests/e2e/potion-combat-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/potion-combat'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const st = p => p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; return { pots: [...W.pots], hp: Math.round(h.hp), max: h.maxHp, hots: (h.hots ?? []).length, sel: [0, 1, 2].map(i => W.getSelectedPotion(i)) }; });
try {
  for (const [VW, VH, mob] of [[1280, 720, false], [932, 430, true]]) {
    const tag = `${mob ? 'm' : 'd'}${VW}`;
    const save = { v: 1, cls: 'warrior', level: 40, exp: 0, gold: 999, pots: [5, 5, 5, 5, 5, 5, 5, 5], potSel: ['hp_big', 'mp_mid', 'sun'], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (const u of W.units) if (u.team === 'enemy') { u.atk = 0; u.matk = 0; } W.hero.hp = Math.round(W.hero.maxHp * 0.2); });
    const press = async (k, slot) => { if (mob) { const q = await p.evaluate(i => { const r = document.querySelector(`[data-id=pot${i}]`)?.getBoundingClientRect(); return r && { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, slot); await p.touchscreen.tap(q.x, q.y); } else await p.keyboard.press(`Digit${k}`); };
    const a = await st(p); chk(a.sel[0] === 'hp_big' && a.sel[2] === 'sun', `${tag} 读档选中格 ${a.sel}`);
    await press('1', 0); await sleep(150); const c = await st(p);
    chk(c.pots[4] === a.pots[4] - 1 && c.pots[0] === a.pots[0] && c.pots[1] === a.pots[1], `${tag} ${mob ? '点红格' : '按 1'} = 用选中的强效金创药（hp_big ${a.pots[4]}→${c.pots[4]}，小/中红不动）`);
    await sleep(1200); await p.evaluate(() => { const h = window.__game.scene.getScene('Battle').world.hero; h.hp = Math.round(h.maxHp * 0.2); });
    const d = await st(p); await press('3', 2); await sleep(60); const e = await st(p);
    chk(e.pots[6] === d.pots[6] - 1 && e.hp >= Math.min(d.max, d.hp + 170) && e.hots === 0, `${tag} ${mob ? '点太阳格' : '按 3'} = 太阳水瞬回（HP ${d.hp}→${e.hp}，HoT ${e.hots}）`);
    await sleep(120); await p.screenshot({ path: `${dir}/${tag}-sun-instant.png` });
    const errs = w.errs.filter(x => !/404|Failed to load/.test(x)); chk(errs.length === 0, `${tag} 控制台 0 报错 ${errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
