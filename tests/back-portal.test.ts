// 任务B：每层最左端「返回上一层」传送门（替代回城小房子）；贴图 portal_exit / portal_exit_sheet
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { existsSync } from 'node:fs';
import { World } from '../src/combat/World';
import { FLOORS, prevFloorOf } from '../src/data/world';
import { REGIONS } from '../src/data/map';
import { ASSETS, SHEETS } from '../src/assets-manifest';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const w = new World(() => 0.5, 10, FLOORS, 'warrior');
w.loadFloor(0); let b = w.backGate()!;
ok(b.kind === 'portal' && b.to === 'town' && /村/.test(b.name) && b.label === `传送门：返回 ${b.name}` && !b.label.includes('比奇城'), `第1层传送门 → ${b.name}（${b.label}）`);
let n = 0;
for (let i = 1; i < FLOORS.length; i++) { if (REGIONS.some(r => r.floors[0] === i)) continue; const p = prevFloorOf(i, FLOORS); if (p < 0) continue;
  w.loadFloor(i); b = w.backGate()!; if (b.kind === 'portal' && b.to === 'floor' && b.index === p && b.label === `传送门：返回 ${FLOORS[p].name}`) n++; else ok(false, `第${i + 1}层 ${FLOORS[i].name} 传送门目标`); }
ok(n >= 30, `${n} 个非首层：传送门目标 = 上一层，文案含上一层名`);
w.loadFloor(2); const tgt = w.backGate()!.index; w.hero!.x = 60; ok(w.prevFloor() && w.floorIndex === tgt, `第3层传送门处 S → ${FLOORS[tgt].name}`);
for (const k of ['portal_exit', 'portal_exit_sheet']) ok(!!ASSETS[k] && existsSync('public/' + ASSETS[k]), `manifest 含 ${k} → ${ASSETS[k]} 且文件存在`);
ok(SHEETS.portal_exit_sheet.frameWidth === 256 && SHEETS.portal_exit_sheet.frameHeight === 384, 'portal_exit_sheet 按 256×384 切帧');
console.log(`back-portal: ${pass} passed`);
