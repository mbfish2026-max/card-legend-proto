// 新书接入 + 取消冷却：书店真实点击购买地狱火 → 背包点击学习 → 技能面板/快捷栏出现；连续施放受公共间隔约束
// 用法：npm run build && node tests/e2e/books-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'mage', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['fireball', 'thunder'] };
const sv = await startPreview(), b = await launch(); let out = {};
const click = async (page, re, dy = 0) => { const p = await findPos(page, 'UI', re); if (!p) throw new Error('找不到 ' + re); await page.mouse.click(p.x, p.y + dy); await sleep(500); };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  const W = () => page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { gold: w.gold, bag: w.bag.map(i => i?.item), learned: [...w.learned], hot: w.skills.map(s => s.key + ':' + s.id) }; });
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('shop')); await sleep(600);
  await click(page, '^▶?书店$'); await page.screenshot({ path: `${dir}/books-1-shop.png` });
  const before = await W();
  // 购买按钮与书名同行：名字在行中心上方 20px，按钮在行中心 x=448
  const pos = await page.evaluate(() => { const s = window.__game.scene.getScene('UI'); let n = null, btns = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) { if (o.text.startsWith('地狱火')) n = o.getBounds(); if (o.text === '购买') btns.push(o.getBounds()); } if (o.list) walk(o.list); }); walk(s.children.list);
    const bt = btns.sort((a, c) => Math.abs(a.centerY - n.centerY - 20) - Math.abs(c.centerY - n.centerY - 20))[0], cv = window.__game.canvas.getBoundingClientRect();
    return { x: cv.left + bt.centerX * cv.width / 1280, y: cv.top + bt.centerY * cv.height / 720 }; });
  await page.mouse.click(pos.x, pos.y); await sleep(600);
  const bought = await W(); await page.screenshot({ path: `${dir}/books-2-bought.png` });
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('bag')); await sleep(600);
  const i = bought.bag.indexOf('book_hell_fire');
  const learnMsg = await page.evaluate(i => window.__game.scene.getScene('Battle').world.learnBook(i), i); await sleep(400); // 背包格点击 = learnBook(i)
  const learned = await W();
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(800);
  await page.screenshot({ path: `${dir}/books-3-skills.png` });
  const panelHas = !!(await findPos(page, 'UI', '地狱火'));
  await page.evaluate(() => window.__game.scene.getScene('Battle').closePanel?.()); await page.keyboard.press('Escape'); await sleep(400);
  // 连续施放：同帧按两键只放出一个；0.8s 后可再放同一技能
  const spam = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp = 9999; B.cds = B.cds.map(() => 0);
    const k1 = W.skills.find(s => s.id === 'hell_fire').key, k2 = W.skills.find(s => s.id === 'fireball').key; const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) h.x = e.x - 150; const mp0 = h.mp; B.onKey(k1); B.onKey(k2); B.onKey(k1);
    return { paused: B.paused, state: B.state, enemy: !!e, k1, k2, spentSameFrame: mp0 - h.mp, cds: B.cds.map(c => +c.toFixed(2)) }; });
  const near = () => page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero, e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) h.x = e.x - 150; h.mp = 9999; return !!e; });
  await near();
  // 连按 3 秒（每帧按 F3）+ 游戏自身自动施放：统计实际施放次数，应 ≤ 3/0.8+1 ≈ 4
  const spam3 = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; let n = 0, prev = Math.max(...B.cds); const t0 = performance.now(), k = W.skills.find(s => s.id === 'hell_fire').key;
    while (performance.now() - t0 < 3000) { const e = W.units.find(u => u.team === 'enemy' && u.alive); if (e) h.x = e.x - 150; h.mp = 9999; h.hp = h.maxHp; B.onKey(k); const m = Math.max(...B.cds); if (m > prev + 0.3) n++; prev = m; await new Promise(r => setTimeout(r, 16)); }
    return { castsIn3s: n }; });
  await page.screenshot({ path: `${dir}/books-4-cast.png` });
  out = { goldBefore: before.gold, goldAfter: bought.gold, bagHasBook: i >= 0, learnMsg, learned: learned.learned, hotbar: learned.hot, panelHas, spam, spam3, errs: w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8) };
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
