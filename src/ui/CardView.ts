import Phaser from 'phaser';
import { Unit } from '../combat/types';
import { FX, FONT, GROUND_Y } from '../data/fx';
import { equipLook } from './EquipLayers';

const FALLBACK: Record<string, number> = { hero: 0x3366cc, deer: 0x887744, wolf: 0x777766, skeleton: 0xcccccc, zombie: 0x557744, boss_lich: 0x442255 };
// 卡框背景色：敌方深红，战士深灰/黑（法师蓝 0x1c3a7a、道士金黄 0x7a5c14 预留）
const BG: Record<string, number> = { player: 0x2a2a2e, normal: 0x4a0c0c, boss: 0x3a0606 };
const EDGE: Record<string, number> = { player: 0xb8a070, normal: 0x8a8a92, boss: 0xd4a64a };
/** 通用人形剪影纹理（占位用，tint 成卡牌主色） */
function silhouette(s: Phaser.Scene) {
  const k = '__silhouette';
  if (!s.textures.exists(k)) {
    const g = s.make.graphics({}, false); g.fillStyle(0xffffff, 1);
    g.fillCircle(100, 52, 34); g.fillRoundedRect(52, 92, 96, 130, 28); g.fillRoundedRect(60, 200, 34, 96, 12); g.fillRoundedRect(106, 200, 34, 96, 12);
    g.fillRoundedRect(28, 100, 28, 100, 12); g.fillRoundedRect(144, 100, 28, 100, 12);
    g.generateTexture(k, 200, 300); g.destroy();
  }
  return k;
}
const DEFAULT_CARD = { w: 140, h: 190, figureScale: 1.15, anchorX: 0.5, footSink: 2, artFacing: -1 as 1 | -1 };

/**
 * 卡牌视图（参照 Fickle Card Legend）：
 * 层级 = 投影(地面) < 卡框背景 < 全身立绘(溢出卡框，不裁剪) < 底部信息条/血条(遮住脚踝)。
 * 立绘脚底锚定在信息条上边缘；动作全部用整张立绘的缩放/位移/倾斜实现。
 */
export class CardView extends Phaser.GameObjects.Container {
  inner: Phaser.GameObjects.Container; art: Phaser.GameObjects.Image; figH0 = 0; maxW = 0;
  hpFill: Phaser.GameObjects.Rectangle; hpText: Phaser.GameObjects.Text; lvlText: Phaser.GameObjects.Text; nameText!: Phaser.GameObjects.Text;
  flash: Phaser.GameObjects.Rectangle;
  /** w = 卡框宽；h = 视觉高度（立绘顶到地面），供特效定位 */
  w: number; h: number; cardH: number; barW: number; artX: number; artY: number; artSX = 1; artSY = 1; artFacing: 1 | -1; dying = false;
  /** 渲染层横向偏移（同位置排队的怪物错开显示，不影响战斗逻辑） */
  dispOff = 0;
  constructor(scene: Phaser.Scene, public unit: Unit) {
    super(scene, unit.x, GROUND_Y);
    const c = { ...DEFAULT_CARD, ...(unit.card ?? {}) };
    const w = this.w = c.w, ch = this.cardH = c.h, barH = Math.round(ch * 0.22);
    this.artFacing = c.artFacing; this.baseTint = (c as any).tint;
    // 合击版 A1：点击/触屏点怪物卡 = 指定英雄攻击目标（官方 Ctrl+W）。只发场景事件，不触发走位
    if (unit.team === 'enemy') this.setSize(w, ch).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, ch), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev?.stopPropagation?.(); if (this.unit.team === 'enemy' && this.unit.alive) scene.events.emit('cardTap', this.unit.uid); });
    const shadow = scene.add.ellipse(0, 2, w * 1.25, 22, 0x000000, 0.45);
    this.inner = scene.add.container(0, 0);
    // 卡框：背景色 + 窄金属边框（无粗描边）
    const g = scene.add.graphics();
    g.fillStyle(c.bg ?? BG[unit.tier]).fillRoundedRect(-w / 2, -ch, w, ch, 5);
    g.fillGradientStyle(0xffffff, 0xffffff, 0x000000, 0x000000, 0.08, 0.08, 0.25, 0.25).fillRect(-w / 2 + 2, -ch + 2, w - 4, ch - barH - 2);
    // 参考 video2 g_024：深棕外框 + 内侧细金属线
    g.lineStyle(5, 0x2a1c10, 1).strokeRoundedRect(-w / 2 - 2, -ch - 2, w + 4, ch + 4, 6);
    g.lineStyle(2, EDGE[unit.tier], 0.95).strokeRoundedRect(-w / 2, -ch, w, ch, 5);
    g.lineStyle(1, 0x000000, 0.6).strokeRoundedRect(-w / 2 + 3, -ch + 3, w - 6, ch - 6, 4);
    // 立绘：脚底锚点在信息条上边缘（略下沉，让信息条遮住脚踝）
    // 立绘高度 = 卡面区域(卡框减信息条)高度 × figureScale（≈1.0–1.2），人物基本在框内，只有头/武器略探出
    const faceH = ch - barH, maxW = w * (c.maxWidthRatio ?? 1.3);
    let figH = Math.round(faceH * c.figureScale);
    this.artX = 0; this.artY = -barH + (c.footSink ?? 2);
    const tex = unit.art ?? unit.id;
    this.figH0 = figH; this.maxW = maxW;
    const has = scene.textures.exists(tex);
    // 立绘未到：同色剪影占位（不显示大字），立绘加载完成后自动替换
    const im = scene.add.image(this.artX, this.artY, has ? tex : silhouette(scene)).setOrigin(c.anchorX ?? 0.5, 1);
    this.art = im; figH = this.fitArt(); if (has) this.untint(im);
    if (!has) {
      im.setTint(FALLBACK[unit.id] ?? (unit.tier === 'player' ? 0x3a3a44 : 0x2a1414)).setAlpha(0.85);
      const pulse = scene.tweens.add({ targets: im, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
      const onAdd = (key: string) => {
        if (key !== tex || !this.active) return;
        scene.textures.off('addtexture', onAdd); pulse.stop();
        this.untint(im.setTexture(tex)).setAlpha(0); this.fitArt();
        scene.tweens.add({ targets: im, alpha: 1, duration: 250 });
      };
      scene.textures.on('addtexture', onAdd);
      this.once('destroy', () => scene.textures.off('addtexture', onAdd));
    }
    this.h = Math.max(ch, figH + barH - (c.footSink ?? 2));
    // 底部信息条：名字/等级 + 血条（怪物只有红条）
    this.barW = w - 6;
    const bar = scene.add.graphics();
    bar.fillStyle(0x0c0a08, 0.95).fillRect(-w / 2 + 1, -barH, w - 2, barH - 1);
    bar.lineStyle(1, EDGE[unit.tier], 0.9).lineBetween(-w / 2 + 1, -barH, w / 2 - 1, -barH);
    const hpY = -7, hpH = 8;
    const hpBg = scene.add.rectangle(-this.barW / 2, hpY, this.barW, hpH, 0x2a0000).setOrigin(0, 0.5);
    this.hpFill = scene.add.rectangle(-this.barW / 2, hpY, this.barW, hpH, 0xc01818).setOrigin(0, 0.5);
    // 等级圆标：卡牌左上角（参考原作），首领/精英为金色
    const lv = scene.add.graphics(), lr = 13, lx = -w / 2 + 4, ly = -ch + 4;
    lv.fillStyle(0x000000, 0.85).fillCircle(lx, ly, lr).lineStyle(2, unit.tier === 'boss' ? 0xffcc44 : unit.isHero ? 0xb8a070 : 0x9a9aa2, 1).strokeCircle(lx, ly, lr);
    this.lvlText = scene.add.text(lx, ly, '', { fontFamily: FONT, fontSize: '12px', color: '#ffd24a', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
    // 首领：华丽边框（双层金边 + 四角尖刺）
    if (unit.tier === 'boss') {
      g.lineStyle(3, 0x6a0a0a, 1).strokeRoundedRect(-w / 2 - 4, -ch - 4, w + 8, ch + 8, 7);
      g.lineStyle(1.5, 0xffd870, 1).strokeRoundedRect(-w / 2 - 6, -ch - 6, w + 12, ch + 12, 8);
      g.fillStyle(0xd4a64a, 1);
      for (const [cx, cy, sx, sy] of [[-w / 2, -ch, -1, -1], [w / 2, -ch, 1, -1], [-w / 2, 0, -1, 1], [w / 2, 0, 1, 1]])
        g.fillTriangle(cx + sx * 10, cy + sy * 10, cx - sx * 6, cy + sy * 10, cx + sx * 10, cy - sy * 6);
      g.fillTriangle(-10, -ch - 5, 10, -ch - 5, 0, -ch - 20);
    }
    const name = this.nameText = scene.add.text(w / 2 - 4, -barH + 3, unit.name, { fontFamily: FONT, fontSize: '12px', color: unit.nameColor ?? '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(1, 0);
    this.hpText = scene.add.text(0, hpY, '', { fontFamily: FONT, fontSize: '8px', color: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setVisible(!!unit.isHero);
    this.flash = scene.add.rectangle(0, -ch / 2, w, ch, 0xffffff, 0);
    this.inner.add([g, this.flash, this.art, bar, hpBg, this.hpFill, lv, this.lvlText, name, this.hpText]);
    this.add([shadow, this.inner]);
    scene.add.existing(this); this.sync();
  }
  /** 装备上身：当前组合签名（不变则不刷新） */
  private eqSig = ''; eqState = 'base';
  /**
   * 穿/脱装备后调用：把立绘纹理换成 body+衣服+武器 合成图（同一张 Image，缩放/朝向/闪白/动作全部照常生效）。
   * 缺素材/加载失败 → 保持原立绘；加载中先显示原立绘，就绪后自动切换。
   */
  refreshEquip(cls: string, equip: Parameters<typeof equipLook>[3]) {
    if (!this.active || this.dying) return;
    const base = this.unit.art ?? this.unit.id;
    const look = equipLook(this.scene, cls, base, equip, () => { this.eqSig = '#'; this.refreshEquip(cls, equip); });
    const sig = look.sig + ':' + look.state;
    if (sig === this.eqSig) return; this.eqSig = sig; this.eqState = look.state;
    if (!this.scene.textures.exists(look.key) || this.art.texture.key === look.key) return;
    const ang = this.art.angle; this.art.setTexture(look.key); this.fitArt(); this.art.setAngle(ang);
  }
  private poseBase?: string; private poseTimer?: Phaser.Time.TimerEvent;
  /** 召唤物姿态单帧（art-requests L.2）：临时换纹理，ms 后切回原立绘；帧与原立绘同尺寸同锚点，故不重算缩放。缺帧 → 不做任何事（保留原动画） */
  showPose(key: string, ms = 260) {
    const a = this.art; if (!(a instanceof Phaser.GameObjects.Image) || this.dying || !this.active || !this.scene.textures.exists(key)) return false;
    if (!this.poseBase) this.poseBase = a.texture.key;
    a.setTexture(key); this.poseTimer?.remove();
    this.poseTimer = this.scene.time.delayedCall(ms, () => { const b = this.poseBase; this.poseBase = undefined; if (b && a.active && this.scene.textures.exists(b)) a.setTexture(b); });
    return true;
  }
  /** 按卡面高度/最大宽度缩放立绘，返回实际图高 */
  private fitArt() {
    const im = this.art; let s = this.figH0 / im.height, figH = this.figH0;
    if (im.width * s > this.maxW) { s = this.maxW / im.width; figH = Math.round(im.height * s); }
    im.setScale(s); this.artSX = this.artSY = s; return figH;
  }
  get cx() { return this.x; } get cy() { return this.y - this.h / 2; }
  sync() {
    if (this.dying) return;
    this.x += (this.unit.x + this.dispOff - this.x) * (Math.abs(this.unit.x + this.dispOff - this.x) > 300 ? 1 : 0.25); this.y = GROUND_Y + this.unit.y;
    if (this.art instanceof Phaser.GameObjects.Image) this.art.setFlipX(this.unit.facing !== this.artFacing);
    this.lvlText.setText(String(this.unit.level));
    // 召唤物升级：名字带等级、颜色蓝色逐级加深
    if (this.unit.summon && this.nameText.text !== this.unit.name) this.nameText.setText(this.unit.name).setColor(this.unit.nameColor ?? '#fff');
    this.statusTint();
    this.hpText.setText(`${Math.max(0, Math.ceil(this.unit.hp))}/${this.unit.maxHp}`);
    this.hpFill.width = Math.max(0, this.barW * Math.max(0, this.unit.hp) / this.unit.maxHp);
  }
  /** 移动时上下起伏，停下时立绘待机呼吸（只缩放立绘，不动卡框） */
  anim(t: number) {
    if (this.dying || this.leaping) return;
    const ph = t / 1000 + this.unit.uid;
    if (this.unit.moving) { this.inner.y = -Math.abs(Math.sin(ph * 10)) * 5; this.art.scaleY = this.artSY; }
    else { this.inner.y = 0; this.art.scaleY = this.artSY * (1 + Math.sin(ph * 2.4) * 0.018); }
  }
  flashing = false; private curStatus = 0;
  /** 状态色：中毒亮绿、减速冰蓝，持续期间整张立绘染色 */
  private statusTint() {
    const a = this.art; if (!(a instanceof Phaser.GameObjects.Image) || this.flashing) return;
    const t = (this.scene as any).world?.time ?? 0, u = this.unit;
    // 诱惑之光宠物：粉色调 + 粉色等级字（无专用边框素材时的占位标识）
    const c = u.poisonUntil && u.poisonUntil > t ? 0x66ff55 : u.slowUntil && u.slowUntil > t ? 0x88ccff : u.pet ? 0xffb0dd : 0;
    this.lvlText.setColor(u.pet ? '#ff9ad5' : '#ffd24a');
    if (c === this.curStatus) return; this.curStatus = c;
    if (c) a.setTint(c); else this.untint(a);
  }
  /** 阶段 B：无专属立绘的 BOSS 用现有贴图着色占位（card.tint）；状态闪色结束后回到底色而非清空 */
  private baseTint?: number;
  private untint(a: Phaser.GameObjects.Image) { return this.baseTint !== undefined ? a.setTint(this.baseTint) : a.clearTint(); }
  private tint(color: number, ms: number) {
    const a = this.art; if (!(a instanceof Phaser.GameObjects.Image)) return;
    // 参考原作：先整卡闪白，再短暂偏红
    this.flashing = true; a.setTintFill(0xffffff);
    this.scene.time.delayedCall(ms * 0.45, () => { if (!this.dying && a.active && color !== 0xffffff) a.setTint(color); });
    this.scene.time.delayedCall(ms * 1.3, () => { this.flashing = false; this.curStatus = -1; if (!this.dying && a.active) this.untint(a); });
  }
  /** 被吸引：感叹号 + 立绘闪橙 */
  alert(sec: number) {
    const ex = this.scene.add.text(this.x, this.y - this.h - 8, '!', { fontFamily: FONT, fontSize: '40px', color: '#ffdd00', fontStyle: 'bold', stroke: '#600', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(70);
    this.scene.tweens.add({ targets: ex, y: ex.y - 10, duration: 120, yoyo: true });
    this.scene.time.delayedCall(sec * 1000 + 200, () => ex.destroy());
    if (this.art instanceof Phaser.GameObjects.Image) { this.art.setTint(0xffa060); this.scene.time.delayedCall(sec * 1000, () => { if (!this.dying && this.art.active) { this.untint(this.art as Phaser.GameObjects.Image); this.curStatus = -1; } }); }
  }
  private reset() { const a = this.art; this.scene.tweens.killTweensOf(a); a.setPosition(this.artX, this.artY).setAngle(0).setScale(this.artSX, this.artSY); }
  /** 普攻：卡框不动，立绘向前冲、前倾、横向拉伸 */
  swing(dir: number) {
    this.reset(); const a = this.art;
    this.scene.tweens.add({ targets: a, x: this.artX + dir * FX.portraitSwingDx, angle: dir * FX.portraitSwingAngle, scaleX: this.artSX * 1.08, scaleY: this.artSY * 0.96,
      duration: FX.portraitSwingMs / 2, yoyo: true, ease: 'Quad.easeOut', onComplete: () => { if (!this.dying) a.setPosition(this.artX, this.artY).setAngle(0).setScale(this.artSX, this.artSY); } });
  }
  /** 跳跃补位：整卡弧线跃起再落地 */
  leaping = false;
  leap(ms: number) {
    if (this.dying) return; this.leaping = true;
    this.scene.tweens.add({ targets: this.inner, y: -46, duration: ms / 2, yoyo: true, ease: 'Sine.easeOut', onComplete: () => { this.inner.y = 0; this.leaping = false; } });
  }
  /** 冲刺：整张卡向目标方向突进再弹回（普攻/近战技能） */
  lunge(dir: number, dist = 26) {
    this.scene.tweens.killTweensOf(this.inner); this.inner.x = 0;
    this.scene.tweens.add({ targets: this.inner, x: dir * dist, duration: 90, yoyo: true, ease: 'Quad.easeOut', onComplete: () => (this.inner.x = 0) });
  }
  /** 技能前摇：立绘后仰蓄力 + 放大 + 发红 */
  windup(dir: number) {
    this.reset(); const a = this.art;
    this.scene.tweens.add({ targets: a, x: this.artX - dir * FX.windupBackDx, angle: -dir * 6, scaleX: this.artSX * 1.06, scaleY: this.artSY * 1.06, duration: FX.windupMs, yoyo: true, hold: 40 });
    if (a instanceof Phaser.GameObjects.Image) { a.setTint(FX.windupGlow); this.scene.time.delayedCall(FX.windupMs * 2, () => { if (!this.dying) { this.untint(a); this.curStatus = -1; } }); }
  }
  /** 受击：立绘闪色 + 后仰压缩 + 整卡水平震动 */
  hit() {
    if (this.dying) return;
    this.tint(this.unit.tier === 'boss' ? FX.bossHitFlashColor : FX.hitFlashColor, FX.hitFlashMs);
    this.flash.setFillStyle(0xffffff, 0.25).setAlpha(1);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: FX.hitFlashMs });
    const dir = this.unit.facing;
    this.scene.tweens.add({ targets: this.art, angle: -dir * 4, scaleY: this.artSY * 0.95, duration: FX.hitShakeMs / 2, yoyo: true, onComplete: () => { this.art.setAngle(0); this.art.scaleY = this.artSY; } });
    this.scene.tweens.killTweensOf(this.inner); this.inner.x = 0;
    const amp = this.w * FX.hitShakeRatio, kb = -dir * 10;
    // 受击后退：整卡往后弹 10px 再回位
    this.scene.tweens.add({ targets: this.inner, x: { from: kb - amp, to: kb + amp }, duration: FX.hitShakeMs / FX.hitShakeCycles / 2, yoyo: true, repeat: FX.hitShakeCycles - 1, onComplete: () => (this.inner.x = 0) });
  }
  /** 死亡：立绘变灰后仰倒下，整卡淡出 */
  die(done: () => void) {
    this.dying = true;
    if (this.art instanceof Phaser.GameObjects.Image) this.art.setTintFill(0xffffff);
    // 死亡：整卡闪烁 3 次（白→暗）后淡出
    this.scene.tweens.add({ targets: this.inner, alpha: 0.25, duration: 70, yoyo: true, repeat: 2, onComplete: () => {
      if (this.art instanceof Phaser.GameObjects.Image) this.art.setTint(0x555555);
      this.scene.tweens.add({ targets: this, alpha: 0, duration: FX.deathFadeMs, onComplete: () => { this.destroy(); done(); } });
    } });
  }
}
