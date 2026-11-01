// 死亡复活回最近城镇 e2e：读档(法师+3 召唤物，野外 4 层)→进比奇城→出城野外→阵亡→3s 后回比奇城；再进盟重土城→出城→阵亡→回盟重；
// 断言 世界 town / HUD 城名与层数 / 召唤物距英雄 ≤100px（世界+卡牌）且等级保留 / 英雄与召唤物在镜头内 / 0 控制台错误；截图
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const summons = [
  { id: 'deer', pet: true, sLv: 3, sKills: 1, base: { hp: 100, atk: 10, start: 1, name: '鹿' }, hpR: 0.6, level: 5, def: 1, mdef: 1 },
  { id: 'summon_beast', sLv: 2, sKills: 0, base: { hp: 800, atk: 60, def: 10, start: 1, name: '神兽' }, hpR: 0.8, level: 30 },
  { id: 'summon_golden_skeleton', sLv: 5, sKills: 4, base: { hp: 600, atk: 50, def: 8, start: 1, name: '金甲骷髅' }, hpR: 1, level: 30 },
];
const reached = Array.from({ length: 83 }, (_, i) => i);
const save = { v: 1, cls: 'mage', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 4, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['fireball'], reached, summons };
const sv = await startPreview(), b = await launch(); const out = {}; let fail = 0; const chk = (c, m) => { out[m] = !!c; if (!c) fail++; };
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: true })); }, save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
  await page.evaluate(() => { window.__txt = re => { const walk = l => { for (const o of l) { if (typeof o.text === 'string' && re.test(o.text)) return o.text; if (o.list) { const r = walk(o.list); if (r) return r; } } }; for (const sc of window.__game.scene.getScenes(true)) { const r = walk(sc.children.list); if (r) return r; } }; });
  const run = (code, arg) => page.evaluate(new Function('arg', 'const B = window.__game.scene.getScene("Battle"), W = B.world; ' + code), arg);
  const stable = async () => { await page.waitForFunction(() => { const c = window.__game.scene.getScene('Battle').cameras.main, h = window.__camH ??= []; h.push(Math.round(c.scrollX)); if (h.length > 4) h.shift(); return !c.fadeEffect.isRunning && h.length === 4 && h.every(x => x === h[0]); }, { polling: 150, timeout: 8000 }); await page.evaluate(() => { window.__camH = null; }); await sleep(500); };
  const cycle = async (town, name) => { const tn = out[name + '_name'];
    out[name + '_in'] = await run('const e = W.enterTown(arg, true); B.handle(W.drainEvents()); return [e, W.town, W.lastTownId];', town);
    chk(out[name + '_in'][1] === town && out[name + '_in'][2] === town, name + ' 进城 ' + town);
    await stable();
    out[name + '_out'] = await run('const e = W.leaveTown(); B.handle(W.drainEvents()); W.units.forEach(u => { if (u.team === "enemy") u.alive = false; }); return [e, W.town, W.floorIndex, W.lastTownId];');
    chk(out[name + '_out'][1] === null && out[name + '_out'][3] === town, name + ' 出城到野外，lastTownId 不变');
    await stable();
    await run('W.kill(W.hero); B.handle(W.drainEvents());');
    out[name + '_dead'] = await run('return [B.state, window.__txt(/秒后在/)];'); chk(out[name + '_dead'][0] === 'dead' && out[name + '_dead'][1]?.includes(tn), name + ' 阵亡提示回城名');
    await page.waitForFunction(t => { const W = window.__game.scene.getScene('Battle').world; return W.hero && W.town === t; }, { timeout: 8000 }, town);
    await stable();
    const m = await run(`const h = W.hero, hv = B.views.get(h.uid), cam = B.cameras.main; const s = W.units.filter(u => u.summon && u.alive && !u.decoy).map(u => { const v = B.views.get(u.uid); return { id: u.id, lv: u.sLv, d: Math.round(Math.abs(u.x - h.x)), vd: v ? Math.round(Math.abs(v.x - (v.dispOff ?? 0) - hv.x + (hv.dispOff ?? 0))) : 1e9, cam: !!v && v.x >= cam.worldView.x && v.x <= cam.worldView.right }; });
      return { town: W.town, floor: W.floorIndex, state: B.state, hp: [h.hp, h.maxHp], heroCam: hv.x >= cam.worldView.x && hv.x <= cam.worldView.right, title: window.__txt(new RegExp('^' + arg + '$')), hud: window.__txt(/第 \\d+\\/\\d+ 层/), s };`, out[name + '_name']);
    out[name] = m;
    chk(m.town === town && m.state === 'play' && m.hp[0] === m.hp[1] && m.heroCam && !!m.title, name + ' 复活回 ' + town + '，满血，HUD 城名可见');
    chk(m.s.length === 3 && m.s.every(x => x.d <= 100 && x.vd <= 100 && x.cam) && m.s.map(x => x.lv).sort().join() === '2,3,5', name + ' 召唤物在英雄身边且等级保留');
    await page.screenshot({ path: `${dir}/respawn-last-town-${name}.png` });
  };
  const names = await page.evaluate(() => { const B = window.__game.scene.getScene('Battle'); return null; });
  out.A_name = '比奇城'; out.B_name = '盟重土城';
  await cycle('bichi', 'A'); await cycle('mengzhong', 'B');
  out.saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fcl_save_v1') || 'null')?.lastTownId ?? Object.values(localStorage).map(v => { try { return JSON.parse(v).lastTownId; } catch { return undefined; } }).find(Boolean));
  out.errs = w.errs; chk(!(out.errs.length), '0 控制台错误');
} catch (e) { out.err = String(e); fail++; }
await b.close(); sv.close?.();
console.log(JSON.stringify(out)); console.log(fail ? 'respawn-last-town FAIL' : 'respawn-last-town OK'); process.exit(fail ? 1 : 0);
