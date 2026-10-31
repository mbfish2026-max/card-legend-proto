/**
 * 经验曲线（R22，docs/exp-curve.md）：热血传奇 1.76 官方升级经验表的形状 ÷ EXP_SCALE。
 * 怪物/悬赏经验按「所在地图」同步缩放（FLOOR_EXP_MULT），使每张图的升级节奏与旧线性曲线一致，
 * 但图内保留官方 10/14/21/38/46 级等处的跳变。
 */
/** 官方单级升级经验：OFFICIAL_EXP[lv] = lv 级升 lv+1 级所需（1–49 级）。来源 S1 新浪 2003 / S2 7bbz / S3 145z；47–49 级取 S2/S3（S1 疑似错位） */
export const OFFICIAL_EXP: readonly number[] = [0,
  100, 200, 300, 400, 600, 900, 1200, 1700, 2500, // 1–9
  6000, 8000, 10000, 15000, 30000, 40000, 50000, 70000, 100000, 120000, // 10–19
  140000, 250000, 300000, 350000, 400000, 500000, 700000, 1000000, 1400000, 1800000, // 20–29
  2000000, 2400000, 2800000, 3200000, 3600000, 4000000, 4800000, 5600000, 8200000, 9000000, // 30–39
  12000000, 16000000, 30000000, 50000000, 80000000, 120000000, 480000000, 1000000000, 1200000000, 3000000000, // 40–49
];
/** [适配] 缩放常数：官方值 ÷ 10。只决定数值量级（1 级 10 点、鹿约 2 点；49 级 3 亿），节奏由 FLOOR_EXP_MULT 决定 */
export const EXP_SCALE = 10;
/** [适配] 50 级以上官方未查到（各服差异大）：按 49 级值每级 ×1.5 外推 */
export const EXP_BEYOND_GROWTH = 1.5;
export const OFFICIAL_MAX = OFFICIAL_EXP.length - 1;
/** 新曲线：lv 级升下一级所需经验 */
export const EXP_PER_LEVEL = (lv: number): number => {
  const l = Math.max(1, Math.floor(lv));
  if (l <= OFFICIAL_MAX) return Math.round(OFFICIAL_EXP[l] / EXP_SCALE);
  return Math.round(OFFICIAL_EXP[OFFICIAL_MAX] / EXP_SCALE * EXP_BEYOND_GROWTH ** (l - OFFICIAL_MAX));
};
/** 旧线性曲线（expV<2 存档），仅迁移与对照用 */
export const EXP_PER_LEVEL_V1 = (lv: number) => 80 + lv * 45;
/** 存档经验版本：1 = 线性（无字段），2 = 官方形状 */
export const EXP_VERSION = 2;
const cum = (f: (l: number) => number, a: number, b: number) => { let s = 0; for (let l = a; l < b; l++) s += f(l); return s; };
/** [适配] 各层目标等级（第 i 层进入时等级，末项为通关等级）：取改动前 9 种子×3 职业模拟的平均进入等级（13 层） */
export const FLOOR_LEVEL_ANCHORS: readonly number[] = [1, 3, 7, 12, 15, 18, 22, 25, 29, 32, 36, 40, 45, 48];
/** [适配] 合击版 #8 四层（下标 19–22，合并 main 后排在洞穴群之后）：进入等级锚点 48→49→50→51，通关 52（≥43 合击 / ≥47 卧龙·雷炎） */
/** 阶段 B：追加下标 23 魔龙血域（侧线）52→53 [适配]；前四层倍率不变 */
// M4 [适配]：侧线层 24–26 追加锚点 54–56（只在末尾追加，前面各层倍率不变）
export const HJ_FLOOR_ANCHORS: readonly number[] = [48, 49, 50, 51, 52, 53, 54, 55, 56];
/** 每层怪物/悬赏经验倍率 = 该层目标等级段的新曲线累计经验 ÷ 旧曲线累计经验（同一比例缩放，保持每层升级节奏） */
export const floorExpMult = (anchors: readonly number[]): number[] => anchors.slice(0, -1).map((a, i) =>
  cum(EXP_PER_LEVEL, a, anchors[i + 1]) / cum(EXP_PER_LEVEL_V1, a, anchors[i + 1]));
const BASE_MULT = floorExpMult(FLOOR_LEVEL_ANCHORS);
/** [适配] feat/maps-more 追加层 13–18 的倍率 = 通关顺序中前后两张原有图倍率的几何平均（下标 13–23 依次对应 world.ts 新层） */
/** [适配] 新层经验衰减：多 6 张图会让角色整体超前升级（模拟 9 种子死亡全 0），故新层经验 ×此值 */
export const NEW_FLOOR_EXP_DAMP = 0.3;
export const NEW_FLOOR_MULT_NEIGHBORS: readonly [number, number][] = [[4, 5], [4, 5], [4, 5], [4, 5], [4, 5], [4, 5]];
export const FLOOR_EXP_MULT: number[] = [...BASE_MULT, ...NEW_FLOOR_MULT_NEIGHBORS.map(([a, b]) => NEW_FLOOR_EXP_DAMP * Math.sqrt(BASE_MULT[a] * BASE_MULT[b])), ...floorExpMult(HJ_FLOOR_ANCHORS)];
/** 第 floor 层获得的经验（怪物 def.exp / 悬赏 exp 为旧曲线下的基准值） */
export const scaledExp = (base: number, floor: number): number => {
  if (base <= 0) return 0;
  const m = FLOOR_EXP_MULT[Math.max(0, Math.min(FLOOR_EXP_MULT.length - 1, floor))];
  return Math.max(1, Math.round(base * m));
};
/** 旧存档迁移：等级不变，当前经验按本级进度比例换算到新曲线 */
export const migrateExp = (level: number, exp: number, expV?: number): number => {
  if ((expV ?? 1) >= EXP_VERSION) return exp;
  const oldNeed = EXP_PER_LEVEL_V1(level), need = EXP_PER_LEVEL(level);
  const ratio = Math.max(0, Math.min(1, (exp || 0) / oldNeed));
  return Math.min(need - 1, Math.floor(ratio * need));
};
/** 大数显示：≥10 万用「万/亿」 */
export const fmtExp = (n: number): string => n >= 1e8 ? `${+(n / 1e8).toFixed(2)}亿` : n >= 1e5 ? `${+(n / 1e4).toFixed(1)}万` : `${n}`;
