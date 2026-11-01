// feat/account-p1：游客模式不受影响（未配置）、登录界面、冲突选择界面（mock 云端，不连真实服务）；1280×720 + 844×390 触屏
import { startPreview, launch, watch, sleep, findPos, texts } from './lib.mjs';
import { writeFileSync } from 'node:fs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const sv0 = (cls, level, floorIndex, gold) => ({ v: 1, cls, level, exp: 0, gold, pots: [5, 0, 0, 0], floorIndex, kills: 0, nextUid: 10, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] });
const local = sv0('warrior', 30, 8, 5000);
// 页面内 mock：persist=true 表示已有会话（刷新后恢复）
const mockInit = (cfg) => {
  localStorage.setItem('fcl_save_v1', JSON.stringify(cfg.local));
  if (!cfg.mock) return;
  const rows = cfg.rows; let sess = cfg.persist ? { userId: 'u1', username: '测试玩家' } : null;
  window.__mockLog = [];
  window.__FCL_CLOUD_MOCK__ = {
    async restore() { await new Promise(r => setTimeout(r, 300)); return sess; },
    async signIn(u) { sess = { userId: 'u1', username: u }; return sess; }, async signUp(u) { sess = { userId: 'u1', username: u }; return sess; },
    async signOut() { sess = null; },
    async list() { return JSON.parse(JSON.stringify(rows)); },
    async put(slot, data, expected) { window.__mockLog.push(['put', slot, expected]); const r = rows.find(x => x.slot === slot); if (expected == null ? r : r?.updated_at !== expected) return { ok: false, conflict: true }; const at = new Date().toISOString(); if (r) Object.assign(r, { data, updated_at: at }); else rows.push({ slot, data, updated_at: at }); return { ok: true, at }; },
    beacon() { return true; },
  };
};
const sv = await startPreview(), b = await launch(); const out = {};
const tap = async (page, touch, p) => { if (touch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y); };
const title = page => page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 });
try {
  for (const [vw, vh, touch] of [[1280, 720, false], [844, 390, true]]) {
    const r = (out[`${vw}x${vh}`] = {});
    const open = async cfg => { const ctx = await b.createBrowserContext(), page = await ctx.newPage(); await page.setViewport({ width: vw, height: vh, hasTouch: touch, isMobile: touch }); const w = watch(page); await page.evaluateOnNewDocument(mockInit, cfg); await page.goto(sv.url); await title(page); await sleep(1500); return { page, w }; };
    // A 游客（未配置 VITE_SUPABASE_*）：主菜单显示「账号：未配置」，继续存档正常进战斗
    { const { page, w } = await open({ local, mock: false });
      r.guestTexts = (await texts(page, 'Title')).filter(t => /账号|继|新/.test(t));
      await page.screenshot({ path: `${dir}/account-p1-guest-${vw}.png` });
      await tap(page, touch, await findPos(page, 'Title', '继'));
      await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
      r.guestBattle = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { cls: w.cls, level: w.level, gold: w.gold }; });
      r.guestCloudKeys = await page.evaluate(() => Object.keys(localStorage).filter(k => /cloud|auth/.test(k)));
      await page.screenshot({ path: `${dir}/account-p1-guest-battle-${vw}.png` }); r.guestErrs = w.errs.slice(0, 5); await page.close(); }
    // B mock 已配置、未登录：点「登录 / 注册」出登录表单
    { const { page, w } = await open({ local, mock: true, rows: [], persist: false });
      r.chip = (await texts(page, 'Title')).find(t => /登录|账号|恢复/.test(t));
      await tap(page, touch, await findPos(page, 'Title', '登录 / 注册')); await sleep(600);
      r.form = await page.evaluate(() => { const f = document.getElementById('fcl-login'); if (!f) return null; const b = f.getBoundingClientRect(); return { w: b.width, h: b.height, top: b.top, bottom: b.bottom, inView: b.top >= 0 && b.bottom <= innerHeight }; });
      await page.type('#fcl-u', 'a'); await page.type('#fcl-p', '123'); await page.click('#fcl-in'); await sleep(200);
      r.formErr = await page.$eval('#fcl-msg', e => e.textContent);
      await page.screenshot({ path: `${dir}/account-p1-login-${vw}.png` }); r.loginErrs = w.errs.slice(0, 5); await page.close(); }
    // C mock 已登录（会话恢复）+ 云端槽 1 不同 → 自动出冲突选择
    { const rows = [{ slot: 1, data: sv0('mage', 42, 20, 12000), updated_at: '2026-10-30T12:00:00.000Z' }, { slot: 3, data: sv0('taoist', 18, 4, 800), updated_at: '2026-10-29T08:00:00.000Z' }];
      const { page, w } = await open({ local, mock: true, rows, persist: true }); await sleep(800);
      r.conflictTexts = (await texts(page, 'Title')).filter(t => /冲突|本机|云端|Lv/.test(t));
      r.backupKeys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('fcl_cloud_backup_')));
      r.slot3Downloaded = await page.evaluate(() => JSON.parse(localStorage.getItem('fcl_save_v1_s3') ?? 'null')?.level);
      await page.screenshot({ path: `${dir}/account-p1-conflict-${vw}.png` });
      await tap(page, touch, await findPos(page, 'Title', '保留云端')); await sleep(600);
      r.afterChoose = await page.evaluate(() => ({ slot1: JSON.parse(localStorage.getItem('fcl_save_v1')).level, backups: Object.keys(localStorage).filter(k => k.startsWith('fcl_cloud_backup_')) }));
      r.afterTexts = (await texts(page, 'Title')).filter(t => /☁|账号|继/.test(t));
      await page.screenshot({ path: `${dir}/account-p1-after-choose-${vw}.png` }); r.conflictErrs = w.errs.slice(0, 5); await page.close(); }
  }
} catch (e) { out.err = String(e.stack || e); } finally { writeFileSync(dir + '/account-p1-report.json', JSON.stringify(out, null, 1)); await b.close(); sv.stop(); process.exit(0); }
