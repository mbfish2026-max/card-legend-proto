// 用户新增（fix/hang-stuck）：清层循环 e2e。真实浏览器（构建产物）。
// ① 3 职业：清空 → 走到出口自动进下一层 → 不战斗返回 → 原层重刷 → 继续打，≥2 轮；横幅「正在进入下一层 / 返回原层」；道士召唤物跟随换层。
// ② 末层（火龙神殿）清空 → nocycle 停并提示原因。③ 循环中死亡 / 背包满 → 停。
// 说明：为节省时长，清层后把英雄放到出口前 400px 处再让挂机自己走（适配：e2e 加速，单测走完整地图）。
// 首领按真实击杀记冷却（bossCdUntil/bossCdId），否则返回原层首领重刷会按既有规则 boss 停（单测另有用例）。
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.env.HS_SHOT_DIR || '/workspace/pcsim/hangstuck-shots'; mkdirSync(dir, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok ' : 'FAIL ') + m); if (!c) fails++; };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const run = (page, code, arg) => page.evaluate(new Function('arg', 'const B = window.__game.scene.getScene("Battle"), W = B.world; ' + code), arg);
const KILL = `for (const u of W.alive('enemy')) { if (u.tier === 'boss') { W.bossCdUntil[W.floorIndex] = W.time + 600; W.bossCdId[W.floorIndex + ':' + u.id] = W.time + 600; } u.alive = false; }
  W.units = W.units.filter(u => u.alive); W.farmQueue.length = 0; W.ground.length = 0; B.handle(W.drainEvents());`;
const NEAR_EXIT = `if (W.hero) W.hero.x = W.exitX - 400;`;
const sv = await startPreview(), b = await launch();
async function open(vw, vh, save) {
  const touch = vw !== 1280; const page = await b.newPage(); if (touch) await page.setUserAgent(UA);
  await page.setViewport({ width: vw, height: vh, isMobile: touch, hasTouch: touch, deviceScaleFactor: 1 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoAttack: false })); }, save);
  await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1200);
  { const p = await findPos(page, 'Title', '继'); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  return { page, w, touch };
}
const mkSave = (cls, floorIndex, learned) => ({ v: 1, cls, level: 35, exp: 0, gold: 5000, pots: [50, 50, 50, 50], floorIndex, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned });
const LEARN = { taoist: ['summon_skeleton', 'poison', 'soul_fire'], mage: ['fireball', 'thunder'], warrior: [] };
const sample = 'const h = W.hero; return { gt: W.time, fi: W.floorIndex, ph: B.hang.phase, cy: B.hang.cycles, on: B.hang.on, cd: h ? h.cd : 0, x: h ? h.x : 0, foes: W.alive("enemy").length, sm: W.units.filter(u => u.summon && u.alive).length, ban: B.hud?.hangBanner?.visible ? B.hud.hangBanner.text : "", stop: B.hangStopMsg, fade: B.fading };';
try {
  // ① 完整循环 ×2
  const sizes = [[1280, 720], [844, 390], [874, 402], [932, 430]];
  for (const cls of ['taoist', 'mage', 'warrior']) for (const [vw, vh] of (cls === 'taoist' ? sizes : [[1280, 720]])) {
    const tag = `${vw}x${vh}`, { page, w } = await open(vw, vh, mkSave(cls, 1, LEARN[cls]));
    const sm0 = await run(page, `if (W.cls === 'taoist') { const si = W.skills.findIndex(s => s.id === 'summon_skeleton'); if (si >= 0) { W.hero.mp = W.hero.maxMp; W.cast(si, W.skills.map(() => 0)); B.handle(W.drainEvents()); } }
      return W.units.filter(u => u.summon && u.alive).length;`);
    await sleep(500);
    await run(page, `${KILL} ${NEAR_EXIT} B.hangToggleAt = -1e9; B.toggleHang();`);
    const s = [], seenBan = new Set(), shots = new Set(); const t0 = Date.now(); let fi0 = 1, killed2 = false, transitHits = 0, foesBack = [];
    while (Date.now() - t0 < 150000) {
      const r = await run(page, sample); s.push(r);
      if (r.ban) seenBan.add(r.ban);
      for (const [k, re] of [['toNext', /正在进入下一层/], ['back', /正在返回原层/], ['resumed', /已返回原层/]]) if (!shots.has(k) && re.test(r.ban) && !r.fade) { shots.add(k); await page.screenshot({ path: `${dir}/cycle-${tag}-${cls}-${k}.png` }); }
      const p = s[s.length - 2]; if (p && r.ph !== 'farm' && p.ph !== 'farm' && r.cd > p.cd + 1e-3) transitHits++;
      if (p && p.ph === 'back' && r.ph === 'farm') foesBack.push(r.foes);
      if (!r.on) break;
      if (r.cy >= 1 && r.ph === 'farm' && !killed2 && r.fi === fi0) { killed2 = true; await sleep(800); await run(page, KILL); }
      if (r.cy >= 2) break; await sleep(150);
    }
    const last = s[s.length - 1], trail = s.map(q => q.fi).filter((f, i, a) => i === 0 || a[i - 1] !== f);
    ok(last.cy >= 2 && last.on, `${tag} ${cls} 循环 ${last.cy} 轮，楼层 ${trail.join('→')}，挂机=${last.on} ${last.stop || ''}`);
    ok(foesBack.length >= 2 && foesBack.every(n => n > 0), `${tag} ${cls} 每次返回原层怪已重刷 ${JSON.stringify(foesBack)}`);
    ok(transitHits === 0, `${tag} ${cls} 换层途中普攻次数 ${transitHits}`);
    ok([...seenBan].some(t => /正在进入下一层/.test(t)) && [...seenBan].some(t => /返回原层/.test(t)), `${tag} ${cls} 横幅：${[...seenBan].join(' / ')}`);
    if (cls === 'taoist') ok(sm0 > 0 && last.sm > 0, `${tag} 道士召唤物 ${sm0} → 换层 2 轮后 ${last.sm} 只`);
    ok(w.errs.length === 0, `${tag} ${cls} 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`);
    await page.close();
  }
  // ② 不能往返：末层
  for (const [vw, vh] of [[1280, 720], [844, 390]]) {
    const tag = `${vw}x${vh}`, { page, w } = await open(vw, vh, mkSave('warrior', 0, []));
    const fi = await run(page, `const n = W.floors.length - 1; W.loadFloor(n); B.handle(W.drainEvents()); return n;`); await sleep(800);
    await run(page, `${KILL} B.hangToggleAt = -1e9; B.toggleHang();`); await sleep(1500);
    const r = await run(page, sample); await page.screenshot({ path: `${dir}/cycle-${tag}-nocycle.png` });
    ok(!r.on && /无法往返/.test(r.stop) && /最后一层/.test(r.stop), `${tag} 末层（第 ${fi} 号）清空 → 停：${r.stop}`);
    ok(w.errs.length === 0, `${tag} nocycle 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
  // ③ 循环中死亡 / 背包满
  for (const kind of ['dead', 'lowhp', 'bagfull']) {
    const { page, w } = await open(1280, 720, mkSave('mage', 1, LEARN.mage));
    await run(page, `${KILL} ${NEAR_EXIT} B.hangToggleAt = -1e9; B.toggleHang();`);
    const t0 = Date.now(); let inj = false, r;
    while (Date.now() - t0 < 90000) { r = await run(page, sample); if (!r.on) break;
      if (!inj && r.cy >= 1 && r.ph === 'farm') { inj = true; await run(page, kind === 'dead' ? 'for (const u of W.alive("enemy")) { u.x = W.hero.x + 40; u.homeX = u.x; u.y = 0; u.atk = 1e7; u.ai = "chase"; }'
        : kind === 'lowhp' ? 'W.pots = [0, 0, 0, 0]; W.hero.hp = Math.floor(W.hero.maxHp * 0.1);'
        : 'W.bag = Array.from({ length: 200 }, (_, i) => ({ uid: 90000 + i })); const h = W.hero; W.ground.push({ uid: 1, x: h.x - 60, y: 0, landAt: -1, inv: { uid: 2 } });'); }
      await sleep(150); }
    await page.screenshot({ path: `${dir}/cycle-1280x720-${kind}.png` });
    ok(inj && !r.on && ({ dead: /阵亡/, lowhp: /血量过低/, bagfull: /背包已满/ })[kind].test(r.stop), `循环第 ${r.cy} 轮后 ${kind} → 挂机=${r.on}，提示：${r.stop}`);
    ok(w.errs.length === 0, `${kind} 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fails ? `hang-cycle FAIL ${fails}` : 'hang-cycle ALL OK'); process.exit(fails ? 1 : 0);
