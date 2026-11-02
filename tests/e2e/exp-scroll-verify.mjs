// feat/exp-scroll：购买 → 使用 → 倒计时图标 → 击杀经验 ×5 → 暂停不扣 → 存档 → 到期恢复；电脑 1280×720（鼠标）+ 手机 844×390/874×402/932×430（触屏）
// 用法：npm run build && node tests/e2e/exp-scroll-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep, findPos } from './lib.mjs';
import { mkdirSync } from 'node:fs';
const dir = process.argv[2] ?? 'docs/shots/exp-scroll'; mkdirSync(dir, { recursive: true });
const UA_M = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VPS = (process.env.VPS ?? '1280x720d,844x390,874x402,932x430').split(',').map(s => [...s.replace('d', '').split('x').map(Number), s.endsWith('d')]);
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const ov = (a, c) => a.l < c.r - 0.5 && c.l < a.r - 0.5 && a.t < c.b - 0.5 && c.t < a.b - 0.5;
const sv = await startPreview(), b = await launch();
const HITS = () => { const cv = window.__game.canvas.getBoundingClientRect(), R = window.__render ?? { lw: 1280, ox: 0 }, k = cv.width / R.lw, out = [];
  const walk = o => { (o.list ?? []).forEach(walk); if (o.input?.enabled && o.visible && o.input.hitArea?.width) { const m = o.getWorldTransformMatrix(), ha = o.input.hitArea, sx = m.scaleX ?? 1;
    const x0 = m.tx + (ha.x - o.displayOriginX) * sx, y0 = m.ty + (ha.y - o.displayOriginY) * sx;
    out.push({ n: o.name || o.type, sku: o.getData?.('sku') ?? null, tab: o.getData?.('lfTab') ?? null, item: !!o.getData?.('hasItem'), slot: !!o.getData?.('slot'), l: cv.left + (x0 + (R.ox ?? 0)) * k, t: cv.top + y0 * cv.height / 720, r: cv.left + (x0 + (R.ox ?? 0) + ha.width * sx) * k, b: cv.top + (y0 + ha.height * sx) * cv.height / 720 }); } };
  window.__game.scene.getScene('UI').children.list.forEach(walk); return out; };
const bal = p => p.evaluate(() => JSON.parse(localStorage.getItem('fcl_lingfu_v1') ?? '{}').balance);
let DESK = false; const tap = (p, x, y) => DESK ? p.mouse.click(x, y) : p.touchscreen.tap(x, y);
const tapC = (p, h) => tap(p, (h.l + h.r) / 2, (h.t + h.b) / 2);
const idle = p => p.waitForFunction(() => window.__game.scene.getScene('UI').input._pendingInsertion.length === 0, { timeout: 20000 }).catch(() => {});
const W = 'window.__game.scene.getScene("Battle").world';
const badge = p => p.evaluate(() => { const e = document.getElementById('exp-badge'); if (!e || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, txt: e.textContent }; });
// 杀一只指定怪，返回本次角色经验增量（经 exp 事件；不升级）
const killOne = (p, id) => p.evaluate((id) => { const w = window.__game.scene.getScene('Battle').world; const e = w.units.find(u => u.alive && u.team !== 'ally' && u.id === id && !u.isHero); if (!e) return null;
  w.exp = 0; const x0 = w.exp; e.hp = 0; w.kill(e); return w.exp - x0; }, id);
async function open(VW, VH) {
  const uaM = VW < 1000, save = { v: 1, cls: 'warrior', level: 8, exp: 0, gold: 99999, pots: [5, 3, 2, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] };
  const p = await b.newPage(); if (uaM) await p.setUserAgent(UA_M);
  await p.setViewport({ width: VW, height: VH, isMobile: uaM, hasTouch: !DESK, deviceScaleFactor: uaM ? 2 : 1 }); const w = watch(p);
  await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, save);
  await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const t = await findPos(p, 'Title', '继'); await tap(p, t.x, t.y);
  await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1800);
  return { p, w, mobile: await p.evaluate(() => !!document.getElementById('mhud')) };
}
try {
  for (const [VW, VH, desk] of VPS) {
    DESK = desk; const tag = `${VW}x${VH}${desk ? '-desktop' : ''}`;
    const { p, w, mobile } = await open(VW, VH);
    // 准备 3 只同种怪（基准 / ×5 / 到期后），远离英雄、不打扰；英雄锁血
    const mon = await p.evaluate(() => { const w = window.__game.scene.getScene('Battle').world, h = w.hero; h.maxHp = h.hp = 1e7;
      const id = w.alive('enemy').find(u => u.tier !== 'boss')?.id; for (let i = 0; i < 3; i++) w.spawnFoe(id, Math.min(w.mapW - 60, h.x + 1600 + i * 60), h.y); return id; });
    const base = await killOne(p, mon); chk(base > 0, `${tag} 基准击杀经验 ${base}（怪 ${mon}）`);
    // 1) 商城：成长页 → 5倍经验卷轴 → 确认购买
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('lingfu')); await sleep(600); await idle(p);
    let hs = await p.evaluate(HITS); const grow = hs.find(h => h.n === 'lfTab' && h.tab === 'grow'); if (grow) { await tapC(p, grow); await sleep(500); await idle(p); }
    hs = await p.evaluate(HITS); const bb = hs.find(h => h.n === 'lfBuy' && h.sku === 'exp_scroll'); chk(!!bb, `${tag} 成长页有 5倍经验卷轴 购买键`);
    chk(bb && Math.min(bb.r - bb.l, bb.b - bb.t) >= (VW <= 844 ? 36 : 44) - 0.5, `${tag} 购买键点击区 ${bb ? Math.round(bb.r - bb.l) + '×' + Math.round(bb.b - bb.t) : '-'}`);
    await p.screenshot({ path: `${dir}/${tag}-shop.png` });
    if (bb) { await tapC(p, bb); await sleep(500); await idle(p); }
    hs = await p.evaluate(HITS); const okb = hs.find(h => h.n === 'lfOk'); chk(!!okb, `${tag} 确认框`);
    await p.screenshot({ path: `${dir}/${tag}-confirm.png` });
    if (okb) { await tapC(p, okb); await sleep(600); }
    chk(await bal(p) === 4700 && await p.evaluate(`${W}.bag.some(i => i.item === 'exp_scroll' && i.bound)`), `${tag} 扣 300 灵符（余 ${await bal(p)}），背包得到卷轴`);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(300);
    // 2) 背包：提示 + 使用
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.toggle('bag')); await sleep(700); await idle(p);
    hs = await p.evaluate(HITS); const sl = hs.filter(h => h.slot && h.item).sort((a, c) => c.l - a.l)[0]; chk(!!sl, `${tag} 背包里找到卷轴格`);
    if (sl) {
      if (DESK) await p.mouse.move((sl.l + sl.r) / 2, (sl.t + sl.b) / 2); else await tapC(p, sl);
      await sleep(500);
      const tip = await p.evaluate(() => { const out = []; const walk = o => { if (o.type === 'Text' && o.visible) out.push(o.text); (o.list ?? []).forEach(walk); }; window.__game.scene.getScene('UI').children.list.forEach(walk); return out.join('\n'); });
      chk(/击杀经验 ×5/.test(tip) && /上限 8 小时/.test(tip), `${tag} 背包提示含倍率/上限`);
      await p.screenshot({ path: `${dir}/${tag}-bag-tip.png` });
      if (!(await p.evaluate(`${W}.expScrollLeft`) > 0)) { await tapC(p, sl); await sleep(500); }
      if (!(await p.evaluate(`${W}.expScrollLeft`) > 0)) { await tapC(p, sl); await sleep(500); }
    }
    const L0 = await p.evaluate(`${W}.expScrollLeft`); chk(L0 > 7190 && L0 <= 7200, `${tag} 使用 → 剩余 ${L0.toFixed(1)}s`);
    chk(!(await p.evaluate(`${W}.bag.some(i => i.item === 'exp_scroll')`)), `${tag} 卷轴已消耗`);
    await p.screenshot({ path: `${dir}/${tag}-bag-used.png` });
    // 暂停（面板开着）不扣
    const a1 = await p.evaluate(`${W}.expScrollLeft`); await sleep(1500); const a2 = await p.evaluate(`${W}.expScrollLeft`);
    chk(a1 === a2, `${tag} 面板打开（暂停）不计时 ${a1.toFixed(2)}→${a2.toFixed(2)}`);
    chk(!(await badge(p)), `${tag} 面板打开时倒计时图标隐藏`);
    await p.evaluate(() => window.__game.scene.getScene('UI').panel.close()); await sleep(1500);
    // 3) 倒计时图标
    const bg = await badge(p); chk(!!bg && /经验×5/.test(bg.txt) && /(1:59|2:00):\d\d/.test(bg.txt), `${tag} 倒计时图标显示 「${bg?.txt}」`);
    const b1 = await p.evaluate(`${W}.expScrollLeft`); await sleep(2000); const b2 = await p.evaluate(`${W}.expScrollLeft`);
    chk(b1 - b2 > 0.2 && b1 - b2 < 3, `${tag} 游戏运行时扣减 ${(b1 - b2).toFixed(2)}s/2s（软渲染帧率低 + dt 上限 0.05，游戏时间慢于真实时间属预期）`);
    if (bg) {
      chk(bg.l >= 0 && bg.t >= 0 && bg.r <= VW && bg.b <= VH, `${tag} 图标在屏幕内`);
      let others;
      if (mobile) {
        others = await p.evaluate(() => { const vis = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
          return [...document.querySelectorAll('#mh-act, #mh-auto, #mh-page, #mh-pots .b, #mh-pots > *, #mh-comp .b, #mhud .sk, #mh-top .b, #mh-joy .hint, #mh-log, #mh-floor, #mh-shop, #mh-hang, #mhud .ctl')].filter(vis).map(e => { const r = e.getBoundingClientRect(); return { n: e.id || e.className, l: r.left, t: r.top, r: r.right, b: r.bottom }; }); });
        chk(bg.r - bg.l >= 44 - 0.5 && bg.b - bg.t >= 44 - 0.5, `${tag} 图标点击区 ${(bg.r - bg.l).toFixed(1)}×${(bg.b - bg.t).toFixed(1)} ≥44`);
        chk(bg.l >= VW / 2, `${tag} 图标在右半屏（浮动摇杆触发区为左半屏画布，DOM 元素本身也不触发摇杆） l=${bg.l.toFixed(0)}`);
      } else {
        others = (await p.evaluate(HITS)).filter(h => (h.r - h.l) < VW * 0.8);
        const pot = await p.evaluate(() => { const r = window.__game.scene.getScene('UI').hud?.potBar; return null; });
        void pot;
      }
      const hit = others.filter(o => ov(bg, o)); chk(hit.length === 0, `${tag} 图标不与按钮/药水栏/技能重叠 ${JSON.stringify(hit.map(h => h.n))}`);
    }
    await p.screenshot({ path: `${dir}/${tag}-hud.png` });
    // 图标提示：悬停/点按
    if (bg) { if (DESK) await p.mouse.move((bg.l + bg.r) / 2, (bg.t + bg.b) / 2); else await p.touchscreen.tap((bg.l + bg.r) / 2, (bg.t + bg.b) / 2); await sleep(400); }
    const tp = await p.evaluate(() => { const e = document.getElementById('exp-tip'); return e && getComputedStyle(e).display !== 'none' ? e.textContent : null; });
    chk(!!tp && /击杀经验 ×5/.test(tp), `${tag} 图标${DESK ? '悬停' : '点按'}显示说明`);
    await p.screenshot({ path: `${dir}/${tag}-badge-tip.png` });
    if (DESK) await p.mouse.move(10, 10); else if (bg) await p.touchscreen.tap((bg.l + bg.r) / 2, (bg.t + bg.b) / 2);
    chk(await p.evaluate(`${W}.hero.alive`) && await p.evaluate(() => window.__game.scene.getScene('Battle').state) === 'play', `${tag} 点按图标不影响战斗`);
    // 4) 击杀经验 ×5
    const x5 = await killOne(p, mon); chk(x5 === base * 5, `${tag} 击杀经验 ×5：${base} → ${x5}`);
    // 5) 存档
    await p.evaluate(() => window.__game.scene.getScene('Battle').saveGame()); const sec = await p.evaluate(() => JSON.parse(localStorage.getItem('fcl_save_v1')).expScrollSec);
    chk(sec > 7000 && sec <= 7200, `${tag} 存档 expScrollSec=${sec}`);
    // 6) 到期
    await p.evaluate(`${W}.expScrollLeft = 0.4`);
    await p.waitForFunction(() => { const e = document.getElementById('exp-end'); return e && getComputedStyle(e).display !== 'none'; }, { timeout: 8000 }).catch(() => {});
    const end = await p.evaluate(() => { const e = document.getElementById('exp-end'); return e && getComputedStyle(e).display !== 'none' ? e.textContent : null; });
    chk(await p.evaluate(`${W}.expScrollLeft`) === 0 && !!end && !(await badge(p)), `${tag} 到期：图标消失，提示「${end}」`);
    await p.screenshot({ path: `${dir}/${tag}-expired.png` });
    const x1 = await killOne(p, mon); chk(x1 === base, `${tag} 到期后击杀经验恢复 ${x1}`);
    chk(w.errs.length === 0, `${tag} 无 JS 错误 ${w.errs.slice(0, 2).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'exp-scroll e2e ALL OK'); process.exit(fail ? 1 : 0);
