// BOSS 装备卡点（30–50 地下城 BOSS + 合击版 5 BOSS）[适配]
// 依据：docs/equip-3050-plan.md 在各分支均未找到；阈值取 scripts/gear-probe.ts 实测——9 种子参考玩家首次进入各 BOSS 层时
// 的装备属性（World.equipStats，含套装/成就加成）最小值，按三档缩放（祖玛档 0.85 / 赤月档 0.92 / 终局档 1.0），
// 并对照现有套装表（items.ts：沃玛 req24 / 祖玛 req30 / 赤月 req35）与 endgame-plan 官方套装需求（圣战/法神/天尊 req35+）。
// 因阈值 ≤ 参考玩家实测最小值，参考 sim 的 gap 恒为 0 → 1–39 级与现有平衡数据不变。
// 机制：gap = 三项属性缺口均值（每项 1 - min(1, 实有/门槛)），封顶 GATE_GAP_CAP；
//   BOSS → 主角伤害 ×(1 + GATE_K_TAKEN·gap)；主角/召唤物/英雄 → BOSS 伤害 ×(1 - GATE_K_DEALT·gap)。平滑递增，无硬锁。
//   怪物行为对所有职业一致，仅阈值按职业取各自主属性。
import type { ClassId } from './classes';
export type GateNeed = [main: number, def: number, hp: number];
/** 每职业取哪三项：战士 atk/def/hp，法师 mag/mdef/hp，道士 tao/mdef/hp */
export const GATE_KEYS: Record<ClassId, ['atk' | 'mag' | 'tao', 'def' | 'mdef', 'hp']> = {
  warrior: ['atk', 'def', 'hp'], mage: ['mag', 'mdef', 'hp'], taoist: ['tao', 'mdef', 'hp'],
} as any;
export const GATE_K_TAKEN = 1.5, GATE_K_DEALT = 0.75, GATE_GAP_CAP = 0.5;
const ZUMA: Record<string, GateNeed> = { warrior: [43, 27, 370], mage: [31, 6, 335], taoist: [26, 6, 345] };
const CHIYUE: Record<string, GateNeed> = { warrior: [46, 29, 400], mage: [33, 6, 365], taoist: [29, 6, 375] };
const END: Record<string, GateNeed> = { warrior: [50, 32, 435], mage: [36, 7, 395], taoist: [31, 7, 405] };
export const BOSS_GEAR_GATE: Record<string, Record<string, GateNeed>> = {
  boss_zuma: ZUMA, boss_bull_king: ZUMA,
  boss_hongmo: CHIYUE, boss_redmoon: CHIYUE, boss_hj_home: CHIYUE, boss_wolong: CHIYUE,
  boss_leiyan: END, boss_fire_dragon: END, boss_molong: END,
};
export function gateGap(cls: string, have: Record<string, number>, bossId: string): number {
  const need = BOSS_GEAR_GATE[bossId]?.[cls]; const keys = (GATE_KEYS as any)[cls];
  if (!need || !keys) return 0;
  let g = 0; for (let i = 0; i < 3; i++) g += 1 - Math.min(1, (have[keys[i]] ?? 0) / need[i]);
  return Math.min(GATE_GAP_CAP, g / 3);
}
