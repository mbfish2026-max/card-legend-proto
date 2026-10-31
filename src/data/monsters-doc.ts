/** R14 #15 逐怪对照表：本作 ENEMIES ↔ 原版怪物（21cq Mob 页）。没有对应页的标 未查到 */
import { ENEMIES } from './units';
import { OFFICIAL_DROPS } from './drops-official';
import { FLOORS } from './world';
import { renderM4 } from './m4-official';
import { NOVICE_OFFICIAL, NOVICE_SCALE } from './units';
import { foeStatsAt } from './balance';
export function renderMonsters() {
  const L = ['# 逐怪对照表（npm run gen:monsters 生成）', '', '| id | 本作名 | 级别 | 出现楼层 | 原版名 | 来源 |', '|---|---|---|---|---|---|'];
  for (const [id, u] of Object.entries(ENEMIES)) {
    const o = OFFICIAL_DROPS[id], fl = FLOORS.map((f, i) => f.spawns.some(s => s.id === id) ? `${i + 1}.${f.name}` : '').filter(Boolean).join(' ');
    L.push(`| ${id} | ${u.name} | ${u.tier ?? 'normal'} | ${fl || '—'} | ${o?.name ?? '未查到'} | ${o ? `[21cq](${o.src})` : '未查到'} |`);
  }
  return L.join('\n') + '\n' + renderM4() + renderNovice();
}

/** 9:27 新手怪：官方值（21cq 1.76 怪物属性表 https://www.21cq.com/mir/Monster.Aspx ）→ 折算前后 */
export function renderNovice() {
  const L = ['', '## 新手怪（9:27，feat/balance-sys）', '',
    '来源：21cq 1.76 怪物属性表 https://www.21cq.com/mir/Monster.Aspx 。羊：未查到（也无立绘），未加入。',
    '折算 [适配]（units.ts NOVICE_SCALE）：原始面板 hp = 50 + 2.5×官方HP，atk = 5 + 0.8×官方平均攻，def = 官方防，等级 = clamp(round(0.3×官方等级),1,6)；再乘 n() 的 DIFF（血 ×1.6、攻 ×1.4×2.81）。第 0 层（幽暗森林）豁免层公式，直接用此值；第 1 层（兽人要塞）由 foeStatsAt 按层目标等级重算。掉落：官方未查到 → [适配]。经验：官方经验进 OFFICIAL_MON_EXP，按层经验倍率折算。',
    '', '|怪|官方 Lv/HP/攻/防/经验|折算原始 Lv/HP/攻/防|游戏面板(第0层) Lv/HP/攻/防|第1层面板 Lv/HP/攻/防|出现层|', '|-|-|-|-|-|-|'];
  for (const [id, o] of Object.entries(NOVICE_OFFICIAL)) { const v = NOVICE_SCALE(o), e = ENEMIES[id], f1 = foeStatsAt(id, 1);
    const fl = FLOORS.map((f, i) => f.spawns.some(s => s.id === id) ? i : -1).filter(i => i >= 0);
    L.push(`|${o.name}（${id}）|${o.lv}/${o.hp}/${o.atk.join('-')}/${o.def}/${o.exp}|${v.level}/${v.hp}/${v.atk}/${v.def}|${e.level}/${e.hp}/${e.atk}/${e.def}|${fl.includes(1) && f1 ? `${f1.level}/${f1.hp}/${f1.atk}/${f1.def}` : '—'}|${fl.join(',')}|`); }
  return L.join('\n') + '\n';
}
