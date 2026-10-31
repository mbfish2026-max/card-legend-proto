// 手机入口全覆盖：每种入口只用触屏（点「进入」大键 / 点入口本体 / 点顶栏「传送」）触发，并确认真的到达目标
// 用法：npm run build && node tests/e2e/mobile-entrance-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/shared-mobile/shots';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const SAVE = { v: 1, level: 30, exp: 0, gold: 50000, pots: [5, 2, 5, 2], floorIndex: 3, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], cls: 'warrior', learned: [] };
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const ww = watch(p);
await p.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), SAVE);
// 场景准备（仅摆位置/清怪，不直接调用入口函数）
const W = fn => p.evaluate(fn);
const setup = (f, where, killBoss = true) => p.evaluate((f, where, kb) => { const B = window.__game.scene.getScene('Battle'), w = B.world;
  [0, 1, 2, 3, 4, 13, 32, 56].forEach(i => w.reached.add(i)); w.teleportReadyAt = 0;
  if (f === 'town') { w.town = null; w.enterTown('bichi', true); } else { w.town = null; w.loadFloor(f); }
  w.units.filter(u => !u.isHero && !u.summon && (kb || u.tier !== 'boss')).forEach(u => { u.hp = 0; u.dead = true; }); w.units = w.units.filter(u => u.isHero || u.summon || u.hp > 0);
  const h = w.hero; w.stepTarget = null; h.x = where === 'exit' ? w.exitX : where === 'start' ? 220 : where === 'gate' ? 0 : h.x;
  if (where === 'tele') for (let x = 0; x < 8000; x += 10) { h.x = x; if (w.nearDoor()?.npc.kind === 'teleport') break; }
}, f, where, killBoss);
const st = () => W(() => { const w = window.__game.scene.getScene('Battle').world; return { f: w.floorIndex, town: w.town, act: document.getElementById('mh-act')?.textContent, hot: document.getElementById('mh-act')?.classList.contains('hot') }; });
const tapSel = async sel => { const r = await p.$eval(sel, e => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await p.touchscreen.tap(r.x, r.y); };
const tapAct = () => tapSel('#mh-act');
const until = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn(await st())) return true; await sleep(150); } return false; };
const shot = n => p.screenshot({ path: `${dir}/me-${n}.png` });
// UI 场景文字 → 屏幕坐标（按相机 worldView 换算）；dy=逻辑像素偏移（点文字上方的圆形节点）
const uiFind = (src, dy = 0, all = false) => p.evaluate((src, dy, all) => { const S = window.__game.scene.getScene('UI'), re = new RegExp(src), out = [];
  const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible && re.test(o.text)) out.push(o); if (o.list) walk(o.list); }); walk(S.children.list);
  const wv = S.cameras.main.worldView, cv = window.__game.canvas.getBoundingClientRect();
  const m = out.map(o => { const bb = o.getBounds(); return { t: o.text, x: cv.left + (bb.centerX - wv.x) * cv.width / wv.width, y: cv.top + (bb.centerY + dy - wv.y) * cv.height / wv.height }; });
  return all ? m : m[0] ?? null; }, src, dy, all);
try {
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1200);
  const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && document.getElementById('mh-act'), { timeout: 30000 }); await sleep(1500);

  // 1 右端出口（进入键）
  await setup(3, 'exit'); await sleep(400); let s = await st(); await shot('1-exit');
  chk(s.act === '进入' && s.hot, `出口：键显示「${s.act}」高亮=${s.hot}`); await tapAct(); chk(await until(s => s.f === 4), '出口：点「进入」→ 第5层');
  // 2 右端出口（点传送门本体）
  await setup(3, 'exit'); await sleep(2000); // 等相机跟上
  const pp = await W(() => { const B = window.__game.scene.getScene('Battle'), c = B.portal, wv = B.cameras.main.worldView, cv = window.__game.canvas.getBoundingClientRect();
    return { x: cv.left + (c.x - wv.x) * cv.width / wv.width, y: cv.top + (c.y - wv.y) * cv.height / wv.height }; });
  await p.touchscreen.tap(pp.x, pp.y); chk(await until(s => s.f === 4), `出口：点传送门本体 (${pp.x.toFixed(0)},${pp.y.toFixed(0)}) → 第5层`);
  // 3 BOSS 门：首领在 → 封印；击杀后可进
  await setup(3, 'exit', false); await sleep(400); s = await st(); await shot('3-sealed');
  chk(s.act === '封印' && !s.hot, `BOSS 门：首领在时显示「${s.act}」`); await tapAct(); await sleep(800); chk((await st()).f === 3, 'BOSS 门：首领在时点击不进入');
  await W(() => { const w = window.__game.scene.getScene('Battle').world; w.units.filter(u => u.tier === 'boss').forEach(u => { u.hp = 0; u.dead = true; }); w.units = w.units.filter(u => u.hp > 0); });
  await sleep(300); await tapAct(); chk(await until(s => s.f === 4), 'BOSS 门：击杀首领后点「进入」→ 第5层');
  // 4 返回上一层（第5层起点）
  await setup(4, 'start'); await sleep(400); s = await st(); await shot('4-prev');
  chk(s.act === '上一层' && s.hot, `上一层：键显示「${s.act}」`); await tapAct(); chk(await until(s => s.f === 3), '上一层：点击 → 第4层');
  // 5 区域首层起点回城（进入键）
  await setup(3, 'start'); await sleep(400); s = await st(); chk(s.act === '回城' && s.hot, `回城口：键显示「${s.act}」`);
  await tapAct(); chk(await until(s => !!s.town), '回城口：点「回城」→ 进城');
  // 6 城门出城
  await setup('town', 'gate'); await sleep(400); s = await st(); await shot('6-gate'); chk(s.act === '出城' && s.hot, `城门：键显示「${s.act}」`);
  await tapAct(); chk(await until(s => !s.town), '城门：点「出城」→ 野外');
  // 7 城内传送员 NPC → 传送
  await setup('town', 'tele'); await sleep(400); s = await st(); chk(s.act === '对话' && s.hot, `传送员：键显示「${s.act}」`);
  await tapAct(); await sleep(700); await shot('7-tele-npc');
  const tb = await uiFind('^传送$');
  chk(!!tb, '传送员：面板出现「传送」按钮'); if (tb) { await p.touchscreen.tap(tb.x, tb.y); chk(await until(s => !s.town), '传送员：点「传送」→ 出城到目标层'); }
  // 8 顶栏「传送」→ 地图面板 → 点入口（侧线/裂隙层 24）
  await setup(3, 'start'); await sleep(300);
  const lab = await p.$eval('[data-id="map"]', e => e.textContent).catch(() => null);
  await tapSel('[data-id="map"]'); await sleep(700); await shot('8-map');
  chk(/传送/.test(lab ?? ''), `顶栏有「传送」入口（${lab}）`);
  const rg = await uiFind('^毒蛇山谷$', -40);
  chk(!!rg, '地图：世界图有区域可点'); if (rg) { await p.touchscreen.tap(rg.x, rg.y); await sleep(700); await shot('8-region'); }
  const nd = (await uiFind('^第\\d+层', -50, true)).filter(n => !/当前|未到达/.test(n.t));
  chk(nd.length > 0, `地图：可传送入口 ${nd.map(n => n.t).join(' ')}`);
  if (nd[0]) { const f0 = (await st()).f; await p.touchscreen.tap(nd[0].x, nd[0].y); chk(await until(s => s.f !== f0 && s.f === Number(nd[0].t.match(/\d+/)[0]) - 1), `地图：点「${nd[0].t}」→ 传送到达`); }
  // 9 侧线/裂隙层出口：清场后右端 → 回城
  await setup(32, 'exit'); await sleep(400); await tapAct(); chk(await until(s => !!s.town || s.f !== 32), '侧线层：点「进入」→ 离开侧线（回城）');
  chk(ww.errs.length === 0, `无 JS 错误 ${ww.errs.slice(0, 2).join(' | ')}`);
} finally { await b.close(); sv.stop?.(); sv.kill?.(); }
console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
