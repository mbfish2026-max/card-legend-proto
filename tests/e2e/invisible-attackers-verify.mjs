// 「看不到的怪在攻击我」验证：第一张图幽暗森林（farm 刷新图），手机视口；打完屏幕内的怪后让练级刷新怪刷出并追击，
// 断言：每只仇恨中（alert/chase）或在攻击距离内的怪都有卡牌视图、可见，且在相机可视范围内或有屏幕边缘指示。
// 用法：npm run build && node tests/e2e/invisible-attackers-verify.mjs [截图目录]
import { startPreview, launch, watch, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/workspace/cl-invis-shots';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
// 932×430 → 逻辑 1561；1120×400 → 逻辑 2016（上限）
const VPS = [[932, 430], [1120, 400]];
let fail = 0; const chk = (c, m) => { console.log(c ? 'ok' : 'FAIL', m); if (!c) fail++; };
const snap = p => p.evaluate(() => {
  const B = window.__game.scene.getScene('Battle'), w = B.world, h = w.hero, wv = B.cameras.main.worldView;
  const foes = w.alive('enemy').map(u => { const v = B.views.get(u.uid), ind = B.edgeMarks?.get?.(u.uid);
    return { uid: u.uid, name: u.name, x: Math.round(u.x), ai: u.ai, dist: Math.round(Math.abs(u.x - h.x)), view: !!v, vis: !!v && v.visible && v.alpha > 0.05 && v.active,
      onScreen: !!v && v.x + (v.dispOff ?? 0) > wv.x - 40 && v.x + (v.dispOff ?? 0) < wv.right + 40, edge: !!ind && ind.visible }; });
  return { hx: Math.round(h.x), hp: h.hp, cam: [Math.round(wv.x), Math.round(wv.right)], lw: window.__render?.lw, foes };
});
const sv = await startPreview(), b = await launch();
try {
  for (const [W, H] of VPS) {
    const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const ww = watch(p);
    await p.evaluateOnNewDocument(() => localStorage.clear());
    await p.goto(sv.url + '?floor=1&lv=12'); // ?floor=1 直接进入第一张图（新档战士）
    await p.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(1500);
    const tag = `inv-${W}x${H}`;
    // 打完屏幕内可见的怪（直接击杀，进入 farm 刷新队列），主角停在 x=380；刷新计时到点
    await p.evaluate(() => { const B = window.__game.scene.getScene('Battle'), w = B.world, wv = B.cameras.main.worldView;
      for (const u of w.alive('enemy')) if (u.x < wv.right) w.kill(u);
      for (const u of w.alive('enemy')) if (u.homeX < 1300) w.kill(u);
      w.hero.x = 380; B.handle(w.drainEvents()); for (const q of w.farmQueue) q.at = w.time; });
    const hp0 = await p.evaluate(() => window.__game.scene.getScene("Battle").world.hero.hp); await sleep(6000); // 刷新 → 警觉 → 追击 → 攻击
    const s = await snap(p); await p.screenshot({ path: `${dir}/${tag}-${process.env.TAG ?? "shot"}.png` });
    const att = s.foes.filter(f => f.ai === 'alert' || f.ai === 'chase' || f.dist < 425);
    console.log(`${tag} 逻辑宽 ${s.lw} 相机 x∈[${s.cam}] 主角 x=${s.hx} hp ${Math.round(hp0)}→${Math.round(s.hp)}；仇恨/近身怪 ${att.length}：` + att.map(f => `${f.name}#${f.uid} x=${f.x} ${f.ai} view=${f.view} vis=${f.vis} 屏内=${f.onScreen} 边缘=${f.edge}`).join('；'));
    chk(att.length > 0, `${tag} 复现场景：刷新怪已仇恨/近身`);
    const bad = att.filter(f => !f.vis || !(f.onScreen || f.edge));
    chk(bad.length === 0, `${tag} 无不可见攻击者（不可见 ${bad.length}）`);
    chk(ww.errs.length === 0, `${tag} 控制台 0 报错 ${ww.errs.slice(0, 3).join(' | ')}`);
    await p.close();
  }
} finally { await b.close(); sv.stop(); }
console.log(fail ? `FAIL ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
