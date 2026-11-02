/**
 * B6 手机 DOM HUD 皮肤（docs/ui-art-plan.md §3.5）：public/assets/ui/dom/<名>@2x.png + CSS border-image。
 * - border-image-slice 用图片像素 = slices.json 边距 ×2（@2x），border-image-width 用 CSS px = 1x 边距，四角不拉伸。
 * - 每张图 onload 成功后才给 #mhud 加 class `sk-<名>`；规则都挂在该 class 下，图 404/断网 → 不加 class → 沿用原纯 CSS。
 * - 只用 slices.json 标 dom:true 的图；手机不出血球。
 */
import { UI_SLICES, domUrl } from './uiSlices';
import { mapAssetUrl } from '../assetUrlMap';
import { POT_FRAME } from './potFrame';

const OPT = typeof import.meta !== 'undefined' && !!(import.meta as any).env?.PROD;
export const domSrc = (name: string, opt = OPT) => mapAssetUrl(domUrl(name), opt);
/** 本批用到的 DOM 图（全部须为 dom:true） */
export const DOM_SKIN = ['btn_normal', 'btn_pressed', 'bar_frame', 'bar_fill_hp', 'bar_fill_mp', 'bar_fill_exp', 'touch_round', 'btn_close', 'tooltip_frame', 'panel_frame_s', 'lingfu_entry'] as const;
export type DomName = typeof DOM_SKIN[number];
/** T R B L：slice（@2x 图像素）与 width（CSS px） */
export function domSlice(name: string) {
  const d = UI_SLICES[name]; if (!d || !d.dom) throw new Error('no dom slice ' + name);
  const w = [d.top, d.right, d.bottom, d.left];
  return { slice: w.map(v => v * 2), width: w, fixed: !!d.fixed };
}
/** border-image 声明（fill=中心也画） */
export function borderImage(name: string, fill = true, opt = OPT, layoutBorder?: string, widthOverride?: readonly number[]) {
  const { slice } = domSlice(name), width = widthOverride ?? domSlice(name).width;
  // layoutBorder：保持原 CSS 的 border-width（布局/内容区与回退一致），border-image-width 仍按 1x 边距外画到 padding 区
  return `border-style:solid;border-width:${layoutBorder ?? width.map(v => v + 'px').join(' ')};border-image:url("${domSrc(name, opt)}") ${slice.join(' ')}${fill ? ' fill' : ''} / ${width.map(v => v + 'px').join(' ')} stretch`;
}
const bg = (name: string, opt: boolean) => `background:url("${domSrc(name, opt)}") center/100% 100% no-repeat`;
/** 生成皮肤 CSS（全部在 #mhud.sk-<名> 下，未加 class 时不生效） */
export function skinCss(opt = OPT) {
  const B = (n: DomName) => `#mhud.sk-${n}`;
  const btnBox = (n: DomName) => `${borderImage(n, true, opt, '2px')};background:none;border-radius:0`;
  return [
    // 通用按钮（顶栏/自动/翻页/合击）：常态 btn_normal，按下/开启 btn_pressed；药水格不用 fill（保留药水图标背景）
    `${B('btn_normal')} .b:not(.sk):not(#mh-act):not(#mh-pots>.b){${btnBox('btn_normal')}}`,
    `${B('btn_normal')} #mh-pots .b{${borderImage('btn_normal', false, opt, '2px', POT_FRAME)};border-radius:0;background-color:rgba(20,14,8,.85)}`,
    `${B('btn_normal')}${B('btn_pressed').slice(5)} .b:not(.sk):not(#mh-act):not(#mh-pots>.b):active,${B('btn_normal')}${B('btn_pressed').slice(5)} .b:not(.sk):not(#mh-act):not(#mh-pots>.b).on{border-image-source:url("${domSrc('btn_pressed', opt)}");filter:none}`,
    `${B('btn_normal')}${B('btn_pressed').slice(5)} #mh-pots>.b:active{border-image-source:url("${domSrc('btn_pressed', opt)}");filter:none}`,
    // 互动键/摇杆：touch_round（fixed，背景铺满，不用 border-image）
    `${B('touch_round')} #mh-act{${bg('touch_round', opt)};border-color:transparent}`,
    `${B('touch_round')} #mh-joy .hint,${B('touch_round')} #mh-joy .base{${bg('touch_round', opt)};border-color:transparent}`,
    // 血蓝经验条：框画在 ::after 叠层（中心透明），填充用 bar_fill_*（盖过内联渐变）
    `${B('bar_frame')} .mh-bar{background:rgba(0,0,0,.6);border-color:transparent;border-radius:0;overflow:visible}`,
    `${B('bar_frame')} .mh-bar::after{content:"";position:absolute;inset:-2px -3px;pointer-events:none;box-sizing:border-box;${borderImage('bar_frame', false, opt)}}`,
    `${B('bar_frame')} .mh-bar span{z-index:1}`,
    ...(['hp', 'mp', 'exp'] as const).map(k => `${B(('bar_fill_' + k) as DomName)} .mh-bar.${k} i{background:url("${domSrc('bar_fill_' + k, opt)}") 0 0/100% 100%!important}`),
    // 日志与总览弹层
    `${B('tooltip_frame')} #mh-log{${borderImage('tooltip_frame', true, opt, '0')};background:none;border-radius:0;opacity:.85}`,
    `${B('panel_frame_s')} #mh-ovw .box{${borderImage('panel_frame_s', true, opt, '2px')};background:none;border-radius:0}`,
    `${B('btn_close')} #mh-ovw .x{${bg('btn_close', opt)};border-color:transparent;color:transparent}`,
    `${B('btn_normal')} #mh-ovw .wm{${btnBox('btn_normal')}}`,
    // 灵符入口 #mh-shop 52×44：lingfu_entry @2x，slice 28/36（=1x 14/18 ×2）；!important 压过通用 btn_normal（含 3 个 id 选择器）
    `${B('lingfu_entry')} #mh-shop{border-style:solid!important;border-width:2px!important;border-image:url("${domSrc('lingfu_entry', opt)}") 28 36 28 36 fill / 14px 18px 14px 18px stretch!important;background:none!important;border-radius:0!important}`,
    `${B('lingfu_entry')} #mh-shop:active,${B('lingfu_entry')} #mh-shop.on{filter:brightness(1.25)!important}`, // 入口无按下帧：按下提亮
  ].join('\n');
}
/** 逐张预载，成功后加 class；失败不加（回退纯 CSS）。返回 Promise 供测试等待 */
export function applyDomSkin(root: HTMLElement, opt = OPT, load = (src: string) => new Promise<boolean>(res => { const im = new Image(); im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = src; })) {
  if (!document.getElementById('mhud-skin')) { const st = document.createElement('style'); st.id = 'mhud-skin'; st.textContent = skinCss(opt); document.head.appendChild(st); }
  return Promise.all(DOM_SKIN.map(n => load(domSrc(n, opt)).then(ok => { if (ok) root.classList.add('sk-' + n); return ok; })));
}
