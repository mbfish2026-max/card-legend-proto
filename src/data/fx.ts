// 特效/表现可调常量（依据视频逐帧分析；不确定处可在此微调）
export const FONT = '"PingFang SC","Microsoft YaHei",sans-serif';
export const GROUND_Y = 545;           // 卡牌底边
export const FX = {
  entrySlide: true,                    // 入场：从右边缘匀速滑入（false=直接出现在排队位）
  shadowColor: 0x000000, shadowAlpha: 0.55,
  // 普攻
  portraitSwingMs: 300, portraitSwingAngle: 7, portraitSwingDx: 8,
  slashColor: 0xff8c00, slashSparkColor: 0xffdd33, slashMs: 180, slashHeightRatio: 0.5,
  hitSparkMs: 140,
  hitFlashMs: 100, hitFlashColor: 0xff2020, bossHitFlashColor: 0xffffff, hitFlashAlpha: 0.55,
  hitShakeRatio: 0.035, hitShakeMs: 160, hitShakeCycles: 4,
  // 技能
  windupMs: 200, windupBackDx: 10, windupGlow: 0xff2020,
  bloodColor: 0xcc0000, bloodEdge: 0x2a0000, bloodMs: 400, bloodRadiusRatio: 0.75,
  halfMoonColor: 0x9933ff, halfMoonMs: 420,
  shadowColors: [0x5a1a8a, 0x111111, 0xcc0000], shadowMs: 380, shadowShake: 0.004,
  // 伤害数字
  dmgSizeRatio: 1 / 6, dmgColor: '#ff2a2a', healColor: '#33ff55', statusColor: '#cc66ff', critScale: 1.3,
  dmgPopMs: 80, dmgRiseRatio: 0.18, dmgLifeMs: 650,
  // 死亡/掉落
  deathDarkMs: 200, deathFadeMs: 300,
  dropArcRatio: 1 / 3, dropFlyMs: 550, dropBounce: 8, dropSpreadRatio: 0.9, dropIconSize: 34,
  pillarHeight: 70, pillarCommon: 0xffff00, pillarRare: 0xff0000, pillarMagic: 0x3388ff,
  pickupDelayMs: 600, pickupSpeed: 260,
  // UI
  orbLerp: 4, orbWaveAmp: 3, orbWaveLen: 26, orbWaveSpeed: 3,
  waveDelay: 1.0,
};
/** 掉落物光柱颜色：普通/金币黄，高级装备红或蓝 */
export const RARITY: Record<string, number> = { dragon_sword: FX.pillarRare, armor: FX.pillarRare, gold_ring: FX.pillarMagic, pearl: FX.pillarMagic };
