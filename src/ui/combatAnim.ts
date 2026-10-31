import type { BattleEvent, Unit } from '../combat/types';
/** 战斗动作分发（主角/怪物/召唤物/诱惑之光宠物共用同一套：attack → swing+lunge，damage → hit） */
export interface AnimView { unit: Unit; x: number; swing(dir: number): void; lunge(dir: number, dist?: number): void; hit(): void }
export type AnimResult = { kind: 'attack'; sv: AnimView; tv: AnimView; dir: number } | { kind: 'hurt'; v: AnimView } | null;
export const LUNGE_DIST = 18;
/** 纯表现：只调用视图动画，不读写战斗数值。技能攻击（e.skill）/治疗不在此处理 */
export function playCombatAnim(e: BattleEvent, get: (uid: number) => AnimView | undefined): AnimResult {
  if (e.type === 'attack') {
    if (e.skill) return null;
    const sv = get(e.source), tv = get(e.target); if (!sv || !tv) return null;
    const dir = tv.x >= sv.x ? 1 : -1; sv.swing(dir); sv.lunge(dir, LUNGE_DIST);
    return { kind: 'attack', sv, tv, dir };
  }
  if (e.type === 'damage' && !e.heal) { const v = get(e.target); if (!v) return null; v.hit(); return { kind: 'hurt', v }; }
  return null;
}
