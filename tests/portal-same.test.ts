// fix/portal-same：两个传送门同源素材、同一创建函数、方向区分（src/ui/portalArt.ts；BattleScene.syncPortalArt）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
import { PORTAL_LOOK, PORTAL_TEXT, PORTAL_TEX, PORTAL_W, PORTAL_H, portalArtKind } from '../src/ui/portalArt';
import { ASSETS, SHEETS } from '../src/assets-manifest';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
ok(portalArtKind(true, true) === 'sheet' && portalArtKind(false, true) === 'still' && portalArtKind(false, false) === 'gfx', '素材优先级 sheet → still → 程序占位');
ok((ASSETS as any)[PORTAL_TEX.sheet] && (ASSETS as any)[PORTAL_TEX.still] && (SHEETS as any)[PORTAL_TEX.sheet], '同源素材已在 manifest 注册');
ok(PORTAL_LOOK.next.flip !== PORTAL_LOOK.back.flip, '下一层水平镜像区分方向');
ok(PORTAL_LOOK.next.gfx[0] !== PORTAL_LOOK.back.gfx[0], '缺图占位按方向换色');
ok(PORTAL_TEXT.next === '下一层' && PORTAL_TEXT.back === '上一层', '方向文字');
ok(PORTAL_W >= 44 && PORTAL_H >= 44, '贴图尺寸 ≥44');
const src = readFileSync('src/scenes/BattleScene.ts', 'utf8');
const body = src.slice(src.indexOf('  buildPortal(x: number) {'), src.indexOf('  // ===== R14'));
ok(!/arc\(0, -100, 85/.test(src) && !/fillRect\(-98/.test(src), '旧「下一层」程序拱门已删除（不再两套代码）');
ok((src.match(/'portal_exit_sheet', 0\)/g) ?? []).length === 1, 'portal_exit_sheet 精灵只在一处创建');
ok(/syncPortalArt\(this\.portal, this\.nextPortalArt, 'next'/.test(src) && /syncPortalArt\(c, this\.backPortalArt, 'back'/.test(src), '两入口都调用 syncPortalArt');
ok(/PORTAL_TEXT\.next/.test(body), '下一层文字来自 PORTAL_TEXT');
const hz = /zone\(0, PORTAL_FOOT - 110, (\d+), (\d+)\)/.exec(body); ok(hz && +hz[1] >= 150 && +hz[2] >= 220, '下一层点击区 150×220（与上一层同尺寸）');
// 手机最小缩放 390/720：150×220 世界 px → 81×119 CSS，均 ≥44
ok(150 * 390 / 720 >= 44 && 220 * 390 / 720 >= 44, '点击区在 390 高手机上 ≥44 CSS');
// 追加：下一层色调加深（各通道 ≤0xd0 至少一项、与上一层不同），摇杆区缩小
{ const t = PORTAL_LOOK.next.tint, ch = [t >> 16 & 255, t >> 8 & 255, t & 255];
  ok(t !== PORTAL_LOOK.back.tint && Math.min(...ch) <= 0x80, `下一层色调加深 0x${t.toString(16)}`); }
{ const hud = readFileSync('src/ui/MobileHud.ts', 'utf8'), bs = readFileSync('src/scenes/BattleScene.ts', 'utf8');
  // feat/float-joystick：摇杆元素改为纯显示（pointer-events:none），按下画布才激活；画布可点物（含传送门）命中测试放行
  ok(/#mh-joy\{[^}]*pointer-events:none/.test(hud) && /joyBlockedAt/.test(hud) && /joyBlockedAt\(cx/.test(bs), '摇杆不挡传送门：画布可点物命中即放行');
  ok(/pointermove[^\n]*pointerId === pid/.test(hud), '摇杆按 pointerId 跟踪，拖出区域仍可控'); }
console.log(`portal-same: ${pass} ok`);
