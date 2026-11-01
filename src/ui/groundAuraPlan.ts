/** 脚下光环的纯逻辑（无 Phaser，可无头单测）；播放见 groundAura.ts */
export const GROUND_AURA_SKILLS = ['holy_armor', 'ghost_shield', 'vajra_body'] as const;
export type AuraSkill = typeof GROUND_AURA_SKILLS[number];
export const AURA_DEPTH = 9, AURA_SCALE_MIN = 0.8, AURA_SCALE_MAX = 1.2;
export const auraKeys = (id: string) => ({ start: `fx_aura_${id}_start`, loop: `fx_aura_${id}_loop`, end: `fx_aura_${id}_end` });
/** 增益技能 → 表现方式（映射表，单测断言用）：ground=脚下光环；body=套在身上的罩 */
export const BUFF_FX: Record<string, { kind: 'ground' | 'body'; keys: string[] }> = {
  magic_shield: { kind: 'body', keys: ['fx_magic_shield_cast', 'fx_magic_shield_loop'] },
  ...Object.fromEntries(GROUND_AURA_SKILLS.map(id => { const k = auraKeys(id); return [id, { kind: 'ground' as const, keys: [k.start, k.loop, k.end] }]; })),
};
export const isBodyShieldKey = (k: string) => /^fx_(magic_shield|ghost_shield|holy_armor)_(cast|loop)$/.test(k);

export interface BuffUnit { uid: number; alive?: boolean; auraSkill?: string; defUp?: number; defUpUntil?: number; mdefUp?: number; mdefUpUntil?: number }
const on = (v?: number, until?: number, now = 0) => (v ?? 0) > 0 && (until ?? 0) > now;
export function auraActive(u: BuffUnit, id: string, now: number) {
  const d = on(u.defUp, u.defUpUntil, now), m = on(u.mdefUp, u.mdefUpUntil, now);
  return id === 'holy_armor' ? d : id === 'ghost_shield' ? m : id === 'vajra_body' ? d && m : false;
}
/** 该单位此刻应显示哪个光环：优先最近施放的（auraSkill），否则仍有效的其他增益；无 → null */
export function wantAura(u: BuffUnit, now: number): AuraSkill | null {
  if (u.alive === false) return null;
  const last = u.auraSkill as AuraSkill | undefined;
  if (last && (GROUND_AURA_SKILLS as readonly string[]).includes(last) && auraActive(u, last, now)) return last;
  if (!last) return null; // 只有施放过光环类增益才显示（避免怪物/其他来源的 def 加成误触发）
  return (['holy_armor', 'ghost_shield'] as const).find(id => auraActive(u, id, now)) ?? null;
}
/** 光环 until：用于换图后「同一次增益」不再重新出现 */
export const untilOf = (u: BuffUnit, id: string) => id === 'ghost_shield' ? u.mdefUpUntil ?? 0 : u.defUpUntil ?? 0;

export const auraScale = (w: number) => Math.min(AURA_SCALE_MAX, Math.max(AURA_SCALE_MIN, w / 150));
