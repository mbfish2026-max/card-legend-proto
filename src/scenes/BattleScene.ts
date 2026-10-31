import { foesWithoutView } from '../ui/foeViews';
import { hdFixed, Render, MAX_LW } from '../render';
import { ComboStatusTracker, COMBO_STATUS } from '../ui/comboStatus';
import { REGIONS } from '../data/map';
import { fmtExp } from '../data/expCurve';
import { floorKeys, PreloadScene } from '../loader';
import { playFx, flyFx, follow, SLASH_TINT } from '../ui/FxPlayer';
import Phaser from 'phaser';
import { IS_MOBILE } from '../mobile';
import { HoldKeys, stepDir } from '../input/stepKeys';
import { World, SaveData } from '../combat/World';
import { BattleEvent, GroundItem, Unit } from '../combat/types';
import { POTIONS } from '../data/skills';
import { FX, FONT, GROUND_Y } from '../data/fx';
import { WORLD, FLOORS, nextFloorOf, floorNo, MAX_WIDTH_SCREENS } from '../data/world';
import { ClassId, CLASSES } from '../data/classes';
import { playCombatAnim } from '../ui/combatAnim';
import { CardView } from '../ui/CardView';
import { Hud } from '../ui/Hud';
import { PanelMode } from '../ui/Panel';
import { TOWNS, TOWN_W, TOWN_GATE_X, NPC_ART, STREET_ART_K, streetDoors } from '../data/towns';
import * as fx from '../ui/Fx';
import { Settings, SaveStore } from '../settings';
import type { UIScene } from './UIScene';
import { playMusic } from '../music';
import { FxQuality } from '../ui/Fx';

// 稀有度：光柱颜色 = 地上物品名颜色；越稀有光柱越高
const RARITY_COLOR = { common: 0xf0e6c0, magic: 0x3d9bff, rare: 0xffa020 };
const RARITY_TEXT = { common: '#f0e6c0', magic: '#3d9bff', rare: '#ffa020' };
// 参考 video2 g_103：细长光柱（4px 芯 + 16px 辉），高度按稀有度
const PILLAR_H = { common: 70, magic: 150, rare: 250 };
const MERCHANT_X = 110, SHOP_RANGE = 380;

export class BattleScene extends Phaser.Scene {
  world!: World; views = new Map<number, CardView>(); hud?: Hud; pendingLogs: [string, boolean][] = [];
  cds: number[] = []; state: 'play' | 'dead' | 'win' = 'play';
  groundObjs = new Map<number, Phaser.GameObjects.GameObject[]>(); floorUids: number[] = [];
  dropOrigin = new Map<number, { x: number; y: number; h: number; w: number }>();
  keys!: Record<string, Phaser.Input.Keyboard.Key>; portal!: Phaser.GameObjects.Container; bgImgs: Phaser.GameObjects.Image[] = [];
  merchant!: Phaser.GameObjects.Container; overlay: Phaser.GameObjects.GameObject[] = [];
  expTotal = 0; saveT = 0; bossMusic = false;
  constructor() { super('Battle'); }

  sfx(id: string, volume = 0.6) { try { if (this.cache.audio.exists('sfx_' + id)) this.sound.play('sfx_' + id, { volume }); } catch { /* ignore */ } }
  log(t: string, green = false) { if (this.hud) this.hud.log(t, green); else this.pendingLogs.push([t, green]); }
  attachHud(h: Hud) { this.hud = h; this.pendingLogs.forEach(([t, g]) => h.log(t, g)); this.pendingLogs = []; }
  floorIcons() { return this.world.floor.spawns.map(s => this.world.units.find(u => u.id === s.id)?.art ?? s.id); }
  get ui() { return this.scene.get('UI') as UIScene; }
  /** R11 学会新技能：面板关闭后重建快捷栏/手机技能键 */
  skillsDirty = false;
  get paused() { return !!this.ui?.panel?.open; }

  create(data: { cls?: ClassId; save?: SaveData }) {
    Settings.load(); Settings.apply(this.sound);
    this.views.clear(); this.groundObjs.clear(); this.hud = undefined; this.pendingLogs = []; this.overlay = [];
    this.state = 'play'; this.expTotal = 0; this.saveT = 0;
    const qs = new URLSearchParams(location.search), W = MAX_WIDTH_SCREENS * 1280; // 任务 A：按最宽层预建，进层时 applyFloorWidth 按本层宽显示/限位
    // 横版地图：本层背景分段拼接（交替镜像）
    this.bgImgs = [];
    for (let x = 0; x < W; x += 1280) this.bgImgs.push(this.add.image(x + 640, 300, 'bg').setDisplaySize(1280, 720).setFlipX((x / 1280) % 2 === 1).setTint(0xa0a0a0).setScrollFactor(0.7));
    // 多层视差：远景 0.7，前景暗色岩石剪影 1.25 + 漂浮尘埃 + 屏幕暗角
    const fg = this.add.graphics().setDepth(40).setScrollFactor(1.25);
    for (let x = 0; x < W * 1.3; x += 140 + ((x * 7919) % 170)) { const h = 40 + ((x * 31) % 70); fg.fillStyle(0x060405, 0.95).fillTriangle(x - 26, 0, x + 26, 0, x + ((x % 3) - 1) * 6, h); fg.fillStyle(0x060405, 0.9).fillTriangle(x + 18, 0, x + 40, 0, x + 30, h * 0.55); }
    fg.fillStyle(0x060405, 0.95).fillRect(0, 0, W * 1.3, 8);
    this.add.particles(0, 0, '__WHITE', { x: { min: 0, max: W }, y: { min: 80, max: 560 }, speedX: { min: -8, max: 8 }, speedY: { min: -12, max: -3 }, lifespan: 6000, scale: { start: 1.6, end: 0 }, alpha: { start: 0.35, end: 0 }, frequency: 90, tint: 0xffe0b0 }).setDepth(39);
    const vg = hdFixed(this.add.graphics().setScrollFactor(0).setDepth(38));
    // 暗角按实际可视宽度画（手机铺满时 Render.ox>0，左右边贴真实屏幕边缘；电脑 ox=0 与原来一致）
    const drawVg = () => { const o = Render.ox; vg.clear();
      vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0.55, 0, 0).fillRect(-o, 0, 1280 + 2 * o, 110);
      vg.fillGradientStyle(0x000000, 0, 0x000000, 0, 0.5, 0, 0.5, 0).fillRect(-o, 0, 140, 720);
      vg.fillGradientStyle(0, 0x000000, 0, 0x000000, 0, 0.5, 0, 0.5).fillRect(1140 + o, 0, 140, 720); };
    drawVg(); this.events.on('fill-resize', drawVg);
    this.add.rectangle(W / 2, GROUND_Y + 10, W, 90, 0x000000, 0.25);
    this.add.rectangle(6, 300, 12, 600, 0x000000, 0.8); this.rightWall = this.add.rectangle(W - 6, 300, 12, 600, 0x000000, 0.8);
    const lv = Number(qs.get('lv')) || 1;
    this.world = new World(Math.random, lv, FLOORS, data?.cls ?? 'warrior', data?.save);
    if (!data?.save) this.world.grantStarterKit(); // 任务C：新角色 3 张回城卷 [适配]
    this.world.requireUse = true;
    if (!data?.save && !qs.get('floor')) this.world.startInVillage(); // 新档出生在新手村
    this.cds = this.world.skills.map(() => 0);
    this.registry.set('fxCls', this.world.cls); this.registry.set('fxLearned', [...this.world.learned]);
    this.buildPortal(this.world.exitX); this.buildMerchant();
    const h = this.world.hero!;
    this.views.set(h.uid, new CardView(this, h)); this.refreshHeroLook();
    this.cameras.main.setBounds(0, 0, W, 720).startFollow(this.views.get(h.uid)!, true, 0.12, 0.12, 0, 120).setDeadzone(320, 720);
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D') as any;
    // F1~F4 技能：阻止浏览器默认行为（F1 帮助等）；不占用 F5 等其它功能键
    // 左右按住持续走：window 原生 keydown/keyup（不依赖 repeat 标志 / Phaser 键状态；丢 keyup 由看门狗超时停止）
    const hold = this.hold;
    const onWinKey = (e: KeyboardEvent) => { const d = stepDir(e); if (!d) return; e.preventDefault(); hold.down(d, performance.now()); };
    const onWinUp = (e: KeyboardEvent) => { const d = stepDir(e); if (d) hold.up(d, performance.now()); };
    window.addEventListener('keyup', onWinUp, true);
    this.events.once('shutdown', () => window.removeEventListener('keyup', onWinUp, true));
    window.addEventListener('keydown', onWinKey, true);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onWinKey, true));
    // 合击版 A1：点怪物卡指定英雄目标（无英雄/未召唤时静默忽略，不影响原操作）
    this.events.on('cardTap', (uid: number) => { const w = this.world; if (!w.companion?.out || this.paused) return; const e = w.setCompanionTarget(uid); if (e) this.log(e); else { const v = this.views.get(uid); if (v) fx.floatNumber(this, v.cx, v.cy - v.h * 0.45, v.h, '英雄目标', '#7fd7ff', 0.6); } this.handle(w.drainEvents()); });
    this.events.once('shutdown', () => this.events.off('cardTap'));
    this.events.once('shutdown', () => this.comboStatus.clear());
    // 其它键（F1~F4 技能等）：阻止 F1 帮助等默认行为；不占用 F5 等其它功能键
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (stepDir(e)) return; if (/^F([1-9]|10)$/.test(e.key)) e.preventDefault(); this.onKey(e.key.toUpperCase()); });
    this.input.keyboard!.addCapture('F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12');
    // 失焦/切后台时清空按键状态，避免 keyup 丢失导致方向键"卡住"或失灵
    const reset = () => { hold.reset(); this.input.keyboard?.resetKeys(); this.ui?.pad?.reset?.(); };
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset); this.game.events.on('blur', reset);
    this.events.once('shutdown', () => { window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset); this.game.events.off('blur', reset); });
    this.handle(this.world.drainEvents());
    const sk = this.world.skills.map(s => `${s.key} ${s.name}`).join('  ');
    this.log(`${this.world.classDef.name}：${sk}`);
    this.log('商人只在城镇/新手村；战斗地图起点左侧是回城入口（S）；B 打开背包');
    // 截图/调试参数：?floor=N 直接进入第 N 层；?demo=1 把怪物排到主角附近
    const fl = Number(qs.get('floor'));
    if (fl >= 1 && fl <= this.world.floors.length && !data?.save) { this.world.loadFloor(fl - 1); this.handle(this.world.drainEvents()); }
    if (qs.has('demo')) this.demo(qs);
    this.scene.stop('UI'); this.scene.launch('UI');
    if (qs.get('panel')) this.time.delayedCall(300, () => this.openPanel(qs.get('panel') as PanelMode));
  }
  /** 仅截图用的演示布置：怪物靠近、可选召唤/给装备/释放技能 */
  demo(qs: URLSearchParams) {
    const w = this.world, h = w.hero!, all = w.alive('enemy').sort((a, b) => a.x - b.x), boss = all.filter(e => e.tier === 'boss');
    const es = qs.has('boss') ? [...all.filter(e => e.tier !== 'boss').slice(0, 1), ...boss] : [...all.filter(e => e.tier !== 'boss').slice(0, 4 - boss.length), ...boss];
    h.x += 300; es.forEach((e, i) => { e.x = e.homeX = h.x + 190 + i * 160 + (e.tier === 'boss' ? 60 : 0); });
    if (qs.has('summon')) { w.cast(w.skills.findIndex(s => s.kind === 'summon'), this.cds); this.cds.fill(0); }
    if (qs.has('gear')) {
      for (const [id, r] of [['dragon_sword', 'rare'], ['bone_helm', 'magic'], ['armor', 'common'], ['pearl', 'magic'], ['gold_ring', 'rare'], ['boots', 'common'], ['bracelet', 'magic'], ['iron_sword', 'common'], ['magic_staff', 'magic'], ['meat', 'common'], ['bone', 'common'], ['helmet', 'rare']] as const) w.bag.push(w.makeItem(id, r));
      w.gold += 860; w.equipItem(1); w.equipItem(2); w.equipItem(4);
    }
    this.handle(w.drainEvents());
    // 号角召出的沃玛教主、第一张图的刷新怪不发 summon 事件：补建缺失的视图，避免「有怪无图」
    this.ensureFoeViews();
    this.views.forEach(v => { v.x = v.unit.x; v.sync(); });
    const last = es.filter(e => e.tier !== 'boss').pop();
    if (last && !qs.has('nodrop')) { last.drops = [{ item: 'gold', chance: 1 }, { item: 'hp_small', chance: 1 }, { item: 'iron_sword', chance: 1, rarity: 'rare' }]; w.kill(last); this.handle(w.drainEvents()); }
    const cast = qs.get('cast');
    if (cast) this.time.delayedCall(Number(qs.get('castdelay') ?? 900), () => this.onKey(cast.toUpperCase()));
  }
  buildPortal(x: number) {
    const c = this.add.container(x, GROUND_Y - 120).setDepth(4);
    const core = this.add.ellipse(0, 10, 150, 225, 0x8a2cff, 0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: core, alpha: { from: 0.25, to: 0.55 }, duration: 900, yoyo: true, repeat: -1 });
    // 参考 video2 g_070：紫色漩涡
    const swirl = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    for (let k = 0; k < 3; k++) { swirl.lineStyle(5, [0xd080ff, 0xa040ff, 0xff90ff][k], 0.7); swirl.beginPath(); for (let a = 0; a < Math.PI * 3; a += 0.15) { const r = 8 + a * 11; const px = Math.cos(a + k * 2.1) * r * 0.62, py = Math.sin(a + k * 2.1) * r * 0.95; if (a === 0) swirl.moveTo(px, py); else swirl.lineTo(px, py); } swirl.strokePath(); }
    this.tweens.add({ targets: swirl, angle: 360, duration: 4000, repeat: -1 });
    const rings = [0xb050ff, 0x7a2cff, 0xe090ff].map((col, i) => {
      const e = this.add.ellipse(0, 0, 150 - i * 34, 230 - i * 50).setStrokeStyle(8 - i * 2, col, 0.9).setFillStyle(col, 0.12);
      this.tweens.add({ targets: e, scaleX: { from: 0.92, to: 1.06 }, alpha: { from: 0.7, to: 1 }, duration: 700 + i * 200, yoyo: true, repeat: -1 });
      return e;
    });
    // 参考原作：石质拱门 + 紫色漩涡 + 上升光点
    const arch = this.add.graphics();
    arch.fillStyle(0x4a4e58, 1).fillRect(-98, -100, 26, 225).fillRect(72, -100, 26, 225);
    arch.lineStyle(26, 0x4a4e58, 1).beginPath().arc(0, -100, 85, Math.PI, 0, false).strokePath();
    arch.lineStyle(2, 0x9aa0ac, 0.8).strokeRect(-98, -100, 26, 225).strokeRect(72, -100, 26, 225);
    for (let i = -3; i <= 3; i++) { const a = Math.PI * (1 + (i + 3) / 6); arch.fillStyle(0x6a7080, 1).fillRect(Math.cos(a) * 85 - 7, -100 + Math.sin(a) * 85 - 7, 14, 14); }
    const motes = this.add.particles(0, 0, '__WHITE', { x: { min: -60, max: 60 }, y: { min: 60, max: 110 }, speedY: { min: -60, max: -25 }, lifespan: 1800, scale: { start: 3, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0xd090ff, 0xaa66ff], frequency: 120 });
    const t = this.add.text(0, -205, '下一层', { fontFamily: FONT, fontSize: '22px', color: '#e0c8ff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.portalHint = this.add.text(0, -235, IS_MOBILE ? '点「进入」' : '按 W/空格 进入', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a0a5a', strokeThickness: 5 }).setOrigin(0.5).setVisible(false);
    this.tweens.add({ targets: this.portalHint, y: -242, duration: 500, yoyo: true, repeat: -1 });
    c.add([arch, core, swirl, ...rings, motes, t, this.portalHint]); this.portal = c;
    // 手机：传送门本体可点（与「进入」键同效，不在门口则提示走近）；电脑不加交互，保持原样
    if (IS_MOBILE) arch.setInteractive(new Phaser.Geom.Rectangle(-110, -200, 220, 330), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.mobileAct('portal'));
  }
  // ===== R14 横版长街城镇 =====
  street?: Phaser.GameObjects.Container; streetFar?: Phaser.GameObjects.TileSprite; streetHint?: Phaser.GameObjects.Text; townTarget: { x: number; id: string } | null = null;
  /** 城镇长街：背景（占位：bg_town_street_<id> 远/中/近三层未到时用单屏 bg_bichi_town 拼接+色块），店铺门面 + NPC 立绘，西端城门 */
  buildStreet(id: string) {
    this.clearStreet(); const t = TOWNS[id]; if (!t) return;
    for (const [uid, v] of [...this.views]) if (!v.unit.isHero && !v.unit.summon) { v.destroy(); this.views.delete(uid); }
    this.groundObjs.forEach(os => os.forEach(o => o.destroy())); this.groundObjs.clear(); this.floorUids = [];
    this.bgImgs.forEach(b => b.setVisible(false)); this.portal.setVisible(false); this.merchant.setVisible(false);
    const K = STREET_ART_K, need = ['bg_far', 'ground_strip', 'street_near_1', 'street_near_2', 'street_near_3', ...Object.values(NPC_ART).flatMap(a => ['npc_' + a, 'shop_' + a])].filter(k => !this.textures.exists(k));
    if (need.length) { need.forEach(k => this.load.image(k, `assets/town/${k}.${k === 'bg_far' || k === 'ground_strip' ? 'jpg' : 'png'}`)); this.load.once('complete', () => { if (this.world.town === id) this.buildStreet(id); }); this.load.start(); }
    const C = this.street = this.add.container(0, 0).setDepth(3), W = TOWN_W, has = (k: string) => this.textures.exists(k);
    // 远景（0.3x 视差，固定在屏幕上平铺滚动）
    if (has('bg_far')) { const far = hdFixed(this.add.tileSprite(-(MAX_LW - 1280) / 2, 0, MAX_LW, 720, 'bg_far').setOrigin(0).setScrollFactor(0).setTileScale(K)); this.streetFar = far; C.add(far); }
    else { const far = hdFixed(this.add.graphics().setScrollFactor(0)); far.fillGradientStyle(0x6ab0ff, 0x6ab0ff, 0xc8e8a0, 0xc8e8a0, 1).fillRect(-(MAX_LW - 1280) / 2, 0, MAX_LW, 720); C.add(far); }
    // 地面（原 y=720~1080 → 480~720，平铺）
    if (has('ground_strip')) C.add(this.add.tileSprite(0, 720 * K, W, 360 * K, 'ground_strip').setOrigin(0).setTileScale(K));
    else C.add(this.add.rectangle(0, 720 * K, W, 360 * K, 0x9a8a70).setOrigin(0));
    // 近景店铺带：三段拼成整街；缺图时用单个 shop_<id> 门面（0.85 倍，底边 y=760）
    // 点街面任意处：走到那里（手机横屏左右走）
    C.add(this.add.rectangle(0, 0, W, 720, 0, 0.001).setOrigin(0).setInteractive().on('pointerdown', (p: Phaser.Input.Pointer) => this.walkTo(p.worldX, 'walk')));
    const near = [1, 2, 3].every(i => has('street_near_' + i));
    if (near) [1, 2, 3].forEach(i => C.add(this.add.image(1920 * (i - 1) * K, 0, 'street_near_' + i).setOrigin(0).setScale(K)));
    for (const d of streetDoors(id)) {
      const n = d.npc;
      if (!near) { if (has('shop_' + d.art)) C.add(this.add.image(d.x, 760 * K, 'shop_' + d.art).setOrigin(0.5, 1).setScale(0.85 * K)); else C.add(this.add.rectangle(d.x, 760 * K, 544 * K, 612 * K, 0x6a4a2a).setOrigin(0.5, 1).setStrokeStyle(3, 0xd4a64a)); }
      C.add(this.add.text(d.x, 250, n.name.replace(/（.*）/, ''), { fontFamily: FONT, fontSize: '17px', color: '#ffe8a0', stroke: '#1a1008', strokeThickness: 4 }).setOrigin(0.5));
      if (has('npc_' + d.art)) C.add(this.add.image(d.x, 1040 * K, 'npc_' + d.art).setOrigin(0.5, 1).setScale(0.45 * K));
      C.add(this.add.rectangle(d.x, 100, 300, 760 * K - 100, 0, 0.001).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.walkTo(d.x, n.id)));
    }
    // 西端出城路牌
    C.add(this.add.text(36, GROUND_Y - 150, '◀\n出城', { fontFamily: FONT, fontSize: '22px', color: '#ffe8a0', align: 'center', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.walkTo(TOWN_GATE_X + 40, 'gate')));
    this.streetHint = this.add.text(0, GROUND_Y - 400, '', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a0a5a', strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
    this.hud?.setFloor(t.name, []); const hv = this.world.hero && this.views.get(this.world.hero.uid); if (hv) hv.x = this.world.hero!.x;
    this.cameras.main.centerOn(this.world.hero?.x ?? 640, 360); this.cameras.main.fadeIn(500);
  }
  clearStreet() {
    if (!this.street) return; this.street.destroy(true); this.street = undefined; this.streetHint?.destroy(); this.streetHint = undefined; this.streetFar = undefined; this.townTarget = null;
    this.portal.setVisible(true); this.merchant.setVisible(true); this.applyFloorWidth();
  }
  /** 点击门面/城门：走过去，到达后进店/出城 */
  walkTo(x: number, id: string) { if (this.paused || this.state !== 'play' || !this.world.town) return; const h = this.world.hero; if (h && Math.abs(h.x - x) < 100) this.townArrive(id); else this.townTarget = { x, id }; }
  townArrive(id: string) { if (id === 'walk') return; if (id === 'gate') this.leaveTownNow(); else { this.sfx('click'); this.ui.panel.openNpc(id); } }
  townUse() { const w = this.world; if (this.paused) return; if (w.atTownGate()) return this.leaveTownNow(); const d = w.nearDoor(); if (d) this.townArrive(d.npc.id); else this.log('走到店铺门口再进店；西端城门出城'); }
  leaveTownNow() { const e = this.world.leaveTown(); if (e) this.log(e); this.handle(this.world.drainEvents()); this.saveGame(); }
  updateStreet() {
    if (!this.street || !this.streetHint) return; const w = this.world, h = w.hero; if (!h) return;
    if (this.streetFar) this.streetFar.tilePositionX = this.cameras.main.scrollX * 0.3 / STREET_ART_K;
    const d = w.nearDoor(), g = w.atTownGate(), act = IS_MOBILE ? '点门面' : 'W/空格';
    this.streetHint.setVisible(!!d || g).setText(g ? `${act} 出城` : d ? `${act} 进入 ${d.npc.name.replace(/（.*）/, '')}` : '').setX(g ? TOWN_GATE_X + 90 : d?.x ?? 0);
  }
  /** 商人：本层起点的小摊（背景层，不参与战斗） */
  buildMerchant() {
    const c = this.add.container(MERCHANT_X, GROUND_Y - 70).setDepth(5);
    const g = this.add.graphics();
    g.fillStyle(0x5a3a1a).fillRect(-60, -10, 120, 70); g.fillStyle(0x8a1010).fillTriangle(-75, -10, 75, -10, 0, -70);
    g.lineStyle(2, 0xd4a64a).strokeRect(-60, -10, 120, 70);
    c.add(g);
    if (this.textures.exists('merchant')) c.add(this.add.image(0, 22, 'merchant').setDisplaySize(52, 52));
    this.gateLabel = this.add.text(0, -92, IS_MOBILE ? '回城' : '回城 [S]', { fontFamily: FONT, fontSize: '16px', color: '#ffe8a0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5); c.add(this.gateLabel);
    g.setInteractive(new Phaser.Geom.Rectangle(-75, -70, 150, 130), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.goBackTown());
    this.merchant = c;
  }
  /** 阶段4：矿点（代码绘制，docs/art-requests.md「矿点」）；有矿层才显示，挖空时变暗 */
  mineNode?: Phaser.GameObjects.Container; mineLabel?: Phaser.GameObjects.Text;
  syncMine() {
    const w = this.world;
    if (!this.mineNode) {
      const g = this.add.graphics();
      g.fillStyle(0x3a3530, 1); g.fillTriangle(-70, 30, -20, -55, 30, 30); g.fillTriangle(-10, 30, 35, -35, 75, 30);
      g.fillStyle(0x24211e, 1); g.fillEllipse(0, 30, 160, 22);
      g.fillStyle(0x15151f, 1); for (const [x, y, r] of [[-30, -5, 10], [10, 5, 8], [40, -8, 7], [-5, -30, 6]]) g.fillCircle(x, y, r);
      g.lineStyle(2, 0x8a8aff, 0.8); for (const [x, y] of [[-30, -5], [10, 5], [40, -8]]) g.strokeCircle(x, y, 4);
      this.mineLabel = this.add.text(0, -80, '矿点', { fontSize: '16px', color: '#c8c8ff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.mineNode = this.add.container(0, GROUND_Y - 30, [g, this.mineLabel]).setDepth(3);
    }
    const on = w.hasMine(); this.mineNode.setVisible(on); if (!on) return;
    this.mineNode.setX(w.mineX()); const cd = w.mineCdLeft();
    this.mineNode.setAlpha(cd > 0 ? 0.45 : 1);
    this.mineLabel!.setText(w.mine ? '挖矿中…' : cd > 0 ? `矿脉枯竭 ${cd}s` : w.atMine() ? '矿点（W/空格 挖矿）' : '矿点');
  }
  gateLabel?: Phaser.GameObjects.Text; rightWall?: Phaser.GameObjects.Rectangle;
  /** 任务 A：按本层宽度显示背景段（交替镜像平铺、不拉伸）、右墙、传送门，并限定相机范围 */
  applyFloorWidth() {
    const W = this.world.mapW;
    this.bgImgs.forEach((b, k) => b.setVisible(!this.street && k * 1280 < (W - 1280) * 0.7 + 1280)); // 背景视差 0.7：最右可见到 (W−1280)×0.7+1280
    this.rightWall?.setX(W - 6); this.portal?.setX(this.world.exitX);
    this.syncMine();
    this.cameras.main.setBounds(0, 0, W, 720);
  }
  /** 回城/回村入口（原「商人」位置，战斗地图不再有商人） */
  goBackTown() {
    if (this.state !== 'play' || this.paused) return; const w = this.world;
    const e = w.returnToTown(); if (e) this.log(e === '回城入口在本层起点（左侧）' ? `走回本层起点左侧的入口，回到 ${w.returnTownName()}` : e); else this.sfx('click');
  }
  nearMerchant() { const h = this.world.hero; return !!h && h.x - MERCHANT_X < SHOP_RANGE; }
  openPanel(m: PanelMode) {
    if (this.state !== 'play') return;
    if (m === 'shop' && !this.world.town && !this.ui.panel.open) { this.log(`战斗地图没有商人：从起点回城入口（S）回 ${this.world.returnTownName()} 补给`); return; }
    this.sfx('click'); this.ui.panel.toggle(m);
  }
  saveGame() { if (this.state !== 'win' && this.world.hero) SaveStore.write(this.world.toSave()); }
  toTitle() { this.saveGame(); this.scene.stop('UI'); this.scene.start('Title'); }

  onKey(k: string) {
    if (k === 'M') return this.openPanel('map');
    if (k === 'N') { Settings.muted = !Settings.muted; Settings.apply(this.sound); Settings.save(); this.log(Settings.muted ? '已静音' : '已取消静音'); return; }
    if (this.state === 'win') { if (k === ' ') { this.sfx('click'); this.toTitle(); } return; }
    if (k === 'ESCAPE') { if (this.paused) this.ui.panel.close(); else this.openPanel('settings'); return; }
    if (k === 'B' || k === 'C' || k === 'I') return this.openPanel('bag');
    if (k === 'T') { if (this.world.town) { this.townUse(); return; } return this.openPanel('shop'); }
    if (k === 'K') return this.openPanel('skills');
    if (k === 'H') { this.log(this.world.useRecallScroll()); return; } // 任务C：回城卷快捷键
    if (k === 'Q') return this.openPanel('quests');
    if (this.paused || this.state !== 'play') return;
    // 合击版 A2/A4 [适配] 键位：R 召唤/收回、E 切换状态（官方 Ctrl+E）、G 合击爆发（官方 Ctrl+S，本作 S 已用于回城）
    if (k === 'R' || k === 'E' || k === 'G') { const w = this.world; const e = k === 'R' ? w.toggleCompanion() : k === 'E' ? w.cycleCompanionMode() : w.unleashCombo();
      if (e) this.log(e); this.handle(w.drainEvents()); this.ui?.panel?.open && this.ui.panel.render(); return; }
    if (k === ' ' || k === 'W') { if (this.world.town) this.townUse(); else if (this.entranceHere() === 'mine') this.mobileAct(); else this.usePortal(); return; }
    if (k === 'S' && !this.world.town && this.world.atReturnGate() && (this.world.floorIndex === 0 || REGIONS.some(r => r.floors[0] === this.world.floorIndex))) { this.goBackTown(); return; }
    if (k === 'S') { if (!this.fading && this.world.hero && this.world.floorIndex > 0 && this.world.hero.x <= WORLD.heroStartX + 150) { this.fading = true; this.cameras.main.fadeOut(400, 0, 0, 0); this.cameras.main.once('camerafadeoutcomplete', () => { this.fading = false; this.world.prevFloor(); }); } else this.log('在本层起点按 S 返回上一层，或点左侧入口回城'); return; }
    const h = this.world.hero; if (!h) return;
    const si = this.world.skills.findIndex(s => s.key === k);
    if (si >= 0) {
      const r = this.world.cast(si, this.cds);
      if (!r.ok) { if (r.reason) this.log(r.reason); return; }
      const evs = this.world.drainEvents();
      const hv = this.views.get(h.uid)!; hv.windup(h.facing);
      this.time.delayedCall(FX.windupMs, () => this.skillFx(r.skill, hv, r.targets, evs));
      return;
    }
    const pi = POTIONS.findIndex(p => p.key === k);
    if (pi >= 0) { const n = this.world.usePotion(pi); if (n) { this.sfx('potion'); this.log(`${n}使用`, true); } }
  }
  skillFx(skill: string, hv: CardView, targets: number[], evs: BattleEvent[]) {
    const tv = targets.map(id => this.views.get(id)).filter((v): v is CardView => !!v);
    const sk = this.world.skills.find(s => s.id === skill); this.sfx(sk?.sfx ?? skill);
    const done = () => this.handle(evs), dir = hv.unit.facing, flip = dir < 0;
    const dur = sk ? this.world.buffDuration(sk) : 8;
    // R12：优先播放图集特效（ui/FxPlayer），素材缺失/超上限时回落到 Fx.ts 的 Graphics 特效
    switch (skill) {
      // 诱惑之光：fx_charm_light（docs/fx-requests.md #诱惑之光）缺失 → Graphics 圣光占位
      case 'charm': if (tv[0] && !playFx(this, 'fx_charm_light', tv[0].cx, tv[0].cy)) fx.holyLight(this, tv[0].cx, tv[0].cy, tv[0].h); return done();
      case 'fire_sword': hv.lunge(dir, 34); if (tv[0] && !playFx(this, 'fx_fire_sword_hit', tv[0].cx, tv[0].cy, { flip })) fx.bloodBlade(this, tv[0].cx, tv[0].cy, tv[0].h); return done();
      case 'half_moon': if (tv.length) {
        const last = tv[tv.length - 1]; hv.lunge(dir, 20);
        if (!playFx(this, 'fx_half_moon_sweep', hv.cx, hv.cy, { flip })) {
          fx.halfMoon(this, hv.cx + dir * hv.w / 2, last.cx + dir * 40, tv[0].cy, Math.max(...tv.map(v => v.h)));
          tv.forEach(v => fx.bloodBlade(this, v.cx, v.cy, v.h * 0.7, FX.halfMoonColor));
        }
      } return done();
      case 'thrust': hv.lunge(dir, 34); if (tv[0] && !playFx(this, 'fx_thrust_hit', hv.cx + dir * hv.w * 0.3, tv[0].cy, { flip })) fx.shadowSlash(this, tv[0].cx, tv[0].cy, tv[0].h); return done();
      case 'fire_wall': if (tv[0]) {
        const fw = playFx(this, 'fx_fire_wall_loop', tv[0].cx, tv[0].y, { ms: dur * 1000 });
        if (!fw) fx.fireWall(this, tv[0].cx, tv[0].cy + 40);
        tv.forEach(v => fx.hitSpark(this, v.cx, v.cy));
      } return done();
      case 'rush': {
        hv.lunge(dir, 50);
        const d = playFx(this, 'fx_rush_dash', hv.cx, hv.cy, { flip, decorative: true }); if (d) follow(this, d, () => hv.active ? { x: hv.cx, y: hv.cy } : null);
        tv.forEach(v => { if (!playFx(this, 'fx_rush_hit', v.cx, v.cy)) fx.shadowSlash(this, v.cx, v.cy, v.h); });
        return done();
      }
      // 传世技能（docs/fx-requests.md #传世）：专属图集缺失 → 复用相近图集着色 / Graphics 占位
      case 'thunder_sword': hv.lunge(dir, 34); if (tv[0]) { if (!playFx(this, 'fx_thunder_strike', tv[0].cx, tv[0].y, { tint: 0xc8e0ff })) fx.lightning(this, tv[0].cx, tv[0].y - 600, tv[0].cy); fx.bloodBlade(this, tv[0].cx, tv[0].cy, tv[0].h, 0x9fd0ff); } return done();
      case 'break_strike': case 'shield_break': hv.lunge(dir, 30); if (tv[0]) { const c = skill === 'break_strike' ? 0xffa040 : 0x80b0ff; if (!playFx(this, 'fx_thrust_hit', tv[0].cx, tv[0].cy, { flip, tint: c })) fx.shadowSlash(this, tv[0].cx, tv[0].cy, tv[0].h); } return done();
      case 'dash_slash': {
        hv.lunge(dir, 60); const d = playFx(this, 'fx_rush_dash', hv.cx, hv.cy, { flip, decorative: true, tint: 0xffe0a0 }); if (d) follow(this, d, () => hv.active ? { x: hv.cx, y: hv.cy } : null);
        tv.forEach(v => { if (!playFx(this, 'fx_rush_hit', v.cx, v.cy)) fx.shadowSlash(this, v.cx, v.cy, v.h); }); return done();
      }
      case 'vajra_body': {
        const ms = dur * 1000, l = playFx(this, 'fx_holy_armor_loop', hv.cx, hv.cy, { ms, tint: 0xffc040, decorative: true });
        if (l) follow(this, l, () => hv.active ? { x: hv.cx, y: hv.cy } : null); else fx.holyLight(this, hv.cx, hv.cy, hv.h);
        fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '金刚护体', '#ffd060', 0.7); return done();
      }
      case 'ice_arrow': if (tv[0]) { const t = tv[0], x0 = hv.cx + dir * hv.w * 0.4, y0 = hv.cy - 20; fx.projectile(this, x0, y0, t.cx, t.cy, 'talisman', () => { if (!playFx(this, 'fx_ice_roar_burst', t.cx, t.y, { scale: 0.6 })) fx.hitSpark(this, t.cx, t.cy); fx.frostTint(t.art, 1500); done(); }); return; } return done();
      case 'ice_dragon': case 'frost_blade': case 'ice_whirl': {
        if (skill === 'frost_blade') fx.iceRoar(this, hv.cx, GROUND_Y + hv.unit.y - 10, sk?.range ?? 170);
        tv.forEach((v, i) => this.time.delayedCall(i * 40, () => { if (v.active && !playFx(this, 'fx_ice_roar_burst', v.cx, v.y, { scale: skill === 'ice_whirl' ? 1.2 : 0.9 })) fx.hitSpark(this, v.cx, v.cy); }));
        tv.forEach(v => fx.frostTint(v.art, 1200)); return done();
      }
      case 'five_thunder': { tv.forEach((v, i) => this.time.delayedCall(i * 70, () => { if (v.active && !playFx(this, 'fx_thunder_strike', v.cx, v.y, { tint: 0xd0a0ff })) fx.lightning(this, v.cx, v.y - 600, v.cy); })); if (!FxQuality.low) this.cameras.main.shake(140, 0.004); return done(); }
      case 'soul_wall': { tv.forEach(v => { const l = playFx(this, 'fx_poison_loop', v.cx, v.cy, { ms: dur * 1000, tint: 0xa080ff }); if (!l) fx.poisonCloud(this, v.cx, v.cy, v.h); }); fx.floatNumber(this, tv[0]?.cx ?? hv.cx, (tv[0]?.cy ?? hv.cy) - 60, 120, '灵魂墙', '#c0a0ff', 0.7); return done(); }
      case 'holy_light': if (tv[0]) { if (!playFx(this, 'fx_heal_pillar', tv[0].cx, tv[0].y, { tint: 0xfff0a0 })) fx.holyLight(this, tv[0].cx, tv[0].cy, tv[0].h); } return done();
      case 'cleanse': { const all = [hv, ...tv.filter(v => v !== hv)]; all.forEach(v => { if (!playFx(this, 'fx_heal_pillar', v.cx, v.y, { tint: 0x90ffb0 })) fx.holyLight(this, v.cx, v.cy, v.h); }); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '解毒术', '#90ffb0', 0.7); return done(); }
      case 'decoy_talisman': { const x = hv.cx + dir * 120, y = GROUND_Y + WORLD.summonLane; if (!playFx(this, 'fx_summon_pillar', x, y, { tint: 0xe8d8a0 })) fx.summonCircle(this, x, y); return done(); }
      case 'drive_corpse': case 'summon_golden_skeleton': {
        const x = hv.x - dir * 110, y = GROUND_Y + WORLD.summonLane, tint = skill === 'drive_corpse' ? 0x90c060 : 0xffd040;
        const c = playFx(this, 'fx_summon_circle', x, y, { tint, onFrame: [4, () => playFx(this, 'fx_summon_pillar', x, y, { tint })] });
        if (!c) fx.summonCircle(this, x, y); return done();
      }
      case 'summon_beast': case 'summon_skeleton': {
        const x = skill === 'summon_beast' ? hv.cx - dir * 80 : hv.x - dir * 110, y = GROUND_Y + WORLD.summonLane;
        const c = playFx(this, skill === 'summon_beast' ? 'fx_summon_beast_circle' : 'fx_summon_circle', x, y, { onFrame: [4, () => playFx(this, 'fx_summon_pillar', x, y)] });
        if (!c) fx.summonCircle(this, x, skill === 'summon_beast' ? hv.cy : y);
        return done();
      }
      case 'fireball': case 'soul_fire': if (tv[0]) {
        const t = tv[0], fb = skill === 'fireball', x0 = hv.cx + dir * hv.w * 0.4, y0 = hv.cy - 20;
        const hit = () => {
          this.sfx('fireball_impact', 0.5);
          if (!playFx(this, fb ? 'fx_fireball_hit' : 'fx_soul_fire_hit', t.cx, t.cy)) fx.explosion(this, t.cx, t.cy, t.h * 0.35, fb ? 0xffdd55 : 0xfff2a0, fb ? 0xff4400 : 0x3ac83a);
          done();
        };
        if (fb) playFx(this, 'fx_fireball_cast', x0, y0, { decorative: true });
        const go = () => { if (!flyFx(this, fb ? 'fx_fireball_fly' : 'fx_soul_fire_fly', x0, y0, t.cx, t.cy, hit)) fx.projectile(this, x0, y0, t.cx, t.cy, fb ? 'fire' : 'talisman', hit); };
        if (fb && this.textures.exists('fx_fireball_cast')) this.time.delayedCall(150, go); else go();
        return;
      } return done();
      // #11 法师新技能：专属图集（docs/fx-requests.md #11 / v3），缺图回落旧图集或 Graphics
      case 'big_fireball': if (tv[0]) {
        const t = tv[0], x0 = hv.cx + dir * hv.w * 0.4, y0 = hv.cy - 20;
        const hit = () => { this.sfx('fireball_impact', 0.7); if (!playFx(this, 'fx_big_fireball_hit', t.cx, t.cy) && !playFx(this, 'fx_fireball_hit', t.cx, t.cy, { scale: 1.4 })) fx.explosion(this, t.cx, t.cy, t.h * 0.5); done(); };
        playFx(this, 'fx_fireball_cast', x0, y0, { decorative: true });
        const go = () => { if (!flyFx(this, 'fx_big_fireball_fly', x0, y0, t.cx, t.cy, hit) && !flyFx(this, 'fx_fireball_fly', x0, y0, t.cx, t.cy, hit)) fx.projectile(this, x0, y0, t.cx, t.cy, 'fire', hit); };
        if (this.textures.exists('fx_fireball_cast')) this.time.delayedCall(150, go); else go();
        return;
      } return done();
      case 'burst_fire': if (tv[0]) {
        const t = tv[0];
        if (!playFx(this, 'fx_burst_fire_blast', t.cx, t.y) && !playFx(this, 'fx_common_explosion', t.cx, t.cy, { scale: 1.6 })) fx.explosion(this, t.cx, t.cy, 170, 0xffdd55, 0xff4400);
        tv.forEach((v, i) => { if (i === 0) return; this.time.delayedCall(60, () => { if (v.active && !playFx(this, 'fx_common_hitspark', v.cx, v.cy)) fx.hitSpark(this, v.cx, v.cy); }); });
      } return done();
      case 'hell_fire': {
        if (!playFx(this, 'fx_hell_fire_line', hv.cx + dir * hv.w / 2, hv.y, { flip: dir < 0 }))
          tv.forEach((v, i) => this.time.delayedCall(i * 60, () => { if (!v.active) return; if (!playFx(this, 'fx_fire_wall_loop', v.cx, v.y, { ms: 500 })) fx.fireWall(this, v.cx, v.cy + 40); }));
        return done();
      }
      case 'lightning_flash': case 'hell_thunder': {
        const ht = skill === 'hell_thunder', shake = () => { if (!FxQuality.low) this.cameras.main.shake(140, 0.005); };
        if (!ht) {
          if (!playFx(this, 'fx_lightning_flash_beam', hv.cx + dir * hv.w / 2, hv.cy, { flip: dir < 0 }))
            tv.forEach((v, i) => this.time.delayedCall(i * 30, () => { if (v.active && !playFx(this, 'fx_thunder_strike', v.cx, v.y)) fx.lightning(this, v.cx, v.y - 600, v.cy); }));
        } else {
          if (!playFx(this, 'fx_hell_thunder_burst', hv.cx, hv.y)) fx.explosion(this, hv.cx, hv.cy, sk?.range ?? 425, 0xbfe4ff, 0x4a7dff);
          tv.forEach((v, i) => this.time.delayedCall(i * 50, () => { if (v.active && !playFx(this, 'fx_thunder_strike', v.cx, v.y)) fx.lightning(this, v.cx, v.y - 600, v.cy); }));
        }
        shake(); return done();
      }
      case 'thunder': if (tv[0]) {
        const t = tv[0], shake = () => { if (!FxQuality.low) this.cameras.main.shake(120, 0.004); };
        if (playFx(this, 'fx_thunder_strike', t.cx, t.y, { onFrame: [1, () => { shake(); done(); }] })) return;
        fx.lightning(this, t.cx, t.y - 600, t.cy); shake();
      } return done();
      case 'ice_roar': {
        let anyFx = true;
        tv.forEach((v, i) => this.time.delayedCall(i * 40, () => { if (v.active && !playFx(this, 'fx_ice_roar_burst', v.cx, v.y)) anyFx = false; }));
        if (!this.textures.exists('fx_ice_roar_burst') || !tv.length) anyFx = false;
        if (!anyFx) fx.iceRoar(this, hv.cx, GROUND_Y + hv.unit.y - 10, sk?.range ?? 420);
        tv.forEach(v => fx.frostTint(v.art, (sk?.duration ?? 4) * 1000)); return done();
      }
      case 'magic_shield': {
        const sc = 1, ms = dur * 1000; // R13 F3：非命中特效统一 1×（原按卡高放大至 1.0–1.3）
        const startLoop = () => { const l = playFx(this, 'fx_magic_shield_loop', hv.cx, hv.cy, { scale: sc, ms }); if (l) follow(this, l, () => hv.active ? { x: hv.cx, y: hv.cy } : null); return !!l; };
        const c = playFx(this, 'fx_magic_shield_cast', hv.cx, hv.cy, { scale: sc, onDone: () => { startLoop(); } });
        if (!c && !startLoop()) fx.magicShield(this, hv, hv.cy, hv.h, ms);
        fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '魔法盾', '#88ccff', 0.7); return done();
      }
      case 'poison': if (tv[0]) {
        const t = tv[0], x0 = hv.cx + dir * hv.w * 0.4, y0 = hv.cy - 20;
        const hit = () => { const l = playFx(this, 'fx_poison_loop', t.cx, t.cy, { ms: dur * 1000 }); if (l) follow(this, l, () => t.active && t.unit.alive ? { x: t.cx, y: t.cy } : null); else fx.poisonCloud(this, t.cx, t.cy, t.h); done(); };
        if (!flyFx(this, 'fx_poison_fly', x0, y0, t.cx, t.cy, hit)) fx.projectile(this, x0, y0, t.cx, t.cy, 'poison', hit);
        return;
      } return done();
      // #12 道士：专属图集（docs/fx-requests.md #12 / v4）；缺图回落魔法盾图集着色 / 每目标治愈光柱 / Graphics
      case 'ghost_shield': case 'holy_armor': {
        const gs = skill === 'ghost_shield', tint = gs ? 0xb08cff : 0xffd860, ms = dur * 1000, name = gs ? '幽灵盾' : '神圣战甲术';
        const kc = gs ? 'fx_ghost_shield_cast' : 'fx_holy_armor_cast', kl = gs ? 'fx_ghost_shield_loop' : 'fx_holy_armor_loop';
        const own = this.textures.exists(kc);
        const startLoop = () => { const l = this.textures.exists(kl) ? playFx(this, kl, hv.cx, hv.cy, { ms, decorative: true }) : playFx(this, 'fx_magic_shield_loop', hv.cx, hv.cy, { tint, ms, decorative: true }); if (l) follow(this, l, () => hv.active ? { x: hv.cx, y: hv.cy } : null); return !!l; };
        const c = own ? playFx(this, kc, hv.cx, hv.cy, { onDone: () => { startLoop(); } }) : playFx(this, 'fx_magic_shield_cast', hv.cx, hv.cy, { tint, onDone: () => { startLoop(); } });
        if (!c) fx.holyLight(this, hv.cx, hv.cy, hv.h);
        fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, name, gs ? '#c8a8ff' : '#ffe080', 0.7); return done();
      }
      case 'mass_heal': {
        const all = [hv, ...tv.filter(v => v !== hv)];
        playFx(this, 'fx_mass_heal_burst', hv.cx, hv.y);
        all.forEach((v, i) => this.time.delayedCall(i * 80, () => { if (v.active && !playFx(this, 'fx_heal_pillar', v.cx, v.y)) fx.holyLight(this, v.cx, v.cy, v.h); }));
        fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '群体治愈术', '#80ff90', 0.7); return done();
      }
      case 'heal': { const v = tv[0] ?? hv; /* 主角满血时目标为召唤物 */ if (!playFx(this, 'fx_heal_pillar', v.cx, v.y)) fx.holyLight(this, v.cx, v.cy, v.h); fx.floatNumber(this, v.cx, v.cy - v.h * 0.2, v.h, '治愈术', '#80ff90', 0.7); return done(); }
      default: return done();
    }
  }

  handle(evs: BattleEvent[]) {
    for (const e of evs) {
      if (e.type === 'attack') {
        const r = playCombatAnim(e, uid => this.views.get(uid)); if (r?.kind !== 'attack') continue;
        const sv = r.sv as CardView, tv = r.tv as CardView, dir = r.dir;
        if (sv.unit.isHero) playFx(this, 'fx_common_slash', sv.cx + dir * sv.w * 0.25, sv.cy - 10, { tint: SLASH_TINT[this.world.cls], flip: dir < 0, decorative: this.world.cls !== 'warrior' });
        if (sv.unit.isHero && this.world.cls !== 'warrior') fx.projectile(this, sv.cx + dir * 30, sv.cy - 20, tv.cx, tv.cy, this.world.cls === 'mage' ? 'fire' : 'talisman', () => { if (this.world.cls !== 'mage' || !playFx(this, 'fx_common_explosion', tv.cx, tv.cy, { scale: 0.7, decorative: true })) fx.hitSpark(this, tv.cx, tv.cy); });
        else if (sv.unit.isHero && this.textures.exists('fx_common_slash')) { /* 已播放图集挥砍 */ }
        else {
          // 召唤物专属攻击特效（docs/fx-requests.md 召唤物动作 / v5）；缺图退回原 Graphics 挥砍
          const u = sv.unit, fx0 = sv.x + dir * (sv.w / 2 + 6);
          if (u.summon) sv.showPose(u.id + '_atk'); // 姿态帧（art-requests L.2），缺帧保留原动画
          const ok = u.pet ? !!playFx(this, 'fx_pet_hit_pink', tv.cx, tv.cy)
            : u.summon && (u.id === 'summon_skeleton' || u.id === 'summon_corpse' || u.id === 'summon_golden_skeleton') ? !!playFx(this, 'fx_skeleton_claw', fx0, sv.cy - 10, { flip: dir < 0 })
            : u.summon && u.id === 'summon_beast' ? !!playFx(this, 'fx_beast_bite', tv.cx, tv.cy) : false;
          if (!ok) fx.slash(this, fx0, sv.cy - 10, sv.h, dir);
        }
      } else if (e.type === 'damage') {
        const v = this.views.get(e.target); if (!v) continue;
        const y = v.cy - v.h * 0.15;
        if (e.heal) { fx.floatNumber(this, v.cx, y, v.h, '+' + e.amount, FX.healColor, 0.8); continue; }
        playCombatAnim(e, uid => this.views.get(uid)); // 受击动作（主角/怪物/召唤物同一套）
        if (v.unit.summon) (v as CardView).showPose?.(v.unit.id + '_hurt', 220);
        if (e.dot) { fx.floatNumber(this, v.cx + 20, y, v.h, '-' + e.amount, '#5aff3a', 0.7); continue; }
        if (!playFx(this, 'fx_common_hitspark', v.cx, v.cy)) fx.hitSpark(this, v.cx, v.cy);
        fx.floatNumber(this, v.cx, y, v.h, '-' + e.amount + (e.crit ? '!' : ''), e.crit ? '#ff5a1a' : FX.dmgColor, e.crit ? FX.critScale : 1);
        if (e.crit && !FxQuality.low) this.cameras.main.shake(80, 0.003);
        if (e.source !== undefined) this.sfx(v.unit.isHero ? 'hit_hero' : e.crit ? 'swing_crit' : 'hit', 0.35);
      } else if (e.type === 'charm') {
        const v = this.views.get(e.uid); if (!v) continue;
        const t = { ok: ['诱惑成功', '#ff9ad5'], fail: ['诱惑失败', '#cccccc'], immune: ['免疫', '#cccccc'], high: ['诱惑失败', '#cccccc'], betray: ['叛变', '#ff5a5a'] }[e.result];
        fx.floatNumber(this, v.cx, v.cy - v.h * 0.3, v.h, t[0], t[1], 0.7); v.sync();
      } else if (e.type === 'death') {
        const v = this.views.get(e.uid); if (!v) continue;
        this.views.delete(e.uid);
        if (!v.unit.isHero) this.sfx(v.unit.deathSfx ?? 'death');
        this.dropOrigin.set(e.uid, { x: v.cx, y: v.cy, h: v.h, w: v.w });
        v.die(() => {});
        if (v.unit.isHero) this.heroDied();
        if (v.unit.summon) this.log(`${v.unit.pet ? v.unit.name : '骷髅战士'}倒下了`);
      } else if (e.type === 'drop') {
        const o = this.dropOrigin.get(e.uid) ?? { x: e.x, y: GROUND_Y + e.y - 100, h: 180, w: 130 };
        e.items.forEach(g => this.throwDrop(g, o));
      } else if (e.type === 'pickup') {
        // 拾取：图标飞向屏幕下方背包按钮后消失，光柱/名字立即移除
        const objs = this.groundObjs.get(e.gid) ?? []; this.groundObjs.delete(e.gid);
        const [icon, ...rest] = objs; rest.forEach(o => o.destroy());
        if (icon && (icon as any).x !== undefined) {
          const cam = this.cameras.main; this.tweens.killTweensOf(icon); (icon as any).setDepth(95);
          this.tweens.add({ targets: icon, x: cam.scrollX + (this.hud?.bagPos.x ?? 815), y: cam.scrollY + (this.hud?.bagPos.y ?? 640), scale: (icon as any).scale * 0.4, alpha: 0.6, duration: 420, ease: 'Cubic.easeIn', onComplete: () => icon.destroy() });
        }
        this.sfx(e.item === 'gold' ? 'coin' : 'loot', 0.5); this.log(`获得 ${e.name}`, true);
      } else if (e.type === 'aggro') this.views.get(e.uid)?.alert(WORLD.alertSec);
      else if (e.type === 'leap') this.views.get(e.uid)?.leap(WORLD.leapSec * 1000);
      else if (e.type === 'leash') { const v = this.views.get(e.uid); if (v) fx.floatNumber(this, v.cx, v.cy - v.h * 0.3, v.h, '脱离战斗', FX.statusColor, 0.6); }
      else if (e.type === 'floor') { this.enterFloor(e.index, e.name); this.gateLabel?.setText(`回${this.world.returnTownName().replace(/（.*）/, '')}${IS_MOBILE ? '' : ' [S]'}`); }
      else if (e.type === 'town') this.buildStreet(e.id);
      else if (e.type === 'cleared') this.log('首领已被击败！出口已开启，向右前往下一层');
      else if (e.type === 'win') this.end();
      else if (e.type === 'exp') { this.expTotal += e.amount; this.log(`获得 经验 ${fmtExp(e.amount)}`, true); }
      else if (e.type === 'learned') { this.skillsDirty = true; this.saveGame(); this.registry.set('fxLearned', [...this.world.learned]); }
      else if (e.type === 'proc') { const v = this.views.get(e.target); if (v) { if (e.skill === 'slaying') playFx(this, 'fx_slaying_proc', v.cx, v.cy); else playFx(this, 'fx_passive_glint', v.cx, v.y, { tint: e.skill === 'spirit_force' ? 0xc0f070 : 0xffd080, decorative: true }); } }
      else if (e.type === 'levelup') {
        this.sfx('levelup'); this.log(`等级提升到 ${e.level}！属性提升`, true);
        const hv = this.world.hero && this.views.get(this.world.hero.uid);
        if (hv) { fx.holyLight(this, hv.cx, hv.cy, hv.h); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.4, hv.h, 'LEVEL UP', '#ffe680', 1); }
        this.saveGame();
      } else if (e.type === 'summon') {
        const u = this.world.units.find(x => x.uid === e.uid);
        if (u && !this.views.has(u.uid)) { const v = new CardView(this, u); v.setAlpha(0); this.tweens.add({ targets: v, alpha: 1, duration: 400 }); this.views.set(u.uid, v); this.sfx('summon2'); }
      } else if (e.type === 'respawn') this.onRespawn();
      else if (e.type === 'combo') this.comboFx(e);
      else if (e.type === 'inventory') { this.refreshHeroLook(); if (this.ui?.panel?.open) this.ui.panel.render(); }
      else if (e.type === 'log') this.log(e.text, e.color === 'green');
      else if (e.type === 'bossfx') this.bossFx(e);
    }
  }
  /** 合击版 A4/A6：合击占位表现（fx_combo_<id> 素材未到 → Graphics 金色冲击环 + 飘字，不报错） */
  comboFx(e: Extract<BattleEvent, { type: 'combo' }>) {
    const t = this.views.get(e.target), a = this.views.get(e.source), b = this.views.get(e.partner); this.sfx('swing_crit', 0.6);
    a?.windup?.(a.unit.facing); b?.swing?.(b.unit.facing);
    if (!t) return;
    this.comboStatus.start(e.id, e.target, e.affected, e.statusUntil, this.world.time);
    if (!playFx(this, 'fx_combo_' + e.id, t.cx, t.cy)) {
    const g = this.add.graphics().setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(10, 0xffc040, 0.9).strokeCircle(t.cx, t.cy, 40); g.fillStyle(0xff8020, 0.35).fillCircle(t.cx, t.cy, 60);
    this.tweens.add({ targets: g, scale: { from: 0.4, to: 1.4 }, alpha: { from: 1, to: 0 }, duration: 600, onComplete: () => g.destroy() });
    }
    fx.floatNumber(this, t.cx, t.cy - t.h * 0.5, t.h, e.name, '#ffd24a', 1.1);
    if (!FxQuality.low) this.cameras.main.shake(160, 0.006);
  }
  /** 合击持续状态（噬魂沼泽/末日审判循环段、劈星斩麻痹标记）；句柄生命周期见 ui/comboStatus.ts */
  comboStatus = new ComboStatusTracker((id, u) => this.makeComboStatus(id, u));
  private loopAnim(id: string): string | null {
    const k = 'fx_combo_' + id, a = k + '_loop', d = COMBO_STATUS[id];
    if (this.anims.exists(a)) return a;
    if (!d.loopFrames || !this.textures.exists(k)) return null;
    const names = this.textures.get(k).getFrameNames().filter(n => n.startsWith(k + '_')).sort().slice(d.loopFrames[0], d.loopFrames[1] + 1);
    if (!names.length) return null;
    this.anims.create({ key: a, frames: names.map(frame => ({ key: k, frame })), frameRate: 12, repeat: -1, yoyo: true }); // 素材无独立循环段：取尾帧往返循环
    return a;
  }
  private makeComboStatus(id: string, u0: { uid: number }): { update(u: { uid: number }): void; destroy(): void } | null {
    const v0 = this.views.get(u0.uid); if (!v0) return null;
    const a = this.loopAnim(id), d = COMBO_STATUS[id], objs: Phaser.GameObjects.GameObject[] = [];
    let place: (cx: number, cy: number, h: number) => void;
    if (d.kind === 'loop') {
      let o: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;
      if (a) o = this.add.sprite(v0.cx, v0.cy, 'fx_combo_' + id).play(a).setBlendMode(Phaser.BlendModes.ADD);
      else o = this.add.ellipse(v0.cx, v0.cy, id === 'shihun' ? 500 : 220, id === 'shihun' ? 60 : 220, id === 'shihun' ? 0x40ff60 : 0xa040ff, 0.3).setBlendMode(Phaser.BlendModes.ADD);
      o.setDepth(id === 'shihun' ? 30 : 56).setAlpha(0);
      this.tweens.add({ targets: o, alpha: 0.85, duration: 200 });
      objs.push(o); place = (cx, cy) => o.setPosition(cx, cy);
    } else {
      const arc = a ? this.add.sprite(v0.cx, v0.cy, 'fx_combo_pixing').play(a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0.8).setDepth(57) : null;
      const tag = this.add.text(v0.cx, 0, '⚡麻痹', { fontFamily: FONT, fontSize: '18px', color: '#ffe84a', fontStyle: 'bold', stroke: '#2a1a60', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(62);
      this.tweens.add({ targets: tag, alpha: { from: 1, to: 0.55 }, duration: 300, yoyo: true, repeat: -1 });
      if (arc) objs.push(arc); objs.push(tag);
      place = (cx, cy, h) => { arc?.setPosition(cx, cy); tag.setPosition(cx, cy - h / 2 - 6); };
    }
    objs.forEach(o => o.setName('comboStatus_' + id));
    return {
      update: u => { const v = this.views.get(u.uid); if (v) place(v.cx, v.cy, v.h); },
      destroy: () => objs.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); }),
    };
  }
  /** R13 官方 BOSS 机制表现：沃玛电火花、祖玛火球、赤月地刺预警/冒刺、发呆/狂暴/瞬移/召唤提示（1× 简易图形） */
  bossFx(e: Extract<BattleEvent, { type: 'bossfx' }>) {
    const v = this.views.get(e.uid), t = e.target !== undefined ? this.views.get(e.target) : undefined;
    const hv = this.world.hero ? this.views.get(this.world.hero.uid) : undefined, gy = hv ? hv.y : GROUND_Y;
    const tip = (txt: string, c: string) => v && fx.floatNumber(this, v.cx, v.cy - v.h * 0.35, v.h, txt, c, 0.8);
    switch (e.kind) {
      case 'spark': if (v && t) { const dir = t.x >= v.x ? 1 : -1; v.swing(dir); v.lunge(dir, 18); fx.lightning(this, t.cx, t.cy - 220, t.cy); } break;
      case 'fireball': if (v && t) { const dir = t.x >= v.x ? 1 : -1; v.swing(dir); fx.projectile(this, v.cx + dir * 30, v.cy - 20, t.cx, t.cy, 'fire', () => fx.explosion(this, t.cx, t.cy, t.h * 0.3)); } break;
      case 'spike_warn': {
        const g = this.add.ellipse(e.x, gy, 120, 30, 0xff2020, 0.35).setStrokeStyle(2, 0xff5050).setDepth(8);
        this.tweens.add({ targets: g, alpha: 0.9, duration: 200, yoyo: true, repeat: 1, onComplete: () => g.destroy() }); break;
      }
      case 'spike': {
        const g = this.add.graphics().setDepth(57); g.fillStyle(0x8a1010, 1);
        for (let i = -2; i <= 2; i++) g.fillTriangle(e.x + i * 22 - 9, gy, e.x + i * 22 + 9, gy, e.x + i * 22, gy - 70 + Math.abs(i) * 14);
        g.setScale(1, 0.1); g.y = gy * 0.9;
        this.tweens.add({ targets: g, scaleY: 1, y: 0, duration: 120, onComplete: () => this.tweens.add({ targets: g, alpha: 0, delay: 250, duration: 250, onComplete: () => g.destroy() }) });
        if (!FxQuality.low) this.cameras.main.shake(80, 0.003); break;
      }
      case 'daze': tip('发呆', '#c0c0c0'); break;
      case 'crazy': tip('狂暴！', '#ff4040'); break;
      case 'fly': tip('飞！', '#ffd080'); break;
      case 'call': tip('召唤', '#ffd080'); break;
    }
  }
  useNext = false; fading = false; portalHint!: Phaser.GameObjects.Text;
  /** 传送门：在出口处按空格 → 黑屏淡出 → 切层（新楼层再淡入） */
  /** 当前位置可触发的入口（手机「进入」大键按此显示文字并执行）：右端出口 / 左端回城或上一层 / 城内门面与城门 */
  entranceHere(): 'talk' | 'gate' | 'exit' | 'sealed' | 'town' | 'prev' | 'mine' | null {
    const w = this.world; if (w.town) return w.atTownGate() ? 'gate' : w.nearDoor() ? 'talk' : null;
    if (w.atExit) return w.floor.boss && w.alive('enemy').some(u => u.tier === 'boss') ? 'sealed' : 'exit';
    if (w.atReturnGate()) return w.floorIndex === 0 || REGIONS.some(r => r.floors[0] === w.floorIndex) ? 'town' : 'prev';
    if (w.atMine()) return 'mine'; // 阶段4 挖矿点
    return null;
  }
  /** 手机「进入」键 / 点传送门本体：覆盖桌面 W/空格/T/S 的全部入口（docs/mobile-ui.md 入口对照表） */
  mobileAct(src: 'key' | 'portal' = 'key') {
    if (this.state !== 'play' || this.paused) return; const e = this.entranceHere();
    if (src === 'portal' && e !== 'exit' && e !== 'sealed') { this.log('走到传送门前再点'); return; }
    if (e === 'talk' || e === 'gate' || this.world.town) return this.townUse();
    if (e === 'exit' || e === 'sealed') return this.usePortal();
    if (e === 'town' || e === 'prev') return this.onKey('S');
    if (e === 'mine') { this.log(this.world.startMine()); this.handle(this.world.drainEvents()); return; }
    this.log('走到右端传送门进入下一层，或走到左端入口回城/返回上一层；顶栏「回城」可用回城卷');
  }
  usePortal() {
    const w = this.world; if (!w.atExit || this.fading) return;
    if (w.floor.boss && w.alive('enemy').some(u => u.tier === 'boss')) { this.useNext = true; return; }
    this.fading = true; this.sfx('summon', 0.4);
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.useNext = true; this.fading = false; });
  }
  heroDied() {
    if (this.state !== 'play') return;
    this.state = 'dead'; this.ui?.panel?.close();
    const ui = this.scene.get('UI');
    const dim = ui.add.rectangle(640, 300, 1280, 600, 0x300000, 0.5).setDepth(99);
    const t = ui.add.text(640, 260, '你 已 阵 亡', { fontFamily: FONT, fontSize: '64px', color: '#ff4444', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(100);
    const t2 = ui.add.text(640, 330, `3 秒后在本层起点复活（损失 ${Math.round(WORLD.deathGoldLoss * 100)}% 金币）`, { fontFamily: FONT, fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);
    this.overlay = [dim, t, t2];
    this.time.delayedCall(3000, () => { this.world.respawn(); this.handle(this.world.drainEvents()); });
  }
  /** 装备上身：主角卡立绘按当前衣服/武器刷新（懒加载层图） */
  refreshHeroLook() { const h = this.world.hero; const v = h && this.views.get(h.uid); v?.refreshEquip(this.world.cls, this.world.equip); }
  onRespawn() {
    this.overlay.forEach(o => o.destroy()); this.overlay = [];
    const h = this.world.hero!; const v = new CardView(this, h); this.views.set(h.uid, v); this.refreshHeroLook();
    this.cameras.main.startFollow(v, true, 0.12, 0.12, 0, 120).setDeadzone(320, 720); this.cameras.main.fadeIn(500);
    this.state = 'play'; this.sfx('heal'); this.log('你在本层起点复活了'); this.saveGame();
  }
  /** 进入新一层：淡入，换背景，清掉旧怪物与地上物品，刷新本层怪物；角色/召唤物保留 */
  enterFloor(i: number, name: string) {
    this.clearStreet();
    for (const [uid, v] of [...this.views]) if (!v.unit.isHero && !((v.unit.summon || v.unit.companion) && this.world.units.includes(v.unit))) { v.destroy(); this.views.delete(uid); }
    this.groundObjs.forEach(os => os.forEach(o => o.destroy())); this.groundObjs.clear();
    this.floorUids = this.world.alive('enemy').map(u => u.uid);
    for (const u of this.world.alive('enemy')) this.views.set(u.uid, new CardView(this, u));
    const s = this.world.summon; if (s) { const v = this.views.get(s.uid); if (v) v.x = s.x; }
    const bg = this.world.floor.bg && this.textures.exists(this.world.floor.bg) ? this.world.floor.bg : 'bg';
    this.bgImgs.forEach(b => b.setTexture(bg).setDisplaySize(1280, 720));
    // R10：本层背景未到 → 到了自动替换；下一层资源插队预加载
    const want = this.world.floor.bg;
    // 回退图 bg 自身也可能尚未加载（后台队列按层排序，新层多时 bg 排在后面）→ 先显示 __MISSING，bg 到了也要补上
    if (want && bg !== want) { const on = (k: string) => { if (this.world.floor.bg !== want) return; if (k === want) { this.textures.off('addtexture', on); this.bgImgs.forEach(b => b.setTexture(want).setDisplaySize(1280, 720)); } else if (k === 'bg' && this.bgImgs[0]?.texture.key === '__MISSING') this.bgImgs.forEach(b => b.setTexture('bg').setDisplaySize(1280, 720)); }; this.textures.on('addtexture', on); this.events.once('shutdown', () => this.textures.off('addtexture', on)); }
    (this.scene.get('Preload') as PreloadScene | undefined)?.prioritize?.([...(this.textures.exists('bg') ? [] : ['bg']), ...floorKeys(this.world.floor), ...floorKeys(this.world.floors[nextFloorOf(this.world.floorIndex, this.world.floors)])]);
    this.applyFloorWidth();
    this.hud?.setFloor(name, this.floorIcons());
    this.log(`进入 第 ${i + 1} 层 · ${name}（首领在地图尽头）`);
    this.cameras.main.centerOn(WORLD.heroStartX, 360); this.cameras.main.fadeIn(700, 0, 0, 0);
    const hv = this.world.hero && this.views.get(this.world.hero.uid); if (hv) hv.x = this.world.hero!.x;
    if (i > 0) this.sfx('summon', 0.4);
    playMusic(this, 'floor' + Math.min(5, i + 1)); this.bossMusic = false;
    this.saveGame();
  }

  /** 掉落物：从死亡位置抛物线弹出 → 落在地上弹一下 → 稀有度光柱 + 图标 + 名称 */
  throwDrop(g: GroundItem, o: { x: number; y: number; h: number }) {
    const S = FX.dropIconSize, tx = g.x, ty = GROUND_Y + g.y + 4;
    const icon = this.textures.exists('item_' + g.item) ? this.add.image(o.x, o.y, 'item_' + g.item).setDisplaySize(S, S) : this.add.rectangle(o.x, o.y, S, S, 0xffcc33);
    icon.setDepth(60);
    const objs: Phaser.GameObjects.GameObject[] = [icon]; this.groundObjs.set(g.gid, objs);
    const peak = Math.min(o.y, ty) - o.h * FX.dropArcRatio, ms = WORLD.dropLandSec * 1000;
    this.tweens.addCounter({ from: 0, to: 1, duration: ms, onUpdate: tw => {
      const t = tw.getValue() ?? 0;
      icon.x = o.x + (tx - o.x) * t;
      icon.y = (1 - t) * (1 - t) * o.y + 2 * (1 - t) * t * (2 * peak - (o.y + ty) / 2) + t * t * (ty - S / 2);
    }, onComplete: () => {
      if (!this.groundObjs.has(g.gid)) return;
      icon.setDepth(5 + g.y / 1000);
      // 落地弹两下（第二下更低）
      this.tweens.chain({ targets: icon, tweens: [
        { y: ty - S / 2 - FX.dropBounce * 2, duration: 120, ease: 'Quad.easeOut' }, { y: ty - S / 2, duration: 120, ease: 'Quad.easeIn' },
        { y: ty - S / 2 - FX.dropBounce * 0.7, duration: 80, ease: 'Quad.easeOut' }, { y: ty - S / 2, duration: 80, ease: 'Quad.easeIn' }] });
      const color = RARITY_COLOR[g.rarity], PH = PILLAR_H[g.rarity];
      const p = this.add.graphics().setDepth(4.9);
      p.setPosition(tx, ty);
      p.setBlendMode(Phaser.BlendModes.ADD);
      p.fillGradientStyle(color, color, color, color, 0, 0, 0.4, 0.4); p.fillRect(-8, -PH, 16, PH);
      p.fillGradientStyle(0xffffff, 0xffffff, color, color, 0, 0, 0.95, 0.95); p.fillRect(-2, -PH, 4, PH);
      p.fillStyle(color, 0.35).fillEllipse(0, 0, 40, 10);
      p.setScale(1, 0.05); this.tweens.add({ targets: p, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
      this.tweens.add({ targets: p, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
      const label = this.add.text(tx, ty - S - 4, g.name, { fontFamily: FONT, fontSize: g.rarity === 'rare' ? '14px' : '12px', fontStyle: 'bold', color: RARITY_TEXT[g.rarity], stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5);
      objs.push(p, label);
    } });
  }
  /** 渲染层错位：同一侧排队的怪物逻辑上可重叠，显示时依次向后错开，避免卡牌完全叠在一起 */
  layoutQueue() {
    const h = this.world.hero;
    this.views.forEach(v => (v.dispOff = 0));
    if (!h) return;
    // 召唤物与主角重叠时，显示在主角身后（略高一点），避免被主角卡牌完全遮住
    const sm = this.world.summon, sv = sm && this.views.get(sm.uid);
    if (sm && sv) { const gap = sm.x - h.x, want = -h.facing * 115; if (Math.abs(gap) < 115) sv.dispOff = want - gap; }
    for (const side of [1, -1]) {
      const q = this.world.alive('enemy').filter(e => Math.sign(e.x - h.x) === side && (e.ai !== 'idle' || Math.abs(e.x - h.x) < 700)).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x));
      let edge = -Infinity;
      for (const e of q) {
        // 仅怪物之间做视觉错开；主角可与怪重叠/穿过（主角卡绘制在上层）
        const d = Math.abs(e.x - h.x), want = Math.max(d, edge);
        const v = this.views.get(e.uid); if (v) v.dispOff = side * (want - d);
        edge = want + e.width * WORLD.visualSpacing;
      }
    }
  }

  /** 点按移动一格（键盘与虚拟方向键共用）；同帧多次按以最后一次为准，World 内再做 1 次排队 */
  hold = new HoldKeys();
  stepKey(d: number) { if (this.state === 'play' && !this.paused) this.world.queueStep(d); }
  /** 自动技能：按 Settings.autoSkills（或职业推荐）优先级尝试释放；失败静默；手动按键走 onKey 优先占冷却 */
  lastAuto = ''; autoCount: Record<string, number> = {};
  tryAutoSkills() {
    if (!Settings.autoAttack) return;
    const h = this.world.hero; if (!h?.alive) return;
    const a = this.world.autoCast(Settings.skillsFor(this.world.cls), this.cds, this.lastAuto); if (!a) return;
    const r = a.r; this.lastAuto = a.id; this.autoCount[a.id] = (this.autoCount[a.id] ?? 0) + 1;
    {
      const evs = this.world.drainEvents();
      const hv = this.views.get(h.uid);
      if (hv) { hv.windup(h.facing); this.time.delayedCall(FX.windupMs, () => this.skillFx(r.skill, hv, r.targets, evs)); }
      else this.handle(evs);
      return;
    }
  }
  /** 存活怪物都要有卡牌：练级图（farm）刷新怪、号角召出的怪等不发 summon 事件，逐帧补建缺失视图，避免「看不到的怪在攻击我」 */
  ensureFoeViews() {
    for (const u of foesWithoutView(this.world, uid => this.views.has(uid))) { const v = new CardView(this, u); v.x = u.x; v.setAlpha(0); this.tweens.add({ targets: v, alpha: 1, duration: 400 }); this.views.set(u.uid, v); }
  }
  update(time: number, dms: number) {
    if (this.mineNode?.visible || this.world.hasMine()) this.syncMine();
    const dt = Math.min(0.05, dms / 1000), k = this.keys;
    if (this.skillsDirty && !this.paused) { this.skillsDirty = false; this.cds = this.world.skills.map(() => 0); this.scene.stop('UI'); this.scene.launch('UI'); }
    if (this.state !== 'win' && !this.paused) {
      const pad = this.ui?.pad;
      let dx = this.state === 'play' ? (this.hold.dir(performance.now()) || (pad?.dx ?? 0)) : 0;
      if (dx) this.townTarget = null;
      else if (this.townTarget && this.world.town && this.world.hero) { const d = this.townTarget.x - this.world.hero.x; if (Math.abs(d) < 12) { const t = this.townTarget; this.townTarget = null; this.townArrive(t.id); } else dx = Math.sign(d); }
      const dy = this.state === 'play' ? Math.sign((k.DOWN.isDown ? 1 : 0) - (k.UP.isDown ? 1 : 0) + (pad?.dy ?? 0)) : 0;
      if (this.state === 'play') this.tryAutoSkills();
      this.world.step(dt, { dx, dy, use: this.useNext, autoAttack: Settings.autoAttack }); this.useNext = false;
      this.cds = this.cds.map(c => Math.max(0, c - dt));
      this.saveT += dt; if (this.saveT > 15) { this.saveT = 0; this.saveGame(); }
    }
    this.handle(this.world.drainEvents());
    this.ensureFoeViews();
    this.layoutQueue();
    this.comboStatus.sync(this.world.time, uid => this.views.get(uid)?.unit);
    this.views.forEach(v => { v.sync(); v.anim(time); v.setDepth(10 + v.unit.y / 1000 + (v.unit.isHero ? 0.0005 : 0)); });
    this.updateStreet();
    this.portal.setAlpha(!this.world.cleared ? 0.35 : 1);
    this.portalHint?.setVisible(this.world.atExit && this.state === 'play' && !(this.world.floor.boss && this.world.alive('enemy').some(u => u.tier === 'boss')));
    this.hud?.setExp(this.world.level, this.world.exp, this.world.expNext);
    // 接近首领时切换首领战音乐，击败后回到本层音乐
    const boss = this.world.alive('enemy').find(e => e.tier === 'boss'), hh = this.world.hero;
    const nearBoss = !!boss && !!hh && Math.abs(boss.x - hh.x) < 900;
    if (nearBoss !== this.bossMusic && this.state !== 'win') { this.bossMusic = nearBoss; playMusic(this, nearBoss ? 'boss' : 'floor' + Math.min(5, this.world.floorIndex + 1), 900); }
    const w = this.world, h = w.hero, st = w.stats();
    const dead = this.floorUids.map(id => !w.units.some(u => u.uid === id && u.alive));
    const pw = { atk: '攻击', mag: '魔法', tao: '道术' }[w.classDef.autoStat];
    const info = `${w.classDef.name} Lv${w.level}   经验 ${fmtExp(w.exp)}/${fmtExp(w.expNext)}   金币 ${w.gold}   ${pw} ${st[w.classDef.autoStat]}  防御 ${Math.round(st.def)}   第 ${floorNo(w.floorIndex, w.floors)}/${w.floors.length} 层`;
    this.hud?.update(dt, h?.hp ?? 0, h?.maxHp ?? st.hp, h?.mp ?? 0, h?.maxMp ?? st.mp, this.cds, dead, w.pots, info);
  }
  end() {
    if (this.state === 'win') return; this.state = 'win'; this.cameras.main.fadeIn(500, 0, 0, 0); SaveStore.clear(); playMusic(this, 'title'); this.ui?.panel?.close();
    const ui = this.scene.get('UI'), w = this.world;
    const t = (y: number, str: string, size: number, color: string) => ui.add.text(640, y, str, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(100);
    ui.add.rectangle(640, 300, 1280, 600, 0x000000, 0.55).setDepth(99);
    t(230, '通 关 ！', 72, '#ffd700');
    t(310, `${CLASSES[w.cls].name} Lv${w.level}  通关 ${w.floors.length} 层   击杀 ${w.kills}   死亡 ${w.deaths}   金币 ${w.gold}`, 22, '#ffe8a0');
    t(370, '按 空格 返回标题' + (this.ui?.pad ? '（或点击屏幕）' : ''), 24, '#fff');
    if (this.ui?.pad) ui.input.once('pointerdown', () => this.onKey(' '));
  }
}
export type { Unit };
