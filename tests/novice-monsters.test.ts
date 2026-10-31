// 9:27 新手怪：鸡/稻草人/多钩猫/钉耙猫/森林雪人/食人花（官方 21cq 值 + 折算 + 布置 + 专属立绘）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { existsSync } from 'node:fs';
import { ENEMIES, NOVICE_OFFICIAL, NOVICE_SCALE, DIFF } from '../src/data/units';
import { FLOORS, PER_SCREEN_CAP } from '../src/data/world';
import { ASSETS } from '../src/assets-manifest';
import { OFFICIAL_MON_EXP } from '../src/data/monsterExp';
import { foeStatsAt, killExp, monsterLevelAt, EXEMPT_FLOORS } from '../src/data/balance';
import { EXP_PER_LEVEL } from '../src/data/expCurve';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const IDS = ['hen', 'scarecrow', 'hook_cat', 'rake_cat', 'forest_yeti', 'man_eater_flower'];
// 官方值（21cq）逐项
const OFF: Record<string, [number, number, number, number, number, number]> = { hen: [5, 5, 1, 1, 0, 5], scarecrow: [10, 15, 1, 2, 0, 12], hook_cat: [13, 22, 2, 4, 0, 17], rake_cat: [13, 23, 2, 4, 0, 18], forest_yeti: [16, 36, 7, 10, 2, 30], man_eater_flower: [20, 28, 6, 9, 2, 28] };
for (const id of IDS) { const o = NOVICE_OFFICIAL[id], e = OFF[id];
  ok(o.lv === e[0] && o.hp === e[1] && o.atk[0] === e[2] && o.atk[1] === e[3] && o.def === e[4] && o.exp === e[5], `${o.name} 官方值 Lv${o.lv} HP${o.hp} 攻${o.atk.join('-')} 防${o.def} 经验${o.exp}`);
  ok(OFFICIAL_MON_EXP[id]?.[1] === o.lv && OFFICIAL_MON_EXP[id]?.[2] === o.exp, `${o.name} 进官方经验表`);
  const v = NOVICE_SCALE(o), d = ENEMIES[id];
  ok(d && d.level === v.level && d.hp === Math.round(v.hp * DIFF.hp) && d.atk === Math.round(v.atk * 1.4 * DIFF.atk) && d.def === v.def, `${o.name} 折算面板 Lv${d.level} HP${d.hp} 攻${d.atk}`);
  ok(ASSETS[id] === `assets/portraits/${id}_full.png` || String(ASSETS[id]).endsWith(`/${id}_full.png`), `${o.name} 专属立绘 ${ASSETS[id]}`);
  ok(existsSync(`public/assets/portraits/${id}_full.png`), `${o.name} 立绘文件存在`);
}
// 折算后强弱顺序与官方一致；全部不超过首图 BOSS 前的狼/狼王强度带
const lv = IDS.slice(0, 5).map(id => ENEMIES[id].level!);
ok(lv.every((x, i) => i === 0 || x >= lv[i - 1]) && Math.max(...lv) < ENEMIES.wolf_king.level!, `首图新手怪等级递增且低于狼王 ${lv.join(',')}`);
ok(IDS.slice(0, 5).every(id => ENEMIES[id].atk <= ENEMIES.wolf.atk && ENEMIES[id].hp <= ENEMIES.wolf.hp), '首图新手怪攻/血不超过狼');
// 布置：第 0 层 鸡/稻草人/双猫/雪人；第 1 层 雪人（入口）+食人花；计入层怪量
const ids = (f: number) => FLOORS[f].spawns.map(s => s.id);
for (const id of ['hen', 'scarecrow', 'hook_cat', 'rake_cat', 'forest_yeti']) ok(ids(0).includes(id), `第0层有 ${id}`);
ok(!ids(1).includes('forest_yeti') && !ids(1).includes('man_eater_flower'), '第1层暂保持原布局（放雪人/食人花会让战斗模拟个别种子卡关，待战斗侧决定）');
ok(!ids(0).includes('man_eater_flower'), '食人花不在第0层');
const f0 = FLOORS[0].spawns, bossX = f0.find(s => ENEMIES[s.id]?.tier === 'boss')!.x;
const yetiX = Math.max(...f0.filter(s => s.id === 'forest_yeti').map(s => s.x)), lastCat = Math.max(...f0.filter(s => /cat|hen|scarecrow/.test(s.id)).map(s => s.x));
ok(yetiX > lastCat * 0.9 && yetiX < bossX, `雪人在第0层后段（${yetiX}，BOSS ${bossX}）`);
// 第1层雪人入口段：暂缓（见 CHANGELOG）

for (const f of [0, 1]) { const sp = FLOORS[f].spawns.filter(s => ENEMIES[s.id]?.tier !== 'boss'), w = (FLOORS[f].widthScreens ?? 3) * 1280;
  let mx = 0; for (let x = 0; x + 1280 <= w; x += 64) mx = Math.max(mx, sp.filter(s => s.x >= x && s.x < x + 1280).length);
  ok(mx <= PER_SCREEN_CAP, `第${f}层任意一屏 ≤ ${PER_SCREEN_CAP} 只（${mx}），新手怪计入总量 ${sp.length}`); }
// 第 0 层豁免公式面板（用折算原值）；第 1 层按层目标等级重算
ok(EXEMPT_FLOORS.includes(0) && foeStatsAt('hen', 0) === null, '第0层豁免');
const fl = foeStatsAt('man_eater_flower', 1)!, orc = foeStatsAt('orc', 1)!;
ok(fl && fl.hp >= Math.floor(orc.hp * 0.85 / 1.15) && fl.hp <= Math.ceil(orc.hp * 1.15 / 0.85), `食人花第1层面板与本层同档 HP${fl.hp}（兽人 ${orc.hp}）`);
// 第 1 章入口不跳级：任意新手怪单杀经验 < 当前级所需的 1/3
for (const L of [1, 2, 3, 4, 5, 6]) for (const id of IDS) { const f = id === 'man_eater_flower' ? 1 : 0, x = killExp(id, f, L, monsterLevelAt(id, f));
  ok(x < EXP_PER_LEVEL(L) / 3, `Lv${L} 杀 ${id}@${f} 得 ${x} < ${EXP_PER_LEVEL(L)}/3`); }
console.log(`novice-monsters: ${pass} passed`);
