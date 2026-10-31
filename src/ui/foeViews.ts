/** 战斗场景卡牌视图对账（纯函数，无 Phaser 依赖，便于单测）。
 *  练级图（farm）刷新怪 / 号角召出的怪不发 summon 事件，只靠事件建卡会出现「看不到的怪在攻击我」，场景每帧用它补建。 */
export interface FoeLike { uid: number; alive: boolean; team: string }
export function foesWithoutView<U extends FoeLike>(w: { town?: unknown; alive(team: 'enemy'): U[] }, has: (uid: number) => boolean): U[] {
  return w.town ? [] : w.alive('enemy').filter(u => !has(u.uid));
}
