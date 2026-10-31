// R22 经验曲线：旧存档（无 expV）读档迁移 → HUD/面板经验条 → 加经验触发升级提示
// 用法：npm run build && node tests/e2e/exp-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const sv = await startPreview(), b = await launch(); let out = {};
const old = { v: 1, cls: 'mage', level: 25, exp: 602, gold: 500, pots: [5, 0, 0], floorIndex: 9, kills: 0, nextUid: 100, mapV: 3, eqV: 2, equip: {}, bag: [] };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), old);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  const texts = () => page.evaluate(() => { const r = []; for (const k of ['UI', 'Battle']) { const walk = l => l.forEach(o => { if (o.type === 'Text' && /经验|升级|Lv\d/.test(o.text)) r.push(o.text); if (o.list) walk(o.list); }); walk(window.__game.scene.getScene(k).children.list); } return [...new Set(r)].slice(0, 12); });
  const loaded = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { level: w.level, exp: w.exp, expNext: w.expNext, expV: w.toSave().expV, floor: w.floorIndex }; });
  const hud1 = await texts(); await page.screenshot({ path: `${dir}/exp-1-loaded.png` });
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(800);
  const panel = await texts(); await page.screenshot({ path: `${dir}/exp-2-panel.png` });
  await page.evaluate(() => window.__game.scene.getScene('Battle').closePanel?.()); await sleep(300);
  await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; w.gainExp(w.expNext - w.exp + 5); }); await sleep(400);
  const up = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { level: w.level, exp: w.exp, expNext: w.expNext }; });
  const hud2 = await texts(); await page.screenshot({ path: `${dir}/exp-3-levelup.png` });
  await sleep(2500); const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fcl_save_v1')));
  out = { loaded, hud1, panel, up, hud2, saved: { level: saved.level, exp: saved.exp, expV: saved.expV }, errs: w.errs.slice(0, 5) };
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
