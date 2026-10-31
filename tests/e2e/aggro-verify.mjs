// 召唤物仇恨/治愈召唤物/技能栏鼠标+触屏点击/召唤物升级变色/自动施毒不重复（真实 puppeteer 点击与 tap）
// 用法：npm run build && node tests/e2e/aggro-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, toScreen, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const base = { v: 1, level: 40, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [] };
const MAGE = { ...base, cls: 'mage', learned: ['fireball', 'thunder', 'fire_wall', 'magic_shield', 'ice_roar', 'big_fireball', 'burst_fire', 'hell_fire', 'lightning_flash', 'hell_thunder'] };
const TAO = { ...base, cls: 'taoist', learned: ['heal', 'poison', 'soul_fire', 'summon_skeleton'] };
const sv = await startPreview(), b = await launch(); const out = {};
const errsOf = w => w.errs.filter(e => !/404|Failed to load/.test(e));
async function open(save, touch = false) {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720, hasTouch: touch }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const tp = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(tp.x, tp.y); else await page.mouse.click(tp.x, tp.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1500);
  await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; window.__spy = { keys: [], walks: 0, logs: [], casts: [], autoCasts: [] };
    B.__auto = B.tryAutoSkills.bind(B); B.tryAutoSkills = () => {}; // 关自动技能，只统计手动
    const wc = W.cast.bind(W); let inKey = false; W.cast = (i, c, o) => { const r = wc(i, c, o); if (inKey) window.__spy.casts.push(r.ok ? 'ok' : r.reason); if (o?.auto) window.__spy.autoCasts.push(W.skills[i].id + ':' + (r.ok ? 'ok' : r.reason)); return r; };
    const ok = B.onKey.bind(B); B.onKey = k => { window.__spy.keys.push(k); inKey = true; try { return ok(k); } finally { inKey = false; } };
    const wt = B.walkTo.bind(B); B.walkTo = (x, id) => { window.__spy.walks++; return wt(x, id); };
    const lg = B.log.bind(B); B.log = (t, g) => { window.__spy.logs.push(t); return lg(t, g); }; });
  return { page, w };
}
const prep = (page, full = true) => page.evaluate(full => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) { e.hp = e.maxHp = 1e9; h.x = e.x - 150; } h.hp = h.maxHp; h.armorUntil = 0; h.mp = full ? h.maxMp : 0; B.cds = B.cds.map(() => 0); Object.assign(window.__spy, { keys: [], casts: [], logs: [], walks: 0 }); return { x: h.x, mp: h.mp }; }, full);
const slot = async (page, i) => { const p = await page.evaluate(i => window.__game.scene.getScene('Battle').hud.skillPos[i], i); return toScreen(page, p.x, p.y); };
const st = page => page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), h = B.world.hero; return { x: h.x, mp: h.mp, ...JSON.parse(JSON.stringify(window.__spy)) }; });
try {
  { // A 法师 10 格真实鼠标点击
    const { page, w } = await open(MAGE); const n = await page.evaluate(() => window.__game.scene.getScene('Battle').world.skills.length); const per = [];
    for (let i = 0; i < n; i++) { const s0 = await prep(page); const p = await slot(page, i); await page.mouse.click(p.x, p.y); await sleep(100); const s1 = await st(page); per.push({ i, key: s1.keys.join(), cast: s1.casts.join(), spent: Math.round(s0.mp - s1.mp), moved: s1.x - s0.x, walks: s1.walks }); }
    const s0 = await prep(page); const p = await slot(page, 0); for (let k = 0; k < 3; k++) await page.mouse.click(p.x, p.y); await sleep(100); const s1 = await st(page);
    const rapid = { clicks: 3, keys: s1.keys.length, casts: s1.casts, okCasts: s1.casts.filter(c => c === 'ok').length, spent: Math.round(s0.mp - s1.mp), moved: s1.x - s0.x };
    await prep(page, false); await page.mouse.click(p.x, p.y); await sleep(100); const low = await st(page);
    await page.screenshot({ path: `${dir}/aggro-1-hotbar.png` });
    out.mouse = { slots: n, allSlotsCastOnce: per.every(r => r.cast === 'ok' && r.spent > 0 && r.moved === 0 && r.walks === 0), per, rapid, lowMana: { casts: low.casts, logs: low.logs, spent: low.mp }, errs: errsOf(w) }; await page.close(); }
  { // B 触屏 tap
    const { page, w } = await open(MAGE, true); const s0 = await prep(page); const p = await slot(page, 1); await page.touchscreen.tap(p.x, p.y); await sleep(200); const s1 = await st(page);
    out.touch = { keys: s1.keys, casts: s1.casts, spent: Math.round(s0.mp - s1.mp), moved: s1.x - s0.x, walks: s1.walks, errs: errsOf(w) }; await page.close(); }
  { // C 道士：仇恨 / 治愈召唤物 / 升级变色 / 自动施毒
    const { page, w } = await open(TAO);
    const ag = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp; B.cds = B.cds.map(() => 0);
      W.cast(W.skills.findIndex(s => s.id === 'summon_skeleton'), B.cds); const sm = W.summon; sm.hp = sm.maxHp = 1e9;
      const e = W.units.filter(u => u.team === 'enemy' && u.alive).sort((a, c) => Math.abs(a.x - h.x) - Math.abs(c.x - h.x))[0]; e.hp = e.maxHp = 1e9; sm.x = e.x - 120; e.ai = 'chase';
      let t0 = performance.now(); while (performance.now() - t0 < 4000 && e.aggroUid !== sm.uid) await new Promise(r => setTimeout(r, 50));
      const locked = e.aggroUid === sm.uid; const hp0 = h.hp, s0 = sm.hp; t0 = performance.now();
      while (performance.now() - t0 < 4000) { h.x = Math.max(60, e.x - 600); h.hp = hp0; await new Promise(r => setTimeout(r, 30)); }
      const heroHit = hp0 - h.hp; return { locked, summonDmgTaken: Math.round(s0 - sm.hp), heroHpLostLastTick: heroHit, dist: Math.round(Math.abs(e.x - h.x)) }; });
    // 用伤害事件统计主角是否被这只怪打（更准）
    const ag2 = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero, sm = W.summon; const e = W.units.find(u => u.team === 'enemy' && u.alive && u.aggroUid === sm.uid); if (!e) return null; let toHero = 0, toSm = 0;
      const hd = B.handle.bind(B); B.handle = evs => { for (const v of evs) if (v.type === 'damage' && v.source === e.uid) { if (v.target === h.uid) toHero++; else if (v.target === sm.uid) toSm++; } return hd(evs); };
      const t0 = performance.now(); while (performance.now() - t0 < 4000) { h.x = Math.max(60, e.x - 600); h.hp = h.maxHp; await new Promise(r => setTimeout(r, 30)); } B.handle = hd; return { toHero, toSummon: toSm }; });
    await page.screenshot({ path: `${dir}/aggro-2-summon.png` });
    // 治愈：主角满血 → 点击治愈术格 → 召唤物回血
    await prep(page); const hi = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero, sm = W.summon; sm.maxHp = 1000; sm.hp = 100; sm.x = h.x + 100; return W.skills.findIndex(s => s.id === 'heal'); });
    const hp = await slot(page, hi); const m0 = await page.evaluate(() => window.__game.scene.getScene('Battle').world.hero.mp); await page.mouse.click(hp.x, hp.y); await sleep(1500);
    const healed = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { smHp: Math.round(W.summon.hp), mp: W.hero.mp, heroFull: W.hero.hp === W.hero.maxHp, casts: window.__spy.casts }; });
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.hp = W.hero.maxHp; W.summon.hp = W.summon.maxHp; B.cds = B.cds.map(() => 0); window.__spy.casts = []; window.__spy.logs = []; });
    const m1 = await page.evaluate(() => window.__game.scene.getScene('Battle').world.hero.mp); await page.mouse.click(hp.x, hp.y); await sleep(150);
    const full = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); return { mp: B.world.hero.mp, gap: Math.max(...B.cds), casts: window.__spy.casts, logs: window.__spy.logs }; });
    // 升级变色：真实击杀（kill）累计，读取卡片名字文本颜色
    const lv = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, sm = W.summon, v = B.views.get(sm.uid); const seen = [];
      const rec = () => { const t = v.nameText; if (!seen.length || seen[seen.length - 1].text !== t.text) seen.push({ lv: sm.sLv, text: t.text, color: t.style.color }); };
      rec(); for (let i = 0; i < 240 && sm.sLv < 7; i++) { const e = W.units.find(u => u.team === 'enemy' && u.alive) ?? null; if (!e) break; const c = W.spawn({ ...e, hp: 1 }, 'enemy', e.x, e.y); W.kill(c); await new Promise(r => setTimeout(r, 20)); rec(); }
      return { start: seen[0], seen, kills: sm.sKills }; });
    await page.screenshot({ path: `${dir}/aggro-3-summon-lv.png` });
    // 自动施毒：恢复游戏自动技能，射程内敌人全部中毒后 3 秒内不应再自动施毒
    const pz = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; B.tryAutoSkills = B.__auto; window.__spy.autoCasts = []; const si = W.skills.findIndex(s => s.id === 'summon_skeleton'); // 召唤骷髅优先级最高且「已存在→回血」恒成功，测试中占住其间隔以便轮到施毒
      const near = W.units.filter(u => u.team === 'enemy' && u.alive && Math.abs(u.x - h.x) < 900); W.units.filter(u => u.team === 'enemy' && u.alive).forEach(u => { u.hp = u.maxHp = 1e9; u.poisonUntil = W.time + 999; });
      const t0 = performance.now(); while (performance.now() - t0 < 3000) { B.cds[si] = 99; h.mp = h.maxMp; h.hp = h.maxHp; await new Promise(r => setTimeout(r, 30)); }
      const poisonAll = window.__spy.autoCasts.filter(c => c.startsWith('poison')); const firstOkAfter = poisonAll.filter(c => c.endsWith(':ok')).length;
      // 让一只怪解毒 → 应自动毒它
      const e = W.units.find(u => u.team === 'enemy' && u.alive && Math.abs(u.x - h.x) < 450) ?? near[0]; if (e) { e.poisonUntil = 0; h.x = e.x - 200; } window.__spy.autoCasts = [];
      const t1 = performance.now(); while (performance.now() - t1 < 3000 && !(e && e.poisonUntil > W.time)) { B.cds[si] = 99; h.mp = h.maxMp; h.hp = h.maxHp; await new Promise(r => setTimeout(r, 30)); }
      return { allPoisoned_poisonOkCasts: firstOkAfter, allPoisoned_reasons: [...new Set(poisonAll)], unpoisonedGotPoisoned: !!(e && e.poisonUntil > W.time), autoAfter: [...new Set(window.__spy.autoCasts)].slice(0, 6) }; });
    out.taoist = { aggro: { ...ag, ...ag2 }, healSummon: { before: 100, after: healed.smHp, heroFull: healed.heroFull, mpSpent: Math.round(m0 - healed.mp), casts: healed.casts }, allFull: { mpSpent: Math.round(m1 - full.mp), gap: full.gap, casts: full.casts, logs: full.logs }, summonLevel: lv, autoPoison: pz, errs: errsOf(w) };
    await page.close(); }
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
