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
} finally { await b.close(); sv.kill?.(); sv.close?.(); }
console.log(JSON.stringify(out)); console.log(fail ? `失败 ${fail}` : '全部通过'); process.exit(fail ? 1 : 0);
