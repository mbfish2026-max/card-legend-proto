// 账号与云存档界面：登录/注册（DOM 输入框）、账号状态、冲突选择。未配置时只显示「未配置」，不影响游客
import type Phaser from 'phaser';
import { CLASSES } from '../data/classes';
import { floorNo } from '../data/world';
import { fmtDate, Slots } from '../settings';
import type { CloudSync, Conflict } from '../cloud/sync';
import { validPassword, validUsername } from '../cloud/account';

type Btn = (s: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, size?: number, enabled?: boolean) => readonly [Phaser.GameObjects.GameObject, Phaser.GameObjects.GameObject];
type Txt = (s: Phaser.Scene, x: number, y: number, t: string, size: number, color?: string, extra?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
export interface AccountHost { scene: Phaser.Scene; L: Phaser.GameObjects.Container; button: Btn; txt: Txt; back: () => void; rerender: () => void; setForm: (el: HTMLElement | null) => void }

export function chipLabel(c: CloudSync): { label: string; enabled: boolean } {
  switch (c.status) {
    case 'off': return { label: '账号：未配置', enabled: false };
    case 'restoring': return { label: '正在恢复登录…', enabled: false };
    case 'guest': return { label: '登录 / 注册', enabled: true };
    case 'online': return { label: `☁ ${c.username}`, enabled: true };
    case 'offline': return { label: `${c.username}（离线）`, enabled: true };
    case 'conflict': return { label: '存档冲突 · 点此处理', enabled: true };
  }
}
const css = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) => Object.assign(el.style, s);
/** 登录表单：DOM 覆盖层（输入法/密码管理器可用），字号 16px 防 iOS 放大 */
export function loginForm(h: AccountHost, c: CloudSync, note = '') {
  const { scene: s, L } = h;
  L.add(s.add.rectangle(640, 360, 1280 * 2, 720, 0x000000, 0.55));
  const f = document.createElement('div'); f.id = 'fcl-login';
  css(f, { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(420px, 92vw)', maxHeight: '94vh', overflow: 'auto', boxSizing: 'border-box', padding: '16px 20px', background: 'rgba(21,16,11,.97)', border: '3px solid #d4a64a', borderRadius: '8px', color: '#e8d8b0', font: '15px/1.5 "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif', zIndex: '50' });
  const inp = 'width:100%;box-sizing:border-box;margin:4px 0 10px;padding:8px 10px;font-size:16px;background:#221a10;color:#ffe8a0;border:2px solid #6a5a3a;border-radius:4px';
  const bt = 'flex:1;padding:9px 0;font-size:16px;font-weight:bold;background:#2a1a0c;color:#ffe8a0;border:2px solid #d4a64a;border-radius:4px';
  f.innerHTML = `<div style="text-align:center;color:#ffd24a;font-size:22px;font-weight:bold;margin-bottom:6px">账号登录</div>
    <label>用户名<input id="fcl-u" autocomplete="username" maxlength="16" style="${inp}" placeholder="2–16 位：中文/英文/数字/下划线"></label>
    <label>密码<input id="fcl-p" type="password" autocomplete="current-password" maxlength="72" style="${inp}" placeholder="至少 8 位"></label>
    <div id="fcl-msg" style="min-height:22px;color:#ff9a7a;font-size:14px">${note}</div>
    <div style="display:flex;gap:10px;margin-top:4px"><button id="fcl-in" style="${bt}">登录</button><button id="fcl-up" style="${bt}">注册</button><button id="fcl-back" style="${bt};border-color:#6a5a3a">返回</button></div>
    <div style="margin-top:10px;font-size:13px;color:#a89a7a">不登录也能以游客身份玩，存档只在本机。登录后本地存档会先完整备份再同步到云端；两边不同时由你选择保留哪一份。用户名注册后无法用邮件找回密码，请牢记。</div>`;
  document.body.appendChild(f); h.setForm(f);
  const $ = (id: string) => f.querySelector('#' + id) as HTMLInputElement, msg = $('fcl-msg');
  const go = async (signup: boolean) => {
    const u = $('fcl-u').value, p = $('fcl-p').value, e = validUsername(u) ?? validPassword(p);
    if (e) { msg.textContent = e; return; }
    msg.style.color = '#cfc0a0'; msg.textContent = signup ? '注册中…' : '登录中…'; $('fcl-in').disabled = $('fcl-up').disabled = true;
    try { await c.login(u, p, signup); h.setForm(null); h.rerender(); }
    catch (err) { msg.style.color = '#ff9a7a'; msg.textContent = String((err as Error)?.message ?? err); $('fcl-in').disabled = $('fcl-up').disabled = false; }
  };
  $('fcl-in').onclick = () => void go(false); $('fcl-up').onclick = () => void go(true);
  $('fcl-back').onclick = () => { h.setForm(null); h.back(); };
  $('fcl-p').onkeydown = ev => { if (ev.key === 'Enter') void go(false); };
}
/** 已登录：账号状态 */
export function accountPanel(h: AccountHost, c: CloudSync, note = '') {
  const { scene: s, L, button, txt } = h;
  L.add(s.add.rectangle(640, 360, 640, 400, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
  L.add(txt(s, 640, 196, '账 号', 26, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5));
  const st = { online: '已同步 / 在线', offline: '离线（本地照常保存，联网后自动补传）', conflict: `有 ${c.conflicts.length} 个存档冲突待选择`, restoring: '正在恢复登录…', guest: '', off: '' }[c.status];
  L.add(txt(s, 640, 250, `用户名：${c.username}`, 18, '#e8d8b0').setOrigin(0.5));
  L.add(txt(s, 640, 284, `状态：${st}`, 16, c.status === 'online' ? '#9fd89f' : '#ffcf7a').setOrigin(0.5));
  L.add(txt(s, 640, 316, c.dirty.length ? `待上传：存档 ${c.dirty.join('、')}` : '没有待上传的存档', 14, '#a89a7a').setOrigin(0.5));
  if (note) L.add(txt(s, 640, 346, note, 14, '#ffcf7a').setOrigin(0.5));
  if (c.status === 'conflict') L.add([...button(s, 640, 400, 240, 46, '处理存档冲突', () => h.rerender(), 17)]);
  else L.add([...button(s, 640, 400, 240, 46, '立即同步', async () => { await c.flush(); accountRe(h, c, c.status === 'offline' ? '网络不可用，稍后自动重试' : '同步完成'); }, 17)]);
  L.add([...button(s, 520, 480, 200, 44, '退出登录', async () => { await c.logout(); h.back(); }, 16)]);
  L.add([...button(s, 760, 480, 200, 44, '返回', () => h.back(), 16)]);
}
const accountRe = (h: AccountHost, c: CloudSync, note: string) => { h.L.removeAll(true); accountPanel(h, c, note); };
const brief = (d: Conflict['local'] | undefined) => d ? `${CLASSES[d.cls]?.name ?? d.cls}  Lv${d.level}  第 ${floorNo(d.floorIndex)} 层  金币 ${d.gold}` : '空';
/** 冲突选择：每个冲突槽并排显示本地/云端，玩家二选一；被放弃的一份写备份键 */
export function conflictScreen(h: AccountHost, c: CloudSync) {
  const { scene: s, L, button, txt } = h, list = c.conflicts.slice(0, 4);
  L.add(s.add.rectangle(640, 372, 1040, 620, 0x15100b, 0.97).setStrokeStyle(3, 0xd4a64a));
  L.add(txt(s, 640, 92, '存档冲突：请选择保留哪一份', 24, '#ffd24a', { fontStyle: 'bold' }).setOrigin(0.5).setName('conflict-title'));
  L.add(txt(s, 640, 124, '同一存档位在本机和云端的内容不同。不会自动覆盖；你放弃的那一份会存入本机备份，不会丢失。', 14, '#cfc0a0').setOrigin(0.5));
  const rowH = 128;
  list.forEach((cf, k) => {
    const y = 156 + k * rowH, name = Slots.list().find(x => x.i === cf.slot)?.name ?? `存档 ${cf.slot}`;
    L.add(s.add.rectangle(640, y + rowH / 2 - 4, 1000, rowH - 12, 0x221a10).setStrokeStyle(2, 0x6a5a3a).setName('conflict:' + cf.slot));
    L.add(txt(s, 160, y + 14, `${cf.slot}. ${name}`, 18, '#ffe8a0', { fontStyle: 'bold' }));
    const side = (x: number, title: string, d: Conflict['local'], when: string, choice: 'local' | 'cloud') => {
      L.add(txt(s, x, y + 44, title, 15, '#9fd'));
      L.add(txt(s, x, y + 66, brief(d), 15, '#e8d8b0'));
      L.add(txt(s, x, y + 88, when, 13, '#a89a7a'));
      L.add([...button(s, x + 380, y + 72, 120, 40, choice === 'local' ? '保留本机' : '保留云端', async () => { await c.resolve(cf.slot, choice); h.rerender(); }, 15)]);
    };
    side(160, '本机', cf.local, `最后游玩 ${fmtDate(Slots.list().find(x => x.i === cf.slot)?.lastAt ?? null)}`, 'local');
    L.add(s.add.rectangle(640, y + 72, 2, 80, 0x6a5a3a));
    side(660, '云端', cf.cloud.data, `云端更新 ${fmtDate(Date.parse(cf.cloud.updated_at) || null)}`, 'cloud');
  });
  if (c.conflicts.length > list.length) L.add(txt(s, 640, 156 + list.length * rowH, `还有 ${c.conflicts.length - list.length} 个，处理完上面的再显示`, 14, '#ffcf7a').setOrigin(0.5, 0));
  L.add([...button(s, 640, 660, 220, 40, '稍后处理（暂不同步这些槽）', () => h.back(), 14)]);
}
