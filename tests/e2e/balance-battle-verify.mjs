// feat/balance-battle 浏览器验证：首图不变 / 主线 BOSS（1.2s 攻速、召唤、无通用狂暴 AOE）/ 药水 1s 冷却 + HoT（红蓝分开）
// 用法：npm run build && node tests/e2e/balance-battle-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const SAVE = { v: 1, level: 1, exp: 0, gold: 500, pots: [5, 2, 5, 2], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [] };
const sv = await startPreview(), b = await launch(); let fail = 0; const errs = [];
const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const open = async save => {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const w = watch(p);
  await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1500);
  return { p, w };
};
try {
  { // 1 首图（幽暗森林）
    const { p, w } = await open(SAVE);
    const r = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { name: W.floor.name, idx: W.floorIndex, foes: W.units.filter(u => u.team === 'enemy').map(u => `${u.id}:${u.maxHp}/${u.atk}/${u.atkInterval}`), hp: W.hero.maxHp }; });
    console.log('  首图怪物', JSON.stringify(r.foes)); chk(r.idx === 0 && /幽暗森林/.test(r.name) && r.foes.length > 0, `首图 ${r.name}，${r.foes.length} 只怪`);
    await p.keyboard.down('ArrowRight'); await sleep(4000); await p.keyboard.up('ArrowRight'); await sleep(2000);
    await p.screenshot({ path: `${dir}/bb-1-first-map.png` });
    const a = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { alive: W.hero.alive, hp: W.hero.hp }; }); chk(a.alive, `首图战斗 6 秒主角存活（hp ${Math.round(a.hp)}）`);
    // 3 药水：红药 1s 冷却、HoT 0.5s 两跳；红冷却中蓝药可喝
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; h.maxHp = 5000; h.hp = 100; h.maxMp = 1000; h.mp = 0; W.units.filter(u => u.team === 'enemy').forEach(u => { u.ai = 'idle'; }); });
    await p.keyboard.press('1'); await sleep(100);
    const p1 = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { hp: W.hero.hp, n: W.pots[0], cd: W.hero.potReady - W.time }; });
    await p.keyboard.press('1'); await sleep(50); const p2 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.pots[0]);
    await p.keyboard.press('3'); await sleep(50); const p3 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.pots[2]);
    await p.screenshot({ path: `${dir}/bb-3-potion-cd.png` });
    await sleep(700); const p4 = await p.evaluate(() => { const h = window.__game.scene.getScene('Battle').world.hero; return { hp: h.hp, mp: h.mp }; });
    chk(p1.n === 4 && p1.cd > 0.7 && p1.cd <= 1.0, `按 1 喝红药，冷却 ${p1.cd.toFixed(2)}s`);
    chk(p2 === 4, `冷却内再按 1 不消耗（余 ${p2}）`); chk(p3 === 4, `红药冷却中按 3 蓝药可喝（余 ${p3}）`);
    chk(p4.hp >= 100 + 120 - 2 && p4.mp >= 90, `0.8s 后 HoT 回完：hp ${p1.hp.toFixed(0)}→${p4.hp.toFixed(0)}，mp→${p4.mp.toFixed(0)}`);
    await sleep(500); await p.keyboard.press('1'); await sleep(50); chk(await p.evaluate(() => window.__game.scene.getScene('Battle').world.pots[0]) === 3, '1s 后可再喝红药');
    errs.push(...w.errs); await p.close();
  }
  { // 2 主线 BOSS（目标≥31 级层）
    const { p, w } = await open({ ...SAVE, level: 45, cls: 'warrior', floorIndex: 0 });
    const r = await p.evaluate(() => {
      const B = window.__game.scene.getScene('Battle'), W = B.world; window.__ev = []; const hd = B.handle.bind(B); B.handle = evs => { for (const v of evs) window.__ev.push(v.type + ':' + (v.kind ?? '')); return hd(evs); };
      const cand = [10, 11, 22, 9, 12, 19, 20, 21];
      for (const i of cand) { const f = W.floors[i]; const s = f?.spawns.find(x => x.id.startsWith('boss') || /王|魔|龙|教主/.test(x.id)); if (!f) continue;
        W.loadFloor(i); const bu = W.units.find(u => u.team === 'enemy' && u.tier === 'boss'); if (!bu) continue;
        W.hero.hp = W.hero.maxHp = 1e7; W.hero.x = bu.x - 200; bu.ai = 'chase'; return { i, name: f.name, boss: bu.name, uid: bu.uid, iv: bu.atkInterval, atk: bu.atk, hp: bu.maxHp }; }
      return null; });
    chk(!!r, `找到主线 BOSS 层 ${r?.name} ${r?.boss}（攻 ${r?.atk} 血 ${r?.hp}）`);
    chk(r && r.iv <= 1.2, `BOSS 攻速 ${r?.iv}s ≤1.2s`);
    await sleep(1500); await p.evaluate(uid => { const W = window.__game.scene.getScene('Battle').world, u = W.units.find(x => x.uid === uid); u.hp = Math.round(u.maxHp * 0.45); }, r.uid);
    await sleep(2500); await p.screenshot({ path: `${dir}/bb-2-boss.png` });
    const st = await p.evaluate(uid => { const W = window.__game.scene.getScene('Battle').world, u = W.units.find(x => x.uid === uid); return { called: !!u.boss?.called, minions: (u.boss?.minions ?? []).length, enr: !!u.boss?.enraged, aoe: u.boss?.aoeX !== undefined || u.boss?.aoeT !== undefined, ev: window.__ev }; }, r.uid); const ev = st.ev, calls = st.minions; console.log('  boss state', JSON.stringify({ ...st, ev: ev.slice(0, 12) }));
    chk(calls >= 1, `BOSS 半血召唤小怪（${calls} 次）`); chk(!st.enr && !st.aoe, '主线 BOSS 无通用狂暴/AOE（bossMainEnrageAoe=false）');
    errs.push(...w.errs); await p.close();
  }
  const bad = errs.filter(e => !/404|Failed to load/.test(e)); chk(bad.length === 0, `无控制台报错（${bad.length}）${bad.slice(0, 3).join(' | ')}`);
} finally { await b.close(); sv.kill?.(); sv.close?.(); }
console.log(fail ? `FAIL ${fail}` : '浏览器验证全部通过'); process.exit(fail ? 1 : 0);
