// fix/r78-equip-tap：装备栏点击区实测（取所有装备格最小值）+ 文字不重叠/不超面板 + 空栏底图，三手机尺寸+桌面截图。
// 用法：npm run build && node tests/e2e/equip-tap-shots.mjs [目录]（默认 docs/shots/r78-equip-tap，不覆盖旧截图）
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/r78-equip-tap'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const MIN = +(process.env.MIN_TAP ?? 44);
const sv = await startPreview(), b = await launch();
const sword = { uid: 7, item: 'iron_sword', name: '铁剑', rarity: 'common', slot: 'weapon', stats: { atk: 8 }, req: 10, price: 20 };
try {
  for (const [VW, VH, mob] of [[844, 390, true], [874, 402, true], [932, 430, true], [1280, 720, false]]) {
    const save = { v: 1, cls: 'warrior', level: 50, exp: 0, gold: 999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: { weapon: sword }, bag: [], learned: [] };
    const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
    const r = await p.evaluate(() => {
      const g = window.__game, pn = g.scene.getScene('UI').panel, R = pn.root, all = []; const walk = o => { all.push(o); (o.list ?? []).forEach(walk); }; R.list.forEach(walk);
      const k = pn.cssU(), slots = all.filter(o => /^eq_/.test(o.name ?? ''));
      const hits = slots.map(o => ({ n: o.name, x: o.x, y: o.y, h: o.getData('slotHit') }));
      const minCss = Math.min(...hits.map(h => h.h * k));
      let ov = []; for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) { const a = hits[i], c = hits[j]; if (Math.abs(a.x - c.x) < (a.h + c.h) / 2 - 0.5 && Math.abs(a.y - c.y) < (a.h + c.h) / 2 - 0.5) ov.push(a.n + '/' + c.n); }
      const pb = all.find(o => o.name === 'panelBg').getBounds();
      const eqR = slots.reduce((m, o) => { const bb = o.getBounds(); return { l: Math.min(m.l, bb.left), r: Math.max(m.r, bb.right) }; }, { l: 1e9, r: -1e9 });
      // 装备区文字：装备格标签 + 属性文字（左半区）
      const tx = all.filter(o => o.type === 'Text' && o.visible && o.text && o.getBounds().top > pb.top + 40).flatMap(o => { const bb = o.getBounds(), ls = o.text.split('\n'); if (ls.length === 1) return [{ t: o.text.slice(0, 8), b: bb }];
        const sx = bb.width / o.width, lh = bb.height / ls.length; o.context.font = o.style._font ?? o.context.font; // 多行文字按行实测宽度（避免整块外接框误报）；纵向容差 3px（行高留白）
        return ls.map((l, i) => { const lw = o.context.measureText(l).width * sx; return { t: l.slice(0, 8), b: { left: bb.left, right: bb.left + lw, top: bb.top + lh * i, bottom: bb.top + lh * (i + 1) } }; }); });
      const tov = []; for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) { const a = tx[i].b, c = tx[j].b; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 3 && c.top < a.bottom - 3) tov.push(tx[i].t + '/' + tx[j].t); }
      const out = tx.filter(o => o.b.left < pb.left || o.b.right > pb.right || o.b.top < pb.top || o.b.bottom > pb.bottom).map(o => o.t);
      const f = n => all.find(o => o.name === n);
      return { n: slots.length, minCss: +minCss.toFixed(1), ov, tov, out, nt: tx.length, belt: f('slotEmpty_belt')?.texture.key, boots: f('slotEmpty_boots')?.texture.key, src: f('slotEmpty_belt')?.texture.getSourceImage().width, stone: !!f('eq_stone') };
    });
    console.log(`${VW}x${VH} 装备格 ${r.n} 个，实测点击区最小 ${r.minCss} CSS px`);
    chk(r.n === 11 && r.stone, `${VW}x${VH} 11 个装备格（含血石/腰带/靴子）`);
    chk(r.minCss >= MIN, `${VW}x${VH} 点击区最小 ${r.minCss} ≥ ${MIN}`);
    chk(!r.ov.length, `${VW}x${VH} 点击区互不重叠 ${r.ov.join(',')}`);
    chk(!r.tov.length, `${VW}x${VH} 面板文字不重叠（${r.nt} 段）${r.tov.join(',')}`);
    chk(!r.out.length, `${VW}x${VH} 文字不超面板 ${r.out.join(',')}`);
    chk(r.belt === 'ui_slot_empty_belt' && r.boots === 'ui_slot_empty_boots' && r.src === 120, `${VW}x${VH} 腰带/靴子空栏底图 @2x（${r.src}）`);
    await p.screenshot({ path: `${dir}/equip-${VW}x${VH}.png` });
    chk(w.errs.length === 0, `${VW}x${VH} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.close?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
