/**
 * feat/potion-expand：3 格药水栏（红 / 蓝 / 太阳水），桌面（Phaser）与手机（DOM）共用的选择逻辑。
 * - 短按 = 用该格当前选中的药（转发 BattleScene.onKey(POTIONS[i].key)，用药规则不在这里）
 * - 长按 ≥ LONG_MS（桌面也可右键）= 弹层换同类药的等级/种类；点弹层外关闭
 * - 图标缺失 → 回退文字（小红/中红/强红…）
 */
import Phaser from 'phaser';
import { POTIONS } from '../data/skills';
import { ITEMS } from '../data/items';
import { POT_SLOTS, potIndex } from '../data/potions';
import { slotBg } from './uiSlices';
import { txt } from './mtext';
import { POT_FRAME } from './potFrame';

export const LONG_MS = 450;
/** 无图标时的短名（回退绘制） */
export const POT_SHORT: Record<string, string> = { hp_small: '小红', hp_mid: '中红', hp_big: '强红', mp_small: '小蓝', mp_mid: '中蓝', mp_big: '强蓝', sun: '太阳', sun_big: '强太' };
/** 当前 BattleScene.world（读档/复活会换 world，每次现取） */
export const worldOf = (s: Phaser.Scene): any => (s.scene.get('Battle') as any)?.world;
export const selIdx = (w: any, slot: number) => { const k = w?.getSelectedPotion?.(slot) ?? POT_SLOTS[slot].items[0]; return Math.max(0, potIndex(k)); };

/** 桌面 3 格（Phaser，UIScene） */
export class PotBarDesk {
  static readonly X0 = 684; static readonly DX = 52; static readonly Y = 646; static readonly S = 44;
  private icons: (Phaser.GameObjects.Image | null)[] = []; private alt: Phaser.GameObjects.Text[] = []; cnt: Phaser.GameObjects.Text[] = [];
  private cur: number[] = [-1, -1, -1]; pop: Phaser.GameObjects.Container | null = null; private block: Phaser.GameObjects.Rectangle | null = null;
  constructor(private s: Phaser.Scene, private onUse?: (key: string) => void) {
    POT_SLOTS.forEach((sl, i) => {
      const x = PotBarDesk.X0 + i * PotBarDesk.DX, y = PotBarDesk.Y, S = PotBarDesk.S;
      slotBg(s, x, y, S, false, { fill: 0x1a1a1a, stroke: 0x8a7a55, sw: 2 }).setDepth(20);
      this.icons.push(null); this.alt.push(txt(s, x, y, '', 12, '#ffe8a0').setOrigin(0.5).setDepth(21));
      txt(s, x - 18, y - 21, String(i + 1), 11, '#ffff66').setDepth(22).setVisible(false); // 热键 1–3 待战斗开发接（见文档 §8），先不显示
      this.cnt.push(txt(s, x + 19, y + 20, '', 12).setOrigin(1, 1).setDepth(22));
      s.add.triangle(x + 17, y - 17, 0, 0, 6, 0, 6, 6, 0xffe8a0, 0.8).setDepth(22); // 右上小角：可长按换药
      if (!onUse) return;
      let t: Phaser.Time.TimerEvent | null = null, long = false, t0 = 0;
      s.add.rectangle(x, y, S, S, 0, 0.001).setDepth(25).setName('potSlot' + i).setInteractive({ useHandCursor: true })
        .on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation();
          if (p.rightButtonDown()) { this.open(i); return; } long = false; t0 = performance.now(); t?.remove(); t = s.time.delayedCall(LONG_MS, () => { long = true; t = null; this.open(i); }); })
        .on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev?.stopPropagation?.(); if (t) { t.remove(); t = null; if (long) return; if (performance.now() - t0 >= LONG_MS) this.open(i); else this.use(i); } }) // 计时器被卡顿推迟时按真实按住时长判定
        .on('pointerout', () => { t?.remove(); t = null; });
    });
  }
  use(slot: number) { const w = worldOf(this.s); this.onUse?.(POTIONS[selIdx(w, slot)].key); }
  close() { this.pop?.destroy(); this.block?.destroy(); this.pop = this.block = null; }
  /** 长按弹层：同类药横排，每项 48×48（点击区 ≥44），点外关闭 */
  open(slot: number) {
    this.close(); const s = this.s, w = worldOf(s), items = POT_SLOTS[slot].items, S = 48, G = 6;
    const bw = items.length * (S + G) + G, bh = S + 30, cx = PotBarDesk.X0 + slot * PotBarDesk.DX, x0 = Math.min(1280 - bw - 4, Math.max(4, cx - bw / 2)), y0 = PotBarDesk.Y - PotBarDesk.S / 2 - bh - 6;
    this.block = s.add.rectangle(0, 0, 1280, 720, 0, 0.001).setOrigin(0).setDepth(60).setName('potPopBlock').setInteractive()
      .on('pointerdown', (_p: any, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.close(); });
    const c = this.pop = s.add.container(x0, y0).setDepth(61).setName('potPop');
    c.add(s.add.rectangle(0, 0, bw, bh, 0x140e08, 0.94).setOrigin(0).setStrokeStyle(2, 0xb8893a));
    c.add(txt(s, bw / 2, 4, POT_SLOTS[slot].name + '：选择药种', 11, '#ffe8a0').setOrigin(0.5, 0));
    items.forEach((k, j) => {
      const i = potIndex(k), x = G + j * (S + G) + S / 2, y = 22 + S / 2, on = w?.getSelectedPotion?.(slot) === k;
      c.add(s.add.rectangle(x, y, S, S, on ? 0x4a3a18 : 0x1a1a1a).setStrokeStyle(2, on ? 0xffe080 : 0x6a5a40));
      if (s.textures.exists('potion_' + i)) c.add(s.add.image(x, y - 4, 'potion_' + i).setDisplaySize(32, 32)); else c.add(txt(s, x, y - 4, POT_SHORT[k], 12, '#ffe8a0').setOrigin(0.5));
      c.add(txt(s, x, y + 17, String(w?.pots?.[i] ?? 0), 10, '#fff').setOrigin(0.5));
      c.add(s.add.rectangle(x, y, S, S, 0, 0.001).setName('potOpt_' + k).setInteractive({ useHandCursor: true })
        .on('pointerdown', (_p: any, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); worldOf(s)?.setSelectedPotion?.(slot, k); this.close(); this.refresh(); }));
    });
  }
  refresh() {
    const s = this.s, w = worldOf(s);
    POT_SLOTS.forEach((_, slot) => {
      const i = selIdx(w, slot); this.cnt[slot].setText(String(w?.pots?.[i] ?? 0));
      if (this.cur[slot] === i) return; this.cur[slot] = i; this.icons[slot]?.destroy(); this.icons[slot] = null;
      const x = PotBarDesk.X0 + slot * PotBarDesk.DX, k = POTIONS[i].item;
      if (s.textures.exists('potion_' + i)) { this.icons[slot] = s.add.image(x, PotBarDesk.Y, 'potion_' + i).setDisplaySize(38, 38).setDepth(20).setName('potIcon' + slot); this.alt[slot].setText(''); }
      else this.alt[slot].setText(POT_SHORT[k] ?? ITEMS[k]?.name ?? '');
    });
  }
}

/** 手机 3 格（DOM，#mh-pots 内）；样式沿用 #mh-pots .b（56px、36px 图标居中、右下角数量） */
export const POT_POP_CSS = `
#mh-potpop-bg{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.01)}
#mh-potpop{position:fixed;z-index:41;display:flex;gap:8px;padding:6px 8px 8px;background:rgba(20,14,8,.95);border:2px solid #b8893a;border-radius:6px;transform:translateX(-50%)}
#mh-potpop .h{position:absolute;left:0;right:0;top:-18px;text-align:center;font-size:12px;color:#ffe8a0;text-shadow:0 0 2px #000}
#mh-potpop .o{width:52px;height:52px;position:relative;border:2px solid #6a5a40;border-radius:4px;background-color:#1a1a1a;background-size:34px 34px;background-repeat:no-repeat;background-position:center 4px;color:#ffe8a0;font-size:12px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
#mh-potpop .o.on{border-color:#ffe080;background-color:#4a3a18}
#mh-potpop .o span{position:absolute;right:3px;bottom:1px;font-size:11px;color:#fff;text-shadow:0 0 2px #000}
#mh-pots .b.noicon::before{content:attr(data-alt);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:#ffe8a0}
#mh-pots .b span{bottom:${POT_FRAME[2]}px}
#mh-pots .b::after{content:'';position:absolute;right:3px;top:3px;width:0;height:0;border-left:7px solid transparent;border-top:7px solid rgba(255,232,160,.8)}
`;
export class PotBarDom {
  btns: HTMLElement[] = []; cnt: HTMLElement[] = []; private cur = [-1, -1, -1]; pop: HTMLElement | null = null; private bg: HTMLElement | null = null;
  constructor(private host: HTMLElement, private getW: () => any, private onKey: (k: string) => void, private texUrl: (key: string) => string) {
    POT_SLOTS.forEach((sl, i) => {
      const e = document.createElement('div'); e.className = 'b'; e.dataset.id = 'pot' + i; e.title = sl.name + '（长按换药）';
      e.innerHTML = '<span></span>'; host.appendChild(e); this.btns.push(e); this.cnt.push(e.firstChild as HTMLElement);
      let t: any = null, long = false, t0 = 0;
      const eat = (ev: Event) => { if (ev.cancelable) ev.preventDefault(); ev.stopPropagation(); };
      e.addEventListener('pointerdown', ev => { eat(ev); long = false; t0 = performance.now(); clearTimeout(t); t = setTimeout(() => { long = true; t = null; this.open(i); }, LONG_MS); });
      e.addEventListener('pointerup', ev => { eat(ev); if (t) { clearTimeout(t); t = null; if (long) return; if (performance.now() - t0 >= LONG_MS) this.open(i); else this.onKey(POTIONS[selIdx(this.getW(), i)].key); } });
      e.addEventListener('pointercancel', () => { clearTimeout(t); t = null; });
      e.addEventListener('contextmenu', eat);
      // 同 R54：吞掉 touch/mouse，防止穿透到地图
      e.addEventListener('touchstart', eat, { passive: false }); e.addEventListener('mousedown', eat); e.addEventListener('touchend', eat, { passive: false }); e.addEventListener('mouseup', eat);
    });
  }
  close() { this.pop?.remove(); this.bg?.remove(); this.pop = this.bg = null; }
  open(slot: number) {
    this.close(); const w = this.getW(), r = this.btns[slot].getBoundingClientRect();
    const eat = (ev: Event) => { if (ev.cancelable) ev.preventDefault(); ev.stopPropagation(); };
    const bg = this.bg = document.createElement('div'); bg.id = 'mh-potpop-bg'; document.body.appendChild(bg);
    bg.addEventListener('pointerdown', ev => { eat(ev); this.close(); }); bg.addEventListener('touchstart', eat, { passive: false }); bg.addEventListener('mousedown', eat);
    const p = this.pop = document.createElement('div'); p.id = 'mh-potpop'; p.dataset.slot = String(slot); document.body.appendChild(p);
    const h = document.createElement('div'); h.className = 'h'; h.textContent = POT_SLOTS[slot].name; p.appendChild(h);
    POT_SLOTS[slot].items.forEach(k => {
      const i = potIndex(k), o = document.createElement('div'); o.className = 'o' + (w?.getSelectedPotion?.(slot) === k ? ' on' : ''); o.dataset.id = 'potopt_' + k;
      const u = this.texUrl('potion_' + i); if (u) o.style.backgroundImage = u; else o.append(POT_SHORT[k]);
      const c = document.createElement('span'); c.textContent = String(w?.pots?.[i] ?? 0); o.appendChild(c); p.appendChild(o);
      o.addEventListener('pointerdown', ev => { eat(ev); this.getW()?.setSelectedPotion?.(slot, k); this.close(); this.refresh(true); });
      o.addEventListener('touchstart', eat, { passive: false }); o.addEventListener('mousedown', eat);
    });
    // 弹层放在格子正上方，左右夹在视口内
    const pw = p.offsetWidth, vw = window.innerWidth, cx = Math.min(vw - pw / 2 - 4, Math.max(pw / 2 + 4, r.left + r.width / 2));
    p.style.left = cx + 'px'; p.style.top = Math.max(22, r.top - p.offsetHeight - 8) + 'px';
  }
  refresh(force = false) {
    const w = this.getW();
    POT_SLOTS.forEach((_, slot) => {
      const i = selIdx(w, slot), n = String(w?.pots?.[i] ?? 0); if (this.cnt[slot].textContent !== n) this.cnt[slot].textContent = n;
      if (!force && this.cur[slot] === i) return; this.cur[slot] = i; const e = this.btns[slot], u = this.texUrl('potion_' + i);
      e.style.backgroundImage = u; e.dataset.pot = POTIONS[i].item; e.classList.toggle('noicon', !u);
      if (!u) { e.dataset.alt = POT_SHORT[POTIONS[i].item]; }
    });
  }
}
