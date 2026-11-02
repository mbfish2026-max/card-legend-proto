// 用户新增/推翻（fix/hang-stuck）：挂机打首领 e2e。真实浏览器（构建产物）。
// ① 3 职业 ×（道士 4 尺寸，其余 1280×720）：开挂机 → 清普通怪 → 首领被测试钩子传送到近处 → 自动接战（横幅）→ 首领死 → 继续清层循环（进下一层并返回）。
// ② 打不过：首领血量极高 + 无药 + 英雄低血 → bosslow 停并提示。
// 适配（e2e 加速）：接战 3 秒后把首领血量压到 3%（只改测试中的单位实例，不改游戏数据）；首领死后把英雄放到出口前 400px。
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.env.HB_SHOT_DIR || '/workspace/pcsim/hangboss-shots'; mkdirSync(dir, { recursive: true });
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
const mkSave = (cls, floorIndex, learned) => ({ v: 1, cls, level: 60, exp: 0, gold: 5000, pots: [50, 50, 50, 50], floorIndex, kills: 0, nextUid: 2000, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned });
const LEARN = { taoist: ['summon_skeleton', 'poison', 'soul_fire'], mage: ['fireball', 'thunder'], warrior: [] };
const sample = 'const h = W.hero; return { gt: W.time, fi: W.floorIndex, ph: B.hang.phase, cy: B.hang.cycles, on: B.hang.on, cd: h ? h.cd : 0, x: h ? h.x : 0, foes: W.alive("enemy").length, sm: W.units.filter(u => u.summon && u.alive).length, ban: B.hud?.hangBanner?.visible ? B.hud.hangBanner.text : "", stop: B.hangStopMsg, fade: B.fading };';
const FI = 5; // 尸王殿（单测同层，含首领、可往返）
const NORM = `for (const u of W.alive('enemy')) if (u.tier !== 'boss') u.alive = false; W.units = W.units.filter(u => u.alive); W.farmQueue.length = 0; W.ground.length = 0; B.handle(W.drainEvents()); for (const [uid, v] of [...B.views]) if (!W.units.includes(v.unit)) { v.destroy(); B.views.delete(uid); }`;
const PULL = `const b = W.alive('enemy').find(u => u.tier === 'boss'); if (b) { b.x = W.hero.x + 320; b.homeX = b.x; } return b ? b.name : null;`;
const S2 = sample.replace('return {', 'return { boss: B.hang.boss, bk: B.hang.bossKills, bhp: (W.alive("enemy").find(u => u.tier === "boss") || {}).hp, ');
try {
  const sizes = [[1280, 720], [844, 390], [874, 402], [932, 430]];
  for (const cls of ['taoist', 'mage', 'warrior']) for (const [vw, vh] of (cls === 'taoist' ? sizes : [[1280, 720]])) {
    const tag = `${vw}x${vh}`, { page, w } = await open(vw, vh, mkSave(cls, FI, LEARN[cls]));
    const fi0 = await run(page, 'return W.floorIndex;');
    const bn = await run(page, `${NORM} ${PULL}`);
    await run(page, 'B.hangToggleAt = -1e9; B.toggleHang();');
    const t0 = Date.now(); const seen = new Set(), shots = new Set(); let engT = 0, pressed = false, moved = false, r, potsUsed = false; const p0 = await run(page, 'return W.pots[W.selectedPotionIndex(0)];');
    while (Date.now() - t0 < 150000) {
      r = await run(page, S2); if (r.ban) seen.add(r.ban); if (!r.on) break;
      if (r.boss !== null && !engT) { engT = Date.now(); await run(page, 'W.hero.hp = Math.floor(W.hero.maxHp * 0.35);'); } // 低于设置红药阈值 40%、高于 bosslow 30% → 应自动喝药
      if (engT && !shots.has('fight') && Date.now() - engT > 1500 && r.bk === 0) { shots.add('fight'); await page.screenshot({ path: `${dir}/boss-${tag}-${cls}-fighting.png` }); }
      if (engT && !pressed && Date.now() - engT > 3000) { pressed = true; await run(page, 'const b = W.alive("enemy").find(u => u.tier === "boss"); if (b) b.hp = Math.min(b.hp, Math.ceil(b.maxHp * 0.03));'); }
      if (r.bk >= 1 && !shots.has('down') && !r.fade) { shots.add('down'); await page.screenshot({ path: `${dir}/boss-${tag}-${cls}-bossdown.png` }); }
      if (r.bk >= 1 && !moved && r.ph === 'farm' && !r.foes) { moved = true; await sleep(300); await run(page, 'B.handle(W.drainEvents()); W.ground.length = 0; if (W.hero) W.hero.x = W.exitX - 400;'); }
      if (r.bk >= 1 && !shots.has('cont') && /正在进入下一层/.test(r.ban) && !r.fade) { shots.add('cont'); await page.screenshot({ path: `${dir}/boss-${tag}-${cls}-continue.png` }); }
      if (r.cy >= 1 && r.fi === fi0 && r.ph === 'farm') break;
      await sleep(150);
    }
    potsUsed = (await run(page, 'return W.pots[W.selectedPotionIndex(0)];')) < p0;
    ok(!!bn && engT > 0 && [...seen].some(t => /遇到首领，自动接战/.test(t)), `${tag} ${cls} 首领（${bn}）自动接战，横幅：${[...seen].join(' / ')}`);
    ok(r.bk >= 1 && r.cy >= 1 && r.on && r.fi === fi0, `${tag} ${cls} 首领击杀 ${r.bk} → 继续循环 ${r.cy} 轮回到原层，挂机=${r.on} ${r.stop || ''}`);
    ok(potsUsed, `${tag} ${cls} 打首领中 HP35% → 自动喝红药（红药格数量减少；首领掉落药水会加到别的格）`);
    ok(shots.has('fight') && shots.has('down') && [...seen].some(t => /首领已击败/.test(t)), `${tag} ${cls} 截图 ${[...shots].join(',')}（用药=${potsUsed}）`);
    ok(w.errs.length === 0, `${tag} ${cls} 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`);
    await page.close();
  }
  // ② 打不过 → bosslow
  for (const [vw, vh] of [[1280, 720], [844, 390]]) {
    const tag = `${vw}x${vh}`, { page, w } = await open(vw, vh, mkSave('warrior', FI, []));
    await run(page, `${NORM} ${PULL.replace(/return .*$/, '')} b.hp = b.maxHp = 1e9; B.hangToggleAt = -1e9; B.toggleHang();`);
    const t0 = Date.now(); let r, inj = false;
    while (Date.now() - t0 < 60000) { r = await run(page, S2); if (!r.on) break; if (r.boss !== null && !inj) { inj = true; await run(page, 'W.pots = [0, 0, 0, 0]; W.hero.hp = Math.floor(W.hero.maxHp * 0.25);'); } await sleep(150); }
    await sleep(300); await page.screenshot({ path: `${dir}/boss-${tag}-bosslow.png` });
    ok(inj && !r.on && /首领太强/.test(r.stop), `${tag} 打首领中 HP25% 无药 → 停：${r.stop}`);
    ok(w.errs.length === 0, `${tag} bosslow 控制台 0 报错 ${w.errs.slice(0, 2).join(' | ')}`); await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fails ? `hang-boss FAIL ${fails}` : 'hang-boss ALL OK'); process.exit(fails ? 1 : 0);
