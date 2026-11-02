import { ENEMIES } from './units';
import { ITEMS } from './items';
import { FLOORS } from './world';
import { FLOOR_TARGET_LV } from './balance';
import { applyRealign } from './drop-realign';
/**
 * 阶段 4（balance-sys）：魔兽 drop-plan 覆盖层。在 R13 官方掉落（drops-official, 1/N）之上做三件事，全部标 [适配]：
 *  1) 越级封顶：怪物出现的最低层目标等级 L_min，装备需求 > L_min + CAP（普通 6 / BOSS 8）的条目移除
 *     （万年树妖 L10 用千年树妖表掉 26–35 装、骷髅精灵掉破魂 22、兽人酋长必掉重盔甲 22 等）。
 *  2) 补源：圣战/法神/祖玛套/赤月套/铁戒指/中型盔甲 原无任何来源；合击版 4 层主线 + 魔龙血域 原无装备（仅铁靴）。
 *  3) 靴子 GAP：本作靴子止于 祖玛靴（套装 30）；官方高阶靴 未查到 → 只记录不新增。
 * 爆率 1/N 为 [适配]（官方对应怪 未查到）。旧存档不受影响（只改掉落表）。
 */
export const CAP_NORMAL = 6, CAP_BOSS = 8;
/** [适配] 非武器（首饰/衣服/头盔）封顶放宽到 +14：模拟显示 24 级首饰整体下移会让战士卡尸王殿、法师死亡翻倍；武器（龙纹/裁决/无极/井中月/炼狱 等 26–35）按 +8 封顶 */
export const CAP_GEAR = 14;
export const DROP_ADD: Record<string, [string, number][]> = {
  wolf_king: [['iron_ring', 1 / 6]],
  orc: [['iron_ring', 1 / 100]],
  skeleton_lord: [['medium_armor', 1 / 15]],
  // D8/E5（P2 eg-sets）：自创祖玛套/赤月套停掉落（原 1/20、1/25），旧存档保留
};
const SZ = ['helm', 'necklace', 'ring', 'bracelet'];
const HJ_GEAR: [string, number][] = [...SZ.map(k => ['shengzhan_' + k, 1 / 40] as [string, number]), ...SZ.map(k => ['fashen_' + k, 1 / 40] as [string, number]),
  ['dragon_sword', 1 / 60], ['longwen', 1 / 40], ['war_armor', 1 / 30], ['ghost_robe', 1 / 30], ['demon_robe', 1 / 30]];
HJ_GEAR.push(...SZ.map(k => ['tianzun_' + k, 1 / 40] as [string, number])); // P2：补天尊 4 件
for (const b of ['boss_hj_home', 'boss_wolong', 'boss_leiyan', 'boss_fire_dragon', 'boss_molong']) DROP_ADD[b] = [...HJ_GEAR];
/** P2 eg-sets：40–50 级新装备来源（docs/equip-3050-plan.md §2/§4.1；本作 1/N 已按 E1「官方 N÷40，不优于 1/8」换算/[适配]）。
 *  只挂在最低出现层 ≥40 级的 BOSS 上（tests/eg-sets.test.ts 断言 40 级以下层不掉 40+ 装备）。 */
const P = (ids: string[], n: number) => ids.map(id => [id, 1 / n] as [string, number]);
const SHENBING = ['nuzhan', 'longya', 'xiaoyao_fan'], HEAVY40 = ['tianmo_armor', 'fashen_cape', 'tianzun_robe'];
const ACC = (pre: string[], parts: string[]) => pre.flatMap(p => parts.map(k => p + '_' + k));
const LEITING = ACC(['leiting', 'lieyan', 'guangmang'], ['necklace', 'bracelet', 'ring', 'boots']), ZHANSHEN = ACC(['zhanshen', 'shengmo', 'zhenhun'], ['necklace', 'bracelet', 'ring']);
export const EG_DROPS: Record<string, [string, number][]> = {
  boss_zuma: [...P(SHENBING, 100), ...P(['shihun_staff'], 200), ...P(['mingyun_blade'], 60)], // P3 复核：命运之刃官方为 35 级战士任务奖励（21cq「命运之刃任务」；祖玛教主 Mob 页无此物），本作无任务系统 → 暂以祖玛 1/60 代替 [适配]
  boss_bull_king: [...P(SHENBING, 100), ...P(['shihun_staff'], 200)],
  boss_hongmo: P(HEAVY40, 20),
  boss_redmoon: P(SHENBING, 50), // 天尊 4 件走 r14b setDrop（三圣职业套）
  boss_twinhead_kong: P(ACC(['shengzhan'], ['helm', 'necklace', 'ring', 'bracelet']), 25),
  boss_twinhead_blood: P(ACC(['fashen'], ['helm', 'necklace', 'ring', 'bracelet']), 25),
  boss_hj_home: [...P(HEAVY40, 20), ...P(SHENBING, 40), ...P(['shihun_staff'], 80), ...P(['bazhe_blade'], 40)],
  boss_wolong: [...P(['shenglong_helm', 'molong_helm', 'tianlong_helm'], 20), ...P(['leiting_armor', 'lieyan_robe', 'guangmang_robe'], 25)],
  boss_leiyan: P(LEITING, 30),
  boss_molong: [...P(ZHANSHEN, 30), ...P(LEITING, 40), ...P(['fengtian_armor'], 40)], // P3 D7：副本内战神系 ×0.5（=1/60，dungeons.ts DUNGEON_ITEM_SCALE），普通击杀不变
  boss_fire_dragon: [...P(['kaitian', 'zhentian', 'xuantian'], 40), ...P(['fengtian_armor'], 25)],
};
for (const [b, add] of Object.entries(EG_DROPS)) (DROP_ADD[b] ??= []).push(...add);
/** 怪物出现的最低层目标等级（未出现在任何层 → undefined，不封顶） */
export const minFloorLv = (id: string): number | undefined => { let m: number | undefined;
  FLOORS.forEach((f, i) => { if (f.spawns.some(s => s.id === id)) m = Math.min(m ?? 99, FLOOR_TARGET_LV[i]); }); return m; };
export const DROPS_BEFORE: Record<string, { item: string; chance: number }[]> = {};
export const DROP_REMOVED: Record<string, string[]> = {};
for (const [id, u] of Object.entries(ENEMIES)) {
  DROPS_BEFORE[id] = [...(u.drops ?? [])].map(d => ({ ...d }));
  const L = minFloorLv(id); const cap = L === undefined ? 99 : L + (u.tier === 'boss' ? CAP_BOSS : CAP_NORMAL);
  const keep = (u.drops ?? []).filter(d => { const it = ITEMS[d.item]; if (!it?.slot) return true; const c = it.slot === 'weapon' || u.tier !== 'boss' ? cap : (L ?? 99) + CAP_GEAR; return (it.req ?? 0) <= c; });
  const rm = (u.drops ?? []).filter(d => !keep.includes(d)).map(d => d.item); if (rm.length) DROP_REMOVED[id] = rm;
  u.drops = keep;
}
/** D7（drop-realign）：撤回「下移到尸王」的重挂（原 RELOCATE_TO='boss_lich'），这些装备改挂官方来源怪，见 drop-realign.ts。 */
for (const [id, add] of Object.entries(DROP_ADD)) { const u = ENEMIES[id]; if (!u) continue;
  for (const [item, chance] of add) if (ITEMS[item] && !(u.drops ??= []).some(d => d.item === item)) u.drops.push({ item, chance }); }

/**
 * 技能书 extraDrops 钩子（balance-sys）：BOSS 掉落表的额外条目入口，**数据归战斗开发**（技能书来源/爆率）。
 * 本分支只放空表 + 接线：键 = BOSS id，值 = [物品 id, 几率 0–1][]。非 BOSS、未知物品、重复物品一律忽略；几率夹到 0–1。
 * 在越级封顶/补源之后追加（不受封顶影响），旧存档不受影响（只改掉落表）。
 */
export const BOSS_EXTRA_DROPS: Record<string, [string, number][]> = {};
export function applyExtraDrops(table: Record<string, [string, number][]> = BOSS_EXTRA_DROPS): string[] {
  const added: string[] = [];
  for (const [id, add] of Object.entries(table)) { const u = ENEMIES[id]; if (!u || u.tier !== 'boss') continue;
    for (const [item, chance] of add) { if (!ITEMS[item] || !(chance > 0) || (u.drops ??= []).some(d => d.item === item)) continue;
      u.drops.push({ item, chance: Math.min(1, chance) }); added.push(`${id}:${item}`); } }
  return added;
}
applyRealign(); // drop-realign：124 件装备来源/爆率按方案 B 表整体替换（机制源不动）
applyExtraDrops();
