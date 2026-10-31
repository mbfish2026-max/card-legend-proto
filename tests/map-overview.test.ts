// 地图总览 + 位置条：层序/总层数/推荐等级/怪物种类/出口名称；位置条高亮与文案（含最后一层、侧线、第 1 层回村）
import { overview, posBar, groupTotal, leftEnd, rightEnd, NEAR } from '../src/data/mapOverview';
import { FLOORS, FLOOR_ORDER, SIDE_FLOORS, WORLD, floorWidth, nextFloorOf } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { ENEMIES } from '../src/data/units';
let n = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } n++; console.log('ok ' + m); };
const o0 = overview(0);
ok(o0.name === FLOORS[0].name && o0.main === `主线第 1 / ${FLOOR_ORDER.length} 张`, `层序 ${o0.main}`);
ok(o0.recLevel === FLOOR_TARGET_LV[0], '推荐等级取 FLOOR_TARGET_LV');
ok(o0.bosses.includes(ENEMIES.wolf_king.name) && o0.monsters.includes('鸡') && !o0.monsters.includes(ENEMIES.wolf_king.name), `怪物种类 ${o0.monsters} / BOSS ${o0.bosses}`);
ok(new Set(o0.monsters).size === o0.monsters.length, '怪物名去重');
ok(/小村|回城/.test(o0.left) && o0.right.includes(FLOORS[nextFloorOf(0)].name), `出口 ${o0.left} | ${o0.right}`);
// 多层洞穴：兽人古墓（白骨墓穴=一层，下标 13/14 为二/三层）
ok(groupTotal('shouren') === 3, '兽人古墓共 3 层');
ok(overview(14).layer.endsWith('第 3 / 3 层') && overview(4).layer.endsWith('第 1 / 3 层'), `多层 N/总 ${overview(4).layer} ${overview(14).layer}`);
ok(overview(14).left.includes(FLOORS[13].name), '三层左端回二层');
ok(FLOORS.every((f, i) => { const o = overview(i); return o.recLevel >= 1 && o.name && o.left && o.right; }), '0–82 层全部可生成总览');
// 最后一层
const last = FLOOR_ORDER[FLOOR_ORDER.length - 1];
ok(rightEnd(last).to === 'end' && overview(last).right.includes('已到尽头'), '最后一层右端：已到尽头');
const W = (i: number) => floorWidth(FLOORS[i]), ex = (i: number) => W(i) - WORLD.exitMargin;
let p = posBar(last, ex(last) - 100); ok(p.near === 'right' && p.hint === '前方：已到尽头', '最后一层贴近终点提示');
p = posBar(0, ex(0) - NEAR + 1); ok(p.near === 'right' && p.hint === `前方：下一张地图 ${FLOORS[nextFloorOf(0)].name}`, p.hint);
p = posBar(0, ex(0) - NEAR - 50); ok(p.near === null && p.hint === '', '中段无高亮');
p = posBar(0, WORLD.heroStartX + 10); ok(p.near === 'left' && p.hint.startsWith('后方出口：回小村'), p.hint);
p = posBar(14, WORLD.heroStartX); ok(p.near === 'left' && p.hint === `后方出口：回 ${FLOORS[13].name}`, p.hint);
const side = SIDE_FLOORS[0]; p = posBar(side, ex(side)); ok(p.near === 'right' && p.hint.startsWith('前方：肃清后返回'), `侧线 ${p.hint}`);
p = posBar(0, W(0) / 2); ok(Math.abs(p.hero - 0.5) < 1e-9 && p.boss.length === 1 && p.boss[0] > 0.8 && p.boss[0] < 1, '主角/BOSS 比例（per-floor 宽度）');
ok(leftEnd(0).to === 'town', '第 1 层左端回城镇');
console.log(`地图总览测试全部通过 ${n} 项`);
