// B4 物品格 / 品质框 / 快捷栏 / 血石空槽 / 技能行状态着色（src/ui/uiSlices.ts slotBg / qualityFrame / bloodstoneSlot / slotHitSize / rowTint）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
// @ts-ignore
import { join } from 'node:path';
declare const process: any;
import { slotBg, qualityFrame, bloodstoneSlot, slotHitSize, rowTint, QFRAME, SKILL_ROW_TINT, BLOODSTONE_SLOT_VISIBLE, UI_SLICES, viewCss } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const R = process.cwd(), src = (p: string) => readFileSync(join(R, p), 'utf8');
const mk = (hasAtlas: boolean, frames = Object.keys(UI_SLICES)) => {
  const obj = (kind: string, a: any[]) => { const o: any = { kind, a, type: kind === 'ns' ? 'NineSlice' : kind, scaled: false, disp: null, name: '', stroke: null, fill: a[4] };
    o.setOrigin = () => o; o.setStrokeStyle = (...v: any[]) => { o.stroke = v; return o; }; o.setScale = () => { o.scaled = true; return o; }; o.setDisplaySize = (w: number, h: number) => { o.disp = [w, h]; return o; }; o.setName = (n: string) => { o.name = n; return o; }; return o; };
  return { textures: { exists: (k: string) => hasAtlas && k === 'ui_atlas', get: () => ({ has: (f: string) => frames.includes(f) }) },
    add: { nineslice: (...a: any[]) => obj('ns', a), rectangle: (...a: any[]) => obj('rect', a), image: (...a: any[]) => obj('image', a) } } as any;
};
const S = UI_SLICES.slot;
for (const sel of [false, true]) {
  const o: any = slotBg(mk(true), 10, 20, 56, sel, { fill: 1 });
  ok(o.kind === 'ns' && o.a[3] === (sel ? 'slot_sel' : 'slot') && o.a[4] === 56 && o.a[5] === 56 && !o.scaled, `slotBg sel=${sel} → 九宫格 56×56 只 setSize`);
  ok(o.a[6] === S.left && o.a[7] === S.right && o.a[8] === S.top && o.a[9] === S.bottom, `slotBg sel=${sel} 边距来自 uiSlices（14）`);
  const f: any = slotBg(mk(false), 0, 0, 56, sel, { fill: 0x1a1a1a, stroke: 0xbbaa77, sw: 2 });
  ok(f.kind === 'rect' && f.stroke[0] === 2 && f.stroke[1] === 0xbbaa77, `slotBg sel=${sel} 无图集 → 原矩形+描边`);
}
ok((slotBg(mk(true), 0, 0, 20, false, { fill: 1 }) as any).kind === 'rect', 'slotBg 小于边距和（20<28）→ 回退矩形');
ok((slotBg(mk(true, ['panel_frame']), 0, 0, 56, false, { fill: 1 }) as any).kind === 'rect', 'slotBg 缺帧 → 回退矩形');
for (const r of ['common', 'magic', 'rare']) {
  ok(QFRAME[r] in UI_SLICES, `品质 ${r} → ${QFRAME[r]} 在切片表`);
  const q: any = qualityFrame(mk(true), 0, 0, 52, r);
  ok(q && q.a[3] === QFRAME[r] && q.a[4] === 52 && q.a[6] === UI_SLICES[QFRAME[r]].left && !q.scaled, `qualityFrame ${r} 九宫格 52 边距 5`);
  ok(qualityFrame(mk(false), 0, 0, 52, r) === null, `qualityFrame ${r} 无图集 → null（保留原彩色描边）`);
}
ok(qualityFrame(mk(true), 0, 0, 52, 'legend') === null && qualityFrame(mk(true), 0, 0, 52, undefined) === null, '未知品质 → null');
{ const b: any = bloodstoneSlot(mk(true), 5, 6, 60); ok(b && b.kind === 'image' && b.a[3] === 'slot_bloodstone' && b.disp[0] === 60 && b.disp[1] === 60, '血石空槽：固定帧图片 setDisplaySize（不走九宫格）'); }
ok(bloodstoneSlot(mk(false), 0, 0, 60) === null, '血石空槽 无图集 → null');
ok(UI_SLICES.slot_bloodstone.fixed === true, 'slot_bloodstone 标记 fixed');
ok(BLOODSTONE_SLOT_VISIBLE === true && /bloodstoneSlot\(/.test(src('src/ui/Panel.ts')) && /stone: \[Rx, y0 \+ dy \* 2\]/.test(src('src/ui/Panel.ts')), '灵符商城：血石栏（stone）已实现 → 装备界面右列靴子下显示血石空槽');
ok(/stone/.test(src('src/combat/types.ts').match(/EquipSlot\s*=[^;]*/)?.[0] ?? ''), '灵符商城：EquipSlot 已新增 stone（旧档缺 equip.stone 按空处理）');
// 点击区：手机 844×390（面板缩放约 1.28）
const css = viewCss(1280 * 844 / 390 > 1280 ? Math.round(720 * 844 / 390) : 1280) * 1.28;
for (const [size, pitch, what] of [[56, 62, '背包'], [60, 58, '装备'], [42, 46, '仓库']] as const) {
  const h = slotHitSize(true, size, pitch, css);
  ok(h >= size && h <= Math.max(size, pitch), `${what} 格 ${size}/距 ${pitch}：手机点击区 ${h.toFixed(1)}（${(h * css).toFixed(1)} CSS）不小于格、不超格距`);
  ok(slotHitSize(false, size, pitch, 1) === size, `${what} 桌面点击区 = 格子尺寸`);
}
ok(slotHitSize(true, 20, 60, 0.5) === 60 && slotHitSize(true, 20, 100, 0.5) === 88, 'slotHitSize：扩到 44 CSS，封顶格距');
// 技能行着色
{ const row: any = { type: 'NineSlice' }; const t: any = rowTint(mk(true), row, 560, 100, 820, 60, SKILL_ROW_TINT.learned);
  ok(t && t.kind === 'rect' && t.fill === SKILL_ROW_TINT.learned && t.name === 'rowTint', '技能行（九宫格）叠状态色');
  ok(rowTint(mk(false), { type: 'Rectangle' } as any, 0, 0, 10, 10, SKILL_ROW_TINT.learned) === null, '无图集（矩形行）不叠，原底色不变');
  ok(rowTint(mk(true), row, 0, 0, 10, 10, undefined) === null, '未学 → 不叠'); }
const P = src('src/ui/Panel.ts'), H = src('src/ui/Hud.ts');
ok(/slotBg\(s, x, y, size, selected/.test(P) && /qualityFrame\(s, x, y, size - 4, it\.rarity\)/.test(P), 'Panel.slotBox 用 slotBg + qualityFrame');
ok(/qualityFrame\(s, cx \+ icon/.test(P), '装备对比图标用 qualityFrame');
ok(/slotHitSize\(IS_MOBILE, size, pitch/.test(P) && /'bag_' \+ i, size \+ 6\)/.test(P) && /'eq_' \+ sl, pitch\)/.test(P) && /pitch = IS_MOBILE \? MD : dy/.test(P), 'slotBox 点击区按格距封顶（装备栏：桌面 dy，手机 3 列行列距 MD）');
ok(/MD = 70/.test(P) && 70 * 0.7 >= 44, 'fix/r78-equip-tap：手机装备栏 3 列×4 行，行列距 70（844×390 面板 0.7 CSS px/单位 → 点击区可达 44）');
ok((H.match(/slotBg\(s, x, y/g) ?? []).length === 1 && /slotBg\(s, x, y, S, false/.test(readFileSync('src/ui/potBar.ts', 'utf8')), 'Hud 快捷栏技能格+药水格用 slotBg（药水格在 potBar.ts，feat/potion-expand）');
ok(/rowTint\(s, row/.test(P), '技能行调用 rowTint');
ok(!/(slotBg|qualityFrame)\([^;]*\.setScale/.test(P + H), '格子九宫格不 setScale');
console.log(`ui-slots: ${pass} passed`);
