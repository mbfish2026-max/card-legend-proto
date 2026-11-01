// 灵符商城·战斗侧（feat/lingfu-combat）真实浏览器：血石自动补给+飘字+储量递减 / 技巧项链 ×5 / 直升卷轴（背包点击）召唤物 7 级 / 回城石（背包点击）战斗中可用+冷却
// 用法：npm run build && node tests/e2e/lingfu-combat-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/lingfu-combat'; mkdirSync(dir, { recursive: true });
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const it = (uid, item, name, extra = {}) => ({ uid, item, name, rarity: 'common', stats: {}, req: 1, price: 0, bound: true, ...extra });
const save = { v: 1, cls: 'taoist', level: 45, exp: 0, gold: 99999, pots: [0, 0, 0, 0], floorIndex: 3, kills: 0, nextUid: 200, mapV: 3, eqV: 2, expV: 2,
  equip: { stone: it(1, 'stone_s', '血石（小）', { slot: 'stone', req: 30, charge: { hp: 20000, mp: 20000 } }), necklace: it(2, 'skill_necklace', '技巧项链', { slot: 'necklace' }) },
  bag: [it(3, 'summon_lv7_scroll', '召唤直升卷轴'), it(4, 'return_stone', '回城石', { uses: 10 })], learned: [] };
const W = p => p.evaluate(f => eval(f), '');
// 点击背包里某物品图标（桌面鼠标左键）
async function clickBagItem(p, item) {
  const pos = await p.evaluate(id => { const s = window.__game.scene.getScene('UI'); let hit = null;
    const walk = l => l.forEach(o => { if (!hit && o.type === 'Image' && o.visible && o.texture?.key === 'item_' + id) hit = o; if (o.list) walk(o.list); }); walk(s.children.list); if (!hit) return null;
    const b = hit.getBounds(), cv = window.__game.canvas.getBoundingClientRect(), wv = s.cameras.main.worldView;
    return { x: cv.left + (b.centerX - wv.x) * cv.width / wv.width, y: cv.top + (b.centerY - wv.y) * cv.height / wv.height }; }, item);
  if (!pos) return false; await p.mouse.click(pos.x, pos.y); await sleep(500); return true;
}
try {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const w = watch(p);
  await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  const G = 'window.__game.scene.getScene("Battle").world';
  // 1) 血石：压低 HP/MP → 自动补给，储量递减，飘字
  await p.evaluate(G0 => { const w = eval(G0); const h = w.hero; h.hp = Math.floor(h.maxHp * 0.3); h.mp = 0; }, G);
  await sleep(150);
  const st = await p.evaluate(G0 => { const w = eval(G0), h = w.hero, B = window.__game.scene.getScene('Battle'); const fl = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible && /血石 \+/.test(o.text)) fl.push(o.text); if (o.list) walk(o.list); }); walk(B.children.list);
    return { c: { ...w.equip.stone.charge }, hp: h.hp / h.maxHp, mp: h.mp / h.maxMp, fl }; }, G);
  await p.screenshot({ path: `${dir}/stone-float.png` });
  chk(st.c.hp < 20000 && st.c.mp < 20000, `血石储量递减 HP ${st.c.hp} MP ${st.c.mp}`);
  chk(st.hp > 0.3 && st.mp > 0, `HP/MP 被补（HP ${(st.hp * 100).toFixed(0)}% MP ${(st.mp * 100).toFixed(0)}%）`);
  chk(st.fl.length >= 2, `飘字 ${JSON.stringify(st.fl)}`);
  // 存档里储量同步
  const saved = await p.evaluate(G0 => { window.__game.scene.getScene('Battle').saveGame?.(); const s = JSON.parse(localStorage.getItem('fcl_save_v1') || '{}'); return s.equip?.stone?.charge ?? (s.slots ? null : null); }, G);
  chk(!saved || saved.hp < 20000, `存档储量 ${JSON.stringify(saved)}`);
  // 2) 技巧项链 ×5
  const tr = await p.evaluate(G0 => { const w = eval(G0), s = w.skillPool[0]; w.skillTrain[s.id] = 0; w.addTrain(s, 10); return w.skillTrain[s.id]; }, G);
  chk(tr === 50, `技巧项链：addTrain(10) → ${tr}`);
  // 3) 召唤骷髅 → 背包点直升卷轴 → 7 级
  await p.evaluate(G0 => { const w = eval(G0); w.hero.mp = w.hero.maxMp = 99999; w.learned.add('summon_skeleton'); w.skillTrain.summon_skeleton = 99999; window.__game.scene.getScene('Battle').skillsDirty = true; w.cast(w.skills.findIndex(s => s.id === 'summon_skeleton'), w.skills.map(() => 0)); }, G);
  await sleep(800);
  const lv0 = await p.evaluate(G0 => eval(G0).summons.map(u => u.sLv), G); chk(lv0.length === 1 && lv0[0] < 7, `召唤骷髅 ${lv0}`);
  await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(600);
  chk(await clickBagItem(p, 'summon_lv7_scroll'), '背包点击直升卷轴');
  await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(700);
  const lv1 = await p.evaluate(G0 => ({ lv: eval(G0).summons.map(u => [u.sLv, u.name]), boost: eval(G0).summonBoostLv, bag: eval(G0).bag.map(x => x.item) }), G);
  await p.screenshot({ path: `${dir}/summon-lv7.png` });
  chk(lv1.lv.length === 1 && lv1.lv[0][0] === 7 && lv1.boost === 7 && !lv1.bag.includes('summon_lv7_scroll'), `召唤物 7 级 ${JSON.stringify(lv1)}`);
  // 4) 回城石：拉怪进入战斗 → 背包点击 → 回城；出城后冷却中不可用
  await p.evaluate(G0 => { const w = eval(G0); w.loadFloor(3); }, G); await sleep(800);
  const inC = await p.evaluate(G0 => { const w = eval(G0), h = w.hero; const e = w.units.find(u => u.team === 'enemy' && u.alive); e.ai = 'chase'; e.x = h.x + 60; return w.inCombat(); }, G);
  chk(inC, '进入战斗');
  await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(600);
  chk(await clickBagItem(p, 'return_stone'), '背包点击回城石'); await sleep(900);
  const rt = await p.evaluate(G0 => { const w = eval(G0), h = w.hero; return { town: w.town, d: w.summons.map(u => Math.round(Math.abs(u.x - h.x))), uses: w.bag.find(x => x.item === 'return_stone')?.uses }; }, G);
  await p.screenshot({ path: `${dir}/return-town.png` });
  chk(!!rt.town && rt.uses === 9 && rt.d.length === 1 && rt.d[0] <= 100, `战斗中回城 ${JSON.stringify(rt)}`);
  await p.evaluate(G0 => { const w = eval(G0); w.leaveTown(3); }, G); await sleep(800);
  await p.evaluate(() => { const u = window.__game.scene.getScene('UI').panel; if (u.mode !== 'bag') u.toggle('bag'); }); await sleep(600);
  await clickBagItem(p, 'return_stone'); await sleep(600);
  const cd = await p.evaluate(G0 => { const w = eval(G0); return { town: w.town, uses: w.bag.find(x => x.item === 'return_stone')?.uses }; }, G);
  await p.screenshot({ path: `${dir}/return-cd.png` });
  chk(!cd.town && cd.uses === 9, `冷却中不可用 ${JSON.stringify(cd)}`);
  chk(w.errs.length === 0, `console 错误 ${w.errs.length} ${w.errs.slice(0, 3).join(' | ')}`);
} catch (e) { console.error(e); fail++; } finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
