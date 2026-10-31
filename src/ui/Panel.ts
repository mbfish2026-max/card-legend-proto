import Phaser from 'phaser';
import type { World } from '../combat/World';
import { InvItem, Slot } from '../combat/types';
import { SLOTS, SLOT_NAMES, STAT_NAMES, ITEMS } from '../data/items';
import { POTIONS } from '../data/skills';
import { WORLD } from '../data/world';
import { CLASSES } from '../data/classes';
import { Settings } from '../settings';
import { txt, button, sfx } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';

export type PanelMode = 'bag' | 'shop' | 'skills' | 'settings';
export const RARITY_HEX: Record<string, string> = { common: '#ffffff', magic: '#5aa8ff', rare: '#ffb020' };
const RARITY_NUM: Record<string, number> = { common: 0x8a8a8a, magic: 0x3a7aff, rare: 0xffa020 };
const RARITY_CN: Record<string, string> = { common: '普通', magic: '精良', rare: '极品' };

/** 角色/背包/商店/技能/设置 面板（打开时战斗暂停） */
export class Panel {
  root?: Phaser.GameObjects.Container; tip?: Phaser.GameObjects.Container; mode: PanelMode | null = null; sel: string | null = null;
  constructor(public s: Phaser.Scene, public world: () => World, public onChange: (msg?: string, green?: boolean) => void, public onTitle: () => void) {}
  get open() { return this.mode !== null; }
  toggle(m: PanelMode) { if (this.mode === m) this.close(); else { this.mode = m; this.sel = null; this.render(); } }
  close() { this.sel = null; this.mode = null; this.root?.destroy(true); this.root = undefined; this.hideTip(); }
  render() {
    this.root?.destroy(true); this.hideTip();
    if (!this.mode) return;
    const s = this.s, R = this.root = s.add.container(0, 0).setDepth(200);
    R.add(s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45).setInteractive());
    const W = this.mode === 'settings' ? 520 : 1000, H = this.mode === 'settings' ? 430 : 500, top = 300 - H / 2;
    R.add(s.add.rectangle(640, 300, W, H, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
    const titles = { bag: '角色 / 背包', shop: '商人 · 杂货铺', skills: '技能', settings: '设置' };
    R.add(txt(s, 640, top + 22, titles[this.mode], 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
    R.add([...button(s, 640 + W / 2 - 26, top + 22, 36, 32, '✕', () => this.close(), 18)]);
    if (this.mode === 'settings') return this.renderSettings(R, top);
    if (this.mode === 'skills') return this.renderSkills(R, top);
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
    if (s.textures.exists(c.art)) { const im = s.add.image(cx, top + 330, c.art).setOrigin(0.5, 1); im.setScale(Math.min(250 / im.height, 200 / im.width)); R.add(im); }
    const pos: Record<Slot, [number, number]> = { helmet: [cx - 130, top + 90], necklace: [cx - 130, top + 160], weapon: [cx - 130, top + 230], bracelet: [cx - 130, top + 300],
      armor: [cx + 130, top + 90], ring: [cx + 130, top + 160], boots: [cx + 130, top + 230] } as any;
    for (const sl of SLOTS) {
      const [x, y] = pos[sl];
      this.slotBox(R, x, y, size, w.equip[sl], SLOT_NAMES[sl], () => { const e = w.unequip(sl); this.onChange(e ?? `卸下 ${SLOT_NAMES[sl]}`); sfx(s, 'loot', 0.4); this.render(); }, 'eq_' + sl);
    }
    const st = w.stats(), h = w.hero;
    const lines = [`${c.name}  Lv${w.level}`, `经验 ${w.exp}/${w.expNext}`, `生命 ${h ? Math.ceil(h.hp) : 0}/${st.hp}   魔法 ${h ? Math.floor(h.mp ?? 0) : 0}/${st.mp}`,
      `攻击 ${st.atk}   魔法 ${st.mag}   道术 ${st.tao}   防御 ${Math.round(st.def)}`, `金币 ${w.gold}   击杀 ${w.kills}`];
    R.add(txt(s, 175, top + 345, lines.join('\n'), 15, '#ffe8a0', { lineSpacing: 6, strokeThickness: 2 }));
    R.add(txt(s, cx + 130, top + 270, IS_MOBILE ? '点两下\n装备栏=卸下' : '点击装备栏\n= 卸下', 12, '#999', { align: 'center' }).setOrigin(0.5, 0));
  }
  private renderShop(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 175, top + 60, `金币：${w.gold}`, 20, '#ffd24a'));
    POTIONS.forEach((p, i) => {
      const y = top + 120 + i * 70, it = ITEMS[p.item];
      R.add(s.add.rectangle(330, y, 320, 60, 0x0a0806).setStrokeStyle(1, 0x4a3a28));
      if (s.textures.exists('item_' + p.item)) R.add(s.add.image(200, y, 'item_' + p.item).setDisplaySize(46, 46));
      R.add(txt(s, 232, y - 20, it.name, 16, '#fff'));
      R.add(txt(s, 232, y + 2, `${p.hp ? '恢复生命 ' + p.hp : '恢复魔法 ' + p.mp}   ${p.price} 金   持有 ${w.pots[i]}`, 13, '#ccc', { strokeThickness: 2 }));
      R.add([...button(s, 448, y, 64, 34, '购买', () => { const e = w.buyPotion(i); if (!e) sfx(s, 'coin'); this.onChange(e ?? `购买 ${it.name}`, !e); this.render(); }, 16, w.gold >= p.price)]);
    });
    R.add(txt(s, 175, top + 410, '点击右侧背包物品出售（按售价）', 14, '#9fd'));
  }
  private renderBag(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cols = 6, size = 56, x0 = 600, y0 = top + 100;
    R.add(txt(s, x0 - size / 2, top + 50, `背包 ${w.bag.length}/${WORLD.bagSize}`, 15, '#ffe8a0'));
    for (let i = 0; i < WORLD.bagSize; i++) {
      const it = w.bag[i], x = x0 + (i % cols) * (size + 6), y = y0 + Math.floor(i / cols) * (size + 6);
      this.slotBox(R, x, y, size, it, '', right => {
        if (this.mode === 'shop') { const g = w.sellItem(i); sfx(s, 'coin'); this.onChange(`出售 ${it!.name} 获得 ${g} 金币`, true); }
        else if (right) { w.dropItem(i); this.onChange(`丢弃 ${it!.name}`); }
        else if (it!.slot) { const e = w.equipItem(i); if (!e) sfx(s, 'loot', 0.5); this.onChange(e ?? `装备 ${it!.name}`, !e); }
        else this.onChange(`${it!.name} 不能装备（可在商人处出售）`);
        this.render();
      }, 'bag_' + i);
    }
    if (IS_MOBILE && this.mode === 'bag' && this.sel?.startsWith('bag_')) { const i = Number(this.sel.slice(4)), it = w.bag[i]; if (it) R.add([...button(s, x0 + 5 * (size + 6), top + 470, 80, 34, '丢弃', () => { w.dropItem(i); this.sel = null; this.onChange(`丢弃 ${it.name}`); this.render(); }, 16)]); }
    R.add(txt(s, x0 - size / 2, top + 470, IS_MOBILE ? (this.mode === 'shop' ? '点一下查看属性，再点一下出售' : '点一下查看属性，再点一下装备；选中后可「丢弃」') : this.mode === 'shop' ? '左键出售' : '左键装备   右键丢弃   悬停查看属性', 12, '#999'));
  }
  private renderSkills(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    w.skills.forEach((k, i) => {
      const y = top + 100 + i * 90;
      if (s.textures.exists('sk_' + k.id)) R.add(s.add.image(220, y, 'sk_' + k.id).setDisplaySize(60, 60));
      R.add(txt(s, 270, y - 28, `[${k.key}] ${k.name}`, 20, '#ffd24a', { fontStyle: 'bold' }));
      R.add(txt(s, 270, y + 2, `${k.desc}    消耗 ${k.mana} 魔法  冷却 ${k.cooldown}s`, 15, '#ddd', { strokeThickness: 2 }));
    });
    R.add(txt(s, 220, top + 460, `技能伤害随等级提升：当前 ×${w.skillScale().toFixed(2)}（基于${{ atk: '攻击', mag: '魔法', tao: '道术' }[w.classDef.autoStat]}）`, 14, '#9fd'));
  }
  private renderSettings(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, vol = txt(s, 640, top + 90, '', 22).setOrigin(0.5); R.add(vol);
    const refresh = () => { vol.setText(`音量 ${Math.round(Settings.volume * 100)}%${Settings.muted ? '（静音）' : ''}`); Settings.apply(s.sound); Settings.save(); };
    R.add([...button(s, 500, top + 90, 50, 40, '－', () => { Settings.volume = Math.max(0, +(Settings.volume - 0.1).toFixed(1)); refresh(); })]);
    R.add([...button(s, 780, top + 90, 50, 40, '＋', () => { Settings.volume = Math.min(1, +(Settings.volume + 0.1).toFixed(1)); refresh(); })]);
    R.add([...button(s, 640, top + 150, 220, 42, '静音开/关 (M)', () => { Settings.muted = !Settings.muted; refresh(); }, 18)]);
    if (IS_MOBILE) {
      const on = Settings.wantPad(true);
      R.add([...button(s, 520, top + 210, 230, 42, `虚拟按键：${on ? '开' : '关'}`, () => {
        Settings.showPadMobile = !Settings.wantPad(true); Settings.save(); this.render();
      }, 17)]);
    } else {
      R.add(txt(s, 520, top + 210, '虚拟按键：电脑默认关', 14, '#888').setOrigin(0.5));
    }
    R.add([...button(s, 760, top + 210, 230, 42, `低特效：${Settings.lowFx ? '开' : '关'}`, () => { Settings.lowFx = !Settings.lowFx; FxQuality.low = !!Settings.lowFx; Settings.save(); this.render(); }, 17)]);
    R.add([...button(s, 640, top + 270, 220, 42, '保存并返回标题', () => { this.close(); this.onTitle(); }, 18)]);
    R.add([...button(s, 640, top + 328, 220, 42, '继续游戏', () => this.close(), 18)]);
    R.add(txt(s, 640, top + 380, IS_MOBILE ? '手机/平板：虚拟按键默认开启，可在此关闭；竖屏会提示旋转' : '电脑不显示虚拟按键；手机浏览器打开会默认开启', 13, '#999').setOrigin(0.5));
    refresh();
  }
  showTip(it: InvItem, x: number, y: number, touch = false) {
    this.hideTip(); const s = this.s, w = this.world();
    const lines: [string, string][] = [[it.name, RARITY_HEX[it.rarity]], [`${it.slot ? SLOT_NAMES[it.slot] : '杂物'} · ${RARITY_CN[it.rarity]}`, '#aaa']];
    for (const [k, v] of Object.entries(it.stats)) if (v) lines.push([`${STAT_NAMES[k as keyof typeof STAT_NAMES]} +${v}`, '#7aff7a']);
    if (it.slot) {
      const cur = w.equip[it.slot];
      if (cur && cur !== it) lines.push([`当前：${cur.name}`, '#888']);
      lines.push([`需要等级 ${it.req}`, w.level >= it.req ? '#fff' : '#ff4040']);
    }
    lines.push([`售价 ${it.price} 金币`, '#ffd24a']);
    if (touch) lines.push([this.mode === 'shop' ? '再点一次：出售' : it.slot && this.sel?.startsWith('eq_') ? '再点一次：卸下' : it.slot ? '再点一次：装备' : '不可装备', '#9fd']);
    const c = this.tip = s.add.container(Math.min(x, 1280 - 230), Math.max(10, Math.min(y, 720 - lines.length * 20 - 20))).setDepth(300);
    const bg = s.add.rectangle(0, 0, 220, lines.length * 20 + 16, 0x05060c, 0.95).setOrigin(0).setStrokeStyle(2, 0x9a9aa8);
    c.add(bg); lines.forEach(([t, col], i) => c.add(txt(s, 10, 8 + i * 20, t, i === 0 ? 16 : 14, col, { strokeThickness: 2, fontStyle: i === 0 ? 'bold' : '' })));
  }
  hideTip() { this.tip?.destroy(true); this.tip = undefined; }
}
