// B2 面板/弹窗九宫格 + 手机 44px 列表行（src/ui/uiSlices.ts frameBg / listRowPitch / rowHitHeight）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
// @ts-ignore
import { join } from 'node:path';
declare const process: any;
import { frameBg, listRowPitch, rowHitHeight, UI_SLICES, MOBILE_ROW_CSS, MIN_TAP_MOBILE_PHYS } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const R = process.cwd();
// 假场景：记录创建了哪种对象
const mk = (hasAtlas: boolean, frames: string[] = Object.keys(UI_SLICES)) => {
  const log: any[] = [];
  const obj = (kind: string, a: any[]) => { const o: any = { kind, a, origin: null, stroke: null, scaled: false };
    o.setOrigin = (x: number, y: number) => { o.origin = [x, y]; return o; }; o.setStrokeStyle = (...s: any[]) => { o.stroke = s; return o; }; o.setScale = () => { o.scaled = true; return o; }; log.push(o); return o; };
  const s: any = { textures: { exists: (k: string) => hasAtlas && k === 'ui_atlas', get: () => ({ has: (f: string) => frames.includes(f) }) },
    add: { nineslice: (...a: any[]) => obj('ns', a), rectangle: (...a: any[]) => obj('rect', a) } };
  return { s, log };
};
const FR = ['panel_frame', 'panel_frame_s', 'dialog_frame', 'title_plate', 'inset_frame', 'tooltip_frame'];
for (const f of FR) {
  ok(f in UI_SLICES, `B2 帧 ${f} 在图集切片表`);
  const d = UI_SLICES[f];
  { const { s } = mk(true); const o: any = frameBg(s, f, 10, 20, 400, 300, { fill: 1 }); ok(o.kind === 'ns' && o.a[4] === 400 && o.a[5] === 300 && !o.scaled, `${f} 有图集 → 九宫格 400×300（setSize，不 setScale）`);
    ok(o.a[6] === d.left && o.a[7] === d.right && o.a[8] === d.top && o.a[9] === d.bottom, `${f} 边距来自 uiSlices`); }
  { const { s } = mk(false); const o: any = frameBg(s, f, 0, 0, 400, 300, { fill: 0x123, stroke: 0x456, sw: 2 }); ok(o.kind === 'rect' && o.stroke[0] === 2 && o.stroke[1] === 0x456, `${f} 图集被拦 → 原矩形回退（含描边）`); }
  { const { s } = mk(true, []); ok((frameBg(s, f, 0, 0, 400, 300, { fill: 1 }) as any).kind === 'rect', `${f} 图集缺帧 → 回退`); }
  { const { s } = mk(true); ok((frameBg(s, f, 0, 0, Math.max(1, d.left + d.right - 1), 300, { fill: 1 }) as any).kind === 'rect', `${f} 宽小于边距和 → 回退`); }
}
{ const { s } = mk(true); const o: any = frameBg(s, 'dialog_frame', 0, 0, 300, 200, { fill: 1 }, 0, 0); ok(o.origin[0] === 0 && o.origin[1] === 0, '原点参数生效'); }
// 行距 / 点击区
ok(listRowPitch(false, 50, 0.5) === 50 && rowHitHeight(false, 30, 50, 0.5) === 44, '桌面行距 50、点击区 44 不变');
for (const vh of [320, 360, 390, 430]) for (const k of [1, 1.28]) {
  const cssU = vh / 720 * k, P = listRowPitch(true, 50, cssU), H = rowHitHeight(true, 30, P, cssU);
  ok(P * cssU >= MOBILE_ROW_CSS - 1e-9, `手机 vh${vh}×${k} 行距 ${(P * cssU).toFixed(1)} ≥ 44 CSS px`);
  ok(H * cssU >= MIN_TAP_MOBILE_PHYS - 1e-9 && H <= P, `手机 vh${vh}×${k} 按钮点击区 ${(H * cssU).toFixed(1)} ≥ 36 CSS px 且 ≤ 行距（不重叠）`);
}
// 源码用 frameBg
const rd = (p: string) => readFileSync(join(R, p), 'utf8');
ok(/frameBg\(s, (?:'panel_frame'|panelFrameName\()/.test(rd('src/ui/Panel.ts')) && /'tooltip_frame'/.test(rd('src/ui/Panel.ts')) && /'inset_frame'/.test(rd('src/ui/Panel.ts')), 'Panel.ts 面板底/提示框/嵌框走 frameBg');
ok((rd('src/scenes/TitleScene.ts').match(/frameBg\([^)]*'panel_frame'/g) ?? []).length >= 2, 'TitleScene 设置 + 多存档弹窗走 frameBg');
ok(/'dialog_frame'/.test(rd('src/ui/Hud.ts')) && /'dialog_frame'/.test(rd('src/ui/WorldMapView.ts')), 'Hud 地图总览 / 世界地图确认卡走 dialog_frame');
ok(!/nineslice[^\n]*setScale|frameBg\([^\n]*\)\.setScale/.test(rd('src/ui/Panel.ts') + rd('src/ui/Hud.ts') + rd('src/scenes/TitleScene.ts')), '九宫格不 setScale');
console.log(`ui-panels: ${pass} passed`);
