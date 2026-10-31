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
  { id: 'bichi', name: '比奇省', floors: [0, 4, 13, 14, 15, 16, 27, 28, 29, 30, 31, 5], x: 500, y: 950, icon: 'map_node_bichi', nodes: [
    { id: 'bichi_town', name: '比奇城', kind: 'town', safe: true, x: 0.55, y: 0.5, src: SINA_BQ },
    { id: 'bichi_xinshou', name: '银杏村（新手村）', kind: 'town', safe: true, x: 0.8, y: 0.88, orig: '(623,600)', src: 'http://sscq.oss-cn-hangzhou.aliyuncs.com/game/datainfo/hzfXGJXY8LQ.html' },
    { id: 'bichi_newbie', name: '新手村周边', kind: 'cave', floor: 0, x: 0.75, y: 0.75, orig: '未查到', src: S21(4) },
    { id: 'bichi_orc', name: '兽人古墓一层（白骨墓穴）', kind: 'cave', floor: 4, x: 0.25, y: 0.2, orig: '(147,33)', src: S21(4) },
    { id: 'bichi_mine', name: '废矿/僵尸洞→尸王殿', kind: 'dungeon', floor: 5, x: 0.85, y: 0.35, orig: '(664,214)', src: 'https://blog.sina.com.cn/s/blog_4e0d83f10102y172.html' },
    { id: 'bichi_orc2', name: '兽人古墓二层', kind: 'cave', floor: 13, x: 0.3, y: 0.32, orig: '未查到', src: 'https://www.21cq.com/mir/Map.aspx?id=218' },
    { id: 'bichi_orc3', name: '兽人古墓三层', kind: 'cave', floor: 14, x: 0.36, y: 0.44, orig: '未查到', src: 'https://www.21cq.com/mir/Map.aspx?id=221' },
    { id: 'bichi_cave', name: '骷髅洞·洞穴一层', kind: 'cave', floor: 15, x: 0.1, y: 0.45, orig: '(41,108)', src: 'https://www.21cq.com/mir/Map.aspx?id=248' },
    { id: 'bichi_cave2', name: '骷髅洞·洞穴二层', kind: 'cave', floor: 16, x: 0.12, y: 0.62, orig: '洞穴一层(330,115)/(127,201)', src: 'https://www.21cq.com/mir/Map.aspx?id=249' },
    { id: 'bichi_mine0', name: '废矿入口', kind: 'cave', floor: 27, x: 0.8, y: 0.25, orig: '(664,214)', src: S21(401) },
    { id: 'bichi_mine1', name: '废矿区东部', kind: 'cave', floor: 28, x: 0.88, y: 0.48, orig: '未查到', src: S21(404) },
    { id: 'bichi_mine2', name: '矿区一层', kind: 'cave', floor: 29, x: 0.78, y: 0.55, orig: '未查到', src: S21(406) },
    { id: 'bichi_mine3', name: '矿区·桥', kind: 'cave', floor: 30, x: 0.7, y: 0.45, orig: '未查到', src: S21(407) },
    { id: 'bichi_mine4', name: '矿区B二层', kind: 'cave', floor: 31, x: 0.68, y: 0.3, orig: '未查到', src: S21(408) },
    { id: 'bichi_to_woma', name: '通往沃玛森林', kind: 'exit', to: 'woma', x: 0.5, y: 0.08, orig: '(324,34)', src: S21(4) },
    { id: 'bichi_to_dushe', name: '通往毒蛇山谷', kind: 'exit', to: 'dushe', x: 0.95, y: 0.12, orig: '(671,82)', src: S21(4) },
  ] },
  { id: 'woma', name: '沃玛森林', floors: [1, 2, 17, 18, 24, 25, 26, 8], x: 820, y: 620, icon: 'map_node_woma', nodes: [
    { id: 'woma_forest', name: '沃玛森林', kind: 'cave', floor: 1, x: 0.6, y: 0.6, orig: '比奇(324,34)进入', src: S21(4) },
    { id: 'woma_deep', name: '沃玛森林深处', kind: 'cave', floor: 2, x: 0.35, y: 0.3, orig: '未查到' },
    { id: 'woma_temple', name: '沃玛寺庙', kind: 'dungeon', floor: 8, x: 0.12, y: 0.65, orig: '沃玛森林(86,280)', src: WM },
    { id: 'woma_cave', name: '沃玛自然洞穴·一', kind: 'cave', floor: 17, x: 0.3, y: 0.82, orig: '兽人古墓三层相连（坐标未查到）', src: 'https://www.21cq.com/mir/Map.aspx?id=1506' },
    { id: 'woma_cave2', name: '沃玛自然洞穴·二', kind: 'cave', floor: 18, x: 0.15, y: 0.88, orig: '洞穴二层(377,64)', src: 'https://www.21cq.com/mir/Map.aspx?id=1507' },
    { id: 'woma_t0', name: '沃玛寺庙入口', kind: 'cave', floor: 24, x: 0.2, y: 0.5, orig: '沃玛森林(84,277)', src: S21(312) },
    { id: 'woma_t1', name: '沃玛寺庙一层', kind: 'cave', floor: 25, x: 0.08, y: 0.4, orig: '未查到', src: S21(313) },
    { id: 'woma_t2', name: '沃玛寺庙二层', kind: 'cave', floor: 26, x: 0.05, y: 0.55, orig: '未查到', src: S21(314) },
    { id: 'woma_to_bichi', name: '通往比奇省', kind: 'exit', to: 'bichi', x: 0.9, y: 0.9, orig: '(559,554)', src: S21(4) },
  ] },
  { id: 'dushe', name: '毒蛇山谷', floors: [3, 32, 33], x: 1080, y: 880, icon: 'map_node_woma', nodes: [
    { id: 'dushe_valley', name: '毒蛇山谷', kind: 'cave', floor: 3, x: 0.5, y: 0.5, orig: '比奇(671,82)进入', src: S21(4) },
    { id: 'dushe_mine1', name: '山谷矿区·一', kind: 'cave', floor: 32, x: 0.25, y: 0.3, orig: '未查到', src: S21(457) },
    { id: 'dushe_mine2', name: '山谷矿区·二', kind: 'cave', floor: 33, x: 0.75, y: 0.3, orig: '未查到', src: S21(458) },
    { id: 'dushe_to_bichi', name: '通往比奇省', kind: 'exit', to: 'bichi', x: 0.5, y: 0.92, orig: '(413,564)', src: S21(4) },
  ] },
  { id: 'zuma', name: '盟重省', floors: [6, 7, 9, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55], x: 1420, y: 500, icon: 'map_node_zuma', nodes: [
    { id: 'zuma_town', name: '盟重土城', kind: 'town', safe: true, x: 0.5, y: 0.55, orig: '未查到' },
    { id: 'zuma_centipede', name: '蜈蚣洞', kind: 'cave', floor: 6, x: 0.2, y: 0.42, orig: '未查到' },
    { id: 'zuma_stone', name: '石墓(猪洞)', kind: 'cave', floor: 7, x: 0.9, y: 0.42, orig: '未查到' },
    { id: 'zuma_b3_34', name: '地牢一层东', kind: 'cave', floor: 34, x: 0.040, y: 0.06, orig: '未查到', src: S21(1378) },
    { id: 'zuma_b3_35', name: '地牢一层西', kind: 'cave', floor: 35, x: 0.125, y: 0.06, orig: '未查到', src: S21(1379) },
    { id: 'zuma_b3_36', name: '地牢一层北', kind: 'cave', floor: 36, x: 0.210, y: 0.06, orig: '未查到', src: S21(1380) },
    { id: 'zuma_b3_37', name: '地牢一层西二', kind: 'cave', floor: 37, x: 0.295, y: 0.06, orig: '未查到', src: S21(1381) },
    { id: 'zuma_b3_38', name: '地牢一层北二', kind: 'cave', floor: 38, x: 0.380, y: 0.06, orig: '未查到', src: S21(1382) },
    { id: 'zuma_b3_39', name: '一线天', kind: 'cave', floor: 39, x: 0.465, y: 0.06, orig: '未查到', src: S21(1451) },
    { id: 'zuma_b3_40', name: '生死之间', kind: 'cave', floor: 40, x: 0.040, y: 0.78, orig: '未查到', src: S21(1446) },
    { id: 'zuma_b3_41', name: '黑暗地带', kind: 'cave', floor: 41, x: 0.125, y: 0.78, orig: '未查到', src: S21(1445) },
    { id: 'zuma_b3_42', name: '传奇部落', kind: 'cave', floor: 42, x: 0.210, y: 0.78, orig: '未查到', src: S21(1447) },
    { id: 'zuma_b3_43', name: '邪恶势力', kind: 'cave', floor: 43, x: 0.295, y: 0.78, orig: '未查到', src: S21(1448) },
    { id: 'zuma_b3_44', name: '幽名圣域', kind: 'cave', floor: 44, x: 0.380, y: 0.78, orig: '未查到', src: S21(1449) },
    { id: 'zuma_b3_45', name: '恐怖空间', kind: 'cave', floor: 45, x: 0.465, y: 0.78, orig: '未查到', src: S21(1450) },
    { id: 'zuma_b3_46', name: '石墓一层', kind: 'cave', floor: 46, x: 0.600, y: 0.06, orig: '未查到', src: S21(1198) },
    { id: 'zuma_b3_47', name: '石墓二层', kind: 'cave', floor: 47, x: 0.685, y: 0.06, orig: '未查到', src: S21(1199) },
    { id: 'zuma_b3_48', name: '石墓三层', kind: 'cave', floor: 48, x: 0.770, y: 0.06, orig: '未查到', src: S21(1200) },
    { id: 'zuma_b3_49', name: '石墓四层', kind: 'cave', floor: 49, x: 0.855, y: 0.06, orig: '未查到', src: S21(1201) },
    { id: 'zuma_b3_50', name: '石墓阵', kind: 'cave', floor: 50, x: 0.940, y: 0.06, orig: '未查到', src: S21(1203) },
    { id: 'zuma_b3_51', name: '石墓六层', kind: 'cave', floor: 51, x: 0.560, y: 0.50, orig: '未查到', src: S21(1232) },
    { id: 'zuma_b3_52', name: '石墓七层', kind: 'cave', floor: 52, x: 0.660, y: 0.50, orig: '未查到', src: S21(1233) },
    { id: 'zuma_b3_53', name: '香石墓穴·一', kind: 'cave', floor: 53, x: 0.780, y: 0.86, orig: '未查到', src: S21(1488) },
    { id: 'zuma_b3_54', name: '香石墓穴·二', kind: 'cave', floor: 54, x: 0.865, y: 0.86, orig: '未查到', src: S21(1489) },
    { id: 'zuma_b3_55', name: '香石墓穴·三', kind: 'cave', floor: 55, x: 0.950, y: 0.86, orig: '未查到', src: S21(1490) },
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
  // 合击版 #8：盟重出发的合击地图（入口 NPC 见 docs/hejiban-official.md §4；世界图坐标 [适配]）
  { id: 'hejiban', name: '盟重·合击地图', floors: [19, 20, 21, 22, 23], x: 2050, y: 1080, icon: 'map_node_mengzhong', nodes: [
    { id: 'hj_town', name: '盟重（狂欢使者/卧龙笔记/店小二）', kind: 'town', safe: true, x: 0.2, y: 0.5, orig: '未查到' },
    { id: 'hj_home', name: '保卫家园', kind: 'dungeon', floor: 19, x: 0.4, y: 0.25, orig: '未查到' },
    { id: 'hj_wolong', name: '卧龙山庄', kind: 'dungeon', floor: 20, x: 0.6, y: 0.7, orig: '盟重卧龙笔记(330,340)' },
    { id: 'hj_leiyan', name: '雷炎洞穴', kind: 'cave', floor: 21, x: 0.75, y: 0.3, orig: '盟重店小二(382,308)' },
    { id: 'hj_firedragon', name: '火龙神殿', kind: 'dungeon', floor: 22, x: 0.9, y: 0.65, orig: '未查到' },
    { id: 'hj_molong', name: '魔龙血域', kind: 'dungeon', floor: 23, x: 0.55, y: 0.9, orig: '魔龙城（入口未查到）' },
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
