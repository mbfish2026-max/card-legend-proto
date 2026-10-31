// 合击版阶段 A：英雄战斗浏览器验证（vite preview + puppeteer 真实键盘/鼠标）
// 用法：npm run build && node tests/e2e/hj-battle-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const SAVE = { v: 1, level: 40, exp: 0, gold: 5000, pots: [5, 5, 5, 5], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [] };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0;
const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), SAVE);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const tp = await findPos(page, 'Title', '继'); await page.mouse.click(tp.x, tp.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1500);
  const ev = fn => page.evaluate(fn);
  // 1 获取英雄（老兵领取 = World.recruitCompanion，与面板按钮同一入口）
  out.recruit = await ev(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.hp = W.hero.maxHp = 1e7; const r = W.recruitCompanion('mage', '法师英雄'); if (W.companion.out) W.toggleCompanion(); W.companion.recallAt = -1e9; // 领取后默认出战；先收回并跳过冷却以便验证 R 召唤
    return { r, has: !!W.companion, out: W.companion.out }; });
  chk(out.recruit.has && !out.recruit.out, '40 级领取英雄（未出战）');
  // 2 召唤（R）
  await page.keyboard.press('r'); await sleep(800);
  out.summon = await ev(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, u = W.companionUnit; return { out: W.companion.out, unit: !!u, view: !!(u && B.views.get(u.uid)), mode: W.companion.mode }; });
  chk(out.summon.out && out.summon.unit && out.summon.view && out.summon.mode === 'fight', 'R 召唤：英雄卡上场，默认攻击');
  await page.screenshot({ path: `${dir}/hj-1-summon.png` });
  // 3 跟随：E 切到跟随，主角右走，英雄跟上
  await page.keyboard.press('e'); await page.keyboard.press('e'); await sleep(200); // fight→follow→rest
  const m1 = await ev(() => window.__game.scene.getScene('Battle').world.companion.mode); await page.keyboard.press('e'); await page.keyboard.press('e');
  const m2 = await ev(() => window.__game.scene.getScene('Battle').world.companion.mode); chk(m1 === 'rest' && m2 === 'follow', `E 循环状态（${m1}→${m2}）`);
  const f0 = await ev(() => window.__game.scene.getScene('Battle').world.companionUnit.x);
  await page.keyboard.down('ArrowRight'); await sleep(1500); await page.keyboard.up('ArrowRight'); await sleep(1200);
  out.follow = await ev(() => { const W = window.__game.scene.getScene('Battle').world; return { cx: Math.round(W.companionUnit.x), hx: Math.round(W.hero.x) }; });
  chk(out.follow.cx > f0 + 50 && Math.abs(out.follow.cx - out.follow.hx) < 200, `跟随：英雄跟上主角（${Math.round(f0)}→${out.follow.cx}，主角 ${out.follow.hx}）`);
  await page.screenshot({ path: `${dir}/hj-2-follow.png` });
  // 4 攻击状态 + 点击怪物卡指定目标（主角不走位）
  await page.keyboard.press('e'); await page.keyboard.press('e'); // follow→rest→fight
  const tg = await ev(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; const es = W.units.filter(u => u.team === 'enemy' && u.alive); const e = es.sort((a, c) => Math.abs(a.x - h.x) - Math.abs(c.x - h.x))[0];
    e.x = h.x + 260; e.hp = e.maxHp = 5e5; const v = B.views.get(e.uid); v.x = e.x; const cam = B.cameras.main; const cv = window.__game.canvas.getBoundingClientRect();
    return { uid: e.uid, sx: cv.left + (v.x - cam.scrollX) * cv.width / 1280, sy: cv.top + (v.y - cam.scrollY - 20) * cv.height / 720, hx: h.x, mode: W.companion.mode }; });
  await sleep(200); await page.mouse.click(tg.sx, tg.sy); await sleep(300);
  out.target = await ev(() => { const W = window.__game.scene.getScene('Battle').world; return { t: W.companionTarget, hx: W.hero.x }; });
  chk(tg.mode === 'fight' && out.target.t === tg.uid && Math.abs(out.target.hx - tg.hx) < 30, `点击怪物卡：指定目标且主角不误走位（Δx=${Math.round(out.target.hx - tg.hx)}）`);
  await sleep(3000);
  out.fight = await ev(() => { const W = window.__game.scene.getScene('Battle').world, e = W.units.find(u => u.uid === W.companionTarget); return { dmg: e ? e.maxHp - e.hp : -1, aggro: e?.aggroUid === W.companionUnit?.uid || e?.aggroUid === W.hero.uid }; });
  chk(out.fight.dmg > 0, `英雄攻击指定目标（伤害 ${Math.round(out.fight.dmg)}）`);
  await page.screenshot({ path: `${dir}/hj-3-target.png` });
  // 5 自动喝药
  out.pot = await ev(async () => { const W = window.__game.scene.getScene('Battle').world, u = W.companionUnit; W.companion.bag.push({ uid: 9001, item: 'hp_strong', name: '强效金创药', rarity: 'common', stats: {}, req: 0, price: 0, qty: 3 });
    u.hp = Math.round(u.maxHp * 0.3); const h0 = u.hp; await new Promise(r => setTimeout(r, 600)); return { h0, h1: u.hp, left: W.companion.bag.find(b => b.item === 'hp_strong')?.qty ?? 0 }; });
  chk(out.pot.h1 > out.pot.h0 && out.pot.left < 3, `英雄低血自动喝药（${out.pot.h0}→${Math.round(out.pot.h1)}，余 ${out.pot.left}）`);
  // 6 怒气补满：装火龙之心 + 学合击，靠 rageTick 从储量补
  await ev(() => { const W = window.__game.scene.getScene('Battle').world, c = W.companion; c.equip.heart = { uid: 9002, item: 'fire_heart', name: '火龙之心', rarity: 'common', stats: {}, req: 0, price: 0 }; c.heartStore = 30000; c.combo = ['leiting']; c.rage = 90; });
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').world.companion.rage >= 100, { timeout: 15000 });
  out.rage = await ev(() => { const c = window.__game.scene.getScene('Battle').world.companion; return { rage: c.rage, store: c.heartStore }; });
  chk(out.rage.rage >= 100 && out.rage.store < 30000, `怒气补满并扣储量（储量 ${Math.round(out.rage.store)}）`);
  // 7 unleash（G）→ 同目标同范围释放合击
  await ev(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; window.__combo = []; const hd = B.handle.bind(B); B.handle = evs => { for (const v of evs) if (v.type === 'combo') window.__combo.push(v); return hd(evs); }; });
  await page.keyboard.press('g'); await sleep(150); await page.screenshot({ path: `${dir}/hj-4-burst.png` });
  await page.waitForFunction(() => window.__combo.length > 0, { timeout: 8000 }).catch(() => {}); await sleep(250);
  out.combo = await ev(() => { const c = window.__game.scene.getScene('Battle').world.companion; return { n: window.__combo.length, ev: window.__combo[0], rage: c.rage, burst: c.burst }; });
  chk(out.combo.n > 0 && out.combo.ev.amount > 0 && out.combo.rage < 5 && !out.combo.burst, `G 爆发：释放合击「${out.combo.ev?.name}」${out.combo.ev?.amount} 伤害，怒气清空后从火龙之心重新回补（${out.combo.rage.toFixed(1)}）`);
  await page.screenshot({ path: `${dir}/hj-5-combo.png` });
  // 8 召回冷却
  await page.keyboard.press('r'); await sleep(300); await page.keyboard.press('r'); await sleep(300);
  out.recall = await ev(() => { const W = window.__game.scene.getScene('Battle').world; return { out: W.companion.out, cd: Math.round(W.companionCooldown()) }; });
  chk(!out.recall.out && out.recall.cd > 55, `收回后再按 R：冷却中（${out.recall.cd} 秒）`);
  await page.screenshot({ path: `${dir}/hj-6-recall-cd.png` });
  const errs = w.errs.filter(e => !/404|Failed to load/.test(e)); out.errs = errs; chk(errs.length === 0, `无控制台报错（${errs.length}）`);
  await page.close();
  // ===== 阶段 B：六合击各触发一次（含战士英雄）+ 魔龙血域 =====
  const open = async (cls, floorIndex = 2) => {
    const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const ww = watch(p);
    await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), { ...SAVE, cls, level: 55, floorIndex });
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1200);
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'); window.__combo = []; window.__fx = []; const hd = B.handle.bind(B); B.handle = evs => { for (const v of evs) { if (v.type === 'combo') window.__combo.push(v); if (v.type === 'bossfx') window.__fx.push(v.kind); } return hd(evs); }; });
    return { p, ww };
  };
  const combo = async (p, hcls, id) => {
    await p.evaluate((hcls, id) => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; h.hp = h.maxHp = 1e7;
      W.units.filter(u => u.companion).forEach(u => { u.alive = false; }); W.companion = null; W.recruitCompanion(hcls, '英雄');
      const c = W.companion; c.level = 45; c.combo = [id]; c.equip.heart = { uid: 9100, item: 'fire_heart', name: '火龙之心', rarity: 'common', stats: {}, req: 0, price: 0 }; c.heartStore = 30000; c.rage = 100; c.out = true;
      for (const e of W.units.filter(u => u.team === 'enemy' && u.alive)) { e.x = h.x + 2000 + Math.random() * 500; e.ai = 'idle'; }
      const base = W.units.find(u => u.team === 'enemy' && u.alive);
      window.__tg = [180, 300, 420].map(dx => { const e = W.spawn({ ...base, boss: undefined }, 'enemy', h.x + dx, 0); e.hp = e.maxHp = 1e6; e.atk = 0; e.ai = 'chase'; return e.uid; });
      window.__combo = []; }, hcls, id);
    await sleep(300); await p.keyboard.press('g');
    await p.waitForFunction(() => window.__combo.length > 0, { timeout: 10000 }).catch(() => {}); await sleep(200);
    return p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, c = window.__combo[0]; if (!c) return null; const t = W.units.find(u => u.uid === c.target); const T = W.time;
      return { id: c.id, name: c.name, amount: c.amount, hits: c.hits, poison: (t?.poisonUntil ?? 0) > T, stun: (t?.stunUntil ?? 0) > T, vuln: (t?.vulnUntil ?? 0) > T }; });
  };
  const plan = { warrior: [['warrior', 'pohun'], ['mage', 'leiting'], ['taoist', 'pixing']], mage: [['mage', 'huolong'], ['taoist', 'mori']], taoist: [['taoist', 'shihun']] };
  const expect = { pohun: r => r.hits >= 2, huolong: r => r.hits >= 2 && r.vuln, shihun: r => r.hits >= 2 && r.poison, leiting: r => r.hits === 1 && r.vuln, mori: r => r.hits === 1 && r.poison, pixing: r => r.hits === 1 && r.stun && r.vuln };
  out.combos = {};
  for (const [mc, list] of Object.entries(plan)) {
    const { p, ww } = await open(mc);
    for (const [hc, id] of list) {
      const r = await combo(p, hc, id); out.combos[id] = r;
      chk(!!r && r.id === id && r.amount > 0 && expect[id](r), `合击 ${id}（${mc}+${hc}${mc === 'warrior' && hc === 'warrior' ? '，战士英雄' : ''}）：${r?.name} ${r?.amount} 伤害，命中 ${r?.hits}，毒 ${r?.poison} 麻痹 ${r?.stun} 易伤 ${r?.vuln}`);
      await p.screenshot({ path: `${dir}/hj-b-${id}.png` });
    }
    const e2 = ww.errs.filter(e => !/404|Failed to load/.test(e)); chk(e2.length === 0, `${mc} 页无控制台报错（fx_combo_* 走 Graphics 占位）（${e2.length}）${e2.slice(0, 2).join(' | ')}`); await p.close();
  }
  { // 魔龙血域：进入 → 观察瞬移 → 击杀 → 回城不判通关
    const { p, ww } = await open('warrior', 22);
    await p.evaluate(() => window.__game.scene.getScene('Battle').world.loadFloor(23)); await sleep(1500);
    out.molong = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; h.hp = h.maxHp = 1e8; const bb = W.units.find(u => u.id === 'boss_molong');
      for (const e of W.units.filter(u => u.team === 'enemy' && u !== bb)) W.kill(e); h.x = bb.x - 150; bb.ai = 'chase'; window.__bb = bb.uid; return { floor: W.floor.name, boss: bb?.name, hp: bb?.maxHp }; });
    await sleep(1500); await p.screenshot({ path: `${dir}/hj-b-molong-enter.png` });
    await p.waitForFunction(() => { const W = window.__game.scene.getScene('Battle').world, bb = W.units.find(u => u.uid === window.__bb); if (bb?.boss && bb.boss.flyT < 25) bb.boss.flyT = 29; if (bb && Math.abs(bb.x - W.hero.x) > 120) W.hero.x = bb.x - 60; return window.__fx.includes('fly'); }, { timeout: 15000, polling: 100 }).catch(() => {});
    await sleep(300); await p.screenshot({ path: `${dir}/hj-b-molong-blink.png` });
    const fly = await p.evaluate(() => window.__fx.includes('fly'));
    chk(out.molong.boss === '魔龙教主' && out.molong.floor === '魔龙血域' && fly, `进入魔龙血域：${out.molong.boss}（HP ${out.molong.hp}），观察到瞬移 ${fly}`);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; const bb = W.units.find(u => u.uid === window.__bb); W.kill(bb); }); await sleep(1500);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.x = W.exitX; }); await sleep(600); await p.keyboard.press('w'); await sleep(2000);
    out.molongEnd = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return { town: W.town, done: W.done }; });
    chk(out.molongEnd.town === 'mengzhong' && !out.molongEnd.done, `击杀魔龙教主后出口回盟重、不判通关（${JSON.stringify(out.molongEnd)}）`);
    await p.screenshot({ path: `${dir}/hj-b-molong-town.png` });
    const e2 = ww.errs.filter(e => !/404|Failed to load/.test(e)); chk(e2.length === 0, `魔龙血域页无控制台报错（${e2.length}）${e2.slice(0, 2).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.kill?.(); sv.close?.(); }
console.log(JSON.stringify(out)); console.log(fail ? `失败 ${fail}` : '全部通过'); process.exit(fail ? 1 : 0);
