import { MINE_FLOORS, MINE_CAST, MINE_RESPAWN, OIL_BOSSES, OIL_RATE } from './mining';
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
  L.push('', '## 祝福油 / 黑铁矿（阶段4）', '',
    '| 物品 | 旧 | 新 | 出处 |', '|---|---|---|---|',
    `| 祝福油 | 所有 BOSS 必掉 1；24 种怪 oilChance 小概率；杂货铺每层限购 1 | 仅高级 BOSS（${OIL_BOSSES.map(i => ENEMIES[i]?.name ?? i).join('、')}）各 ${OIL_RATE} [适配]；普通怪/精英不掉；商店停售 | 1.76 物品库祝福油掉落怪 https://www.thelegendofmir2.com/item/e557bdf0f3dd51da6e1817a342d95c26.html ；腾讯手游 BOSS 掉落含祝福油 https://mir.qq.com/webplat/info/news_version3/12754/37998/38001/m10762/202304/932393.shtml ；掉率 未查到 |`,
    `| 黑铁矿石 | BOSS 必掉纯度 1–3；普通怪 5%；铁匠每层限购 5 | 怪物/商店全部不出；仅矿点挖矿（读条 ${MINE_CAST}s、刷新 ${MINE_RESPAWN}s [适配]，纯度 1–2，矿区·桥起 1–3 [适配]） | 传奇永恒官方资料站 https://actcq.web.sdo.com/project/2016/web/0428dataStation/content.aspx?aid=247754 ；17173 毒蛇山谷矿区 https://mir.17173.com/content/2022-06-16/20220616183105995.shtml |`,
    '', `矿点层（下标→名）：${MINE_FLOORS.map(i => `${i + 1} ${FLOORS[i]?.name}`).join('、')}。其它矿区（石墓等）官方有无矿点 未查到 → 不放。`,
    '', '注：油名单 = 1.76 掉油怪 ∩ 本作 L≥28 BOSS；千年树妖/牛魔祭司等未在本作作为 BOSS 或等级 <28 → 不掉。本作 lootRng 为固定 LCG，实测祖玛 2000 次出油 129（6.5%），低于名义 1/8。');
  return L.join('\n') + '\n';
}
