// 装备卡点依据：9 种子首次进入各 BOSS 层时的装备属性（只算装备 equipStats，不含等级成长）。npx tsx scripts/gear-probe.ts out.json
import { simRun, SEEDS } from '../tests/sim-lib';
import { FLOORS } from '../src/data/world';
import { writeFileSync } from 'fs';
const NAMES = ['祖玛阁', '牛魔寺庙', '封魔殿', '赤月魔穴', '保卫家园', '卧龙山庄', '雷炎洞穴', '火龙神殿', '魔龙血域'];
const idx = NAMES.map(n => FLOORS.findIndex(f => f.name === n));
const out: any = {};
for (const c of (process.env.CLS?.split(',') ?? ['warrior', 'mage', 'taoist'])) {
  out[c] = SEEDS.map(s => { const r: any = simRun(c as any, s); return { seed: s, gear: Object.fromEntries(idx.map((f, i) => [NAMES[i], r.gearAt[f] ?? null])) }; });
  console.log(c, JSON.stringify(out[c].map((x: any) => x.gear['封魔殿'])));
}
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out));
