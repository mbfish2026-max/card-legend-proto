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
// ---- 任务 B：层结构 / BOSS 600s 刷新 / 防刷 ----
{
  const { FLOORS } = await import('../src/data/world');
  const { World, BOSS_RESPAWN } = await import('../src/combat/World');
  const isB = (id: string) => ENEMIES[id]?.tier === 'boss';
  const bi = FLOORS.findIndex((f, i) => i > 0 && f.boss && f.spawns.some(s => isB(s.id)) && !/沃玛/.test(f.name));
  const w = new World(() => 0.5, 30, FLOORS, 'warrior'); w.loadFloor(bi);
  const foes = () => w.units.filter(u => u.team === 'enemy' && u.alive), nNorm = foes().filter(u => u.tier !== 'boss').length;
  const boss = foes().find(u => u.tier === 'boss')!; ok(!!boss, `BOSS 层 ${bi} 首次进入刷 BOSS`);
  ok(BOSS_RESPAWN === 600, 'BOSS 刷新 600 秒');
  w.damage(boss, 1e9, w.hero!); w.step(0.05);
  ok(w.bossCdLeft(bi) === 600, `击杀后冷却 600（${w.bossCdLeft(bi)}）`);
  foes().slice(0, 3).forEach(u => w.damage(u, 1e9, w.hero!)); w.step(0.05);
  w.loadFloor(bi);
  ok(!foes().some(u => u.tier === 'boss'), '冷却中重进不刷 BOSS（防反复进出刷首领）');
  ok(foes().length === nNorm, `重进普通怪全量重刷（${foes().length}/${nNorm}）`);
  w.time += 300; const sv = w.toSave(); ok(sv.bossCd![bi] === 300, `存档写剩余冷却（${sv.bossCd![bi]}）`);
  const w2 = new World(() => 0.5, 30, FLOORS, 'warrior', JSON.parse(JSON.stringify(sv)));
  w2.loadFloor(bi); ok(!w2.units.some(u => u.tier === 'boss'), '读档后冷却继续（存读档不能重置 BOSS）');
  w2.time += 301; w2.loadFloor(bi); ok(w2.units.some(u => u.tier === 'boss' && u.alive), '冷却结束后重进刷新 BOSS');
  const old = { ...sv }; delete (old as any).bossCd; const w3 = new World(() => 0.5, 30, FLOORS, 'warrior', old as any);
  w3.loadFloor(bi); ok(w3.units.some(u => u.tier === 'boss'), '旧档（无 bossCd）兼容：无冷却');
  // 冷却中出口不封印：站到出口直接进下一层
  const w4 = new World(() => 0.5, 30, FLOORS, 'warrior'); w4.loadFloor(bi); w4.damage(w4.units.find(u => u.tier === 'boss')!, 1e9, w4.hero!); w4.step(0.05);
  w4.loadFloor(bi); w4.units = w4.units.filter(u => u.isHero); w4.hero!.x = w4.exitX; w4.step(0.05);
  ok(w4.floorIndex !== bi, '冷却中出口开启（不卡关）');
  // 左端入口：返回上一层
  const w5 = new World(() => 0.5, 30, FLOORS, 'warrior'); w5.loadFloor(2); w5.units = w5.units.filter(u => u.isHero);
  ok(w5.prevFloor() && w5.floorIndex < 2, '左端起点「返回上一层」');
}
// ---- 任务 C：回城卷轴 ----
{
  const { FLOORS } = await import('../src/data/world');
  const { World, RECALL_CAST, STARTER_SCROLLS } = await import('../src/combat/World');
  const { GENERAL_GOODS } = await import('../src/data/towns');
  const cnt = (w: any) => w.bag.filter((b: any) => b.item === 'return_scroll').length;
  ok(GENERAL_GOODS.some((g: any) => g.item === 'return_scroll'), '杂货商出售回城卷');
  const w = new World(() => 0.5, 10, FLOORS, 'mage'); w.grantStarterKit(); ok(cnt(w) === STARTER_SCROLLS && STARTER_SCROLLS === 3, '新角色赠送 3 张回城卷');
  const old = w.toSave(); old.bag = []; const wo = new World(() => 0.5, 10, FLOORS, 'mage', old); ok(cnt(wo) === 0, '旧档不补发');
  w.loadFloor(3); w.units = w.units.filter(u => u.isHero);
  ok(w.useRecallScroll().includes('读条'), '野外使用 → 读条');
  w.hero!.x += 20; w.step(0.05); ok(!w.recall && cnt(w) === 3 && !w.town, '移动打断，不消耗');
  w.useRecallScroll(); w.hero!.hp -= 5; w.step(0.05); ok(!w.recall && cnt(w) === 3, '受伤打断，不消耗');
  w.useRecallScroll(); w.cast(0, w.skills.map(() => 0)); ok(!w.recall && cnt(w) === 3, '施法打断，不消耗');
  w.useRecallScroll(); for (let t = 0; t < RECALL_CAST + 0.2; t += 0.05) w.step(0.05);
  ok(!!w.town && cnt(w) === 2, `读条 ${RECALL_CAST}s 完成回城并消耗 1 张（${w.town}）`);
  const bi = w.bag.findIndex(b => b.item === 'return_scroll'); w.leaveTown(); w.units = w.units.filter(u => u.isHero);
  ok(w.useConsumable(w.bag.findIndex(b => b.item === 'return_scroll')).includes('读条') && bi >= 0, '背包点击使用同样读条');
  const we = new World(() => 0.5, 10, FLOORS, 'warrior'); we.bag = []; ok(we.useRecallScroll().startsWith('没有回城卷'), '无卷提示购买');
}
// ---- 阶段 3：装备需求对齐 ----
{
  const { ITEMS } = await import('../src/data/items');
  const { TIER_REQ, EQUIP_META } = await import('../src/data/equip-official');
  ok(ITEMS.dragon_sword.req === 34, '屠龙 34 = 官方需求'); ok(ITEMS.armor.req === 12 && ITEMS.gold_ring.req === 9, '重盔甲/金戒指 暂保留 12/9（待决定，见 items.ts 注释）');
  ok(['dragon_sword'].every(id => EQUIP_META[id]?.need?.kind !== 'level' || EQUIP_META[id].need.v === ITEMS[id].req), '与 equip-official 官方 need 一致');
  for (const [set, t] of [['woma', 'woma'], ['zuma', 'zuma'], ['chiyue', 'chiyue']] as const)
    ok(Object.values(ITEMS).filter(it => it.set === set).every(it => it.req === TIER_REQ[t]), `自创${set}套 req = TIER_REQ ${TIER_REQ[t]}`);
  const { World: W3, SaveData: _S } = await import('../src/combat/World') as any; const { FLOORS: F3 } = await import('../src/data/world');
  const w = new W3(() => 0.5, 20, F3, 'warrior'); const it = w.makeItem('dragon_sword'); it.req = 15; w.bag.push(it);
  const w2 = new W3(() => 0.5, 1, F3, 'warrior', JSON.parse(JSON.stringify(w.toSave())));
  ok(w2.bag.some((b: any) => b.item === 'dragon_sword' && b.req === 15), '旧存档：已有实例 req 不追溯');
}
// ---- 阶段 4：drop-plan ----
{
  const { ITEMS } = await import('../src/data/items'); const { FLOOR_TARGET_LV } = await import('../src/data/balance');
  const { DROP_REMOVED, minFloorLv, CAP_BOSS, CAP_GEAR, CAP_NORMAL, DROPS_BEFORE } = await import('../src/data/drop-plan'); const { FLOORS: F4 } = await import('../src/data/world');
  const gear = (id: string) => (ENEMIES[id].drops ?? []).filter(d => ITEMS[d.item]?.slot);
  ok(Object.keys(ENEMIES).every(id => { const L = minFloorLv(id); return L === undefined || gear(id).every(d => (ITEMS[d.item]?.req ?? 0) <= L + (ENEMIES[id].tier !== 'boss' ? CAP_NORMAL : ITEMS[d.item]?.slot === 'weapon' ? CAP_BOSS : CAP_GEAR)); }), '所有怪：装备需求 ≤ 最低出现层目标等级 + 6/8');
  ok(!gear('tree_demon').some(d => ['longwen', 'caijue', 'wujigun', 'jingzhongyue'].includes(d.item)) && DROPS_BEFORE.tree_demon.some(d => d.item === 'longwen'), '万年树妖不再掉 龙纹/裁决/无极/井中月（原千年树妖表）');
  ok(!gear('skeleton_lord').some(d => d.item === 'pohun'), '骷髅精灵不掉破魂');
  ok(gear('boss_chulong').some(d => d.item === 'longwen') || gear('boss_white_boar').some(d => d.item === 'longwen'), '蜈蚣洞/石墓 BOSS 仍掉龙纹剑');
  const src = new Set(Object.values(ENEMIES).flatMap(u => (u.drops ?? []).map(d => d.item)));
  for (const id of ['iron_ring', 'medium_armor', 'shengzhan_helm', 'shengzhan_ring', 'fashen_helm', 'fashen_bracelet', 'set_zuma_boots', 'set_chiyue_ring']) ok(src.has(id), `${ITEMS[id].name} 有掉落来源`);
  for (const n of ['保卫家园', '卧龙山庄', '雷炎洞穴', '火龙神殿', '魔龙血域']) { const f = F4.findIndex(x => x.name === n);
    ok(F4[f].spawns.some(s => gear(s.id).some(d => (ITEMS[d.item]?.req ?? 0) >= FLOOR_TARGET_LV[f] - 15)), `${n} 有本段装备掉落`); }
  ok(Object.keys(DROP_REMOVED).length > 0, `越级封顶移除 ${Object.keys(DROP_REMOVED).length} 只怪的条目`);
}
{ const { renderDropPlan } = await import('../src/data/drop-plan-doc'); const { readFileSync } = await import('node:' + 'fs') as any;
  ok(readFileSync('docs/drop-plan.md', 'utf8') === renderDropPlan(), 'docs/drop-plan.md 与数据一致（npm run gen:drops）'); }
//@@MORE@@
console.log(`balance-sys 测试通过（${pass}）`);
