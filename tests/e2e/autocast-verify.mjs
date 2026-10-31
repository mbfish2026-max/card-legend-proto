// 自动施放：召唤物已存在（满血）时跳过召唤，施毒术能被自动放出；手动仍可重复召唤
// 用法：npm run build && node tests/e2e/autocast-verify.mjs
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const save = { v: 1, level: 40, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'taoist', learned: ['heal', 'poison', 'soul_fire', 'summon_skeleton', 'summon_beast'] };
const sv = await startPreview(), b = await launch(); let out = {};
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const tp = await findPos(page, 'Title', '继'); await page.mouse.click(tp.x, tp.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
  out = await page.evaluate(async () => {
    const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; const log = [];
    const wc = W.cast.bind(W); W.cast = (i, c, o) => { const r = wc(i, c, o); if (o?.auto) log.push(W.skills[i].id + ':' + (r.ok ? 'ok' : r.reason)); return r; };
    h.hp = h.maxHp = 1e9; h.mp = h.maxMp = 1e6;
    for (const e of W.units.filter(u => u.team === 'enemy' && u.alive)) e.hp = e.maxHp = 1e9;
    const e = W.units.filter(u => u.team === 'enemy' && u.alive).sort((a, c) => Math.abs(a.x - h.x) - Math.abs(c.x - h.x))[0]; h.x = e.x - 250;
    const t0 = performance.now(); while (performance.now() - t0 < 8000) { h.mp = h.maxMp; await new Promise(r => setTimeout(r, 50)); }
    const sm = W.summon; const okCasts = log.filter(x => x.endsWith(':ok'));
    const summonOk = okCasts.filter(x => x.startsWith('summon')).length, poisonOk = okCasts.filter(x => x.startsWith('poison')).length;
    // 手动：按 F 路径直接调用 cast 无 auto
    B.cds = B.cds.map(() => 0); const k = W.skills.findIndex(s => s.id === (sm?.id === 'summon_beast' || sm?.name?.includes('神兽') ? 'summon_beast' : 'summon_skeleton'));
    const mp0 = h.mp; const man = wc(k, B.cds);
    return { summonOk, poisonOk, okCasts: okCasts.slice(0, 12), summon: sm?.name, manualRecast: man.ok && h.mp < mp0 };
  });
  out.errs = w.errs.filter(e => !/404|Failed to load/.test(e));
  await page.screenshot({ path: '/tmp/autocast.png' });
} finally { console.log(JSON.stringify(out, null, 1)); await b.close(); sv.close?.(); sv.kill?.(); process.exit(0); }
