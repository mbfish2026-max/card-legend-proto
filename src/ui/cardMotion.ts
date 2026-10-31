/**
 * R54 卡牌立绘动作的缩放关键帧（相对静态基准 artSX/artSY 的倍数）。
 * 需求：攻击/受击/前摇/待机全过程立绘不得放大（≤1），保留位移、倾斜、闪白、震动；只允许压缩。
 * 修改前：普攻 scaleX×1.08、技能前摇 ×1.06/×1.06、待机呼吸 scaleY 最高 ×1.018。
 */
export const SWING_SCALE = { x: 1, y: 0.96 };
export const WINDUP_SCALE = { x: 1, y: 0.97 };
export const HIT_SCALE = { x: 1, y: 0.95 };
/** 待机呼吸：只在 [1-0.036, 1] 之间压缩，不再高于基准 */
export const breathScaleY = (ph: number) => 1 - (0.5 + 0.5 * Math.sin(ph * 2.4)) * 0.036;
