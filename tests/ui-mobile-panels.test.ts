// 手机面板图集化 + 药水点击区（src/ui/uiSlices.ts panelFrameName / MOBILE_TABS / slotHitSize / rowHitHeight；MobileHud POT_CSS / potRight）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
import { panelFrameName, MOBILE_TABS, slotHitSize, rowHitHeight, MIN_TAP } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
ok(panelFrameName(true, () => true) === 'panel_frame_s', '手机有 panel_frame_s → 用小框');
ok(panelFrameName(true, f => f === 'panel_frame') === 'panel_frame', '手机缺 panel_frame_s → 回退 panel_frame');
ok(panelFrameName(false, () => true) === 'panel_frame', '桌面仍用 panel_frame');
const [a, b] = MOBILE_TABS;
ok(a.x + a.w / 2 <= b.x - b.w / 2, '手机页签互不重叠');
for (const css of [390 / 720 * 1.28, 430 / 720 * 1.28]) {
  ok(slotHitSize(true, 40, 200, css) * css >= MIN_TAP - 1e-6, `格子点击区 ≥44 CSS @${css.toFixed(2)}`);
  ok(rowHitHeight(true, 30, 200, css) * css >= MIN_TAP - 1e-6 && rowHitHeight(true, 30, 50, css) <= 50, `行按钮 ≥44 CSS 且封顶行距 @${css.toFixed(2)}`);
}
const H = readFileSync('src/ui/MobileHud.ts', 'utf8');
const pot = Number(/POT_CSS = (\d+)/.exec(readFileSync('src/ui/potFrame.ts', 'utf8'))?.[1]); // fix/mobile-potion-clip：常量移到 potFrame.ts
ok(pot >= 44, `药水按钮 ${pot} ≥ 44 CSS`);
const pr = /potRight = \(outerR: number\) => outerR \+ ([\d +]+);/.exec(H);
ok(pr && pr[1].split("+").reduce((s, v) => s + Number(v), 0) >= 75, '药水右偏移越过最左技能键左缘（outerR+75），不重叠');
ok(/#mhud\.off #mh-pos/.test(H), '面板打开时隐藏楼层进度条');
const P = readFileSync('src/ui/Panel.ts', 'utf8');
ok(/panelFrameName\(IS_MOBILE/.test(P) && /mobileTabs\(R, top\)/.test(P), 'Panel 手机用 panelFrameName + 页签');
ok(!/\.setScale\(/.test(readFileSync('src/ui/uiSlices.ts', 'utf8')), 'uiSlices 九宫格不用 setScale');
console.log(`ui-mobile-panels: ${pass} ok`);
