// 召唤物攻击/受伤动作：召唤骷髅/神兽、诱惑宠物与怪交战，抓 swing/hit 时刻立绘位移/倾斜/闪白，结束后恢复
// 用法：npm run build && node tests/e2e/summon-anim-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'taoist', level: 45, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['summon_skeleton', 'summon_beast'] };
const sv = await startPreview(), b = await launch(); const out = {};
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  for (const kind of ['summon_skeleton', 'summon_beast', 'pet']) {
    const setup = await page.evaluate(async kind => {
      const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.hp = h.maxHp = 1e9; h.mp = h.maxMp = 1e9; h.atk = 0;
      W.units.filter(u => u.pet).forEach(u => { u.alive = false; W.events.push({ type: 'death', uid: u.uid }); });
      const ene = W.units.filter(u => u.team === 'enemy' && u.alive);
      let sm;
      if (kind === 'pet') {
        W.units.filter(u => u.summon && !u.pet && u.alive).forEach(u => { u.alive = false; W.events.push({ type: 'death', uid: u.uid }); });
        sm = ene[1]; Object.assign(sm, { team: 'ally', summon: true, pet: true, petUntil: W.time + 9999, ai: 'chase', y: 30, boss: undefined, facing: 1 });
        W.events.push({ type: 'charm', uid: sm.uid, result: 'ok' });
      } else { B.cds = B.cds.map(() => 0); const r = W.cast(W.skills.findIndex(s => s.id === kind), B.cds); if (!r.ok) return { err: r.reason }; B.cds = B.cds.map(() => 0); sm = W.units.find(u => u.summon && !u.pet && u.alive); }
      const z = W.units.find(u => u.team === 'enemy' && u.alive && u !== sm);
      W.units.forEach(u => { if (u.team === 'enemy' && u !== z && u.alive) u.x += 4000; });
      z.hp = z.maxHp = 1e9; z.ai = 'chase'; z.x = h.x + 500; sm.hp = sm.maxHp = 1e9; sm.x = h.x + 380; z.aggroUid = sm.uid;
      await new Promise(r => setTimeout(r, 300));
      const v = B.views.get(sm.uid); if (!v) return { err: 'no view' };
      const st = () => ({ artX: +(v.art.x - v.artX).toFixed(2), ang: +v.art.angle.toFixed(2), sx: +(v.art.scaleX / v.artSX).toFixed(3), innerX: +v.inner.x.toFixed(2), tintFill: !!v.art.tintFill, tint: v.art.tintTopLeft.toString(16), name: v.nameText.text, color: v.nameText.style.color, lv: v.lvlText.style.color });
      window.__sa = { v, st, uid: sm.uid, log: { swing: [], hit: [] } };
      const os = v.swing.bind(v), oh = v.hit.bind(v);
      // 动作期间逐帧采样 250ms，取位移/倾斜峰值，是否出现闪白
      const peak = (tag) => { const t0 = performance.now(), pk = { artX: 0, ang: 0, sx: 1, innerX: 0, tintFill: false }; const f = () => { const s = st(); for (const k of ['artX', 'ang', 'innerX']) if (Math.abs(s[k]) > Math.abs(pk[k])) pk[k] = s[k]; if (Math.abs(s.sx - 1) > Math.abs(pk.sx - 1)) pk.sx = s.sx; pk.tintFill ||= s.tintFill; if (performance.now() - t0 < 250) requestAnimationFrame(f); else window.__sa.log[tag].push(pk); }; requestAnimationFrame(f); };
      v.swing = d => { os(d); peak('swing'); };
      v.hit = () => { oh(); peak('hit'); };
      return { ok: true, base: st(), name: sm.name };
    }, kind);
    if (setup.err) { out[kind] = setup; continue; }
    // 保持主角远离以便怪追打召唤物
    let shotA = false, shotH = false;
    for (let i = 0; i < 80 && !(shotA && shotH); i++) {
      await sleep(50);
      const s = await page.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, sm = W.units.find(u => u.uid === window.__sa.uid), z = W.units.find(u => u.team === 'enemy' && u.alive && Math.abs(u.x - sm.x) < 900); if (z) W.hero.x = z.x - 600; return { a: window.__sa.log.swing.length, h: window.__sa.log.hit.length }; });
      if (s.a && !shotA) { shotA = true; await page.screenshot({ path: `${dir}/summon-anim-${kind}-attack.png` }); }
      if (s.h && !shotH) { shotH = true; await page.screenshot({ path: `${dir}/summon-anim-${kind}-hurt.png` }); }
    }
    // 停战后检查恢复
    const end = await page.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world; W.units.forEach(u => { if (u.team === 'enemy') u.x += 5000; }); await new Promise(r => setTimeout(r, 1200)); return window.__sa.st(); });
    await page.screenshot({ path: `${dir}/summon-anim-${kind}-after.png` });
    const log = await page.evaluate(() => window.__sa.log);
    out[kind] = { name: setup.name, base: setup.base, swings: log.swing.length, hits: log.hit.length, atk: log.swing[0], hurt: log.hit[0], end };
  }
  out.errs = w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8);
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
