/** R14 #15 逐怪对照表：本作 ENEMIES ↔ 原版怪物（21cq Mob 页）。没有对应页的标 未查到 */
import { ENEMIES } from './units';
import { OFFICIAL_DROPS } from './drops-official';
import { FLOORS } from './world';
import { renderM4 } from './m4-official';
export function renderMonsters() {
  const L = ['# 逐怪对照表（npm run gen:monsters 生成）', '', '| id | 本作名 | 级别 | 出现楼层 | 原版名 | 来源 |', '|---|---|---|---|---|---|'];
  for (const [id, u] of Object.entries(ENEMIES)) {
    const o = OFFICIAL_DROPS[id], fl = FLOORS.map((f, i) => f.spawns.some(s => s.id === id) ? `${i + 1}.${f.name}` : '').filter(Boolean).join(' ');
    L.push(`| ${id} | ${u.name} | ${u.tier ?? 'normal'} | ${fl || '—'} | ${o?.name ?? '未查到'} | ${o ? `[21cq](${o.src})` : '未查到'} |`);
  }
  return L.join('\n') + '\n' + renderM4();
}
