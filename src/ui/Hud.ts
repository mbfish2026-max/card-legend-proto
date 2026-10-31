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
  logT: Phaser.GameObjects.Text[] = []; lines: { t: string; c: string; at: number }[] = []; logBg?: Phaser.GameObjects.Rectangle;
  expFill!: Phaser.GameObjects.Rectangle; expT!: Phaser.GameObjects.Text;
  setExp(lv: number, cur: number, next: number) { this.expFill.width = 480 * Math.max(0, Math.min(1, cur / Math.max(1, next))); this.expT.setText(`Lv${lv}  经验 ${cur}/${next}`); } info: Phaser.GameObjects.Text;
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
  constructor(public s: Phaser.Scene, levelName: string, waveIcons: string[], public skills: SkillDef[], onMenu: (i: number) => void, mobile = false) {
    // 右上角牌匾（层名）+ 本层怪物进度小图标
    s.add.rectangle(1130, 36, 270, 46, 0x8a1010).setStrokeStyle(3, 0xd4a64a).setDepth(20);
    s.add.rectangle(1130, 36, 258, 34).setStrokeStyle(1, 0xffe8a0, 0.6).setDepth(20);
    this.plaque = txt(s, 1130, 36, levelName, 22, '#ffe8a0', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(21);
    this.setFloor(levelName, waveIcons);
    if (!mobile) txt(s, 640, 574, '移动 A/D ←→ 按住走  纵深 ↑↓  W/空格 传送门  S 回上层  技能 F1-F5  药水 1-4  背包 B/C  悬赏 Q  商人 T  地图 M  设置 Esc  静音 N', 13, '#cccccc', { strokeThickness: 2 }).setOrigin(0.5).setDepth(30);
    // 底部栏
    // Diablo 式紧凑底栏：红球 | 技能+药水 | 蓝球，中间上方经验条
    s.add.rectangle(640, 664, 760, 112, 0x140f0a, 0.92).setStrokeStyle(2, 0x6a5030).setDepth(19);
    this.hp = new Orb(s, 330, 652, 60, 0xd01818, 0x700000);
    this.mp = new Orb(s, 950, 652, 60, 0x1a4fd8, 0x081a60);
    s.add.rectangle(640, 601, 480, 10, 0x000000, 0.9).setStrokeStyle(1, 0x8a7040).setDepth(20);
    this.expFill = s.add.rectangle(400, 601, 0, 8, 0xc8a020).setOrigin(0, 0.5).setDepth(21);
    this.expT = txt(s, 640, 601, '', 10, '#fff', { strokeThickness: 2 }).setOrigin(0.5).setDepth(22);
    const SK = skills.length > 4 ? 52 : Hud.SK;
    const gap = skills.length > 4 ? SK + 4 : SK + 8;
    const x0 = skills.length > 4 ? 400 : 420;
    skills.forEach((k, i) => {
      const x = x0 + i * gap, y = 646; this.skillPos.push({ x, y });
      s.add.rectangle(x, y, SK, SK, 0x1a1a1a).setStrokeStyle(2, 0xbbaa77).setDepth(20);
      if (s.textures.exists('sk_' + k.id)) s.add.image(x, y, 'sk_' + k.id).setDisplaySize(SK - 4, SK - 4).setDepth(20);
      else if (k.name) txt(s, x, y, k.name, 12).setOrigin(0.5).setDepth(20);
      txt(s, x - SK / 2 + 2, y - SK / 2 + 1, k.key, 11, '#ffff66').setDepth(24);
    });
    this.radar = s.add.graphics().setDepth(23);
    const m = s.make.graphics({}, false); m.fillStyle(0xffffff); this.skillPos.forEach(p => m.fillRect(p.x - SK / 2, p.y - SK / 2, SK, SK));
    this.radar.setMask(m.createGeometryMask());
    (this as any)._skSize = SK;
    POTIONS.forEach((p, i) => {
      const x = 684 + i * 52, y = 646;
      s.add.rectangle(x, y, 44, 44, 0x1a1a1a).setStrokeStyle(2, 0x8a7a55).setDepth(20);
      if (s.textures.exists('potion_' + i)) s.add.image(x, y, 'potion_' + i).setDisplaySize(38, 38).setDepth(20);
      txt(s, x - 18, y - 21, p.key, 11, '#ffff66').setDepth(22);
      this.potT.push(txt(s, x + 19, y + 20, '', 12).setOrigin(1, 1).setDepth(22));
    });
    // 右侧 5 个圆形菜单按钮
    if (!mobile) MENU_LABELS.forEach((label, i) => {
      const x = 1070 + i * 48, y = 648;
      s.add.circle(x, y, 21, 0x2a1d10).setStrokeStyle(3, 0xb8893a).setDepth(20).setInteractive({ useHandCursor: true }).on('pointerdown', () => onMenu(i));
      if (s.textures.exists('menu_' + i)) {
        const im = s.add.image(x, y, 'menu_' + i).setDisplaySize(34, 34).setDepth(21);
        const mk = s.make.graphics({}, false); mk.fillStyle(0xffffff).fillCircle(x, y, 18); im.setMask(mk.createGeometryMask());
      }
      txt(s, x, y + 30, label, 11, '#ffe8a0').setOrigin(0.5).setDepth(21);
      if (i === 1) this.bagPos = { x, y };
    });
    // 战斗日志：电脑放左下（底栏左侧空位，不挡商人），手机放左上（左下是方向键）；半透明、6 秒后自动淡出
    if (mobile) this.bagPos = { x: 600, y: 44 };
    const ly = mobile ? 92 : 606, lh = mobile ? 18 : 18;
    if (!mobile) this.logBg = s.add.rectangle(0, 596, 252, 124, 0x000000, 0.35).setOrigin(0, 0).setDepth(29);
    for (let i = 0; i < 6; i++) this.logT.push(txt(s, 8, ly + i * lh, '', mobile ? 14 : 12, '#fff', { strokeThickness: 2, ...(mobile ? {} : { fixedWidth: 244 }) }).setDepth(30));
    this.info = txt(s, 12, 10, '', 14, '#ffe8a0').setDepth(30);
  }
  /** 日志：白字系统提示、绿字拾取/经验 */
  log(t: string, green = false) {
    console.log(t); this.lines.push({ t, c: green ? '#4dff4d' : '#ffffff', at: this.s.time.now }); this.lines = this.lines.slice(-6);
    this.logT.forEach((o, i) => { const l = this.lines[i - (6 - this.lines.length)]; let str = l?.t ?? ''; if (o.style.fixedWidth && str.length > 20) str = str.slice(0, 19) + '…'; o.setText(str).setColor(l?.c ?? '#fff'); (o as any).at = l?.at ?? 0; });
  }
  update(dt: number, hp: number, maxHp: number, mp: number, maxMp: number, cds: number[], dead: boolean[], pots: number[], info: string) {
    this.hp.update(hp, maxHp, dt); this.mp.update(mp, maxMp, dt);
    // 雷达式冷却：剩余比例的扇形，从 12 点开始顺时针被扫除
    const g = this.radar; g.clear(); g.fillStyle(0x000000, 0.62);
    cds.forEach((c, i) => {
      const max = this.skills[i].cooldown; if (!max || c <= 0) return;
      const ratio = Math.min(1, c / max), p = this.skillPos[i];
      const start = -Math.PI / 2 + (1 - ratio) * Math.PI * 2;
      const sk = (this as any)._skSize ?? Hud.SK;
      g.slice(p.x, p.y, sk, start, Math.PI * 1.5, false); g.fillPath();
    });
    this.dots.forEach((d, i) => { d.setStrokeStyle(2, dead[i] ? 0x444444 : 0xffd24a); (d as any).cross?.setVisible(!!dead[i]); });
    POTIONS.forEach((p, i) => this.potT[i].setText(p.item ? String(pots[i]) : ''));
    this.info.setText(info);
    const now = this.s.time.now; let any = 0;
    this.logT.forEach(o => { const age = (now - ((o as any).at ?? 0)) / 1000, a = age < 6 ? 1 : Math.max(0, 1 - (age - 6) / 1.5); o.setAlpha(a); any = Math.max(any, o.text ? a : 0); });
    this.logBg?.setAlpha(any);
  }
}
