// 手机 HUD：学会本职业全部技能（含传世 16 + 金甲骷髅）后，技能弧翻页，每个主动技能都能在手机 HUD 上点击施放；自动施法对全部已学技能可用
// 用法：npm run build && node tests/e2e/mobile-skills-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/m-sk-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
// 竖屏 390×844 为「请横屏」提示（既有设计，见 docs/mobile-ui.md），这里验证同机型横屏 844×390 与 932×430
const VPS = [[932, 430], [844, 390]];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const prep = `(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp = 99999; h.hp = Math.floor(h.maxHp * 0.5); h.defUpUntil = h.mdefUpUntil = h.armorUntil = 0; h.poisonUntil = W.time + 30;
  for (const u of W.units) if (u.team === 'ally' && u !== h && (u.summon || u.decoy)) u.alive = false;
  B.cds = B.cds.map(() => 0); W.units.filter(u => u.team === 'enemy' && u.alive).forEach((e, k) => { e.x = h.x + 140 + k * 40; e.hp = e.maxHp; e.ai = 'chase'; e.poisonUntil = 0; e.stunUntil = 0; if (k === 0) { e.level = 1; } }); window.__why = ''; })()`;
const sv = await startPreview(), b = await launch();
try {
  for (const [VW, VH] of VPS) for (const cls of (process.env.ONLY ?? 'warrior,mage,taoist').split(',')) {
    const save = { v: 1, cls, level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: ['warrior', 'mage', 'taoist'], autoAttack: false })); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && document.getElementById('mhud'), { timeout: 30000 }); await sleep(1500);
    const all = await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; for (const s of W.skillPool) { W.learned.add(s.id); W.skillTrain[s.id] = 99999; }
      B.cds = W.skills.map(() => 0); const ok = {}; const o = W.cast.bind(W); window.__ok = ok; W.cast = (i, c, opt) => { const r = o(i, c, opt); if (r.ok) ok[W.skills[i].id] = true; else window.__why = r.reason; return r; };
      return W.skills.filter(s => !s.passive).map(s => s.id); });
    await sleep(800);
    const pages = await p.evaluate(() => { const e = document.getElementById('mh-page'); return e && getComputedStyle(e).display !== 'none' ? e.textContent : ''; });
    chk(all.length <= 10 || /1\/\d/.test(pages), `${VW}×${VH} ${cls} ${all.length} 个主动技能 → 翻页键「${pages}」`);
    const why = {};
    for (let pg = 0; pg < 4; pg++) {
      const vis = await p.evaluate(() => Array.from(document.querySelectorAll('#mhud .sk')).map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.id.slice(3), x: r.left + r.width / 2, y: r.top + r.height / 2, in: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; }));
      await p.screenshot({ path: `${dir}/${VW}x${VH}-${cls}-page${pg + 1}.png` });
      for (const v of vis) {
        if (v.id in why) continue;
        chk(v.in, `${VW}×${VH} ${cls} ${v.id} 在视口内`);
        await p.evaluate(prep); await p.touchscreen.tap(v.x, v.y); await sleep(250);
        why[v.id] = await p.evaluate(id => window.__ok[id] ? 'ok' : window.__why || 'no cast', v.id);
      }
      const next = await p.evaluate(() => { const e = document.getElementById('mh-page'); if (!e || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      if (!next) break; await p.touchscreen.tap(next.x, next.y); await sleep(300);
      if (await p.evaluate(() => /^翻页1\//.test(document.getElementById('mh-page').textContent))) break;
    }
    for (const id of all) chk(why[id] === 'ok', `${VW}×${VH} ${cls} 手机点击施放 ${id}: ${why[id] ?? '不在弧上'}`);
    const auto = {};
    for (const id of all) { await p.evaluate(prep); if (id === 'charm') await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (const e of W.units) if (e.team === 'enemy' && e.alive && ['immune','high'].includes(W.charmCheck(e).res)) e.x += 3000; }); auto[id] = await p.evaluate(id => { const B = window.__game.scene.getScene('Battle'), W = B.world; const a = W.autoCast([id], B.cds); B.handle(W.drainEvents()); if (a?.id === id) return 'ok'; if (id === 'charm') { const sd = W.rangedSide(520), q = sd === null ? [] : W.queue(sd); return 'charm ' + JSON.stringify({ sd, t: q[0]?.id, lv: q[0]?.level, c: W.charmCheck(q[0]), pets: W.pets.length }); } return window.__why || 'no'; }, id); }
    for (const id of all) chk(auto[id] === 'ok', `${VW}×${VH} ${cls} 自动施法 ${id}: ${auto[id]}`);
    await sleep(600); await p.screenshot({ path: `${dir}/${VW}x${VH}-${cls}-after.png` });
    chk(w.errs.length === 0, `${VW}×${VH} ${cls} 控制台 0 报错 ${w.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
