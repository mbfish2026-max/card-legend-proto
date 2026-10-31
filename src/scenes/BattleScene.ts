import Phaser from 'phaser';
import { IS_MOBILE } from '../mobile';
import { StepGate, stepDir } from '../input/stepKeys';
import { World, SaveData } from '../combat/World';
import { BattleEvent, GroundItem, Unit } from '../combat/types';
import { POTIONS } from '../data/skills';
import { FX, FONT, GROUND_Y } from '../data/fx';
import { WORLD, FLOORS } from '../data/world';
import { ClassId, CLASSES } from '../data/classes';
import { CardView } from '../ui/CardView';
import { Hud } from '../ui/Hud';
import { PanelMode } from '../ui/Panel';
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
  get paused() { return !!this.ui?.panel?.open; }

  create(data: { cls?: ClassId; save?: SaveData }) {
    Settings.load(); Settings.apply(this.sound);
    this.views.clear(); this.groundObjs.clear(); this.hud = undefined; this.pendingLogs = []; this.overlay = [];
    this.state = 'play'; this.expTotal = 0; this.saveT = 0;
    const qs = new URLSearchParams(location.search), W = WORLD.mapWidth;
    // 横版地图：本层背景分段拼接（交替镜像）
    this.bgImgs = [];
    for (let x = 0; x < W; x += 1280) this.bgImgs.push(this.add.image(x + 640, 300, 'bg').setDisplaySize(1280, 720).setFlipX((x / 1280) % 2 === 1).setTint(0xa0a0a0).setScrollFactor(0.7));
    // 多层视差：远景 0.7，前景暗色岩石剪影 1.25 + 漂浮尘埃 + 屏幕暗角
    const fg = this.add.graphics().setDepth(40).setScrollFactor(1.25);
    for (let x = 0; x < W * 1.3; x += 140 + ((x * 7919) % 170)) { const h = 40 + ((x * 31) % 70); fg.fillStyle(0x060405, 0.95).fillTriangle(x - 26, 0, x + 26, 0, x + ((x % 3) - 1) * 6, h); fg.fillStyle(0x060405, 0.9).fillTriangle(x + 18, 0, x + 40, 0, x + 30, h * 0.55); }
    fg.fillStyle(0x060405, 0.95).fillRect(0, 0, W * 1.3, 8);
    this.add.particles(0, 0, '__WHITE', { x: { min: 0, max: W }, y: { min: 80, max: 560 }, speedX: { min: -8, max: 8 }, speedY: { min: -12, max: -3 }, lifespan: 6000, scale: { start: 1.6, end: 0 }, alpha: { start: 0.35, end: 0 }, frequency: 90, tint: 0xffe0b0 }).setDepth(39);
    const vg = this.add.graphics().setScrollFactor(0).setDepth(38);
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.55, 0.55, 0, 0).fillRect(0, 0, 1280, 110);
    vg.fillGradientStyle(0x000000, 0, 0x000000, 0, 0.5, 0, 0.5, 0).fillRect(0, 0, 140, 720);
    vg.fillGradientStyle(0, 0x000000, 0, 0x000000, 0, 0.5, 0, 0.5).fillRect(1140, 0, 140, 720);
    this.add.rectangle(W / 2, GROUND_Y + 10, W, 90, 0x000000, 0.25);
    this.add.rectangle(6, 300, 12, 600, 0x000000, 0.8); this.add.rectangle(W - 6, 300, 12, 600, 0x000000, 0.8);
    const lv = Number(qs.get('lv')) || 1;
    this.world = new World(Math.random, lv, FLOORS, data?.cls ?? 'warrior', data?.save);
    this.world.requireUse = true;
    this.cds = this.world.skills.map(() => 0);
    this.buildPortal(this.world.exitX); this.buildMerchant();
    const h = this.world.hero!;
    this.views.set(h.uid, new CardView(this, h));
    this.cameras.main.setBounds(0, 0, W, 720).startFollow(this.views.get(h.uid)!, true, 0.12, 0.12, 0, 120).setDeadzone(320, 720);
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D') as any;
    // F1~F4 技能：阻止浏览器默认行为（F1 帮助等）；不占用 F5 等其它功能键
    // 左右一格：window 原生 keydown 直接入队（不依赖 repeat 标志 / keyup / Phaser JustDown，兼容远程控制）
    const gate = new StepGate(150);
    const onWinKey = (e: KeyboardEvent) => {
      const d = stepDir(e); if (!d) return;
      e.preventDefault(); if (gate.accept(e, performance.now())) this.stepKey(d);
    };
    window.addEventListener('keydown', onWinKey, true);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onWinKey, true));
    // 其它键（F1~F4 技能等）：阻止 F1 帮助等默认行为；不占用 F5 等其它功能键
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (stepDir(e)) return; if (/^F[1-4]$/.test(e.key)) e.preventDefault(); this.onKey(e.key.toUpperCase()); });
    this.input.keyboard!.addCapture('F1,F2,F3,F4');
    // 失焦/切后台时清空按键状态，避免 keyup 丢失导致方向键"卡住"或失灵
    const reset = () => { gate.reset(); this.input.keyboard?.resetKeys(); this.ui?.pad?.reset?.(); };
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset); this.game.events.on('blur', reset);
    this.events.once('shutdown', () => { window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset); this.game.events.off('blur', reset); });
    this.handle(this.world.drainEvents());
    const sk = this.world.skills.map(s => `${s.key} ${s.name}`).join('  ');
    this.log(`${this.world.classDef.name}：${sk}`);
    this.log('本层起点有商人（按 T 交易）；B 打开背包');
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
    this.handle(w.drainEvents()); this.views.forEach(v => { v.x = v.unit.x; v.sync(); });
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
    this.portalHint = this.add.text(0, -235, IS_MOBILE ? '点「传送」进入' : '按 W/空格 进入', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a0a5a', strokeThickness: 5 }).setOrigin(0.5).setVisible(false);
    this.tweens.add({ targets: this.portalHint, y: -242, duration: 500, yoyo: true, repeat: -1 });
    c.add([arch, core, swirl, ...rings, motes, t, this.portalHint]); this.portal = c;
  }
  /** 商人：本层起点的小摊（背景层，不参与战斗） */
  buildMerchant() {
    const c = this.add.container(MERCHANT_X, GROUND_Y - 70).setDepth(5);
    const g = this.add.graphics();
    g.fillStyle(0x5a3a1a).fillRect(-60, -10, 120, 70); g.fillStyle(0x8a1010).fillTriangle(-75, -10, 75, -10, 0, -70);
    g.lineStyle(2, 0xd4a64a).strokeRect(-60, -10, 120, 70);
    c.add(g);
    if (this.textures.exists('merchant')) c.add(this.add.image(0, 22, 'merchant').setDisplaySize(52, 52));
    c.add(this.add.text(0, -92, '商人 [T]', { fontFamily: FONT, fontSize: '16px', color: '#ffe8a0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5));
    g.setInteractive(new Phaser.Geom.Rectangle(-75, -70, 150, 130), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.openPanel('shop'));
    this.merchant = c;
  }
  nearMerchant() { const h = this.world.hero; return !!h && h.x - MERCHANT_X < SHOP_RANGE; }
  openPanel(m: PanelMode) {
    if (this.state !== 'play') return;
    if (m === 'shop' && !this.nearMerchant() && !this.ui.panel.open) { this.log('商人在本层起点，请走回左侧商人处（T）'); return; }
    this.sfx('click'); this.ui.panel.toggle(m);
  }
  saveGame() { if (this.state !== 'win' && this.world.hero) SaveStore.write(this.world.toSave()); }
  toTitle() { this.saveGame(); this.scene.stop('UI'); this.scene.start('Title'); }

  onKey(k: string) {
    if (k === 'M') { Settings.muted = !Settings.muted; Settings.apply(this.sound); Settings.save(); this.log(Settings.muted ? '已静音' : '已取消静音'); return; }
    if (this.state === 'win') { if (k === ' ') { this.sfx('click'); this.toTitle(); } return; }
    if (k === 'ESCAPE') { if (this.paused) this.ui.panel.close(); else this.openPanel('settings'); return; }
    if (k === 'B' || k === 'C' || k === 'I') return this.openPanel('bag');
    if (k === 'T') return this.openPanel('shop');
    if (k === 'K') return this.openPanel('skills');
    if (this.paused || this.state !== 'play') return;
    if (k === ' ' || k === 'W') { this.usePortal(); return; }
    if (k === 'S') { if (!this.fading && this.world.hero && this.world.floorIndex > 0 && this.world.hero.x <= WORLD.heroStartX + 150) { this.fading = true; this.cameras.main.fadeOut(400, 0, 0, 0); this.cameras.main.once('camerafadeoutcomplete', () => { this.fading = false; this.world.prevFloor(); }); } else this.log('在本层起点按 S 返回上一层'); return; }
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
    const done = () => this.handle(evs), dir = hv.unit.facing;
    switch (skill) {
      case 'fire_sword': hv.lunge(dir, 34); if (tv[0]) fx.bloodBlade(this, tv[0].cx, tv[0].cy, tv[0].h); return done();
      case 'half_moon': if (tv.length) {
        const last = tv[tv.length - 1]; hv.lunge(dir, 20);
        fx.halfMoon(this, hv.cx + dir * hv.w / 2, last.cx + dir * 40, tv[0].cy, Math.max(...tv.map(v => v.h)));
        tv.forEach(v => fx.bloodBlade(this, v.cx, v.cy, v.h * 0.7, FX.halfMoonColor));
      } return done();
      case 'shadow_slash': hv.lunge(dir, 34); if (tv[0]) fx.shadowSlash(this, tv[0].cx, tv[0].cy, tv[0].h); return done();
      case 'battle_shout': fx.shieldAura(this, hv.cx, hv.cy, hv.h); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '金刚护体', FX.statusColor, 0.7); return done();
      case 'fireball': case 'soul_fire': if (tv[0]) {
        const t = tv[0];
        return fx.projectile(this, hv.cx + dir * hv.w * 0.4, hv.cy - 20, t.cx, t.cy, skill === 'fireball' ? 'fire' : 'talisman', () => {
          this.sfx('fireball_impact', 0.5); fx.explosion(this, t.cx, t.cy, t.h * 0.35, skill === 'fireball' ? 0xffdd55 : 0xfff2a0, skill === 'fireball' ? 0xff4400 : 0x3ac83a); done();
        });
      } return done();
      case 'thunder': if (tv[0]) { fx.lightning(this, tv[0].cx, tv[0].y - 600, tv[0].cy); if (!FxQuality.low) this.cameras.main.shake(120, 0.004); } return done();
      case 'ice_roar': fx.iceRoar(this, hv.cx, GROUND_Y + hv.unit.y - 10, sk?.range ?? 420); tv.forEach(v => fx.frostTint(v.art, (sk?.duration ?? 4) * 1000)); return done();
      case 'magic_shield': fx.magicShield(this, hv, hv.cy, hv.h, (sk?.duration ?? 12) * 1000); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '魔法盾', '#88ccff', 0.7); return done();
      case 'poison': if (tv[0]) { const t = tv[0]; return fx.projectile(this, hv.cx + dir * hv.w * 0.4, hv.cy - 20, t.cx, t.cy, 'poison', () => { fx.poisonCloud(this, t.cx, t.cy, t.h); done(); }); } return done();
      case 'summon_skeleton': { const x = hv.x - dir * 110; fx.summonCircle(this, x, GROUND_Y + WORLD.summonLane); return done(); }
      case 'holy_armor': fx.holyLight(this, hv.cx, hv.cy, hv.h); fx.shieldAura(this, hv.cx, hv.cy, hv.h); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.2, hv.h, '神圣战甲', '#ffe680', 0.7); return done();
      default: return done();
    }
  }

  handle(evs: BattleEvent[]) {
    for (const e of evs) {
      if (e.type === 'attack') {
        if (e.skill) continue;
        const sv = this.views.get(e.source), tv = this.views.get(e.target); if (!sv || !tv) continue;
        const dir = tv.x >= sv.x ? 1 : -1; sv.swing(dir); sv.lunge(dir, 18);
        if (sv.unit.isHero && this.world.cls !== 'warrior') fx.projectile(this, sv.cx + dir * 30, sv.cy - 20, tv.cx, tv.cy, this.world.cls === 'mage' ? 'fire' : 'talisman', () => fx.hitSpark(this, tv.cx, tv.cy));
        else fx.slash(this, sv.x + dir * (sv.w / 2 + 6), sv.cy - 10, sv.h, dir);
      } else if (e.type === 'damage') {
        const v = this.views.get(e.target); if (!v) continue;
        const y = v.cy - v.h * 0.15;
        if (e.heal) { fx.floatNumber(this, v.cx, y, v.h, '+' + e.amount, FX.healColor, 0.8); continue; }
        if (e.dot) { fx.floatNumber(this, v.cx + 20, y, v.h, '-' + e.amount, '#5aff3a', 0.7); v.hit(); continue; }
        v.hit(); fx.hitSpark(this, v.cx, v.cy);
        fx.floatNumber(this, v.cx, y, v.h, '-' + e.amount + (e.crit ? '!' : ''), e.crit ? '#ff5a1a' : FX.dmgColor, e.crit ? FX.critScale : 1);
        if (e.crit && !FxQuality.low) this.cameras.main.shake(80, 0.003);
        if (e.source !== undefined) this.sfx(v.unit.isHero ? 'hit_hero' : e.crit ? 'swing_crit' : 'hit', 0.35);
      } else if (e.type === 'death') {
        const v = this.views.get(e.uid); if (!v) continue;
        this.views.delete(e.uid);
        if (!v.unit.isHero) this.sfx(v.unit.deathSfx ?? 'death');
        this.dropOrigin.set(e.uid, { x: v.cx, y: v.cy, h: v.h, w: v.w });
        v.die(() => {});
        if (v.unit.isHero) this.heroDied();
        if (v.unit.summon) this.log('骷髅战士倒下了');
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
      else if (e.type === 'floor') this.enterFloor(e.index, e.name);
      else if (e.type === 'cleared') this.log('首领已被击败！出口已开启，向右前往下一层');
      else if (e.type === 'win') this.end();
      else if (e.type === 'exp') { this.expTotal += e.amount; this.log(`获得 经验 ${e.amount}`, true); }
      else if (e.type === 'levelup') {
        this.sfx('levelup'); this.log(`等级提升到 ${e.level}！属性提升`, true);
        const hv = this.world.hero && this.views.get(this.world.hero.uid);
        if (hv) { fx.holyLight(this, hv.cx, hv.cy, hv.h); fx.floatNumber(this, hv.cx, hv.cy - hv.h * 0.4, hv.h, 'LEVEL UP', '#ffe680', 1); }
        this.saveGame();
      } else if (e.type === 'summon') {
        const u = this.world.units.find(x => x.uid === e.uid);
        if (u && !this.views.has(u.uid)) { const v = new CardView(this, u); v.setAlpha(0); this.tweens.add({ targets: v, alpha: 1, duration: 400 }); this.views.set(u.uid, v); this.sfx('summon2'); }
      } else if (e.type === 'respawn') this.onRespawn();
      else if (e.type === 'inventory') { if (this.ui?.panel?.open) this.ui.panel.render(); }
      else if (e.type === 'log') this.log(e.text, e.color === 'green');
    }
  }
  useNext = false; fading = false; portalHint!: Phaser.GameObjects.Text;
  /** 传送门：在出口处按空格 → 黑屏淡出 → 切层（新楼层再淡入） */
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
  onRespawn() {
    this.overlay.forEach(o => o.destroy()); this.overlay = [];
    const h = this.world.hero!; const v = new CardView(this, h); this.views.set(h.uid, v);
    this.cameras.main.startFollow(v, true, 0.12, 0.12, 0, 120).setDeadzone(320, 720); this.cameras.main.fadeIn(500);
    this.state = 'play'; this.sfx('heal'); this.log('你在本层起点复活了'); this.saveGame();
  }
  /** 进入新一层：淡入，换背景，清掉旧怪物与地上物品，刷新本层怪物；角色/召唤物保留 */
  enterFloor(i: number, name: string) {
    for (const [uid, v] of [...this.views]) if (!v.unit.isHero && !(v.unit.summon && this.world.units.includes(v.unit))) { v.destroy(); this.views.delete(uid); }
    this.groundObjs.forEach(os => os.forEach(o => o.destroy())); this.groundObjs.clear();
    this.floorUids = this.world.alive('enemy').map(u => u.uid);
    for (const u of this.world.alive('enemy')) this.views.set(u.uid, new CardView(this, u));
    const s = this.world.summon; if (s) { const v = this.views.get(s.uid); if (v) v.x = s.x; }
    const bg = this.world.floor.bg && this.textures.exists(this.world.floor.bg) ? this.world.floor.bg : 'bg';
    this.bgImgs.forEach(b => b.setTexture(bg).setDisplaySize(1280, 720));
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
  stepKey(d: number) { if (this.state === 'play' && !this.paused) this.world.queueStep(d); }
  update(time: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000), k = this.keys;
    if (this.state !== 'win' && !this.paused) {
      const pad = this.ui?.pad;
      
      const dy = this.state === 'play' ? Math.sign((k.DOWN.isDown ? 1 : 0) - (k.UP.isDown ? 1 : 0) + (pad?.dy ?? 0)) : 0;
      this.world.step(dt, { dx: 0, dy, use: this.useNext }); this.useNext = false;
      this.cds = this.cds.map(c => Math.max(0, c - dt));
      this.saveT += dt; if (this.saveT > 15) { this.saveT = 0; this.saveGame(); }
    }
    this.handle(this.world.drainEvents());
    this.layoutQueue();
    this.views.forEach(v => { v.sync(); v.anim(time); v.setDepth(10 + v.unit.y / 1000 + (v.unit.isHero ? 0.0005 : 0)); });
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
    const info = `${w.classDef.name} Lv${w.level}   经验 ${w.exp}/${w.expNext}   金币 ${w.gold}   ${pw} ${st[w.classDef.autoStat]}  防御 ${Math.round(st.def)}   第 ${w.floorIndex + 1}/${w.floors.length} 层`;
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
