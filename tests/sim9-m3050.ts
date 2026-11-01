import { simRun, SEEDS, median } from './sim-lib';
// @ts-ignore node
import { writeFileSync } from 'node:fs';
// @ts-ignore node
const env = process.env; const c = env.CLS as any;
const rs = SEEDS.map(sd => simRun(c, sd)), ds = rs.map(r => r.deaths);
const perFloor = Math.max(0, ...rs.map(r => { const m: Record<number, number> = {}; for (const d of r.deathAt) m[d.floor] = (m[d.floor] ?? 0) + 1; return Math.max(0, ...Object.values(m)); }));
const at = (f: number[]) => rs.map(r => r.deathAt.filter((d: any) => f.includes(d.floor)).length);
const o = { seeds: SEEDS, deaths: ds, median: median(ds), max: Math.max(...ds), done: rs.filter(r => r.done).length, levels: rs.map(r => r.level), perFloor, t: median(rs.map(r => r.t)), d52_82: at([52, 82]), deathFloors: rs.map(r => r.deathAt.map((d: any) => d.floor)) };
console.log(c, JSON.stringify(o)); writeFileSync(env.OUT!, JSON.stringify(o, null, 1));
