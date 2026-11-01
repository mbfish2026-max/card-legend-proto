// 召唤物存读档 e2e：召唤骷髅→升级/掉血→存档→刷新页面→仍在且等级/HP 一致；切换存档槽互不串；顺带采样召唤物移速 == 英雄移速；0 控制台错误（关闭自动技能，避免自动治愈/重召干扰比对）
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'taoist', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['summon_skeleton'] };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const chk = (c, m) => { out[m] = !!c; if (!c) fail++; };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: true })); localStorage.setItem('fcl_save_v1_s2', JSON.stringify({ ...s, gold: 2222 })); } }, save);
  const enter = async () => { await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500); };
  const state = () => page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { gold: W.gold, s: W.units.filter(u => u.summon && u.alive && !u.decoy).map(u => ({ id: u.id, lv: u.sLv, name: u.name, color: u.nameColor, hp: u.hp, max: u.maxHp })) }; });
  const setActive = i => page.evaluate(i => { const m = JSON.parse(localStorage.getItem('fcl_slots_v1') || '{}'); m.active = i; localStorage.setItem('fcl_slots_v1', JSON.stringify(m)); }, i);
  await page.goto(sv.url); await enter();
  const r = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; B.tryAutoSkills = () => {}; B.cds = B.cds.map(() => 0);
    const c = W.cast(W.skills.findIndex(s => s.id === 'summon_skeleton'), B.cds); if (!c.ok) return { err: c.reason };
    W.units.forEach(u => { if (u.team === 'enemy') u.alive = false; });
    const sm = W.units.find(u => u.summon && u.alive); sm.sLv = 5; sm.sKills = 7; W.applySummonLv(sm); sm.hp = Math.round(sm.maxHp * 0.6);
    // 移速采样：英雄静止，召唤物在远处 → 每帧位移/时间
    const hx = W.hero.x, x0 = sm.x = hx + 3000; W.step(0.05); const vs = Math.abs(sm.x - x0) / 0.05; W.hero.x = hx; const h0 = W.hero.x; W.step(0.05, { dx: 1, dy: 0 }); const vh = Math.abs(W.hero.x - h0) / 0.05; W.hero.x = hx; sm.x = hx - 110;
    B.saveGame(); return { ok: true, vs, vh }; });
  if (r.err) throw new Error(r.err);
  out.speed = { summon: Math.round(r.vs), hero: Math.round(r.vh) }; chk(Math.abs(r.vs - r.vh) < 1, '召唤物移速==英雄移速');
  const s0 = await state(); out.before = s0; await page.screenshot({ path: `${dir}/summon-save-before.png` });
  await page.reload(); await enter(); const s1 = await state(); out.afterReload = s1; await page.screenshot({ path: `${dir}/summon-save-after-reload.png` });
  const eq = (a, b) => a.s.length === 1 && b.s.length === 1 && a.s[0].lv === b.s[0].lv && a.s[0].name === b.s[0].name && a.s[0].color === b.s[0].color && (b.s[0].hp / b.s[0].max - a.s[0].hp / a.s[0].max) > -0.01 && (b.s[0].hp / b.s[0].max - a.s[0].hp / a.s[0].max) < 0.05 /* 读档后脱战回血会小幅回升 */;
  chk(eq(s0, s1), '刷新后召唤物/等级/HP 一致');
  await setActive(2); await page.reload(); await enter(); const s2 = await state(); out.slot2 = s2; chk(s2.gold === 2222 && s2.s.length === 0, '槽2 无召唤物（不串）');
  await page.evaluate(() => window.__game.scene.getScene('Battle').saveGame());
  await setActive(1); await page.reload(); await enter(); const s3 = await state(); out.slot1Again = s3; chk(eq(s0, s3) && s3.gold === 5000, '切回槽1 召唤物仍在');
  await page.screenshot({ path: `${dir}/summon-save-slot1-again.png` });
  out.errs = w.errs.filter(e => !/404|Failed to load/.test(e)); fail += out.errs.length;
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out)); console.log(fail ? 'summon-save FAIL' : 'summon-save OK'); process.exit(fail ? 1 : 0);
