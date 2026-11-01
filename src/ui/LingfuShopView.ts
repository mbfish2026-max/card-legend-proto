/**
 * 灵符商城面板（Panel mode 'lingfu'）。docs/lingfu-shop.md §2、§10.5。
 * 新图集：panel_frame（Panel 外框）/ tab_on|off / list_row / btn_* / dialog_frame / lingfu_icon_s / recharge_card_*；
 * 图集缺失时 frameBg/rowBg/tabButton/button 自动退回旧绘制。九宫格只用 setSize（经 ns()）。
 * 手机：行距/页签/按钮点击区 ≥44 CSS px（rowHitHeight/listRowPitch），列表可拖动、滚轮滚动；点面板外空白处关闭（tapClose）。
 */
import Phaser from 'phaser';
import type { World } from '../combat/World';
import { IS_MOBILE } from '../mobile';
import { txt, button, tabButton } from './mtext';
import { sfx } from '../scenes/TitleScene';
import { frameBg, rowBg, scrollBar, listRowPitch, atlasReady, UI_ATLAS, MIN_TAP } from './uiSlices';
import { clampOff, visibleRange, dragOff, wheelOff, isTap, thumb } from './scrollList';
import { shouldTapClose } from './tapClose';
import { SHOP_TABS, ShopTab, productsOf, PRODUCT_BY_SKU, RECHARGE_TIERS, Product } from '../shop/catalog';
import { wallet, LINGFU_PER_YUAN } from '../shop/wallet';
import { buy } from '../shop/shop';
import { ITEMS } from '../data/items';

export interface LingfuCtx {
  s: Phaser.Scene; R: Phaser.GameObjects.Container; top: number; W: number; H: number;
  world: () => World; cssU: number;
  toPanel(p: Phaser.Input.Pointer): { x: number; y: number };
  /** 注册在 render/close 时要解绑的 scene.input 监听 */
  addOff(f: () => void): void;
  rerender(): void; close(): void;
  onChange(msg?: string, green?: boolean): void;
  /** 购买成功后存档 */
  save(): void;
}
/** 面板状态（跨 render 保留） */
export const lingfuState = { tab: 'hot' as ShopTab, off: 0, confirm: null as string | null, lack: null as string | null };
export function resetLingfu() { lingfuState.tab = 'hot'; lingfuState.off = 0; lingfuState.confirm = null; lingfuState.lack = null; }

const yuan = (n: number) => `≈${(n / LINGFU_PER_YUAN).toFixed(0)}元`;
function icon(s: Phaser.Scene, x: number, y: number, size: number) {
  return atlasReady(s, 'lingfu_icon_s') ? s.add.image(x, y, UI_ATLAS, 'lingfu_icon_s').setDisplaySize(size, size).setName('lingfuIcon') : null;
}
/** 面板内一个按钮 + 透明点击层（高度 ≥ 44 CSS px，不超过 maxH） */
function hitBtn(c: LingfuCtx, x: number, y: number, w: number, h: number, label: string, fn: () => void, size: number, enabled = true, name = '', maxH = 999) {
  const { s, R } = c; const vis = button(s, x, y, w, h, label, fn, size, enabled); R.add([...vis]);
  vis.forEach(o => (o as any).disableInteractive?.());
  const hh = Math.min(maxH, Math.max(h, MIN_TAP / Math.max(c.cssU, 0.01)));
  const r = s.add.rectangle(x, y, w, hh, 0, 0.001).setName(name).setData('lfHit', label);
  if (enabled) r.setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer) => { if (isTap(Math.hypot(p.upX - p.downX, p.upY - p.downY))) { sfx(s, 'click'); fn(); } });
  R.add(r); return r;
}

export function renderLingfu(c: LingfuCtx) {
  const { s, R, top, W } = c, st = lingfuState, w = c.world(), wal = wallet(), L = 640 - W / 2;
  // 余额（左上，标题同行）
  const ic = icon(s, L + 46, top + 22, 28); if (ic) R.add(ic);
  R.add(txt(s, L + (ic ? 66 : 36), top + 22, `灵符 ${wal.balance()}`, 20, '#ffe070', { fontStyle: 'bold' }).setOrigin(0, 0.5).setName('lingfuBalance'));
  // 点面板外关闭（手机 tapClose；桌面点外面也关，便于鼠标操作）
  const dim = R.list[0] as Phaser.GameObjects.Rectangle;
  dim?.on?.('pointerup', (p: Phaser.Input.Pointer) => {
    const q = c.toPanel(p), inside = q.x >= L && q.x <= L + W && q.y >= top - 20 && q.y <= top - 20 + c.H;
    if (shouldTapClose({ downX: p.downX, downY: p.downY, upX: p.upX, upY: p.upY, insidePanel: inside, onSlot: false }, true, true)) c.close();
  });
  // 页签
  const tw = 128, tx0 = L + 120, ty = top + 72;
  const tabHitH = Math.min(70, Math.max(44, MIN_TAP / Math.max(c.cssU, 0.01)));
  SHOP_TABS.forEach((t, i) => {
    const x = tx0 + i * (tw + 10), on = st.tab === t.id;
    const go = () => { if (st.tab === t.id) return; st.tab = t.id; st.off = 0; st.confirm = null; st.lack = null; c.rerender(); };
    const vis = tabButton(s, x, ty, tw, 44, t.name, on, go, 18); vis.forEach(o => (o as any).disableInteractive?.());
    const hit = s.add.rectangle(x, ty, tw, tabHitH, 0, 0.001).setName('lfTab').setData('lfTab', t.id);
    hit.setInteractive({ useHandCursor: true }).on('pointerdown', go);
    R.add([...vis, hit]);
  });
  R.add(txt(s, 640, top + 462, `1 元 = ${LINGFU_PER_YUAN} 灵符（价格仅显示，未接入支付）· 商城物品绑定，不可出售`, 13, '#a89870').setOrigin(0.5));
  if (st.tab === 'recharge') renderRecharge(c); else renderList(c, productsOf(st.tab));
  if (st.confirm) renderConfirm(c, PRODUCT_BY_SKU[st.confirm]);
  else if (st.lack) renderLack(c, PRODUCT_BY_SKU[st.lack]);
}

function renderList(c: LingfuCtx, list: Product[]) {
  const { s, R, top, W } = c, st = lingfuState, w = c.world(), wal = wallet(), L = 640 - W / 2;
  const y0 = top + 112, areaH = 330, RP = listRowPitch(IS_MOBILE, 66, c.cssU), VIS = Math.max(3, Math.floor(areaH / RP)), n = list.length;
  st.off = clampOff(st.off, n, VIS); const [a, b] = visibleRange(st.off, n, VIS);
  const rx = L + 60, rw = W - 140;
  for (let i = a; i < b; i++) {
    const p = list[i], y = y0 + (i - a) * RP + RP / 2, d = ITEMS[p.item];
    R.add(rowBg(s, rx + rw / 2, y, rw, RP - 6, false, { fill: 0x0a0806, stroke: 0x4a3a28 }).setName('lfRow').setData('sku', p.sku));
    if (s.textures.exists('item_' + p.item)) R.add(s.add.image(rx + 32, y, 'item_' + p.item).setDisplaySize(44, 44));
    const nm = p.name + (d.req && d.req > 1 ? `  需Lv${d.req}` : '');
    R.add(txt(s, rx + 64, y - 12, nm, 18, '#ffe8a0', { fontStyle: 'bold' }).setOrigin(0, 0.5));
    R.add(txt(s, rx + 64, y + 14, p.desc, 13, '#ccc', { strokeThickness: 2 }).setOrigin(0, 0.5));
    const pi = icon(s, rx + rw - 260, y, 22); if (pi) R.add(pi);
    R.add(txt(s, rx + rw - 244, y, `${p.price}  ${yuan(p.price)}`, 17, '#ffe070', { fontStyle: 'bold' }).setOrigin(0, 0.5).setName('lfPrice'));
    const can = wal.balance() >= p.price;
    hitBtn(c, rx + rw - 62, y, 100, 40, '购买', () => { if (can) st.confirm = p.sku; else st.lack = p.sku; c.rerender(); }, 17, true, 'lfBuy', RP).setData('sku', p.sku).setData('rowPitch', RP);
  }
  if (!n) R.add(txt(s, 640, y0 + 80, '暂无商品', 18, '#aaa').setOrigin(0.5));
  if (n > VIS) {
    const trackH = VIS * RP, th = thumb(st.off, n, VIS, trackH); R.add([...scrollBar(s, rx + rw + 14, y0, trackH, th)]);
    const inList = (p: Phaser.Input.Pointer) => { const q = c.toPanel(p); return q.x >= rx && q.x <= rx + rw + 30 && q.y >= y0 && q.y <= y0 + trackH; };
    let drag: { y0: number; off0: number } | null = null;
    const set = (o: number) => { const v = clampOff(o, n, VIS); if (v !== st.off) { st.off = v; c.rerender(); } };
    const onDown = (p: Phaser.Input.Pointer) => { if (inList(p)) drag = { y0: c.toPanel(p).y, off0: st.off }; };
    const onMove = (p: Phaser.Input.Pointer) => { if (!drag || !p.isDown) return; const dy = c.toPanel(p).y - drag.y0; if (!isTap(Math.abs(dy))) set(dragOff(drag.off0, dy, RP, n, VIS)); };
    const onUp = () => { drag = null; };
    const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => { if (inList(p)) set(wheelOff(st.off, dy, n, VIS)); };
    s.input.on('pointerdown', onDown); s.input.on('pointermove', onMove); s.input.on('pointerup', onUp); s.input.on('wheel', onWheel);
    c.addOff(() => { s.input.off('pointerdown', onDown); s.input.off('pointermove', onMove); s.input.off('pointerup', onUp); s.input.off('wheel', onWheel); });
  }
  void w;
}

function renderRecharge(c: LingfuCtx) {
  const { s, R, top } = c;
  R.add(txt(s, 640, top + 128, '充值：未接入支付', 22, '#ff9a6a', { fontStyle: 'bold' }).setOrigin(0.5).setName('lfNoPay'));
  RECHARGE_TIERS.forEach((t, i) => {
    const x = 640 + (i - 2.5) * 140, y = top + 270;
    const card = frameBg(s, 'recharge_card_normal', x, y, 124, 170, { fill: 0x1a140e, stroke: 0x5a4a30, sw: 2 }); (card as any).setAlpha?.(0.45); R.add(card.setName('lfCard'));
    R.add(txt(s, x, y - 30, `${t.lingfu}`, 22, '#888', { fontStyle: 'bold' }).setOrigin(0.5));
    R.add(txt(s, x, y + 2, '灵符', 14, '#888').setOrigin(0.5));
    R.add([...button(s, x, y + 52, 100, 36, `${t.yuan} 元`, () => {}, 16, false)]);
  });
  R.add(txt(s, 640, top + 400, '当前为测试版本：新账号赠送 5000 灵符，暂不支持充值', 15, '#bbb').setOrigin(0.5));
}

function dialog(c: LingfuCtx, h: number) {
  const { s, R, top } = c, cy = top + 240;
  const block = s.add.rectangle(640, top + 230, c.W, c.H, 0, 0.55).setInteractive().setName('lfDim'); R.add(block);
  R.add(frameBg(s, 'dialog_frame', 640, cy, 520, h, { fill: 0x1a120a, alpha: 0.98, stroke: 0xd4a64a, sw: 3 }).setName('lfDialog'));
  return cy;
}
function renderConfirm(c: LingfuCtx, p: Product) {
  const { s, R } = c, st = lingfuState, wal = wallet(), cy = dialog(c, 260);
  R.add(txt(s, 640, cy - 80, '确认购买', 22, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
  R.add(txt(s, 640, cy - 36, `${p.name}`, 20, '#fff').setOrigin(0.5));
  R.add(txt(s, 640, cy + 2, `花费 ${p.price} 灵符（${yuan(p.price)}）  余额 ${wal.balance()} → ${wal.balance() - p.price}`, 16, '#ffe070').setOrigin(0.5).setName('lfConfirmText'));
  hitBtn(c, 560, cy + 70, 140, 46, '确认', () => {
    const r = buy(c.world(), wal, p.sku); st.confirm = null;
    if (!r.ok && r.reason === 'balance') st.lack = p.sku;
    if (r.ok) { sfx(s, 'coin'); c.save(); }
    c.onChange(r.msg, r.ok); c.rerender();
  }, 18, true, 'lfOk');
  hitBtn(c, 720, cy + 70, 140, 46, '取消', () => { st.confirm = null; c.rerender(); }, 18, true, 'lfCancel');
}
function renderLack(c: LingfuCtx, p: Product) {
  const { s, R } = c, st = lingfuState, wal = wallet(), cy = dialog(c, 240);
  R.add(txt(s, 640, cy - 70, '灵符不足', 22, '#ff8a6a', { fontStyle: 'bold' }).setOrigin(0.5).setName('lfLack'));
  R.add(txt(s, 640, cy - 24, `${p.name} 需要 ${p.price} 灵符，当前 ${wal.balance()}`, 17, '#fff').setOrigin(0.5));
  R.add(txt(s, 640, cy + 10, '充值未接入支付', 15, '#aaa').setOrigin(0.5));
  hitBtn(c, 640, cy + 64, 160, 46, '知道了', () => { st.lack = null; c.rerender(); }, 18, true, 'lfLackOk');
}
