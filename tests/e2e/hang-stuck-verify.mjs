// fix/hang-stuck e2e（真实浏览器）：道士（先测）/ 法师（MP 充足 + MP<10）/ 战士 × 怪在左/右 × 60/290/600px。
// 只留一只怪、开挂机，每 200ms 采样，断言「任意 3 秒窗口内英雄要么位移、要么出手（hero.cd 重置 / MP 下降）」，且 14 秒内怪掉血。
// 用法：npm run build && node tests/e2e/hang-stuck-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/hang-stuck'; mkdirSync(dir, { recursive: true });
const ONLY_SHOT = process.env.HS_SHOT_TAG ?? 'after';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const run = (page, code, arg) => page.evaluate(new Function('arg', 'const B = window.__game.scene.getScene("Battle"), W = B.world; ' + code), arg);
const CASES = [
  { name: '道士Lv10只会治愈术', cls: 'taoist', level: 10, learn: [], mp: null },
  { name: '道士Lv20施毒骷髅', cls: 'taoist', level: 20, learn: ['poison', 'summon_skeleton'], mp: null },
  { name: '道士Lv20 MP<10', cls: 'taoist', level: 20, learn: ['soul_fire', 'poison'], mp: 5 },
  { name: '法师Lv20 MP充足', cls: 'mage', level: 20, learn: ['fireball', 'thunder', 'ice_arrow'], mp: null },
  { name: '法师Lv20 MP<10', cls: 'mage', level: 20, learn: ['fireball', 'thunder', 'ice_arrow'], mp: 5 },
  { name: '战士Lv20', cls: 'warrior', level: 20, learn: [], mp: null },
];
const sv = await startPreview(), b = await launch();
try {
  for (const [vw, vh] of [[1280, 720], [844, 390]].filter(v => !process.env.HS_VP || process.env.HS_VP === `${v[0]}x${v[1]}`)) for (const c of CASES.filter(c => !process.env.HS_CLS || c.cls === process.env.HS_CLS)) {
    const touch = vw !== 1280, tag = `${vw}x${vh}`;
    const page = await b.newPage(); if (touch) await page.setUserAgent(UA);
    await page.setViewport({ width: vw, height: vh, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 }); const w = watch(page); if (process.env.HS_STACK) page.on('pageerror', e => console.log('STACK', e.stack));
    const save = { v: 1, cls: c.cls, level: c.level, exp: 0, gold: 5000, pots: [50, 50, 50, 50], floorIndex: 1, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: c.learn };
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoAttack: false })); }, save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1200);
    { const p = await findPos(page, 'Title', '继'); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1200);
    for (const side of [1, -1]) for (const dist of [60, 290, 600]) {
      const fhp0 = await run(page, `if (B.hang.on) B.stopHang('toggle'); W.loadFloor(1); B.handle(W.drainEvents()); for (const id of arg.learn) W.learned.add(id);
        const f = W.alive('enemy').filter(u => u.tier !== 'boss')[0]; W.units = W.units.filter(u => u.team !== 'enemy' || u === f); W.farmQueue.length = 0; W.ground.length = 0;
        const h = W.hero; h.x = 2000; h.y = 0; h.hp = h.maxHp; f.x = h.x + arg.side * ((h.width + f.width) / 2 + arg.dist); f.homeX = f.x; f.y = 0; window.__f = f.uid;
        window.__mpCap = arg.mp; if (!window.__mpHook) { window.__mpHook = 1; const o = W.step.bind(W); W.step = (dt, inp) => { if (window.__mpCap != null && W.hero) W.hero.mp = Math.min(W.hero.mp, window.__mpCap); return o(dt, inp); }; }
        B.hangToggleAt = -1e9; B.toggleHang(); return f.hp;`, { ...c, side, dist });
      const s = []; const t0 = Date.now(); let shot = false;
      while (Date.now() - t0 < 40000 && !(s.length && s[s.length - 1].gt - s[0].gt > 12)) {
        const r = await run(page, 'const f = W.units.find(u => u.uid === window.__f); const h = W.hero; return h ? { gt: W.time, fx: f ? f.x : 0, st: B.state, ph: B.hang.phase, x: h.x, cd: h.cd, mp: h.mp, fhp: f && f.alive ? f.hp : 0, on: B.hang.on } : null;');
        if (!r) break; s.push({ t: Date.now() - t0, ...r });
        if (!shot && s.length && Date.now() - t0 > 5000 && side === 1 && dist === 290) { shot = true; await page.screenshot({ path: `${dir}/${tag}-${c.cls}-${c.name}-${ONLY_SHOT}.png` }); }
        if (r.fhp <= 0) break; await sleep(200);
      }
      // 最长「无位移且无出手」窗口
      let maxIdle = 0, st = s[0]?.gt ?? 0; // 按游戏时间（W.time）计：无头浏览器掉帧时墙钟会夸大空转
      for (let i = 1; i < s.length; i++) { const a = s[i - 1], q = s[i]; const act = Math.abs(q.x - a.x) > 0.5 || q.cd > a.cd + 1e-3 || q.mp < a.mp - 1e-3; if (act) st = q.gt; maxIdle = Math.max(maxIdle, q.gt - st); }
      const dmg = s.length ? fhp0 - s[s.length - 1].fhp : 0; // 以开挂前血量为基准（秒杀时首个采样已是 0）
      if (process.env.HS_DUMP && !(maxIdle <= 3 && dmg > 0)) console.log(JSON.stringify(s.map(q => [q.t, +q.gt.toFixed(2), q.st, q.ph, Math.round(q.fx), Math.round(q.x), +q.cd.toFixed(2), Math.round(q.mp), Math.round(q.fhp), q.on])));
      ok(maxIdle <= 3 && dmg > 0, `${tag} ${c.name} 怪在${side > 0 ? '右' : '左'}${dist}px：最长空转 ${maxIdle.toFixed(1)}s(游戏时间)，怪掉血 ${Math.round(dmg)}，挂机=${s[s.length - 1]?.on}`);
    }
    ok(w.errs.length === 0, `${tag} ${c.name} 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`);
    await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fails ? `hang-stuck FAIL ${fails}` : 'hang-stuck ALL OK'); process.exit(fails ? 1 : 0);
