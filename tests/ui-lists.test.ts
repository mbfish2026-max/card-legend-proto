// B3 列表行 / 页签 / 滚动条九宫格（rowBg / scrollBar / tabButton / fitRow）+ 多存档界面 844 修正
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
// @ts-ignore
import { join } from 'node:path';
declare const process: any;
import { rowBg, scrollBar, listRowPitch, rowHitHeight, UI_SLICES, MOBILE_ROW_CSS, SCROLL_W } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const R = process.cwd(), src = (p: string) => readFileSync(join(R, p), 'utf8');
const mk = (hasAtlas: boolean) => {
  const obj = (kind: string, a: any[]) => { const o: any = { kind, a, scaled: false, name: '' };
    o.setOrigin = () => o; o.setStrokeStyle = () => o; o.setScale = () => { o.scaled = true; return o; }; o.setName = (n: string) => { o.name = n; return o; }; return o; };
  return { textures: { exists: (k: string) => hasAtlas && k === 'ui_atlas', get: () => ({ has: (f: string) => f in UI_SLICES }) },
    add: { nineslice: (...a: any[]) => obj('ns', a), rectangle: (...a: any[]) => obj('rect', a) } } as any;
};
for (const f of ['list_row', 'list_row_sel', 'tab_on', 'tab_off', 'scroll_track', 'scroll_thumb']) ok(f in UI_SLICES, `B3 帧 ${f} 在切片表`);
const L = UI_SLICES['list_row'];
for (const sel of [false, true]) {
  const o: any = rowBg(mk(true), 100, 50, 600, 52, sel, { fill: 1 });
  ok(o.kind === 'ns' && o.a[3] === (sel ? 'list_row_sel' : 'list_row') && o.a[4] === 600 && o.a[5] === 52 && !o.scaled, `rowBg sel=${sel} → 九宫格 setSize 600×52`);
  ok(o.a[6] === L.left && o.a[7] === L.right && o.a[8] === L.top && o.a[9] === L.bottom, `rowBg sel=${sel} 边距来自 uiSlices`);
  ok((rowBg(mk(false), 0, 0, 600, 52, sel, { fill: 1 }) as any).kind === 'rect', `rowBg sel=${sel} 无图集 → 代码矩形`);
}
{ const [t, h]: any = scrollBar(mk(true), 900, 100, 400, { y: 40, h: 80 });
  ok(t.kind === 'ns' && t.name === 'scrollTrack' && t.a[5] === 400 && t.a[4] === SCROLL_W, 'scrollBar 轨道九宫格 + 命名');
  ok(h.kind === 'ns' && h.name === 'scrollThumb' && h.a[5] === 80 && Math.abs(h.a[1] - 180) < 1e-9, 'scrollBar 滑块位置/高度'); }
{ const [t, h]: any = scrollBar(mk(false), 900, 100, 400, { y: 0, h: 80 }); ok(t.kind === 'rect' && h.kind === 'rect', 'scrollBar 无图集 → 矩形'); }
for (const base of [58, 62, 66]) for (const css of [0.54 * 1.28, 0.69]) {
  const p = listRowPitch(true, base, css), hh = rowHitHeight(true, 36, p, css);
  ok(p * css >= MOBILE_ROW_CSS - 1e-6 && hh <= p && hh * css >= 36 - 1e-6, `手机 pitch ${base}@${css.toFixed(2)} → ${p.toFixed(1)}，热区 ${hh.toFixed(1)} ≤ pitch 且 ≥36 CSS`);
}
ok(listRowPitch(false, 62, 1) === 62, '桌面 pitch 不变');
const P = src('src/ui/Panel.ts'), T = src('src/scenes/TitleScene.ts');
ok((P.match(/rowBg\(/g) ?? []).length >= 6, 'Panel 商店/书/技能/NPC/任务/成就用 rowBg');
ok(/scrollBar\(/.test(P) && /fitRow\(/.test(P) && /tabButton\(/.test(P), 'Panel 用 scrollBar / fitRow / tabButton');
ok(!/rowBg\([^;]*setScale|scrollBar\([^;]*setScale/.test(P), '列表九宫格不 setScale');
ok(/tab_on/.test(T) && /tab_off/.test(T), 'tabButton 用 tab_on/tab_off');
ok(/panel_frame', 640, 380, 1000, 640/.test(T) && /button\(this, 640, 668, 160, 40, '返回'/.test(T), '多存档：面板 60~700，返回底 688 在屏内');
ok(/fS = IS_MOBILE \? 22 : 14/.test(T), '多存档：手机小字 22 逻辑 px（≈12 CSS）');
console.log(`ui-lists: ${pass} passed`);
