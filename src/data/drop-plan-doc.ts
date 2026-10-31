import { ENEMIES } from './units';
import { ITEMS } from './items';
import { FLOORS } from './world';
import { FLOOR_TARGET_LV } from './balance';
import { DROPS_BEFORE, DROP_REMOVED, DROP_ADD, CAP_NORMAL, CAP_BOSS, minFloorLv } from './drop-plan';
/** docs/drop-plan.md（npm run gen:drops）：每层装备掉落 旧（R13 官方表）→ 新（drop-plan 覆盖后） */
const gear = (ds: { item: string; chance: number }[]) => ds.filter(d => ITEMS[d.item]?.slot);
const fmt = (ds: { item: string; chance: number }[]) => gear(ds).map(d => `${ITEMS[d.item].name}${ITEMS[d.item].req}`).filter((x, i, a) => a.indexOf(x) === i).join(' ') || '—';
export function renderDropPlan(): string {
  const L: string[] = ['# 掉落计划（balance-sys 阶段 4，魔兽 drop-plan 覆盖）', '',
    `规则 [适配]：越级封顶（需求 > 最低出现层目标等级 + ${CAP_NORMAL}（普通）/ ${CAP_BOSS}（BOSS）移除）；补源（下表「新增」）；靴子止于祖玛靴（30），官方高阶靴 未查到 → GAP。`,
    '爆率 1/N 为 [适配]；原官方 1/N 见 docs/drops-official.md。装备后缀数字 = 本作需求等级。', '',
    '## 越级移除', '', '| 怪 | 最低层等级 | 移除 |', '|---|---|---|'];
  for (const [id, rm] of Object.entries(DROP_REMOVED)) L.push(`| ${ENEMIES[id].name}（${id}） | ${minFloorLv(id)} | ${rm.map(i => `${ITEMS[i].name}${ITEMS[i].req}`).join(' ')} |`);
  L.push('', '## 新增来源', '', '| 怪 | 新增（1/N） |', '|---|---|');
  for (const [id, add] of Object.entries(DROP_ADD)) L.push(`| ${ENEMIES[id]?.name}（${id}） | ${add.map(([i, c]) => `${ITEMS[i].name}${ITEMS[i].req} 1/${Math.round(1 / c)}`).join(' ')} |`);
  L.push('', '## 每层装备掉落 旧 → 新', '', '| # | 层 | 目标等级 | 旧 | 新 |', '|---|---|---|---|---|');
  FLOORS.forEach((f, i) => { const ids = [...new Set(f.spawns.map(s => s.id))];
    const o = ids.flatMap(id => DROPS_BEFORE[id] ?? []), n = ids.flatMap(id => ENEMIES[id]?.drops ?? []);
    L.push(`| ${i} | ${f.name} | ${FLOOR_TARGET_LV[i]} | ${fmt(o)} | ${fmt(n)} |`); });
  return L.join('\n') + '\n';
}
