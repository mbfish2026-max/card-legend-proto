// 按 10 级段汇总难度模拟：npx tsx scripts/sim-bands.ts [out.json]
import { simRun, SEEDS, median } from '../tests/sim-lib';
import { CLASSES, ClassId } from '../src/data/classes';
import { FLOORS } from '../src/data/world';
import { writeFileSync } from 'fs';
import { EXP_PER_LEVEL } from '../src/data/expCurve';
const ONLY = process.env.CLS?.split(',');
const SEEDS_ = process.env.SEEDS ? process.env.SEEDS.split(',').map(Number) : SEEDS;
const band = (lv: number) => Math.min(5, Math.floor((lv - 1) / 10));
const BANDS = ['1–10', '11–20', '21–30', '31–40', '41–50', '51+'];
const out: any = {};
for (const c of (ONLY ?? ['warrior', 'mage', 'taoist']) as ClassId[]) {
  const rs = SEEDS_.map(s => ({ seed: s, ...simRun(c, s) }));
  const per = rs.map(r => { const b = BANDS.map(() => 0), fl: Record<number, number> = {};
    for (const d of r.deathAt) { b[band(d.lv)]++; fl[d.floor] = (fl[d.floor] ?? 0) + 1; }
    const mf = Object.entries(fl).sort((a, b) => b[1] - a[1])[0];
    return { seed: r.seed, deaths: r.deaths, done: r.done, level: r.level, t: Math.round(r.t), pot: r.potUsed, bands: b, maxFloor: mf ? `${FLOORS[+mf[0]].name}×${mf[1]}` : '-', maxFloorN: mf ? mf[1] : 0, first: fl[0] ?? 0, kills: r.kills.map((k, i) => k + r.virtKills[i]), virt: r.virtKills, hrs: r.killT.map((x, i) => +((x + r.virtT[i]) / 3600).toFixed(2)), fc: Math.max(0, ...Object.entries(r.firstClear).filter(([f]) => +f !== 0).map(([, v]: any) => v.exp / EXP_PER_LEVEL(v.lv))), fcs: Object.entries(r.firstClear).map(([f, v]: any) => `${f}:${(v.exp / EXP_PER_LEVEL(v.lv)).toFixed(1)}`).join(" ") }; });
  out[c] = per;
  console.log(`\n${CLASSES[c].name}: 中位数 ${median(per.map(p => p.deaths))} 单层最多 ${Math.max(...per.map(p => p.maxFloorN))} 通关等级中位 ${median(per.map(p => p.level))} 通关 ${per.filter(p => p.done).length}/${per.length} 时间中位 ${median(per.map(p => p.t))}s`);
  console.log('  段中位: ' + BANDS.map((b, i) => `${b}:${median(per.map(p => p.bands[i]))}`).join(' '));
  console.log('  段击杀中位: ' + BANDS.map((b, i) => `${b}:${median(per.map(p => p.kills[i]))}`).join(' ') + '  段模拟小时中位: ' + BANDS.map((b, i) => `${b}:${median(per.map(p => p.hrs[i]))}`).join(' ') + `  首清最多 ${Math.max(...per.map(p => p.fc)).toFixed(2)} 级`);
  for (const p of per) console.log(`  种子${p.seed}: 死${p.deaths} ${p.done ? '' : '未通关 '}Lv${p.level} ${p.t}s 药${p.pot} 段[${p.bands.join(',')}] 首图${p.first} 最多 ${p.maxFloor} 首清 ${p.fcs}`);
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
