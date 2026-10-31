import Phaser from 'phaser';
import { ASSETS, SFX } from '../assets-manifest';
import { ITEMS } from '../data/items';
import { CLASSES, CLASS_IDS, ClassId } from '../data/classes';
import { FONT } from '../data/fx';
import { Settings, SaveStore } from '../settings';
import { STARTER } from '../data/books';
import { renderSettingsView } from '../ui/SettingsView';
import { queueCritical, queueImages, imagePending, floorKeys, PreloadScene } from '../loader';
import { FLOORS } from '../data/world';
import type { SaveData } from '../combat/World';
import { MUSIC, playMusic } from '../music';
import { IS_MOBILE } from '../mobile';

export const txt = (s: Phaser.Scene, x: number, y: number, t: string, size: number, color = '#fff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
  s.add.text(x, y, t, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000', strokeThickness: 3, ...extra });
/** 通用按钮：暗金边框矩形 + 文字，悬停高亮，点击音效 */
export function button(s: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, size = 22, enabled = true) {
  const r = s.add.rectangle(x, y, w, h, 0x2a1a0c, 0.92).setStrokeStyle(2, enabled ? 0xd4a64a : 0x555555);
  const t = txt(s, x, y, label, size, enabled ? '#ffe8a0' : '#777', { fontStyle: 'bold' }).setOrigin(0.5);
  if (enabled) {
    r.setInteractive({ useHandCursor: true })
      .on('pointerover', () => r.setFillStyle(0x5a3a14, 0.95)).on('pointerout', () => r.setFillStyle(0x2a1a0c, 0.92))
      .on('pointerdown', () => { sfx(s, 'click'); onClick(); });
  }
  return [r, t] as const;
}
export function sfx(s: Phaser.Scene, id: string, volume = 0.6) { try { if (s.cache.audio.exists('sfx_' + id)) s.sound.play('sfx_' + id, { volume }); } catch { /* ignore */ } }

/** 标题：新游戏 / 继续 / 设置；新游戏后进入职业选择 */
export class TitleScene extends Phaser.Scene {
  layer?: Phaser.GameObjects.Container;
  constructor() { super('Title'); }
  preload() {
    const bar = this.add.rectangle(340, 360, 0, 16, 0xd4a64a).setOrigin(0, 0.5);
    this.add.rectangle(640, 360, 604, 22).setStrokeStyle(2, 0x8a7a55);
    this.load.on('progress', (p: number) => (bar.width = 600 * p));
    this.load.on('loaderror', (f: any) => console.warn('素材缺失，使用回退:', f?.key));
    // R10：首屏只等关键资源（小图标/音效/三职业立绘/第 1 层）；其余由常驻 Preload 场景后台加载
    queueCritical(this);
  }
  create() {
    Settings.load(); Settings.apply(this.sound);
    if (!this.scene.isActive('Preload')) this.scene.launch('Preload');
    this.game.events.off('music-ready'); this.game.events.once('music-ready', () => { if (this.scene.isActive()) playMusic(this, 'title'); });
    const qs = new URLSearchParams(location.search);
    // 调试/截图参数：?class=mage&floor=3 直接进入战斗；?title=class 直接显示职业选择
    if (qs.has('class') || qs.has('floor')) { this.startBattle({ cls: (qs.get('class') as ClassId) || 'warrior' }); return; }
    playMusic(this, 'title');
    if (this.textures.exists('bg_floor1')) this.add.image(640, 360, 'bg_floor1').setDisplaySize(1280, 720).setTint(0x777777);
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.35);
    txt(this, 640, 120, '卡 牌 传 奇', 72, '#ffd24a', { fontStyle: 'bold', strokeThickness: 8 }).setOrigin(0.5);
    txt(this, 640, 190, IS_MOBILE ? '横版卡牌动作 · 原型（触屏：屏幕虚拟按键操作）' : '横版卡牌动作 · 原型', 20, '#e8d8b0').setOrigin(0.5);
    if (!IS_MOBILE) txt(this, 640, 218, 'A/D 移动（可后退） · W/空格 传送门 · S 回上层 · F1-F5 技能 · 1-4 药水 · B 背包 · T 商人', 15, '#bfb39a').setOrigin(0.5);
    if (qs.get('title') === 'class') this.classSelect(); else this.mainMenu();
  }
  clear() { this.layer?.destroy(true); this.layer = this.add.container(0, 0); return this.layer; }
  mainMenu() {
    const L = this.clear(), has = SaveStore.has(), save = SaveStore.load();
    L.add([...button(this, 640, 320, 280, 56, '新 游 戏', () => this.classSelect())]);
    L.add([...button(this, 640, 395, 280, 56, '继 续', () => save && this.startBattle({ save }), 22, has && !!save)]);
    if (save) L.add(txt(this, 640, 432, `${CLASSES[save.cls].name}  Lv${save.level}  第 ${save.floorIndex + 1} 层  金币 ${save.gold}`, 14, '#cfc0a0').setOrigin(0.5, 0));
    L.add([...button(this, 640, 490, 280, 56, '设 置', () => this.settings())]);
    L.add(txt(this, 640, 690, '素材：魔兽世界图标/音效（仅供个人原型）+ AI 生成立绘与背景', 13, '#999').setOrigin(0.5));
  }
  /** 进战斗前等待目标层关键资源（继续存档可能在高层），显示进度条 */
  startBattle(data: { cls?: ClassId; save?: SaveData }) {
    const fi = data.save ? Math.min(data.save.floorIndex, FLOORS.length - 1) : 0;
    const keys = floorKeys(FLOORS[fi]);
    (this.scene.get('Preload') as PreloadScene | undefined)?.prioritize?.(floorKeys(FLOORS[fi + 1]));
    // 已在 Preload 加载器里排队的贴图不重复下载，等它们完成后再进战斗（BUG-003）
    const go = () => { if (keys.some(imagePending)) { this.time.delayedCall(50, go); return; } this.scene.start('Battle', data); };
    if (!queueImages(this.load, this.textures, keys)) { go(); return; }
    const L = this.clear();
    L.add(txt(this, 640, 320, `载入 第 ${fi + 1} 层…`, 22, '#ffe8a0').setOrigin(0.5));
    L.add(this.add.rectangle(640, 360, 604, 22).setStrokeStyle(2, 0x8a7a55));
    const bar = this.add.rectangle(340, 360, 0, 16, 0xd4a64a).setOrigin(0, 0.5); L.add(bar);
    this.load.on('progress', (v: number) => (bar.width = 600 * v));
    this.load.once('complete', () => { this.load.off('progress'); go(); });
    this.load.start();
  }
  setCls: ClassId = 'warrior';
  settings() {
    const L = this.clear();
    const H = 580, top = Math.max(40, 360 - H / 2);
    L.add(this.add.rectangle(640, 300, 640, H, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
    L.add(txt(this, 640, top + 10, '设置', 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5).setY(top + 22));
    renderSettingsView(this, L, top, {
      cls: this.setCls, learned: (() => { const sv = SaveStore.load(); if (sv?.cls === this.setCls) return sv.learned ? new Set([...sv.learned, STARTER[this.setCls]]) : undefined; return new Set([STARTER[this.setCls]]); })(), rerender: () => this.settings(), onPickClass: c => { this.setCls = c; this.settings(); },
      footer: [{ label: '返回', w: 200, fn: () => this.mainMenu() }],
    });
  }
  classSelect() {
    const L = this.clear();
    L.add(txt(this, 640, 250, '选择职业', 30, '#ffe8a0', { fontStyle: 'bold' }).setOrigin(0.5));
    CLASS_IDS.forEach((id, i) => {
      const c = CLASSES[id], x = 340 + i * 300, y = 470, w = 230, h = 300;
      const card = this.add.rectangle(x, y, w, h, c.bg).setStrokeStyle(3, 0xb8a070).setInteractive({ useHandCursor: true });
      L.add(card);
      if (this.textures.exists(c.art)) {
        const im = this.add.image(x, y + 40, c.art).setOrigin(0.5, 1); im.setScale(Math.min(250 / im.height, 260 / im.width)); L.add(im);
      }
      L.add(this.add.rectangle(x, y + 95, w, 110, 0x0c0a08, 0.9));
      L.add(txt(this, x, y + 55, c.name, 26, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
      L.add(txt(this, x, y + 80, c.desc, 13, '#ddd', { align: 'center', strokeThickness: 2 }).setOrigin(0.5, 0));
      { const n = c.skills.length, st = Math.min(44, 260 / n), sz = Math.min(38, st - 4); // #11 技能多时缩小图标不溢出卡片
        c.skills.forEach((s, k) => { if (this.textures.exists('sk_' + s.id)) L.add(this.add.image(x - (n - 1) * st / 2 + k * st, y - h / 2 - 26, 'sk_' + s.id).setDisplaySize(sz, sz)); }); }
      card.on('pointerover', () => card.setStrokeStyle(4, 0xffe080)).on('pointerout', () => card.setStrokeStyle(3, 0xb8a070))
        .on('pointerdown', () => { sfx(this, 'click2'); SaveStore.clear(); this.startBattle({ cls: id }); });
    });
    L.add([...button(this, 640, 670, 160, 40, '返回', () => this.mainMenu(), 18)]);
  }
}
