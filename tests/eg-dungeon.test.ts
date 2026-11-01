// P3 eg-dungeon：每日 3 次 / 用尽可进（600 s、×0.25）/ 首通必掉 + 1/10 / D7 节奏 / E7 双头 / 存档
declare const process: { exit(c: number): never };
import { World, BOSS_RESPAWN } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { ENEMIES } from '../src/data/units';
import { ITEMS, SETS } from '../src/data/items';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { DUNGEONS, DUNGEON_BY_FLOOR, DUNGEON_DAILY, bonusChance, nativeQ, DUNGEON_BASE_CHANCE } from '../src/data/dungeons';
import type { ClassId } from '../src/data/classes';
let fails = 0; const ok = (c: unknown, m: string) => { if (c) console.log('  ✓', m); else { fails++; console.log('  ✗', m); } };
const seeded = (s: number) => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
const fi = (name: string) => FLOORS.findIndex(f => f.name === name);
/** 打一次副本：刷出该副本全部 BOSS 并击杀，返回本次地上的本职业套装件 */
function runOnce(w: World, d: typeof DUNGEONS[number]): string[] {
  w.floorIndex = fi(d.floor); w.ground.length = 0; const pieces = SETS[d.sets[w.cls]].pieces;
  for (const b of d.bosses) { const u = w.spawn(ENEMIES[b], 'enemy', 600); w.kill(u); }
  return w.ground.map(g => g.item).filter(i => pieces.includes(i));
}

ok(DUNGEONS.every(d => fi(d.floor) >= 0 && DUNGEON_BY_FLOOR[fi(d.floor)] === d), '6 个副本层均存在');
ok(DUNGEONS.every(d => FLOOR_TARGET_LV[fi(d.floor)] >= 40), '副本层目标等级均 ≥40（<40 层不掉 40+ 装备不受影响）');
ok(DUNGEONS.some(d => d.bosses.includes('boss_twinhead_kong') && d.bosses.includes('boss_twinhead_blood')), 'E7：双头金刚/双头血魔纳入副本');

// 次数与冷却
{ const w = new World(seeded(1), 48, FLOORS, 'warrior'); let day = '2026-11-01'; w.today = () => day; const d = DUNGEONS[0];
  const fl = fi(d.floor);
  runOnce(w, d); ok(w.dungeonLeft(d.id) === DUNGEON_DAILY - 1 && w.bossCdLeft(fl) === 0, '次数内：消耗 1 次，BOSS 不冷却');
  const first = w.dungeonFirst.has(d.id); ok(first, '首通记录');
  runOnce(w, d); runOnce(w, d); ok(w.dungeonLeft(d.id) === 0, '3 次后用尽');
  runOnce(w, d); ok(w.dungeonLeft(d.id) === 0 && w.bossCdLeft(fl) === BOSS_RESPAWN, '用尽仍可进；BOSS 600 s 冷却');
  day = '2026-11-02'; ok(w.dungeonLeft(d.id) === DUNGEON_DAILY, '次日 0 点重置 3 次');
  // 双头：两只算一次
  const j = DUNGEONS.find(x => x.id === 'jitan')!; runOnce(w, j); ok(w.dungeonLeft('jitan') === DUNGEON_DAILY - 1, '双 BOSS 副本两只合计 1 次');
  const sv = JSON.parse(JSON.stringify(w.toSave())), re = new World(seeded(2), 1, FLOORS, 'warrior', sv); re.today = () => day;
  ok(re.dungeonLeft('jitan') === DUNGEON_DAILY - 1 && re.dungeonFirst.has(d.id), '存档往返：次数与首通');
  const old = { ...sv }; delete old.dungeonRuns; delete old.dungeonFirst; const ro = new World(seeded(2), 1, FLOORS, 'warrior', old);
  ok(ro.dungeonLeft('chiyue') === DUNGEON_DAILY && ro.dungeonFirst.size === 0, '旧存档（无副本字段）读档：满次数、未首通');
}
// 首通必掉
for (const cls of ['warrior', 'mage', 'taoist'] as ClassId[]) { let all = true;
  for (const d of DUNGEONS) { const w = new World(seeded(7), 48, FLOORS, cls); w.lootRng = () => 0.999; if (!runOnce(w, d).length) all = false; }
  ok(all, `${cls}：6 个副本首通必掉 1 件本职业套装件`); }
// 疲劳 ×0.25：概率计算
ok(DUNGEONS.every(d => (['warrior', 'mage', 'taoist'] as ClassId[]).every(c => { const q = 1 - (1 - nativeQ(d, c)) * (1 - DUNGEON_BASE_CHANCE) * (1 - bonusChance(d, c)); return Math.abs(q - (SETS[d.sets[c]].pieces.length === 4 ? 0.25 : 0.15)) < 0.01 || nativeQ(d, c) + DUNGEON_BASE_CHANCE > 0.25; })), 'D7：每次副本本职业件总概率 q=0.25（4 件）/0.15（3 件）');
// D7 蒙特卡洛：真实 World 击杀，统计凑齐所需副本次数（中位）
const med = (a: number[]) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
const report: string[] = [];
for (const d of DUNGEONS) for (const cls of ['warrior', 'mage', 'taoist'] as ClassId[]) {
  const need = SETS[d.sets[cls]].pieces.length, res: number[] = [];
  for (let s = 1; s <= 120; s++) { const w = new World(seeded(s), 48, FLOORS, cls); let k = 0, day = 0; w.today = () => 'D' + day; let ls = s * 7919; w.lootRng = seeded(ls);
    const got = new Set<string>(); let n = 0;
    while (got.size < need && n < 400) { if (w.dungeonLeft(d.id) <= 0) day++; n++; runOnce(w, d).forEach(i => got.add(i)); k++; }
    res.push(n); }
  const m = med(res); report.push(`${d.id}/${cls}:${m}`);
  ok(m >= 22 && m <= 32, `D7 ${d.name} ${cls} 凑齐 ${need} 件中位 ${m} 次（≈${(m / 3).toFixed(1)} 天）`);
}
console.log('  D7 中位次数', report.join(' '));
// 疲劳模式掉率：用尽后 1000 次只 0.25 倍
{ const d = DUNGEONS[0]; let hit = 0, hitT = 0; const N = 3000;
  for (const tired of [false, true]) { const w = new World(seeded(5), 48, FLOORS, 'warrior'); w.today = () => 'X'; w.dungeonFirst.add(d.id); w.lootRng = seeded(99);
    if (tired) w.dungeonRuns[d.id] = { day: 'X', n: 99 }; else w.today = (() => { let i = 0; return () => 'd' + Math.floor(i++ / 2); })();
    let h = 0; for (let i = 0; i < N; i++) h += runOnce(w, d).length ? 1 : 0; if (tired) hitT = h; else hit = h; }
  ok(hitT / hit > 0.15 && hitT / hit < 0.4, `次数用尽掉率约 ×0.25（${hit} → ${hitT}）`); }
console.log(fails ? `eg-dungeon: ${fails} FAILED` : 'eg-dungeon: all passed'); if (fails) process.exit(1);
