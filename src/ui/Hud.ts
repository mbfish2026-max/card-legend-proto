import Phaser from 'phaser';
import { POTIONS, SkillDef } from '../data/skills';
import { FX, FONT } from '../data/fx';
import { MENU_LABELS } from '../assets-manifest';

const txt = (s: Phaser.Scene, x: number, y: number, t: string, size: number, color = '#fff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
  s.add.text(x, y, t, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000', strokeThickness: 3, ...extra });

/** 液体球：液面平滑升降，顶部持续波浪 */
class Orb {
  g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; shown = 1; phase = Math.random() * 6;
  constructor(public s: Phaser.Scene, public x: number, public y: number, public r: number, public color: number, public deep: number) {
    s.add.circle(x, y, r + 6, 0x2a1c0c).setStrokeStyle(5, 0xb8893a).setDepth(20);
    s.add.circle(x, y, r, 0x0a0a0a).setDepth(20);
    this.g = s.add.graphics().setDepth(21);
    const m = s.make.graphics({}, false); m.fillStyle(0xffffff).fillCircle(x, y, r);
    this.g.setMask(m.createGeometryMask());
    s.add.ellipse(x - r * 0.3, y - r * 0.45, r * 0.7, r * 0.35, 0xffffff, 0.18).setDepth(22);
    this.t = txt(s, x, y, '', 16).setOrigin(0.5).setDepth(23);
  }
  update(v: number, max: number, dt: number) {
    const target = Math.max(0, Math.min(1, v / max));
    this.shown += (target - this.shown) * Math.min(1, FX.orbLerp * dt);
    this.phase += FX.orbWaveSpeed * dt;
    const { g, x, y, r } = this, top = y + r - 2 * r * this.shown;
    g.clear();
    const pts: Phaser.Math.Vector2[] = [];
    for (let px = x - r; px <= x + r; px += 4) pts.push(new Phaser.Math.Vector2(px, top + Math.sin(px / FX.orbWaveLen * 6.28 + this.phase) * FX.orbWaveAmp));
    pts.push(new Phaser.Math.Vector2(x + r, y + r), new Phaser.Math.Vector2(x - r, y + r));
    g.fillStyle(this.color, 1).fillPoints(pts, true);
    g.fillStyle(this.deep, 0.5).fillRect(x - r, y + r * 0.3, 2 * r, r);
    this.t.setText(`${Math.max(0, Math.floor(v))}/${max}`);
  }
}

export class Hud {
  hp: Orb; mp: Orb; radar: Phaser.GameObjects.Graphics; skillPos: { x: number; y: number }[] = [];
  potT: Phaser.GameObjects.Text[] = []; dots: Phaser.GameObjects.Rectangle[] = [];
  logT: Phaser.GameObjects.Text[] = []; lines: { t: string; c: string }[] = []; info: Phaser.GameObjects.Text;
  bagPos = { x: 0, y: 0 }; plaque!: Phaser.GameObjects.Text; dotObjs: Phaser.GameObjects.GameObject[] = [];
  setFloor(name: string, icons: string[]) {
    this.plaque?.setText(name); this.dotObjs.forEach(o => o.destroy()); this.dotObjs = []; this.dots = [];
    const n = icons.length, sp = Math.min(34, 260 / Math.max(1, n));
    icons.forEach((id, i) => {
      const x = 1130 + (i - (n - 1) / 2) * sp, y = 84;
      const r = this.s.add.rectangle(x, y, sp - 4, sp - 4, 0x000000, 0.5).setStrokeStyle(2, 0x555555).setDepth(20);
      this.dots.push(r); this.dotObjs.push(r);
      if (this.s.textures.exists(id)) this.dotObjs.push(this.s.add.image(x, y, id).setDisplaySize(sp - 8, sp - 8).setDepth(21));
      const c = this.s.add.text(x, y, '✕', { fontFamily: FONT, fontSize: '20px', color: '#ff3333', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(22).setVisible(false);
      this.dotObjs.push(c); (r as any).cross = c;
    });
  }
  static SK = 60; gold = 0;
  constructor(public s: Phaser.Scene, levelName: string, waveIcons: string[], public skills: SkillDef[], onMenu: (i: number) => void) {
    // 右上角牌匾（层名）+ 本层怪物进度小图标
    s.add.rectangle(1130, 36, 270, 46, 0x8a1010).setStrokeStyle(3, 0xd4a64a).setDepth(20);
    s.add.rectangle(1130, 36, 258, 34).setStrokeStyle(1, 0xffe8a0, 0.6).setDepth(20);
    this.plaque = txt(s, 1130, 36, levelName, 22, '#ffe8a0', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(21);
    this.setFloor(levelName, waveIcons);
    txt(s, 640, 588, '移动 ←→/AD  纵深 ↑↓  技能 QWER  药水 1-4  背包 B/C  商人 F  设置 Esc  静音 M', 13, '#cccccc', { strokeThickness: 2 }).setOrigin(0.5).setDepth(30);
    // 底部栏
    s.add.rectangle(640, 662, 1280, 116, 0x140f0a, 0.92).setStrokeStyle(2, 0x6a5030).setDepth(19);
    this.hp = new Orb(s, 74, 652, 58, 0xd01818, 0x700000);
    this.mp = new Orb(s, 1206, 652, 58, 0x1a4fd8, 0x081a60);
    const SK = Hud.SK;
    skills.forEach((k, i) => {
      const x = 190 + i * (SK + 8), y = 637; this.skillPos.push({ x, y });
      s.add.rectangle(x, y, SK, SK, 0x1a1a1a).setStrokeStyle(2, 0xbbaa77).setDepth(20);
      if (s.textures.exists('sk_' + k.id)) s.add.image(x, y, 'sk_' + k.id).setDisplaySize(SK - 4, SK - 4).setDepth(20);
      else if (k.name) txt(s, x, y, k.name, 12).setOrigin(0.5).setDepth(20);
      txt(s, x - SK / 2 + 3, y - SK / 2 + 1, k.key, 13, '#ffff66').setDepth(24);
    });
    this.radar = s.add.graphics().setDepth(23);
    const m = s.make.graphics({}, false); m.fillStyle(0xffffff); this.skillPos.forEach(p => m.fillRect(p.x - SK / 2, p.y - SK / 2, SK, SK));
    this.radar.setMask(m.createGeometryMask());
    POTIONS.forEach((p, i) => {
      const x = 180 + i * 50, y = 694;
      s.add.rectangle(x, y, 42, 42, 0x1a1a1a).setStrokeStyle(2, 0x8a7a55).setDepth(20);
      if (s.textures.exists('potion_' + i)) s.add.image(x, y, 'potion_' + i).setDisplaySize(38, 38).setDepth(20);
      txt(s, x - 18, y - 21, p.key, 11, '#ffff66').setDepth(22);
      this.potT.push(txt(s, x + 19, y + 20, '', 12).setOrigin(1, 1).setDepth(22));
    });
    // 右侧 5 个圆形菜单按钮
    MENU_LABELS.forEach((label, i) => {
      const x = 790 + i * 64, y = 640;
      s.add.circle(x, y, 26, 0x2a1d10).setStrokeStyle(3, 0xb8893a).setDepth(20).setInteractive({ useHandCursor: true }).on('pointerdown', () => onMenu(i));
      if (s.textures.exists('menu_' + i)) {
        const im = s.add.image(x, y, 'menu_' + i).setDisplaySize(40, 40).setDepth(21);
        const mk = s.make.graphics({}, false); mk.fillStyle(0xffffff).fillCircle(x, y, 22); im.setMask(mk.createGeometryMask());
      }
      txt(s, x, y + 34, label, 12, '#ffe8a0').setOrigin(0.5).setDepth(21);
      if (i === 1) this.bagPos = { x, y };
    });
    for (let i = 0; i < 6; i++) this.logT.push(txt(s, 12, 448 + i * 18, '', 14, '#fff', { strokeThickness: 2 }).setDepth(30));
    this.info = txt(s, 12, 10, '', 14, '#ffe8a0').setDepth(30);
  }
  /** 日志：白字系统提示、绿字拾取/经验 */
  log(t: string, green = false) {
    console.log(t); this.lines.push({ t, c: green ? '#4dff4d' : '#ffffff' }); this.lines = this.lines.slice(-6);
    this.logT.forEach((o, i) => { const l = this.lines[i - (6 - this.lines.length)]; o.setText(l?.t ?? '').setColor(l?.c ?? '#fff'); });
  }
  update(dt: number, hp: number, maxHp: number, mp: number, maxMp: number, cds: number[], dead: boolean[], pots: number[], info: string) {
    this.hp.update(hp, maxHp, dt); this.mp.update(mp, maxMp, dt);
    // 雷达式冷却：剩余比例的扇形，从 12 点开始顺时针被扫除
    const g = this.radar; g.clear(); g.fillStyle(0x000000, 0.62);
    cds.forEach((c, i) => {
      const max = this.skills[i].cooldown; if (!max || c <= 0) return;
      const ratio = Math.min(1, c / max), p = this.skillPos[i];
      const start = -Math.PI / 2 + (1 - ratio) * Math.PI * 2;
      g.slice(p.x, p.y, Hud.SK, start, Math.PI * 1.5, false); g.fillPath();
    });
    this.dots.forEach((d, i) => { d.setStrokeStyle(2, dead[i] ? 0x444444 : 0xffd24a); (d as any).cross?.setVisible(!!dead[i]); });
    POTIONS.forEach((p, i) => this.potT[i].setText(p.item ? String(pots[i]) : ''));
    this.info.setText(info);
  }
}
