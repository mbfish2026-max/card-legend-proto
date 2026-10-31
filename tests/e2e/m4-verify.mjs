// M4 新怪 + 魔龙立绘浏览器验证（vite preview + puppeteer）
// 用法：npm run build && node tests/e2e/m4-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const SAVE = { v: 1, level: 55, exp: 0, gold: 5000, pots: [5, 5, 5, 5], floorIndex: 22, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [] };
const PLAN = [
  [19, { boss_hj_home: 'boss_molong' }],
  [23, { boss_molong: 'boss_molong' }],
  [24, { boss_yeti_king: 'yeti_king', rake_cat_king: 'rake_cat_king', orc_commander: 'orc_commander', hawk_guard: 'hawk_guard' }],
  [25, { evil_lich: 'evil_lich', boss_huangquan: 'huangquan_master' }],
  [26, { boss_twinhead_kong: 'twinhead_kong', boss_twinhead_blood: 'twinhead_blood' }],
];
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0;
const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
try {
  for (const [fl, want] of PLAN) {
    const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const ww = watch(p);
    await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), SAVE);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1200);
    await p.evaluate(f => { const W = window.__game.scene.getScene('Battle').world; W.hero.hp = W.hero.maxHp = 1e9; W.loadFloor(f); }, fl); await sleep(2500);
    for (const id of Object.keys(want)) {
      // 把目标拉到主角前方（镜头内）截图看立绘
      const r = await p.evaluate((id, art) => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero;
        const u = W.units.find(x => x.id === id && x.alive); if (!u) return { found: false };
        for (const e of W.units.filter(x => x.team === 'enemy' && x.alive && x !== u)) { e.ai = 'idle'; }
        u.x = h.x + 330; u.ai = 'idle'; const v = B.views.get(u.uid); if (v) v.x = u.x;
        const key = v?.art?.texture?.key, src = key && B.textures.get(key).getSourceImage();
        return { found: true, name: u.name, floor: W.floor.name, key, ok: key === art && B.textures.exists(art), w: src?.width ?? 0, h: src?.height ?? 0 }; }, id, want[id]);
      await sleep(900); await p.screenshot({ path: `${dir}/m4-${fl}-${id}.png` });
      const k = await p.evaluate(id => { const W = window.__game.scene.getScene('Battle').world; const u = W.units.find(x => x.id === id && x.alive); if (!u) return false;
        // 真实伤害路径打死（主角为来源）
        let n = 0; while (u.alive && n++ < 1000) W.damage(u, u.maxHp / 10 + 1, W.hero); return !u.alive; }, id);
      await sleep(500);
      out[id] = { ...r, killed: k };
      chk(r.found && r.ok && r.w > 100 && k, `${fl}.${r.floor}：${r.name ?? id} 出现，立绘 ${r.key}（${r.w}×${r.h}），可击杀 ${k}`);
    }
    const e2 = ww.errs.filter(e => !/404|Failed to load/.test(e)); const e404 = ww.errs.filter(e => /404|Failed to load/.test(e));
    chk(e2.length === 0, `第 ${fl} 层页无控制台报错（${e2.length}）${e2.slice(0, 2).join(' | ')}；404 类 ${e404.length}`);
    await p.close();
  }
} finally { await b.close(); sv.kill?.(); sv.close?.(); }
console.log(JSON.stringify(out)); console.log(fail ? `失败 ${fail}` : '全部通过'); process.exit(fail ? 1 : 0);
