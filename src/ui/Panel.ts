import { COMPANION_MODE_NAME } from '../data/companion';
import { COMPANION_UNLOCK_LEVEL, comboFor, BOOK_PAGE, BRM_BOOK, GOLD_BAR, PAGES_PER_BOOK, COMBO_LEVEL, heartFeedValue, RAGE_MAX, HEART_STORE_MAX, RECRUIT_DIALOG } from '../data/companion';
import { toLogic } from '../render';
import { RING_MIN_LEVEL, IDENT_PRICE, IDENT_MIN_LEVEL } from '../data/r14b';
import { fmtExp, scaledExp } from '../data/expCurve';
import Phaser from 'phaser';
import type { World } from '../combat/World';
import { EquipSlot, InvItem, Slot } from '../combat/types';
import { EQUIP_SLOTS, EQUIP_SLOT_NAMES, SLOT_NAMES, STAT_NAMES, ITEMS, SETS, ENHANCE_SLOTS, ENHANCE_MAX, IRON_PRICE } from '../data/items';
import { OIL_PRICE } from '../combat/World';
import { POTIONS } from '../data/skills';
import { WORLD } from '../data/world';
import { CLASSES, CLASS_IDS } from '../data/classes';
export const BAG_PAGE = 30;
import { renderSettingsView } from './SettingsView';
import { txt, button, sfx } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';
import { REGIONS, floorBoss, regionOf, clampView, zoomAt, WORLD_W, WORLD_H, View } from '../data/map';
import { QUESTS, ACHIEVES } from '../data/quests';
import { ENEMIES } from '../data/units';
import { FLOORS, floorNo } from '../data/world';
import { World as WorldCls } from '../combat/World';
import { BOOKS } from '../data/books';
import { TOWNS, NODE_TOWN, STORAGE_SIZE, NPC_ART } from '../data/towns';
import { CONSUMABLE } from '../data/items-town';
import { Settings, DEFAULT_AUTO_SKILLS } from '../settings';
import { equipLook } from './EquipLayers';

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
  /** 背包分页（200 格，每页 BAG_PAGE 格） */
  bagPage = 0;
  /** 商店分页：杂货 / 书店（R11 技能书） */
  shopTab: 'goods' | 'books' = 'goods';
  onTeleport?: () => void;
  /** R14 城镇：当前选中的 NPC id */
  npc: string | null = null;
  constructor(public s: Phaser.Scene, public world: () => World, public onChange: (msg?: string, green?: boolean) => void, public onTitle: () => void) {}
  /** 长街门口进店：打开该 NPC 的商店/功能界面 */
  openNpc(id: string) { this.mode = 'town'; this.npc = id; this.sel = null; this.region = null; this.render(); }
  get open() { return this.mode !== null; }
  toggle(m: PanelMode) { if (this.mode === m) this.close(); else { this.mode = m; this.sel = null; this.region = null; this.render(); } }
  close() {
    // R14 横版长街：关闭店铺界面 = 回到街上（出城走西端城门）
    if (this.mode === 'town') this.npc = null;
    this.clearMapInput(); this.sel = null; this.ironIdx = null; this.mode = null; this.root?.destroy(true); this.root = undefined; this.hideTip(); }
  /** #11 修复：面板打开时升级/得经验不刷新。render 时记录快照，UIScene.update 每帧比对 */
  private snap = '';
  statSnap() { const w = this.world(); return `${w.level}:${w.exp}:${JSON.stringify(w.skillTrain)}:${w.learned.size}`; }
  /** 角色/技能面板数据变了就重绘；返回是否重绘（供测试） */
  refreshIfStale(): boolean {
    if (this.mode !== 'bag' && this.mode !== 'skills') return false;
    if (this.statSnap() === this.snap) return false;
    this.render(); return true;
  }
  render() {
    if (this.mode) this.snap = this.statSnap();
    this.root?.destroy(true); this.hideTip(); this.clearMapInput();
    if (!this.mode) return;
    const s = this.s, R = this.root = s.add.container(0, 0).setDepth(200);
    R.add(s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45).setInteractive());
    const W = this.mode === 'settings' ? 640 : 1000, H = this.mode === 'settings' ? 580 : 500, top = Math.max(40, 360 - H / 2);
    // 边框与内容对齐：非设置面板内容从 top 起排到 top+478，边框覆盖 top-20 ~ top+480
    R.add(s.add.rectangle(640, this.mode === 'settings' ? 300 : top + H / 2 - 20, W, H, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
    const titles = { bag: '角色 / 背包', shop: '商人 · 杂货铺', skills: '技能', settings: '设置', map: '世界地图', quests: '悬赏 / 成就', town: `${TOWNS[this.world().town ?? 'bichi']?.name ?? '城镇'} · 安全区` };
    R.add(txt(s, 640, top + 22, titles[this.mode], 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
    R.add([...button(s, 640 + W / 2 - 26, top + 22, 36, 32, '✕', () => this.close(), 18)]);
    if (this.mode === 'settings') return this.renderSettings(R, top);
    if (this.mode === 'skills') return this.renderSkills(R, top);
    if (this.mode === 'map') return this.renderMap(R, top);
    if (this.mode === 'quests') return this.renderQuests(R, top);
    if (this.mode === 'town') { this.renderTown(R, top); if (this.npcNeedsBag()) this.renderBag(R, top); return; }
    if (this.mode === 'bag') this.renderEquip(R, top); else this.renderShop(R, top);
    this.renderBag(R, top);
  }
  private slotBox(R: Phaser.GameObjects.Container, x: number, y: number, size: number, it: InvItem | undefined, label: string, onClick: (right: boolean) => void, key = '') {
    const s = this.s;
    const selected = IS_MOBILE && !!it && this.sel === key;
    const r = s.add.rectangle(x, y, size, size, 0x0a0806).setStrokeStyle(2, it ? RARITY_NUM[it.rarity] : 0x4a3a28);
    R.add(r);
    if (it && s.textures.exists('item_' + it.item)) R.add(s.add.image(x, y, 'item_' + it.item).setDisplaySize(size - 8, size - 8));
    else if (label) R.add(txt(s, x, y, label, 12, '#6a5a40', { strokeThickness: 0 }).setOrigin(0.5));
    if (it?.enhance) R.add(txt(s, x + size / 2 - 4, y + size / 2 - 10, '+' + it.enhance, 12, '#c8f0ff', { fontStyle: 'bold', strokeThickness: 3 }).setOrigin(1, 0.5));
    if (it?.item === 'black_iron') { R.add(txt(s, x + size / 2 - 2, y + size / 2 - 8, '+' + (it.purity ?? 1), 11, '#aaf', { fontStyle: 'bold', strokeThickness: 2 }).setOrigin(1, 0.5)); if ((it.qty ?? 1) > 1) R.add(txt(s, x - size / 2 + 4, y + size / 2 - 8, '×' + (it.qty ?? 1), 11, '#ffe8a0', { fontStyle: 'bold', strokeThickness: 2 }).setOrigin(0, 0.5)); }
    // 套装激活角标：已装备且该套装至少触发一档加成
    const setId = it && key.startsWith('eq_') ? ITEMS[it.item]?.set : undefined;
    if (setId && SETS[setId] && (this.world().setCounts()[setId] ?? 0) >= Math.min(...SETS[setId].bonus.map(b => b.n)) && s.textures.exists('set_badge'))
      R.add(s.add.image(x + size / 2 - 10, y - size / 2 + 10, 'set_badge').setDisplaySize(22, 22));
    if (selected) { r.setStrokeStyle(4, 0xffe080); s.time.delayedCall(0, () => it && this.root && this.showTip(it, x + size / 2 + 6, y - size / 2, true)); }
    r.setInteractive({ useHandCursor: !!it });
    if (!IS_MOBILE) r.on('pointerover', () => { r.setFillStyle(0x2a2016); if (it) this.showTip(it, x + size / 2 + 6, y - size / 2); });
    if (!IS_MOBILE) r.on('pointerout', () => { r.setFillStyle(0x0a0806); this.hideTip(); });
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
    R.add(s.add.rectangle(cx, top + 210, 170, 260, c.bg).setStrokeStyle(2, 0xb8a070));
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
      }, 'eq_' + sl);
    }
    const st = w.stats(), h = w.hero;
    const title = w.title(); const lines = [`${c.name}  Lv${w.level}${title ? '  「' + title + '」' : ''}`, `经验 ${fmtExp(w.exp)}/${fmtExp(w.expNext)}   金币 ${w.gold}   击杀 ${w.kills}`, `生命 ${h ? Math.ceil(h.hp) : 0}/${st.hp}   魔法 ${h ? Math.floor(h.mp ?? 0) : 0}/${st.mp}`,
      `攻击 ${st.atk}   魔法 ${st.mag}   道术 ${st.tao}   防御 ${Math.round(st.def)}   魔御 ${Math.round(st.mdef ?? 0)}   幸运 ${w.luck()}`];
    const sc = w.setCounts(), setLine = Object.values(SETS).filter(st => sc[st.id]).map(st => `${st.name}${sc[st.id]}/${st.pieces.length}`).join('  ');
    if (setLine) lines.push(`套装 ${setLine}`);
    R.add(txt(s, 175, top + 345, lines.join('\n'), 15, '#ffe8a0', { lineSpacing: setLine ? 2 : 6, strokeThickness: 2 }));
    R.add(txt(s, cx + 130, top + 270, IS_MOBILE ? '点两下\n装备栏=卸下' : '点击装备栏\n= 卸下', 12, '#999', { align: 'center' }).setOrigin(0.5, 0));
  }
  private renderShop(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 175, top + 60, `金币：${w.gold}`, 20, '#ffd24a'));
    (['goods', 'books'] as const).forEach((t, i) => R.add([...button(s, 395 + i * 84, top + 72, 76, 32, `${this.shopTab === t ? '▶' : ''}${t === 'goods' ? '杂货' : '书店'}`, () => { this.shopTab = t; this.render(); }, 15)]));
    if (this.shopTab === 'books') return this.renderBooks(R, top);
    POTIONS.forEach((p, i) => {
      const y = top + 112 + i * 62, it = ITEMS[p.item];
      R.add(s.add.rectangle(330, y, 320, 56, 0x0a0806).setStrokeStyle(1, 0x4a3a28));
      if (s.textures.exists('item_' + p.item)) R.add(s.add.image(200, y, 'item_' + p.item).setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, it.name, 16, '#fff'));
      R.add(txt(s, 232, y + 2, `${p.hp ? '恢复生命 ' + p.hp : '恢复魔法 ' + p.mp}   ${p.price} 金   持有 ${w.pots[i]}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...button(s, 448, y, 64, 34, '购买', () => { const e = w.buyPotion(i); if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${it.name}`, !e); this.render(); }, 16, w.gold >= p.price)]);
    });
    { const y = top + 112 + POTIONS.length * 62, it = ITEMS.bless_oil, sold = w.oilBoughtFloor === w.floorIndex;
      R.add(s.add.rectangle(330, y, 320, 56, 0x0a0806).setStrokeStyle(1, 0x6a5a28));
      if (s.textures.exists('item_bless_oil')) R.add(s.add.image(200, y, 'item_bless_oil').setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, it.name, 16, '#ffd24a'));
      R.add(txt(s, 232, y + 2, `武器幸运+1   ${OIL_PRICE} 金   ${sold ? '本层已购' : '每层限购 1'}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...button(s, 448, y, 64, 34, '购买', () => { const e = w.buyOil(); if (!e) sfx(s, 'coin'); this.onChange(e ?? '购买 祝福油', !e); this.render(); }, 16, !sold && w.gold >= OIL_PRICE)]); }
    { const y = top + 112 + (POTIONS.length + 1) * 62, it = ITEMS.black_iron;
      const left = w.ironBoughtFloor === w.floorIndex ? Math.max(0, 5 - w.ironBoughtCount) : 5;
      R.add(s.add.rectangle(330, y, 320, 56, 0x0a0806).setStrokeStyle(1, 0x4a3a28));
      if (s.textures.exists('item_black_iron')) R.add(s.add.image(200, y, 'item_black_iron').setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, '黑铁矿石[+1]', 16, '#c8c8ff'));
      R.add(txt(s, 232, y + 2, `强化装备   ${IRON_PRICE} 金   本层剩 ${left}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...button(s, 448, y, 64, 34, '购买', () => { const e = w.buyIron(); if (!e) sfx(s, 'coin'); this.onChange(e ?? '购买 黑铁矿石', !e); this.render(); }, 16, left > 0 && w.gold >= IRON_PRICE)]); }
    R.add(txt(s, 175, top + 430, '点击右侧背包物品出售（按售价）', 14, '#9fd'));
  }
  /** 书店：本职业有售的技能书（原版比奇书店；掉落书不卖） */
  private renderBooks(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    w.shopBooks().forEach((b, i) => {
      const y = top + 130 + i * 62, sk = w.skillPool.find(x => x.id === b.skill)!, id = 'book_' + b.skill, learned = w.learned.has(b.skill), need = w.needLevel(sk);
      R.add(s.add.rectangle(330, y, 320, 56, 0x0a0806).setStrokeStyle(1, 0x6a5a28));
      if (s.textures.exists('item_' + id)) R.add(s.add.image(200, y, 'item_' + id).setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, ITEMS[id].name, 15, learned ? '#888' : '#ffd24a'));
      R.add(txt(s, 232, y + 2, `${learned ? '已学会' : `需 Lv${need}`}   ${b.price} 金`, 13, w.level >= need ? '#ccc' : '#f99', { strokeThickness: 2 }));
      R.add([...button(s, 448, y, 64, 34, '购买', () => { const e = w.buyBook(b.skill); if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${ITEMS[id].name}（背包中点击学习）`, !e); this.render(); }, 15, !learned && w.gold >= b.price)]);
    });
    const drops = Object.values(BOOKS).filter(b => b.cls === w.cls && !b.shop).map(b => w.skillPool.find(x => x.id === b.skill)!.name);
    R.add(txt(s, 175, top + 130 + w.shopBooks().length * 62 - 10, `打怪掉落（书店不卖）：${drops.join('、')}`, 13, '#c9a'));
    R.add(txt(s, 175, top + 430, '买书后在背包里点击技能书学习（需达到等级）', 14, '#9fd'));
  }
  private renderBag(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cols = 6, size = 56, x0 = 600, y0 = top + 100;
    R.add(txt(s, x0 - size / 2, top + 50, `背包 ${w.bag.length}/${WORLD.bagSize}`, 15, '#ffe8a0'));
    const pages = Math.ceil(WORLD.bagSize / BAG_PAGE); this.bagPage = Math.max(0, Math.min(pages - 1, this.bagPage));
    const go = (d: number) => { this.bagPage = (this.bagPage + d + pages) % pages; this.sel = null; this.render(); };
    R.add([...button(s, x0 + 150, top + 52, 40, 30, '◀', () => go(-1), 15)]);
    R.add(txt(s, x0 + 175, top + 50, `${this.bagPage + 1}/${pages}`, 15, '#ffe8a0'));
    R.add([...button(s, x0 + 250, top + 52, 40, 30, '▶', () => go(1), 15)]);
    R.add([...button(s, x0 + 360, top + 52, 56, 30, '整理', () => { w.sortBag(); this.bagPage = 0; this.sel = null; this.hideTip(); this.render(); }, 13)]);
    R.add([...button(s, x0 + 300, top + 52, 50, 30, '末页', () => { this.bagPage = Math.floor(Math.max(0, w.bag.length - 1) / BAG_PAGE); this.render(); }, 13)]);
    const p0 = this.bagPage * BAG_PAGE;
    for (let i = p0; i < Math.min(WORLD.bagSize, p0 + BAG_PAGE); i++) {
      const it = w.bag[i], k = i - p0, x = x0 + (k % cols) * (size + 6), y = y0 + Math.floor(k / cols) * (size + 6);
      this.slotBox(R, x, y, size, it, '', right => {
        if (this.mode === 'shop' || this.npcKind() && this.npcKind() !== 'storage') { const g = w.sellItem(i); sfx(s, 'coin'); this.onChange(`出售 ${it!.name} 获得 ${g} 金币`, true); }
        else if (this.npcKind() === 'storage') { const e = w.deposit(i); this.onChange(e ?? `存入 ${it!.name}`, !e); }
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
      }, 'bag_' + i);
    }
    if (IS_MOBILE && this.mode === 'bag' && this.sel?.startsWith('bag_')) { const i = Number(this.sel.slice(4)), it = w.bag[i]; if (it) R.add([...button(s, x0 + 5 * (size + 6), top + 470, 80, 34, '丢弃', () => { w.dropItem(i); this.sel = null; this.onChange(`丢弃 ${it.name}`); this.render(); }, 16)]); }
    R.add(txt(s, x0 - size / 2, top + 452, this.ironIdx != null ? '黑铁已选：点击左侧武器/头盔/衣服/靴子强化；再点同纯度矿提纯' : IS_MOBILE ? (this.mode === 'shop' ? '点一下查看属性，再点一下出售' : '点一下查看属性，再点一下装备；选中后可「丢弃」') : this.mode === 'shop' ? '左键出售' : '左键装备   右键丢弃   悬停查看属性', 12, this.ironIdx != null ? '#9fd' : '#999'));
  }
  /** R14 技能页：查看（详情/各级数值/耗魔/冷却）· 升级（官方修炼规则）· 放置（拖放排快捷栏）· 自动（勾选+优先级） */
  private renderSkills(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    const bar = w.skills, barIdx = new Map(bar.map((k, i) => [k.id, i]));
    const list = [...bar, ...w.skillPool.filter(k => !barIdx.has(k.id))];
    const autoList = Settings.skillsFor(w.cls), autoable = new Set(DEFAULT_AUTO_SKILLS[w.cls]);
    const rowH = Math.min(70, Math.floor(400 / Math.max(1, list.length))), y0 = top + 48 + rowH / 2, fs = rowH < 56 ? 12 : 13;
    list.forEach((k, i) => {
      const y = y0 + i * rowH, inBar = barIdx.has(k.id);
      const need = w.needLevel(k), lv = w.skillLevel(k), locked = lv < 0, pts = w.skillTrain[k.id] ?? 0, learned = w.learned.has(k.id), bk = BOOKS[k.id];
      R.add(s.add.rectangle(560, y, 820, rowH - 4, 0x0a0806, 0.9).setStrokeStyle(1, 0x3a2a18));
      if (s.textures.exists('sk_' + k.id)) R.add(s.add.image(178, y, 'sk_' + k.id).setDisplaySize(rowH - 14, rowH - 14));
      const fk = inBar ? `F${barIdx.get(k.id)! + 1}` : k.passive ? '被动' : '未上栏';
      R.add(txt(s, 212, y - rowH / 2 + 4, `[${fk}] ${k.name}${!learned ? `（未学：${bk?.shop ? '书店购买' : bk?.drops.length ? '打怪掉落' : '暂未开放获取'}技能书 · 需 Lv${need}）` : locked ? `（需人物 Lv${need}）` : `  ${lv} 级`}`, fs + 2, locked ? '#888' : '#ffe8a0', { strokeThickness: 2 }));
      const lvVals = k.lvMult ? k.lvMult.map(m => Math.round(m * 100) + '%') : k.lvBonus ? k.lvBonus.map(b => '+' + b) : k.accBonus ? k.accBonus.map(b => '准确+' + b) : [0, 1, 2, 3].map(l => `+${l * 10}%`);
      // #11：10 技能时行高 40，压成两行（简述 + 耗魔/冷却/修炼），避免与下一行重叠、挤到右侧按钮
      const compact = rowH < 50;
      if (!compact) R.add(txt(s, 212, y - rowH / 2 + 4 + fs + 5, `${k.desc}  各级：${lvVals.map((v, l) => `${l}级${v}`).join(' ')}`.slice(0, 64), fs, locked ? '#777' : '#ddd', { strokeThickness: 2 }));
      const up = lv >= 0 && lv < 3 && k.learn && k.train ? `升级：人物Lv${k.learn[lv + 1]} + 修炼点${k.train[lv]}` : lv === 3 ? '已满级' : '';
      if (compact) R.add(txt(s, 212, y - rowH / 2 + 4 + fs + 5, `${k.passive ? '无需施放' : `耗魔${k.mana} 冷却${k.cooldown}s`} 修炼${pts}${k.train ? '/' + k.train[2] : ''} ${up}  ${k.desc}`.slice(0, 46), fs, locked ? '#777' : '#9fd', { strokeThickness: 2 }));
      else R.add(txt(s, 212, y - rowH / 2 + 4 + (fs + 5) * 2, `${k.passive ? '无需施放' : `耗魔 ${k.mana}  冷却 ${k.cooldown}s`}  修炼点 ${pts}${k.train ? '/' + k.train[2] : ''}  ${up}`, fs, locked ? '#666' : '#9fd', { strokeThickness: 2 }));
      // 修炼进度条（官方：修炼点达到下一级要求 + 人物等级达到即自动升级）
      if (k.train && lv >= 0 && lv < 3) { const p = Math.min(1, pts / k.train[lv]); R.add(s.add.rectangle(212, y + rowH / 2 - 6, 220, 4, 0x333333).setOrigin(0, 0.5)); R.add(s.add.rectangle(212, y + rowH / 2 - 6, 220 * p, 4, 0x55cc77).setOrigin(0, 0.5)); }
      if (inBar) {
        const bi = barIdx.get(k.id)!;
        R.add([...button(s, 800, y, 36, rowH - 18, '▲', () => { w.moveSkill(k.id, bi - 1); this.render(); }, 14, bi > 0)]);
        R.add([...button(s, 840, y, 36, rowH - 18, '▼', () => { w.moveSkill(k.id, bi + 1); this.render(); }, 14, bi < bar.length - 1)]);
        // 拖放：按住 ≡ 上下拖到目标行松开
        const hd = s.add.rectangle(890, y, 44, rowH - 12, 0x3a2a14).setStrokeStyle(1, 0xd4a64a).setInteractive({ draggable: true, useHandCursor: true });
        const ht = txt(s, 890, y, '≡', 22, '#ffd24a').setOrigin(0.5); R.add([hd, ht]); s.input.setDraggable(hd);
        hd.on('drag', (_p: Phaser.Input.Pointer, _x: number, dy: number) => { hd.y = dy; ht.y = dy; });
        hd.on('dragend', () => { const to = Math.max(0, Math.min(bar.length - 1, Math.round((hd.y - y0) / rowH))); if (to !== bi) { w.moveSkill(k.id, to); this.onChange(`${k.name} 移到 F${to + 1}`, true); } this.render(); });
        if (autoable.has(k.id)) {
          const on = autoList.includes(k.id), pr = autoList.indexOf(k.id);
          R.add([...button(s, 975, y, 96, rowH - 18, `${on ? '☑' : '☐'} 自动${on ? ' #' + (pr + 1) : ''}`, () => { Settings.toggleAutoSkill(k.id, w.cls); this.render(); }, 13)]);
          R.add([...button(s, 1045, y, 32, rowH - 18, '↑', () => { Settings.moveAutoSkill(k.id, -1, w.cls); this.render(); }, 13, on && pr > 0)]);
          R.add([...button(s, 1081, y, 32, rowH - 18, '↓', () => { Settings.moveAutoSkill(k.id, 1, w.cls); this.render(); }, 13, on && pr < autoList.length - 1)]);
        } else R.add(txt(s, 975, y, '手动', 12, '#888').setOrigin(0.5));
      }
    });
    R.add(txt(s, 160, top + 452, `▲▼/拖动≡ 调整快捷栏；☑自动 与设置页同一份，#n 为自动优先级。学习等级/修炼点取自 1.76 官方，修炼满足后自动升级；耗魔×3；轻量冷却 1.5–6s + 公共施法间隔 0.8s（适配）。等级加成 ×${w.skillScale().toFixed(2)}`, 12, '#aaa', { wordWrap: { width: 960 } }));
  }
  // ---------- R14 城镇 ----------
  private npcDef() { const t = TOWNS[this.world().town ?? '']; return t?.npcs.find(n => n.id === this.npc); }
  npcKind() { return this.mode === 'town' ? this.npcDef()?.kind : undefined; }
  private npcNeedsBag() { const k = this.npcKind(); return !!k && k !== 'teleport' && k !== 'book' && k !== 'veteran'; }
  private renderTown(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), t = TOWNS[w.town ?? ''];
    if (!t) { R.add(txt(s, 640, top + 200, '不在城内', 20, '#fff').setOrigin(0.5)); return; }
    if (s.textures.exists('bg_town')) R.add(s.add.image(640, top + 240, 'bg_town').setDisplaySize(996, 460).setAlpha(0.35));
    R.add(txt(s, 160, top + 14, `金币 ${w.gold}   安全区`, 14, '#ffd24a'));
    const cur = this.npcDef(), art = cur && 'npc_' + NPC_ART[cur.kind];
    if (art && s.textures.exists(art)) R.add(s.add.image(240, top + 400, art).setOrigin(0.5, 1).setDisplaySize(200, 250));
    else if (cur) { R.add(s.add.rectangle(240, top + 275, 200, 250, 0x2a2018).setStrokeStyle(2, 0x6a5a28)); R.add(txt(s, 240, top + 275, cur.name.replace(/（.*）/, ''), 16, '#ffe8a0').setOrigin(0.5)); }
    R.add([...button(s, 240, top + 448, 170, 36, '回到街上', () => this.close(), 16)]);
    const n = this.npcDef(), X = 340;
    if (!n) { R.add(txt(s, X, top + 90, `${t.name}\n选择左侧 NPC。\n来源：${t.src}`, 14, '#ddd', { wordWrap: { width: 600 } })); return; }
    R.add(txt(s, X - 180, top + 44, `${n.name}${n.pos ? `  原版坐标 ${n.pos}` : ''}${n.note ? `  ${n.note}` : ''}`, 13, '#ffe8a0', { wordWrap: { width: this.npcNeedsBag() ? 400 : 700 } }));
    const row = (i: number, name: string, sub: string, label: string, fn: () => void, ok: boolean, icon?: string, X = 340) => {
      const y = top + 100 + i * 50;
      R.add(s.add.rectangle(X + 110, y, 230, 44, 0x0a0806).setStrokeStyle(1, 0x4a3a28));
      if (icon && s.textures.exists('item_' + icon)) R.add(s.add.image(X + 16, y, 'item_' + icon).setDisplaySize(36, 36));
      R.add(txt(s, X + 40, y - 17, name, 14, '#fff')); R.add(txt(s, X + 40, y + 2, sub, 11, '#ccc', { strokeThickness: 2 }));
      R.add([...button(s, X + 196, y, 50, 30, label, fn, 13, ok)]);
    };
    const buy = (e: string | null, nm: string) => { if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${nm}`, !e); this.render(); };
    if (n.kind === 'potion') POTIONS.forEach((p, i) => row(i, ITEMS[p.item].name, `${p.price} 金 · 原版 ${i % 2 ? 242 : 88}（S14）持有 ${w.pots[i]}`, '购买', () => buy(w.buyPotion(i), ITEMS[p.item].name), w.gold >= p.price, p.item));
    else if (n.goods) n.goods.forEach((gd, i) => { const d = ITEMS[gd.item]; row(i, d.name + (d.req ? ` 需Lv${d.req}` : ''), `${gd.price} 金 · 原版 ${gd.official ?? '未查到'}${gd.official ? '×0.25' : ' [适配]'}`, '购买', () => buy(w.buyGoods(n.id, gd.item), d.name), w.gold >= gd.price, gd.item); });
    if (n.kind === 'general') { const sold = w.oilBoughtFloor === w.floorIndex, k = n.goods?.length ?? 0;
      row(k, '祝福油', `${OIL_PRICE} 金 · 每层限购 1`, '购买', () => buy(w.buyOil(), '祝福油'), !sold && w.gold >= OIL_PRICE, 'bless_oil'); }
    if (n.kind === 'smith') { row(0, '黑铁矿石[+1]', `${IRON_PRICE} 金 · 强化装备`, '购买', () => buy(w.buyIron(), '黑铁矿石'), w.gold >= IRON_PRICE, 'black_iron');
      R.add(txt(s, X, top + 160, '修理：本作装备无持久度 [适配]，无需修理。\n强化：背包点黑铁矿石，再点装备栏。', 13, '#9fd'));
      const sl = (Object.keys(w.equip) as (keyof typeof w.equip)[]).filter(k => w.equip[k]).slice(0, 8); // R14 #17 鉴定（S12：35 级，1–3 条）
      sl.forEach((k, i) => { const it = w.equip[k]!; row(i, it.name, it.ided ? `已鉴定 ${it.ided} 条` : `鉴定 ${IDENT_PRICE} 金 · ${IDENT_MIN_LEVEL} 级`, '鉴定', () => { const e = w.identify(k); this.onChange(e ?? `鉴定 ${it.name}`, !e); this.render(); }, !it.ided && w.level >= IDENT_MIN_LEVEL && w.gold >= IDENT_PRICE, it.item, X + 250); }); }
    if (n.kind === 'book') { R.add(txt(s, X, top + 74, '书店：本职业有售技能书', 13, '#9fd')); w.shopBooks().forEach((b, i) => { const id = 'book_' + b.skill, learned = w.learned.has(b.skill);
      row(i, ITEMS[id].name, `${b.price} 金 ${learned ? '已学会' : ''}`, '购买', () => buy(w.buyBook(b.skill), ITEMS[id].name), !learned && w.gold >= b.price, id); }); }
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
    if (n.kind === 'teleport' || n.kind === 'veteran') { const fl = [...w.reached].sort((a, b) => a - b).slice(0, 8);
      fl.forEach((f, i) => row(i, w.floors[f].name, `${w.teleportCost(f)} 金 · 冷却 ${WorldCls.TELEPORT_CD}s`, '传送', () => { const e = w.townTeleport(f); this.onChange(e ?? `传送到 ${w.floors[f].name}`, !e); if (!e) { this.mode = null; this.close(); this.onTeleport?.(); } else this.render(); }, w.gold >= w.teleportCost(f))); }
    if (n.kind === 'storage') {
      R.add(txt(s, X, top + 74, `仓库 ${w.storage.length}/${STORAGE_SIZE}：点仓库取回，点背包存入`, 13, '#9fd'));
      for (let i = 0; i < STORAGE_SIZE; i++) { const it = w.storage[i], x = X + 20 + (i % 5) * 46, y = top + 116 + Math.floor(i / 5) * 46;
        this.slotBox(R, x, y, 42, it, '', () => { const e = w.withdraw(i); this.onChange(e ?? `取回 ${it!.name}`, !e); }, 'st_' + i); }
    } else if (this.npcNeedsBag()) R.add(txt(s, X, top + 420, '点右侧背包物品\n→ 卖给该 NPC', 13, '#9fd'));
  }
  /** 世界地图视口（拖动/缩放状态，跨重绘保留） */
  view: View | null = null;
  private mapOff: (() => void)[] = [];
  private clearMapInput() { this.mapOff.forEach(f => f()); this.mapOff = []; }
  /** 传送到某个入口层（沿用 World.teleport 的费用/冷却/战斗中禁用规则） */
  private doTeleport(f: number) {
    const s = this.s, w = this.world(), e = w.teleport(f);
    if (e) { this.onChange(e); sfx(s, 'click', 0.3); this.render(); return; }
    sfx(s, 'coin'); this.close(); this.onChange(`传送到第 ${f + 1} 层 ${w.floors[f].name}`, true); this.onTeleport?.();
  }
  private renderMap(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cur = regionOf(w.floorIndex);
    const VX = 160, VY = top + 45, VW = 960, VH = 360;
    if (!this.region) {
      if (!this.view) { const z = 0.5; this.view = clampView({ x: VW / 2 - cur.x * z, y: VH / 2 - cur.y * z, z }, VW, VH); }
      const M = s.add.container(VX, VY); R.add(M);
      const mk = s.make.graphics({}, false).fillRect(VX, VY, VW, VH); M.setMask(mk.createGeometryMask());
      R.add(s.add.rectangle(VX + VW / 2, VY + VH / 2, VW, VH).setStrokeStyle(2, 0x6a5030));
      const C = s.add.container(0, 0); M.add(C);
      const apply = () => { const v = this.view!; C.setPosition(v.x, v.y).setScale(v.z); };
      // 底图（占位：无 map_world_big 贴图时用色块+网格）
      if (s.textures.exists('map_world_big')) C.add(s.add.image(0, 0, 'map_world_big').setOrigin(0).setDisplaySize(WORLD_W, WORLD_H));
      else {
        C.add(s.add.rectangle(0, 0, WORLD_W, WORLD_H, 0x1e2a18).setOrigin(0));
        const gg = s.add.graphics().lineStyle(1, 0x2e3a24, 1); for (let x = 0; x <= WORLD_W; x += 100) gg.lineBetween(x, 0, x, WORLD_H); for (let y = 0; y <= WORLD_H; y += 100) gg.lineBetween(0, y, WORLD_W, y); C.add(gg);
      }
      const g = s.add.graphics().lineStyle(8, 0x8a7040, 0.8); C.add(g);
      REGIONS.forEach((r, i) => { if (i) g.lineBetween(REGIONS[i - 1].x, REGIONS[i - 1].y, r.x, r.y); });
      let downAt: { x: number; y: number } | null = null, moved = 0;
      REGIONS.forEach(r => {
        const open = r.floors.some(f => w.reached.has(f)), here = r === cur;
        const c = s.add.circle(r.x, r.y, 80, open ? 0x3a2a10 : 0x222222).setStrokeStyle(here ? 10 : 4, here ? 0x66ff66 : open ? 0xd4a64a : 0x555555).setInteractive({ useHandCursor: true });
        c.on('pointerup', () => { if (moved > 10) return; sfx(s, 'click', 0.4); this.region = r.id; this.render(); }); C.add(c);
        if (s.textures.exists(r.icon)) C.add(s.add.image(r.x, r.y, r.icon).setDisplaySize(120, 120).setAlpha(open ? 1 : 0.35));
        C.add(txt(s, r.x, r.y + 100, r.name, 34, open ? '#ffe8a0' : '#777', { fontStyle: 'bold' }).setOrigin(0.5));
        C.add(txt(s, r.x, r.y + 140, `第 ${r.floors.map(f => f + 1).join('/')} 层`, 24, '#bbb').setOrigin(0.5));
        if (here) C.add(txt(s, r.x, r.y - 120, '▼ 你在这里', 28, '#66ff66', { fontStyle: 'bold' }).setOrigin(0.5));
      });
      apply();
      // 拖动 / 双指缩放 / 滚轮缩放（桌面与手机通用）
      const inV = (p: Phaser.Input.Pointer) => toLogic(p.x) >= VX && toLogic(p.x) <= VX + VW && toLogic(p.y) >= VY && toLogic(p.y) <= VY + VH;
      s.input.addPointer(1);
      let pinch = 0;
      const onDown = (p: Phaser.Input.Pointer) => { if (inV(p)) { downAt = { x: toLogic(p.x), y: toLogic(p.y) }; moved = 0; } };
      const onMove = (p: Phaser.Input.Pointer) => {
        const p1 = s.input.pointer1, p2 = s.input.pointer2;
        if (p1?.isDown && p2?.isDown) {
          const d = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
          if (pinch) this.view = zoomAt(this.view!, (p1.x + p2.x) / 2 - VX, (p1.y + p2.y) / 2 - VY, d / pinch, VW, VH);
          pinch = d; moved = 99; apply(); return;
        }
        pinch = 0;
        if (!downAt || !p.isDown) return;
        const dx = toLogic(p.x) - toLogic(p.prevPosition.x), dy = toLogic(p.y) - toLogic(p.prevPosition.y); moved += Math.abs(dx) + Math.abs(dy);
        this.view = clampView({ ...this.view!, x: this.view!.x + dx, y: this.view!.y + dy }, VW, VH); apply();
      };
      const onUp = () => { downAt = null; pinch = 0; s.time.delayedCall(0, () => { moved = 0; }); };
      const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => { if (!inV(p)) return; this.view = zoomAt(this.view!, toLogic(p.x) - VX, toLogic(p.y) - VY, dy > 0 ? 0.9 : 1.1, VW, VH); apply(); };
      s.input.on('pointerdown', onDown); s.input.on('pointermove', onMove); s.input.on('pointerup', onUp); s.input.on('wheel', onWheel);
      this.mapOff.push(() => { s.input.off('pointerdown', onDown); s.input.off('pointermove', onMove); s.input.off('pointerup', onUp); s.input.off('wheel', onWheel); mk.destroy(); });
      const zb = (f: number) => { this.view = zoomAt(this.view!, VW / 2, VH / 2, f, VW, VH); apply(); };
      R.add([...button(s, VX + VW - 70, VY + 26, 40, 34, '＋', () => zb(1.25), 18)]);
      R.add([...button(s, VX + VW - 26, VY + 26, 40, 34, '－', () => zb(0.8), 18)]);
      R.add(txt(s, 640, top + 418, `当前：${cur.name} · 第 ${floorNo(w.floorIndex, w.floors)} 层 ${w.floor.name}    拖动平移 / 滚轮或双指缩放，点击区域进入小地图（M 关闭）`, 14, '#9fd').setOrigin(0.5));
      return;
    }
    const r = REGIONS.find(x => x.id === this.region)!;
    R.add([...button(s, 200, top + 22, 110, 32, '◀ 世界', () => { this.region = null; this.render(); }, 15)]);
    R.add(txt(s, 640, top + 58, `${r.name}${r === cur ? `（你在第 ${floorNo(w.floorIndex, w.floors)} 层 ${w.floor.name}）` : ''}`, 18, '#ffe8a0').setOrigin(0.5));
    const RY = top + 80, RH = 320;
    if (s.textures.exists(r.bg ?? `map_region_${r.id}`)) R.add(s.add.image(VX, RY, r.bg ?? `map_region_${r.id}`).setOrigin(0).setDisplaySize(VW, RH));
    else R.add(s.add.rectangle(VX, RY, VW, RH, 0x1a2414).setOrigin(0).setStrokeStyle(2, 0x6a5030));
    const KIND = { town: { c: 0x3a6a9a, t: '城' }, cave: { c: 0x6a5030, t: '洞' }, dungeon: { c: 0x8a2a2a, t: '本' }, exit: { c: 0x444444, t: '→' } } as const;
    r.nodes.forEach(n => {
      const x = VX + 40 + n.x * (VW - 80), y = RY + 30 + n.y * (RH - 70), f = n.floor, reached = f !== undefined && w.reached.has(f), here = f === w.floorIndex;
      const k = KIND[n.kind], icon = `map_entry_${n.kind}`;
      const c = s.add.circle(x, y, 24, k.c).setStrokeStyle(here ? 4 : 2, here ? 0x66ff66 : reached || n.kind !== 'cave' && n.kind !== 'dungeon' ? 0xd4a64a : 0x555555).setInteractive({ useHandCursor: true });
      R.add(c);
      if (s.textures.exists(icon)) R.add(s.add.image(x, y, icon).setDisplaySize(44, 44));
      else R.add(txt(s, x, y, k.t, 18, '#fff', { fontStyle: 'bold' }).setOrigin(0.5));
      const sub = f !== undefined ? `第${f + 1}层${here ? '·当前' : reached ? ` ${w.teleportCost(f)}金` : '·未到达'}` : n.kind === 'town' ? '安全区' : n.kind === 'exit' ? '' : '未开放';
      R.add(txt(s, x, y + 32, n.name, 14, '#ffe8a0', { strokeThickness: 3 }).setOrigin(0.5, 0));
      if (sub) R.add(txt(s, x, y + 50, sub, 12, '#bbb', { strokeThickness: 2 }).setOrigin(0.5, 0));
      c.on('pointerdown', () => {
        sfx(s, 'click', 0.4);
        if (n.kind === 'exit' && n.to) { this.region = n.to; this.render(); return; }
        if (n.kind === 'town' && NODE_TOWN[n.id]) { const e = w.enterTown(NODE_TOWN[n.id]); if (e) { this.onChange(e); return; } this.clearMapInput(); this.mode = null; this.close(); this.onTeleport?.(); this.onChange(`进入 ${n.name}`, true); return; }
        if (f === undefined) { this.onChange(`${n.name}：暂未开放`); return; }
        if (here) { this.onChange('你已在此地图'); return; }
        if (!reached) { this.onChange('到达该层后解锁传送'); return; }
        this.doTeleport(f);
      });
    });
    const b = r.floors.map(f => floorBoss(f)).filter(Boolean).map(x => x!.name).join('、');
    R.add(txt(s, 640, top + 418, `点击洞穴/副本入口传送（只能去已到达层；战斗中不可传送；冷却 ${WorldCls.TELEPORT_CD} 秒；费用 = 层号 × 20 金）  BOSS：${b}`, 13, '#9fd').setOrigin(0.5));
  }
  private renderQuests(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 200, top + 55, '本层悬赏', 18, '#ffd24a', { fontStyle: 'bold' }));
    const list = QUESTS.filter(q => q.floor === w.floorIndex || w.reached.has(q.floor) || (w.questProg[q.id] ?? 0) > 0);
    const show = (list.length ? list : QUESTS.filter(q => q.floor === w.floorIndex)).slice(0, 5);
    const rows = show.length ? show : [QUESTS[Math.min(w.floorIndex, QUESTS.length - 1)]];
    rows.forEach((q, i) => {
      const y = top + 95 + i * 58, prog = w.questProg[q.id] ?? 0, done = w.questDone.has(q.id);
      const en = ENEMIES[q.target], fl = FLOORS[q.floor];
      R.add(s.add.rectangle(400, y, 460, 52, 0x0a0806).setStrokeStyle(1, done ? 0x3a6a3a : prog >= q.need ? 0x6a5a28 : 0x4a3a28));
      R.add(txt(s, 190, y - 14, `${q.name}（第${q.floor + 1}层 ${fl?.name ?? ''}）`, 15, done ? '#8f8' : '#ffe8a0'));
      R.add(txt(s, 190, y + 6, `击杀 ${en?.name ?? q.target}  ${Math.min(prog, q.need)}/${q.need}    奖 ${q.gold}金/${fmtExp(scaledExp(q.exp, q.floor))}经验`, 13, '#bbb', { strokeThickness: 2 }));
      if (done) R.add(txt(s, 580, y, '已完成', 14, '#8f8').setOrigin(0.5));
      else if (prog >= q.need) R.add([...button(s, 580, y, 80, 32, '交付', () => { const m = w.claimQuest(q.id); sfx(s, 'coin'); this.onChange(m, true); this.render(); }, 15)]);
      else R.add(txt(s, 580, y, '进行中', 13, '#888').setOrigin(0.5));
    });
    R.add(txt(s, 780, top + 55, '成就称号', 18, '#ffd24a', { fontStyle: 'bold' }));
    ACHIEVES.forEach((a, i) => {
      const y = top + 95 + i * 48, got = w.achieves.has(a.id);
      R.add(s.add.rectangle(980, y, 360, 44, 0x0a0806).setStrokeStyle(1, got ? 0x3a6a3a : 0x333));
      R.add(txt(s, 820, y - 10, `${got ? '【' + a.title + '】' : a.name}`, 14, got ? '#ffd24a' : '#888'));
      R.add(txt(s, 820, y + 8, a.desc + (got ? '  ✓' : ''), 12, got ? '#9f9' : '#666', { strokeThickness: 2 }));
    });
    R.add(txt(s, 640, top + 455, '悬赏按层击杀目标怪；成就永久加属性。按 Q 关闭', 13, '#9fd').setOrigin(0.5));
  }
  private renderSettings(R: Phaser.GameObjects.Container, top: number) {
    const w = this.world();
    renderSettingsView(this.s, R, top, {
      cls: w.cls, learned: w.learned, rerender: () => this.render(),
      footer: [{ label: '保存并返回标题', w: 200, fn: () => { this.close(); this.onTitle(); } }, { label: '继续游戏', w: 160, fn: () => this.close() }],
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
      for (const b of sd.bonus) lines.push([`  ${b.n}件：${b.text}`, n >= b.n ? '#7aff7a' : '#777']); }
    if (it.slot) {
      const ts = w.targetSlot(it), cur = ts ? w.equip[ts] : undefined;
      if (cur && cur !== it) lines.push([`当前：${cur.name}`, '#888']);
      lines.push([`需要等级 ${it.req}`, w.level >= it.req ? '#fff' : '#ff4040']);
      const cl = ITEMS[it.item]?.cls;
      if (cl?.length) lines.push([`职业：${cl.map(c => CLASSES[c].name).join('/')}`, cl.includes(w.cls) ? '#fff' : '#ff4040']);
    }
    lines.push([`售价 ${it.price} 金币`, '#ffd24a']);
    if (touch) lines.push([this.mode === 'shop' ? '再点一次：出售' : it.slot && this.sel?.startsWith('eq_') ? '再点一次：卸下' : it.slot ? '再点一次：装备' : '不可装备', '#9fd']);
    const c = this.tip = s.add.container(Math.min(x, 1280 - 230), Math.max(10, Math.min(y, 720 - lines.length * 20 - 20))).setDepth(300);
    const bg = s.add.rectangle(0, 0, 220, lines.length * 20 + 16, 0x05060c, 0.95).setOrigin(0).setStrokeStyle(2, 0x9a9aa8);
    // 背包预览：悬停/选中背包里的衣服或武器时，在提示框旁显示「试穿」效果（不改真实装备）
    if (it.slot === 'armor' || it.slot === 'weapon') {
      const cls = w.cls, art = CLASSES[cls].art, eq = { ...w.equip, [it.slot]: it };
      const look = equipLook(s, cls, art, eq, () => { if (this.tip === c) this.showTip(it, x, y, touch); });
      if (look.state === 'composed') {
        const px = c.x + 220 + 110 > 1280 ? -116 : 226;
        c.add(s.add.rectangle(px, 0, 110, 150, 0x05060c, 0.95).setOrigin(0).setStrokeStyle(2, 0x9a9aa8));
        const im = s.add.image(px + 55, 146, look.key).setOrigin(0.5, 1).setName('bagPreview'); im.setScale(Math.min(140 / im.height, 104 / im.width)); c.add(im);
        c.add(txt(s, px + 55, 4, '试穿', 12, '#9fd', { strokeThickness: 2 }).setOrigin(0.5, 0));
      }
    }
    c.add(bg); lines.forEach(([t, col], i) => c.add(txt(s, 10, 8 + i * 20, t, i === 0 ? 16 : 14, col, { strokeThickness: 2, fontStyle: i === 0 ? 'bold' : '' })));
  }
  hideTip() { this.tip?.destroy(true); this.tip = undefined; }
}
