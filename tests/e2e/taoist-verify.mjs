// #12 道士 3 新技能：F6~F8 施放（buff 数值/重复无效/群疗）、特效（含 fx 素材缺失回落）、技能面板
// 用法：npm run build && node tests/e2e/taoist-verify.mjs [截图目录] [block]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp', blockFx = process.argv[3] === 'block';
const ALL = ['heal', 'poison', 'soul_fire', 'summon_skeleton', 'summon_beast', 'ghost_shield', 'holy_armor', 'mass_heal'];
const sv = await startPreview({ block: u => blockFx && /\/fx\//.test(u) }), b = await launch(); let out = {};
const save = { v: 1, cls: 'taoist', level: 40, exp: 0, gold: 500, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ALL };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  const keys = await page.evaluate(() => window.__game.scene.getScene('Battle').world.skills.map(s => s.key + ':' + s.id));
  await page.screenshot({ path: `${dir}/taoist-1-hud.png` });
  const casts = [];
  for (const k of ['F6', 'F7', 'F6', 'F8']) {
    const r = await page.evaluate(k => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp; h.hp = Math.floor(h.maxHp / 2);
      B.cds = B.cds.map(() => 0); const i = W.skills.findIndex(s => s.key === k), mp = h.mp, hp = h.hp; B.onKey(k);
      return { k, id: W.skills[i]?.id, spent: mp - h.mp, healed: h.hp - hp, defUp: h.defUp, mdefUp: h.mdefUp, mdefLeft: h.mdefUpUntil ? Math.round(h.mdefUpUntil - W.time) : 0 }; }, k);
    await sleep(900); casts.push(r); await page.screenshot({ path: `${dir}/taoist-cast-${casts.length}-${k}.png` });
  }
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(800);
  await page.screenshot({ path: `${dir}/taoist-2-skills.png` });
  out = { keys, casts, errs: w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8), rawErrs: w.errs.length };
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
