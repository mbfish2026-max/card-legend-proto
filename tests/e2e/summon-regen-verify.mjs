// 召唤物脱战快速回血：道士召唤骷髅→受伤→清怪脱战→截图血条上升；0 控制台错误
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'taoist', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['summon_skeleton'] };
const sv = await startPreview(), b = await launch(); const out = { hp: [] }; let fail = 0;
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  const r = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world; B.tryAutoSkills = () => {}; B.cds = B.cds.map(() => 0);
    const c = W.cast(W.skills.findIndex(s => s.id === 'summon_skeleton'), B.cds); if (!c.ok) return { err: c.reason };
    const sm = W.units.find(u => u.summon && u.alive); const z = W.units.find(u => u.team === 'enemy' && u.alive);
    W.damage(sm, Math.round(sm.maxHp * 0.8), z); // 被打 → 回到战斗态
    W.units.forEach(u => { if (u.team === 'enemy') { u.alive = false; W.events.push({ type: 'death', uid: u.uid }); } }); // 清怪 → 4s 后脱战
    window.__sm = sm.uid; return { ok: true, max: sm.maxHp, hp: sm.hp }; });
  if (r.err) throw new Error(r.err);
  // 无头浏览器帧率低，游戏时间走得慢：在页面里按真实游戏步长推进世界（W.step），再等渲染一帧截图
  let prev = 0;
  for (const t of [0, 3, 6, 10, 15]) {
    const hp = await page.evaluate(async dt => { const B = window.__game.scene.getScene('Battle'), W = B.world; for (let k = 0; k < dt / 0.05; k++) W.step(0.05); B.handle?.(W.drainEvents()); await new Promise(r => setTimeout(r, 300)); const u = W.units.find(x => x.uid === window.__sm); return { t: +W.time.toFixed(1), hp: Math.round(u.hp), pct: +(u.hp / u.maxHp * 100).toFixed(1), bar: +(B.views.get(u.uid)?.hpFill?.scaleX ?? -1).toFixed(3) }; }, t - prev);
    prev = t; out.hp.push(hp); await page.screenshot({ path: `${dir}/summon-regen-${t}s.png` });
  }
  const h = out.hp; const early = (h[1].pct - h[0].pct) / 3, late = (h[4].pct - h[2].pct) / 9; out.early = early; out.late = late;
  if (!(late > early * 2 && h[4].pct > h[0].pct + 15)) fail++;
  out.errs = w.errs.filter(e => !/404|Failed to load/.test(e)); fail += out.errs.length;
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out)); console.log(fail ? 'summon-regen FAIL' : 'summon-regen OK'); process.exit(fail ? 1 : 0);
