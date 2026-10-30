import Phaser from 'phaser';
import { FX, FONT } from '../data/fx';
type S = Phaser.Scene;

/** 月牙形（dir=1 朝右）：外弧与偏移内弧之间的区域 */
function crescent(g: Phaser.GameObjects.Graphics, r: number, thick: number, span = 1.1) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= 20; i++) { const a = -span + (2 * span * i) / 20; pts.push(new Phaser.Math.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  for (let i = 20; i >= 0; i--) { const a = -span + (2 * span * i) / 20; pts.push(new Phaser.Math.Vector2(Math.cos(a) * (r - thick) - thick * 0.6, Math.sin(a) * (r - thick * 0.3))); }
  g.fillPoints(pts, true);
}
function sparks(s: S, x: number, y: number, n: number, color: number, dist: number, ms: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = dist * (0.5 + Math.random() * 0.5);
    const p = s.add.circle(x, y, 2 + Math.random() * 2, color).setDepth(60);
    s.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, duration: ms, onComplete: () => p.destroy() });
  }
}
/** 普攻刀光：攻击者前方的橙红月牙 + 少许黄火花 */
export function slash(s: S, x: number, y: number, cardH: number, dir: number) {
  const r = cardH * FX.slashHeightRatio / 2;
  const g = s.add.graphics({ x, y }).setDepth(55);
  g.fillStyle(FX.slashColor, 0.95); crescent(g, r, r * 0.35, 1.0);
  g.fillStyle(0xffe08a, 0.8); crescent(g, r * 0.98, r * 0.1, 0.9);
  g.setScale(dir, 1).setAlpha(1);
  s.tweens.add({ targets: g, x: x + dir * 14, alpha: 0, duration: FX.slashMs, onComplete: () => g.destroy() });
  sparks(s, x + dir * r * 0.8, y, 4, FX.slashSparkColor, 18, FX.slashMs);
}
export function hitSpark(s: S, x: number, y: number) { sparks(s, x, y, 5, FX.slashSparkColor, 10, FX.hitSparkMs); }

/** 血红正圆剑气（烈火剑法），边缘暗红/黑色撕裂拖尾 */
export function bloodBlade(s: S, x: number, y: number, cardH: number, color = FX.bloodColor) {
  const R = cardH * FX.bloodRadiusRatio;
  const g = s.add.graphics({ x, y }).setDepth(56);
  g.fillStyle(color, 0.5).fillCircle(0, 0, R);
  g.fillStyle(color, 0.75).fillCircle(0, 0, R * 0.55);
  g.lineStyle(6, FX.bloodEdge, 0.9).strokeCircle(0, 0, R);
  for (let i = 0; i < 9; i++) { // 撕裂拖尾
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.3;
    g.fillStyle(i % 2 ? 0x000000 : FX.bloodEdge, 0.85);
    g.fillTriangle(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, Math.cos(a + 0.25) * R * 1.0, Math.sin(a + 0.25) * R * 1.0, Math.cos(a + 0.12) * R * 1.35, Math.sin(a + 0.12) * R * 1.35);
  }
  g.setScale(0.6);
  s.tweens.add({ targets: g, scale: 1.08, angle: 40, duration: FX.bloodMs, ease: 'Quad.easeOut' });
  s.tweens.add({ targets: g, alpha: 0, delay: FX.bloodMs * 0.5, duration: FX.bloodMs * 0.5, onComplete: () => g.destroy() });
}
/** 半月弯刀：巨大紫色半月剑气从左向右扫过各目标 */
export function halfMoon(s: S, x0: number, x1: number, y: number, cardH: number) {
  const R = cardH * 0.7;
  const g = s.add.graphics({ x: x0, y }).setDepth(56);
  g.fillStyle(FX.halfMoonColor, 0.75); crescent(g, R, R * 0.4, 1.3);
  g.fillStyle(FX.bloodColor, 0.5); crescent(g, R * 0.97, R * 0.12, 1.25);
  g.setScale(x1 >= x0 ? 1 : -1, 1);
  s.tweens.add({ targets: g, x: x1, duration: FX.halfMoonMs, ease: 'Linear' });
  s.tweens.add({ targets: g, alpha: 0, delay: FX.halfMoonMs * 0.6, duration: FX.halfMoonMs * 0.4, onComplete: () => g.destroy() });
}
/** 暗影斩击：紫黑+红交织的撕裂刀光，覆盖目标，小幅屏幕震动 */
export function shadowSlash(s: S, x: number, y: number, cardH: number) {
  const L = cardH * 0.75;
  const g = s.add.graphics({ x, y }).setDepth(56);
  FX.shadowColors.forEach((c, i) => {
    const a = -0.9 + i * 0.6;
    g.lineStyle(14 - i * 3, c, 0.9).lineBetween(-Math.cos(a) * L / 2, -Math.sin(a) * L / 2, Math.cos(a) * L / 2, Math.sin(a) * L / 2);
    g.lineStyle(10 - i * 2, c, 0.8).lineBetween(-Math.cos(-a) * L / 2, -Math.sin(-a) * L / 2, Math.cos(-a) * L / 2, Math.sin(-a) * L / 2);
  });
  g.setScale(0.4);
  s.tweens.add({ targets: g, scale: 1.1, duration: FX.shadowMs * 0.4, ease: 'Quad.easeOut' });
  s.tweens.add({ targets: g, alpha: 0, delay: FX.shadowMs * 0.5, duration: FX.shadowMs * 0.5, onComplete: () => g.destroy() });
  s.cameras.main.shake(FX.shadowMs * 0.6, FX.shadowShake);
}
/** 护体光环 */
export function shieldAura(s: S, x: number, y: number, cardH: number) {
  const g = s.add.circle(x, y, cardH * 0.55, 0xffd24a, 0.25).setStrokeStyle(4, 0xffe8a0).setDepth(56);
  s.tweens.add({ targets: g, scale: 1.2, alpha: 0, duration: 600, onComplete: () => g.destroy() });
}
/** 伤害数字：出现瞬间放大（不回弹）→ 匀速直线上飘 → 淡出 */
export function floatNumber(s: S, x: number, y: number, cardH: number, text: string, color: string, scale = 1) {
  const size = Math.round(cardH * FX.dmgSizeRatio * scale);
  const t = s.add.text(x, y, text, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(80).setScale(0.3);
  s.tweens.add({ targets: t, scale: 1, duration: FX.dmgPopMs, ease: 'Quad.easeOut' });
  s.tweens.add({ targets: t, y: y - cardH * FX.dmgRiseRatio, duration: FX.dmgLifeMs, ease: 'Linear' });
  s.tweens.add({ targets: t, alpha: 0, delay: FX.dmgLifeMs * 0.55, duration: FX.dmgLifeMs * 0.45, onComplete: () => t.destroy() });
}

// ===== 法师 / 道士特效（同样用 Graphics + Tween 程序化绘制） =====
function glowBall(s: S, x: number, y: number, r: number, core: number, edge: number) {
  const g = s.add.graphics({ x, y }).setDepth(57);
  g.fillStyle(edge, 0.35).fillCircle(0, 0, r * 1.6); g.fillStyle(edge, 0.8).fillCircle(0, 0, r); g.fillStyle(core, 1).fillCircle(0, 0, r * 0.5);
  return g;
}
/** 弹道：从施法者飞向目标，带拖尾粒子，到达后回调 */
export function projectile(s: S, x0: number, y0: number, x1: number, y1: number, kind: 'fire' | 'talisman' | 'poison', onHit: () => void) {
  const col = kind === 'fire' ? [0xffee88, 0xff5a00] : kind === 'talisman' ? [0xfff2a0, 0xd4a020] : [0xc8ff80, 0x2a9a20];
  const g = kind === 'talisman' ? s.add.rectangle(x0, y0, 16, 26, 0xf0d060).setStrokeStyle(2, 0xa01010).setDepth(57) : glowBall(s, x0, y0, 14, col[0], col[1]);
  const ms = Math.max(160, Math.abs(x1 - x0) * 0.7);
  const trail = s.time.addEvent({ delay: 25, loop: true, callback: () => {
    const p = s.add.circle(g.x, g.y + (Math.random() - 0.5) * 10, 4 + Math.random() * 4, col[1], 0.8).setDepth(56);
    s.tweens.add({ targets: p, alpha: 0, scale: 0.2, duration: 260, onComplete: () => p.destroy() });
  } });
  s.tweens.add({ targets: g, x: x1, y: y1, angle: kind === 'talisman' ? 720 : 0, duration: ms, ease: 'Quad.easeIn', onComplete: () => { trail.remove(); g.destroy(); onHit(); } });
}
/** 火焰爆炸 */
export function explosion(s: S, x: number, y: number, r: number, inner = 0xffdd55, outer = 0xff4400) {
  const g = s.add.graphics({ x, y }).setDepth(58);
  g.fillStyle(outer, 0.6).fillCircle(0, 0, r); g.fillStyle(inner, 0.9).fillCircle(0, 0, r * 0.5);
  g.setScale(0.3); s.tweens.add({ targets: g, scale: 1.2, alpha: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
  sparks(s, x, y, 12, inner, r * 1.2, 380);
}
/** 雷电术：从屏幕上方劈下折线闪电 + 白闪 */
export function lightning(s: S, x: number, yTop: number, yHit: number) {
  const g = s.add.graphics().setDepth(58);
  const draw = () => {
    g.clear(); let px = x + (Math.random() - 0.5) * 40, py = yTop;
    for (const [w, c, a] of [[10, 0x6aa0ff, 0.5], [4, 0xffffff, 1]] as const) {
      g.lineStyle(w, c, a); g.beginPath(); px = x; py = yTop; g.moveTo(px, py);
      let seed = 0; while (py < yHit) { py += 30; px = x + Math.sin(py * 0.13 + seed++) * 22; g.lineTo(px, py); }
      g.strokePath();
    }
  };
  draw(); s.time.delayedCall(70, draw);
  s.tweens.add({ targets: g, alpha: 0, delay: 140, duration: 200, onComplete: () => g.destroy() });
  sparks(s, x, yHit, 14, 0xaaccff, 50, 300); s.cameras.main.flash(80, 180, 200, 255);
}
/** 冰咆哮：地面冰环扩散 + 冰晶碎片 */
export function iceRoar(s: S, x: number, y: number, r: number) {
  const ring = s.add.ellipse(x, y, r * 2, r * 0.5).setStrokeStyle(8, 0x9ae6ff, 0.9).setFillStyle(0x5ac8ff, 0.25).setDepth(9).setScale(0.1);
  s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 520, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, sh = s.add.triangle(x, y, 0, 18, 6, 0, 12, 18, 0xd8f6ff, 0.9).setDepth(58);
    s.tweens.add({ targets: sh, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.3 - 40, angle: 360, alpha: 0, duration: 600, onComplete: () => sh.destroy() });
  }
}
/** 冰冻减速标记：目标短暂泛蓝 */
export function frostTint(img: Phaser.GameObjects.GameObject, ms: number) {
  const a = img as Phaser.GameObjects.Image; if (!a.setTint) return; a.setTint(0x88ccff);
  a.scene.time.delayedCall(ms, () => a.active && a.clearTint());
}
/** 魔法盾：蓝色泡泡罩住施法者，持续闪烁 */
export function magicShield(s: S, target: Phaser.GameObjects.Container, cy: number, h: number, ms: number) {
  const e = s.add.ellipse(0, cy - target.y, h * 0.85, h * 1.05, 0x3a7aff, 0.18).setStrokeStyle(4, 0x8ac8ff, 0.9);
  target.add(e); e.setScale(0.2);
  s.tweens.add({ targets: e, scale: 1, duration: 260, ease: 'Back.easeOut' });
  s.tweens.add({ targets: e, alpha: 0.55, duration: 500, yoyo: true, repeat: -1, delay: 260 });
  s.time.delayedCall(ms, () => e.destroy());
}
/** 施毒术：绿色毒雾笼罩 */
export function poisonCloud(s: S, x: number, y: number, h: number) {
  for (let i = 0; i < 10; i++) {
    const c = s.add.circle(x + (Math.random() - 0.5) * h * 0.5, y + (Math.random() - 0.5) * h * 0.5, h * (0.08 + Math.random() * 0.08), 0x4ad820, 0.45).setDepth(57);
    s.tweens.add({ targets: c, y: c.y - 30, scale: 1.8, alpha: 0, duration: 700 + Math.random() * 400, onComplete: () => c.destroy() });
  }
}
/** 召唤：地面暗绿法阵 + 光柱 */
export function summonCircle(s: S, x: number, y: number) {
  const ring = s.add.ellipse(x, y, 200, 50).setStrokeStyle(4, 0x7aff7a, 0.9).setFillStyle(0x0a3a0a, 0.5).setDepth(9).setScale(0.2);
  s.tweens.add({ targets: ring, scale: 1, duration: 300, ease: 'Back.easeOut' });
  s.tweens.add({ targets: ring, alpha: 0, delay: 700, duration: 400, onComplete: () => ring.destroy() });
  const p = s.add.graphics().setDepth(56); p.fillGradientStyle(0x9aff9a, 0x9aff9a, 0x9aff9a, 0x9aff9a, 0, 0, 0.6, 0.6).fillRect(x - 40, y - 260, 80, 260);
  s.tweens.add({ targets: p, alpha: 0, duration: 900, onComplete: () => p.destroy() });
  sparks(s, x, y - 60, 16, 0xc8ffc8, 80, 600);
}
/** 神圣光环：金色光柱 + 上升光点（道士治疗/护甲） */
export function holyLight(s: S, x: number, y: number, h: number) {
  const p = s.add.graphics().setDepth(56); p.fillGradientStyle(0xffe680, 0xffe680, 0xffe680, 0xffe680, 0, 0, 0.55, 0.55).fillRect(x - h * 0.3, y - h * 0.6, h * 0.6, h * 1.1);
  s.tweens.add({ targets: p, alpha: 0, duration: 900, onComplete: () => p.destroy() });
  for (let i = 0; i < 12; i++) {
    const d = s.add.circle(x + (Math.random() - 0.5) * h * 0.5, y + h * 0.4, 3, 0xfff2a0).setDepth(58);
    s.tweens.add({ targets: d, y: y - h * 0.5, alpha: 0, duration: 700 + Math.random() * 400, onComplete: () => d.destroy() });
  }
}
