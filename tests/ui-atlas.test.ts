// B0/B1 UI 图集管线（scripts/pack-ui-atlas.py → public/assets/ui/ui_atlas.* + src/data/ui-slices.ts；src/ui/uiSlices.ts）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync, readdirSync } from 'node:fs';
// @ts-ignore
import { join } from 'node:path';
declare const process: any;
import SLICES from '../src/data/ui-slices';
import { atlasReady, ns, minTapHeight, MIN_TAP, MIN_TAP_MOBILE_PHYS, UI_ATLAS_PNG, domUrl } from '../src/ui/uiSlices';
import { mapAssetUrl } from '../src/assetUrlMap';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const R = process.cwd();
const atlas = JSON.parse(readFileSync(join(R, 'public/assets/ui/ui_atlas.json'), 'utf8'));
const src = JSON.parse(readFileSync(join(R, 'docs/ui-preview/slices.json'), 'utf8'));
const srcMap: Record<string, any> = src;
ok(atlas.meta.size.w === 512 && atlas.meta.size.h === 512, '图集 512×512');
const vc = readFileSync(join(R, 'vite.config.ts'), 'utf8');
const fr = atlas.frames as Record<string, any>, keys = Object.keys(SLICES as any).sort();
ok(keys.length === 47, `最终图集 47 帧（45 切片含 lingfu_entry + orb_fill_red/blue）（实际 ${keys.length}）`);
ok(JSON.stringify(Object.keys(fr).sort()) === JSON.stringify(keys), '图集帧名 = ui-slices 表');
ok(JSON.stringify(Object.keys(srcMap).sort()) === JSON.stringify(keys), '图集帧名 = 美术 slices.json');
for (const k of keys) {
  const d = (SLICES as any)[k], f = fr[k].frame, sj = srcMap[k];
  ok(f.w === d.w && f.h === d.h, `${k} 帧尺寸 ${f.w}×${f.h} = 切片`);
  ok(f.x + f.w <= atlas.meta.size.w && f.y + f.h <= atlas.meta.size.h, `${k} 帧在图集内`);
  ok([d.left, d.right, d.top, d.bottom].every(v => Number.isInteger(v) && v >= 0) && d.left + d.right < d.w && d.top + d.bottom < d.h, `${k} 边距合法 L${d.left} R${d.right} T${d.top} B${d.bottom}`);
  const m = sj.margins ?? sj; ok(['left', 'right', 'top', 'bottom'].every(s => m[s] === undefined || m[s] === d[s]), `${k} 边距 = slices.json`);
}
for (const k of ['btn_normal', 'btn_hover', 'btn_pressed', 'btn_disabled']) ok(k in fr, `按钮状态帧 ${k}`);
for (const k of ['orb_fill_red', 'orb_fill_blue', 'orb_glass', 'orb_frame']) ok(k in fr, `血球层帧 ${k}`);
const dom = keys.filter(k => srcMap[k].dom);
ok(dom.length === 18, `dom 标记 18 张（含 lingfu_entry）（实际 ${dom.length}）`);
const domFiles = readdirSync(join(R, 'public/assets/ui/dom')).sort();
ok(JSON.stringify(domFiles) === JSON.stringify(dom.map(k => k + '@2x.png').sort()), 'public/assets/ui/dom 2x 图 = slices.json dom 标记');
ok(mapAssetUrl(domUrl('btn_normal'), true) === 'assets/ui/dom/btn_normal@2x.webp' && mapAssetUrl(domUrl('btn_normal'), false) === domUrl('btn_normal'), 'DOM 2x 图构建版 → webp');
ok(/ui\[\\\\\/\]dom/.test(vc) || vc.includes("ui/dom"), 'vite compressAssets 含 DOM 图（无损）');
// 禁止对九宫格 setScale：扫 src 全部 ns(...)/nineslice(...) 链式调用及 button 九宫格变量
const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e: any) => e.isDirectory() ? walk(join(d, e.name)) : /\.ts$/.test(e.name) ? [join(d, e.name)] : []);
for (const f of walk(join(R, 'src'))) {
  const s = readFileSync(f, 'utf8');
  ok(!/(\bns\([^;]*?\)|nineslice\([^;]*?\))\s*\??\.\s*setScale/.test(s) && !/\bbg\??\.setScale/.test(s), `${f.slice(R.length + 1)} 不对九宫格 setScale`);
}
// assetUrl 映射
ok(mapAssetUrl(UI_ATLAS_PNG, true) === 'assets/ui/ui_atlas.webp' && mapAssetUrl(UI_ATLAS_PNG, false) === UI_ATLAS_PNG, '构建版 ui_atlas.png → .webp；开发版不变');
ok(mapAssetUrl('assets/ui/ui_atlas.json', true) === 'assets/ui/ui_atlas.json', 'json 帧表不改名');
ok(mapAssetUrl('assets/ui/bg_dungeon.jpg', true) === 'assets/ui/bg_dungeon.webp' && mapAssetUrl('assets/portraits/a.png', true) === 'assets/portraits/a.webp', '旧映射保持');
ok(mapAssetUrl('assets/ui/other.png', true) === 'assets/ui/other.png', '其他 ui 图不误改');
ok(/ui\/ui_atlas\.png/.test(vc) && /uiAtlas \? \{ lossless: true \}|small \|\| uiAtlas \? \{ lossless: true \}/.test(vc), 'vite compressAssets 含 ui_atlas 且无损');
ok(/load\.atlas\(UI_ATLAS, assetUrl\(UI_ATLAS_PNG\)/.test(readFileSync(join(R, 'src/scenes/TitleScene.ts'), 'utf8')), 'TitleScene preload 加载图集');
// 加载失败回退：纹理不存在/缺帧 → ns() 返回 null，button() 走原矩形绘制
const fake = (has: boolean, frames: string[] = []) => ({ textures: { exists: () => has, get: () => ({ has: (n: string) => frames.includes(n) }) }, add: { nineslice: () => { throw new Error('不应创建'); } } }) as any;
ok(!atlasReady(fake(false)) && ns(fake(false), 'btn_normal', 0, 0, 100, 40) === null, '图集未加载 → 回退');
ok(!atlasReady(fake(true, []), 'btn_normal') && ns(fake(true, []), 'btn_normal', 0, 0, 100, 40) === null, '缺帧 → 回退');
ok(ns(fake(true, ['btn_normal']), 'no_such_frame', 0, 0, 10, 10) === null, '未知帧名 → 回退');
const ts = readFileSync(join(R, 'src/scenes/TitleScene.ts'), 'utf8');
ok(/const bg = ns\(/.test(ts) && /s\.add\.rectangle\(x, y, w, h, 0x2a1a0c/.test(ts), 'button() 保留代码绘制回退路径');
// 最小点击高度
ok(minTapHeight(false, 1) === MIN_TAP && MIN_TAP === 44, '桌面 44 逻辑 px');
const css = 390 / 720; ok(Math.abs(minTapHeight(true, css) * css - MIN_TAP_MOBILE_PHYS) < 1e-9, `844×390：最小点击高度折合 ${MIN_TAP_MOBILE_PHYS} CSS px`);
console.log(`ui-atlas: ${pass} passed`);
