// 技能书 extraDrops 钩子：空表接线；不对具体技能书做断言（数据归战斗开发）
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
import { BOSS_EXTRA_DROPS, applyExtraDrops } from '../src/data/drop-plan';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
ok(typeof BOSS_EXTRA_DROPS === 'object' && Object.values(BOSS_EXTRA_DROPS).every(a => Array.isArray(a)), '钩子表存在（内容由战斗开发填写）');
const boss = 'wolf_king', item = Object.keys(ITEMS).find(k => !(ENEMIES[boss].drops ?? []).some(d => d.item === k))!;
const n0 = ENEMIES[boss].drops!.length;
const added = applyExtraDrops({ [boss]: [[item, 2], ['__no_such_item__', 0.5]], wolf: [[item, 0.5]] });
ok(added.length === 1 && added[0] === `${boss}:${item}`, `注入条目进 BOSS 表（${added.join(',')}），未知物品/非 BOSS 忽略`);
ok(ENEMIES[boss].drops!.length === n0 + 1 && ENEMIES[boss].drops![ENEMIES[boss].drops!.length - 1].chance === 1, '几率夹到 ≤1');
ok(!(ENEMIES.wolf.drops ?? []).some(d => d.item === item) || false, '普通怪不吃钩子');
ok(applyExtraDrops({ [boss]: [[item, 0.3]] }).length === 0, '重复物品不重复添加');
ENEMIES[boss].drops!.pop();
console.log(`extra-drops: ${pass} passed`);
