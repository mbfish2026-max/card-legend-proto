// drop-realign：H 链 29 件正式图标在 36px 格（背包/装备栏）可读性截图。用法：npm run build && node tests/e2e/h-icons-shots.mjs [目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/drop-realign'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
const DARK = ['h_black_crystal_necklace', 'h_black_crystal_ring', 'h_ebony_necklace', 'h_ebony_bracelet', 'h_death_glove', 'h_soul_boots'];
try {
  for (const [VW, VH, mob] of [[1280, 720, false], [844, 390, true]]) {
    for (const cls of ['warrior', 'mage', 'taoist']) {
      const save = { v: 1, cls, level: 50, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
      const p = await b.newPage(); if (mob) await p.setUserAgent(UA);
      await p.setViewport({ width: VW, height: VH, isMobile: mob, hasTouch: mob, deviceScaleFactor: 2 }); const w = watch(p);
      await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
      await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
      const t = await findPos(p, 'Title', '继'); if (mob) await p.touchscreen.tap(t.x, t.y); else await p.mouse.click(t.x, t.y);
      await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1000);
      const r = await p.evaluate((dark) => { const W = window.__game.scene.getScene('Battle').world; const { ITEMS } = window.__data ?? {};
        const ids = Object.keys(W.constructor.ITEMS ?? {}).length ? [] : [];
        const all = ['h_gold_necklace','h_black_crystal_necklace','h_ebony_necklace','h_yellow_crystal_necklace','h_devil_necklace','h_amber_necklace','h_phoenix_pearl','h_blue_jade_necklace','h_leather_glove','h_steel_bracelet','h_big_bracelet','h_magic_bracelet','h_sturdy_glove','h_ebony_bracelet','h_tao_bracelet','h_power_bracelet','h_death_glove','h_gold_bracelet','h_hex_ring','h_glass_ring','h_horn_ring','h_blue_crystal_ring','h_black_crystal_ring','h_snake_eye_ring','h_pearl_ring','h_cloth_shoes','h_deer_boots','h_silk_boots','h_soul_boots'];
        W.bag.length = 0; for (const id of all) W.bag.push(W.makeItem(id));
        // 先穿暗色件（能穿的）
        for (const id of dark) { const i = W.bag.findIndex(x => x.item === id); if (i >= 0) W.equipItem(i); }
        W.recompute?.(); return { bag: W.bag.length, eq: Object.values(W.equip).filter(Boolean).map(x => x.item) }; }, DARK);
      await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(1200);
      const tex = await p.evaluate(() => { const tm = window.__game.textures; return ['h_black_crystal_necklace', 'h_soul_boots'].map(k => Object.keys(tm.list).find(x => x.includes(k)) ?? null); });
      chk(r.bag + r.eq.length === 29, `${VW}x${VH} ${cls} 背包+装备 29 件（穿 ${r.eq.join(',')}）`);
      chk(tex.every(Boolean), `${VW}x${VH} ${cls} 正式图标纹理已加载 ${tex.join(',')}`);
      await p.screenshot({ path: `${dir}/h-icons-${VW}x${VH}-${cls}.png` });
      chk(w.errs.length === 0, `${VW}x${VH} ${cls} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
      await p.close();
    }
  }
} finally { await b.close(); sv.close?.(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
