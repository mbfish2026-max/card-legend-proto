// 攻击/受伤/施法全程卡牌本体不放大：逐帧采样 CardView 容器/inner/立绘的 scale 与显示尺寸（含姿态帧换纹理）
// 覆盖：骷髅、金甲骷髅、神兽、法师宠物、英雄、怪物。用法：npm run build && node tests/e2e/card-scale-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const mkSave = (cls, learned) => ({ v: 1, cls, level: 48, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned });
const runs = [['taoist', ['summon_skeleton', 'summon_beast', 'summon_golden_skeleton', 'poison', 'soul_fire'], ['summon_skeleton', 'summon_golden_skeleton', 'summon_beast']], ['mage', ['charm', 'fireball', 'thunder'], ['pet']]];
const sv = await startPreview(), b = await launch(); const out = { cases: {} }; let fail = 0;
try {
  for (const [cls, learned, kinds] of runs) {
    const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
    await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), mkSave(cls, learned));
    await page.goto(sv.url);
    await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
    for (const kind of kinds) {
      const r = await page.evaluate(async kind => {
        const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.hp = h.maxHp = 1e9; h.mp = h.maxMp = 1e9; B.tryAutoSkills = () => {}; // 关自动技能，避免自动重召替换被测召唤物
        W.units.filter(u => u.summon && u.alive).forEach(u => { u.alive = false; W.events.push({ type: 'death', uid: u.uid }); });
        await new Promise(r => setTimeout(r, 600));
        const ene = W.units.filter(u => u.team === 'enemy' && u.alive); let sm;
        if (kind === 'pet') { sm = ene[1]; Object.assign(sm, { team: 'ally', summon: true, pet: true, ai: 'chase', y: 30, boss: undefined, facing: 1 }); W.pets.push(sm); W.events.push({ type: 'charm', uid: sm.uid, result: 'ok' }); }
        else { B.cds = B.cds.map(() => 0); const c = W.cast(W.skills.findIndex(s => s.id === kind), B.cds); if (!c.ok) return { err: c.reason }; B.cds = B.cds.map(() => 0); sm = W.units.find(u => u.summon && u.alive && u.id === kind) ?? W.units.find(u => u.summon && u.alive); }
        const z = W.units.find(u => u.team === 'enemy' && u.alive && u !== sm);
        W.units.forEach(u => { if (u.team === 'enemy' && u !== z && u.alive) u.x += 4000; });
        z.hp = z.maxHp = 1e9; z.ai = 'chase'; z.x = h.x + 260; z.atk = Math.max(z.atk, 5); sm.hp = sm.maxHp = 1e9; sm.x = h.x + 140;
        for (let i = 0; i < 40 && !B.views.get(sm.uid); i++) await new Promise(r => setTimeout(r, 100));
        await new Promise(r => setTimeout(r, 400));
        const vs = { summon: B.views.get(sm.uid), hero: B.views.get(h.uid), monster: B.views.get(z.uid) };
        const miss = Object.keys(vs).filter(k => !vs[k]); if (miss.length) return { err: 'no view ' + miss + ' heroViews=' + [...B.views.keys()].join(',') + ' sm=' + sm.uid + ' ' + sm.id + ' alive=' + sm.alive };
        const tex = {}; // 每张纹理的不透明内容高度比例（帧本身尺寸变化导致的视觉放大）
        const opaqueH = key => { if (key in tex) return tex[key]; const src = B.textures.get(key).getSourceImage(); const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let t = c.height, bt = 0; for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 4) if (d[(y * c.width + x) * 4 + 3] > 40) { t = Math.min(t, y); bt = Math.max(bt, y); } return tex[key] = (bt - t) / c.height; };
        const st = v => { const a = v.art; return { cs: Math.max(v.scaleX, v.scaleY), is: Math.max(v.inner.scaleX, v.inner.scaleY), ax: a.scaleX / v.artSX, ay: a.scaleY / v.artSY, dh: a.displayHeight * opaqueH(a.texture.key), dw: a.displayWidth, rh: v.artSY * a.frame.height * opaqueH(a.texture.key), rw: v.artSX * a.frame.width, key: a.texture.key }; };
        for (let i = 0; i < 30 && Object.values(vs).some(v => v.poseBase); i++) await new Promise(r => setTimeout(r, 50)); // 基准取原立绘（非姿态帧）
        const base = {}; for (const k in vs) { const s0 = st(vs[k]); base[k] = { ...s0, dh: s0.rh, dw: s0.rw }; } // 基准 = 静态立绘的显示尺寸（不含呼吸压缩）
        const pk = {}; for (const k in vs) pk[k] = { cs: 0, is: 0, ax: 0, ay: 0, dh: 0, dw: 0, keys: new Set(), frames: 0 };
        let ev = { attack: 0, damage: 0, cast: 0 };
        const t0 = performance.now(); let lastCast = 0;
        await new Promise(res => { const f = () => { const now = performance.now();
          if (now - lastCast > 900) { lastCast = now; W.hero.mp = 1e9; B.cds = B.cds.map(() => 0); const sk = W.skills.findIndex(s => ['soul_fire', 'poison', 'fireball', 'thunder'].includes(s.id)); if (sk >= 0 && W.cast(sk, B.cds).ok) ev.cast++; }
          const uids = { summon: sm.uid, hero: h.uid, monster: z.uid }; for (const k in vs) { const v = B.views.get(uids[k]); if (!v?.active) continue; if (v !== vs[k]) pk[k].recreated = (pk[k].recreated ?? 0) + 1; const s = st(v), P = pk[k]; for (const q of ['cs', 'is', 'ax', 'ay']) P[q] = Math.max(P[q], s[q]); P.dh = Math.max(P.dh, s.dh / base[k].dh); P.dw = Math.max(P.dw, s.dw / base[k].dw); P.keys.add(s.key); P.frames++; }
          if (now - t0 < 6000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        for (const k in pk) pk[k].keys = [...pk[k].keys];
        return { ok: true, name: sm.name, pk };
      }, kind);
      await page.screenshot({ path: `${dir}/card-scale-${kind}.png` });
      if (r.err) { out.cases[kind] = r; fail++; continue; }
      for (const [who, P] of Object.entries(r.pk)) { const bad = ['cs', 'is', 'ax', 'ay', 'dh', 'dw'].filter(q => P[q] > 1.001); P.ok = !bad.length && P.frames > 30; if (!P.ok) { fail++; P.bad = bad; } }
      out.cases[kind] = r;
    }
    out['errs_' + cls] = w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8); fail += out['errs_' + cls].length;
    await page.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1)); console.log(fail ? `card-scale FAIL ${fail}` : 'card-scale OK'); process.exit(fail ? 1 : 0);
