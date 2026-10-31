/** feat/balance-sys：sq-mir3 立绘接入、层长/怪量、层结构、BOSS 600s、回城卷轴 */
import { ENEMIES } from '../src/data/units';
import { ASSETS } from '../src/assets-manifest';
const { existsSync } = await import('node:' + 'fs') as any;
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };

// ---- art-wire sq-mir3 ----
{
  const ids = Object.keys(ENEMIES).filter(k => /^(boss_)?(sq|m3)_/.test(k));
  ok(ids.length === 63, `sq-mir3 怪 63 个（${ids.length}）`);
  ok(ids.every(k => ENEMIES[k].art === k && ASSETS[k] && existsSync('public/' + ASSETS[k])), 'sq-mir3 怪立绘 art=id 且文件存在');
  for (const n of [57, 58, 62, 66, 69, 73, 76, 80]) ok(existsSync('public/' + ASSETS['bg_floor' + n]) && /bg_floor(57|62|69|76|80)\.jpg$/.test(ASSETS['bg_floor' + n]), `bg_floor${n} 用第8批合层背景`);
}
// ---- 任务 A：层长 + 怪量 ----
{
  const { FLOORS, LEGACY_SPAWNS, monsterMult, PER_SCREEN_CAP, ENTRANCE_CLEAR, OLD_MAP_W, floorWidth } = await import('../src/data/world');
  const { World } = await import('../src/combat/World');
  const isB = (id: string) => ENEMIES[id]?.tier === 'boss';
  ok(FLOORS[0].widthScreens === 5, '第一张图 5 屏');
  ok(FLOORS.every(f => f.widthScreens! >= 5 && f.widthScreens! <= 10), '所有层 5–10 屏');
  let bad = '';
  FLOORS.forEach((f, i) => {
    const on = LEGACY_SPAWNS[i].filter(s => !isB(s.id)).length, nn = f.spawns.filter(s => !isB(s.id)).length;
    if (on && Math.abs(nn - on * monsterMult(f.widthScreens!)) > 1) bad += `${i}数量 `;
    if (on && (nn / on < 1.75 || nn / on > 2.55)) bad += `${i}倍率 `;
    if (LEGACY_SPAWNS[i].filter(s => isB(s.id)).length !== f.spawns.filter(s => isB(s.id)).length) bad += `${i}BOSS `;
    const W = floorWidth(f); f.spawns.filter(s => isB(s.id)).forEach(b => { if (b.x < W - OLD_MAP_W + 0 - 1 || b.x > W) bad += `${i}BOSS位 `; });
    if (f.spawns.some(s => !isB(s.id) && s.x < ENTRANCE_CLEAR)) bad += `${i}入口堆怪 `;
    for (let x0 = 0; x0 < W; x0 += 160) if (f.spawns.filter(s => !isB(s.id) && s.x >= x0 && s.x < x0 + 1280).length > PER_SCREEN_CAP) { bad += `${i}屏密度 `; break; }
  });
  ok(!bad, `普通怪 ×1.8–2.5、BOSS 数不变且在最右、入口不堆怪、每屏 ≤${PER_SCREEN_CAP}（${bad || 'ok'}）`);
  const w = new World(() => 0.5, 30, FLOORS, 'warrior'); w.loadFloor(8);
  ok(Math.abs(w.exitX - (floorWidth(FLOORS[8]) - 160)) < 1 && w.mapW === floorWidth(FLOORS[8]), '出口/地图宽按当前层宽');
  // 压力测试：一层 120 只怪，单帧 step 耗时在预算内（离屏休眠）
  const base = FLOORS[30], sp = base.spawns.filter(s => !isB(s.id)), big = { ...base, widthScreens: 10, spawns: Array.from({ length: 120 }, (_, k) => ({ id: sp[k % sp.length].id, x: 800 + k * 95 })) };
  const sw = new World(() => 0.37, 30, [big], 'warrior'); sw.loadFloor(0);
  for (let i = 0; i < 40; i++) sw.step(0.05);
  const t0 = performance.now(); for (let i = 0; i < 400; i++) sw.step(0.05); const per = (performance.now() - t0) / 400;
  ok(sw.units.filter(u => u.team === "enemy").length >= 100 && per < 4, `120 怪同层单帧 step ${per.toFixed(2)}ms < 4ms 预算`);
}
//@@MORE@@
console.log(`balance-sys 测试通过（${pass}）`);
