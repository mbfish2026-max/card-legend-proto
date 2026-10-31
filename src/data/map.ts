import { FLOORS } from './world';
import { ENEMIES } from './units';

/** 世界地图区域（按传奇地名分区；坐标为世界地图面板内位置） */
/** 区域小地图节点：town=城镇（安全区，后续「城镇/商人」任务接入），cave=洞穴，dungeon=副本，exit=通往其它区域
 * floor 存在即为可传送入口；orig 为原版坐标（未查到则为 undefined）；src 为来源链接 */
export type NodeKind = 'town' | 'cave' | 'dungeon' | 'exit';
export interface MapNode { id: string; name: string; kind: NodeKind; x: number; y: number; floor?: number; safe?: boolean; orig?: string; src?: string; to?: string }
export interface Region { id: string; name: string; floors: number[]; x: number; y: number; icon: string; bg?: string; nodes: MapNode[] }
/** 超大世界地图画布尺寸（逻辑像素，可拖动缩放） */
export const WORLD_W = 2400, WORLD_H = 1400;
const S21 = (id: number) => `https://www.21cq.com/mir/Map.aspx?id=${id}`;
const SINA_BQ = 'https://games.sina.com.cn/o/z/cq/2013-10-31/1843506458.shtml';
const WM = 'https://www.betermondo.com/a/2502/1375986.html';
/** R13 新增毒蛇山谷/苍月岛/封魔谷；盟重省含蜈蚣洞、石墓、祖玛寺庙（icon 暂用现有节点图，见 art-requests）
 * R11 按原版地理：比奇省（新手村/兽人古墓/比奇矿区）、沃玛森林（含沃玛寺庙）、盟重省祖玛寺庙、白日门赤月峡谷 */
export const REGIONS: Region[] = [
  { id: 'bichi', name: '比奇省', floors: [0, 4, 5], x: 500, y: 950, icon: 'map_node_bichi', nodes: [
    { id: 'bichi_town', name: '比奇城', kind: 'town', safe: true, x: 0.55, y: 0.5, src: SINA_BQ },
    { id: 'bichi_newbie', name: '新手村周边', kind: 'cave', floor: 0, x: 0.75, y: 0.75, orig: '未查到', src: S21(4) },
    { id: 'bichi_orc', name: '兽人古墓', kind: 'cave', floor: 4, x: 0.25, y: 0.2, orig: '(147,33)', src: S21(4) },
    { id: 'bichi_mine', name: '废矿/僵尸洞→尸王殿', kind: 'dungeon', floor: 5, x: 0.85, y: 0.35, orig: '(664,214)', src: 'https://blog.sina.com.cn/s/blog_4e0d83f10102y172.html' },
    { id: 'bichi_cave', name: '洞穴(骷髅洞)', kind: 'cave', x: 0.1, y: 0.45, orig: '(41,108)', src: S21(4) },
    { id: 'bichi_to_woma', name: '通往沃玛森林', kind: 'exit', to: 'woma', x: 0.5, y: 0.08, orig: '(324,34)', src: S21(4) },
    { id: 'bichi_to_dushe', name: '通往毒蛇山谷', kind: 'exit', to: 'dushe', x: 0.95, y: 0.12, orig: '(671,82)', src: S21(4) },
  ] },
  { id: 'woma', name: '沃玛森林', floors: [1, 2, 8], x: 820, y: 620, icon: 'map_node_woma', nodes: [
    { id: 'woma_forest', name: '沃玛森林', kind: 'cave', floor: 1, x: 0.6, y: 0.6, orig: '比奇(324,34)进入', src: S21(4) },
    { id: 'woma_deep', name: '沃玛森林深处', kind: 'cave', floor: 2, x: 0.35, y: 0.3, orig: '未查到' },
    { id: 'woma_temple', name: '沃玛寺庙', kind: 'dungeon', floor: 8, x: 0.12, y: 0.65, orig: '沃玛森林(86,280)', src: WM },
    { id: 'woma_to_bichi', name: '通往比奇省', kind: 'exit', to: 'bichi', x: 0.9, y: 0.9, orig: '(559,554)', src: S21(4) },
  ] },
  { id: 'dushe', name: '毒蛇山谷', floors: [3], x: 1080, y: 880, icon: 'map_node_woma', nodes: [
    { id: 'dushe_valley', name: '毒蛇山谷', kind: 'cave', floor: 3, x: 0.5, y: 0.5, orig: '比奇(671,82)进入', src: S21(4) },
    { id: 'dushe_to_bichi', name: '通往比奇省', kind: 'exit', to: 'bichi', x: 0.5, y: 0.92, orig: '(413,564)', src: S21(4) },
  ] },
  { id: 'zuma', name: '盟重省', floors: [6, 7, 9], x: 1420, y: 500, icon: 'map_node_zuma', nodes: [
    { id: 'zuma_town', name: '盟重土城', kind: 'town', safe: true, x: 0.5, y: 0.55, orig: '未查到' },
    { id: 'zuma_centipede', name: '蜈蚣洞', kind: 'cave', floor: 6, x: 0.2, y: 0.3, orig: '未查到' },
    { id: 'zuma_stone', name: '石墓(猪洞)', kind: 'cave', floor: 7, x: 0.8, y: 0.3, orig: '未查到' },
    { id: 'zuma_temple', name: '祖玛寺庙', kind: 'dungeon', floor: 9, x: 0.65, y: 0.85, orig: '未查到' },
  ] },
  { id: 'cangyue', name: '苍月岛', floors: [10], x: 1700, y: 920, icon: 'map_node_mengzhong', nodes: [
    { id: 'cangyue_town', name: '苍月岛', kind: 'town', safe: true, x: 0.3, y: 0.6, orig: '未查到' },
    { id: 'cangyue_bull', name: '牛魔寺庙', kind: 'dungeon', floor: 10, x: 0.7, y: 0.35, orig: '未查到' },
  ] },
  { id: 'fengmo', name: '封魔谷', floors: [11], x: 1900, y: 560, icon: 'map_node_mengzhong', nodes: [
    { id: 'fengmo_town', name: '封魔谷', kind: 'town', safe: true, x: 0.3, y: 0.5, orig: '未查到' },
    { id: 'fengmo_hall', name: '封魔矿区/封魔殿', kind: 'dungeon', floor: 11, x: 0.72, y: 0.4, orig: '未查到' },
  ] },
  { id: 'chiyue', name: '白日门·赤月峡谷', floors: [12], x: 2150, y: 800, icon: 'map_node_chiyue', nodes: [
    { id: 'chiyue_town', name: '白日门', kind: 'town', safe: true, x: 0.3, y: 0.45, orig: '未查到' },
    { id: 'chiyue_canyon', name: '赤月峡谷/赤月魔穴', kind: 'dungeon', floor: 12, x: 0.72, y: 0.6, orig: '未查到' },
  ] },
];
/** 某层的 BOSS（spawns 中 tier=boss 的单位） */
export function floorBoss(i: number) {
  const sp = FLOORS[i]?.spawns.find(s => ENEMIES[s.id]?.tier === 'boss');
  return sp ? ENEMIES[sp.id] : undefined;
}
export const regionOf = (i: number) => REGIONS.find(r => r.floors.includes(i))!;
/** 所有可传送入口（floor 存在） */
export const entrances = () => REGIONS.flatMap(r => r.nodes.filter(n => n.floor !== undefined).map(n => ({ region: r, node: n })));
export const nodeOfFloor = (i: number) => entrances().find(e => e.node.floor === i);
/** 拖动缩放视口的纯数学（便于测试）：缩放围绕锚点，限制在画布内 */
export interface View { x: number; y: number; z: number }
export function clampView(v: View, vw: number, vh: number, cw = WORLD_W, ch = WORLD_H, zmin = 0.4, zmax = 2): View {
  const z = Math.min(zmax, Math.max(zmin, v.z, Math.max(vw / cw, vh / ch)));
  const x = Math.min(0, Math.max(vw - cw * z, v.x)), y = Math.min(0, Math.max(vh - ch * z, v.y));
  return { x, y, z };
}
export function zoomAt(v: View, ax: number, ay: number, f: number, vw: number, vh: number, cw = WORLD_W, ch = WORLD_H): View {
  const z = clampView({ x: 0, y: 0, z: v.z * f }, vw, vh, cw, ch).z; return clampView({ x: ax - (ax - v.x) * (z / v.z), y: ay - (ay - v.y) * (z / v.z), z }, vw, vh, cw, ch);
}
