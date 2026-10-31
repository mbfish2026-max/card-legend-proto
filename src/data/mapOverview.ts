// 地图总览 + 位置条（feat/balance-sys）：纯数据，界面在 Hud（桌面）/ MobileHud（手机）。docs/map-overview.md
import { FLOORS, FLOOR_ORDER, FLOOR_GROUP, SIDE_FLOORS, WORLD, floorNo, floorWidth, groupOf, nextFloorOf, prevFloorOf, Floor } from './world';
import { FLOOR_TARGET_LV } from './balance';
import { ENEMIES } from './units';
import { REGIONS } from './map';
import { TOWNS, returnTownOf } from './towns';
const townName = (i: number) => TOWNS[returnTownOf(i)]?.name.replace(/（.*）/, '') ?? '城镇';
const depthOf = (i: number) => FLOORS[i]?.depth ?? FLOOR_GROUP[i]?.depth;
/** 图群总层数 = 同组各层 depth 最大值（地图组数据 Floor.group/depth + FLOOR_GROUP） */
export function groupTotal(g: string): number { let m = 0; FLOORS.forEach((_, j) => { if (groupOf(j) === g) m = Math.max(m, depthOf(j) ?? 0); }); return m; }
/** 左端：传送门回上一层 / 区域首层与第 1 层回城镇（与 World.backGate 一致） */
export function leftEnd(i: number): { to: 'floor' | 'town'; index: number; name: string } {
  const p = i > 0 && !REGIONS.some(r => r.floors[0] === i) ? prevFloorOf(i) : -1;
  return p >= 0 ? { to: 'floor', index: p, name: FLOORS[p].name } : { to: 'town', index: -1, name: townName(i) };
}
/** 右端：下一层 / 侧线回城 / 最后一层 */
export function rightEnd(i: number): { to: 'floor' | 'town' | 'end'; index: number; name: string } {
  if (SIDE_FLOORS.includes(i)) return { to: 'town', index: -1, name: townName(i) };
  const n = nextFloorOf(i); return n >= 0 ? { to: 'floor', index: n, name: FLOORS[n].name } : { to: 'end', index: -1, name: '' };
}
export interface Overview { name: string; main: string; layer: string; recLevel: number; bosses: string[]; elites: string[]; monsters: string[]; left: string; right: string }
export function overview(i: number, f: Floor = FLOORS[i]): Overview {
  const g = groupOf(i), d = depthOf(i), side = SIDE_FLOORS.includes(i);
  const names = (t: (tier: string) => boolean) => [...new Set(f.spawns.filter(s => ENEMIES[s.id] && t(ENEMIES[s.id].tier)).map(s => ENEMIES[s.id].name))];
  const L = leftEnd(i), R = rightEnd(i);
  return {
    name: f.name,
    main: side ? '侧线地图（不在主线顺序）' : FLOOR_ORDER.includes(i) ? `主线第 ${floorNo(i)} / ${FLOOR_ORDER.length} 张` : `第 ${floorNo(i)} 张`,
    layer: g && d ? `${f.sub?.replace(/\s*[A-Z]\d+$/, '') ?? f.name}：第 ${d} / ${groupTotal(g)} 层` : '单层地图',
    recLevel: FLOOR_TARGET_LV[i] ?? 1,
    bosses: names(t => t === 'boss'), elites: names(t => t === 'elite'), monsters: names(t => t !== 'boss' && t !== 'elite'),
    left: L.to === 'floor' ? `左端传送门：回上一层「${L.name}」` : i === 0 ? `左端：回小村「${L.name}」` : `左端：回城「${L.name}」`,
    right: R.to === 'floor' ? `右端出口：下一层「${R.name}」` : R.to === 'town' ? `右端出口：侧线肃清后返回「${R.name}」` : '右端：已到尽头（最后一张地图）',
  };
}
/** 「≤1 屏」判定距离 */
export const NEAR = WORLD.screenW;
export interface PosBar { hero: number; boss: number[]; near: 'left' | 'right' | null; hint: string }
/** 位置条：各点为层宽内 0–1 比例；贴近（≤1 屏）出口/终点时高亮并给出提示 */
export function posBar(i: number, heroX: number, f: Floor = FLOORS[i]): PosBar {
  const W = floorWidth(f), exitX = W - WORLD.exitMargin, startX = WORLD.heroStartX;
  const boss = f.spawns.filter(s => ENEMIES[s.id]?.tier === 'boss').map(s => s.x / W);
  const R = rightEnd(i), L = leftEnd(i);
  let near: PosBar['near'] = null, hint = '';
  if (exitX - heroX <= NEAR) { near = 'right'; hint = R.to === 'floor' ? `前方：下一张地图 ${R.name}` : R.to === 'town' ? `前方：肃清后返回 ${R.name}` : '前方：已到尽头'; }
  else if (heroX - startX <= NEAR) { near = 'left'; hint = L.to === 'floor' ? `后方出口：回 ${L.name}` : `后方出口：回${i === 0 ? '小村' : '城'} ${L.name}`; }
  return { hero: Math.max(0, Math.min(1, heroX / W)), boss, near, hint };
}
