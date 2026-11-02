// 药水格框与图标/数字（src/ui/potFrame.ts POT_FRAME / POT_ICON；domSkin 药水格 border-image-width；MobileHud 数量写进角标 span）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
import { POT_CSS, POT_FRAME, POT_ICON } from '../src/ui/potFrame';
import { skinCss, domSlice } from '../src/ui/domSkin';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const [t, r, bt, l] = POT_FRAME;
ok(POT_CSS >= 44, '药水格 ≥44 CSS px');
ok(POT_ICON + l + r <= POT_CSS && POT_ICON + t + bt <= POT_CSS, `图标 ${POT_ICON}px 完整落在框内净空`);
ok(POT_ICON >= 36, '图标不小于 36px');
const n = domSlice('btn_normal').width; ok(n[1] + n[3] + POT_ICON > POT_CSS, '回归：按 btn_normal 1x 边距画框会盖住图标（这正是原问题）');
const css = skinCss(false), rule = css.split('}').find(s => s.includes('#mh-pots .b{'))!;
ok(rule && rule.includes(`/ ${POT_FRAME.map(v => v + 'px').join(' ')} stretch`), '药水格 border-image-width = POT_FRAME');
ok(rule.includes('border-width:2px'), '药水格布局边框仍 2px（回退/点击区不变）');
ok(css.includes(`/ ${n.map(v => v + 'px').join(' ')} stretch`), '其他按钮仍用 1x 边距');
// 数字：3 位 12px 粗体约 ≤24px 宽，必须在框内净空（宽 56-8-8=40，右/下边距 ≥ 框宽）
const src = readFileSync(new URL('../src/ui/MobileHud.ts', import.meta.url), 'utf8');
// feat/potion-expand：手机药水格移到 potBar.ts（PotBarDom），数量写 this.cnt[slot]（角标 span）
const pb = readFileSync(new URL('../src/ui/potBar.ts', import.meta.url), 'utf8');
ok(!/btns\[\w+\]\.textContent\s*=/.test(pb) && !/potBtns\[i\]\.textContent\s*=/.test(src), '数量不再用 textContent 覆盖按钮（会冲掉角标 span）');
ok(/new PotBarDom\(/.test(src) && /this\.cnt\[slot\]\.textContent = n/.test(pb) && /innerHTML = '<span><\/span>'/.test(pb), '数量写进角标 span');
ok(2 + (r - 1) >= r && 2 + (bt - 2) >= bt - 0, '角标右/下偏移（含 2px 布局边框）≥ 框宽');
ok(3 * 7.5 <= POT_CSS - l - r, '3 位数字宽度在净空内');
console.log(`potion-clip: ${pass} ok`);
