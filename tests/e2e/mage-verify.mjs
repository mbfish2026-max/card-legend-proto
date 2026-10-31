// #11 法师 5 新技能：快捷栏两行布局、技能面板两列、F6~F10 施放特效（含素材缺失回落）、角色面板升级即时刷新
// 用法：npm run build && node tests/e2e/mage-verify.mjs [截图目录] [block]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp', blockFx = process.argv[3] === 'block';
const ALL = ['fireball', 'thunder', 'fire_wall', 'magic_shield', 'ice_roar', 'big_fireball', 'burst_fire', 'hell_fire', 'lightning_flash', 'hell_thunder'];
const sv = await startPreview({ block: u => blockFx && /\/fx\//.test(u) }), b = await launch(); let out = {};
const save = { v: 1, cls: 'mage', level: 40, exp: 0, gold: 500, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ALL };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; const u = W.units.find(u => u.team === 'enemy'); window.__E = u && { ...u }; });
  const keys = await page.evaluate(() => window.__game.scene.getScene('Battle').world.skills.map(s => s.key + ':' + s.id));
  await page.screenshot({ path: `${dir}/mage-1-hud.png` });
  const casts = [];
  for (const k of ['F6', 'F7', 'F8', 'F9', 'F10']) {
    const r = await page.evaluate(k => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp;
      // 在主角前方放 3 只怪，保证射程内有目标
      W.alive('enemy').forEach(e => { e.hp = 0; e.alive = false; }); h.facing = 1; for (const dx of [250, 330, 420]) { const e = W.spawn(window.__E, 'enemy', h.x + dx); e.hp = e.maxHp = 1e9; }
      B.cds = B.cds.map(() => 0); const i = W.skills.findIndex(s => s.key === k), mp = h.mp; B.onKey(k); return { k, id: W.skills[i]?.id, spent: mp - h.mp, E: !!window.__E, n: W.alive('enemy').length, st: B.state, pz: B.paused, cd: B.cds[i] }; }, k);
    await sleep(700); casts.push(r); await page.screenshot({ path: `${dir}/mage-cast-${k}.png` });
  }
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(800);
  await page.screenshot({ path: `${dir}/mage-2-skills.png` });
  const bounds = await page.evaluate(() => { let maxR = 0, maxB = 0; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible && o.depth >= 0) { const b = o.getBounds(); maxR = Math.max(maxR, b.right); maxB = Math.max(maxB, b.bottom); } if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').panel.root.list); return { maxR, maxB }; });
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
  const lvText = () => page.evaluate(() => { const r = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && /Lv\s*\d|等级/.test(o.text)) r.push(o.text); if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').panel.root.list); return r.slice(0, 4); });
  const before = await lvText();
  await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; w.gainExp(w.expNext - w.exp + 5); }); await sleep(500);
  const after = await lvText(); await page.screenshot({ path: `${dir}/mage-3-panel-levelup.png` });
  out = { keys, casts, bounds, before, after, errs: w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8), rawErrs: w.errs.length };
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
