// 轻量冷却：自动战斗 N 秒统计各技能释放次数（多技能都被放出）；点击冷却中技能提示「冷却中」；HUD 冷却转圈可见；无控制台报错
// 用法：npm run build && node tests/e2e/cd-verify.mjs
import { startPreview, launch, watch, sleep, findPos, toScreen, texts } from './lib.mjs';
const N = 12000;
const mk = (cls, learned, level) => ({ v: 1, level, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls, learned });
const cases = [
  mk('mage', ['fireball', 'thunder', 'hell_fire', 'big_fireball', 'burst_fire', 'ice_roar'], 40),
  mk('warrior', ['basic_sword', 'thrust', 'half_moon', 'fire_sword'], 40),
  mk('taoist', ['heal', 'poison', 'soul_fire', 'summon_skeleton'], 40),
];
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const save of cases) {
    const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const tp = await findPos(page, 'Title', '继'); await page.mouse.click(tp.x, tp.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle').hud, { timeout: 30000 }); await sleep(1000);
    const r = await page.evaluate(async (N) => {
      const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero;
      h.hp = h.maxHp = 1e9; h.mp = h.maxMp = 1e6;
      for (const e of W.units.filter(u => u.team === 'enemy' && u.alive)) e.hp = e.maxHp = 1e9;
      const e = W.units.filter(u => u.team === 'enemy' && u.alive).sort((a, c) => Math.abs(a.x - h.x) - Math.abs(c.x - h.x))[0]; h.x = e.x - (W.cls === 'warrior' ? 60 : 250);
      B.autoCount = {}; let radarMax = 0;
      const t0 = performance.now(); while (performance.now() - t0 < N) { h.mp = h.maxMp; h.hp = h.maxHp; radarMax = Math.max(radarMax, B.hud.radar.commandBuffer.length); await new Promise(r => setTimeout(r, 50)); }
      return { cls: W.cls, counts: B.autoCount, skills: W.skills.map(s => s.id + ':' + s.cooldown), radarMax, auto: B.cds.map(c => +c.toFixed(2)) };
    }, N);
    // 让一个技能处于冷却（置为满冷却），然后鼠标点击其技能格
    const pos = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); const W = B.world; const i = W.skills.findIndex(s => s.cooldown >= 4) >= 0 ? W.skills.findIndex(s => s.cooldown >= 4) : 0; B.cds[i] = W.skills[i].cooldown; const p = B.hud.skillPos[i]; return { i, p, name: W.skills[i].name }; });
    const sp = await toScreen(page, pos.p.x, pos.p.y); await page.mouse.click(sp.x, sp.y); await sleep(150);
    r.radarNow = await page.evaluate(() => window.__game.scene.getScene('Battle').hud.radar.commandBuffer.length);
    const ts = [...await texts(page, 'UI'), ...await texts(page, 'Battle')];
    r.clickMsg = ts.filter(t => /冷却中/.test(t)); r.clicked = pos.name;
    await page.screenshot({ path: `/tmp/cd-${r.cls}.png` });
    r.errs = w.errs.filter(e => !/404|Failed to load/.test(e));
    out[r.cls] = r; await page.close();
  }
} catch (e) { console.error("ERR", e); } finally { console.log(JSON.stringify(out, null, 1)); await b.close(); sv.close?.(); sv.kill?.(); process.exit(0); }
