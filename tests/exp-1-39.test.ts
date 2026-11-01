// feat/balance-4050：1–39 级 expNeed 与 main（R61）逐级完全相同；40–49 级 ×EXP_LATE_MUL
import { EXP_PER_LEVEL, EXP_LATE_MUL, OFFICIAL_EXP, EXP_SCALE } from '../src/data/expCurve';
const MAIN = [0, 10, 20, 30, 40, 60, 90, 120, 170, 250, 600, 800, 1000, 1500, 3000, 4000, 5000, 7000, 10000, 12000, 14000, 25000, 30000, 35000, 40000, 50000, 70000, 100000, 140000, 180000, 200000, 240000, 280000, 320000, 360000, 400000, 480000, 560000, 820000, 900000];
let fail = 0; const ok = (c: boolean, m: string) => { if (!c) { fail++; console.log('FAIL ' + m); } };
for (let l = 1; l <= 39; l++) ok(EXP_PER_LEVEL(l) === MAIN[l], `Lv${l} ${EXP_PER_LEVEL(l)} ≠ main ${MAIN[l]}`);
for (let l = 40; l <= 49; l++) ok(EXP_PER_LEVEL(l) === Math.round(OFFICIAL_EXP[l] / EXP_SCALE * EXP_LATE_MUL), `Lv${l}`);
ok(EXP_PER_LEVEL(50) === Math.round(OFFICIAL_EXP[49] / EXP_SCALE * 1.5), 'Lv50+ 不变');
console.log(fail ? `exp-1-39: ${fail} FAIL` : 'exp-1-39: 1–39 级 39 项与 main 相同 passed'); if (fail) process.exit(1);
