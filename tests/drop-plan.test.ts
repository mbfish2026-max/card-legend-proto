// 掉落规划逐层覆盖（0–82 层）：每层每只怪的装备掉落需求 ≤ 该层目标等级 + 封顶；docs/drop-plan.md 与数据一致
import '../src/combat/World'; // 与 gen:drops 一致：含 eg-sets 停掉落等运行时最终掉落表
import { FLOORS, WORLD } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
import { CAP_NORMAL, CAP_BOSS, CAP_GEAR, minFloorLv } from '../src/data/drop-plan';
import { renderDropPlan } from '../src/data/drop-plan-doc';
const { readFileSync } = await import('node:' + 'fs') as any;
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
ok(FLOORS.length === 83, `共 83 层（实际 ${FLOORS.length}）`);
for (let f = 0; f < FLOORS.length; f++) {
  const L = FLOOR_TARGET_LV[f]; ok(typeof L === 'number', `第 ${f} 层有目标等级`);
  for (const s of FLOORS[f].spawns) { const u = ENEMIES[s.id]; if (!u) { ok(false, `第 ${f} 层 ${s.id} 未定义`); continue; }
    const ml = minFloorLv(s.id) ?? L;
    for (const d of u.drops ?? []) { const it = ITEMS[d.item]; if (s.id === 'orc_chief' && ['armor', 'gold_ring'].includes(d.item)) continue; /* drop-realign D3 用户批准例外 */ ok(!!it || ['book_page', 'gold_bar'].includes(d.item), `${u.name} 掉落 ${d.item} 存在`); if (!it?.slot) continue;
      const cap = u.tier !== 'boss' ? CAP_NORMAL : it.slot === 'weapon' ? CAP_BOSS : CAP_GEAR;
      ok((it.req ?? 0) <= ml + cap, `第 ${f} 层 ${u.name} 掉 ${it.name} 需求 ${it.req} ≤ ${ml}+${cap}`);
      ok(d.chance > 0 && d.chance <= 1, `${u.name}/${it.name} 几率 ∈ (0,1]`); } } }
// 品质 精良12%/极品2% 为 GAP：改后法师 3/9、战士 2/9 种子到不了 Lv50（见 docs/exp-curve.md），暂保持 30%/10%
ok(WORLD.rarityRoll.magic + WORLD.rarityRoll.rare < 1, '品质概率合法');
ok(readFileSync('docs/drop-plan.md', 'utf8') === renderDropPlan(), 'docs/drop-plan.md 与数据一致');
// 21–30 怪物侧调参（同批提交）
{ const { foeStatsAt } = await import('../src/data/balance');
  const f5 = FLOORS[5]; ok(f5.name === '尸王殿', '5=尸王殿');
  const b = foeStatsAt('boss_lich', 5)!, sk = foeStatsAt('skeleton', 5)!; ok(b.hp > 2 * sk.hp && b.atk < sk.atk, '尸王：血仍 >2 倍小怪，攻已下调（战士断崖）');
  const f30 = FLOORS.findIndex((_, i) => FLOOR_TARGET_LV[i] === 25); const id = FLOORS[f30].spawns.find(s => ENEMIES[s.id].tier !== 'boss')!.id;
  ok(foeStatsAt(id, f30)!.atk > 0, 'L25 层普通怪有攻击');
  ok(FLOORS[2].spawns.filter(s => s.id === 'spider').length === 7, '蛛网晶洞蜘蛛 8→7'); }
console.log(`drop-plan: ${n - fail}/${n} 通过`); if (fail) (globalThis as any).process.exit(1);
