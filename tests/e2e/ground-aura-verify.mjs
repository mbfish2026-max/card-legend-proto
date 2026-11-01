// feat/ground-aura-hook：神圣战甲术/幽灵盾/金刚护体 → 脚下地面光环（start→loop→end）；魔法盾仍为身体罩
// 用法：npm run build && node tests/e2e/ground-aura-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/ground-aura-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const CASES0 = [['taoist', 'holy_armor'], ['taoist', 'ghost_shield'], ['warrior', 'vajra_body']];
const CASES = CASES0.filter(c => !process.env.ONLY || process.env.ONLY.split(',').includes(c[1]));
const VPS = [{ tag: 'desk', w: 1280, h: 720, mobile: false }, { tag: 'mobile', w: 844, h: 390, mobile: true }];
const sv = await startPreview(), b = await launch();
// 采样：所有 aura:* 精灵
const SAMPLE = `(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, hv = B.views.get(W.hero.uid);
  const sps = B.children.list.filter(o => /^aura:/.test(o.name) && o.active).map(o => ({ n: o.name, x: o.x, y: o.y, d: o.depth, r: o.rotation, sx: o.scaleX, sy: o.scaleY, blend: o.blendMode, uid: o.getData('uid'), w: o.frame.realWidth, h: o.frame.realHeight, ox: o.originX, oy: o.originY }));
  return { sps, hx: hv.cx, hy: hv.y, hd: hv.depth, t: W.time }; })()`;
try {
  for (const vp of VPS) for (const [cls, id] of CASES) {
    const save = { v: 1, cls, level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); if (vp.mobile) await p.setUserAgent(UA);
    await p.setViewport({ width: vp.w, height: vp.h, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: ['warrior', 'mage', 'taoist'], autoAttack: false })); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (vp.mobile) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 });
    await p.waitForFunction(k => ['start', 'loop', 'end'].every(ph => window.__game.scene.getScene('Battle').textures.exists(`fx_aura_${k}_${ph}`)), { timeout: 60000 }, id);
    await sleep(800);
    const L = `${vp.tag} ${id}`;
    // 准备：学会全部技能、满蓝、怪挪远、清空 buff
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; for (const s of W.skillPool) { W.learned.add(s.id); W.skillTrain[s.id] = 99999; }
      h.mp = h.maxMp = 99999; h.hp = h.maxHp; h.defUpUntil = h.mdefUpUntil = h.armorUntil = 0; for (const u of W.units) if (u.team === 'enemy') { u.x = h.x + 5000; u.ai = 'idle'; } B.cds = W.skills.map(() => 0); });
    const cast = () => p.evaluate(k => { const B = window.__game.scene.getScene('Battle'), W = B.world, i = W.skills.findIndex(s => s.id === k); B.cds = W.skills.map(() => 0); W.hero.mp = 99999; const r = W.cast(i, B.cds); const ev = W.drainEvents(); if (r.ok) B.skillFx(r.skill, B.views.get(W.hero.uid), r.targets, ev); B.handle(ev); return r.ok ? 'ok' : r.reason; }, id);
    chk(await cast() === 'ok', `${L} 施放`);
    await sleep(120); const s0 = await p.evaluate(SAMPLE);
    chk(s0.sps.length === 1 && s0.sps[0].n === `aura:${id}:start`, `${L} 先播 start（${s0.sps.map(s => s.n)}）`);
    await sleep(700); const s1 = await p.evaluate(SAMPLE), a = s1.sps[0];
    chk(s1.sps.length === 1 && a?.n === `aura:${id}:loop`, `${L} start 后接 loop（${s1.sps.map(s => s.n)}）`);
    chk(a && a.d === 9 && a.d < s1.hd, `${L} depth ${a?.d}（人物 ${s1.hd.toFixed(3)}）`);
    chk(a && a.blend === 1, `${L} ADD 混合`);
    chk(a && a.w === 256 && a.h === 96 && a.ox === 0.5 && a.oy === 0.5, `${L} 帧 256×96 pivot(128,48)`);
    chk(a && Math.abs(a.x - s1.hx) < 1 && Math.abs(a.y - s1.hy) < 1, `${L} 位于脚底 (${a?.x.toFixed(1)},${a?.y}) vs 英雄 (${s1.hx.toFixed(1)},${s1.hy})`);
    chk(a && a.sx === a.sy && a.sx >= 0.8 && a.sx <= 1.2, `${L} 等比缩放 ${a?.sx}`);
    // 截图（脚下裁剪 + 全屏）
    const crop = async (name) => { const r = await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), hv = B.views.get(B.world.hero.uid), cv = window.__game.canvas.getBoundingClientRect(), wv = B.cameras.main.worldView; const X = x => cv.left + (x - wv.x) * cv.width / wv.width, Y = y => cv.top + (y - wv.y) * cv.height / wv.height; return { x: X(hv.cx - 200), y: Y(hv.y - hv.h - 30), x2: X(hv.cx + 200), y2: Y(hv.y + 70) }; });
      const x = Math.max(0, r.x), y = Math.max(0, r.y); await p.screenshot({ path: `${dir}/${name}-crop.png`, clip: { x, y, width: Math.min(vp.w, r.x2) - x, height: Math.min(vp.h, r.y2) - y } }); await p.screenshot({ path: `${dir}/${name}-full.png` }); };
    await crop(`${vp.tag}-${id}`);
    // 跟随移动 + 旋转恒 0（采样 10 次）
    const rots = [], dx = []; await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; W.hero.x += 160; });
    for (let k = 0; k < 10; k++) { await sleep(80); const s = await p.evaluate(SAMPLE); const q = s.sps[0]; if (q) { rots.push(q.r); dx.push(Math.abs(q.x - s.hx) + Math.abs(q.y - s.hy)); } }
    chk(rots.length === 10 && rots.every(r => r === 0), `${L} rotation 恒为 0（${rots.length} 次采样）`);
    chk(dx.length === 10 && dx.every(d => d < 1), `${L} 英雄移动时光环实时跟随（最大偏差 ${Math.max(...dx).toFixed(2)}）`);
    // 重复施放（绕过「持续中无效」直接刷新）不叠加
    // 同一帧内清 until 再施放 3 次（模拟刷新；不经过「buff 已结束」的帧）
    await p.evaluate(k => { const B = window.__game.scene.getScene('Battle'), W = B.world; for (let n = 0; n < 3; n++) { W.hero.defUpUntil = W.hero.mdefUpUntil = 0; const i = W.skills.findIndex(s => s.id === k); B.cds = W.skills.map(() => 0); W.hero.mp = 99999; W.cast(i, B.cds); B.handle(W.drainEvents()); } }, id);
    await sleep(100); const s2 = await p.evaluate(SAMPLE); await sleep(700); const s3 = await p.evaluate(SAMPLE);
    chk(s2.sps.length === 1 && s3.sps.length === 1, `${L} 重复施放不叠加（${s2.sps.length}/${s3.sps.length} 个）`);
    // buff 到期 → end → 销毁
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), h = B.world.hero; h.defUpUntil = h.mdefUpUntil = B.world.time; });
    await sleep(100); const s4 = await p.evaluate(SAMPLE); await sleep(800); const s5 = await p.evaluate(SAMPLE);
    chk(s4.sps.length === 1 && s4.sps[0].n === `aura:${id}:end`, `${L} buff 结束播 end（${s4.sps.map(s => s.n)}）`);
    chk(s5.sps.length === 0 && await p.evaluate(() => window.__game.scene.getScene('Battle').groundAuras.live.size === 0), `${L} end 后销毁，无残留`);
    if (vp.tag === 'desk' && id === 'holy_armor') {
      // 驱散（破击写负值）→ end
      await cast(); await sleep(700); await p.evaluate(() => { const h = window.__game.scene.getScene('Battle').world.hero; h.defUp = -5; });
      await sleep(900); chk((await p.evaluate(SAMPLE)).sps.length === 0, `${L} 被驱散 → end 后销毁`);
      // 召唤物被加此类 buff：光环在召唤物脚下；死亡 → end 后销毁
      const su = await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; const i = W.skills.findIndex(s => s.id === 'summon_skeleton'); B.cds = W.skills.map(() => 0); W.cast(i, B.cds); B.handle(W.drainEvents()); const s = W.units.find(u => u.summon && u.alive); if (!s) return null; s.auraSkill = 'holy_armor'; s.defUp = 5; s.defUpUntil = W.time + 60; return s.uid; });
      await sleep(1200); const sa = await p.evaluate(uid => { const B = window.__game.scene.getScene('Battle'), v = B.views.get(uid), o = B.children.list.find(o => /^aura:/.test(o.name) && o.getData('uid') === uid); return o && v ? { d: Math.abs(o.x - v.cx) + Math.abs(o.y - v.y), n: o.name } : null; }, su);
      chk(su && sa && sa.d < 1 && sa.n === 'aura:holy_armor:loop', `${L} 召唤物脚下光环 ${JSON.stringify(sa)}`);
      await p.evaluate(uid => { const W = window.__game.scene.getScene('Battle').world, s = W.units.find(u => u.uid === uid); s.hp = 0; s.alive = false; }, su);
      await sleep(1500); chk(await p.evaluate(uid => !window.__game.scene.getScene('Battle').children.list.some(o => /^aura:/.test(o.name) && o.getData('uid') === uid), su), `${L} 召唤物死亡 → 光环销毁`);
      // 换图：未过期 buff → 新图重新显示（feat/ground-aura-ally 取消抑制）
      await cast(); await sleep(700); await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.loadFloor(W.floorIndex + 1); B.handle(W.drainEvents()); });
      await sleep(1500); { const sm = await p.evaluate(SAMPLE), me = sm.sps.filter(o => o.uid === undefined || true).find(o => Math.abs(o.x - sm.hx) < 1); chk(!!me && me.n === 'aura:holy_armor:loop', `${L} 换图 → 英雄光环在新图重现（${sm.sps.map(o => o.n)}）`); }
      // 魔法盾仍为身体罩（法师验证见下）
    }
    chk(w.errs.length === 0, `${L} 控制台 0 报错 ${w.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
  { // 魔法盾：仍播身上椭圆罩，不出现地面光环
    const save = { v: 1, cls: 'mage', level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle').textures.exists('fx_magic_shield_cast'), { timeout: 60000 }); await sleep(800);
    const r = await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world; for (const s of W.skillPool) { W.learned.add(s.id); W.skillTrain[s.id] = 99999; } W.hero.mp = 99999; B.cds = W.skills.map(() => 0); const i = W.skills.findIndex(s => s.id === 'magic_shield'); const r = W.cast(i, B.cds); const ev = W.drainEvents(); if (r.ok) B.skillFx(r.skill, B.views.get(W.hero.uid), r.targets, ev); B.handle(ev); return r.ok || r.reason; });
    const seen = new Set(); for (let k = 0; k < 15; k++) { await sleep(100); (await p.evaluate(() => window.__game.scene.getScene('Battle').children.list.filter(o => o.type === 'Sprite' && /^fx_(magic_shield|aura)/.test(o.texture.key)).map(o => o.texture.key))).forEach(x => seen.add(x)); } const keys = [...seen];
    chk(r === true && keys.some(k => /^fx_magic_shield_/.test(k)) && !keys.some(k => /^fx_aura/.test(k)), `魔法盾仍为身体罩（cast=${r} ${keys}）`);
    await p.screenshot({ path: `${dir}/desk-magic_shield-full.png` });
    chk(w.errs.length === 0, `魔法盾 控制台 0 报错 ${w.errs.slice(0, 3).join(' | ')}`); await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
