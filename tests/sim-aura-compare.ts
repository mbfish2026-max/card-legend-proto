/** 9 种子 sim 汇总（死亡中位/通关/单层最大）；用法：CLS=taoist OUT=x.json npx tsx tests/sim-aura-compare.ts */
import { simRun, SEEDS, median } from './sim-lib';
// @ts-ignore node
import { writeFileSync } from 'node:fs';
// @ts-ignore node
const env = process.env;
const out: Record<string, unknown> = {};
for (const c of (env.CLS ?? 'warrior,mage,taoist').split(',') as any[]) {
  const rs = SEEDS.map(sd => simRun(c, sd)), ds = rs.map(r => r.deaths);
  const perFloor = Math.max(0, ...rs.map(r => { const m: Record<number, number> = {}; for (const d of r.deathAt) m[d.floor] = (m[d.floor] ?? 0) + 1; return Math.max(0, ...Object.values(m)); }));
  out[c] = { deaths: ds, median: median(ds), max: Math.max(...ds), done: rs.filter(r => r.done).length, levels: rs.map(r => r.level), perFloor, t: median(rs.map(r => r.t)) };
  console.log(c, JSON.stringify(out[c]));
}
if (env.OUT) writeFileSync(env.OUT, JSON.stringify(out, null, 1));
