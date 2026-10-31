// 世界大地图数据层（docs/world-map-plan.md）：世界总图 8 区域（id 同 REGIONS；魔龙=hejiban；异界裂隙留在各区域）、
// 区域插画内节点（像素坐标 2048×1152）、等级段、迷雾、传送限制。布局全部 [适配]；官方连接见 plan §2。
import { FLOORS, groupOf } from './world';
import { FLOOR_TARGET_LV } from './balance';
import { REGIONS, floorBoss, type MapNode, type NodeKind } from './map';
import { WM_ASSETS } from '../assets-manifest';
import { NODE_TOWN } from './towns';

/** 世界总图逻辑尺寸（4×2 分块，每块 1024×1152；art/world-map W-1） */
export const WM_W = 4096, WM_H = 2304, WM_TILE_W = 1024, WM_TILE_H = 1152, WM_TILES_X = 4, WM_TILES_Y = 2;
/** 区域插画尺寸（节点像素坐标基准，W-2） */
export const WM_ART_W = 2048, WM_ART_H = 1152;
export type LinkKind = 'road' | 'sea' | 'npc';
export interface WmLink { to: string; kind: LinkKind; src?: string }
export interface RegionGeo { id: string; name: string; color: number; poly: [number, number][]; label: [number, number]; art: string; links: WmLink[]; floors: number[]; note?: string }
export interface NodeGeo { node: string; name: string; kind: NodeKind; x: number; y: number; floor?: number; town?: string; to?: string; group?: string; rift?: boolean; anchored?: boolean }
/** 节点群（多层地图群收拢为 1 个节点，点开展开） */
export interface NodeCluster { id: string; name: string; x: number; y: number; members: NodeGeo[] }

const S21 = 'https://www.21cq.com/mir/Map.aspx?id=';
/** 异界裂隙侧线层（sq/mir3）：留在各自区域，节点用 icon_wm_rift（2026-11-01 决定变更，不再单做浮岛） */
export const RIFT_FLOORS: readonly number[] = FLOORS.map((f, i) => f.name.startsWith('异界裂隙') ? i : -1).filter(i => i >= 0);
/** 区域位置表：docs/art-requests.md W-1（底图像素，顺时针；地貌对应为 [适配]） */
const DEF: Omit<RegionGeo, 'floors' | 'art' | 'name'>[] = [
  { id: 'bichi', color: 0xc8a050, poly: [[240, 1000], [1700, 1000], [1750, 2050], [260, 1900]], label: [720, 1300], links: [{ to: 'woma', kind: 'road', src: S21 + '4' }, { to: 'dushe', kind: 'road', src: S21 + '4' }] },
  { id: 'woma', color: 0x4f7a3a, poly: [[640, 560], [1880, 560], [1880, 1240], [640, 1240]], label: [1240, 900], links: [{ to: 'bichi', kind: 'road', src: S21 + '268' }, { to: 'chiyue', kind: 'road', src: S21 + '268' }, { to: 'fengmo', kind: 'road', src: S21 + '268' }] },
  { id: 'dushe', color: 0x8a7a5a, poly: [[1720, 880], [2280, 880], [2200, 2000], [1640, 2000]], label: [1920, 1480], links: [{ to: 'bichi', kind: 'road', src: S21 + '4' }, { to: 'zuma', kind: 'road', src: S21 + '478' }] },
  { id: 'zuma', color: 0xd8b060, poly: [[2240, 1000], [3400, 1000], [3400, 2050], [2200, 2050]], label: [2880, 1200], links: [{ to: 'dushe', kind: 'road', src: S21 + '478' }, { to: 'cangyue', kind: 'sea' }, { to: 'hejiban', kind: 'npc', src: 'docs/hejiban-official.md（盟重老兵）' }] },
  { id: 'chiyue', color: 0xc8d8e8, poly: [[440, 100], [1840, 100], [1840, 560], [440, 560]], label: [1120, 320], links: [{ to: 'woma', kind: 'road', src: S21 + '2934' }] },
  { id: 'fengmo', color: 0xa04830, poly: [[2600, 420], [3560, 420], [3560, 1020], [2600, 1020]], label: [3080, 720], links: [{ to: 'woma', kind: 'road', src: S21 + '268' }] },
  { id: 'hejiban', color: 0xc04020, poly: [[2080, 140], [2600, 140], [2600, 700], [2080, 700]], label: [2480, 420], links: [{ to: 'zuma', kind: 'npc', src: 'docs/hejiban-official.md（盟重老兵）' }], note: '合击/魔龙（1.80+）' },
  { id: 'cangyue', color: 0x6aa8a0, poly: [[3160, 1360], [3900, 1360], [3900, 2100], [3160, 2100]], label: [3520, 1720], links: [{ to: 'zuma', kind: 'sea' }], note: '与大陆步行连接未查到，海路虚线 [适配]' },
];
/** 底图东北角异界浮岛：仅装饰（W-1），不作区域 */
export const WM_DECOR_ISLE = { poly: [[3400, 120], [3900, 120], [3900, 560], [3400, 560]] as [number, number][], label: [3620, 320] as [number, number] };
export const REGION_GEO: Record<string, RegionGeo> = Object.fromEntries(DEF.map(d => {
  const r = REGIONS.find(x => x.id === d.id)!; return [d.id, { ...d, name: d.id === 'hejiban' ? '魔龙·合击' : r.name, art: `world_region_${d.id}`, floors: [...r.floors] }];
}));
export const WM_IDS = DEF.map(d => d.id);
export const areaOf = (f: number) => WM_IDS.find(id => REGION_GEO[id].floors.includes(f)) ?? null;
/** 等级段：由 FLOOR_TARGET_LV 算（不手填） */
export function levelBand(id: string): [number, number] { const l = REGION_GEO[id].floors.map(f => FLOOR_TARGET_LV[f]); return [Math.min(...l), Math.max(...l)]; }
export const bandText = (id: string) => { const [a, b] = levelBand(id); return a === b ? `Lv${a}` : `Lv${a}–${b}`; };

/** 插画内地标锚点（docs/art-requests.md W-2，2048×1152）：key = 节点 id 或 grp_<图群>（群节点放在地标上） */
export const ANCHORS: Record<string, [number, number]> = {
  bichi_town: [630, 540], grp_shouren: [1320, 200], grp_tianran: [1720, 370], grp_bq_mine: [1660, 740],
  grp_woma: [1260, 170], grp_woma_cave: [310, 900], woma_forest: [1400, 870],
  dushe_valley: [1000, 600], grp_valley_mine: [680, 560], grp_sq_jjf: [1280, 300],
  zuma_town: [1060, 600], grp_wugong: [1420, 220], grp_shimu: [550, 350], grp_xiangshi: [1640, 800], zuma_temple: [250, 550],
  cangyue_town: [680, 760], cangyue_bull: [1100, 250], cangyue_gumo: [1410, 580],
  fengmo_town: [1340, 200], fengmo_hall: [1270, 560], grp_sq_nimo: [860, 760], grp_sq_jindi: [400, 200],
  chiyue_town: [500, 420], chiyue_canyon: [1440, 720], chiyue_altar: [1420, 180], rift_79: [1720, 110], chiyue_snow: [1050, 330],
  hj_wolong: [860, 500], hj_leiyan: [1030, 130], hj_firedragon: [1180, 190], hj_molong: [1540, 640], hj_home: [1200, 900],
};
/** W-2 没给地标的节点：手摆在插画空地上（[适配]，避开地标） */
export const ANCHORS_ADAPT: Record<string, [number, number]> = {
  bichi_xinshou: [330, 640], bichi_newbie: [960, 820], rift_58: [300, 920], grp_sq_jiguan: [1080, 980], bichi_to_woma: [1000, 110], bichi_to_dushe: [1930, 560],
  grp_sq_snake: [300, 950], rift_66: [1800, 420], rift_67: [1850, 1020], hj_town: [420, 700],
};
/** 无锚点的节点：旧 0–1 比例换算（[适配]） */
const px = (n: MapNode) => ({ x: Math.round(120 + n.x * (WM_ART_W - 240)), y: Math.round(110 + n.y * (WM_ART_H - 260)) });
export const NODE_GEO: Record<string, NodeGeo[]> = Object.fromEntries(REGIONS.map(r => [r.id, r.nodes.map(n => {
  const g = n.floor !== undefined ? groupOf(n.floor) : undefined, A = { ...ANCHORS_ADAPT, ...ANCHORS }, a = A[n.id] ?? (g ? A['grp_' + g] : undefined);
  return { node: n.id, name: n.name, kind: n.kind, ...(a ? { x: a[0], y: a[1] } : px(n)), anchored: !!a, floor: n.floor, town: NODE_TOWN[n.id], to: n.to, group: g, rift: n.floor !== undefined && RIFT_FLOORS.includes(n.floor) } as NodeGeo;
})]));
/** 收拢：同区域、同图群 ≥2 个节点 → 1 个群节点（位置取成员均值），名称「兽人古墓 1–3 层」式 */
export function clusters(area: string): (NodeGeo | NodeCluster)[] {
  const ns = NODE_GEO[area], seen = new Set<string>(), out: (NodeGeo | NodeCluster)[] = [];
  for (const n of ns) {
    const mem = n.group ? ns.filter(m => m.group === n.group) : [n];
    if (mem.length < 2) { out.push(n); continue; }
    if (seen.has(n.group!)) continue; seen.add(n.group!);
    const base = mem[0].name.replace(/^异界裂隙·/, '').split(/[·（]/)[0].replace(/[一二三四五六七]层$/, '');
    out.push({ id: 'grp_' + n.group, name: `${base}（${mem.length} 层）`, ...((ANCHORS['grp_' + n.group] ?? ANCHORS_ADAPT['grp_' + n.group]) ? { x: (ANCHORS['grp_' + n.group] ?? ANCHORS_ADAPT['grp_' + n.group])[0], y: (ANCHORS['grp_' + n.group] ?? ANCHORS_ADAPT['grp_' + n.group])[1] } : { x: Math.round(mem.reduce((a, m) => a + m.x, 0) / mem.length), y: Math.round(mem.reduce((a, m) => a + m.y, 0) / mem.length) }), members: mem });
  }
  return out;
}
export const isCluster = (n: NodeGeo | NodeCluster): n is NodeCluster => 'members' in n;

/** 探索状态：已探索层 = save.reached（按存档槽天然隔离）；城镇 = townsSeen，缺省按区域点亮推 */
export interface Explore { reached: ReadonlySet<number>; townsSeen?: ReadonlySet<string> | null }
export type Fog = 'fog' | 'lit';
export const areaFog = (id: string, e: Explore): Fog => REGION_GEO[id].floors.some(f => e.reached.has(f)) ? 'lit' : 'fog';
/** 节点：层节点到过=亮；城镇节点去过或所在区域已点亮=亮；出口随区域 */
export function nodeLit(area: string, n: NodeGeo, e: Explore): boolean {
  if (n.floor !== undefined) return e.reached.has(n.floor);
  if (n.town) return !!e.townsSeen?.has(n.town) || areaFog(area, e) === 'lit';
  return areaFog(area, e) === 'lit';
}
/** 迷雾区域显示：轮廓 + ？？？ + 等级段（§5-4：显示） */
export const fogLabel = (id: string, e: Explore) => areaFog(id, e) === 'fog' ? { name: '？？？', band: bandText(id) } : { name: REGION_GEO[id].name, band: bandText(id) };
/** 节点传送预检（UI 用）；真正扣费/冷却仍走 World.canTeleport/teleport */
export interface TeleWorld { floorIndex: number; town: string | null; reached: ReadonlySet<number>; canTeleport(i: number): string | null; teleportCost(i: number): number }
export function nodeTeleport(w: TeleWorld, n: NodeGeo): { ok: boolean; why?: string; cost?: number; kind: 'floor' | 'town' | 'area' | 'none' } {
  if (n.to) return { ok: true, kind: 'area' };
  if (n.town) return { ok: w.town !== n.town, why: w.town === n.town ? '你已在此城镇' : undefined, kind: 'town' };
  if (n.floor === undefined) return { ok: false, why: `${n.name}：暂未开放`, kind: 'none' };
  if (n.floor === w.floorIndex && !w.town) return { ok: false, why: '你已在此地图', kind: 'floor' };
  if (!w.reached.has(n.floor)) return { ok: false, why: '到达该层后解锁传送', kind: 'floor' };
  const why = w.canTeleport(n.floor); return { ok: !why, why: why ?? undefined, cost: w.teleportCost(n.floor), kind: 'floor' };
}
export const nodeBoss = (n: NodeGeo) => n.floor !== undefined && FLOORS[n.floor]?.boss ? floorBoss(n.floor) ?? null : null;
/** 美术 key（缺图用程序占位，换图只改 assets-manifest） */
export const WM_TILE_KEYS = Array.from({ length: WM_TILES_X * WM_TILES_Y }, (_, k) => `world_map_${k % WM_TILES_X}_${Math.floor(k / WM_TILES_X)}`);
export const WM_ICON_KEYS = ['town', 'cave', 'dungeon', 'boss', 'portal', 'rift', 'player', 'locked'].map(k => `icon_wm_${k}`);
export const wmIcon = (n: NodeGeo) => n.rift ? 'icon_wm_rift' : n.kind === 'town' ? 'icon_wm_town' : n.kind === 'exit' ? 'icon_wm_portal' : n.kind === 'dungeon' ? 'icon_wm_dungeon' : 'icon_wm_cave';
export const WM_ART_KEYS = [...WM_TILE_KEYS, ...WM_IDS.map(id => REGION_GEO[id].art), 'world_fog', ...WM_ICON_KEYS, 'wm_frame'];
/** 标签优先级（缩小时按此隐藏）：城镇 > 当前 > BOSS > 其他（数字越小越优先） */
export const labelPri = (n: { town?: string; floor?: number; members?: NodeGeo[] }, curFloor: number) => {
  const fs = n.members ? n.members.map(m => m.floor) : [n.floor];
  return n.town ? 0 : fs.includes(curFloor) ? 1 : fs.some(f => f !== undefined && FLOORS[f]?.boss) ? 2 : 3;
};
/** 贪心摆放：按优先级依次放，与已放矩形重叠的隐藏；返回可见下标 */
export function placeLabels(rs: { x: number; y: number; w: number; h: number; pri: number }[]): Set<number> {
  const ord = rs.map((r, i) => i).sort((a, b) => rs[a].pri - rs[b].pri || a - b), put: typeof rs = [], vis = new Set<number>();
  for (const i of ord) { const r = rs[i]; if (put.some(p => r.x < p.x + p.w && p.x < r.x + r.w && r.y < p.y + p.h && p.y < r.y + r.h)) continue; put.push(r); vis.add(i); }
  return vis;
}
/** 视口：内容 cw×ch 放进 VW×VH，缩放 = 适配比例 × m（m∈[0.5,2.5]，设置项 wmZoom）；平移夹住不露边 */
export interface WmView { x: number; y: number; m: number }
export const fitZ = (cw: number, ch: number, VW: number, VH: number) => Math.min(VW / cw, VH / ch);
export function clampWm(v: WmView, cw: number, ch: number, VW: number, VH: number): WmView {
  const m = Math.max(0.5, Math.min(2.5, v.m)), z = fitZ(cw, ch, VW, VH) * m;
  const cx = (lo: number, d: number, V: number) => d * z <= V ? (V - d * z) / 2 : Math.max(V - d * z, Math.min(0, lo));
  return { x: cx(v.x, cw, VW), y: cx(v.y, ch, VH), m };
}
/** 以视口内 (px,py) 为锚缩放 */
export function zoomWm(v: WmView, px: number, py: number, k: number, cw: number, ch: number, VW: number, VH: number): WmView {
  const f = fitZ(cw, ch, VW, VH), z0 = f * v.m, m = Math.max(0.5, Math.min(2.5, v.m * k)), z1 = f * m;
  return clampWm({ x: px - (px - v.x) * z1 / z0, y: py - (py - v.y) * z1 / z0, m }, cw, ch, VW, VH);
}
/** 居中某点 */
export const centerWm = (cx: number, cy: number, m: number, cw: number, ch: number, VW: number, VH: number): WmView => {
  const z = fitZ(cw, ch, VW, VH) * m; return clampWm({ x: VW / 2 - cx * z, y: VH / 2 - cy * z, m }, cw, ch, VW, VH);
};
/** 某视图需要的美术 key（按需加载：总图=8 块底图+迷雾+图标+边框；区域=该区插画+图标+边框） */
export const wmNeed = (area: string | null) => (area ? [REGION_GEO[area].art] : [...WM_TILE_KEYS, 'world_fog']).concat(WM_ICON_KEYS, 'wm_frame').filter(k => WM_ASSETS[k]);
