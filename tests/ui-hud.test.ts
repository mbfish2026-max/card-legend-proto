// B5 桌面 HUD 血球四层 / 经验条（src/ui/uiSlices.ts orbLayers / orbCrop / orbGeom / barFillW）
// @ts-ignore
import { readFileSync } from 'node:fs';
declare const process: any;
import { orbLayers, orbCrop, orbGeom, barFillW, ORB_D, ORB_FRAMES, UI_SLICES } from '../src/ui/uiSlices';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const seq: any[] = [];
const mk = (hasAtlas: boolean, frames = Object.keys(UI_SLICES)) => {
  const obj = (kind: string, a: any[]) => { const o: any = { kind, a, scaled: false, disp: null, depth: 0, crop: null, name: '', frame: { width: 64, height: 64 } };
    o.setDepth = (d: number) => { o.depth = d; return o; }; o.setName = (n: string) => { o.name = n; return o; }; o.setScale = () => { o.scaled = true; return o; };
    o.setDisplaySize = (w: number, h: number) => { o.disp = [w, h]; return o; }; o.setCrop = (...c: number[]) => { o.crop = c; return o; }; seq.push(o); return o; };
  return { textures: { exists: (k: string) => hasAtlas && k === 'ui_atlas', get: () => ({ has: (f: string) => frames.includes(f) }) },
    add: { circle: (...a: any[]) => obj('circle', a), image: (...a: any[]) => obj('image', a) } } as any;
};
ok(ORB_D >= 128 && ORB_D <= 160, `桌面血球直径 ${ORB_D} 在 128–160`);
for (const f of ORB_FRAMES) ok(UI_SLICES[f]?.fixed === true, `${f} 固定比例帧`);
const g = orbGeom(144); ok(g.base === 144 * 52 / 128 && g.fill === 144 * 104 / 128 && g.frame === 144, 'orbGeom 比例：底圆半径 D×52/128，液面 D×104/128，框 D');
for (const fill of ['orb_fill_red', 'orb_fill_blue'] as const) {
  seq.length = 0; const L: any = orbLayers(mk(true), 330, 652, ORB_D, fill);
  ok(L, `${fill} 图集齐全 → 四层`);
  ok(seq.map(o => o.name).join() === 'orbBase,orbFill,orbGlass,orbFrame', '层序：黑底圆 → 液面 → glass → frame（创建顺序）');
  ok(L.base.depth < L.liq.depth && L.liq.depth < L.glass.depth && L.glass.depth <= L.frame.depth, '深度递增，frame 不低于 glass');
  ok(L.base.kind === 'circle' && L.base.a[2] === ORB_D * 52 / 128 && L.base.a[3] === 0x0a0a0a, '黑底圆半径 D×52/128');
  ok(L.liq.a[3] === fill && L.liq.disp[0] === ORB_D * 104 / 128 && L.liq.disp[1] === ORB_D * 104 / 128, '液面显示 D×104/128');
  ok(L.glass.disp[0] === ORB_D && L.frame.disp[0] === ORB_D && L.frame.disp[1] === ORB_D, 'glass/frame 显示 D×D');
  ok(seq.every(o => !o.scaled), '不调用 setScale');
  for (const [r, y, h] of [[0, 64, 0], [0.5, 32, 32], [1, 0, 64]]) { L.set(r); ok(L.liq.crop.join() === `0,${y},64,${h}`, `水位 ${r * 100}% → setCrop(0,${y},64,${h})`); }
}
for (const [r, y, h] of [[0, 64, 0], [0.5, 32, 32], [1, 0, 64], [-1, 64, 0], [2, 0, 64], [NaN, 64, 0]]) { const c = orbCrop(r as number); ok(c.y === y && c.h === h, `orbCrop(${r}) → y=${y} h=${h}`); }
ok(orbLayers(mk(false), 0, 0, 136, 'orb_fill_red') === null, '无图集 → null（回退代码 Orb）');
for (const miss of ['orb_glass', 'orb_frame', 'orb_fill_red']) ok(orbLayers(mk(true, Object.keys(UI_SLICES).filter(k => k !== miss)), 0, 0, 136, 'orb_fill_red') === null, `缺帧 ${miss} → null`);
ok(barFillW(0.5, 480) === 240 && barFillW(2, 480) === 480 && barFillW(-1, 480) === 0, 'barFillW 夹在 0..w');
const hud = readFileSync('src/ui/Hud.ts', 'utf8');
ok(/mobile \? undefined : 'orb_fill_red'/.test(hud) && /mobile \? undefined : 'orb_fill_blue'/.test(hud), '手机不建血球（沿用代码 Orb，随后整体隐藏）');
ok(!/setScale/.test(hud), 'Hud.ts 无 setScale');
ok(/this\.hp\.update\(hp, maxHp, dt\)/.test(hud), '水位仍由 hp/maxHp 驱动（只读）');
console.log(`ui-hud: ${pass} 项通过`);
