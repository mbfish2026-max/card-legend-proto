import { Render, MAX_LW } from '../render';
import Phaser from 'phaser';
import { ASSETS, SFX } from '../assets-manifest';
import { ITEMS } from '../data/items';
import { CLASSES, CLASS_IDS, ClassId } from '../data/classes';
import { FONT } from '../data/fx';
import { Settings, SaveStore, Slots, fmtPlay, fmtDate } from '../settings';
import { STARTER } from '../data/books';
import { renderSettingsView } from '../ui/SettingsView';
import { queueCritical, queueImages, imagePending, floorKeys, PreloadScene } from '../loader';
import { FLOORS, floorNo } from '../data/world';
import type { SaveData } from '../combat/World';
import { MUSIC, playMusic } from '../music';
import { IS_MOBILE } from '../mobile';
import { ns, nsFrame, minTapHeight, UI_ATLAS, UI_ATLAS_PNG, UI_ATLAS_JSON } from '../ui/uiSlices';
import { assetUrl } from '../loader';

export const txt = (s: Phaser.Scene, x: number, y: number, t: string, size: number, color = '#fff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}) =>
  s.add.text(x, y, t, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#000', strokeThickness: 3, ...extra });
/** 通用按钮（全游戏唯一按钮工厂，签名不变）：B1 起优先用 ui_atlas 九宫格 btn_normal/hover/pressed/disabled；
 *  图集未加载或缺帧时退回原暗金边框矩形绘制。点击区高度不低于 minTapHeight（桌面 44 逻辑 px；手机物理 ≥36 px），宽度=按钮宽 */
export function button(s: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, size = 22, enabled = true) {
  const t = txt(s, x, y, label, size, enabled ? '#ffe8a0' : '#777', { fontStyle: 'bold' }).setOrigin(0.5);
  // CSS px / 逻辑 px：手机 FIT 铺满视口（逻辑 Render.lw×720），用视口尺寸算，不依赖创建时画布是否已完成缩放
  const css = typeof window !== 'undefined' ? Math.min(window.innerHeight / 720, window.innerWidth / (Render.lw || 1280)) : 1;
  const hitH = Math.max(h, minTapHeight(IS_MOBILE, css || 1));
  const bg = ns(s, enabled ? 'btn_normal' : 'btn_disabled', x, y, w, h);
  if (bg) {
    if (enabled) {
      bg.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, (h - hitH) / 2, w, hitH), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
        .on('pointerover', () => nsFrame(bg, 'btn_hover')).on('pointerout', () => nsFrame(bg, 'btn_normal'))
        .on('pointerup', () => nsFrame(bg, 'btn_hover'))
        .on('pointerdown', () => { nsFrame(bg, 'btn_pressed'); sfx(s, 'click'); onClick(); });
    }
    s.children.bringToTop(t); // 文字在九宫格之上（未进容器时）
    return [bg, t] as const;
  }
  const r = s.add.rectangle(x, y, w, h, 0x2a1a0c, 0.92).setStrokeStyle(2, enabled ? 0xd4a64a : 0x555555);
  s.children.bringToTop(t);
  if (enabled) {
    r.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, (h - hitH) / 2, w, hitH), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true })
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
    // B0：UI 图集在开始界面预加载（失败时 loaderror 只记日志，button() 等自动退回代码绘制）
    if (!this.textures.exists(UI_ATLAS)) this.load.atlas(UI_ATLAS, assetUrl(UI_ATLAS_PNG), UI_ATLAS_JSON);
  }
  create() {
    Settings.load(); Settings.apply(this.sound);
    if (!this.scene.isActive('Preload')) this.scene.launch('Preload');
    this.game.events.off('music-ready'); this.game.events.once('music-ready', () => { if (this.scene.isActive()) playMusic(this, 'title'); });
    const qs = new URLSearchParams(location.search);
    // 调试/截图参数：?class=mage&floor=3 直接进入战斗；?title=class 直接显示职业选择
    if (qs.has('class') || qs.has('floor')) { this.startBattle({ cls: (qs.get('class') as ClassId) || 'warrior' }); return; }
    playMusic(this, 'title');
    if (this.textures.exists('bg_floor1')) this.add.image(640, 360, 'bg_floor1').setDisplaySize(Render.lw > 1280 ? MAX_LW : 1280, Render.lw > 1280 ? 720 * MAX_LW / 1280 : 720).setTint(0x777777); // 手机铺满：按最宽比例 cover，电脑只露中间 1280（裁切）
    this.add.rectangle(640, 360, Render.lw > 1280 ? MAX_LW : 1280, 720, 0x000000, 0.35);
    txt(this, 640, 120, '卡 牌 传 奇', 72, '#ffd24a', { fontStyle: 'bold', strokeThickness: 8 }).setOrigin(0.5);
    txt(this, 640, 190, IS_MOBILE ? '横版卡牌动作 · 原型（触屏：屏幕虚拟按键操作）' : '横版卡牌动作 · 原型', 20, '#e8d8b0').setOrigin(0.5);
    if (!IS_MOBILE) txt(this, 640, 218, 'A/D 移动（可后退） · W/空格 传送门 · S 回上层 · F1-F5 技能 · 1-4 药水 · B 背包 · T 商人', 15, '#bfb39a').setOrigin(0.5);
    if (this.game.registry.get('openSlots')) { this.game.registry.set('openSlots', false); this.slotsScreen(); }
    else if (qs.get('title') === 'class') this.classSelect(); else this.mainMenu();
  }
  clear() { this.layer?.destroy(true); this.layer = this.add.container(0, 0); return this.layer; }
  mainMenu() {
    const L = this.clear(), has = SaveStore.has(), save = SaveStore.load();
    // 新游戏不覆盖当前槽：当前槽有存档时换到第一个空槽；全满则去存档位界面选择
    L.add([...button(this, 640, 320, 280, 56, '新 游 戏', () => { if (has) { const e = Slots.firstEmpty(); if (!e) { this.slotsScreen('存档位已满：请先删除一个存档'); return; } Slots.select(e); } this.classSelect(); })]);
    L.add([...button(this, 640, 395, 280, 56, '继 续', () => save && this.startBattle({ save }), 22, has && !!save)]);
    if (save) L.add(txt(this, 640, 432, `${CLASSES[save.cls].name}  Lv${save.level}  第 ${floorNo(save.floorIndex)} 层  金币 ${save.gold}`, 14, '#cfc0a0').setOrigin(0.5, 0));
    L.add([...button(this, 640, 490, 280, 56, `存 档 位（${Slots.active()}）`, () => this.slotsScreen())]);
    L.add([...button(this, 640, 565, 280, 56, '设 置', () => this.settings())]);
    L.add(txt(this, 640, 690, '素材：原创与 AI 生成', 13, '#999').setOrigin(0.5));
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
  /** 多存档位：选择/新建/删除（二次确认）/改名；每格显示职业、等级、层数、最后游玩、游玩时长 */
  slotsScreen(note = '', armDel = 0) {
    const L = this.clear(), list = Slots.list(), rowH = Math.min(84, 520 / list.length), top = 110;
    L.add(this.add.rectangle(640, 395, 1000, 640, 0x15100b, 0.96).setStrokeStyle(3, 0xd4a64a));
    L.add(txt(this, 640, 98, '存 档 位', 26, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5).setName('slots-title'));
    list.forEach((sl, k) => {
      const y = top + 40 + k * rowH + rowH / 2, d = sl.data;
      L.add(this.add.rectangle(640, y, 960, rowH - 8, sl.active ? 0x3a2c14 : 0x221a10).setStrokeStyle(2, sl.active ? 0xffd24a : 0x6a5a3a).setName('slot:' + sl.i));
      L.add(txt(this, 180, y - 12, `${sl.i}. ${sl.name}${sl.active ? '（当前）' : ''}`, 18, sl.active ? '#ffe8a0' : '#e8d8b0').setOrigin(0, 0.5));
      L.add(txt(this, 180, y + 14, d ? `${CLASSES[d.cls]?.name ?? d.cls}  Lv${d.level}  第 ${floorNo(d.floorIndex)} 层  ·  最后游玩 ${fmtDate(sl.lastAt)}  ·  时长 ${fmtPlay(sl.playMs)}` : '空', 14, d ? '#cfc0a0' : '#8a7a5a').setOrigin(0, 0.5));
      let x = 1070;
      const btn = (w: number, label: string, fn: () => void) => { L.add([...button(this, x - w / 2, y, w, Math.min(44, rowH - 16), label, fn, 15)]); x -= w + 10; };
      if (d) btn(90, armDel === sl.i ? '确认删除' : '删除', () => armDel === sl.i ? (Slots.remove(sl.i), this.slotsScreen(`已删除 ${sl.name}`)) : this.slotsScreen(`再点一次「确认删除」删除 ${sl.name}，不可恢复`, sl.i));
      btn(80, '改名', () => { const n = globalThis.prompt?.('存档名称（最多 16 字）', sl.name); if (n != null) { Slots.rename(sl.i, n); this.slotsScreen(); } });
      btn(90, d ? '选择' : '新建', () => { Slots.select(sl.i); if (d) this.mainMenu(); else this.classSelect(); });
    });
    if (note) L.add(txt(this, 640, 676, note, 15, armDel ? '#ff9a7a' : '#cfc0a0').setOrigin(0.5).setName('slots-note'));
    L.add([...button(this, 640, 712 - 10, 160, 36, '返回', () => this.mainMenu(), 16)]);
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
