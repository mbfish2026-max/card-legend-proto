import { FLOORS } from './world';
import { ENEMIES } from './units';

/** 世界地图区域（按传奇地名分区；坐标为世界地图面板内位置） */
export interface Region { id: string; name: string; floors: number[]; x: number; y: number; icon: string }
/** R13 新增毒蛇山谷/苍月岛/封魔谷；盟重省含蜈蚣洞、石墓、祖玛寺庙（icon 暂用现有节点图，见 art-requests）
 * R11 按原版地理：比奇省（新手村/兽人古墓/比奇矿区）、沃玛森林（含沃玛寺庙）、盟重省祖玛寺庙、白日门赤月峡谷 */
export const REGIONS: Region[] = [
  { id: 'bichi', name: '比奇省', floors: [0, 4, 5], x: 260, y: 440, icon: 'map_node_bichi' },
  { id: 'woma', name: '沃玛森林', floors: [1, 2, 8], x: 430, y: 330, icon: 'map_node_woma' },
  { id: 'dushe', name: '毒蛇山谷', floors: [3], x: 560, y: 450, icon: 'map_node_woma' },
  { id: 'zuma', name: '盟重省', floors: [6, 7, 9], x: 720, y: 270, icon: 'map_node_zuma' },
  { id: 'cangyue', name: '苍月岛', floors: [10], x: 850, y: 440, icon: 'map_node_mengzhong' },
  { id: 'fengmo', name: '封魔谷', floors: [11], x: 960, y: 290, icon: 'map_node_mengzhong' },
  { id: 'chiyue', name: '白日门·赤月峡谷', floors: [12], x: 1080, y: 400, icon: 'map_node_chiyue' },
];
/** 某层的 BOSS（spawns 中 tier=boss 的单位） */
export function floorBoss(i: number) {
  const sp = FLOORS[i]?.spawns.find(s => ENEMIES[s.id]?.tier === 'boss');
  return sp ? ENEMIES[sp.id] : undefined;
}
export const regionOf = (i: number) => REGIONS.find(r => r.floors.includes(i))!;
