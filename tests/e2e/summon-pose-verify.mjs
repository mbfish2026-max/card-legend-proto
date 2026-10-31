// feat/art-integrate：召唤物姿态帧（L.2）真实运行：神兽/骷髅攻击、受击时换帧再切回；缺帧回退：先删 dist/assets/fx/summon_skeleton_* 再跑，应只见原立绘且无报错
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'taoist', level: 40, exp: 0, gold: 5000, pots: [9, 9, 9, 9], floorIndex: 3, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['summon_skeleton', 'summon_beast'] };
const sv = await startPreview(), b = await launch(); const out = {};
const sample = page => page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world; const seen = {}; for (let i = 0; i < 160; i++) { const sm = W.summon; if (sm) { sm.hp = sm.maxHp; const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) { e.hp = e.maxHp; if (i === 0) e.x = sm.x + 80; } const v = B.views.get(sm.uid); if (v) seen[v.art.texture.key] = (seen[v.art.texture.key] || 0) + 1; } W.hero.hp = W.hero.maxHp; await new Promise(r => setTimeout(r, 50)); } return seen; });
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const page = await b.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(5000);
    const r = {};
    for (const sk of ['summon_beast', 'summon_skeleton']) {
      await page.evaluate(sk => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.mp = W.hero.maxMp; B.cds = B.cds.map(() => 0); W.cast(W.skills.findIndex(s => s.id === sk), B.cds); }, sk); await sleep(1200);
      r[sk] = { tex: await page.evaluate(() => ['summon_beast', 'summon_beast_atk', 'summon_beast_hurt', 'summon_skeleton_atk', 'summon_skeleton_hurt'].filter(k => window.__game.textures.exists(k))), seen: await sample(page) };
      await page.screenshot({ path: `${dir}/pose-${sk}-${vw}.png` });
    }
    out[`${vw}x${vh}`] = { ...r, errs: w.errs.slice(0, 5) }; await page.close();
  }
} catch (e) { out.err = String(e); } finally { (await import('node:fs')).writeFileSync(dir + '/pose-report' + (process.argv[3] ?? '') + '.json', JSON.stringify(out)); await b.close(); sv.stop(); process.exit(0); }
