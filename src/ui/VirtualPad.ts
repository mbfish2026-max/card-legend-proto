import Phaser from 'phaser';
import { FONT } from '../data/fx';
import { POTIONS, SkillDef } from '../data/skills';
/** 半透明虚拟手柄（仅手机）：左下四向键，右下技能 F1-F4，右上药水 1-4，上方 背包/商人/设置/静音。
 *  按键直接调用与键盘相同的 onKey；方向键通过 dir 状态并入每帧移动输入。支持多点触控。 */
export class VirtualPad {
  root: Phaser.GameObjects.Container; dir = { left: false, right: false, up: false, down: false };
  cdG: Phaser.GameObjects.Graphics; skillBtns: { x: number; y: number; r: number }[] = [];
  static ALPHA = 0.42;
  constructor(public s: Phaser.Scene, skills: SkillDef[], onKey: (k: string) => void) {
    s.input.addPointer(4);
    const R = this.root = s.add.container(0, 0).setDepth(150);
    const btn = (x: number, y: number, r: number, label: string, icon: string | null, down: () => void, up?: () => void, fs = 26) => {
      const held = new Set<number>();
      const c = s.add.circle(x, y, r, 0x000000, 0.35).setStrokeStyle(3, 0xffe8a0, 0.6);
      R.add(c);
      if (icon && s.textures.exists(icon)) { const im = s.add.image(x, y, icon).setDisplaySize(r * 1.25, r * 1.25).setAlpha(0.8); const m = s.make.graphics({}, false); m.fillStyle(0xffffff).fillCircle(x, y, r * 0.66); im.setMask(m.createGeometryMask()); R.add(im); }
      const t = s.add.text(x, icon ? y + r * 0.62 : y, label, { fontFamily: FONT, fontSize: (icon ? 16 : fs) + 'px', color: '#fff', stroke: '#000', strokeThickness: 3, fontStyle: 'bold' }).setOrigin(0.5); R.add(t);
      c.setInteractive(new Phaser.Geom.Circle(r, r, r * 1.08), Phaser.Geom.Circle.Contains);
      const press = (p: Phaser.Input.Pointer) => { held.add(p.id); c.setFillStyle(0xffd24a, 0.55); c.setScale(0.92); down(); };
      const release = (p: Phaser.Input.Pointer) => { if (!held.delete(p.id)) return; if (!held.size) { c.setFillStyle(0x000000, 0.35); c.setScale(1); up?.(); } };
      c.on('pointerdown', press).on('pointerup', release).on('pointerout', release).on('pointerupoutside', release);
      // 方向键允许手指滑入
      if (up) c.on('pointerover', (p: Phaser.Input.Pointer) => { if (p.isDown && !held.has(p.id)) press(p); });
      return c;
    };
    // 左下：十字方向键
    const cx = 175, cy = 455, d = 112, rr = 54;
    const dirBtn = (k: keyof VirtualPad['dir'], x: number, y: number, l: string) => btn(x, y, rr, l, null, () => (this.dir[k] = true), () => (this.dir[k] = false), 34);
    btn(cx - d, cy, rr, '◀', null, () => this.onStep?.(-1), () => {}, 34); btn(cx + d, cy, rr, '▶', null, () => this.onStep?.(1), () => {}, 34); dirBtn('up', cx, cy - d, '▲'); dirBtn('down', cx, cy + d * 0.95, '▼');
    // 右下：技能扇形
    const ox = 1252, oy = 600, rad = 170;
    skills.forEach((k, i) => {
      const a = Math.PI + (i * Math.PI / 2) / 3, x = ox + Math.cos(a) * rad, y = oy + Math.sin(a) * rad;
      btn(x, y, 52, k.key, 'sk_' + k.id, () => onKey(k.key)); this.skillBtns.push({ x, y, r: 52 });
    });
    // 右上：药水
    POTIONS.forEach((p, i) => btn(935 + i * 96, 160, 45, p.key, 'potion_' + i, () => onKey(p.key)));
    // 顶部：功能键
    [['背包', 'B'], ['商人', 'T'], ['传送', ' '], ['设置', 'ESCAPE'], ['静音', 'M']].forEach(([l, k], i) => btn(420 + i * 100, 52, 45, l, null, () => onKey(k), undefined, 19));
    this.cdG = s.add.graphics(); R.add(this.cdG);
    R.setAlpha(1);
  }
  get dx() { return (this.dir.right ? 1 : 0) - (this.dir.left ? 1 : 0); }
  get dy() { return (this.dir.down ? 1 : 0) - (this.dir.up ? 1 : 0); }
  onStep?: (d: number) => void; // 左右：一点一格
  reset() { this.dir = { left: false, right: false, up: false, down: false }; }
  setVisible(v: boolean) { this.root.setVisible(v); if (!v) this.dir = { left: false, right: false, up: false, down: false }; }
  update(cds: number[], skills: SkillDef[]) {
    const g = this.cdG; g.clear(); g.fillStyle(0x000000, 0.55);
    cds.forEach((c, i) => {
      const max = skills[i]?.cooldown, b = this.skillBtns[i]; if (!b || !max || c <= 0) return;
      const ratio = Math.min(1, c / max), st = -Math.PI / 2 + (1 - ratio) * Math.PI * 2;
      g.slice(b.x, b.y, b.r, st, Math.PI * 1.5, false); g.fillPath();
    });
  }
}
