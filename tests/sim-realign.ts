/** drop-realign 评估：9 种子按等级段死亡 + 金币曲线。用法：tsx tests/sim-realign.ts <cls> */
declare const process: any;
import { simRun, SEEDS } from './sim-lib';
import { ITEMS } from '../src/data/items';
// 调参试验（只改内存中的 H 链数值，不改数据文件）：HK=属性倍数，HHP=无职业件每点防御附带生命
if (process.env.HK || process.env.HHP || process.env.HKT) { const k0 = +(process.env.HK ?? 1), hp = +(process.env.HHP ?? 0), kt = +(process.env.HKT ?? k0);
  for (const it of Object.values(ITEMS)) if (it.id.startsWith('h_') && it.equip) { const e: any = it.equip; for (const s of Object.keys(e)) { const c0 = (it as any).cls?.[0]; const k = c0 === 'taoist' ? kt : c0 === 'warrior' ? +(process.env.HKW ?? k0) : c0 === 'mage' ? +(process.env.HKM ?? k0) : k0; e[s] = Math.round(e[s] * k); } if (hp && !(it as any).cls?.length && e.def) e.hp = (e.hp ?? 0) + e.def * hp; } }
const c = process.argv[2] as any; const rows: any[] = [];
for (const sd of SEEDS) { const r: any = simRun(c, sd); const b = [0, 0, 0, 0, 0]; for (const d of r.deathAt) b[Math.min(4, Math.max(0, Math.ceil(d.lv / 10) - 1))]++;
  rows.push({ seed: sd, deaths: r.deaths, band: b, level: r.level, done: r.done, gold: [10, 20, 30, 40, 50].map(l => r.goldAt?.[l] ?? null), eq: r.eqAt, dfl: r.deathAt.filter((d: any) => d.lv > 20 && d.lv <= 30).map((d: any) => d.floor) }); }
console.log(JSON.stringify({ cls: c, seeds: SEEDS, rows }));
