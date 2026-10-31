/** 平衡报告：每 10 级段死亡/击杀/耗时（9 种子），用法：tsx tests/sim-band.ts <cls> [out.json] */
declare const process: any;
import { simRun, SEEDS, median } from './sim-lib';
import { FLOORS } from '../src/data/world';
const c = process.argv[2] as any; const out: any = { cls: c, seeds: [] };
for (const sd of SEEDS) {
  const r = simRun(c, sd); const bd = [0, 0, 0, 0, 0, 0]; for (const d of r.deathAt) bd[Math.min(5, Math.floor(d.lv / 10))]++;
  const pf: Record<string, number> = {}; for (const d of r.deathAt) pf[FLOORS[d.floor].name] = (pf[FLOORS[d.floor].name] ?? 0) + 1;
  const top = Object.entries(pf).sort((a, b) => b[1] - a[1])[0];
  out.seeds.push({ seed: sd, deaths: r.deaths, level: r.level, done: r.done, t: Math.round(r.t), bandDeaths: bd, kills: r.kills.map((k, i) => k + r.virtKills[i]), time: r.killT.map((k, i) => Math.round(k + r.virtT[i])), topFloor: top });
  console.log(c, sd, r.deaths, r.level, Math.round(r.t), bd.join('/'), top?.join(':'));
}
out.medT = median(out.seeds.map((s: any) => s.t)); out.medD = median(out.seeds.map((s: any) => s.deaths));
console.log('MED', c, out.medD, out.medT);
if (process.argv[3]) (await import('node:' + 'fs') as any).writeFileSync(process.argv[3], JSON.stringify(out));
