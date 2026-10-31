import Phaser from 'phaser';
import type { World } from '../combat/World';
import { InvItem, Slot } from '../combat/types';
import { SLOTS, SLOT_NAMES, STAT_NAMES, ITEMS, SETS, ENHANCE_SLOTS, ENHANCE_MAX, IRON_PRICE } from '../data/items';
import { OIL_PRICE } from '../combat/World';
import { POTIONS } from '../data/skills';
import { WORLD } from '../data/world';
import { CLASSES } from '../data/classes';
import { Settings, ZOOM_STEP } from '../settings';
import { txt, button, sfx } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';
import { REGIONS, floorBoss, regionOf } from '../data/map';
import { QUESTS, ACHIEVES } from '../data/quests';
import { ENEMIES } from '../data/units';
import { FLOORS } from '../data/world';
import { World as WorldCls } from '../combat/World';

export type PanelMode = 'bag' | 'shop' | 'skills' | 'settings' | 'map' | 'quests';
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
  onTeleport?: () => void;
  constructor(public s: Phaser.Scene, public world: () => World, public onChange: (msg?: string, green?: boolean) => void, public onTitle: () => void) {}
  get open() { return this.mode !== null; }
  toggle(m: PanelMode) { if (this.mode === m) this.close(); else { this.mode = m; this.sel = null; this.region = null; this.render(); } }
  close() { this.sel = null; this.ironIdx = null; this.mode = null; this.root?.destroy(true); this.root = undefined; this.hideTip(); }
  render() {
    this.root?.destroy(true); this.hideTip();
    if (!this.mode) return;
    const s = this.s, R = this.root = s.add.container(0, 0).setDepth(200);
    R.add(s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45).setInteractive());
    const W = this.mode === 'settings' ? 640 : 1000, H = this.mode === 'settings' ? 580 : 500, top = Math.max(40, 360 - H / 2);
    // 边框与内容对齐：非设置面板内容从 top 起排到 top+478，边框覆盖 top-20 ~ top+480
    R.add(s.add.rectangle(640, this.mode === 'settings' ? 300 : top + H / 2 - 20, W, H, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
    const titles = { bag: '角色 / 背包', shop: '商人 · 杂货铺', skills: '技能', settings: '设置', map: '世界地图', quests: '悬赏 / 成就' };
    R.add(txt(s, 640, top + 22, titles[this.mode], 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
    R.add([...button(s, 640 + W / 2 - 26, top + 22, 36, 32, '✕', () => this.close(), 18)]);
    if (this.mode === 'settings') return this.renderSettings(R, top);
    if (this.mode === 'skills') return this.renderSkills(R, top);
    if (this.mode === 'map') return this.renderMap(R, top);
    if (this.mode === 'quests') return this.renderQuests(R, top);
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
    if (s.textures.exists(c.art)) { const im = s.add.image(cx, top + 330, c.art).setOrigin(0.5, 1); im.setScale(Math.min(250 / im.height, 200 / im.width)); R.add(im); }
    const pos: Record<Slot, [number, number]> = { helmet: [cx - 130, top + 90], necklace: [cx - 130, top + 160], weapon: [cx - 130, top + 230], bracelet: [cx - 130, top + 300],
      armor: [cx + 130, top + 90], ring: [cx + 130, top + 160], boots: [cx + 130, top + 230] } as any;
    for (const sl of SLOTS) {
      const [x, y] = pos[sl];
      this.slotBox(R, x, y, size, w.equip[sl], SLOT_NAMES[sl], () => {
        if (this.ironIdx != null) {
          const m = w.enhanceWithIron(this.ironIdx, sl); this.ironIdx = null;
          sfx(s, 'loot', 0.5); this.onChange(m, m.includes('成功')); this.render(); return;
        }
        const e = w.unequip(sl); this.onChange(e ?? `卸下 ${SLOT_NAMES[sl]}`); sfx(s, 'loot', 0.4); this.render();
      }, 'eq_' + sl);
    }
    const st = w.stats(), h = w.hero;
    const title = w.title(); const lines = [`${c.name}  Lv${w.level}${title ? '  「' + title + '」' : ''}`, `经验 ${w.exp}/${w.expNext}   金币 ${w.gold}   击杀 ${w.kills}`, `生命 ${h ? Math.ceil(h.hp) : 0}/${st.hp}   魔法 ${h ? Math.floor(h.mp ?? 0) : 0}/${st.mp}`,
      `攻击 ${st.atk}   魔法 ${st.mag}   道术 ${st.tao}   防御 ${Math.round(st.def)}   幸运 ${w.luck()}`];
    const sc = w.setCounts(), setLine = Object.values(SETS).filter(st => sc[st.id]).map(st => `${st.name}${sc[st.id]}/${st.pieces.length}`).join('  ');
    if (setLine) lines.push(`套装 ${setLine}`);
    R.add(txt(s, 175, top + 345, lines.join('\n'), 15, '#ffe8a0', { lineSpacing: setLine ? 2 : 6, strokeThickness: 2 }));
    R.add(txt(s, cx + 130, top + 270, IS_MOBILE ? '点两下\n装备栏=卸下' : '点击装备栏\n= 卸下', 12, '#999', { align: 'center' }).setOrigin(0.5, 0));
  }
  private renderShop(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    R.add(txt(s, 175, top + 60, `金币：${w.gold}`, 20, '#ffd24a'));
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
  private renderBag(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cols = 6, size = 56, x0 = 600, y0 = top + 100;
    R.add(txt(s, x0 - size / 2, top + 50, `背包 ${w.bag.length}/${WORLD.bagSize}`, 15, '#ffe8a0'));
    for (let i = 0; i < WORLD.bagSize; i++) {
      const it = w.bag[i], x = x0 + (i % cols) * (size + 6), y = y0 + Math.floor(i / cols) * (size + 6);
      this.slotBox(R, x, y, size, it, '', right => {
        if (this.mode === 'shop') { const g = w.sellItem(i); sfx(s, 'coin'); this.onChange(`出售 ${it!.name} 获得 ${g} 金币`, true); }
        else if (right) { w.dropItem(i); this.onChange(`丢弃 ${it!.name}`); }
        else if (it!.slot) { const e = w.equipItem(i); if (!e) sfx(s, 'loot', 0.5); this.onChange(e ?? `装备 ${it!.name}`, !e); }
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
  private renderSkills(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world();
    // 面板展示全部技能（含被动）；快捷栏仅主动技能 F1..Fn
    const bar = new Map(w.skills.map(k => [k.id, k.key]));
    const list = w.skillPool;
    const gap = list.length > 5 ? 62 : 78;
    list.forEach((k, i) => {
      const y = top + 70 + i * gap;
      const fk = bar.get(k.id) ?? (k.passive ? '被动' : '');
      if (s.textures.exists('sk_' + k.id)) R.add(s.add.image(200, y, 'sk_' + k.id).setDisplaySize(list.length > 5 ? 48 : 56, list.length > 5 ? 48 : 56));
      const need = k.unlock ?? k.learn?.[0] ?? 1, lv = w.skillLevel(k), locked = lv < 0, pts = w.skillTrain[k.id] ?? 0;
      const nextNeed = lv >= 0 && lv < 3 && k.learn && k.train ? `  下一级：人物 Lv${k.learn[lv + 1]} + 修炼点 ${k.train[lv]}` : lv === 3 ? '  已满级' : '';
      R.add(txt(s, 245, y - 26, `[${fk}] ${k.name}${locked ? `（需人物 Lv${need}）` : `  ${lv} 级`}${k.passive ? '  被动' : ''}`, list.length > 5 ? 17 : 19, locked ? '#888' : '#ffd24a', { fontStyle: 'bold' }));
      const eff = k.lvMult ? `  本级倍率 ${Math.round(k.lvMult[Math.max(0, lv)] * 100)}%`
        : k.lvBonus ? `  本级 +${k.lvBonus[Math.max(0, lv)]} 伤害 / 几率 1/${Math.round(1 / k.lvChance![Math.max(0, lv)])}`
        : k.accBonus ? `  准确 +${k.accBonus[Math.max(0, lv)]}（[适配]暴击+${k.accBonus[Math.max(0, lv)]}%）`
        : `  等级加成 +${Math.max(0, lv) * 10}%`;
      R.add(txt(s, 245, y - 4, `${k.desc}${eff}`, 13, locked ? '#777' : '#ddd', { strokeThickness: 2 }));
      R.add(txt(s, 245, y + 16, `${k.passive ? '无需施放' : `消耗 ${k.mana} 魔法  冷却 ${k.cooldown}s`}   修炼点 ${pts}${k.train ? '/' + k.train[2] : ''}${nextNeed}`, 12, locked ? '#666' : '#9fd', { strokeThickness: 2 }));
    });
    R.add(txt(s, 180, top + 430, `学习等级/修炼点/战士倍率取自 1.76 官方；耗魔×3、冷却、火墙灼烧、野蛮伤害、准确→暴击为卡牌适配。人物等级加成 ×${w.skillScale().toFixed(2)}`, 12, '#aaa'));
  }
  private renderMap(R: Phaser.GameObjects.Container, top: number) {
    const s = this.s, w = this.world(), cur = regionOf(w.floorIndex);
    if (!this.region) {
      if (s.textures.exists('map_world')) R.add(s.add.image(640, top + 215, 'map_world').setDisplaySize(960, 350).setAlpha(0.9));
      else R.add(s.add.rectangle(640, top + 215, 960, 350, 0x1e2a18).setStrokeStyle(1, 0x4a5a30));
      const g = s.add.graphics().lineStyle(4, 0x8a7040, 0.8); R.add(g);
      REGIONS.forEach((r, i) => { if (i) g.lineBetween(REGIONS[i - 1].x, top + REGIONS[i - 1].y - 180, r.x, top + r.y - 180); });
      REGIONS.forEach(r => {
        const y = top + r.y - 180, open = r.floors.some(f => w.reached.has(f)), here = r === cur;
        const c = s.add.circle(r.x, y, 38, open ? 0x3a2a10 : 0x222222).setStrokeStyle(here ? 5 : 2, here ? 0x66ff66 : open ? 0xd4a64a : 0x555555).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => { sfx(s, 'click', 0.4); this.region = r.id; this.render(); }); R.add(c);
        if (s.textures.exists(r.icon)) R.add(s.add.image(r.x, y, r.icon).setDisplaySize(60, 60).setAlpha(open ? 1 : 0.35));
        R.add(txt(s, r.x, y + 50, r.name, 17, open ? '#ffe8a0' : '#777', { fontStyle: 'bold' }).setOrigin(0.5));
        R.add(txt(s, r.x, y + 72, `第 ${r.floors.map(f => f + 1).join('/')} 层`, 13, '#bbb').setOrigin(0.5));
        if (here) R.add(txt(s, r.x, y - 58, '▼ 你在这里', 14, '#66ff66', { fontStyle: 'bold' }).setOrigin(0.5));
      });
      R.add(txt(s, 640, top + 412, `当前：${cur.name} · 第 ${w.floorIndex + 1} 层 ${w.floor.name}    点击区域查看详情与传送（M 关闭）`, 15, '#9fd').setOrigin(0.5));
      return;
    }
    const r = REGIONS.find(x => x.id === this.region)!;
    R.add([...button(s, 200, top + 22, 110, 32, '◀ 世界', () => { this.region = null; this.render(); }, 15)]);
    R.add(txt(s, 640, top + 62, `${r.name}${r === cur ? `（你在第 ${w.floorIndex + 1} 层 ${w.floor.name}）` : ''}`, 18, '#ffe8a0').setOrigin(0.5));
    r.floors.forEach((f, j) => {
      const y = top + 112 + j * 94, fl = w.floors[f], reached = w.reached.has(f), here = f === w.floorIndex, b = floorBoss(f);
      R.add(s.add.rectangle(640, y, 880, 84, here ? 0x1c2a14 : 0x0a0806).setStrokeStyle(2, here ? 0x66ff66 : reached ? 0x6a5030 : 0x333333));
      if (s.textures.exists(fl.bg ?? '')) R.add(s.add.image(250, y, fl.bg!).setDisplaySize(140, 76).setAlpha(reached ? 1 : 0.3));
      R.add(txt(s, 340, y - 30, `第 ${f + 1} 层  ${fl.name}${here ? '  ← 当前位置' : ''}${reached ? '' : '  （未到达）'}`, 18, reached ? '#ffd24a' : '#777', { fontStyle: 'bold' }));
      if (b) R.add(txt(s, 340, y + 2, `BOSS：${b.name}   建议等级 Lv${b.level}   ${w.bossKilled.has(f) ? '已击杀（重新进入该层会刷新）' : '未击杀'}`, 14, w.bossKilled.has(f) ? '#9f9' : '#f99', { strokeThickness: 2 }));
      if (!here) {
        const why = w.canTeleport(f);
        R.add(txt(s, 340, y + 24, reached ? `传送费用 ${w.teleportCost(f)} 金${why ? '   ' + why : ''}` : '到达后解锁传送', 13, '#aaa', { strokeThickness: 2 }));
        R.add([...button(s, 1010, y, 120, 40, '传送', () => {
          const e = w.teleport(f);
          if (e) { this.onChange(e); sfx(s, 'click', 0.3); this.render(); return; }
          sfx(s, 'coin'); this.close(); this.onChange(`传送到第 ${f + 1} 层 ${fl.name}`, true); this.onTeleport?.();
        }, 17, reached)]);
      }
    });
    R.add(txt(s, 640, top + 418, `传送规则：只能去已到达的层；战斗中（有怪物追击）不可传送；冷却 ${WorldCls.TELEPORT_CD} 秒；费用 = 层号 × 20 金`, 13, '#9fd').setOrigin(0.5));
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
      R.add(txt(s, 190, y + 6, `击杀 ${en?.name ?? q.target}  ${Math.min(prog, q.need)}/${q.need}    奖 ${q.gold}金/${q.exp}经验`, 13, '#bbb', { strokeThickness: 2 }));
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
    const s = this.s, w = this.world(), cls = w.cls;
    const vol = txt(s, 640, top + 70, '', 20).setOrigin(0.5); R.add(vol);
    const refresh = () => { vol.setText(`音量 ${Math.round(Settings.volume * 100)}%${Settings.muted ? '（静音）' : ''}`); Settings.apply(s.sound); Settings.save(); };
    R.add([...button(s, 500, top + 70, 50, 36, '－', () => { Settings.volume = Math.max(0, +(Settings.volume - 0.1).toFixed(1)); refresh(); })]);
    R.add([...button(s, 780, top + 70, 50, 36, '＋', () => { Settings.volume = Math.min(1, +(Settings.volume + 0.1).toFixed(1)); refresh(); })]);
    R.add([...button(s, 560, top + 118, 160, 36, '静音 (N)', () => { Settings.muted = !Settings.muted; refresh(); }, 16)]);
    R.add([...button(s, 740, top + 118, 160, 36, `低特效：${Settings.lowFx ? '开' : '关'}`, () => { Settings.lowFx = !Settings.lowFx; FxQuality.low = !!Settings.lowFx; Settings.save(); this.render(); }, 15)]);
    if (IS_MOBILE) {
      const on = Settings.wantPad(true);
      R.add([...button(s, 640, top + 162, 220, 36, `虚拟按键：${on ? '开' : '关'}`, () => {
        Settings.showPadMobile = !Settings.wantPad(true); Settings.save(); this.render();
      }, 15)]);
    } else {
      R.add(txt(s, 640, top + 162, '虚拟按键：电脑默认关', 13, '#888').setOrigin(0.5));
    }
    // 自动攻击
    R.add([...button(s, 640, top + 210, 280, 38, `自动攻击：${Settings.autoAttack ? '开' : '关'}`, () => {
      Settings.autoAttack = !Settings.autoAttack; Settings.save(); this.render();
    }, 17)]);
    R.add(txt(s, 640, top + 248, '开启后贴脸自动普攻（不追怪）；勾选技能按优先级/冷却自动放；手动按键优先', 12, '#9ab').setOrigin(0.5));
    // 自动技能勾选（null=职业推荐默认勾选）
    const selected = new Set(Settings.skillsFor(cls));
    w.skills.forEach((sk, i) => {
      const on = selected.has(sk.id);
      const x = 280 + (i % 4) * 180, y = top + 288 + Math.floor(i / 4) * 40;
      R.add([...button(s, x, y, 168, 34, `${on ? '✓' : '○'} ${sk.key} ${sk.name}`, () => {
        Settings.toggleAutoSkill(sk.id, cls); this.render();
      }, 13)]);
    });
    // 画面缩放
    const zlab = txt(s, 640, top + 340, `画面缩放 ${Math.round(Settings.zoom * 100)}%`, 18, '#ffe8a0').setOrigin(0.5); R.add(zlab);
    R.add([...button(s, 480, top + 340, 50, 36, '－', () => { Settings.setZoom(Settings.zoom - ZOOM_STEP); this.render(); })]);
    R.add([...button(s, 800, top + 340, 50, 36, '＋', () => { Settings.setZoom(Settings.zoom + ZOOM_STEP); this.render(); })]);
    ;[0.8, 0.9, 1, 1.1, 1.2].forEach((z, i) => {
      R.add([...button(s, 400 + i * 80, top + 386, 70, 30, `${Math.round(z * 100)}%`, () => { Settings.setZoom(z); this.render(); }, 13)]);
    });
    R.add([...button(s, 520, top + 440, 200, 40, '保存并返回标题', () => { this.close(); this.onTitle(); }, 16)]);
    R.add([...button(s, 760, top + 440, 160, 40, '继续游戏', () => this.close(), 16)]);
    R.add(txt(s, 640, top + 490, IS_MOBILE
      ? '缩放用于适配不同手机；虚拟键/HUD 随画布一起缩放。竖屏会提示旋转'
      : '电脑也可调缩放预览；手机浏览器打开虚拟按键默认开', 12, '#999').setOrigin(0.5));
    refresh();
  }
  showTip(it: InvItem, x: number, y: number, touch = false) {
    this.hideTip(); const s = this.s, w = this.world();
    const lines: [string, string][] = [[it.name, RARITY_HEX[it.rarity]], [`${it.slot ? SLOT_NAMES[it.slot] : '杂物'} · ${RARITY_CN[it.rarity]}`, '#aaa']];
    for (const [k, v] of Object.entries(it.stats)) if (v) lines.push([`${STAT_NAMES[k as keyof typeof STAT_NAMES]} +${v}`, '#7aff7a']);
    if (it.luck) lines.push([it.luck > 0 ? `幸运 +${it.luck}` : `诅咒 ${-it.luck}`, it.luck > 0 ? '#ffd24a' : '#ff4040']);
    if (it.item === 'bless_oil') lines.push(['点击：作用于当前武器（幸运+1，上限7，可能诅咒）', '#9fd']);
    if (it.item === 'black_iron') lines.push([`纯度 ${it.purity ?? 1} ×${it.qty ?? 1}：点装备栏强化；再点可提纯`, '#9fd']);
    if (it.enhance) lines.push([`强化 +${it.enhance}（上限 +${ENHANCE_MAX}）`, '#c8c8ff']);
    if (it.slot && ENHANCE_SLOTS.includes(it.slot) && (it.enhance ?? 0) < ENHANCE_MAX) lines.push(['可用黑铁矿石强化（武器/头盔/衣服/靴）', '#9ab']);
    const sd = ITEMS[it.item]?.set ? SETS[ITEMS[it.item].set!] : undefined;
    if (sd) { const n = w.setCounts()[sd.id] ?? 0; lines.push([`【${sd.name}套装】已穿 ${n}/${sd.pieces.length}`, '#ffb040']);
      for (const b of sd.bonus) lines.push([`  ${b.n}件：${b.text}`, n >= b.n ? '#7aff7a' : '#777']); }
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
