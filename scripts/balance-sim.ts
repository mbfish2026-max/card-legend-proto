// 平衡模拟（与 tests/battle.test.ts 的 simRun 同策略）：tsx scripts/balance-sim.ts [warrior|mage|taoist]
// 输出 JSON：每种子死亡/通关/红药/等级/用时、按层死亡、首图（floor 0）统计
declare const process: { env: Record<string, string | undefined>; argv: string[] };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { ClassId } from '../src/data/classes';
import { ITEMS } from '../src/data/items';
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const SEEDS = [3, 7, 11, 19, 23, 42, 57, 88, 101];
const c = (process.argv[2] ?? 'warrior') as ClassId;
const out: any[] = [];
for (const seed of SEEDS) {
  const w = new World(seeded(seed), 1, FLOORS, c); let cds = w.skills.map(() => 0); let t = 0, potUsed = 0;
  const floorDeaths: Record<string, number> = {}; const f0 = { t: 0, dmgTaken: 0, hits: 0, pots: 0, deaths: 0, lvOut: 0, kills: 0 };
  while (!w.done && t < 7200) {
    const h = w.hero;
    if (!h) { const n = FLOORS[w.floorIndex].name; floorDeaths[n] = (floorDeaths[n] ?? 0) + 1; if (w.floorIndex === 0) f0.deaths++; w.respawn(); continue; }
    if (h.hp < h.maxHp * 0.4 && w.usePotion(w.pots[1] > 0 ? 1 : 0)) { potUsed++; if (w.floorIndex === 0) f0.pots++; }
    if ((h.mp ?? 0) < 40) w.usePotion(w.pots[3] > 0 ? 3 : 2);
    for (let i = 0; i < w.skills.length; i++) { if (w.skills[i].id === 'charm' && !w.charmAutoOk()) continue; w.cast(i, cds); }
    for (let i = 0; i < w.skills.length; i++) w.cast(i, cds, { auto: true });
    for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[w.targetSlot(it)!]) w.equipItem(i); }
    for (let i = w.bag.length - 1; i >= 0; i--) if (w.bag[i]?.item === 'black_iron') w.sellItem(i);
    for (const b of w.shopBooks()) { const sk = w.skillPool.find(x => x.id === b.skill)!; if (!w.learned.has(b.skill) && w.level >= w.needLevel(sk) && w.gold >= b.price && !w.bag.some(x => ITEMS[x.item]?.book === b.skill)) w.buyBook(b.skill); }
    for (let i = w.bag.length - 1; i >= 0; i--) if (ITEMS[w.bag[i].item]?.book && w.learnBook(i).startsWith('学会')) cds = w.skills.map(() => 0);
    const saving = w.shopBooks().some(b => !w.learned.has(b.skill) && w.level >= w.needLevel(w.skillPool.find(x => x.id === b.skill)!));
    const depth = w.floorIndex; const cap = saving ? Math.min(3, 1 + Math.floor(depth / 4)) : 3 + Math.floor(depth / 2);
    while (w.gold >= 60 && w.pots[1] < cap) w.buyPotion(1);
    while (w.gold >= 60 && w.pots[3] < cap) w.buyPotion(3);
    const fi = w.floorIndex, hid = h.uid;
    w.step(0.05, { dx: (() => { const f = w.queue(1)[0]; return f && w.inMelee(h, f) ? 0 : 1; })(), dy: 0 });
    for (const e of w.drainEvents()) if (fi === 0 && e.type === 'damage' && (e as any).target === hid) { f0.dmgTaken += (e as any).amount; f0.hits++; }
    if (fi === 0) { f0.t += 0.05; f0.lvOut = w.level; }
    t += 0.05; for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - 0.05);
  }
  out.push({ seed, deaths: w.deaths, done: w.done, potUsed, level: w.level, t: Math.round(t), floorDeaths, f0: { ...f0, t: Math.round(f0.t), dmgTaken: Math.round(f0.dmgTaken) } });
}
console.log(JSON.stringify({ cls: c, runs: out }));
