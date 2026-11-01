// B6 手机 DOM HUD 皮肤（src/ui/domSkin.ts）：映射、@2x 边距、onload 开关回退、引用图均存在
// @ts-ignore
import { readFileSync, existsSync } from 'node:fs';
declare const process: any;
import { DOM_SKIN, domSlice, domSrc, skinCss, borderImage, applyDomSkin } from '../src/ui/domSkin';
import { UI_SLICES } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const png = (p: string) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
for (const n of DOM_SKIN) {
  const d = UI_SLICES[n]; ok(d && d.dom, `${n} 在 slices.json 且 dom:true`);
  const f = 'public/' + domSrc(n, false); ok(existsSync(f), `${f} 存在`);
  ok(domSrc(n, true).endsWith('@2x.webp'), `${n} 生产映射为 webp（构建时由 vite 生成）`);
  const [w, h] = png(f); ok(w === d.w * 2 && h === d.h * 2, `${n} @2x 尺寸 ${w}×${h} = 2×(${d.w}×${d.h})`);
  const s = domSlice(n); ok(s.slice.join() === [d.top, d.right, d.bottom, d.left].map(v => v * 2).join(), `${n} slice = 边距×2 (T R B L) ${s.slice.join(' ')}`);
  ok(s.slice[0] + s.slice[2] <= h && s.slice[1] + s.slice[3] <= w, `${n} slice 不越界`);
}
ok(domSrc('btn_normal', false) === 'assets/ui/dom/btn_normal@2x.png' && domSrc('btn_normal', true) === 'assets/ui/dom/btn_normal@2x.webp', 'domSrc 经 mapAssetUrl');
ok(borderImage('btn_normal', true, false).includes('28 32 28 32 fill / 14px 16px 14px 16px'), 'btn_normal border-image 与 §3.5 示例一致');
ok(borderImage('bar_frame', false, false).includes('12 20 12 20 / 6px 10px 6px 10px'), 'bar_frame slice 12 20 12 20 / 6px 10px');
ok(borderImage('panel_frame_s', true, false).includes('40 40 40 40 fill'), 'panel_frame_s slice 40');
let threw = false; try { domSlice('orb_frame'); } catch { threw = true; } ok(threw, '非 dom 图拒绝');
const css = skinCss(false);
const refs = [...css.matchAll(/url\("([^"]+)"\)/g)].map(m => m[1]);
ok(refs.length > 0 && refs.every(u => existsSync('public/' + u)), `皮肤 CSS 引用的 ${new Set(refs).size} 张图全部存在`);
ok(refs.every(u => DOM_SKIN.some(n => u === domSrc(n, false))), '引用图都在 DOM_SKIN 列表');
ok(css.split('\n').every(l => /^#mhud\.sk-\w+/.test(l)), '每条规则都挂在 #mhud.sk-<名> 开关下（未加载=不生效）');
ok(!/orb/.test(css), '手机不出血球');
ok(/btn_pressed@2x/.test(css) && /:active/.test(css), '按下态用 btn_pressed');
// 开关：假 DOM，部分图失败
const cls = new Set<string>(); const root: any = { classList: { add: (c: string) => cls.add(c) } };
(globalThis as any).document = { getElementById: () => null, createElement: () => ({}), head: { appendChild() {} } };
const res = await applyDomSkin(root, false, async src => !/bar_frame|touch_round/.test(src));
ok(res.filter(x => !x).length === 2 && !cls.has('sk-bar_frame') && !cls.has('sk-touch_round'), '加载失败的图不加 class（回退纯 CSS）');
ok(cls.has('sk-btn_normal') && cls.size === DOM_SKIN.length - 2, '加载成功的图才加 class');
cls.clear(); await applyDomSkin(root, false, async () => false); ok(cls.size === 0, '全部失败 → 零 class，原样纯 CSS');
console.log(`ui-dom: ${pass} passed`);
