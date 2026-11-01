// 召唤物名字/颜色：道士骷髅、法师诱惑之光宠物，0/3/5/7 级；桌面 + 手机横屏 844×390（+ 竖屏 390×844 为既有「请横屏」提示，仅截图）
// 用法：npm run build && node tests/e2e/summon-label-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/summon-label-e2e'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = [['desktop', 1280, 720, false], ['mobile', 844, 390, true], ['portrait', 390, 844, true]];
const CASES = [['taoist', ''], ['mage', ''], ['taoist', '超长的角色名字测试十六字符啊啊啊']];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
try {
  for (const [tag, VW, VH, mob] of VPS) for (const [cls, slotName] of CASES) {
    if (tag === 'portrait' && slotName) continue;
    const save = { v: 1, cls, level: 40, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1 }); const w = watch(p);
    await p.evaluateOnNewDocument((s, n) => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); if (n) localStorage.setItem('fcl_slots_v1', JSON.stringify({ active: 1, count: 5, slots: { 1: { name: n } } })); localStorage.setItem('fcl_settings_v1', JSON.stringify({ autoSkills: [], autoTouched: ['warrior', 'mage', 'taoist'], autoAttack: false })); }, save, slotName);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const name = `${tag}-${cls}${slotName ? '-longname' : ''}`;
    if (tag === 'portrait') { await p.screenshot({ path: `${dir}/${name}.png` }); chk(w.errs.length === 0, `${name} 竖屏 0 报错`); await p.close(); continue; }
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    if (cls === 'mage') { await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world, h = W.hero; for (const e of W.units) if (e.team === 'enemy') e.x += 5000; const d = W.spawnFoe('deer', h.x + 120, 0); d.level = 1; d.hp = d.maxHp = 99999; }); await sleep(800); }
    const r = await p.evaluate(cls => {
      const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.hp = h.maxHp = 999999; h.mp = h.maxMp = 99999;
      for (const s of W.skillPool) { W.learned.add(s.id); W.skillTrain[s.id] = 99999; }
      for (const e of W.units) if (e.team === 'enemy' && e.id !== 'deer') e.x += 5000;
      if (cls === 'taoist') { const i = W.skills.findIndex(s => s.id === 'summon_skeleton'); B.cds = W.skills.map(() => 0); W.cast(i, B.cds); }
      else { const d = W.units.find(u => u.id === 'deer' && u.alive && u.team === 'enemy'); d.x = h.x + 120; W.rng = () => 0; const i = W.skills.findIndex(s => s.id === 'charm'); B.cds = W.skills.map(() => 0); const res = W.cast(i, B.cds); if (!res.ok) return 'cast ' + res.reason; }
      B.handle(W.drainEvents());
      const sm = W.units.find(u => u.summon && u.alive && u.sBase); if (!sm) return 'no summon';
      W.time += 0; return sm.name;
    }, cls);
    await sleep(800);
    chk(/·\d级（.+）的宠物$/.test(r), `${name} 召唤物名字：${r}`);
    for (const L of [0, 3, 5, 7]) {
      const info = await p.evaluate(L => {
        const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero, sm = W.units.find(u => u.summon && u.alive && u.sBase);
        sm.sLv = L; W.applySummonLv(sm); sm.x = h.x - h.facing * 150; sm.hp = sm.maxHp;
        const v = B.views.get(sm.uid); v.sync(); for (let i = 0; i < 30; i++) v.sync();
        const t = v.nameText, nb = t.getBounds(), cam = B.cameras.main.worldView, hp = v.hpFill.getBounds(), cardL = v.x - v.w / 2, cardR = v.x + v.w / 2;
        const cv = window.__game.canvas.getBoundingClientRect(), sx = cv.width / cam.width, sy = cv.height / cam.height;
        return { text: t.text, color: t.style.color, size: t.style.fontSize, want: sm.nameColor, inCard: nb.left >= cardL - 1 && nb.right <= cardR + 1, noBar: nb.bottom <= hp.top + 0.5, inCam: nb.left >= cam.x && nb.right <= cam.right && nb.top >= cam.y && nb.bottom <= cam.bottom,
          clip: { x: Math.max(0, cv.left + (cardL - 30 - cam.x) * sx), y: Math.max(0, cv.top + (v.y - v.h - 20 - cam.y) * sy), width: (v.w + 60) * sx, height: (v.h + 40) * sy }, px: Math.round(parseFloat(t.style.fontSize) * sy * 10) / 10 };
      }, L);
      await sleep(300);
      await p.screenshot({ path: `${dir}/${name}-lv${L}.png` });
      await p.screenshot({ path: `${dir}/${name}-lv${L}-crop.png`, clip: info.clip });
      chk(info.color === info.want && info.inCard && info.noBar && info.inCam, `${name} ${L} 级「${info.text.replace('\n', '⏎')}」${info.color} ${info.size}(屏上≈${info.px}px) 卡内=${info.inCard} 不压血条=${info.noBar} 在屏内=${info.inCam}`);
    }
    chk(w.errs.length === 0, `${name} 控制台 0 报错 ${w.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
