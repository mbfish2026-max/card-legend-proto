// 传世 16 技能 + 金甲骷髅：书店传世秘籍页 → 购买/学习 → 快捷栏图标 → 逐个施放（F 键 / 点击）→ 金甲骷髅升级变色
// 用法：npm run build && node tests/e2e/chuanshi-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp/cs-e2e';
import { mkdirSync } from 'node:fs'; mkdirSync(dir, { recursive: true });
const CS = { warrior: ['thunder_sword', 'break_strike', 'shield_break', 'vajra_body', 'dash_slash'], mage: ['ice_arrow', 'ice_dragon', 'frost_blade', 'five_thunder', 'ice_whirl'], taoist: ['drive_corpse', 'decoy_talisman', 'soul_wall', 'clear_mind', 'holy_light', 'cleanse', 'summon_golden_skeleton'] };
const BASE_LEARN = { warrior: ['slash', 'fire_sword'], mage: ['fireball', 'thunder'], taoist: ['heal', 'summon_skeleton'] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  for (const cls of Object.keys(CS)) {
    const save = { v: 1, cls, level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: BASE_LEARN[cls] };
    const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: ['warrior', 'mage', 'taoist'], autoAttack: false })); }, save);
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
    // 书店 → 传世秘籍页签（真实点击）
    await page.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('shop')); await sleep(600); // 战斗图无商人，直接打开商店面板验证 UI
    const bs = await findPos(page, 'UI', '^▶?书店$'); if (bs) { await page.mouse.click(bs.x, bs.y); await sleep(500); }
    const tab = await findPos(page, 'UI', '传世秘籍'); if (tab) { await page.mouse.click(tab.x, tab.y); await sleep(600); }
    await page.screenshot({ path: `${dir}/${cls}-1-cs-shop.png` });
    const r = await page.evaluate(ids => { const B = window.__game.scene.getScene('Battle'), W = B.world; const res = {};
      for (const id of ids) { const e = W.buyBook(id); const i = W.bag.findIndex(x => x.item === 'book_' + id); res[id] = { buy: e, learn: i >= 0 ? W.learnBook(i) : 'no book' }; W.skillTrain[id] = 99999; }
      return res; }, CS[cls]);
    await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(800);
    await page.screenshot({ path: `${dir}/${cls}-2-skills-panel.png` });
    await page.evaluate(() => window.__game.scene.getScene('Battle').closePanel?.()); await page.keyboard.press('Escape'); await sleep(400);
    // 重新进场以重建 HUD（与学书后实际流程一致：HUD 读取 world.skills）
    await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); B.ui?.rebuildHud?.(); }); await sleep(800);
    const icons = await page.evaluate(ids => { const g = window.__game; return Object.fromEntries(ids.map(id => [id, g.textures.exists('sk_' + id)])); }, CS[cls]);
    await page.screenshot({ path: `${dir}/${cls}-3-hotbar.png` });
    // 逐个施放：走 onKey（与 F 键/点击同一入口）
    const casts = {};
    for (const id of CS[cls]) {
      if (id === 'clear_mind') { casts[id] = 'passive'; continue; }
      const pre = await page.evaluate(id => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp = 99999; h.hp = id === 'decoy_talisman' || id === 'cleanse' ? Math.floor(h.maxHp * 0.5) : h.maxHp;
        if (!window.__logs) { window.__logs = []; const o = B.log.bind(B); B.log = (t, ...a) => { window.__logs.push(t); return o(t, ...a); }; }
        B.cds = B.cds.map(() => 0); h.defUpUntil = 0; h.mdefUpUntil = 0; const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) { h.x = e.x - 120; e.hp = e.maxHp; }
        const i = W.skills.findIndex(s => s.id === id), cv = window.__game.canvas.getBoundingClientRect(), p = B.hud.skillPos[i];
        window.__mp0 = h.mp; window.__logs.length = 0; return p && { key: W.skills[i].key, x: cv.left + p.x * cv.width / 1280, y: cv.top + p.y * cv.height / 720 }; }, id);
      if (!pre) { casts[id] = { err: 'not on hotbar' }; continue; }
      await page.mouse.click(pre.x, pre.y); await sleep(100); // 真实点击快捷栏图标
      const c = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { mpSpent: window.__mp0 - W.hero.mp, summon: W.summon?.id, decoy: !!W.decoy, logs: window.__logs.slice(0, 3) }; }); c.key = pre.key;
      await sleep(900); await page.screenshot({ path: `${dir}/${cls}-cast-${id}.png` }); casts[id] = c;
    }
    // 自动释放：与 BattleScene 同一入口 world.autoCast(列表, cds)，逐个技能单独列表
    const auto = await page.evaluate(ids => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero, res = {};
      for (const id of ids) { if (id === 'clear_mind') continue; h.mp = 99999; h.hp = id === 'decoy_talisman' || id === 'cleanse' ? Math.floor(h.maxHp * 0.5) : h.maxHp; h.defUpUntil = 0; h.mdefUpUntil = 0; for (const u of W.units) if (u.team === 'ally' && u !== h && (u.summon || u.decoy)) { u.alive = false; } B.cds = B.cds.map(() => 0);
        const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) { h.x = e.x - 120; e.hp = e.maxHp; } const a = W.autoCast([id], B.cds); B.handle(W.drainEvents()); res[id] = a?.id === id; }
      return res; }, CS[cls]);
    await sleep(800); await page.screenshot({ path: `${dir}/${cls}-6-autocast.png` });
    let golden = null;
    if (cls === 'taoist') {
      golden = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.hero.mp = 99999; B.cds = B.cds.map(() => 0); W.cast(W.skills.findIndex(s => s.id === 'summon_golden_skeleton'), B.cds); B.handle(W.drainEvents()); const g = W.summon; return g && { id: g.id, sLv: g.sLv, color: g.nameColor, tint: g.card?.tint }; });
      await page.screenshot({ path: `${dir}/taoist-4-golden.png` });
      const up = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, g = W.summon; g.sKills = 1e6; const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) W.kill(e); return { sLv: g.sLv, color: g.nameColor, name: g.name }; });
      await sleep(1000); await page.screenshot({ path: `${dir}/taoist-5-golden-levelup.png` }); golden = { before: golden, after: up };
    }
    out[cls] = { auto, shopTab: !!tab, learn: r, icons, casts, golden, errs: w.errs.slice(0, 10) };
    await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
