import { ENEMIES } from './units';
import { ITEMS } from './items';
import { FLOORS } from './world';
import { FLOOR_TARGET_LV } from './balance';
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
  boss_zuma: [['set_zuma_helm', 1 / 20], ['set_zuma_ring', 1 / 20], ['set_zuma_boots', 1 / 20]],
  boss_redmoon: [['set_chiyue_necklace', 1 / 25], ['set_chiyue_ring', 1 / 25], ['set_chiyue_bracelet', 1 / 25]],
};
const SZ = ['helm', 'necklace', 'ring', 'bracelet'];
const HJ_GEAR: [string, number][] = [...SZ.map(k => ['shengzhan_' + k, 1 / 40] as [string, number]), ...SZ.map(k => ['fashen_' + k, 1 / 40] as [string, number]),
  ['dragon_sword', 1 / 60], ['longwen', 1 / 40], ['war_armor', 1 / 30], ['ghost_robe', 1 / 30], ['demon_robe', 1 / 30]];
for (const b of ['boss_hj_home', 'boss_wolong', 'boss_leiyan', 'boss_fire_dragon', 'boss_molong']) DROP_ADD[b] = HJ_GEAR;
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
/** 越级移除的装备「下移到对口层」：需求 ≤ 尸王（最低出现层 19，封顶 27）的条目以原几率并入尸王（尸王殿/矿区，19–24 级段）[适配]；
 *  否则保留在原有的高层来源（蜈蚣洞/石墓 BOSS 同表，不重复添加）。这样 21–30 段的装备节奏由 L10 提前拿 24 级装 → L19–27 拿到。 */
export const RELOCATE_TO = 'boss_lich', RELOCATE_MAX = 0.25; // 下移几率上限 1/4（兽人酋长原 1/1 必掉重盔甲/金戒指）[适配]
{ const L = minFloorLv(RELOCATE_TO) ?? 19, add: [string, number][] = (DROP_ADD[RELOCATE_TO] ??= []);
  for (const [id, rm] of Object.entries(DROP_REMOVED)) for (const item of rm) if ((ITEMS[item]?.req ?? 99) <= L + CAP_BOSS && !add.some(a => a[0] === item))
    add.push([item, Math.min(RELOCATE_MAX, DROPS_BEFORE[id].find(d => d.item === item)!.chance)]); }
for (const [id, add] of Object.entries(DROP_ADD)) { const u = ENEMIES[id]; if (!u) continue;
  for (const [item, chance] of add) if (ITEMS[item] && !(u.drops ??= []).some(d => d.item === item)) u.drops.push({ item, chance }); }
