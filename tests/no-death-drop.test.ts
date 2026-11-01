// feat/no-death-drop：死亡无任何损失（金币/背包/装备/经验/等级/药水），死亡次数照常统计
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
for (const cls of ['warrior', 'mage', 'taoist'] as const) {
  const w = new World(seeded(7), 30, FLOORS, cls); w.loadFloor(5); w.gold = 12345; w.exp = 777;
  w.bag.push(w.makeItem('tao_sword', 'rare'), w.makeItem('tao_sword', 'common'));
  const snap = () => JSON.stringify({ g: w.gold, e: w.exp, l: w.level, b: w.bag, q: w.equip, p: w.pots, f: w.floorIndex, s: [...w.learned] });
  const before = snap(), d0 = w.deaths;
  w.kill(w.hero!); ok(!w.hero, `${cls} 死亡`); w.respawn();
  ok(!!w.hero && w.hero.hp === w.hero.maxHp, `${cls} 满血复活`);
  ok(snap() === before, `${cls} 金币/经验/等级/背包/装备/药水/层/技能 全部不变`);
  ok(w.deaths === d0 + 1, `${cls} 死亡次数 +1（口径不变）`);
  const w2 = new World(seeded(1), 1, FLOORS, cls, JSON.parse(JSON.stringify(w.toSave()))); ok(w2.gold === 12345 && w2.bag.length === w.bag.length, `${cls} 死亡后存档读档一致`);
}
console.log(`no-death-drop: all passed (${pass})`);
