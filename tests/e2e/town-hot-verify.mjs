// fix/town-hot：城内按 1 喝金创药 → HP 应在城内上涨（修复前不涨，出城才补）
// 用法：npm run build && npx tsx tests/e2e/town-hot-mksave.ts /tmp/town-hot-save.json && node tests/e2e/town-hot-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/cl-town-hot-shots'; mkdirSync(dir, { recursive: true });
const save = JSON.parse(readFileSync(process.argv[3] ?? '/tmp/town-hot-save.json', 'utf8'));
const sv = await startPreview(), b = await launch(); const out = {};
const st = page => page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { town: W.town, hp: W.hero.hp, maxHp: W.hero.maxHp, pots: W.pots[0], hots: W.hero.hots?.length ?? 0 }; });
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
  await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  { const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y); }
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  await page.evaluate(() => { window.__game.scene.getScene('Battle').world.hero.hp = 10; }); /* 模拟受伤（hp 不入存档） */ await sleep(300);
  out.before = await st(page); await page.screenshot({ path: `${dir}/1-town-before.png` });
  await page.keyboard.press('1'); await sleep(300); out.t03 = await st(page);
  await sleep(1500); out.after = await st(page); await page.screenshot({ path: `${dir}/2-town-after-drink.png` });
  out.pass = !!(out.before.town && out.after.town && out.after.pots === out.before.pots - 1 && out.after.hp > out.before.hp && out.after.hots === 0);
  out.errs = w.errs.slice(0, 5); await page.close();
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/report.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out)); await b.close(); sv.stop(); process.exit(0); }
