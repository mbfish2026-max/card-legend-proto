// 手机药水栏：图标/数量数字是否完整落在药水格框内（fix/mobile-potion-clip）
// 用法：npm run build && node tests/e2e/potion-clip-verify.mjs [截图目录] [前缀]；ROOT=<dist 目录> 可指向旧构建拍修前图；NOASSERT=1 只拍图
// 断言：每格（数量 5/99/999/0）图标包围盒与数字包围盒都在「框内区」内：边框宽取 max(CSS border, border-image-width)；格 ≥44px；不压技能栏
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? '/tmp/potion-clip'; const pre = process.argv[3] ?? 'after'; mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '844x390,932x430,874x402').split(',').map(s => s.split('x').map(Number));
const DPRS = (process.env.DPRS ?? '2,3').split(',').map(Number);
const NOASSERT = !!process.env.NOASSERT;
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : (NOASSERT ? 'info' : 'FAIL'), m); if (!c && !NOASSERT) fail++; };
const sv = await startPreview(process.env.ROOT ? { root: process.env.ROOT } : {}), b = await launch();
try {
  for (const [VW, VH] of VPS) for (const dpr of DPRS) {
    const save = { v: 1, cls: 'warrior', level: 30, exp: 0, gold: 99999, pots: [5, 99, 999, 0], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: VW, height: VH, isMobile: true, hasTouch: true, deviceScaleFactor: dpr }); const w = watch(p);
    await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
    await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
    const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
    await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && document.getElementById('mhud'), { timeout: 30000 });
    await p.evaluate(() => { window.__game.scene.getScene('Battle').world.pots = [5, 99, 999, 0]; });
    await p.waitForFunction(() => document.getElementById('mhud').className.includes('sk-btn_normal'), { timeout: 10000 }).catch(() => {});
    await sleep(1200);
    const tag = `${VW}x${VH}@${dpr}x`;
    const g = await p.evaluate(() => {
      const R = b => ({ l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height });
      const sk = [...document.querySelectorAll('#mhud .sk, #mhud [data-id^="sk"], #mh-page')].filter(e => getComputedStyle(e).display !== 'none').map(e => R(e.getBoundingClientRect()));
      const pots = [...document.querySelectorAll('#mh-pots .b')].map(e => {
        const cs = getComputedStyle(e), box = R(e.getBoundingClientRect());
        const skin = cs.borderImageSource && cs.borderImageSource !== 'none';
        const iw = skin ? cs.borderImageWidth.split(' ').map(parseFloat) : [];
        const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k, i) => Math.max(parseFloat(cs['border' + k + 'Width']), iw.length ? iw[[0, 1, 2, 3][i] % iw.length] ?? iw[0] : 0));
        const inner = { l: box.l + bw[3], t: box.t + bw[0], r: box.r - bw[1], b: box.b - bw[2] };
        // 图标：background-size 相对 padding 区居中
        const pl = box.l + parseFloat(cs.borderLeftWidth), pt = box.t + parseFloat(cs.borderTopWidth), pw = box.w - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth), ph = box.h - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
        const [sx, sy = sx] = cs.backgroundSize.split(' '); const sz = (v, L) => v.endsWith('%') ? parseFloat(v) / 100 * L : parseFloat(v);
        const iW = sz(sx, pw), iH = sy === 'auto' ? iW : sz(sy, ph);
        const icon = { l: pl + (pw - iW) / 2, t: pt + (ph - iH) / 2, r: pl + (pw + iW) / 2, b: pt + (ph + iH) / 2 };
        // 数字：文字节点的实际字形框
        const tn = [...e.querySelectorAll('*'), e].flatMap(n => [...n.childNodes]).find(n => n.nodeType === 3 && n.textContent.trim());
        let num = null, txt = ''; if (tn) { const rg = document.createRange(); rg.selectNodeContents(tn); num = R(rg.getBoundingClientRect()); txt = tn.textContent; }
        return { box, inner, bw, icon, num, txt, skin: !!skin };
      });
      const all = pots.map(q => q.box); const u = { l: Math.min(...all.map(q => q.l)), t: Math.min(...all.map(q => q.t)), r: Math.max(...all.map(q => q.r)), b: Math.max(...all.map(q => q.b)) };
      return { pots, sk, u };
    });
    const ins = (a, c, e = 0.5) => a && a.l >= c.l - e && a.t >= c.t - e && a.r <= c.r + e && a.b <= c.b + e;
    const ov = (a, c) => a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
    chk(g.pots.length === 4 && g.pots.every(q => q.skin), `${tag} 4 格且 B6 框已启用 bw=${g.pots[0]?.bw.join('/')}`);
    chk(g.pots.every(q => q.box.w >= 44 && q.box.h >= 44), `${tag} 药水点击区 ≥44px ${g.pots.map(q => q.box.w.toFixed(0)).join(' ')}`);
    chk(g.pots.every(q => ins(q.icon, q.inner)), `${tag} 图标完整在框内 icon=${(g.pots[0].icon.r - g.pots[0].icon.l).toFixed(1)}px inner=${(g.pots[0].inner.r - g.pots[0].inner.l).toFixed(1)}px`);
    chk(g.pots.every(q => Math.abs((q.icon.l + q.icon.r) / 2 - (q.box.l + q.box.r) / 2) < 1 && Math.abs((q.icon.t + q.icon.b) / 2 - (q.box.t + q.box.b) / 2) < 1), `${tag} 图标居中`);
    chk(g.pots.every(q => ins(q.num, q.inner)), `${tag} 数字（${g.pots.map(q => q.txt).join('/')}）完整在框内 ${g.pots.map(q => q.num ? `${(q.num.r - q.inner.r).toFixed(1)},${(q.num.b - q.inner.b).toFixed(1)}` : 'none').join(' ')}`);
    chk(g.pots.map(q => q.txt).join('/') === '5/99/999/0', `${tag} 数量渲染正确`);
    chk(g.sk.length > 0 && g.pots.every(q => g.sk.every(o => !ov(q.box, o))), `${tag} 不挤占技能栏`);
    const m = 10, clip = { x: Math.max(0, g.u.l - m), y: Math.max(0, g.u.t - m), width: g.u.r - g.u.l + 2 * m, height: Math.min(VH, g.u.b + m) - Math.max(0, g.u.t - m), scale: 2 };
    await p.screenshot({ path: `${dir}/${pre}-${tag}.png`, clip });
    chk(w.errs.length === 0, `${tag} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
