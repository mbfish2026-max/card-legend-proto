import { FLOORS } from './world';
import { ENEMIES } from './units';

/** 世界地图区域（按传奇地名分区；坐标为世界地图面板内位置） */
export interface Region { id: string; name: string; floors: number[]; x: number; y: number; icon: string }
export const REGIONS: Region[] = [
  { id: 'bichi', name: '比奇省', floors: [0, 1], x: 300, y: 430, icon: 'map_node_bichi' },
  { id: 'mengzhong', name: '盟重省', floors: [2, 3, 4], x: 520, y: 300, icon: 'map_node_mengzhong' },
  { id: 'woma', name: '沃玛森林', floors: [5], x: 760, y: 420, icon: 'map_node_woma' },
  { id: 'zuma', name: '祖玛寺庙', floors: [6], x: 900, y: 250, icon: 'map_node_zuma' },
  { id: 'chiyue', name: '赤月峡谷', floors: [7], x: 1060, y: 380, icon: 'map_node_chiyue' },
];
/** 某层的 BOSS（spawns 中 tier=boss 的单位） */
export function floorBoss(i: number) {
  const sp = FLOORS[i]?.spawns.find(s => ENEMIES[s.id]?.tier === 'boss');
  return sp ? ENEMIES[sp.id] : undefined;
}
export const regionOf = (i: number) => REGIONS.find(r => r.floors.includes(i))!;
