/** drop-realign 评估：9 种子按等级段死亡 + 金币曲线。用法：tsx tests/sim-realign.ts <cls> */
declare const process: any;
import { simRun, SEEDS } from './sim-lib';
const c = process.argv[2] as any; const rows: any[] = [];
for (const sd of SEEDS) { const r: any = simRun(c, sd); const b = [0, 0, 0, 0, 0]; for (const d of r.deathAt) b[Math.min(4, Math.max(0, Math.ceil(d.lv / 10) - 1))]++;
  rows.push({ seed: sd, deaths: r.deaths, band: b, level: r.level, done: r.done, gold: [10, 20, 30, 40, 50].map(l => r.goldAt?.[l] ?? null), eq: r.eqAt, dfl: r.deathAt.filter((d: any) => d.lv > 20 && d.lv <= 30).map((d: any) => d.floor) }); }
console.log(JSON.stringify({ cls: c, seeds: SEEDS, rows }));
