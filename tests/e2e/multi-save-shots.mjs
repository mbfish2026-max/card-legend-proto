// feat/multi-save e2e：旧档迁移、存档位界面（每格信息）、删除二次确认、新建空槽、游戏内设置「切换存档」；截图 multi-save-*.png
import { startPreview, launch, watch, sleep, findPos, texts } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const bad = m => { fail++; (out.fails ??= []).push(m); };
const mk = (cls, level, floorIndex) => ({ v: 1, cls, level, exp: 0, gold: 9, pots: [1, 0, 0, 1], floorIndex, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] });
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const tag = `${vw}x${vh}`, ctx = await b.createBrowserContext(), page = await ctx.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page);
    const tap = async (src) => { const p = await findPos(page, 'Title', src); if (!p) throw new Error('找不到 ' + src); if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); await sleep(500); };
    await page.goto(sv.url); await page.evaluate((a, c) => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(a)); localStorage.setItem('fcl_save_v1_s3', JSON.stringify(c)); }, mk('mage', 33, 20), mk('taoist', 12, 5));
    await page.reload(); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const r = {}; r.backup = await page.evaluate(() => !!localStorage.getItem('fcl_save_v1_backup'));
    await tap('存 档 位'); r.rows = (await texts(page, 'Title')).filter(t => /Lv\d+|^空$/.test(t));
    if (r.rows.length < 5 || !r.rows.some(t => /法师\s+Lv33.*时长/.test(t)) || !r.backup) bad(tag + ' 存档位列表/迁移 ' + JSON.stringify(r));
    await page.screenshot({ path: `${dir}/multi-save-slots-${tag}.png` });
    // 删除槽 3：第一次只出确认
    const delAt = async () => page.evaluate(() => { const T = window.__game.scene.getScene('Title'), all = []; const walk = l => l.forEach(o => { if (o.list) walk(o.list); else all.push(o); }); walk(T.children.list);
      const row = all.find(o => o.name === 'slot:3'), bt = all.filter(o => o.type === 'Text' && /删除/.test(o.text) && Math.abs(o.y - row.y) < 20)[0]; const cv = window.__game.canvas.getBoundingClientRect(), R = window.__render ?? { lw: 1280, ox: 0 };
      return { x: cv.left + (bt.x + R.ox) * cv.width / R.lw, y: cv.top + bt.y * cv.height / 720 }; });
    let p = await delAt(); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); await sleep(400);
    r.armed = await page.evaluate(() => !!localStorage.getItem('fcl_save_v1_s3')); await page.screenshot({ path: `${dir}/multi-save-confirm-${tag}.png` });
    p = await delAt(); touch ? await page.touchscreen.tap(p.x, p.y) : await page.mouse.click(p.x, p.y); await sleep(400);
    r.deleted = await page.evaluate(() => !localStorage.getItem('fcl_save_v1_s3'));
    if (!r.armed || !r.deleted) bad(tag + ' 删除二次确认 ' + JSON.stringify(r));
    // 返回 → 继续 槽 1 → 设置 → 切换存档
    await tap('返回'); await tap('继'); await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').onKey('ESCAPE')); await sleep(600);
    r.switchN = await page.evaluate(() => { const U = window.__game.scene.getScene('UI'), out = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible && o.text === '切换存档') out.push(o); if (o.list) walk(o.list); }); walk(U.children.list); return out.length; });
    r.domDup = await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /切换存档/.test(e.textContent || '')).length);
    await page.screenshot({ path: `${dir}/multi-save-settings-${tag}.png` });
    if (r.switchN !== 1 || r.domDup) bad(tag + ' 切换存档入口数 ' + JSON.stringify(r));
    await page.evaluate(() => { const U = window.__game.scene.getScene('UI'); U.panel.close(); window.__game.registry.set('openSlots', true); window.__game.scene.getScene('Battle').toTitle(); }); await sleep(1500);
    r.back = (await texts(page, 'Title')).includes('存 档 位'); if (!r.back) bad(tag + ' 切换存档未回到存档位界面');
    r.lastAt = await page.evaluate(() => JSON.parse(localStorage.getItem('fcl_slots_v1')).slots['1']?.lastAt > 0); if (!r.lastAt) bad(tag + ' 未记录最后游玩');
    if (w.errs.length) bad(tag + ' 控制台错误 ' + w.errs.slice(0, 2).join('|'));
    out[tag] = r; await ctx.close();
  }
} finally { await b.close(); sv.close?.(); sv.kill?.(); }
console.log(JSON.stringify(out, null, 1)); console.log(fail ? `FAIL ${fail}` : 'multi-save-shots OK'); process.exit(fail ? 1 : 0);
