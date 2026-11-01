// feat/ground-aura-ally：道士神圣战甲术/幽灵盾 → 主角 + 召唤物 + 合击英雄同屏各一个脚下光环
// 用法：npm run build && node tests/e2e/ground-aura-ally-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/ground-aura-ally-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const VPS = [{ tag: 'desk', w: 1280, h: 720, mobile: false }, { tag: 'mobile', w: 844, h: 390, mobile: true }];
const SKILLS = ['holy_armor', 'ghost_shield'];
const sv = await startPreview(), b = await launch();
// 每个友方单位：视图脚底、depth，及其 aura 精灵
const SAMPLE = `(() => { const B = window.__game.scene.getScene('Battle'), W = B.world;
  const allies = W.units.filter(u => u.alive && (u === W.hero || u.summon || u.companion));
  const sps = B.children.list.filter(o => /^aura:/.test(o.name) && o.active);
  return { t: W.time, n: sps.length, allies: allies.map(u => { const v = B.views.get(u.uid), o = sps.filter(s => s.getData('uid') === u.uid);
    return { uid: u.uid, kind: u === W.hero ? 'hero' : u.companion ? 'companion' : 'summon', vx: v?.cx, vy: v?.y, vd: v?.depth, cnt: o.length, a: o[0] ? { n: o[0].name, x: o[0].x, y: o[0].y, d: o[0].depth, r: o[0].rotation, sx: o[0].scaleX, sy: o[0].scaleY } : null }; }) }; })()`;
try {
  for (const vp of VPS.filter(v => !process.env.VP || v.tag === process.env.VP)) for (const id of SKILLS.filter(k => !process.env.ONLY || k === process.env.ONLY)) {
    const L = `${vp.tag} ${id}`;
    const save = { v: 1, cls: 'taoist', level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); if (vp.mobile) await p.setUserAgent(UA);
    await p.setViewport({ width: vp.w, height: vp.h, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: ['warrior', 'mage', 'taoist'], autoAttack: false })); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (vp.mobile) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 });
    await p.waitForFunction(k => ['start', 'loop', 'end'].every(ph => window.__game.scene.getScene('Battle').textures.exists(`fx_aura_${k}_${ph}`)), { timeout: 60000 }, id);
    await sleep(800);
    // 准备：学会技能、满蓝、怪挪远；召唤骷髅 + 领取合击英雄（道士）
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; for (const s of W.skillPool) { W.learned.add(s.id); W.skillTrain[s.id] = 99999; }
      h.mp = h.maxMp = 99999; h.defUpUntil = h.mdefUpUntil = 0; for (const u of W.units) if (u.team === 'enemy') { u.x = h.x + 5000; u.ai = 'idle'; }
      B.cds = W.skills.map(() => 0); W.cast(W.skills.findIndex(s => s.id === 'summon_skeleton'), B.cds); W.recruitCompanion('taoist', '英雄'); B.handle(W.drainEvents()); });
    await p.waitForFunction(() => { const W = window.__game.scene.getScene('Battle').world; return W.companionUnit && W.units.some(u => u.summon && u.alive); }, { timeout: 10000 }).catch(() => {});
    const place = () => p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; const wv = B.cameras.main.worldView; if (h.x - 300 < wv.x) h.x = wv.x + wv.width * 0.45; for (const u of W.units) if (u.team === 'enemy') { u.x = h.x + 5000; u.ai = 'idle'; } const s = W.units.find(u => u.summon && u.alive), c = W.companionUnit; if (s) s.x = h.x + 260; if (c) c.x = h.x - 260; return !!s && !!c; });
    chk(await place(), `${L} 场上有召唤物 + 合击英雄`);
    await sleep(500); await place(); await sleep(300);
    const cast = () => p.evaluate(k => { const B = window.__game.scene.getScene('Battle'), W = B.world, i = W.skills.findIndex(s => s.id === k); B.cds = W.skills.map(() => 0); W.hero.mp = 99999; const r = W.cast(i, B.cds); const ev = W.drainEvents(); if (r.ok) B.skillFx(r.skill, B.views.get(W.hero.uid), r.targets, ev); B.handle(ev); return r.ok ? r.targets.length : r.reason; }, id);
    const n = await cast(); chk(n >= 3, `${L} 施放命中 ${n} 名友方`);
    await sleep(900); const s1 = await p.evaluate(SAMPLE);
    for (const k of ['hero', 'summon', 'companion']) {
      const u = s1.allies.find(x => x.kind === k), a = u?.a;
      chk(u && u.cnt === 1 && a.n === `aura:${id}:loop`, `${L} ${k} 一个 loop 光环（${u?.cnt}）`);
      chk(a && a.d === 9 && a.d < u.vd, `${L} ${k} depth ${a?.d} < 单位 ${u?.vd?.toFixed(2)}`);
      chk(a && Math.abs(a.x - u.vx) < 1 && Math.abs(a.y - u.vy) < 1, `${L} ${k} 位于脚底`);
      chk(a && a.r === 0 && a.sx === a.sy && a.sx >= 0.8 && a.sx <= 1.2, `${L} ${k} 无旋转、等比缩放 ${a?.sx}`);
    }
    for (let k = 0; k < 25; k++) { await place(); await sleep(40); } // 截图前钉住站位（召唤物/英雄 AI 会回到主角身边）
    await p.screenshot({ path: `${dir}/${vp.tag}-${id}-allies.png` });
    // 跟随：三者移动后仍贴脚底，旋转恒 0
    let maxd = 0, rot = true; for (let k = 0; k < 8; k++) { await sleep(90); const s = await p.evaluate(SAMPLE); for (const u of s.allies) if (u.a) { maxd = Math.max(maxd, Math.abs(u.a.x - u.vx) + Math.abs(u.a.y - u.vy)); rot = rot && u.a.r === 0; } }
    chk(maxd < 1 && rot, `${L} 跟随（最大偏差 ${maxd.toFixed(2)}）且旋转恒 0`);
    // 重复施放：全员已有 → 拒绝；光环不叠加
    const r2 = await cast(); await sleep(300); const s2 = await p.evaluate(SAMPLE);
    chk(typeof r2 === 'string' && s2.allies.every(u => u.cnt <= 1), `${L} 全员已生效再施放被拒（${r2}），每单位 ≤1 光环`);
    // 换图：三者未过期 → 新图重新显示
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.loadFloor(W.floorIndex + 1); B.handle(W.drainEvents()); });
    await sleep(400); await place(); await sleep(1300); const s3 = await p.evaluate(SAMPLE);
    const kinds = s3.allies.filter(u => u.cnt === 1 && u.a?.n === `aura:${id}:loop`).map(u => u.kind);
    chk(['hero', 'summon', 'companion'].every(k => kinds.includes(k)), `${L} 换图后三者光环重现（${kinds}）`);
    await p.screenshot({ path: `${dir}/${vp.tag}-${id}-after-floor.png` });
    // 召唤物死亡 → 销毁；buff 到期 → 全部销毁
    const sid = await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, s = W.units.find(u => u.summon && u.alive); s.hp = 0; s.alive = false; return s.uid; });
    await sleep(1200); chk(await p.evaluate(uid => !window.__game.scene.getScene('Battle').children.list.some(o => /^aura:/.test(o.name) && o.getData('uid') === uid), sid), `${L} 召唤物死亡 → 光环销毁`);
    await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (const u of W.units) { if (u.defUpUntil) u.defUpUntil = W.time; if (u.mdefUpUntil) u.mdefUpUntil = W.time; } });
    await sleep(1200); const s4 = await p.evaluate(SAMPLE);
    chk(s4.n === 0 && await p.evaluate(() => window.__game.scene.getScene('Battle').groundAuras.live.size === 0), `${L} buff 到期 → 全部 end 后销毁`);
    chk(w.errs.length === 0, `${L} 控制台 0 报错 ${w.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
