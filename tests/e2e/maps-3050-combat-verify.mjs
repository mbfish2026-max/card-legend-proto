// maps-3050 战斗字段浏览器验证：幽影武士眩晕 / 烈焰使不移动 / 闪电魔远程雷击 + 利爪魔近战（双 BOSS）/ 禁地魔王不移动
// 用法：npm run build && node tests/e2e/maps-3050-combat-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp'; mkdirSync(dir, { recursive: true });
const save = { v: 1, cls: 'warrior', level: 40, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const tp = await findPos(page, 'Title', '继'); await page.mouse.click(tp.x, tp.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1500);
  const setup = ids => page.evaluate(ids => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; B.tryAutoSkills = () => {};
    for (const u of W.units) if (u.team === 'enemy') u.alive = false; W.units = W.units.filter(u => u.alive);
    h.hp = h.maxHp = 1e7; const us = ids.map(([id, dx]) => { const u = W.spawnFoe(id, h.x + dx, 0) ?? W.units[W.units.length - 1]; u.hp = u.maxHp = 1e9; u.ai = 'chase'; return u; });
    window.__ev = []; const st = W.step.bind(W); W.step = (dt, inp) => { st(dt, inp); for (const e of W.events) if (e.type === 'attack' || e.type === 'log') window.__ev.push(e); };
    return us.map(u => ({ uid: u.uid, id: u.id, x: u.x })); }, ids);
  const state = () => page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero;
    return { hx: h.x, stunned: (h.stunUntil ?? 0) > W.time, foes: W.units.filter(u => u.team === 'enemy' && u.alive).map(u => ({ uid: u.uid, id: u.id, x: Math.round(u.x) })), ev: window.__ev }; });
  // A 幽影武士：lootRng=0 必晕
  const a = await setup([['sq_youying', 60]]); await page.evaluate(() => { window.__game.scene.getScene('Battle').world.lootRng = () => 0; });
  let sA; for (let k = 0; k < 40; k++) { await sleep(100); sA = await state(); if (sA.stunned) break; }
  await sleep(200); await page.screenshot({ path: `${dir}/m3050-1-youying-stun.png` });
  out.youying = { stunned: sA.stunned, log: sA.ev.filter(e => e.type === 'log' && /击晕/.test(e.text)).map(e => e.text).slice(0, 2) };
  // B 烈焰使 + 禁地魔王：不移动
  await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.lootRng = Math.random; W.hero.stunUntil = 0; });
  const bU = await setup([['sq_lieyan_shi', 200], ['boss_sq_jindi', -260]]); await sleep(4000); const sB = await state();
  await page.screenshot({ path: `${dir}/m3050-2-immobile.png` });
  out.immobile = bU.map(u => ({ id: u.id, x0: Math.round(u.x), x1: sB.foes.find(f => f.uid === u.uid)?.x }));
  // C 双 BOSS：利爪魔在前、闪电魔在后
  const cU = await setup([['boss_sq_lizhua', 120], ['boss_sq_shandian', 360]]); let shot = false;
  for (let k = 0; k < 60; k++) { await sleep(100); const s = await state(); if (!shot && s.ev.some(e => e.type === 'attack' && e.skill === 'thunder')) { await sleep(150); await page.screenshot({ path: `${dir}/m3050-3-thunder.png` }); shot = true; } }
  const sC = await state(), sd = cU.find(u => u.id === 'boss_sq_shandian'), lz = cU.find(u => u.id === 'boss_sq_lizhua');
  out.twinBoss = { thunder: sC.ev.filter(e => e.type === 'attack' && e.source === sd.uid && e.skill === 'thunder').length, lizhuaMelee: sC.ev.filter(e => e.type === 'attack' && e.source === lz.uid).length, gapShandian: Math.round(Math.abs(sC.foes.find(f => f.uid === sd.uid).x - sC.hx)), shot };
  await page.screenshot({ path: `${dir}/m3050-4-twinboss.png` });
  out.errs = w.errs.filter(e => !/404|Failed to load/.test(e));
} finally { console.log(JSON.stringify(out, null, 1)); await b.close(); sv.close?.(); sv.kill?.(); }
