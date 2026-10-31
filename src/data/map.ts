import { FLOORS } from './world';
import { ENEMIES } from './units';

/** 世界地图区域（按传奇地名分区；坐标为世界地图面板内位置） */
export interface Region { id: string; name: string; floors: number[]; x: number; y: number; icon: string }
/** R11 按原版地理：比奇省（新手村/兽人古墓/比奇矿区）、沃玛森林（含沃玛寺庙）、盟重省祖玛寺庙、白日门赤月峡谷 */
export const REGIONS: Region[] = [
  { id: 'bichi', name: '比奇省', floors: [0, 3, 4], x: 300, y: 430, icon: 'map_node_bichi' },
  { id: 'woma', name: '沃玛森林', floors: [1, 2, 5], x: 560, y: 320, icon: 'map_node_woma' },
  { id: 'zuma', name: '盟重·祖玛寺庙', floors: [6], x: 820, y: 250, icon: 'map_node_zuma' },
  { id: 'chiyue', name: '白日门·赤月峡谷', floors: [7], x: 1040, y: 380, icon: 'map_node_chiyue' },
];
/** 某层的 BOSS（spawns 中 tier=boss 的单位） */
export function floorBoss(i: number) {
  const sp = FLOORS[i]?.spawns.find(s => ENEMIES[s.id]?.tier === 'boss');
  return sp ? ENEMIES[sp.id] : undefined;
}
export const regionOf = (i: number) => REGIONS.find(r => r.floors.includes(i))!;
