// 世界大地图两级界面（docs/world-map-plan.md）：世界总图（4×2 底图分块 + 区域多边形 + 迷雾 + 等级段）→ 区域插画（节点/群节点/当前/BOSS）→ 传送确认卡。
// 桌面：滚轮缩放、拖拽、悬停提示；手机：单指拖、双指缩放、双击/再点区域进入，按钮/节点 ≥44px 实尺寸、文字 ≥12px。所有输入走全局 pointer 事件做命中测试。
import Phaser from 'phaser';
import * as WM from '../data/worldmap';
import { WM_ASSETS } from '../assets-manifest';
import { txt, button } from './mtext';
import { toLogic, toLogicX } from '../render';
import { IS_MOBILE } from '../mobile';
import { Settings } from '../settings';
import { FLOORS, floorNo } from '../data/world';
import { FLOOR_TARGET_LV } from '../data/balance';
import { World as WorldCls, type World } from '../combat/World';
import { sfx } from '../scenes/TitleScene';
import { TOWNS } from '../data/towns';

export interface WMState { area: string | null; view: WM.WmView | null; expand: string | null; confirm: WM.NodeGeo | null; sel: string | null; lastTap?: { id: string; t: number } }
export const newWMState = (): WMState => ({ area: null, view: null, expand: null, confirm: null, sel: null });
export interface WMHost {
  s: Phaser.Scene; R: Phaser.GameObjects.Container; top: number; w: World; st: WMState;
  render(): void; alive(): boolean; msg(t: string): void; teleport(f: number): void; town(t: string, name: string): void; off(fn: () => void): void;
}
const failed = new Set<string>();
/** 返回键：确认卡 → 区域 → 世界；返回 false 表示应关闭面板 */
export function wmBack(st: WMState): boolean {
  if (st.confirm) { st.confirm = null; return true; }
  if (st.expand) { st.expand = null; return true; }
  if (st.area) { st.area = null; st.view = null; return true; }
  return false;
}
/** 视口（面板逻辑坐标）。手机面板不缩放，所以按 0.54 实缩放放大尺寸 */
export const wmLayout = (top: number, mobile = IS_MOBILE) => mobile
  ? { VX: 150, VY: top + 84, VW: 980, VH: 346, FS: 24, NODE: 82, BTN: 84 }
  : { VX: 150, VY: top + 48, VW: 980, VH: 380, FS: 15, NODE: 44, BTN: 36 };

export function renderWorldMap(h: WMHost) {
  const { s, R, top, w, st } = h, M = IS_MOBILE, L = wmLayout(top), { VX, VY, VW, VH, FS } = L;
  // 按需加载（只加载本视图要的美术；失败的 key 记下，改用占位）
  const need = WM.wmNeed(st.area).filter(k => !s.textures.exists(k) && !failed.has(k));
  if (need.length) {
    need.forEach(k => s.load.image(k, WM_ASSETS[k]));
    const onErr = (f: { key: string }) => failed.add(f.key);
    s.load.on('loaderror', onErr);
    s.load.once('complete', () => { s.load.off('loaderror', onErr); if (h.alive()) h.render(); });
    s.load.start();
    R.add(txt(s, 640, VY + VH / 2, '地图加载中…', FS + 4, '#ffe8a0').setOrigin(0.5)); return;
  }
  const area = st.area, cw = area ? WM.WM_ART_W : WM.WM_W, ch = area ? WM.WM_ART_H : WM.WM_H;
  const ex: WM.Explore = { reached: w.reached, townsSeen: w.townsSeen };
  const curArea = w.town ? WM.WM_IDS.find(id => WM.NODE_GEO[id].some(n => n.town === w.town)) ?? WM.areaOf(w.floorIndex) : WM.areaOf(w.floorIndex);
  if (!st.view) {
    const m = area ? 1 : Settings.wmZoom;
    const c = area ? [cw / 2, ch / 2] : WM.REGION_GEO[curArea ?? 'bichi'].label;
    st.view = WM.centerWm(c[0], c[1], m, cw, ch, VW, VH);
  }
  const has = (k: string) => s.textures.exists(k);
  const Mk = s.add.container(0, 0); R.add(Mk);
  const vm = s.make.graphics({}, false).fillRect(VX, VY, VW, VH); Mk.setMask(vm.createGeometryMask());
  R.add(s.add.rectangle(VX + VW / 2, VY + VH / 2, VW, VH).setStrokeStyle(2, 0x6a5030));
  const C = s.add.container(0, 0); Mk.add(C);
  const fixed: { o: Phaser.GameObjects.Container; bx: number; by: number; ox: number; oy: number }[] = [];
  const labels: { o: Phaser.GameObjects.Text[]; pri: number }[] = [];
  const masks: Phaser.GameObjects.Graphics[] = [];
  const fx = (bx: number, by: number, ox = 0, oy = 0) => { const o = s.add.container(bx, by); C.add(o); fixed.push({ o, bx, by, ox, oy }); return o; };
  let z = 1, extra: (() => void) | undefined;
  const apply = () => {
    const v = st.view!; z = WM.fitZ(cw, ch, VW, VH) * v.m;
    C.setPosition(VX + v.x, VY + v.y).setScale(z); masks.forEach(g => g.setPosition(VX + v.x, VY + v.y).setScale(z));
    for (const f of fixed) f.o.setPosition(f.bx + f.ox / z, f.by + f.oy / z).setScale(1 / z);
    // 标签按优先级避让（城镇 > 当前 > BOSS > 其他）
    const rs = labels.map(l => { const b = l.o[0].getBounds(); return { x: b.x, y: b.y, w: b.width, h: b.height * l.o.length, pri: l.pri }; });
    const vis = WM.placeLabels(rs); labels.forEach((l, i) => l.o.forEach(t => t.setVisible(vis.has(i))));
  };
  const toC = (p: Phaser.Input.Pointer) => ({ x: (toLogicX(p.x) - VX - st.view!.x) / z, y: (toLogic(p.y) - VY - st.view!.y) / z });
  const inV = (p: Phaser.Input.Pointer) => { const x = toLogicX(p.x), y = toLogic(p.y); return x >= VX && x <= VX + VW && y >= VY && y <= VY + VH; };
  let onTap: (p: Phaser.Input.Pointer) => void = () => {}, onHover: (p: Phaser.Input.Pointer) => void = () => {};

  if (!area) {
    // —— 世界总图 ——
    for (const [k, key] of WM.WM_TILE_KEYS.entries()) {
      const tx = (k % WM.WM_TILES_X) * WM.WM_TILE_W, ty = Math.floor(k / WM.WM_TILES_X) * WM.WM_TILE_H;
      C.add(has(key) ? s.add.image(tx, ty, key).setOrigin(0).setDisplaySize(WM.WM_TILE_W, WM.WM_TILE_H) : s.add.rectangle(tx, ty, WM.WM_TILE_W, WM.WM_TILE_H, 0x1a2a3a).setOrigin(0).setStrokeStyle(2, 0x24384a));
    }
    // 连接：道路实线 / 海路虚线 / NPC 传送点线
    const g = s.add.graphics(); C.add(g); const drawn = new Set<string>();
    for (const id of WM.WM_IDS) for (const l of WM.REGION_GEO[id].links) {
      const key = [id, l.to].sort().join('-'); if (drawn.has(key)) continue; drawn.add(key);
      const [a, b] = [WM.REGION_GEO[id].label, WM.REGION_GEO[l.to].label], lit = WM.areaFog(id, ex) === 'lit' && WM.areaFog(l.to, ex) === 'lit';
      const col = l.kind === 'sea' ? 0x80c8f0 : l.kind === 'npc' ? 0xe080ff : 0xf0d890, dash = l.kind === 'road' ? 0 : l.kind === 'sea' ? 40 : 14;
      g.lineStyle(10, col, lit ? 0.85 : 0.3);
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = dash ? Math.floor(d / dash) : 1;
      for (let i = 0; i < n; i += dash ? 2 : 1) { const t0 = i / n, t1 = Math.min(1, (i + 1) / n); g.lineBetween(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1); }
    }
    for (const id of WM.WM_IDS) {
      const r = WM.REGION_GEO[id], fog = WM.areaFog(id, ex) === 'fog', here = id === curArea, sel = st.sel === id;
      const pts = r.poly.flatMap(([x, y]) => [x, y]);
      if (fog) {
        if (has('world_fog')) {
          const xs = r.poly.map(p => p[0]), ys = r.poly.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
          const ts = s.add.tileSprite(x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, 'world_fog').setOrigin(0).setAlpha(0.95); C.add(ts);
          const mg = s.make.graphics({}, false).fillStyle(0xffffff).fillPoints(r.poly.map(([x, y]) => ({ x, y })), true); masks.push(mg); ts.setMask(mg.createGeometryMask());
          h.off(() => mg.destroy());
        } else C.add(s.add.polygon(0, 0, pts, 0x202020, 0.75).setOrigin(0));
      }
      const pg = s.add.graphics(); C.add(pg);
      pg.lineStyle(here || sel ? 12 : 6, here ? 0x66ff66 : sel ? 0xffffff : fog ? 0x888888 : r.color, fog ? 0.6 : 0.9).strokePoints(r.poly.map(([x, y]) => ({ x, y })), true, true);
      if (!fog) pg.fillStyle(r.color, sel ? 0.22 : 0.1).fillPoints(r.poly.map(([x, y]) => ({ x, y })), true);
      const fl = WM.fogLabel(id, ex), o = fx(r.label[0], r.label[1]);
      const t1 = txt(s, 0, 0, fl.name, FS + 6, fog ? '#bbbbbb' : '#ffe8a0', { fontStyle: 'bold', strokeThickness: 4 }).setOrigin(0.5);
      const t2 = txt(s, 0, FS + 8, fl.band, FS, fog ? '#aaaaaa' : '#ffffff', { strokeThickness: 3 }).setOrigin(0.5);
      o.add([t1, t2]);
      if (here) { const pi = has('icon_wm_player') ? s.add.image(0, -FS * 2 - 10, 'icon_wm_player').setDisplaySize(L.NODE * 0.8, L.NODE * 0.8) : txt(s, 0, -FS * 2, '▼ 你在这里', FS, '#66ff66', { fontStyle: 'bold' }).setOrigin(0.5); o.add(pi); s.tweens.add({ targets: pi, scale: pi.scale * 1.15, yoyo: true, repeat: -1, duration: 600 }); }
    }
    const inside = (id: string, x: number, y: number) => Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(WM.REGION_GEO[id].poly.flatMap(p => p)), x, y);
    const hit = (p: Phaser.Input.Pointer) => { const c = toC(p); return WM.WM_IDS.find(id => inside(id, c.x, c.y)) ?? null; };
    const enter = (id: string) => { sfx(s, 'click', 0.4); st.area = id; st.view = null; st.sel = null; st.expand = null; Settings.wmArea = id; Settings.save(); h.render(); };
    onTap = p => {
      const id = hit(p); if (!id) { if (st.sel) { st.sel = null; h.render(); } return; }
      if (WM.areaFog(id, ex) === 'fog') { h.msg(`未探索区域（${WM.bandText(id)}）：到达该区域任一层后点亮`); return; }
      const now = s.time.now, dbl = st.lastTap?.id === id && now - st.lastTap.t < 400; st.lastTap = { id, t: now };
      if (!M || dbl || st.sel === id) return enter(id);
      st.sel = id; h.render();
    };
    // 桌面悬停提示
    const tip = txt(s, 0, 0, '', 14, '#ffffff', { backgroundColor: '#000000cc', padding: { x: 6, y: 4 } }).setVisible(false); R.add(tip);
    onHover = p => {
      if (M || p.isDown) return; const id = inV(p) ? hit(p) : null; if (!id) { tip.setVisible(false); return; }
      const fog = WM.areaFog(id, ex) === 'fog', r = WM.REGION_GEO[id], got = r.floors.filter(f => w.reached.has(f)).length;
      tip.setText(fog ? `？？？ ${WM.bandText(id)}\n未探索` : `${r.name} ${WM.bandText(id)}\n已探索 ${got}/${r.floors.length} 层${r.note ? `\n${r.note}` : ''}`).setPosition(toLogicX(p.x) + 14, toLogic(p.y) + 10).setVisible(true);
    };
    const selName = st.sel ? WM.REGION_GEO[st.sel].name : '';
    R.add(txt(s, 640, VY + VH + (M ? 24 : 18), M ? (st.sel ? `已选 ${selName}：再点一次或双击进入` : '拖动平移 · 双指缩放 · 点区域选中，再点进入') : '拖动平移 / 滚轮缩放 / 点击区域进入（M 关闭，Esc 返回）', M ? FS : 13, '#9fd').setOrigin(0.5));
    if (M && st.sel) { const id = st.sel; R.add([...button(s, VX + VW - 110, VY + VH - 50, 200, L.BTN, `进入${selName.slice(0, 4)}`, () => enter(id), FS)]); }
  } else {
    // —— 区域插画 ——
    const r = WM.REGION_GEO[area], key = r.art;
    C.add(has(key) ? s.add.image(0, 0, key).setOrigin(0).setDisplaySize(cw, ch) : s.add.rectangle(0, 0, cw, ch, r.color, 0.35).setOrigin(0));
    if (!has(key)) { const gg = s.add.graphics().lineStyle(2, 0x000000, 0.25); for (let x = 0; x <= cw; x += 128) gg.lineBetween(x, 0, x, ch); for (let y = 0; y <= ch; y += 128) gg.lineBetween(0, y, cw, y); C.add(gg); }
    const items = WM.clusters(area), lines = s.add.graphics(); C.add(lines);
    type Hit = { bx: number; by: number; ox: number; oy: number; n: WM.NodeGeo | WM.NodeCluster };
    const hits: Hit[] = [];
    const draw = (n: WM.NodeGeo | WM.NodeCluster, bx: number, by: number, ox = 0, oy = 0) => {
      const isC = WM.isCluster(n), mem = isC ? n.members : [n], lit = mem.some(m => WM.nodeLit(area, m, ex));
      const here = mem.some(m => m.floor !== undefined ? m.floor === w.floorIndex && !w.town : !!m.town && m.town === w.town);
      const o = fx(bx, by, ox, oy), S = L.NODE, first = mem[0];
      const icon = lit ? WM.wmIcon(first) : 'icon_wm_locked';
      o.add(s.add.circle(0, 0, S / 2, 0x000000, lit ? 0.35 : 0.55).setStrokeStyle(here ? 4 : 2, here ? 0x66ff66 : lit ? 0xd4a64a : 0x555555));
      if (has(icon)) o.add(s.add.image(0, 0, icon).setDisplaySize(S * 0.92, S * 0.92).setAlpha(lit ? 1 : 0.7));
      else o.add(txt(s, 0, 0, lit ? ({ town: '城', cave: '洞', dungeon: '本', exit: '→' } as const)[first.kind] : '？', FS, '#fff', { fontStyle: 'bold' }).setOrigin(0.5));
      const bossF = mem.find(m => WM.nodeBoss(m)); if (bossF && lit) { const killed = w.bossKilled.has(bossF.floor!), bs = S * 0.45;
        const b = has('icon_wm_boss') ? s.add.image(S * 0.4, -S * 0.4, 'icon_wm_boss').setDisplaySize(bs, bs) : txt(s, S * 0.4, -S * 0.4, '☠', FS, '#fff').setOrigin(0.5);
        if (killed) (b as Phaser.GameObjects.Image).setTint?.(0x666666), b.setAlpha(0.6); o.add(b); }
      if (isC) o.add(txt(s, S * 0.42, S * 0.36, `${mem.length}`, FS - 2, '#ffe080', { fontStyle: 'bold', strokeThickness: 3 }).setOrigin(0.5));
      if (here) { const pi = has('icon_wm_player') ? s.add.image(0, -S * 0.95, 'icon_wm_player').setDisplaySize(S * 0.7, S * 0.7) : txt(s, 0, -S * 0.9, '▼', FS, '#66ff66').setOrigin(0.5); o.add(pi); s.tweens.add({ targets: pi, y: pi.y - 8, scale: pi.scale * 1.12, yoyo: true, repeat: -1, duration: 550 }); }
      const nm = lit ? n.name : '？？？', f = first.floor;
      const sub = isC ? (lit ? `${mem.filter(m => w.reached.has(m.floor!)).length}/${mem.length} 层已到达` : '') : f !== undefined ? (lit ? `第${floorNo(f, w.floors)}层 Lv${FLOOR_TARGET_LV[f]}` : `Lv${FLOOR_TARGET_LV[f]}`) : first.kind === 'town' ? '安全区' : '';
      const t1 = txt(s, 0, S / 2 + 4, nm, FS, lit ? '#ffe8a0' : '#999999', { strokeThickness: 3 }).setOrigin(0.5, 0); o.add(t1);
      const ls = [t1]; if (sub) { const t2 = txt(s, 0, S / 2 + 6 + FS, sub, FS - 3, '#cccccc', { strokeThickness: 3 }).setOrigin(0.5, 0); o.add(t2); ls.push(t2); }
      labels.push({ o: ls, pri: WM.labelPri(isC ? { members: mem } : first, w.town ? -1 : w.floorIndex) });
      hits.push({ bx, by, ox, oy, n });
    };
    for (const n of items) {
      if (WM.isCluster(n) && st.expand === n.id) {
        // 展开环：椭圆（横向更宽），整体平移到视口内，避免节点被裁掉
        const k = n.members.length, R0 = (M ? 150 : 95) + k * (M ? 6 : 4), zz = WM.fitZ(cw, ch, VW, VH) * st.view!.m;
        const rx = Math.min(R0 * 1.5, VW / 2 - L.NODE - L.BTN), ry = Math.min(R0 * 0.8, VH / 2 - L.NODE / 2 - FS * 2 - 6);
        const hx = st.view!.x + n.x * zz, hy = st.view!.y + n.y * zz;
        const cx = Math.max(rx + L.NODE / 2 + 4, Math.min(VW - rx - L.NODE / 2 - L.BTN - 8, hx)), cy = Math.max(ry + L.NODE / 2 + 4, Math.min(VH - ry - L.NODE / 2 - FS * 2 - 4, hy));
        const off = (i: number): [number, number] => { const a = -Math.PI / 2 + i * 2 * Math.PI / k; return [cx - hx + Math.cos(a) * rx, cy - hy + Math.sin(a) * ry]; };
        n.members.forEach((m, i) => { const [ox, oy] = off(i); draw(m, n.x, n.y, ox, oy); });
        const hub = fx(n.x, n.y); hub.add(s.add.circle(0, 0, 10, 0xd4a64a)); hub.add(txt(s, 0, -26, n.name, FS - 2, '#ffd24a', { strokeThickness: 3 }).setOrigin(0.5));
        const redraw = () => { lines.clear().lineStyle(3 / z, 0xd4a64a, 0.6); n.members.forEach((m, i) => { const [ox, oy] = off(i); lines.lineBetween(n.x, n.y, n.x + ox / z, n.y + oy / z); }); };
        extra = redraw;
      } else draw(n, n.x, n.y);
    }
    const pick = (p: Phaser.Input.Pointer) => {
      const x = toLogicX(p.x), y = toLogic(p.y), rad = L.NODE / 2 + 6;
      let best: Hit | null = null, bd = rad;
      for (const ht of hits) { const sx = VX + st.view!.x + ht.bx * z + ht.ox, sy = VY + st.view!.y + ht.by * z + ht.oy, d = Math.hypot(sx - x, sy - y); if (d <= bd) { bd = d; best = ht; } }
      return best;
    };
    onTap = p => {
      const ht = pick(p); if (!ht) { if (st.expand) { st.expand = null; h.render(); } return; }
      const n = ht.n; sfx(s, 'click', 0.4);
      if (WM.isCluster(n)) { st.expand = st.expand === n.id ? null : n.id; h.render(); return; }
      if (n.to) { st.area = n.to; st.view = null; st.expand = null; h.render(); return; }
      if (!WM.nodeLit(area, n, ex)) { h.msg(n.floor !== undefined ? '到达该层后解锁传送' : '未探索'); return; }
      const t = WM.nodeTeleport(w, n); if (!t.ok && t.why && (t.why.startsWith('你已') || t.kind === 'none')) { h.msg(t.why); return; }
      st.confirm = n; h.render();
    };
    R.add([...button(s, VX + (M ? 90 : 60), top + (M ? 40 : 22), M ? 170 : 110, M ? L.BTN : 32, '◀ 世界', () => { wmBack({ ...st, confirm: null, expand: null }); st.area = null; st.view = null; st.expand = null; h.render(); }, M ? FS : 15)]);
    R.add(txt(s, 640, top + (M ? 52 : 22) + (M ? 0 : 0), `${r.name}  ${WM.bandText(area)}`, M ? FS + 2 : 18, '#ffe8a0', { fontStyle: 'bold' }).setOrigin(0.5));
    R.add(txt(s, 640, VY + VH + (M ? 24 : 18), M ? '点节点传送 · 点 ⓝ 群节点展开' : `点击节点传送（只能去已到达层；战斗中不可；冷却 ${WorldCls.TELEPORT_CD} 秒；费用 (层序+1)×20 金）· 数字角标=图群，点开展开`, M ? FS : 13, '#9fd').setOrigin(0.5));
  }
  apply();
  const redrawLines = extra; redrawLines?.();
  // —— 输入：拖动 / 双指 / 滚轮 / 点按 ——
  s.input.addPointer(1);
  let downAt: { x: number; y: number } | null = null, moved = 0, pinch = 0;
  const upd = () => { apply(); redrawLines?.(); };
  const onDown = (p: Phaser.Input.Pointer) => { if (st.confirm || !inV(p)) return; downAt = { x: toLogicX(p.x), y: toLogic(p.y) }; moved = 0; };
  const onMove = (p: Phaser.Input.Pointer) => {
    onHover(p); if (st.confirm) return;
    const p1 = s.input.pointer1, p2 = s.input.pointer2;
    if (p1?.isDown && p2?.isDown) {
      const d = Math.hypot(toLogicX(p1.x) - toLogicX(p2.x), toLogic(p1.y) - toLogic(p2.y));
      if (pinch) st.view = WM.zoomWm(st.view!, (toLogicX(p1.x) + toLogicX(p2.x)) / 2 - VX, (toLogic(p1.y) + toLogic(p2.y)) / 2 - VY, d / pinch, cw, ch, VW, VH);
      pinch = d; moved = 99; upd(); return;
    }
    pinch = 0; if (!downAt || !p.isDown) return;
    const dx = toLogicX(p.x) - toLogicX(p.prevPosition.x), dy = toLogic(p.y) - toLogic(p.prevPosition.y); moved += Math.abs(dx) + Math.abs(dy);
    st.view = WM.clampWm({ ...st.view!, x: st.view!.x + dx, y: st.view!.y + dy }, cw, ch, VW, VH); upd();
  };
  const saveZoom = () => { if (!area && Settings.wmZoom !== st.view!.m) { Settings.wmZoom = st.view!.m; Settings.save(); } };
  const onUp = (p: Phaser.Input.Pointer) => { const tap = !!downAt && moved < 12 && !pinch; downAt = null; pinch = 0; saveZoom(); if (tap && !st.confirm) onTap(p); };
  const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => { if (st.confirm || !inV(p)) return; st.view = WM.zoomWm(st.view!, toLogicX(p.x) - VX, toLogic(p.y) - VY, dy > 0 ? 0.9 : 1.1, cw, ch, VW, VH); upd(); saveZoom(); };
  s.input.on('pointerdown', onDown); s.input.on('pointermove', onMove); s.input.on('pointerup', onUp); s.input.on('wheel', onWheel);
  h.off(() => { s.input.off('pointerdown', onDown); s.input.off('pointermove', onMove); s.input.off('pointerup', onUp); s.input.off('wheel', onWheel); vm.destroy(); });
  const zb = (k: number) => { st.view = WM.zoomWm(st.view!, VW / 2, VH / 2, k, cw, ch, VW, VH); upd(); saveZoom(); };
  const B = L.BTN, bx = VX + VW - B / 2 - 6;
  R.add([...button(s, bx, VY + B / 2 + 6, B, B, '＋', () => zb(1.25), M ? FS + 4 : 18)]);
  R.add([...button(s, bx, VY + B * 1.5 + 14, B, B, '－', () => zb(0.8), M ? FS + 4 : 18)]);
  if (st.confirm) confirmCard(h, st.confirm, L);
}

/** 传送确认卡：地名、推荐等级、费用、冷却；城镇节点走回城 */
function confirmCard(h: WMHost, n: WM.NodeGeo, L: ReturnType<typeof wmLayout>) {
  const { s, R, w, st } = h, M = IS_MOBILE, FS = L.FS, cx = 640, cy = L.VY + L.VH / 2, CW = M ? 640 : 460, CH = M ? 300 : 210;
  R.add(s.add.rectangle(cx, cy, 2000, 2000, 0x000000, 0.35).setInteractive());
  if (s.textures.exists('wm_frame')) R.add(s.add.nineslice(cx, cy, 'wm_frame', undefined, CW, CH, 24, 24, 24, 24));
  else R.add(s.add.rectangle(cx, cy, CW, CH, 0x1c140c, 0.97).setStrokeStyle(3, 0xd4a64a));
  const t = WM.nodeTeleport(w, n), f = n.floor;
  const lines = n.town
    ? [`回城：${TOWNS[n.town]?.name ?? n.name}`, '安全区（免费）', t.why ?? '']
    : [`${FLOORS[f!].name}（第 ${floorNo(f!, w.floors)} 层）`, `推荐等级 Lv${FLOOR_TARGET_LV[f!]}${WM.nodeBoss(n) ? ` · BOSS ${WM.nodeBoss(n)!.name}${w.bossKilled.has(f!) ? '（已击杀）' : ''}` : ''}`, `费用 ${t.cost ?? w.teleportCost(f!)} 金 · 冷却 ${WorldCls.TELEPORT_CD} 秒`, t.why ?? ''];
  lines.forEach((l, i) => l && R.add(txt(s, cx, cy - CH / 2 + (M ? 34 : 26) + i * (FS + 12), l, i ? FS : FS + 4, i === 3 || (n.town && i === 2) ? '#ff8080' : i ? '#ffffff' : '#ffe8a0', { fontStyle: i ? undefined : 'bold' }).setOrigin(0.5, 0)));
  const by = cy + CH / 2 - L.BTN / 2 - 14, bw = M ? 220 : 130, bh = M ? L.BTN : 34;
  R.add([...button(s, cx - bw / 2 - 16, by, bw, bh, n.town ? '回城' : '传送', () => {
    st.confirm = null;
    if (n.town) { h.town(n.town, n.name); return; }
    h.teleport(f!);
  }, M ? FS : 16, t.ok)]);
  R.add([...button(s, cx + bw / 2 + 16, by, bw, bh, '取消', () => { st.confirm = null; h.render(); }, M ? FS : 16)]);
}
