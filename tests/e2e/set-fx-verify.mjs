// feat/set-fx：穿三圣 4 件 → 角色面板（暴击/套装特效行）+ 装备 tooltip + 技能面板耗魔 截图
// 用法：npm run build && npx tsx tests/e2e/set-fx-mksave.ts /tmp/set-fx-saves.json && node tests/e2e/set-fx-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/cl-set-fx-shots'; mkdirSync(dir, { recursive: true });
const saves = JSON.parse(readFileSync(process.argv[3] ?? '/tmp/set-fx-saves.json', 'utf8'));
const sv = await startPreview(), b = await launch(); const out = {};
const slots = page => page.evaluate(() => { const s = window.__game.scene.getScene('UI'), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView, r = [];
  const walk = l => l.forEach(o => { if (o.getData?.('slot')) { const bb = o.getBounds(); r.push({ x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY - wv.y) * cv.height / wv.height }); } if (o.list) walk(o.list); }); walk(s.children.list); return r; });
const texts = page => page.evaluate(() => { const r = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) r.push(o.text); if (o.list) walk(o.list); }); walk(window.__game.scene.getScene('UI').children.list); return r.join('\n'); });
try {
  for (const cls of Object.keys(saves)) {
    const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page); const r = (out[cls] = {});
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, saves[cls]);
    await page.goto(sv.url); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    { const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    r.world = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { specials: W.setSpecials(), crit: W.critChance(), mana: W.skills.map(s => [s.name, s.mana, W.manaCost(s)]) }; });
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(1500);
    r.panelText = (await texts(page)).split('\n').filter(l => /套装|暴击/.test(l));
    await page.screenshot({ path: `${dir}/${cls}-1-panel.png` });
    const cv = await page.evaluate(() => { const c = window.__game.canvas.getBoundingClientRect(); return { l: c.left, t: c.top, w: c.width, h: c.height }; });
    await page.mouse.move(cv.l + 160 / 1024 * cv.w, cv.t + 152 / 576 * cv.h); /* 头盔槽 */ await sleep(700);
    r.tip = await page.evaluate(() => !!window.__game.scene.getScene('UI').panel.tip); r.tipText = (await texts(page)).split('\n').filter(l => /件|特效|适配|暴击|魔法|召唤|治疗/.test(l)).slice(0, 12);
    await page.screenshot({ path: `${dir}/${cls}-2-tooltip.png` });
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(1000);
    r.skillText = (await texts(page)).split('\n').filter(l => /耗魔/.test(l)).slice(0, 6);
    await page.screenshot({ path: `${dir}/${cls}-3-skills.png` });
    r.errs = w.errs.slice(0, 5); await page.close();
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
