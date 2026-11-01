import { SET_SPECIALS } from '../data/eg-sets';
import { clampOff, visibleRange, dragOff, wheelOff, isTap, thumb } from './scrollList';
const NPC_VIS = 7;
import { COMPANION_MODE_NAME } from '../data/companion';
import { fmtInt, fmtText, bookEntry } from './fmt';
import { SKILL_BOOK_DROPS } from '../data/skillBookDrops';
import { COMPANION_UNLOCK_LEVEL, comboFor, BOOK_PAGE, BRM_BOOK, GOLD_BAR, PAGES_PER_BOOK, COMBO_LEVEL, heartFeedValue, RAGE_MAX, HEART_STORE_MAX, RECRUIT_DIALOG } from '../data/companion';
import { toLogic, toLogicX, MAX_LW, Render } from '../render';
import { frameBg, atlasReady, listRowPitch, rowHitHeight, viewCss, rowBg, scrollBar, slotBg, qualityFrame, slotHitSize, rowTint, SKILL_ROW_TINT, UI_SLICES , panelFrameName, MOBILE_TABS, MIN_TAP } from './uiSlices';
import { compareRows, diffText, CmpData } from './equipCompare';
import { shouldTapClose } from './tapClose';
import { RING_MIN_LEVEL, IDENT_PRICE, IDENT_MIN_LEVEL } from '../data/r14b';
import { fmtExp, scaledExp } from '../data/expCurve';
import Phaser from 'phaser';
import type { World } from '../combat/World';
import { EquipSlot, InvItem, Slot } from '../combat/types';
import { EQUIP_SLOTS, EQUIP_SLOT_NAMES, SLOT_NAMES, STAT_NAMES, ITEMS, SETS, ENHANCE_SLOTS, ENHANCE_MAX, IRON_PRICE } from '../data/items';
import { OIL_PRICE } from '../combat/World';
/** 阶段4：祝福油只由高级 BOSS 掉、黑铁矿只能挖矿 → 商店停售（保留代码便于回退） */
const SELL_OIL_IRON = false as boolean;
import { POTIONS } from '../data/skills';
import { BUNDLES, potIndex, potShopRows } from '../data/potions';
import { WORLD } from '../data/world';
import { CLASSES, CLASS_IDS } from '../data/classes';
export const BAG_PAGE = 30;
import { renderSettingsView } from './SettingsView';
import { sfx } from '../scenes/TitleScene';
import { txt, button, tabButton } from './mtext';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';
import { areaOf, WM_IDS, REGION_GEO } from '../data/worldmap';
import { renderWorldMap, newWMState, wmBack, type WMState } from './WorldMapView';
import { QUESTS, ACHIEVES } from '../data/quests';
import { ENEMIES } from '../data/units';
import { FLOORS, floorNo } from '../data/world';
import { World as WorldCls } from '../combat/World';
import { BOOKS } from '../data/books';
import { TOWNS, NODE_TOWN, STORAGE_SIZE, NPC_ART, npcArtOf } from '../data/towns';
import { CONSUMABLE } from '../data/items-town';
import { Settings, DEFAULT_AUTO_SKILLS } from '../settings';
import { equipLook } from './EquipLayers';

import { flushInput } from './flushInput';
export type PanelMode = 'bag' | 'shop' | 'skills' | 'settings' | 'map' | 'quests' | 'town';
export const RARITY_HEX: Record<string, string> = { common: '#ffffff', magic: '#5aa8ff', rare: '#ffb020' };
const RARITY_NUM: Record<string, number> = { common: 0x8a8a8a, magic: 0x3a7aff, rare: 0xffa020 };
const RARITY_CN: Record<string, string> = { common: '普通', magic: '精良', rare: '极品' };

/** 角色/背包/商店/技能/设置 面板（打开时战斗暂停） */
export class Panel {
  root?: Phaser.GameObjects.Container; tip?: Phaser.GameObjects.Container; mode: PanelMode | null = null; sel: string | null = null;
  /** 地图详情：选中的区域 id（null=世界总览） */
  region: string | null = null;
  /** 背包选中的黑铁矿石下标：下一次点装备栏即强化 */
  ironIdx: number | null = null;
  /** feat/potion-expand：桌面双击解包计时 */
  private bundleClick: { uid: number; t: number } | null = null;
  /** 背包分页（200 格，每页 BAG_PAGE 格） */
  bagPage = 0;
  /** 商店分页：杂货 / 书店（R11 技能书） */
  shopTab: 'goods' | 'books' = 'goods';
  onTeleport?: () => void;
  /** R14 城镇：当前选中的 NPC id */
  npc: string | null = null;
  constructor(public s: Phaser.Scene, public world: () => World, public onChange: (msg?: string, green?: boolean) => void, public onTitle: () => void) {
    // 手机版：对比面板打开时，点面板外空白处关闭（拖动 >8px、点面板内、点装备格不关）；桌面不挂
    s.input?.on('pointerdown', () => { this.lastDown = this.s.time.now; });
    if (IS_MOBILE) s.input?.on('pointerup', (p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => this.tapOutside({ downX: p.downX, downY: p.downY, upX: p.upX, upY: p.upY, x: p.worldX, y: p.worldY }, objs as any));
  }
  /** 返回是否关闭（供测试） */
  tapOutside(p: { downX: number; downY: number; upX: number; upY: number; x: number; y: number }, objs: { getData?: (k: string) => unknown }[] = []): boolean {
    const t = this.tip; if (!t || !this.sel) return false;
    const b = t.getBounds(), insidePanel = b.contains(p.x, p.y), onSlot = objs.some(o => !!o.getData?.('slot'));
    if (!shouldTapClose({ downX: p.downX, downY: p.downY, upX: p.upX, upY: p.upY, insidePanel, onSlot }, IS_MOBILE, true)) return false;
    this.sel = null; this.hideTip(); this.render(); return true;
  }
  /** 长街门口进店：打开该 NPC 的商店/功能界面 */
  openNpc(id: string) { this.mode = 'town'; this.npc = id; this.sel = null; this.region = null; this.render(); }
  get open() { return this.mode !== null; }
  toggle(m: PanelMode) { if (this.mode === m) this.close(); else { this.mode = m; this.sel = null; this.region = null; this.wm.confirm = null; this.wm.expand = null; this.render(); } }
  close() {
    // R14 横版长街：关闭店铺界面 = 回到街上（出城走西端城门）
    if (this.mode === 'town') this.npc = null;
    this.clearMapInput(); this.sel = null; this.ironIdx = null; this.mode = null; this.root?.destroy(true); this.root = undefined; this.hideTip(); }
  /** #11 修复：面板打开时升级/得经验不刷新。render 时记录快照，UIScene.update 每帧比对 */
  private snap = ''; mscale = 1; skPage = 0; bookPage = 0; bookCs = false;
  statSnap() { const w = this.world(); return `${w.level}:${w.exp}:${JSON.stringify(w.skillTrain)}:${w.learned.size}`; }
  /** 角色/技能面板数据变了就重绘；返回是否重绘（供测试） */
  static AUTO_REFRESH_MS = 800;
  private lastAuto = -1e9;
  /** 最近一次指针按下（scene 时间），供 refreshIfStale 避让 */
  lastDown = -1e9;
  refreshIfStale(): boolean {
    if (this.mode !== 'bag' && this.mode !== 'skills') return false;
    if (this.statSnap() === this.snap) return false;
    // feat/potion-expand：触屏「点一下选中、再点执行」进行中（sel 已选）或刚有按下（<AUTO_REFRESH_MS）时不自动重绘：
    // 重绘会销毁格子/提示，新格子要等下一帧才进 Phaser 命中表，第二下点击会被吞（手机双击解包偶发失败的根因）
    if (this.sel || this.s.time.now - this.lastDown < Panel.AUTO_REFRESH_MS) return false;
    // 战斗中经验/熟练度几乎每帧变：限频重绘，否则每帧重建的点击对象还在 Phaser 待插入队列里，触屏点不中
    const now = this.s.time.now;
    if (now - this.lastAuto < Panel.AUTO_REFRESH_MS) return false;
    this.lastAuto = now; this.render(); return true;
  }
  render() { this.renderInner(); flushInput(this.s); }
  private renderInner() {
    if (this.mode) this.snap = this.statSnap();
    this.root?.destroy(true); this.hideTip(); this.clearMapInput();
    if (!this.mode) return;
    const s = this.s, R = this.root = s.add.container(0, 0).setDepth(200);
    R.add(s.add.rectangle(640, 360, MAX_LW, 720, 0x000000, 0.45).setInteractive());
    const W = this.mode === 'settings' ? 640 : 1000, H = this.mode === 'settings' ? 580 : 500, top = Math.max(40, 360 - H / 2);
    // 边框与内容对齐：非设置面板内容从 top 起排到 top+478，边框覆盖 top-20 ~ top+480
    R.add(frameBg(s, panelFrameName(IS_MOBILE, f => atlasReady(s, f)), 640, this.mode === 'settings' ? 300 : top + H / 2 - 20, W, H, { fill: 0x15100b, alpha: 0.97, stroke: 0xd4a64a, sw: 3 }).setName('panelBg'));
    const titles = { bag: '角色 / 背包', shop: '商人 · 杂货铺', skills: '技能', settings: '设置', map: this.wm.area ? '' : '世界地图', quests: '悬赏 / 成就', town: `${TOWNS[this.world().town ?? 'bichi']?.name ?? '城镇'} · 安全区` };
    if (titles[this.mode] && atlasReady(s, 'title_plate')) R.add(frameBg(s, 'title_plate', 640, top + 22, Math.max(200, titles[this.mode].length * 26 + 80), 40, { fill: 0 }).setName('titlePlate')); // B2 标题底牌（无图集不画，保持原样）
    R.add(txt(s, 640, top + 22, titles[this.mode], 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
    // 手机：面板整体放大到接近全屏（地图面板自带拖动/缩放坐标换算，不放大）；关闭键加大到 ≥44px
    if (IS_MOBILE && this.mode !== 'map') { const k = Math.min(1280 / W, 700 / H); this.mscale = k; const cy = this.mode === 'settings' ? 300 : top + H / 2 - 20; R.setScale(k).setPosition(640 * (1 - k), cy * (1 - k) + (360 - cy)); } else this.mscale = 1;
    if (IS_MOBILE) { const cw = this.mscale > 1 ? 84 : 90, ch = this.mscale > 1 ? 76 : 84; R.add([...button(s, 640 + W / 2 - cw / 2 - 4, top + 14 + (ch - 64) / 2, cw, ch, '✕', () => this.close(), 30)]); }
    else R.add([...button(s, 640 + W / 2 - 26, top + 22, 36, 32, '✕', () => this.close(), 18)]);
    if (this.mode === 'settings') return this.renderSettings(R, top);
    if (this.mode === 'skills') { this.renderSkills(R, top); return this.mobileTabs(R, top); }
    if (this.mode === 'map') return this.renderMap(R, top);
    if (this.mode === 'quests') return this.renderQuests(R, top);
    if (this.mode === 'town') { this.renderTown(R, top); if (this.npcNeedsBag()) this.renderBag(R, top); return; }
    if (this.mode === 'bag') this.renderEquip(R, top); else this.renderShop(R, top);
    this.renderBag(R, top); this.mobileTabs(R, top);
  }
  /** 手机：角色背包 / 技能 页签（tab_on/tab_off 九宫格，无图集回退 button()）；最后加入以免被内容点击区盖住；桌面不加 */
  private mobileTabs(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s;
    if (!IS_MOBILE || (this.mode !== 'bag' && this.mode !== 'skills')) return;
    MOBILE_TABS.forEach(t => {
      const go = () => { if (this.mode === t.mode) return; this.mode = t.mode; this.sel = null; this.hideTip(); this.render(); };
      const vis = tabButton(s, t.x, top + 22, t.w, t.h, t.label, this.mode === t.mode, go, 18);
      vis.forEach(o => (o as any).disableInteractive?.());
      // 透明矩形作点击层（与 slotBox 同机制，触屏可靠）
      const hh = Math.max(t.h, MIN_TAP / Math.max(this.cssU(), 0.01));
      // 点击区向上扩（下缘与页签底齐平），不压到下方装备格
      const hit = s.add.rectangle(t.x, top + 22 + t.h / 2 - hh / 2, t.w, hh, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setData('mtab', t.mode);
      hit.on('pointerdown', go);
      R.add([...vis, hit]);
    });
  }
  private slotBox(R: Phaser.GameObjects.Container, x: number, y: number, size: number, it: InvItem | undefined, label: string, onClick: (right: boolean) => void, key = '', pitch = size) {
    const s = this.s;
    const selected = IS_MOBILE && !!it && this.sel === key;
    // B4：有图集时格底用 slot/slot_sel 九宫格、品质用 qframe_* 叠框，原矩形只作透明点击/悬停层；无图集保持原绘制
    const atl = atlasReady(s, 'slot') && size >= UI_SLICES.slot.left + UI_SLICES.slot.right;
    if (atl) R.add(slotBg(s, x, y, size, selected, { fill: 0x0a0806 }));
    const r = s.add.rectangle(x, y, size, size, 0x0a0806, atl ? 0.001 : 1);
    if (!atl) r.setStrokeStyle(2, it ? RARITY_NUM[it.rarity] : 0x4a3a28);
    R.add(r);
    if (it && s.textures.exists('item_' + it.item)) R.add(s.add.image(x, y, 'item_' + it.item).setDisplaySize(size - 8, size - 8));
    else if (label) R.add(txt(s, x, y, label, 12, '#6a5a40', { strokeThickness: 0 }).setOrigin(0.5));
    if (it?.enhance) R.add(txt(s, x + size / 2 - 4, y + size / 2 - 10, '+' + it.enhance, 12, '#c8f0ff', { fontStyle: 'bold', strokeThickness: 3 }).setOrigin(1, 0.5));
    if (it?.item === 'black_iron') { R.add(txt(s, x + size / 2 - 2, y + size / 2 - 8, '+' + (it.purity ?? 1), 11, '#aaf', { fontStyle: 'bold', strokeThickness: 2 }).setOrigin(1, 0.5)); if ((it.qty ?? 1) > 1) R.add(txt(s, x - size / 2 + 4, y + size / 2 - 8, '×' + (it.qty ?? 1), 11, '#ffe8a0', { fontStyle: 'bold', strokeThickness: 2 }).setOrigin(0, 0.5)); }
    if (it && BUNDLES[it.item]) R.add(txt(s, x + size / 2 - 4, y + size / 2 - 9, String(it.qty ?? 1), 12, '#fff', { fontStyle: 'bold', strokeThickness: 3 }).setOrigin(1, 0.5).setName('bundleQty')); // feat/potion-expand：捆数量（右下）
    if (it && atl) { const q = qualityFrame(s, x, y, size - 4, it.rarity); if (q) R.add(q); else r.setStrokeStyle(2, RARITY_NUM[it.rarity]); }
    // 套装激活角标：已装备且该套装至少触发一档加成
    const setId = it && key.startsWith('eq_') ? ITEMS[it.item]?.set : undefined;
    if (setId && SETS[setId] && (this.world().setCounts()[setId] ?? 0) >= Math.min(...SETS[setId].bonus.map(b => b.n)) && s.textures.exists('set_badge'))
      R.add(s.add.image(x + size / 2 - 10, y - size / 2 + 10, 'set_badge').setDisplaySize(22, 22));
    if (selected) { if (!atl) r.setStrokeStyle(4, 0xffe080); s.time.delayedCall(0, () => it && this.root && this.showTip(it, this.root.x + (x + size / 2 + 6) * this.mscale, this.root.y + (y - size / 2) * this.mscale, true)); }
    const hit = slotHitSize(IS_MOBILE, size, pitch, this.cssU());
    if (hit > size) r.setInteractive({ hitArea: new Phaser.Geom.Rectangle((size - hit) / 2, (size - hit) / 2, hit, hit), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: !!it });
    else r.setInteractive({ useHandCursor: !!it });
    r.setData('slot', true).setData('slotHit', hit).setData('slotPitch', pitch).setData('slotSize', size);
    if (!IS_MOBILE) r.on('pointerover', () => { if (atl) r.setFillStyle(0xffe8a0, 0.12); else r.setFillStyle(0x2a2016); if (it) this.showTip(it, x + size / 2 + 6, y - size / 2); });
    if (!IS_MOBILE) r.on('pointerout', () => { r.setFillStyle(0x0a0806, atl ? 0.001 : 1); this.hideTip(); });
    // 触屏：点一次选中并显示属性，再点一次执行（装备/卸下/出售）
    r.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!it) return;
      if (IS_MOBILE && this.sel !== key) { this.sel = key; sfx(s, 'click', 0.4); this.render(); return; }
      this.sel = null; onClick(p.rightButtonDown());
    });
  }
  private renderEquip(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), c = CLASSES[w.cls], cx = 330, size = 60;
    // 中间立绘，左右两列装备栏
    R.add(s.add.rectangle(cx, top + 210, 170, 260, c.bg)); R.add(frameBg(s, 'inset_frame', cx, top + 210, 170, 260, { fill: 0, alpha: 0, stroke: 0xb8a070, sw: 2 })); // 职业底色保留，内框叠上
    // 装备上身预览：衣服/武器分层合成；缺素材回退原立绘，层图就绪后重绘面板
    const look = equipLook(s, w.cls, c.art, w.equip, () => { if (this.mode === 'bag' && this.root === R) this.render(); });
    if (s.textures.exists(look.key)) { const im = s.add.image(cx, top + 330, look.key).setOrigin(0.5, 1).setName('equipPreview'); im.setScale(Math.min(250 / im.height, 200 / im.width)); R.add(im); }
    // 左列：头盔/项链/武器/左手镯/左戒指；右列：衣服/靴子/右手镯/右戒指（间距 58，末行底边 top+342 不压属性文字，竖屏同坐标系不越界）
    const L = cx - 130, Rx = cx + 130, y0 = top + 80, dy = 58;
    const pos: Record<EquipSlot, [number, number]> = { helmet: [L, y0], necklace: [L, y0 + dy], weapon: [L, y0 + dy * 2], bracelet1: [L, y0 + dy * 3], ring1: [L, y0 + dy * 4],
      armor: [Rx, y0], boots: [Rx, y0 + dy], bracelet2: [Rx, y0 + dy * 3], ring2: [Rx, y0 + dy * 4] };
    for (const sl of EQUIP_SLOTS) {
      const [x, y] = pos[sl];
      this.slotBox(R, x, y, size, w.equip[sl], EQUIP_SLOT_NAMES[sl], () => {
        if (this.ironIdx != null) {
          const m = w.enhanceWithIron(this.ironIdx, sl); this.ironIdx = null;
          sfx(s, 'loot', 0.5); this.onChange(m, m.includes('成功')); this.render(); return;
        }
        const e = w.unequip(sl); this.onChange(e ?? `卸下 ${EQUIP_SLOT_NAMES[sl]}`); sfx(s, 'loot', 0.4); this.render();
      }, 'eq_' + sl, dy);
    }
    const st = w.stats(), h = w.hero;
    const title = w.title(); const lines = [`${c.name}  Lv${w.level}${title ? '  「' + title + '」' : ''}`, `经验 ${fmtExp(w.exp)}/${fmtExp(w.expNext)}   金币 ${w.gold}   击杀 ${w.kills}`, `生命 ${h ? Math.ceil(h.hp) : 0}/${st.hp}   魔法 ${h ? Math.floor(h.mp ?? 0) : 0}/${st.mp}`,
      `攻击 ${st.atk}   魔法 ${st.mag}   道术 ${st.tao}   防御 ${Math.round(st.def)}   魔御 ${Math.round(st.mdef ?? 0)}   幸运 ${w.luck()}   暴击 ${Math.round(w.critChance() * 100)}%`];
    const sc = w.setCounts(), setLine = Object.values(SETS).filter(st => sc[st.id]).map(st => `${st.name}${sc[st.id]}/${st.pieces.length}`).join('  ');
    const spx = w.setSpecials().map(id => SET_SPECIALS[id]?.text.replace(/ \[适配\]/, '')).filter(Boolean).join('；');
    if (setLine) lines.push(`套装 ${setLine}${spx ? '  特效：' + spx : ''}`);
    R.add(txt(s, 175, top + 345, lines.join('\n'), 15, '#ffe8a0', { lineSpacing: setLine ? 2 : 6, strokeThickness: 2 }));
    if (!IS_MOBILE) R.add(txt(s, cx + 130, top + 270, IS_MOBILE ? '点两下\n装备栏=卸下' : '点击装备栏\n= 卸下', 12, '#999', { align: 'center' }).setOrigin(0.5, 0));
  }
  /** 面板坐标 1 单位 = 多少 CSS px（视口缩放 × 手机面板容器缩放） */
  private cssU() { return viewCss(Render.lw) * this.mscale; }
  /** B3：行内按钮点击区 = rowHitHeight（手机 ≥44 CSS px（受行距封顶）、桌面 ≥44），且不超过行距 → 相邻行不重叠 */
  private fitRow<T extends readonly Phaser.GameObjects.GameObject[]>(b: T, pitch: number): T {
    const o = b[0] as Phaser.GameObjects.Rectangle; if (!o.input) { o.setData('rowPitch', pitch); return b; }
    const hh = rowHitHeight(IS_MOBILE, o.height, pitch, this.cssU());
    (o.input.hitArea as Phaser.Geom.Rectangle).setTo(0, (o.height - hh) / 2, o.width, hh); o.setData('rowHit', hh).setData('rowPitch', pitch); return b;
  }
  private renderShop(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 175, top + 50, `金币：${w.gold}`, 18, '#ffd24a')); // 上移缩小：避开书店「普通书店/传世秘籍」页签
    (['goods', 'books'] as const).forEach((t, i) => R.add([...tabButton(s, 395 + i * 84, top + 72, 76, 32, t === 'goods' ? '杂货' : '书店', this.shopTab === t, () => { this.shopTab = t; this.render(); }, 15)]));
    if (this.shopTab === 'books') return this.renderBooks(R, top);
    const SP = listRowPitch(IS_MOBILE, 62, this.cssU());
    POTIONS.slice(0, 4).forEach((p, i) => { // feat/potion-expand：旧商店页只列小/中 4 种，完整药水（强效/太阳水/捆）在城内药店
      const y = top + 112 + i * SP, it = ITEMS[p.item];
      R.add(rowBg(s, 330, y, 320, 56, false, { fill: 0x0a0806, stroke: 0x4a3a28 }));
      if (s.textures.exists('item_' + p.item)) R.add(s.add.image(200, y, 'item_' + p.item).setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, it.name, 16, '#fff'));
      R.add(txt(s, 232, y + 2, `${p.hp ? '恢复生命 ' + p.hp : '恢复魔法 ' + p.mp}   ${p.price} 金   持有 ${w.pots[i]}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...this.fitRow(button(s, 448, y, 64, 34, '购买', () => { const e = w.buyPotion(i); if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${it.name}`, !e); this.render(); }, 16, w.gold >= p.price), SP)]);
    });
    if (SELL_OIL_IRON) { const y = top + 112 + 4 * SP, it = ITEMS.bless_oil, sold = w.oilBoughtFloor === w.floorIndex;
      R.add(rowBg(s, 330, y, 320, 56, true, { fill: 0x0a0806, stroke: 0x6a5a28 }));
      if (s.textures.exists('item_bless_oil')) R.add(s.add.image(200, y, 'item_bless_oil').setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, it.name, 16, '#ffd24a'));
      R.add(txt(s, 232, y + 2, `武器幸运+1   ${OIL_PRICE} 金   ${sold ? '本层已购' : '每层限购 1'}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...this.fitRow(button(s, 448, y, 64, 34, '购买', () => { const e = w.buyOil(); if (!e) sfx(s, 'coin'); this.onChange(e ?? '购买 祝福油', !e); this.render(); }, 16, !sold && w.gold >= OIL_PRICE), SP)]); }
    if (SELL_OIL_IRON) { const y = top + 112 + 5 * SP, it = ITEMS.black_iron;
      const left = w.ironBoughtFloor === w.floorIndex ? Math.max(0, 5 - w.ironBoughtCount) : 5;
      R.add(rowBg(s, 330, y, 320, 56, false, { fill: 0x0a0806, stroke: 0x4a3a28 }));
      if (s.textures.exists('item_black_iron')) R.add(s.add.image(200, y, 'item_black_iron').setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, '黑铁矿石[+1]', 16, '#c8c8ff'));
      R.add(txt(s, 232, y + 2, `强化装备   ${IRON_PRICE} 金   本层剩 ${left}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...this.fitRow(button(s, 448, y, 64, 34, '购买', () => { const e = w.buyIron(); if (!e) sfx(s, 'coin'); this.onChange(e ?? '购买 黑铁矿石', !e); this.render(); }, 16, left > 0 && w.gold >= IRON_PRICE), SP)]); }
    R.add(txt(s, 175, top + 430, '点击右侧背包物品出售（按售价）', 14, '#9fd'));
  }
  /** 书店：本职业有售的技能书（原版比奇书店；掉落书不卖） */
  private renderBooks(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cs = false, all = cs ? w.csBooks() : w.shopBooks();
    // B3：手机行距 ≥44 CSS px → 每页 4 本、◀ ▶ 翻页；桌面原样（全部列出，行高按本数）
    const mRH = listRowPitch(true, 50, this.cssU()), PER = IS_MOBILE ? Math.max(3, Math.floor(300 / mRH)) : all.length || 1, pages = Math.max(1, Math.ceil(all.length / PER));
    this.bookPage = Math.max(0, Math.min(pages - 1, this.bookPage));
    const list = all.slice(this.bookPage * PER, this.bookPage * PER + PER), rh = IS_MOBILE ? Math.max(mRH, list.length > 5 ? 44 : 62) : list.length > 7 ? 38 : cs || list.length > 5 ? 44 : 62;
    if (pages > 1) { R.add([...button(s, 600, top + 72, 56, 40, '◀', () => { this.bookPage--; this.render(); }, 16, this.bookPage > 0)]); R.add(txt(s, 650, top + 72, `${this.bookPage + 1}/${pages}`, 15, '#ffe8a0').setOrigin(0.5)); R.add([...button(s, 700, top + 72, 56, 40, '▶', () => { this.bookPage++; this.render(); }, 16, this.bookPage < pages - 1)]); }
    // R54：传世秘籍页取消——>25 级（含传世）书改为 BOSS 掉落（docs/skill-book-drops.md）
    list.forEach((b, i) => {
      const y = top + (rh < 62 ? 128 : 130) + i * rh, sk = w.skillPool.find(x => x.id === b.skill)!, id = 'book_' + b.skill, learned = w.learned.has(b.skill), need = w.needLevel(sk), be = bookEntry(ITEMS[id].name, need, w.level, learned, b.price);
      R.add(rowBg(s, 330, y, 320, rh - 6, be.buyable && w.gold >= b.price, { fill: 0x0a0806, stroke: cs ? 0x8a6a20 : 0x6a5a28 }));
      const ic = s.textures.exists('sk_' + b.skill) && cs ? 'sk_' + b.skill : 'item_' + id;
      if (s.textures.exists(ic)) R.add(s.add.image(200, y, ic).setDisplaySize(rh - 16, rh - 16));
      // 行高 38（>7 本）时单行显示「书名 需LvX 价格」，避免手机放大字号后两行重叠
      if (rh < 44) R.add(txt(s, 222, y, `${be.nm} 需Lv${need} ${learned ? '已学会' : be.gap > 0 ? `差${be.gap}级` : `${b.price}金`}`, 13, learned ? '#888' : w.level >= need ? '#ffd24a' : '#f99', { strokeThickness: 2 }).setOrigin(0, 0.5));
      else { R.add(txt(s, 232, y - (rh < 62 ? 17 : 20), be.nm, be.fs, learned ? '#888' : '#ffd24a'));
      R.add(txt(s, 232, y + (rh < 62 ? 0 : 2), be.sub, 13, w.level >= need ? '#ccc' : '#f99', { strokeThickness: 2 })); }
      R.add([...this.fitRow(button(s, rh < 44 ? 458 : 448, y, rh < 44 ? 56 : 64, rh < 62 ? rh - 12 : 34, '购买', () => { const e = w.buyBook(b.skill); if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${ITEMS[id].name}（背包中点击学习）`, !e); this.render(); }, 15, be.buyable && w.gold >= b.price), rh)]);
    });
    const drops = Object.values(BOOKS).filter(b => b.cls === w.cls && !all.includes(b)).map(b => w.skillPool.find(x => x.id === b.skill)!.name);
    if (!cs && drops.length) R.add(txt(s, 175, top + (rh < 62 ? 128 : 130) + list.length * rh - rh / 2 + 4, `Lv>25 书店不卖：其余 ${drops.length} 本由 BOSS 掉落（尸王等，见技能面板来源）`, 13, '#c9a', { strokeThickness: 2 }));
    R.add(txt(s, 175, top + 448, '买书后在背包里点击技能书学习（需达到等级）', 13, '#9fd'));
  }
  private renderBag(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cols = 6, size = 56, x0 = 600, y0 = top + 100;
    R.add(txt(s, x0 - size / 2, top + 50, `背包 ${w.bag.length}/${WORLD.bagSize}`, 15, '#ffe8a0'));
    const pages = Math.ceil(WORLD.bagSize / BAG_PAGE); this.bagPage = Math.max(0, Math.min(pages - 1, this.bagPage));
    const go = (d: number) => { this.bagPage = (this.bagPage + d + pages) % pages; this.sel = null; this.render(); };
    R.add([...button(s, x0 + (IS_MOBILE ? 140 : 150), top + 52, IS_MOBILE ? 60 : 40, 30, '◀', () => go(-1), 15)]);
    R.add(txt(s, x0 + (IS_MOBILE ? 182 : 175), top + 50, `${this.bagPage + 1}/${pages}`, 15, '#ffe8a0'));
    R.add([...button(s, x0 + (IS_MOBILE ? 262 : 250), top + 52, IS_MOBILE ? 60 : 40, 30, '▶', () => go(1), 15)]);
    R.add([...button(s, x0 + (IS_MOBILE ? 412 : 360), top + 52, IS_MOBILE ? 70 : 56, 30, '整理', () => { w.sortBag(); this.bagPage = 0; this.sel = null; this.hideTip(); this.render(); }, 13)]);
    R.add([...button(s, x0 + (IS_MOBILE ? 334 : 300), top + 52, IS_MOBILE ? 66 : 50, 30, '末页', () => { this.bagPage = Math.floor(Math.max(0, w.bag.length - 1) / BAG_PAGE); this.render(); }, 13)]);
    const p0 = this.bagPage * BAG_PAGE;
    for (let i = p0; i < Math.min(WORLD.bagSize, p0 + BAG_PAGE); i++) {
      const it = w.bag[i], k = i - p0, x = x0 + (k % cols) * (size + 6), y = y0 + Math.floor(k / cols) * (size + 6);
      this.slotBox(R, x, y, size, it, '', right => {
        if (this.mode === 'shop' || this.npcKind() && this.npcKind() !== 'storage') { const g = w.sellItem(i); sfx(s, 'coin'); this.onChange(`出售 ${it!.name} 获得 ${g} 金币`, true); }
        else if (this.npcKind() === 'storage') { const e = w.deposit(i); this.onChange(e ?? `存入 ${it!.name}`, !e); }
        else if (BUNDLES[it!.item]) { // feat/potion-expand：双击解开（桌面 450ms 内连点两次；手机沿用「点一次选中、再点执行」）
          const now = Date.now(), dbl = IS_MOBILE || (this.bundleClick?.uid === it!.uid && now - this.bundleClick.t < 450); this.bundleClick = dbl ? null : { uid: it!.uid, t: now };
          if (dbl) { const r = w.unbundle(i); if (r.ok) sfx(s, 'loot', 0.5); this.onChange(r.msg, r.ok); } else { this.onChange(`${it!.name}×${it!.qty ?? 1}：双击解开（每捆 6 瓶）`); return; } }
        else if (potIndex(it!.item) >= 0) { const m = w.absorbPotionItem(i); this.onChange(m, m.includes('放入')); }
        else if (CONSUMABLE[it!.item]) { const m = w.useConsumable(i); sfx(s, 'loot', 0.5); if (w.town) { this.mode = 'town'; this.npc = null; } this.onChange(m, m.startsWith('使用')); }
        else if (right) { w.dropItem(i); this.onChange(`丢弃 ${it!.name}`); }
        else if (it!.slot) { const e = w.equipItem(i); if (!e) sfx(s, 'loot', 0.5); this.onChange(e ?? `装备 ${it!.name}`, !e); }
        else if (ITEMS[it!.item]?.book) { const m = w.learnBook(i); const ok = m.startsWith('学会'); if (ok) sfx(s, 'loot', 0.6); this.onChange(m, ok); }
        else if (it!.item === 'bless_oil') { const m = w.useOil(i); sfx(s, 'loot', 0.5); this.onChange(m, m.includes('+1') || m.includes('减轻')); }
        else if (it!.item === 'black_iron') {
          // 堆叠≥2 或另有同纯度：再点一次提纯；否则进入强化选位
          const same = w.bag.findIndex((x, j) => j !== i && x.item === 'black_iron' && (x.purity ?? 1) === (it!.purity ?? 1));
          const stack = (it!.qty ?? 1) >= 2;
          if (this.ironIdx === i && (stack || same >= 0)) {
            const m = w.refineIron(i, stack ? i : same); this.ironIdx = null; sfx(s, 'coin'); this.onChange(m, m.includes('成功'));
          } else {
            this.ironIdx = i; this.onChange(`已选 ${it!.name}×${it!.qty ?? 1}：点装备栏强化；再点本矿可提纯`, true);
          }
        }
        else this.onChange(`${it!.name} 不能装备（可在商人处出售）`);
        this.render();
      }, 'bag_' + i, size + 6);
    }
    if (IS_MOBILE && this.mode === 'bag' && this.sel?.startsWith('bag_')) { const i = Number(this.sel.slice(4)), it = w.bag[i]; if (it) R.add([...button(s, x0 + 5 * (size + 6), top + 470, 80, 34, '丢弃', () => { w.dropItem(i); this.sel = null; this.onChange(`丢弃 ${it.name}`); this.render(); }, 16)]); }
    R.add(txt(s, x0 - size / 2, top + 452, this.ironIdx != null ? '黑铁已选：点击左侧武器/头盔/衣服/靴子强化；再点同纯度矿提纯' : IS_MOBILE ? (this.mode === 'shop' ? '点一下查看属性，再点一下出售' : '点一下查看属性，再点一下装备；选中后可「丢弃」') : this.mode === 'shop' ? '左键出售' : '左键装备   右键丢弃   悬停查看属性', 12, this.ironIdx != null ? '#9fd' : '#999'));
  }
  /** R14 技能页：查看（详情/各级数值/耗魔/冷却）· 升级（官方修炼规则）· 放置（拖放排快捷栏）· 自动（勾选+优先级） */
  private renderSkills(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    const bar = w.skills, barIdx = new Map(bar.map((k, i) => [k.id, i]));
    // R54：按学习等级升序（不再把快捷栏技能置顶，改用 [F n] 标签）；列表=本职业技能池（按职业筛选）。电脑/手机均分页（◀ ▶），每行两行文字不重叠
    const full = w.skillsByLevel();
    const PER = IS_MOBILE ? 6 : 7, pages = Math.max(1, Math.ceil(full.length / PER)); this.skPage = Math.max(0, Math.min(pages - 1, this.skPage));
    const list = full.slice(this.skPage * PER, this.skPage * PER + PER);
    if (pages > 1) {
      const bw = IS_MOBILE ? 64 : 44, bh = IS_MOBILE ? 56 : 30, by = top + 22;
      R.add([...button(s, 380, by, bw, bh, '◀', () => { this.skPage--; this.render(); }, IS_MOBILE ? 22 : 16, this.skPage > 0)]); R.add(txt(s, 440, by, `${this.skPage + 1}/${pages}`, IS_MOBILE ? 18 : 15, '#ffe8a0').setOrigin(0.5)); R.add([...button(s, 500, by, bw, bh, '▶', () => { this.skPage++; this.render(); }, IS_MOBILE ? 22 : 16, this.skPage < pages - 1)]);
      R.add(txt(s, 700, by, `共 ${full.length} 个技能 · 按学习等级排序`, IS_MOBILE ? 16 : 13, '#9fd').setOrigin(0, 0.5));
    }
    const autoList = Settings.skillsFor(w.cls), autoable = new Set(DEFAULT_AUTO_SKILLS[w.cls]);
    const rowH = IS_MOBILE ? 66 : 55, y0 = top + 48 + rowH / 2, fs = IS_MOBILE ? 16 : 13;
    const shopIds = new Set(w.shopBooks().map(b => b.skill)), dropSrc = Object.fromEntries(SKILL_BOOK_DROPS.map(d => [d.skill, d.src.map(x => x.floorName).join('/')]));
    list.forEach((k, i) => {
      const y = y0 + i * rowH, inBar = barIdx.has(k.id);
      const need = w.needLevel(k), lv = w.skillLevel(k), locked = lv < 0, pts = w.skillTrain[k.id] ?? 0, learned = w.learned.has(k.id), bk = BOOKS[k.id];
      const st = learned ? (locked ? { t: '已学·等级不足', c: '#c96', bg: 0x1a1208 } : { t: '已学会', c: '#7f7', bg: 0x0c1a0c }) : w.level >= need ? { t: '可学习', c: '#ffd24a', bg: 0x1a1606 } : { t: '未学', c: '#aaa', bg: 0x0a0806 };
      { const row = rowBg(s, 560, y, 820, rowH - 4, learned && !locked, { fill: st.bg, alpha: 0.92, stroke: learned ? 0x3a6a3a : 0x3a2a18 }); R.add(row);
        // B4：九宫格行恢复状态着色（已学会绿 / 等级不足褐 / 可学习金 / 未学不叠）
        const tn = rowTint(s, row, 560, y, 820, rowH - 4, SKILL_ROW_TINT[learned ? (locked ? 'locked' : 'learned') : w.level >= need ? 'learnable' : '']); if (tn) R.add(tn.setData('tint', learned ? (locked ? 'locked' : 'learned') : 'learnable')); }
      if (s.textures.exists('sk_' + k.id)) R.add(s.add.image(178, y, 'sk_' + k.id).setDisplaySize(rowH - 14, rowH - 14).setAlpha(learned ? 1 : 0.55));
      const tag = inBar ? `[F${barIdx.get(k.id)! + 1}]` : k.passive ? '[被动]' : '';
      // 第 1 行：名称 + 当前等级/需求等级 + 状态（颜色区分）+ 快捷栏标签
      const l1 = txt(s, 212, y - rowH / 2 + 5, `${k.name}  ${learned && !locked ? `${lv}级` : '—'} / 需Lv${need}`, fs + 1, learned ? '#ffe8a0' : '#bbb', { strokeThickness: 2 }); R.add(l1);
      const stx = txt(s, 212 + l1.width + 12, y - rowH / 2 + 6, `${st.t}${tag ? ' ' + tag : ''}`, fs, st.c, { strokeThickness: 2 }); R.add(stx);
      // 第 2 行：已学→耗魔/冷却/修炼/升级；未学→需 LvX + 获取途径
      const up = lv >= 0 && lv < 3 && k.learn && k.train ? `升级：Lv${k.learn[lv + 1]}+修炼${k.train[lv]}` : lv === 3 ? '已满级' : '';
      const src = !bk ? '初始技能' : shopIds.has(k.id) ? `比奇书店有售 ${bk.price}金` : dropSrc[k.id] ? `BOSS 掉落：${dropSrc[k.id]}` : bk.drops.length ? '打怪掉落技能书' : '暂未开放获取';
      const l2 = learned ? `${k.passive ? '无需施放' : `耗魔${fmtInt(this.world().manaCost(k))}${this.world().manaCost(k) < k.mana ? "(法神-10%)" : ""} 冷却${fmtInt(k.cooldown)}s`}  修炼${pts}${k.train ? '/' + k.train[2] : ''}  ${up}  ${k.desc}` : `需 Lv${need} · 获取：${src} · ${k.desc}`;
      R.add(txt(s, 212, y - rowH / 2 + 5 + fs + 9, fmtText(l2).slice(0, IS_MOBILE ? 32 : 44), fs - 1, learned ? '#9fd' : '#ccc', { strokeThickness: 2 }));
      if (k.train && lv >= 0 && lv < 3) { const p = Math.min(1, pts / k.train[lv]); R.add(s.add.rectangle(212, y + rowH / 2 - 6, 220, 3, 0x333333).setOrigin(0, 0.5)); R.add(s.add.rectangle(212, y + rowH / 2 - 6, 220 * p, 3, 0x55cc77).setOrigin(0, 0.5)); }
      if (inBar) {
        const bi = barIdx.get(k.id)!;
        R.add([...this.fitRow(button(s, IS_MOBILE ? 760 : 800, y, IS_MOBILE ? 60 : 36, rowH - 18, '▲', () => { w.moveSkill(k.id, bi - 1); this.render(); }, 14, bi > 0), rowH)]);
        R.add([...this.fitRow(button(s, IS_MOBILE ? 830 : 840, y, IS_MOBILE ? 60 : 36, rowH - 18, '▼', () => { w.moveSkill(k.id, bi + 1); this.render(); }, 14, bi < bar.length - 1), rowH)]);
        if (autoable.has(k.id)) {
          const on = autoList.includes(k.id), pr = autoList.indexOf(k.id);
          R.add([...this.fitRow(button(s, IS_MOBILE ? 940 : 975, y, 96, rowH - 18, `${on ? '☑' : '☐'} 自动${on ? ' #' + (pr + 1) : ''}`, () => { Settings.toggleAutoSkill(k.id, w.cls); this.render(); }, 13), rowH)]);
          R.add([...this.fitRow(button(s, IS_MOBILE ? 1020 : 1045, y, IS_MOBILE ? 60 : 32, rowH - 18, '↑', () => { Settings.moveAutoSkill(k.id, -1, w.cls); this.render(); }, 13, on && pr > 0), rowH)]);
          R.add([...this.fitRow(button(s, IS_MOBILE ? 1084 : 1081, y, IS_MOBILE ? 60 : 32, rowH - 18, '↓', () => { Settings.moveAutoSkill(k.id, 1, w.cls); this.render(); }, 13, on && pr < autoList.length - 1), rowH)]);
        } else R.add(txt(s, 975, y, '手动', 12, '#888').setOrigin(0.5));
      }
    });
    if (IS_MOBILE) R.add(txt(s, 160, top + 450, '▲▼ 调整快捷栏顺序；☑自动 勾选后自动施放，↑↓ 调优先级', 18, '#9fd')); else R.add(txt(s, 160, top + 444, `▲▼/拖动≡ 调整快捷栏；☑自动 与设置页同一份，#n 为自动优先级。学习等级/修炼点取自 1.76 官方，修炼满足后自动升级；耗魔×3；轻量冷却 1.5–6s + 公共施法间隔 0.8s（适配）。等级加成 ×${w.skillScale().toFixed(2)}`, 12, '#aaa', { wordWrap: { width: 960 } }));
  }
  // ---------- R14 城镇 ----------
  private npcDef() { const t = TOWNS[this.world().town ?? '']; return t?.npcs.find(n => n.id === this.npc); }
  npcKind() { return this.mode === 'town' ? this.npcDef()?.kind : undefined; }
  private npcNeedsBag() { const k = this.npcKind(); return !!k && k !== 'teleport' && k !== 'book' && k !== 'veteran'; }
  private renderTown(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), t = TOWNS[w.town ?? '']; this.scrollInfo = {};
    if (!t) { R.add(txt(s, 640, top + 200, '不在城内', 20, '#fff').setOrigin(0.5)); return; }
    if (s.textures.exists('bg_town')) R.add(s.add.image(640, top + 240, 'bg_town').setDisplaySize(996, 460).setAlpha(0.35));
    R.add(txt(s, 160, top + 14, `金币 ${w.gold}   安全区`, 14, '#ffd24a'));
    const cur = this.npcDef(), art = cur && npcArtOf(this.world().town, cur.id, cur.kind);
    if (art && s.textures.exists(art)) R.add(s.add.image(240, top + 400, art).setOrigin(0.5, 1).setDisplaySize(200, 250));
    else if (cur) { R.add(frameBg(s, 'inset_frame', 240, top + 275, 200, 250, { fill: 0x2a2018, stroke: 0x6a5a28, sw: 2 })); R.add(txt(s, 240, top + 275, cur.name.replace(/（.*）/, ''), 16, '#ffe8a0').setOrigin(0.5)); }
    R.add([...button(s, 240, top + 448, 170, 36, '回到街上', () => this.close(), 16)]);
    const n = this.npcDef(), X = 340, n0 = n!;
    if (!n) { R.add(txt(s, X, top + 90, `${t.name}\n选择左侧 NPC。\n来源：${t.src}`, 14, '#ddd', { wordWrap: { width: 600 } })); return; }
    R.add(txt(s, X - 180, top + 44, `${n.name}${n.pos ? `  原版坐标 ${n.pos}` : ''}${n.note ? `  ${n.note}` : ''}`, 13, '#ffe8a0', { wordWrap: { width: this.npcNeedsBag() ? 400 : 700 } }));
    // 长列表滚动：行先按列收集，最后每列只画可视窗口（NPC_VIS 行）+ 滚动条（scrollList.ts）
    const cols = new Map<number, { i: number; a: [string, string, string, () => void, boolean, string | undefined, number?] }[]>();
    const row = (i: number, name: string, sub: string, label: string, fn: () => void, ok: boolean, icon?: string, X = 340, nfs = 14) => {
      if (!cols.has(X)) cols.set(X, []); cols.get(X)!.push({ i, a: [name, sub, label, fn, ok, icon, nfs] }); };
    // B2：手机行距 ≥44 CSS px，行内按钮点击区 ≥36 CSS px 且不超过行距（相邻行不重叠）；可视行数随之减少
    const cssU = viewCss(Render.lw) * this.mscale, RP = listRowPitch(IS_MOBILE, 50, cssU), ROFF = (RP - 50) * 1.5, VIS = Math.max(4, Math.floor(NPC_VIS * 50 / RP));
    const drawRow = (slot: number, X: number, [name, sub, label, fn, ok, icon, nfs = 14]: [string, string, string, () => void, boolean, string | undefined, number?], scroll: boolean) => {
      const y = top + 100 + ROFF + slot * RP; // 手机加高行时整体下移 ROFF，首行顶边 ≥ 提示文字底（top+92）
      R.add(rowBg(s, X + 110, y, 230, RP - 6, false, { fill: 0x0a0806, stroke: 0x4a3a28 }).setName('listRow'));
      if (icon && s.textures.exists('item_' + icon)) R.add(s.add.image(X + 16, y, 'item_' + icon).setDisplaySize(36, 36));
      R.add(txt(s, X + 40, y - 17, name, nfs, '#fff')); R.add(txt(s, X + 40, y + 2, sub, 11, '#ccc', { strokeThickness: 2 }));
      const b = button(s, X + 196, y, 50, 30, label, fn, 13, ok); R.add([...b]);
      if (b[0].input) { const hh = rowHitHeight(IS_MOBILE, 30, RP, cssU); (b[0].input.hitArea as Phaser.Geom.Rectangle).setTo(0, (30 - hh) / 2, 50, hh); b[0].setData('rowHit', hh); }
      b[0].setData('rowPitch', RP).setData('rowHit', b[0].getData('rowHit') ?? Math.min(30, RP));
      // 可滚动列：按下不立即触发，抬起且拖动 ≤ 阈值才算点击（防滚动误触）
      if (scroll && ok) { b[0].removeAllListeners('pointerdown').on('pointerdown', () => { this.tapArm = b[0]; }).on('pointerup', () => { if (this.tapArm === b[0] && isTap(this.drag?.moved ?? 0)) { sfx(s, 'click'); fn(); } this.tapArm = null; }); b[0].setData('scrollBtn', label); }
    };
    const flushCols = () => { for (const [X, list] of cols) {
      const n = list.reduce((m, r) => Math.max(m, r.i + 1), 0), byI = new Map(list.map(r => [r.i, r.a]));
      if (n <= VIS) { for (const r of list) drawRow(r.i, X, r.a, false); continue; }
      const key = `${n0.id}@${X}`, off = this.npcScroll[key] = clampOff(this.npcScroll[key] ?? 0, n, VIS), [a, b2] = visibleRange(off, n, VIS);
      for (let i = a; i < b2; i++) { const r = byI.get(i); if (r) drawRow(i - a, X, r, true); }
      const trackY = top + 78 + ROFF, trackH = VIS * RP, th = thumb(off, n, VIS, trackH);
      R.add([...scrollBar(s, X + 232, trackY, trackH, th)]);
      if (a > 0) R.add(txt(s, X + 110, top + 70, `▲ 上面还有 ${a} 项`, 11, '#ffd060').setOrigin(0.5));
      if (b2 < n) R.add(txt(s, X + 110, top + 100 + ROFF + VIS * RP - 22, `▼ 下面还有 ${n - b2} 项（滑动/滚轮）`, 11, '#ffd060').setOrigin(0.5));
      const inCol = (p: Phaser.Input.Pointer) => { const l = this.toPanel(p); return l.x >= X && l.x <= X + 240 && l.y >= trackY && l.y <= trackY + trackH; };
      const set = (o: number) => { const v = clampOff(o, n, VIS); if (v !== this.npcScroll[key]) { this.npcScroll[key] = v; this.render(); } };
      const onDown = (p: Phaser.Input.Pointer) => { if (inCol(p)) this.drag = { key, y0: this.toPanel(p).y, off0: off, moved: 0 }; };
      const onMove = (p: Phaser.Input.Pointer) => { const d = this.drag; if (!d || d.key !== key || !p.isDown) return; const dy = this.toPanel(p).y - d.y0; d.moved = Math.max(d.moved, Math.abs(dy)); if (!isTap(d.moved)) set(dragOff(d.off0, dy, RP, n, VIS)); };
      const onUp = () => { s.time.delayedCall(0, () => { this.drag = null; }); };
      const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => { if (inCol(p)) set(wheelOff(this.npcScroll[key], dy, n, VIS)); };
      s.input.on('pointerdown', onDown); s.input.on('pointermove', onMove); s.input.on('pointerup', onUp); s.input.on('wheel', onWheel);
      this.mapOff.push(() => { s.input.off('pointerdown', onDown); s.input.off('pointermove', onMove); s.input.off('pointerup', onUp); s.input.off('wheel', onWheel); });
      this.scrollInfo[X] = { key, n, vis: VIS, off };
    } };
    const buy = (e: string | null, nm: string) => { if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${nm}`, !e); this.render(); };
    if (n.kind === 'potion') potShopRows(w.level).forEach((r, k) => { const p = POTIONS[r.idx], nm = ITEMS[r.id].name, eff = `${p.hp ? 'HP' + p.hp : ''}${p.hp && p.mp ? '+' : ''}${p.mp ? 'MP' + p.mp : ''}${p.instant ? ' 立刻' : ''}`; // feat/potion-expand：散装在上、捆在下，按等级门槛灰显
      row(k, nm + (r.locked ? ` 需Lv${r.lv}` : ''), r.kind === 'pot' ? `${r.price} 金 · ${eff} · 持有 ${w.pots[r.idx]}` : `${r.price} 金 · 6 瓶 · 背包 ${w.bag.filter(b => b.item === r.id).reduce((a, b) => a + (b.qty ?? 1), 0)}`, '购买', () => buy(r.kind === 'pot' ? w.buyPotion(r.idx) : w.buyBundle(r.id), nm), !r.locked && w.gold >= r.price, r.id); });
    else if (n.goods) n.goods.forEach((gd, i) => { const d = ITEMS[gd.item]; row(i, d.name + (d.req ? ` 需Lv${d.req}` : ''), `${gd.price} 金 · 原版 ${gd.official ?? '未查到'}${gd.official ? '×0.25' : ' [适配]'}`, '购买', () => buy(w.buyGoods(n.id, gd.item), d.name), w.gold >= gd.price, gd.item); });
    if (n.kind === 'general' && SELL_OIL_IRON) { const sold = w.oilBoughtFloor === w.floorIndex, k = n.goods?.length ?? 0;
      row(k, '祝福油', `${OIL_PRICE} 金 · 每层限购 1`, '购买', () => buy(w.buyOil(), '祝福油'), !sold && w.gold >= OIL_PRICE, 'bless_oil'); }
    if (n.kind === 'smith') { if (SELL_OIL_IRON) row(0, '黑铁矿石[+1]', `${IRON_PRICE} 金 · 强化装备`, '购买', () => buy(w.buyIron(), '黑铁矿石'), w.gold >= IRON_PRICE, 'black_iron');
      R.add(txt(s, X, top + 160, '修理：本作装备无持久度 [适配]，无需修理。\n强化：背包点黑铁矿石，再点装备栏。\n黑铁矿石只能在矿区挖矿获得（比奇矿区/山谷矿区）。', 13, '#9fd'));
      const sl = (Object.keys(w.equip) as (keyof typeof w.equip)[]).filter(k => w.equip[k]).slice(0, 8); // R14 #17 鉴定（S12：35 级，1–3 条）
      sl.forEach((k, i) => { const it = w.equip[k]!; row(i, it.name, it.ided ? `已鉴定 ${it.ided} 条` : `鉴定 ${IDENT_PRICE} 金 · ${IDENT_MIN_LEVEL} 级`, '鉴定', () => { const e = w.identify(k); this.onChange(e ?? `鉴定 ${it.name}`, !e); this.render(); }, !it.ided && w.level >= IDENT_MIN_LEVEL && w.gold >= IDENT_PRICE, it.item, X + 250); }); }
    if (n.kind === 'book') { // R54：书店只卖 ≤25 级，按学习等级升序；先填满左列（7 行）再右列
      const all = [...w.shopBooks(), ...w.csBooks()].sort((x, y) => w.bookLv(x) - w.bookLv(y)), PERC = 7;
      R.add(txt(s, X, top + 74, '技能书（按学习等级排序：先左列后右列）', 13, '#9fd'));
      all.forEach((b, i) => { const id = 'book_' + b.skill, e = bookEntry(ITEMS[id].name, w.bookLv(b), w.level, w.learned.has(b.skill), b.price, !!b.cs);
        row(i % PERC, e.nm, e.sub, '购买', () => buy(w.buyBook(b.skill), ITEMS[id].name), e.buyable && w.gold >= b.price, id, X + Math.floor(i / PERC) * 250, e.fs); }); }
    if (n.kind === 'jewelry') R.add(txt(s, X, top + 90, '首饰店存货：未查到（原版只能买到别人卖的）。\n点击右侧背包物品出售。', 13, '#9fd'));
    if (n.kind === 'dragon') { R.add(txt(s, X, top + 66, '龙人：英雄 43 级，带 2 本白日门技能书和 2 根金条来，我教你们合击。', 13, '#9fd'));
      const c = w.companion, cb = c ? comboFor(w.cls, c.cls) : undefined;
      row(0, '合成白日门技能书', `书页 ${w.countItem(BOOK_PAGE)}/${PAGES_PER_BOOK} [适配]`, '合成', () => { const e = w.craftBrmBook(); this.onChange(e ?? '获得白日门技能书', !e); this.render(); }, w.countItem(BOOK_PAGE) >= PAGES_PER_BOOK);
      row(1, cb ? `合击秘籍·${cb.name}` : '合击秘籍（需英雄）', c ? `英雄 Lv${c.level}/${COMBO_LEVEL} · 书 ${w.countItem(BRM_BOOK)}/2 · 金条 ${w.countItem(GOLD_BAR)}/2${c.combo?.includes(cb!.id) ? ' · 已学会' : ''}` : '先在老兵处领取英雄', '学习', () => { const e = w.learnCombo(); this.onChange(e ?? `学会 ${cb?.name}`, !e); this.render(); }, !!c && !c.combo?.includes(cb!.id)); }
    if (n.kind === 'veteran') { R.add(txt(s, X, top + 66, '老兵：城里安全，西门出城；要去哪我送你。', 13, '#9fd'));
      const q = w.ringQ, done = (e: string | null, m: string) => { this.onChange(e ?? m, !e); this.render(); }; // R14 #17 环式任务（S12：20 级起）
      if (!q) row(0, `环式任务 第${w.ringDone + 1}环`, w.level < RING_MIN_LEVEL ? `${RING_MIN_LEVEL} 级开放` : '随机去过的楼层清怪', '接取', () => done(w.ringAccept(), '接到环式任务'), w.level >= RING_MIN_LEVEL, undefined, X + 250);
      else row(0, `第${q.n}环 ${q.name} ${q.prog}/${q.need}`, `${w.floors[q.floor].name}`, '交付', () => done(w.ringClaim(), '环式任务完成'), q.prog >= q.need, undefined, X + 250);
      const c = w.companion; // 合击版 #2 英雄获取（40 级，免费）
      if (c) { const cdl = w.companionCooldown(); // 阶段 A：与战斗内 R 键同一逻辑（官方收回后 60 秒冷却）
        row(1, `英雄 ${c.name} · ${COMPANION_MODE_NAME[c.mode]}`, `${CLASSES[c.cls].name} Lv${c.level} · ${c.out ? '召唤中' : cdl > 0 ? `冷却 ${cdl}s` : '已收回'}`, c.out ? '收回' : '召唤', () => { const e = w.toggleCompanion(); this.onChange(e ?? (c.out ? '召唤英雄' : '收回英雄'), !e); this.render(); }, c.out || cdl <= 0, undefined, X + 250); }
      // #5 怒槽/火龙之心显示（爆发结算归战斗开发）
      if (c) { const fi = w.bag.findIndex(b => heartFeedValue(b.item) > 0);
        row(2, `怒槽 ${Math.floor(c.rage)}/${RAGE_MAX}${c.burst ? " 爆发中" : ""}`, c.equip.heart ? `火龙之心 ${c.heartStore}/${HEART_STORE_MAX}` : '未装备火龙之心（学合击后获得）', '补充', () => { const e = w.feedCompanionHeart(fi); this.onChange(e ?? '火龙之心已补充', !e); this.render(); }, !!c.equip.heart && fi >= 0, undefined, X + 250); }
      else CLASS_IDS.forEach((k, i) => row(i + 1, `领取${CLASSES[k].name}英雄`, w.level < COMPANION_UNLOCK_LEVEL ? `${COMPANION_UNLOCK_LEVEL} 级开放 · 免费` : RECRUIT_DIALOG[i % 2].slice(0, 14) + '…', '领取', () => {
        const nm = CLASSES[k].name + '英雄'; // [适配] 起名用默认名（输入框后续做）
        const e = w.recruitCompanion(k, nm); this.onChange(e ?? `获得英雄 ${nm}`, !e); this.render(); }, w.level >= COMPANION_UNLOCK_LEVEL, undefined, X + 250)); }
    if (n.kind === 'teleport' || n.kind === 'veteran') { const ri = (f: number) => { const a = areaOf(f); return a ? WM_IDS.indexOf(a) : 99; }, fl = [...w.reached].sort((a, b) => ri(a) - ri(b) || a - b); // 按世界地图区域分组（docs/world-map-plan.md），全部可滚动
      fl.forEach((f, i) => row(i, `${REGION_GEO[areaOf(f) ?? '']?.name ?? ''}·${w.floors[f].name}`, `${w.teleportCost(f)} 金 · 冷却 ${WorldCls.TELEPORT_CD}s`, '传送', () => { const e = w.townTeleport(f); this.onChange(e ?? `传送到 ${w.floors[f].name}`, !e); if (!e) { this.mode = null; this.close(); this.onTeleport?.(); } else this.render(); }, w.gold >= w.teleportCost(f))); }
    flushCols();
    if (n.kind === 'storage') {
      R.add(txt(s, X, top + 74, `仓库 ${w.storage.length}/${STORAGE_SIZE}：点仓库取回，点背包存入`, 13, '#9fd'));
      for (let i = 0; i < STORAGE_SIZE; i++) { const it = w.storage[i], x = X + 20 + (i % 5) * 46, y = top + 116 + Math.floor(i / 5) * 46;
        this.slotBox(R, x, y, 42, it, '', () => { const e = w.withdraw(i); this.onChange(e ?? `取回 ${it!.name}`, !e); }, 'st_' + i, 46); }
    } else if (this.npcNeedsBag()) R.add(txt(s, X, top + 420, '点右侧背包物品\n→ 卖给该 NPC', 13, '#9fd'));
  }
  /** NPC 面板长列表：每列滚动偏移（行）、拖动状态、待触发按钮、当前可滚动列信息（测试/e2e 读） */
  npcScroll: Record<string, number> = {}; drag: { key: string; y0: number; off0: number; moved: number } | null = null; tapArm: unknown = null;
  scrollInfo: Record<number, { key: string; n: number; vis: number; off: number }> = {};
  /** 指针 → 面板逻辑坐标（手机端 root 有缩放/平移） */
  toPanel(p: Phaser.Input.Pointer) { const r = this.root, k = this.mscale || 1; const lx = toLogicX(p.x), ly = toLogic(p.y); return r ? { x: (lx - r.x) / (r.scaleX || k), y: (ly - r.y) / (r.scaleY || k) } : { x: lx, y: ly }; }
  private mapOff: (() => void)[] = [];
  private clearMapInput() { this.mapOff.forEach(f => f()); this.mapOff = []; }
  /** 传送到某个入口层（沿用 World.teleport 的费用/冷却/战斗中禁用规则） */
  private doTeleport(f: number) {
    const s = this.s, w = this.world(), e = w.teleport(f);
    if (e) { this.onChange(e); sfx(s, 'click', 0.3); this.render(); return; }
    sfx(s, 'coin'); this.close(); this.onChange(`传送到第 ${f + 1} 层 ${w.floors[f].name}`, true); this.onTeleport?.();
  }
  /** 世界大地图状态（视图/区域/展开/确认卡），关面板不清，便于再开回到原处 */
  wm: WMState = newWMState();
  /** Esc/返回：确认卡 → 区域 → 世界 → 关闭；返回 true 表示已处理 */
  back(): boolean { if (this.mode === 'map' && wmBack(this.wm)) { this.render(); return true; } return false; }
  /** 打开世界地图并直接进入某区域（地图总览「在世界地图中查看」） */
  openWorldMap(area: string | null) { this.wm = { ...newWMState(), area }; this.mode = 'map'; this.sel = null; this.render(); }
  private renderMap(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    renderWorldMap({
      s, R, top, w, st: this.wm, render: () => this.render(), alive: () => this.mode === 'map' && !!this.root?.active, msg: t => this.onChange(t),
      teleport: f => this.doTeleport(f), off: fn => this.mapOff.push(fn),
      town: (t, name) => { const e = w.enterTown(t); if (e) { this.onChange(e); this.render(); return; } this.clearMapInput(); this.mode = null; this.close(); this.onTeleport?.(); this.onChange(`进入 ${name}`, true); },
    });
  }
  private renderQuests(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 200, top + 55, '本层悬赏', 18, '#ffd24a', { fontStyle: 'bold' }));
    const list = QUESTS.filter(q => q.floor === w.floorIndex || w.reached.has(q.floor) || (w.questProg[q.id] ?? 0) > 0);
    const show = (list.length ? list : QUESTS.filter(q => q.floor === w.floorIndex)).slice(0, 5);
    const rows = show.length ? show : [QUESTS[Math.min(w.floorIndex, QUESTS.length - 1)]];
    const QP = listRowPitch(IS_MOBILE, 58, this.cssU());
    rows.forEach((q, i) => {
      const y = top + 95 + (QP - 58) / 2 + i * QP, prog = w.questProg[q.id] ?? 0, done = w.questDone.has(q.id);
      const en = ENEMIES[q.target], fl = FLOORS[q.floor];
      R.add(rowBg(s, 400, y, 460, QP - 6, !done && prog >= q.need, { fill: 0x0a0806, stroke: done ? 0x3a6a3a : prog >= q.need ? 0x6a5a28 : 0x4a3a28 }));
      R.add(txt(s, 190, y - 14, `${q.name}（第${q.floor + 1}层 ${fl?.name ?? ''}）`, 15, done ? '#8f8' : '#ffe8a0'));
      R.add(txt(s, 190, y + 6, `击杀 ${en?.name ?? q.target}  ${Math.min(prog, q.need)}/${q.need}    奖 ${q.gold}金/${fmtExp(scaledExp(q.exp, q.floor))}经验`, 13, '#bbb', { strokeThickness: 2 }));
      if (done) R.add(txt(s, 580, y, '已完成', 14, '#8f8').setOrigin(0.5));
      else if (prog >= q.need) R.add([...this.fitRow(button(s, 580, y, 80, 32, '交付', () => { const m = w.claimQuest(q.id); sfx(s, 'coin'); this.onChange(m, true); this.render(); }, 15), QP)]);
      else R.add(txt(s, 580, y, '进行中', 13, '#888').setOrigin(0.5));
    });
    R.add(txt(s, 780, top + 55, '成就称号', 18, '#ffd24a', { fontStyle: 'bold' }));
    ACHIEVES.forEach((a, i) => {
      const y = top + 95 + i * 48, got = w.achieves.has(a.id);
      R.add(rowBg(s, 980, y, 360, 44, got, { fill: 0x0a0806, stroke: got ? 0x3a6a3a : 0x333 }));
      R.add(txt(s, 820, y - (IS_MOBILE ? 21 : 10), `${got ? '【' + a.title + '】' : a.name}`, 14, got ? '#ffd24a' : '#888'));
      R.add(txt(s, 820, y + (IS_MOBILE ? 1 : 8), a.desc + (got ? '  ✓' : ''), 12, got ? '#9f9' : '#666', { strokeThickness: 2 }));
    });
    R.add(txt(s, 640, top + 455, '悬赏按层击杀目标怪；成就永久加属性。按 Q 关闭', 13, '#9fd').setOrigin(0.5));
  }
  private renderSettings(R: Phaser.GameObjects.Container, top: number) {
    const w = this.world();
    renderSettingsView(this.s, R, top, {
      cls: w.cls, learned: w.learned, rerender: () => this.render(),
      footer: [{ label: '保存并返回标题', w: 180, fn: () => { this.close(); this.onTitle(); } }, { label: '切换存档', w: 140, fn: () => { this.close(); this.s.game.registry.set('openSlots', true); this.onTitle(); } }, { label: '继续游戏', w: 140, fn: () => this.close() }],
    });
  }
  showTip(it: InvItem, x: number, y: number, touch = false) {
    this.hideTip(); const s = this.s, w = this.world();
    const lines: [string, string][] = [[it.name, RARITY_HEX[it.rarity]], [`${it.slot ? SLOT_NAMES[it.slot] : '杂物'} · ${RARITY_CN[it.rarity]}`, '#aaa']];
    for (const [k, v] of Object.entries(it.stats)) if (v) lines.push([`${STAT_NAMES[k as keyof typeof STAT_NAMES]} +${v}`, '#7aff7a']);
    if (it.luck) lines.push([it.luck > 0 ? `幸运 +${it.luck}` : `诅咒 ${-it.luck}`, it.luck > 0 ? '#ffd24a' : '#ff4040']);
    { const cl = ITEMS[it.item]?.cls; if (cl?.length && !cl.includes(w.cls)) lines.push([`职业不符：${cl.map(c => CLASSES[c].name).join('/')}专用，无法装备`, '#f66']); }
    if (ITEMS[it.item]?.book) { const sk = w.skillPool.find(x => x.id === ITEMS[it.item].book); lines.push([sk ? (w.learned.has(sk.id) ? '已学会（可出售）' : `点击学习（需 Lv${w.needLevel(sk)}）`) : '非本职业技能书', '#9fd']); }
    if (it.item === 'bless_oil') lines.push(['点击：作用于当前武器（幸运+1，上限7，可能诅咒）', '#9fd']);
    if (it.item === 'black_iron') lines.push([`纯度 ${it.purity ?? 1} ×${it.qty ?? 1}：点装备栏强化；再点可提纯`, '#9fd']);
    if (it.enhance) lines.push([`强化 +${it.enhance}（上限 +${ENHANCE_MAX}）`, '#c8c8ff']);
    if (it.slot && ENHANCE_SLOTS.includes(it.slot as any) && (it.enhance ?? 0) < ENHANCE_MAX) lines.push(['可用黑铁矿石强化（武器/头盔/衣服/靴）', '#9ab']);
    const sd = ITEMS[it.item]?.set ? SETS[ITEMS[it.item].set!] : undefined;
    if (sd) { const n = w.setCounts()[sd.id] ?? 0; lines.push([`【${sd.name}套装】已穿 ${n}/${sd.pieces.length}`, '#ffb040']);
      for (const b of sd.bonus) { const [t0, sp] = b.text.split('；特效：'), cc = n >= b.n ? '#7aff7a' : '#777'; lines.push([`  ${b.n}件：${t0}`, cc]); if (sp) lines.push([`     特效：${sp}`, cc]); } }
    if (it.slot) {
      lines.push([`需要等级 ${it.req}`, w.level >= it.req ? '#fff' : '#ff4040']);
      const cl = ITEMS[it.item]?.cls;
      if (cl?.length) lines.push([`职业：${cl.map(c => CLASSES[c].name).join('/')}`, cl.includes(w.cls) ? '#fff' : '#ff4040']);
    }
    lines.push([`售价 ${it.price} 金币`, '#ffd24a']);
    if (touch) lines.push([this.mode === 'shop' ? '再点一次：出售' : it.slot && this.sel?.startsWith('eq_') ? '再点一次：卸下' : it.slot ? '再点一次：装备' : BUNDLES[it.item] ? '再点一次：解开（6 瓶）' : '不可装备', '#9fd']);
    { const cd = it.slot ? compareRows(it, w.equip) : null; if (cd) { this.showCompare(it, cd, lines.slice(2).filter(([t]) => !/^需要等级|^(生命|魔法值|攻击|魔法|道术|防御|魔御) \+/.test(t)), x, y, touch); return; } }
    const c = this.tip = s.add.container(Math.min(x, 1280 - 230), Math.max(10, Math.min(y, 720 - lines.length * 20 - 20))).setDepth(300);
    const bg = frameBg(s, 'tooltip_frame', 0, 0, 220, lines.length * 20 + 16, { fill: 0x05060c, alpha: 0.95, stroke: 0x9a9aa8, sw: 2 }, 0, 0).setName('tipBg');
    // 背包预览：悬停/选中背包里的衣服或武器时，在提示框旁显示「试穿」效果（不改真实装备）
    if (it.slot === 'armor' || it.slot === 'weapon') {
      const cls = w.cls, art = CLASSES[cls].art, eq = { ...w.equip, [it.slot]: it };
      const look = equipLook(s, cls, art, eq, () => { if (this.tip === c) this.showTip(it, x, y, touch); });
      if (look.state === 'composed') {
        const px = c.x + 220 + 110 > 1280 ? -116 : 226;
        c.add(frameBg(s, 'tooltip_frame', px, 0, 110, 150, { fill: 0x05060c, alpha: 0.95, stroke: 0x9a9aa8, sw: 2 }, 0, 0));
        const im = s.add.image(px + 55, 146, look.key).setOrigin(0.5, 1).setName('bagPreview'); im.setScale(Math.min(140 / im.height, 104 / im.width)); c.add(im);
        c.add(txt(s, px + 55, 4, '试穿', 12, '#9fd', { strokeThickness: 2 }).setOrigin(0.5, 0));
      }
    }
    c.add(bg); lines.forEach(([t, col], i) => c.add(txt(s, 10, 8 + i * 20, t, i === 0 ? 16 : 14, col, { strokeThickness: 2, fontStyle: i === 0 ? 'bold' : '' })));
  }
  /** 装备对比改版：左右并排（左=身上同部位，右=查看中的装备），属性逐行对齐，差值涨绿降红。docs/equip-compare.md */
  private showCompare(it: InvItem, cd: CmpData, extra: [string, string][], x: number, y: number, touch: boolean) {
    const s = this.s, M = IS_MOBILE, fs = M ? 26 : 14, lh = M ? 34 : 20, cw = M ? 320 : 210, gap = 12, pad = 10, icon = M ? 56 : 40, W = cw * 2 + gap + pad * 2;
    const head = lh + icon + 10, H = pad * 2 + head + cd.rows.length * lh + 8 + extra.length * lh + (cd.other ? lh : 0);
    const px = M ? 640 - W / 2 : Math.max(10, Math.min(x, 1280 - W - 10)), py = M ? Math.max(4, 360 - H / 2) : Math.max(10, Math.min(y, 720 - H - 10));
    const c = this.tip = s.add.container(px, py).setDepth(300).setName('equipCompare');
    c.add(frameBg(s, 'tooltip_frame', 0, 0, W, H, { fill: 0x05060c, alpha: 0.96, stroke: 0x9a9aa8, sw: 2 }, 0, 0).setName('cmpBg'));
    const col = (cx: number, item: InvItem | null, title: string) => {
      c.add(txt(s, cx, pad, title, fs - 2, '#9fd', { strokeThickness: 2 }));
      const iy = pad + lh; { const q = item && atlasReady(s, 'slot') ? qualityFrame(s, cx + icon / 2, iy + icon / 2, icon, item.rarity) : null; c.add(s.add.rectangle(cx + icon / 2, iy + icon / 2, icon, icon, 0x0a0806).setStrokeStyle(q ? 0 : 2, item ? RARITY_NUM[item.rarity] : 0x4a3a28)); if (q) c.add(q); }
      if (item && s.textures.exists('item_' + item.item)) c.add(s.add.image(cx + icon / 2, iy + icon / 2, 'item_' + item.item).setDisplaySize(icon - 6, icon - 6));
      const nm = item ? item.name + (item.enhance ? ` +${item.enhance}` : '') : '空';
      c.add(txt(s, cx + icon + 8, iy, nm, fs, item ? RARITY_HEX[item.rarity] : '#888', { strokeThickness: 2, fontStyle: 'bold' }).setName(title === '身上' ? 'cmpLeftName' : 'cmpRightName'));
      c.add(txt(s, cx + icon + 8, iy + lh, item ? `${RARITY_CN[item.rarity]} · ${SLOT_NAMES[item.slot!]}` : '未穿戴', fs - 2, '#aaa', { strokeThickness: 2 }));
    };
    col(pad, cd.left, '身上'); col(pad + cw + gap, it, '查看中');
    { const dh = H - pad * 2 - extra.length * lh; c.add(atlasReady(s, 'divider_v') && dh >= 80 ? frameBg(s, 'divider_v', pad + cw + gap / 2, pad, 8, dh, { fill: 0x555566 }, 0.5, 0) : s.add.rectangle(pad + cw + gap / 2, pad, 1, dh, 0x555566).setOrigin(0.5, 0)); }
    let yy = pad + head;
    cd.rows.forEach((r, i) => {
      if (i % 2 === 0) c.add(s.add.rectangle(pad, yy - 2, W - pad * 2, lh, 0xffffff, 0.04).setOrigin(0));
      c.add(txt(s, pad, yy, r.label, fs, '#ccc', { strokeThickness: 2 }));
      c.add(txt(s, pad + cw - 4, yy, r.left, fs, '#fff', { strokeThickness: 2 }).setOrigin(1, 0));
      c.add(txt(s, pad + cw + gap, yy, r.label, fs, '#ccc', { strokeThickness: 2 }));
      const d = diffText(r);
      c.add(txt(s, pad + cw * 2 + gap - (M ? 80 : 54), yy, r.right, fs, r.key === 'req' && +r.right > this.world().level ? '#ff4040' : '#fff', { strokeThickness: 2 }).setOrigin(1, 0));
      c.add(txt(s, pad + cw * 2 + gap, yy, d || '新', fs, r.color, { strokeThickness: 2, fontStyle: 'bold' }).setOrigin(1, 0).setName('cmpDiff_' + r.key));
      yy += lh;
    });
    if (cd.other) { c.add(txt(s, pad, yy, `另一件：${cd.other.name}（较强，保留）`, fs - 2, '#999', { strokeThickness: 2 })); yy += lh; }
    yy += 8; extra.forEach(([t, cl]) => { c.add(txt(s, pad, yy, t, fs - 2, cl, { strokeThickness: 2 })); yy += lh; });
  }
  hideTip() { this.tip?.destroy(true); this.tip = undefined; }
}
