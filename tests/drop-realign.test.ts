// drop-realign（docs/drop-realign.md，已批准）：来源=方案 B 表、需求≤怪物等级+X、曲线按需求单调、D5 改名兼容、老存档已穿戴保留
import { World } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
import { FLOORS } from '../src/data/world';
import { minFloorLv } from '../src/data/drop-plan';
import { REALIGN_PLAN } from '../src/data/drop-realign-table';
import { realignDen, REALIGN_BANDS, REALIGN_X_NORMAL, REALIGN_X_BOSS, refreshInvItem } from '../src/data/drop-realign';
import { RETIRED_SET_ITEMS } from '../src/data/eg-sets';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } };
// 1) 每件装备的普通掉落来源 = 方案表（E5 已停掉落的旧祖玛/赤月套除外）
ok(Object.keys(REALIGN_PLAN).length === 124, '方案表 124 件');
for (const [item, src] of Object.entries(REALIGN_PLAN)) {
  const got = Object.entries(ENEMIES).filter(([, u]) => (u.drops ?? []).some(d => d.item === item)).map(([id, u]) => `${id}:${Math.round(1 / u.drops!.find(d => d.item === item)!.chance)}`).sort();
  const exp = RETIRED_SET_ITEMS.includes(item) ? [] : src.map(([u, d]) => `${u}:${d}`).sort();
  ok(got.join() === exp.join(), `${ITEMS[item]?.name ?? item} 来源=方案表（实际 ${got.join()}，方案 ${exp.join()}）`);
}
// 2) 需求 ≤ 怪物等级 + X（普通 6 / BOSS 8）；D3 兽人酋长重盔甲/金戒指为用户批准的例外
const D3 = new Set(['orc_chief:armor', 'orc_chief:gold_ring']);
for (const [item, src] of Object.entries(REALIGN_PLAN)) for (const [u] of src) {
  const L = minFloorLv(u), boss = ENEMIES[u]?.tier === 'boss'; if (L === undefined || D3.has(`${u}:${item}`)) continue;
  ok((ITEMS[item].req ?? 0) <= L + (boss ? REALIGN_X_BOSS : REALIGN_X_NORMAL), `${ITEMS[item].name} 需求 ${ITEMS[item].req} ≤ ${ENEMIES[u].name} L${L}+${boss ? 8 : 6}`);
}
// 3) 曲线：段默认/上限/下限分母随需求等级单调不减（爆率单调递减）；普通怪分母 = BOSS×2
for (let i = 1; i < REALIGN_BANDS.length; i++) for (const k of [3, 4, 5]) ok(REALIGN_BANDS[i][k] >= REALIGN_BANDS[i - 1][k], `档 ${i} 列 ${k} 单调`);
let prev = 0; for (let r = 1; r <= 60; r++) { const d = realignDen(r, true); ok(d >= prev, `需求 ${r} 默认分母 ${d} ≥ ${prev}`); prev = d; ok(realignDen(r, false) === 2 * d, `需求 ${r} 普通怪分母 = BOSS×2`);
  ok(realignDen(r, true, 1e9) >= realignDen(r, true, 1), `需求 ${r} 夹在上下限内`); }
ok(realignDen(26, true, 1600) === 107, '魔杖 邪恶钳虫 官方 1/1600 ÷15 = 1/107');
// 4) D1 需求 + D5 改名（id 不变）+ G4 铁靴
const REQ: Record<string, number> = { magic_staff: 26, tao_sword: 26, guyu: 35, helmet: 10, iron_sword: 10, xiaoyao_fan: 35, shihun_staff: 35, pohun: 20, armor: 22, gold_ring: 22 };
for (const [id, r] of Object.entries(REQ)) ok(ITEMS[id].req === r, `${ITEMS[id].name} 需求 ${r}`);
ok(ITEMS.tao_sword.name === '银蛇' && ITEMS.dragon_sword.name === '屠龙', 'D5 显示名 银蛇/屠龙');
ok((ITEMS.boots.equip!.def ?? 0) < 2 && (ITEMS.boots.equip!.hp ?? 0) < 16, 'G4 铁靴低于布鞋15（防2 生命16）');
// 5) 老存档：改名刷新、已穿戴保留不卸下、新穿按新需求
const w0 = new World(() => 0.5, 12, FLOORS, 'taoist');
const worn = { ...w0.makeItem('tao_sword', 'magic'), name: '银蛇剑[精良]', req: 6 }, bagged = { ...w0.makeItem('magic_staff'), req: 6 }, dt = { ...w0.makeItem('dragon_sword'), name: '屠龙刀' };
const sv = w0.toSave(); sv.equip = { weapon: worn } as any; sv.bag = [bagged, dt]; sv.level = 12;
const w = new World(() => 0.5, 12, FLOORS, 'taoist', JSON.parse(JSON.stringify(sv)));
ok(w.equip.weapon?.item === 'tao_sword', '旧档已穿戴银蛇保留（不强制卸下）');
ok(w.equip.weapon?.name === '银蛇[精良]', `旧名刷新为 银蛇[精良]（实际 ${w.equip.weapon?.name}）`);
ok(w.bag.find(b => b.item === 'dragon_sword')?.name === '屠龙', '背包旧名 屠龙刀→屠龙');
const bi = w.bag.findIndex(b => b.item === 'magic_staff'); ok(w.bag[bi].req === 26 && w.equipItem(bi) === '需要等级 26', '新穿魔杖按新需求 26');
console.log(`drop-realign: ${n - fail}/${n} passed`); if (fail) (globalThis as any).process.exit(1);
