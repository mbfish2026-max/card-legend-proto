/**
 * feat/balance-sys（balance-plan.md §C/§A）：每层目标等级 L_f、等级差经验衰减、按 L_f 生成的经验倍率。
 * 全部为 [适配]：官方传奇无「层目标等级」概念（未查到），按文档「通关约 50 级」与主线 39 个位置设定。
 */
import { FLOORS, FLOOR_ORDER } from './world';
import { ENEMIES } from './units';
import { EXP_PER_LEVEL, EXP_SCALE, FLOOR_EXP_MULT, FLOOR_EXP_CAP as FLOOR_EXP_CAP_REF } from './expCurve';
import { OFFICIAL_MON_EXP } from './monsterExp';

/** [适配] 主线 39 个位置的进入等级（FLOOR_ORDER 顺序），末项 = 目标通关等级 50（文档 §C） */
export const MAIN_ANCHORS: readonly number[] = [
  1, 5, 8, 10, 12, // 幽暗森林 兽人要塞 蛛网晶洞 毒蛇山谷 白骨墓穴
  13, 14, 15, 16, 17, 18, // 兽人古墓二/三 骷髅洞一/二 沃玛自然洞穴一/二
  19, 20, 21, 22, 23, // 废矿入口 东部 矿区一层 桥 B二层
  24, // 尸王殿
  25, 26, 27, 28, 29, // 蜈蚣洞地牢一层 ×5
  30, // 蜈蚣洞
  31, 32, 33, 34, // 石墓一–四层
  35, 36, 37, 38, // 石墓·猪洞 沃玛寺庙一/二层 沃玛寺庙
  40, 42, 44, 45, // 祖玛阁 牛魔寺庙 封魔殿 赤月魔穴
  46, 47, 48, 49, // 保卫家园 卧龙山庄 雷炎洞穴 火龙神殿
  50, // 通关
];
export const CLEAR_LEVEL = MAIN_ANCHORS[MAIN_ANCHORS.length - 1];

const normLv = (f: number) => { const ls = FLOORS[f].spawns.map(s => ENEMIES[s.id]).filter(d => d && d.tier !== 'boss').map(d => d.level ?? 1);
  return ls.length ? ls.reduce((a, b) => a + b, 0) / ls.length : 1; };
/** 每层目标等级 L_f（按 FLOORS 下标）。主线取 MAIN_ANCHORS；侧线层取「官方普通怪平均等级最接近」的主线层的 L_f [适配] */
export const FLOOR_TARGET_LV: readonly number[] = FLOORS.map((_, f) => {
  const k = FLOOR_ORDER.indexOf(f); if (k >= 0) return MAIN_ANCHORS[k];
  const me = normLv(f); let best = 0, bd = Infinity;
  FLOOR_ORDER.forEach((g, i) => { const d = Math.abs(normLv(g) - me); if (d < bd) { bd = d; best = i; } });
  return MAIN_ANCHORS[best];
});
/** 新手图（下标 0）豁免：怪物属性与等级保持原值 */
export const EXEMPT_FLOORS: readonly number[] = [0];

/** 怪物在第 f 层的显示/判定等级：普通怪 L_f + (官方等级 − 本层官方最低普通等级，夹到 0–3)，BOSS = L_f + 5（文档 §A） */
export const monsterLevelAt = (id: string, f: number): number => {
  const d = ENEMIES[id]; if (!d) return 1; const base = d.level ?? 1;
  if (EXEMPT_FLOORS.includes(f) || f < 0 || f >= FLOORS.length) return base;
  const L = FLOOR_TARGET_LV[f];
  if (d.tier === 'boss') return L + 5;
  const ls = FLOORS[f].spawns.map(s => ENEMIES[s.id]).filter(x => x && x.tier !== 'boss').map(x => x.level ?? 1);
  return L + Math.max(0, Math.min(3, base - (ls.length ? Math.min(...ls) : base)));
};

/** 等级差经验衰减（文档 §C）：怪比角色低 ≥3 级 ×0.7、≥6 级 ×0.4、≥10 级 ×0.1；同级或更高 ×1 */
export const levelGapExpMult = (heroLv: number, monLv: number): number => {
  const g = heroLv - monLv;
  return g >= 10 ? 0.1 : g >= 6 ? 0.4 : g >= 3 ? 0.7 : 1;
};

/** 官方怪物经验：21cq 有记录取原值；未查到 → 按 21cq 已收录怪物的「等级—经验」对数线性回归拟合 [适配] */
const FIT = (() => { const pts = Object.values(OFFICIAL_MON_EXP).filter(r => r[1] < 50); const n = pts.length;
  const xs = pts.map(r => r[1]), ys = pts.map(r => Math.log(r[2])); const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const k = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0); return { k, c: my - k * mx }; })();
/** 「未查到」怪物的官方等级换算：本作等级 ×1.5+4 ≈ 21cq 等级（由已收录怪物两边等级对照得出）[适配]；BOSS 经验再 ×8（21cq 沃玛教主/沃玛战士≈9.6、尸王/僵尸=5）[适配] */
export const officialExpOf = (id: string): { exp: number; src: '21cq' | '未查到[适配]' } => {
  const r = OFFICIAL_MON_EXP[id]; if (r) return { exp: r[2], src: '21cq' };
  const d = ENEMIES[id]; const lv = (d?.level ?? 1) * 1.5 + 4;
  return { exp: Math.max(1, Math.round(Math.exp(FIT.c + FIT.k * lv) * (d?.tier === 'boss' ? 8 : 1))), src: '未查到[适配]' };
};

/**
 * [适配] 每级目标击杀数 KPL（模拟口径的普通怪击杀数）。依据 plan-60h §2.2 的分段时长（1→7 1h、7→14 3h、14→22 6h、22→26 6h、26→30 8h、
 * 30→35 10h、35→40 10h、40→45 10h、45→50 6h，合计 60h 真人）÷ 真人每击杀约 REAL_SEC_PER_KILL 秒。官方练级时长 未查到。
 */
export const REAL_SEC_PER_KILL = 12;
export const PACE_HOURS: readonly [number, number, number][] = [[1, 7, 1], [7, 14, 3], [14, 22, 6], [22, 26, 6], [26, 30, 8], [30, 35, 10], [35, 40, 10], [40, 45, 10], [45, 50, 6]];
export const killsPerLevel = (lv: number): number => {
  const b = PACE_HOURS.find(([a, z]) => lv >= a && lv < z) ?? PACE_HOURS[PACE_HOURS.length - 1];
  return Math.round(b[2] * 3600 / (b[1] - b[0]) / REAL_SEC_PER_KILL);
};
/** 本作怪物 exp 字段改为「官方经验 ÷ EXP_SCALE」（≥1）——与官方升级表同一量纲 */
export const BALANCE_MON_EXP: Record<string, number> = Object.fromEntries(Object.keys(ENEMIES).map(id => [id, Math.max(1, Math.round(officialExpOf(id).exp / EXP_SCALE))]));
const avgNormExp = (f: number) => { const es = FLOORS[f].spawns.map(s => s.id).filter(id => ENEMIES[id] && ENEMIES[id].tier !== 'boss').map(id => BALANCE_MON_EXP[id]);
  return es.length ? es.reduce((a, b) => a + b, 0) / es.length : 1; };
/** 每层经验倍率 G_f：本层普通怪平均一只 = EXP_PER_LEVEL(L_f) ÷ KPL(L_f)，怪物之间保持官方经验比例（BOSS 自然更多） */
export const BALANCE_EXP_MULT: readonly number[] = FLOORS.map((_, f) => EXP_PER_LEVEL(FLOOR_TARGET_LV[f]) / killsPerLevel(FLOOR_TARGET_LV[f]) / avgNormExp(f));
/** [适配] 悬赏/环任务单次经验上限 = 本层目标等级一级所需 × QUEST_EXP_CAP_SHARE（防止交一次任务连升多级） */
export const QUEST_EXP_CAP_SHARE = 0.3;
export const FLOOR_EXP_CAP: readonly number[] = FLOORS.map((_, f) => Math.round(EXP_PER_LEVEL(FLOOR_TARGET_LV[f]) * QUEST_EXP_CAP_SHARE));
/** 击杀经验 = 怪物 exp × G_f × 等级差衰减（不受任务上限） */
export const killExp = (id: string, floor: number, heroLv: number, monLv: number): number => {
  const f = Math.max(0, Math.min(FLOORS.length - 1, floor));
  return Math.max(1, Math.round((ENEMIES[id]?.exp ?? 1) * BALANCE_EXP_MULT[f] * levelGapExpMult(heroLv, monLv)));
};

/** 生效（模块加载时一次）：怪物 exp 改官方值；expCurve.FLOOR_EXP_MULT / FLOOR_EXP_CAP 原地替换（scaledExp 与 UI 同步；避免 expCurve↔world 循环引用） */
export const FLOOR_EXP_MULT_V1: readonly number[] = [...FLOOR_EXP_MULT];
export const MON_EXP_V1: Record<string, number> = Object.fromEntries(Object.entries(ENEMIES).map(([id, d]) => [id, d.exp ?? 10]));
for (const id of Object.keys(ENEMIES)) ENEMIES[id].exp = BALANCE_MON_EXP[id];
FLOOR_EXP_MULT.splice(0, FLOOR_EXP_MULT.length, ...BALANCE_EXP_MULT);
FLOOR_EXP_CAP_REF.splice(0, FLOOR_EXP_CAP_REF.length, ...FLOOR_EXP_CAP);

// ---------------- 阶段 2：按层目标等级生成怪物属性（文档 §A；新手图豁免） ----------------
/** [适配] 战士在等级 L 的期望值：成长取 classes.ts 战士 base/grow；期望装备防御 ≈ 0.6×L，装备攻击占 ~30%（文档 §D「装备占攻击 25–35%」）。战士成长本身不改（F 归战斗开发） */
export const expectWarrior = (L: number) => { const l = Math.max(1, L) - 1;
  return { hp: 800 + 110 * l, def: 26 + 5.5 * l + 0.6 * (l + 1), pw: (70 + 11 * l) * 1.3 }; };
/** 文档 §A：k 按等级段 0.04/0.06/0.08/0.09，T 按等级段 4/5/6/7 */
export const atkK = (L: number) => L <= 6 ? 0.04 : L <= 15 ? 0.06 : L <= 30 ? 0.08 : 0.09;
/** [适配] 文档 T=4/5/6/7；7–30 级段模拟校准下调到 4.5/5（战士无群攻，同屏 2–3 怪时原值死亡过多） */
export const hpT = (L: number) => L <= 6 ? 4 : L <= 15 ? 4.5 : L <= 30 ? 5 : 7;
/** [适配] 本作同屏多怪同时出手（文档公式按单怪推），攻击按等级段 ×0.8/0.7/0.9/0.85（1–6/7–20/21–30/31+），模拟校准值 */
export const FOE_ATK_SCALE_AT = (L: number) => L <= 6 ? 0.8 : L <= 20 ? 0.7 : L <= 30 ? 0.9 : 0.85;
export const formulaStats = (L: number) => { const e = expectWarrior(L);
  return { atk: Math.round(FOE_ATK_SCALE_AT(L) * (0.6 * e.def + atkK(L) * e.hp)), hp: Math.round(e.pw * hpT(L)), def: Math.round(0.25 * e.pw * 0.6) }; };
/** [适配] BOSS：按 L_f+2 的普通怪公式 × 倍率（血 ×BOSS_HP_X、攻 ×BOSS_ATK_X）。BOSS 机制/强化（文档 B）归战斗开发，此处只给基础面板 */
export const BOSS_HP_X = 3, BOSS_ATK_X = 0.9, BOSS_DEF_X = 1.1;
/** [适配] 同层怪物之间保留原有强弱差异：按该怪原面板 ÷ 本层普通怪原面板均值，夹在 0.85–1.15 */
const ratio = (v: number, avg: number) => Math.max(0.85, Math.min(1.15, avg > 0 ? v / avg : 1));
/** 第 f 层的怪物面板（f 为 EXEMPT_FLOORS 或越界时返回 null = 用原值） */
export const foeStatsAt = (id: string, f: number): { level: number; hp: number; atk: number; def: number } | null => {
  const d = ENEMIES[id]; if (!d || EXEMPT_FLOORS.includes(f) || f < 0 || f >= FLOORS.length) return null;
  const level = monsterLevelAt(id, f), s = formulaStats(FLOOR_TARGET_LV[f] + (d.tier === 'boss' ? 2 : 0)); // [适配] 显示等级（经验衰减用）普通 L_f+0~3、BOSS L_f+5；面板统一按 L_f（BOSS L_f+2）计算，同层强弱差异由 ratio 体现
  if (d.tier === 'boss') return { level, hp: Math.round(s.hp * BOSS_HP_X), atk: Math.round(s.atk * BOSS_ATK_X), def: Math.round(s.def * BOSS_DEF_X) };
  const ns = FLOORS[f].spawns.map(sp => ENEMIES[sp.id]).filter(x => x && x.tier !== 'boss');
  const avg = (k: 'hp' | 'atk') => ns.reduce((a, x) => a + x[k], 0) / Math.max(1, ns.length);
  return { level, hp: Math.round(s.hp * ratio(d.hp, avg('hp'))), atk: Math.round(s.atk * ratio(d.atk, avg('atk'))), def: s.def };
};
