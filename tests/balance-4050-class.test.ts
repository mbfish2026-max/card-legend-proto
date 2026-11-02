// feat/balance-4050-class：L≥41（牛魔寺庙起）怪物攻/血按玩家职业倍率；40 级起经验按职业系数。
// 1) 系数全 1 时 foeStatsAt / EXP_PER_LEVEL 与 94f4a01 快照（tests/fixtures/foe-94f4a01.json）逐字段一致
// 2) 任意系数下 L≤40 层（含祖玛阁、1–39）逐字段不变；L≥41 按职业缩放；不传职业 = 不缩放
// 3) World 按当前玩家职业取倍率（spawnFoe / expNext）
import { foeStatsAt, FOE_CLS_4050, FLOOR_TARGET_LV } from '../src/data/balance';
import { EXP_PER_LEVEL, EXP_LATE_CLS } from '../src/data/expCurve';
import { FLOORS } from '../src/data/world';
import { World } from '../src/combat/World';
const { readFileSync } = await import('node:' + 'fs') as any;
const snap = JSON.parse(readFileSync(new URL('./fixtures/foe-94f4a01.json', import.meta.url), 'utf8'));
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL ' + m); } };
const CLS = ['warrior', 'mage', 'taoist'] as const;
const saveF = JSON.parse(JSON.stringify(FOE_CLS_4050)), saveE = { ...EXP_LATE_CLS };
const setF = (v: Record<string, { atk: number; hp: number }>) => { for (const c of CLS) Object.assign(FOE_CLS_4050[c], v[c]); };
const setE = (v: Record<string, number>) => Object.assign(EXP_LATE_CLS, v);
const keys = Object.keys(snap.foe);
// 1) 默认值=1 ≡ 94f4a01
setF({ warrior: { atk: 1, hp: 1 }, mage: { atk: 1, hp: 1 }, taoist: { atk: 1, hp: 1 } }); setE({ warrior: 1, mage: 1, taoist: 1 });
for (const k of keys) { const [f, id] = [Number(k.split(':')[0]), k.slice(k.indexOf(':') + 1)];
  for (const c of [undefined, ...CLS]) ok(JSON.stringify(foeStatsAt(id, f, c)) === JSON.stringify(snap.foe[k]), `系数1 ${k} ${c}`); }
for (let l = 1; l <= 60; l++) for (const c of [undefined, ...CLS]) ok(EXP_PER_LEVEL(l, c) === snap.exp[l - 1], `exp 系数1 Lv${l} ${c}`);
// 2) 非 1 系数
const T = { warrior: { atk: 1.05, hp: 1.1 }, mage: { atk: 1.2, hp: 1.3 }, taoist: { atk: 1.4, hp: 0.9 } }; setF(T); setE({ warrior: 1.1, mage: 1.2, taoist: 1.3 });
let hi = 0, lo = 0;
for (const k of keys) { const f = Number(k.split(':')[0]), id = k.slice(k.indexOf(':') + 1), L = FLOOR_TARGET_LV[f], s = snap.foe[k];
  ok(JSON.stringify(foeStatsAt(id, f)) === JSON.stringify(s), `不传职业不缩放 ${k}`);
  for (const c of CLS) { const r = foeStatsAt(id, f, c)!;
    if (L <= 40) { lo++; ok(JSON.stringify(r) === JSON.stringify(s), `L${L} ${k} ${c} 应不变`); }
    else { hi++; ok(Math.abs(r.atk - s.atk * T[c].atk) <= 1 && Math.abs(r.hp - s.hp * T[c].hp) <= 1 && r.def === s.def && r.level === s.level, `L${L} ${k} ${c} 按职业 ${JSON.stringify(r)} vs ${JSON.stringify(s)}`); } } }
ok(hi > 0 && lo > 0, '覆盖 L≥41 与 L≤40');
for (let l = 1; l <= 39; l++) for (const c of CLS) ok(EXP_PER_LEVEL(l, c) === snap.exp[l - 1], `exp 1–39 不变 Lv${l} ${c}`);
for (let l = 40; l <= 60; l++) { ok(EXP_PER_LEVEL(l) === snap.exp[l - 1], `exp 不传职业 Lv${l}`);
  for (const c of CLS) ok(Math.abs(EXP_PER_LEVEL(l, c) - snap.exp[l - 1] * EXP_LATE_CLS[c]) <= 1, `exp Lv${l} ${c}`); }
// 3) World：按玩家职业
const f41 = FLOORS.findIndex((_, i) => FLOOR_TARGET_LV[i] === 42), f40 = FLOORS.findIndex((_, i) => FLOOR_TARGET_LV[i] === 40);
const id41 = FLOORS[f41].spawns.find(s => !s.id.startsWith('boss'))!.id, id40 = FLOORS[f40].spawns[0].id;
for (const c of CLS) { const w = new World(() => 0.5, 45, FLOORS, c);
  ok(w.expNext === EXP_PER_LEVEL(45, c), `World expNext ${c}`);
  w.loadFloor(f41); const u = w.spawnFoe(id41, 0, 0); ok(u.atk === foeStatsAt(id41, f41, c)!.atk && u.maxHp === foeStatsAt(id41, f41, c)!.hp, `World spawnFoe L42 ${c}`);
  w.loadFloor(f40); const v = w.spawnFoe(id40, 0, 0); ok(v.atk === foeStatsAt(id40, f40)!.atk || v.tier === 'boss', `World spawnFoe L40 ${c} 不变`); }
setF(saveF); setE(saveE);
console.log(fail ? `balance-4050-class: ${fail}/${n} FAIL` : `balance-4050-class: ${n} 项 passed`); if (fail) (globalThis as any).process.exit(1);
