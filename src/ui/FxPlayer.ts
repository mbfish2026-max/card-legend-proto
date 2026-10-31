import Phaser from 'phaser';
import { FxQuality, FxBudget } from './Fx';

/**
 * R12 配置驱动的技能特效播放器（素材：特效 Bot 交付的 Phaser JSON Hash 图集，见 assets/fx/MANIFEST）。
 * - 每帧 JSON 里的 anchor 由 Phaser 读成 customPivot，setFrame 时自动作为 origin（已在浏览器确认）；flipX 时手动镜像 origin.x。
 * - 素材未加载/缺失时 play() 返回 null，调用方走 Fx.ts 的简易 Graphics 特效兜底。
 * - 按需加载：不进首屏，PreloadScene 在当前层图片之后按「本职业已学技能」优先分批加载。
 */
export type FxBlend = 'ADD' | 'NORMAL';
export interface FxDef { fps: number; loop?: boolean; blend: FxBlend; depth: number; scale?: number; scaleY?: number; skills: string[] }
const D = (fps: number, blend: FxBlend, depth: number, skills: string[], o: Partial<FxDef> = {}): FxDef => ({ fps, blend, depth, skills, ...o });
/** v2 素材：R13 起全部特效（含火墙/半月/治愈/冰咆哮等非命中）统一 1× 使用（帧尺寸与 pivot 从 JSON 读）；层级：一次性 55–60、火墙 30、召唤圈 9、盾循环 11 */
export const FX_DEFS: Record<string, FxDef> = {
  fx_common_explosion: D(20, 'ADD', 58, ['mage']),
  fx_common_hitspark: D(24, 'ADD', 58, ['*']),
  fx_common_slash: D(24, 'ADD', 57, ['*']),
  fx_fire_sword_hit: D(18, 'ADD', 58, ['fire_sword']),
  fx_fire_wall_loop: D(16, 'ADD', 30, ['fire_wall'], { loop: true }),
  fx_fireball_cast: D(20, 'ADD', 56, ['fireball']),
  fx_fireball_fly: D(20, 'ADD', 57, ['fireball'], { loop: true }),
  fx_fireball_hit: D(20, 'ADD', 58, ['fireball']),
  fx_half_moon_sweep: D(20, 'ADD', 57, ['half_moon']),
  fx_heal_pillar: D(16, 'ADD', 56, ['heal']),
  fx_ice_roar_burst: D(20, 'NORMAL', 57, ['ice_roar']),
  fx_magic_shield_cast: D(20, 'ADD', 56, ['magic_shield']),
  fx_magic_shield_loop: D(12, 'ADD', 11, ['magic_shield'], { loop: true }),
  fx_passive_glint: D(18, 'ADD', 56, ['basic_sword', 'spirit_force']),
  fx_poison_fly: D(20, 'ADD', 57, ['poison'], { loop: true }),
  fx_poison_loop: D(12, 'NORMAL', 56, ['poison'], { loop: true }),
  fx_rush_dash: D(20, 'NORMAL', 56, ['rush']),
  fx_rush_hit: D(20, 'ADD', 58, ['rush']),
  fx_slaying_proc: D(24, 'ADD', 59, ['slaying']),
  fx_soul_fire_fly: D(18, 'NORMAL', 57, ['soul_fire'], { loop: true }),
  fx_soul_fire_hit: D(20, 'ADD', 58, ['soul_fire']),
  fx_summon_beast_circle: D(16, 'NORMAL', 9, ['summon_beast']),
  fx_summon_circle: D(16, 'NORMAL', 9, ['summon_skeleton']),
  fx_summon_pillar: D(16, 'ADD', 56, ['summon_skeleton', 'summon_beast']),
  fx_thrust_hit: D(24, 'ADD', 58, ['thrust']),
  fx_thunder_strike: D(20, 'ADD', 60, ['thunder']),
};
/** 普攻挥砍按职业着色 */
export const SLASH_TINT: Record<string, number> = { warrior: 0xffb060, mage: 0xa08cff, taoist: 0xc0f070 };
export const fxUrl = (k: string) => [`assets/fx/${k}.png`, `assets/fx/${k}.json`] as const;
/** 加载顺序：通用 + 已学技能优先，其余（同职业未学/其他职业）在后 */
export function fxLoadOrder(cls: string, learned: Iterable<string>): string[] {
  const L = new Set(learned), keys = Object.keys(FX_DEFS);
  const rank = (k: string) => { const s = FX_DEFS[k].skills; return s.includes('*') || s.some(x => L.has(x)) || (s.includes('mage') && cls === 'mage') ? 0 : 1; };
  return keys.sort((a, b) => rank(a) - rank(b));
}
/** 同屏特效精灵上限（手机性能）；低特效更少，并跳过纯装饰层 */
export interface PlayOpts { scale?: number; scaleY?: number; depth?: number; tint?: number; flip?: boolean; decorative?: boolean; ms?: number; onFrame?: [number, () => void]; onDone?: () => void }
export function hasFx(s: Phaser.Scene, k: string) { return s.textures.exists(k) && !!FX_DEFS[k]; }
function ensureAnim(s: Phaser.Scene, k: string) {
  if (s.anims.exists(k)) return true;
  const names = s.textures.get(k).getFrameNames().filter(n => n.startsWith(k + '_')).sort();
  if (!names.length) return false;
  const d = FX_DEFS[k];
  s.anims.create({ key: k, frames: names.map(frame => ({ key: k, frame })), frameRate: d.fps, repeat: d.loop ? -1 : 0 });
  return true;
}
/** 播放特效；素材缺失/超上限/低特效装饰层 → null（调用方兜底） */
export function playFx(s: Phaser.Scene, k: string, x: number, y: number, o: PlayOpts = {}): Phaser.GameObjects.Sprite | null {
  const d = FX_DEFS[k];
  if (!d || !s.textures.exists(k) || !ensureAnim(s, k)) return null;
  if (o.decorative && FxQuality.low) return null;
  if (!FxBudget.free()) return null;
  const sp = s.add.sprite(x, y, k).setDepth(o.depth ?? d.depth);
  if (d.blend === 'ADD') sp.setBlendMode(Phaser.BlendModes.ADD);
  const sc = o.scale ?? d.scale ?? 1; sp.setScale(sc, sc * (o.scaleY ?? d.scaleY ?? 1));
  if (o.tint !== undefined) sp.setTint(o.tint);
  FxBudget.track(sp);
  const fixPivot = () => { if (o.flip) { const f = sp.frame; const px = f.customPivot ? f.pivotX : 0.5, py = f.customPivot ? f.pivotY : 0.5; sp.setFlipX(true).setOrigin(1 - px, py); } };
  sp.play(k); fixPivot();
  if (o.flip) sp.on(Phaser.Animations.Events.ANIMATION_UPDATE, fixPivot);
  if (o.onFrame) { const [n, fn] = o.onFrame; let fired = false; sp.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_a: unknown, fr: Phaser.Animations.AnimationFrame) => { if (!fired && fr.index >= n) { fired = true; fn(); } }); }
  if (d.loop) {
    if (o.ms) s.time.delayedCall(Math.max(0, o.ms - 300), () => sp.active && s.tweens.add({ targets: sp, alpha: 0, duration: 300, onComplete: () => { sp.destroy(); o.onDone?.(); } }));
  } else sp.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { sp.destroy(); o.onDone?.(); });
  return sp;
}
/** 让循环特效跟随某个对象（卡片），对象销毁时一并结束 */
export function follow(s: Phaser.Scene, sp: Phaser.GameObjects.Sprite, get: () => { x: number; y: number } | null) {
  const fn = () => { if (!sp.active) { s.events.off('update', fn); return; } const p = get(); if (!p) { sp.destroy(); s.events.off('update', fn); return; } sp.setPosition(p.x, p.y); };
  s.events.on('update', fn);
}
/** 弹道：飞行精灵从 a 飞到 b，到达回调；无素材返回 false */
export function flyFx(s: Phaser.Scene, k: string, x0: number, y0: number, x1: number, y1: number, onHit: () => void): boolean {
  const sp = playFx(s, k, x0, y0); if (!sp) return false;
  const dx = x1 - x0, dy = y1 - y0;
  if (dx < 0) { const f = sp.frame, px = f.customPivot ? f.pivotX : 0.5; sp.setFlipX(true).setOrigin(1 - px, sp.originY).setRotation(-Math.atan2(dy, -dx)); sp.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => sp.setOrigin(1 - px, sp.originY)); }
  else sp.setRotation(Math.atan2(dy, dx));
  s.tweens.add({ targets: sp, x: x1, y: y1, duration: Math.max(160, Math.abs(dx) * 0.7), ease: 'Quad.easeIn', onComplete: () => { sp.destroy(); onHit(); } });
  return true;
}
