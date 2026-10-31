// 合击持续特效浏览器验证：噬魂沼泽 10s / 末日审判 8s 循环段持续 → 结束消失；劈星斩 3s 麻痹标记显示 → 清除；BOSS 不显示
// 用法：npm run build && node tests/e2e/hj-fx-loop-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const SAVE = { v: 1, level: 55, exp: 0, gold: 5000, pots: [5, 5, 5, 5], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [] };
const sv = await startPreview(), b = await launch(); let fail = 0;
const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const open = async cls => {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const ww = watch(p);
  await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), { ...SAVE, cls });
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle')?.hud, { timeout: 30000 }); await sleep(1200);
  await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'); window.__combo = []; const hd = B.handle.bind(B); B.handle = evs => { for (const v of evs) if (v.type === 'combo') window.__combo.push(v); return hd(evs); }; });
  return { p, ww };
};
const state = (p, id) => p.evaluate(id => { const B = window.__game.scene.getScene('Battle'), W = B.world, c = window.__combo[0];
  const objs = B.children.list.filter(o => o.name === 'comboStatus_' + id), t = W.units.find(u => u.uid === c?.target);
  return { dt: c ? +(W.time - c.__t0).toFixed(2) : -1, objs: objs.length, vis: objs.filter(o => o.visible && o.alpha > 0.1).length, sprite: objs.some(o => o.type === 'Sprite'), text: objs.find(o => o.type === 'Text')?.text, entries: B.comboStatus.size,
    poison: (t?.poisonUntil ?? 0) > W.time, stun: (t?.stunUntil ?? 0) > W.time, alive: !!t?.alive, total: B.children.list.length }; }, id);
const fire = async (p, hcls, id, boss = false) => {
  await p.evaluate((hcls, id, boss) => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; h.hp = h.maxHp = 1e7;
    W.units.filter(u => u.companion).forEach(u => { u.alive = false; }); W.companion = null; W.recruitCompanion(hcls, '英雄');
    const c = W.companion; c.level = 45; c.combo = [id]; c.equip.heart = { uid: 9100, item: 'fire_heart', name: '火龙之心', rarity: 'common', stats: {}, req: 0, price: 0 }; c.heartStore = 30000; c.rage = 100; c.out = true;
    for (const e of W.units.filter(u => u.team === 'enemy' && u.alive)) { e.x = h.x + 2500 + Math.random() * 500; e.ai = 'idle'; }
    const base = W.units.find(u => u.team === 'enemy' && u.alive);
    [180, 300].forEach((dx, i) => { const e = W.spawn({ ...base, ...(boss && i === 0 ? { tier: 'boss' } : {}), boss: undefined }, 'enemy', h.x + dx, 0); e.hp = e.maxHp = 1e8; e.atk = 0; e.ai = 'chase'; W.events.push({ type: 'summon', uid: e.uid }); }); // 走 summon 事件建卡片视图（与号角召怪同一路径）
    window.__combo = []; }, hcls, id, boss);
  await sleep(300); await p.keyboard.press('g');
  await p.waitForFunction(() => window.__combo.length > 0, { timeout: 10000 }).catch(() => {});
  return p.evaluate(() => { const c = window.__combo[0]; if (c) c.__t0 = c.statusUntil !== undefined ? c.statusUntil - ({ shihun: 10, mori: 8, pixing: 3 })[c.id] : window.__game.scene.getScene("Battle").world.time; /* 以合击释放时刻为 0 */ return c && { id: c.id, affected: c.affected, until: c.statusUntil }; });
};
const waitT = (p, t) => p.waitForFunction(t => { const c = window.__combo[0]; return c && window.__game.scene.getScene('Battle').world.time - c.__t0 >= t; }, { timeout: 30000, polling: 50 }, t);
const plan = [['taoist', 'taoist', 'shihun', 10, [1, 4, 7, 9.5], 'poison'], ['mage', 'taoist', 'mori', 8, [1, 3.5, 6, 7.5], 'poison'], ['warrior', 'taoist', 'pixing', 3, [0.3, 1.5, 2.6], 'stun']];
for (const [mc, hc, id, dur, at, f] of plan) {
  const { p, ww } = await open(mc);
  await p.waitForFunction(id => window.__game.scene.getScene('Battle').textures.exists('fx_combo_' + id), { timeout: 30000 }, id).catch(() => {});
  const ev = await fire(p, hc, id); chk(!!ev && ev.id === id && ev.affected?.length > 0, `${id} 释放：affected ${ev?.affected?.length}`);
  let n0 = 0;
  for (const t of at) { await waitT(p, t); const s = await state(p, id); await p.screenshot({ path: `${dir}/fxloop-${id}-${t}s.png` }); if (!n0) n0 = s.total;
    chk(s.objs > 0 && s.vis > 0 && s.sprite && s[f], `${id} @${s.dt}s：持续特效在场（对象 ${s.objs}，可见 ${s.vis}，${f} ${s[f]}${s.text ? '，标记「' + s.text + '」' : ''}）`); }
  await waitT(p, dur + 0.4); const e = await state(p, id); await p.screenshot({ path: `${dir}/fxloop-${id}-end.png` });
  chk(e.objs === 0 && e.entries === 0 && !e[f] && e.alive, `${id} @${e.dt}s：状态结束，特效已清除（对象 ${e.objs}，句柄 ${e.entries}）`);
  if (id === 'mori') { // 目标死亡立即清理
    await fire(p, hc, id); await waitT(p, 1); const a = await state(p, id);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.kill(W.units.find(u => u.uid === window.__combo[0].target)); }); await sleep(300); const d = await state(p, id);
    await p.screenshot({ path: `${dir}/fxloop-mori-kill.png` }); chk(a.objs > 0 && d.objs === 0 && d.entries === 0, `mori 目标死亡：循环特效立即清除（${a.objs}→${d.objs}）`);
  }
  if (id === 'pixing') { // BOSS 免疫麻痹 → 不显示
    const be = await fire(p, hc, id, true); await waitT(p, 0.5); const s = await state(p, id); await p.screenshot({ path: `${dir}/fxloop-pixing-boss.png` });
    chk(!!be && !be.affected.length && s.objs === 0 && !s.stun, `pixing 打 BOSS：免疫麻痹，无麻痹标记（对象 ${s.objs}）`);
  }
  const errs = ww.errs.filter(x => !/404|Failed to load/.test(x)); chk(errs.length === 0, `${id} 页 0 控制台报错（${errs.length}）${errs.slice(0, 2).join(' | ')}`); await p.close();
}
await b.close(); sv.close?.(); sv.kill?.();
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
