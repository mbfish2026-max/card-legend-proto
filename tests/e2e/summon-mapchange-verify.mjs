// 换图 e2e：法师带召唤物（诱惑宠物鹿 3 级 + 神兽 2 级 + 金甲骷髅 5 级），走真实按键「S 返回上一层」、下一层、回城、出城；
// 断言每次换图后召唤物（World 坐标与卡牌显示坐标）距英雄 ≤100px、等级不丢；0 控制台错误；截图
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const summons = [
  { id: 'deer', pet: true, sLv: 3, sKills: 1, base: { hp: 100, atk: 10, start: 1, name: '鹿' }, hpR: 0.6, level: 5, def: 1, mdef: 1 },
  { id: 'summon_beast', sLv: 2, sKills: 0, base: { hp: 800, atk: 60, def: 10, start: 1, name: '神兽' }, hpR: 0.8, level: 30 },
  { id: 'summon_golden_skeleton', sLv: 5, sKills: 4, base: { hp: 600, atk: 50, def: 8, start: 1, name: '金甲骷髅' }, hpR: 1, level: 30 },
];
const save = { v: 1, cls: 'mage', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 4, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['fireball'], reached: [0, 1, 2, 3, 4], summons };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const chk = (c, m) => { out[m] = !!c; if (!c) fail++; };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: true })); }, save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  // 在场景处理完 floor/town 事件的同一帧采样（之后召唤物会按 AI 去追新层的怪，属正常）
  await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world;
    const meas = () => { const h = W.hero, hv = B.views.get(h.uid); return { floor: W.floorIndex, town: W.town, s: W.units.filter(u => u.summon && u.alive && !u.decoy).map(u => ({ id: u.id, lv: u.sLv, d: Math.round(Math.abs(u.x - h.x)), vd: Math.round(Math.abs((B.views.get(u.uid)?.x ?? 1e9) - (B.views.get(u.uid)?.dispOff ?? 0) - hv.x + (hv.dispOff ?? 0))) /* 卡牌显示坐标，扣除排队错位 dispOff */ })) }; };
    window.__meas = meas; for (const k of ['enterFloor', 'buildStreet']) { const o = B[k].bind(B); B[k] = (...a) => { const r = o(...a); window.__mc = meas(); return r; }; } });
  const meas = () => page.evaluate(() => window.__mc ?? window.__meas());
  const test = async (name, fn, until) => { const f0 = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; return W.floorIndex + '|' + W.town; }); await page.evaluate(() => { window.__mc = null; }); await page.evaluate(fn); await page.waitForFunction(f0 => { const W = window.__game.scene.getScene('Battle').world; return W.floorIndex + '|' + W.town !== f0; }, { timeout: 5000 }, f0); await page.waitForFunction(() => window.__mc, { timeout: 5000 }); const m = await meas(); await page.evaluate(() => { window.__mc = null; }); out[name + '_m'] = m;
    chk(m.s.length === 3 && m.s.every(x => x.d <= 100 && x.vd <= 100) && m.s.map(x => x.lv).sort().join() === '2,3,5', name); await page.screenshot({ path: `${dir}/summon-mapchange-${name}.png` }); };
  const prep = 'const B = window.__game.scene.getScene("Battle"), W = B.world; W.units.forEach(u => { if (u.team === "enemy") u.alive = false; }); W.units.filter(u => u.summon).forEach(u => u.x = W.hero.x + 1500);';
  out.start = await meas(); chk(out.start.s.length === 3, '读档后 3 只召唤物');
  await test('prev', new Function(prep + 'W.hero.x = 200; B.onKey("S");')); chk(out.prev_m.floor === 3 && !out.prev_m.town, 'S 回到上一层野外(3)');
  await test('next', new Function(prep + 'W.loadFloor(5); B.handle(W.drainEvents());'));
  await test('town', new Function(prep + 'W.enterTown("bichi", true); B.handle(W.drainEvents());'));
  await test('leave', new Function(prep + 'W.leaveTown(); B.handle(W.drainEvents());'));
  out.errs = w.errs; chk(!(out.errs.length), '0 控制台错误');
} catch (e) { out.err = String(e); fail++; }
await b.close(); sv.close?.();
console.log(JSON.stringify(out)); console.log(fail ? 'summon-mapchange FAIL' : 'summon-mapchange OK'); process.exit(fail ? 1 : 0);
