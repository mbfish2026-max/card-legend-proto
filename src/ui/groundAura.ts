import Phaser from 'phaser';
import { FX_DEFS, playFx } from './FxPlayer';

/**
 * 增益「脚下地面光环」（fx/ground-aura 素材，3592a37）：神圣战甲术 / 幽灵盾 / 金刚护体。
 * start(5 帧) → loop(10 帧循环) → end(4 帧)；帧 256×96，pivot(128,48)=脚底中心；12fps、ADD、depth 9（卡牌 depth≥10 之下）。
 * 旋转/呼吸已画进帧里 → 代码不旋转，只做 0.8–1.2 等比缩放。
 * 状态驱动：每帧按单位的 buff 字段决定是否该有光环 → buff 结束/被驱散/死亡统一播 end 并销毁；换图销毁旧 sprite，未过期 buff 在新图重新显示；刷新不叠加（每单位至多 1 个）。
 * 魔法盾仍是套在身上的椭圆罩（BattleScene 'magic_shield' 分支），不走这里。
 */
import { AuraSkill, BuffUnit, AURA_DEPTH, auraKeys, auraScale, wantAura } from './groundAuraPlan';
export * from './groundAuraPlan';

interface AuraView { unit: BuffUnit; cx: number; y: number; w: number; active: boolean }
interface Entry { skill: AuraSkill; sp: Phaser.GameObjects.Sprite | null; phase: 'start' | 'loop'; scale: number }

export class GroundAuras {
  readonly live = new Map<number, Entry>();
  readonly ending = new Set<Phaser.GameObjects.Sprite>();
  private endPos = new Map<Phaser.GameObjects.Sprite, number>();
  constructor(private s: Phaser.Scene) {}
  private spawn(uid: number, e: Entry, phase: 'start' | 'loop', x: number, y: number) {
    const k = auraKeys(e.skill)[phase];
    const sp = playFx(this.s, k, x, y, { scale: e.scale, depth: AURA_DEPTH, onDone: phase === 'start' ? () => { if (this.live.get(uid) === e && e.sp === sp) this.spawn(uid, e, 'loop', sp!.x, sp!.y); } : undefined });
    if (sp) { sp.setRotation(0).setName(`aura:${e.skill}:${phase}`).setData('uid', uid); }
    e.sp = sp; e.phase = phase;
  }
  /** 播 end 并在结束后销毁（无 end 素材/预算不足 → 直接销毁） */
  private finish(uid: number, e: Entry) {
    this.live.delete(uid);
    const sp = e.sp; e.sp = null; if (!sp?.active) return;
    const x = sp.x, y = sp.y; sp.destroy();
    const end = playFx(this.s, auraKeys(e.skill).end, x, y, { scale: e.scale, depth: AURA_DEPTH, onDone: () => { this.ending.delete(end!); this.endPos.delete(end!); } });
    if (end) { end.setRotation(0).setName(`aura:${e.skill}:end`).setData('uid', uid); this.ending.add(end); this.endPos.set(end, uid); }
  }
  sync(now: number, views: Iterable<AuraView>) {
    const seen = new Set<number>();
    for (const v of views) {
      const u = v.unit; if (!v.active) continue; seen.add(u.uid);
      let want = wantAura(u, now);
      let e = this.live.get(u.uid);
      if (e && e.skill !== want) { this.finish(u.uid, e); e = undefined; }
      if (want && !e) { e = { skill: want, sp: null, phase: 'start', scale: auraScale(v.w) }; this.live.set(u.uid, e); this.spawn(u.uid, e, 'start', v.cx, v.y); }
      else if (e && !e.sp?.active) this.spawn(u.uid, e, 'loop', v.cx, v.y); // 预算不足/被外部销毁 → 补 loop
      if (e?.sp?.active) e.sp.setPosition(v.cx, v.y).setRotation(0);
      for (const [sp, id] of this.endPos) if (id === u.uid && sp.active) sp.setPosition(v.cx, v.y);
    }
    for (const [uid, e] of [...this.live]) if (!seen.has(uid)) this.finish(uid, e); // 视图已移除（死亡/离场）
  }
  /** 换图：旧图 sprite 立即销毁；未过期的增益由新图首帧 sync 按 buff 状态重新显示（start→loop） */
  endAll(_units?: Iterable<BuffUnit>) { this.clear(); }
  /** 场景关闭：立即销毁，不留 sprite */
  clear() { this.live.forEach(e => e.sp?.destroy()); this.live.clear(); this.ending.forEach(s => s.destroy()); this.ending.clear(); this.endPos.clear(); }
}
export const hasAuraFx = (s: Phaser.Scene, id: string) => { const k = auraKeys(id); return [k.start, k.loop, k.end].every(x => !!FX_DEFS[x] && s.textures.exists(x)); };
