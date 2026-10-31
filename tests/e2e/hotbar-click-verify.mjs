// R54：快捷栏点击 = 按键（药水/技能，同走 BattleScene.onKey），点击不穿透到地图行走；+ 立绘动作缩放采样（所有召唤物/主角/怪物 max scale ≤ 基准）
// 用法：npm run build && node tests/e2e/hotbar-click-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, toScreen, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/hotbar-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const st = p => p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; return { pots: [...W.pots], hp: Math.round(h.hp), mp: Math.round(h.mp ?? 0), x: Math.round(h.x), tt: B.townTarget ?? null, cd0: +(B.cds[0] ?? 0).toFixed(2) }; });
try {
  for (const [VW, VH, mob] of [[1280, 720, false], [932, 430, true]]) {
    const tag = `${mob ? 'm' : 'd'}${VW}`;
    for (const town of [true, false]) {
      const save = { v: 1, cls: 'mage', level: 22, ...(town ? { town: 'bichi' } : {}), exp: 0, gold: 999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [] };
      const p = await b.newPage(); if (mob) await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const w = watch(p);
      await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
      await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
      const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
      await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
      const slot = async (kind, i) => { if (mob) return p.evaluate((kind, i) => { const e = document.querySelector(kind === 'pot' ? `[data-id=pot${i}]` : `[data-id="sk_${window.__game.scene.getScene('Battle').world.skills[i].id}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, kind, i);
        const o = await p.evaluate(n => { const o = window.__game.scene.getScene('UI').children.getByName(n); return o ? { x: o.x, y: o.y } : null; }, (kind === 'pot' ? 'potSlot' : 'skSlot') + i); return o && toScreen(p, o.x, o.y); };
      const click = async q => { if (mob) await p.touchscreen.tap(q.x, q.y); else await p.mouse.click(q.x, q.y); await sleep(500); };
      const key = async k => { if (mob) await p.evaluate(k => window.__game.scene.getScene('Battle').onKey(k), k); else await p.keyboard.press(k === '1' ? 'Digit1' : k === '2' ? 'Digit2' : k); await sleep(500); };
      if (town) {
        await p.evaluate(() => { const h = window.__game.scene.getScene('Battle').world.hero; h.hp = Math.round(h.maxHp * 0.3); }); await sleep(200);
        const q0 = await slot('pot', 0), q1 = await slot('pot', 1); chk(!!q0 && !!q1, `${tag} 药水格可定位 ${JSON.stringify(q0)}`);
        const a = await st(p); await click(q0); const c = await st(p); await key('1'); const k = await st(p);
        chk(c.pots[0] === a.pots[0] - 1 && c.hp > a.hp && k.pots[0] === c.pots[0] - 1 && k.hp - c.hp === c.hp - a.hp, `${tag} 点击药水格 = 按 1（瓶数 ${a.pots[0]}→${c.pots[0]}→${k.pots[0]}，HP ${a.hp}→${c.hp}→${k.hp}）`);
        chk(c.tt === null && c.x === a.x, `${tag} 城内点击药水格不触发点地行走（townTarget=${JSON.stringify(c.tt)} x ${a.x}→${c.x}）`);
        const e0 = await st(p); await click(q1); const e1 = await st(p); await key('2'); const e2 = await st(p);
        chk(e1.pots[1] === 0 && e1.hp === e0.hp && e2.hp === e1.hp && e2.pots[1] === 0 && e1.tt === null, `${tag} 数量为 0：点击与按 2 结果一致（都不生效，HP ${e0.hp}/${e1.hp}/${e2.hp}）`);
        await p.screenshot({ path: `${dir}/${tag}-town-pots.png` });
      } else {
        const prep = () => p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = Math.round(h.maxMp / 2); h.hp = h.maxHp; B.cds.fill(0); W.gcd = 0; if (!W.__wrapped) { const o = W.cast.bind(W); W.cast = (...a) => { const r = o(...a); window.__casts.push(r.ok ? 'ok' : (r.reason || 'no')); return r; }; W.__wrapped = 1; } window.__casts = [];
          let e = W.units.find(u => u.team === 'enemy' && u.alive && Math.abs(u.x - h.x) < 300); if (!e) { e = W.spawnFoe('skeleton', h.x + 120, h.y ?? 0); } e.hp = e.maxHp = 1e6; e.x = h.x + 120 * (h.facing || 1); });
        await prep(); const q = await slot('sk', 0); chk(!!q, `${tag} 技能格 0 可定位 ${JSON.stringify(q)}`);
        const a = await st(p); await click(q); const c = await st(p); await click(q); const d = await st(p); const cc = await p.evaluate(() => window.__casts.slice());
        await prep(); const ka = await st(p); await key('F1'); const kc = await st(p); await key('F1'); const kd = await st(p); const kk = await p.evaluate(() => window.__casts.slice());
        chk(cc[0] === 'ok' && kk[0] === 'ok' && c.cd0 > 0 && kc.cd0 > 0, `${tag} 点击技能格 = 按 F1：都走 World.cast 且释放成功（点击 ${JSON.stringify(cc)} / 按键 ${JSON.stringify(kk)}；cd ${c.cd0}/${kc.cd0}）`);
        chk(cc.length === kk.length && cc.every((x, i) => x === kk[i]), `${tag} 冷却/间隔中再点与再按结果一致（${JSON.stringify(cc)} vs ${JSON.stringify(kk)}）`);
        chk(c.x === a.x || Math.abs(c.x - a.x) === Math.abs(kc.x - ka.x), `${tag} 点击技能格未触发移动（x ${a.x}→${c.x}，按键 ${ka.x}→${kc.x}）`);
        await p.screenshot({ path: `${dir}/${tag}-field-skill.png` });
        // 立绘缩放采样：所有召唤物定义 + 主角 + 怪物；攻击(swing)/前摇(windup)/受击(hit)/冲刺/待机全过程逐帧取 art.scale / 基准
        if (!mob) {
          const r = await p.evaluate(async () => { const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero, CV = B.views.get(h.uid).constructor;
            const views = [[h, B.views.get(h.uid)]]; const foe = W.units.find(u => u.team === 'enemy' && u.alive && B.views.get(u.uid)); if (foe) views.push([foe, B.views.get(foe.uid)]);
            W.summonDefs.forEach((d, i) => { const u = W.spawn({ ...d }, 'hero', h.x - 160 - i * 130, h.y ?? 0); u.summon = true; W.units.splice(W.units.indexOf(u), 1); const v = new CV(B, u); v.x = h.x - 160 - i * 130; v.setDepth?.(50); views.push([u, v]); });
            const sk2 = views.find(([u]) => u.id === 'summon_skeleton'); if (sk2) { const u = W.spawn({ ...W.summonDefs[0] }, 'hero', h.x + 260, h.y ?? 0); u.summon = true; W.units.splice(W.units.indexOf(u), 1); u.level = 7; u.name = '骷髅7级'; u.nameColor = '#3a7aff'; const v = new CV(B, u); v.x = h.x + 260; v.sync?.(); views.push([{ ...u, id: 'summon_skeleton(升级变色)' }, v]); }
            const out = {}; await Promise.all(views.map(async ([u, v]) => { const bx = v.artSX, by = v.artSY; let mx = 0; const samp = () => { mx = Math.max(mx, Math.abs(v.art.scaleX) / bx, Math.abs(v.art.scaleY) / by); };
              B.events.on('postupdate', samp); v.swing(1); await new Promise(r => setTimeout(r, 400)); v.windup(1); await new Promise(r => setTimeout(r, 500)); v.hit(); v.lunge(1); await new Promise(r => setTimeout(r, 500)); B.events.off('postupdate', samp);
              out[`${u.id}${u.isHero ? '(主角)' : u.team === 'enemy' ? '(怪物)' : ''}`] = +mx.toFixed(4); }));
            B.cameras.main.stopFollow?.(); B.cameras.main.centerOn(h.x - 200, 400); return out; });
          await sleep(300); await p.screenshot({ path: `${dir}/${tag}-summons.png` });
          for (const [k, v] of Object.entries(r)) chk(v <= 1.0001 && v > 0, `${tag} 动作全过程 ${k} max scale/基准 = ${v}`);
        }
      }
      const errs = w.errs.filter(e => !/404|Failed to load/.test(e)); chk(errs.length === 0, `${tag}${town ? '-town' : '-field'} 控制台 0 报错 ${errs.slice(0, 3).join(' | ')}`);
      await p.close();
    }
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
