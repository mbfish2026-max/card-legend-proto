// feat/float-joystick：手机横屏浮动摇杆（CDP 触摸）。用法：npm run build && node tests/e2e/float-joystick-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/float-joystick'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '844x390,874x402,932x430,667x375').split(',').map(s => s.split('x').map(Number));
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const sv = await startPreview(), b = await launch();
try {
  for (const [VW, VH] of VPS) {
    const tag = `${VW}x${VH}`;
    const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); await p.setUserAgent(UA);
    await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t0 = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t0.x, t0.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && window.__game.scene.getScene('Battle').state === 'play' && window.__mhud, { timeout: 30000 }); await sleep(1500);
    // 清怪并让英雄站中间，避免卡牌/门遮挡；关自动普攻免得追怪
    await p.evaluate(() => { const s = window.__game.scene.getScene('Battle'), W = s.world; W.alive('enemy').forEach(u => { u.hp = 0; }); W.farmQueue = []; W.hero.x = 900; }); await sleep(800);
    const cdp = await p.target().createCDPSession(), T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const st = () => p.evaluate(() => { const j = document.getElementById('mh-joy'), bs = j.querySelector('.base').getBoundingClientRect();
      return { dx: window.__mhud.dx, dy: window.__mhud.dy, act: j.classList.contains('act'), bx: bs.left + bs.width / 2, by: bs.top + bs.height / 2, hang: window.__game.scene.getScene('Battle').hang.on }; });
    const onCanvas = (x, y) => p.evaluate((x, y) => document.elementFromPoint(x, y) === window.__game.canvas && !window.__game.scene.getScene('Battle').joyBlockedAt(x, y), x, y);
    // —— 1. 三个不同按下位置：底盘出现在按下点；四方向；松手停止
    const POS = [[0.12, 0.8], [0.3, 0.5], [0.44, 0.72]].map(([a, c]) => [Math.round(VW * a), Math.round(VH * c)]);
    for (const [i, [x, y]] of POS.entries()) {
      chk(await onCanvas(x, y), `${tag} 位置${i + 1} (${x},${y}) 是空地画布`);
      await T('touchStart', [{ x, y, id: 1 }]); await sleep(80); let s = await st();
      chk(s.act && Math.abs(s.bx - x) < 4 && Math.abs(s.by - y) < 4 && s.dx === 0 && s.dy === 0, `${tag} 位置${i + 1} 按下即在按下点出现底盘 (${s.bx.toFixed(0)},${s.by.toFixed(0)})，未拖动无方向`);
      const dirs = [['右', 50, 0, 1, 0], ['左', -50, 0, -1, 0], ['上', 0, -50, 0, -1], ['下', 0, 50, 0, 1]], got = [];
      for (const [n, ox, oy, ex, ey] of dirs) { await T('touchMove', [{ x: x + ox, y: y + oy, id: 1 }]); await sleep(60); s = await st(); got.push(`${n}=${s.dx},${s.dy}`); chk(s.dx === ex && s.dy === ey, `${tag} 位置${i + 1} ${n} → dx,dy=${s.dx},${s.dy}`); }
      if (i === 0) { const h0 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.hero.x); await T('touchMove', [{ x: x + 50, y, id: 1 }]); await sleep(700);
        const h1 = await p.evaluate(() => window.__game.scene.getScene('Battle').world.hero.x); chk(h1 > h0 + 5, `${tag} 右推英雄实际右移 ${h0.toFixed(0)}→${h1.toFixed(0)}`); }
      // 超半径：底盘不跟随
      await T('touchMove', [{ x: x + 150, y: y + 6, id: 1 }]); await sleep(60); s = await st();
      chk(s.dx === 1 && s.dy === 0 && Math.abs(s.bx - x) < 4, `${tag} 位置${i + 1} 拖到 150px（超半径）底盘不跟随、仍向右`);
      await T('touchMove', [{ x: x + 40, y: y - 30, id: 1 }]); await sleep(120);
      await p.screenshot({ path: `${dir}/m${tag}-pos${i + 1}.png` });
      await T('touchEnd', []); await sleep(120); s = await st();
      chk(!s.act && s.dx === 0 && s.dy === 0, `${tag} 位置${i + 1} 松手底盘消失、停止移动`);
    }
    // —— 2. 死区
    { const [x, y] = POS[1]; await T('touchStart', [{ x, y, id: 1 }]); await T('touchMove', [{ x: x + 12, y: y + 18, id: 1 }]); await sleep(60); const s = await st();
      chk(s.act && s.dx === 0 && s.dy === 0, `${tag} 死区内（12,18）无方向`); await T('touchEnd', []); await sleep(80); }
    // —— 3. 按钮区按下不触发摇杆（真触摸：药水、技能、日志；顶栏/进入/合击 只查命中元素非画布 + 未激活）
    const btns = await p.evaluate(() => {
      const q = sel => [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { sel, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; });
      return [...q('#mhud .sk').slice(0, 1), ...q('#mh-log'), ...q('#mh-top .b'), ...q('#mh-act'), ...q('#mh-comp .b'), ...q('#mh-hang'), ...q('#mh-shop'), ...q('#mh-auto'), ...q('#mh-pots .b').slice(0, 1)]; // 药水放最后（按住会弹换药层）
    });
    for (const bt of btns) {
      const tgt = await p.evaluate((x, y) => { const e = document.elementFromPoint(x, y); return e === window.__game.canvas ? 'canvas' : (e?.closest('.b,#mh-log') ? 'btn' : e?.id || e?.tagName); }, bt.x, bt.y);
      const real = /pots|sk|log/.test(bt.sel);
      if (real) { await T('touchStart', [{ x: bt.x, y: bt.y, id: 2 }]); await sleep(60); }
      const s = await st(); if (real) { await T('touchEnd', []); await sleep(150); }
      chk(tgt === 'btn' && !s.act && s.dx === 0 && bt.w >= 44 && bt.h >= 44, `${tag} ${bt.sel} 按下不触发摇杆（命中=${tgt}${real ? '，真触摸' : ''}，${bt.w.toFixed(0)}×${bt.h.toFixed(0)}）`);
    }
    await p.evaluate(() => { document.getElementById('mh-log').classList.remove('open'); document.getElementById('mh-potpop-bg')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await sleep(200);
    // —— 4. 多点触控：左手摇杆右推，右手按技能键（第二指），摇杆不受影响，技能键收到按下
    { const [x, y] = POS[1]; const sk = btns.find(b => b.sel === '#mhud .sk') ?? btns.find(b => b.sel === '#mh-act');
      await p.evaluate(() => { window.__skDown = 0; document.querySelectorAll('#mhud .sk,#mh-act').forEach(e => e.addEventListener('pointerdown', () => window.__skDown++)); });
      await T('touchStart', [{ x, y, id: 1 }]); await T('touchMove', [{ x: x + 50, y, id: 1 }]); await sleep(60);
      await T('touchStart', [{ x: x + 50, y, id: 1 }, { x: sk.x, y: sk.y, id: 2 }]); await sleep(80); let s = await st(); const n = await p.evaluate(() => window.__skDown);
      chk(s.act && s.dx === 1 && n === 1 && Math.abs(s.bx - x) < 4, `${tag} 多点：摇杆保持右推、第二指按 ${sk.sel} 收到按下（${n}），底盘不动`);
      await T('touchMove', [{ x: x, y: y - 50, id: 1 }, { x: sk.x, y: sk.y, id: 2 }]); await sleep(60); s = await st(); chk(s.dy === -1 && s.dx === 0, `${tag} 多点：右手按住时左手改向上 dy=${s.dy}`);
      await T('touchMove', [{ x, y: y - 50, id: 1 }]); // CDP：touchMove 少列的点即松开 await sleep(80); s = await st(); chk(s.act && s.dy === -1, `${tag} 多点：右手先松开，摇杆仍激活`);
      await T('touchEnd', []); await sleep(80); s = await st(); chk(!s.act && s.dx === 0 && s.dy === 0, `${tag} 多点：左手松开停止`);
      // 先按右手按钮再按左侧：左手仍可激活
      await T('touchStart', [{ x: sk.x, y: sk.y, id: 2 }]); await T('touchStart', [{ x: sk.x, y: sk.y, id: 2 }, { x, y, id: 1 }]); await T('touchMove', [{ x: sk.x, y: sk.y, id: 2 }, { x: x - 50, y, id: 1 }]); await sleep(60); s = await st();
      chk(s.act && s.dx === -1, `${tag} 多点：先按右手按钮、再按左侧，摇杆照常 dx=${s.dx}`); await T('touchEnd', []); await sleep(120); }
    // —— 5. 面板打开不响应
    { await p.evaluate(() => window.__game.scene.getScene('Battle').onKey('B')); await sleep(600); const [x, y] = POS[1];
      await T('touchStart', [{ x, y, id: 1 }]); await T('touchMove', [{ x: x + 50, y, id: 1 }]); await sleep(80); const s = await st(); await T('touchEnd', []); await sleep(80);
      const open = await p.evaluate(() => window.__game.scene.getScene('UI').panel.open);
      chk(!s.act && s.dx === 0, `${tag} 面板打开时摇杆不响应（panel.open=${open}）`);
      await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(500); }
    // —— 6. 挂机：开启后拖动摇杆 → 沿用现有「手动方向输入=接管，关挂机」；死区内按住不关
    { await p.evaluate(() => window.__game.scene.getScene('Battle').onKey('J')); await sleep(300); const on0 = (await st()).hang; const [x, y] = POS[1];
      await T('touchStart', [{ x, y, id: 1 }]); await T('touchMove', [{ x: x + 10, y, id: 1 }]); await sleep(300); const on1 = (await st()).hang;
      await T('touchMove', [{ x: x + 50, y, id: 1 }]); await sleep(300); const on2 = (await st()).hang; await T('touchEnd', []); await sleep(100);
      chk(on0 && on1 && !on2, `${tag} 挂机：开=${on0}，死区内按住仍挂机=${on1}，推出方向后挂机关闭=${!on2}`); }
    chk(w.errs.length === 0, `${tag} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
