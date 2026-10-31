/** M4 新怪：8 个单位存在/立绘、侧线层生成与刷新、掉落、行为、旧存档兼容 */
import { World, BOSS_MECH, MECH_ALIAS } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
import { FLOORS, FLOOR_ORDER, SIDE_FLOORS } from '../src/data/world';
import { REGIONS } from '../src/data/map';
import { ASSETS } from '../src/assets-manifest';
import { M4_OFFICIAL } from '../src/data/m4-official';
const { existsSync } = await import('node:' + 'fs') as any;
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const M4: Record<string, [string, string, 'boss' | 'normal', number]> = {
  boss_yeti_king: ['雪人王', 'yeti_king', 'boss', 24], rake_cat_king: ['钉耙猫王', 'rake_cat_king', 'normal', 24], orc_commander: ['半兽统领', 'orc_commander', 'normal', 24],
  hawk_guard: ['鹰卫', 'hawk_guard', 'normal', 24], evil_lich: ['恶灵尸王', 'evil_lich', 'normal', 25], boss_huangquan: ['黄泉教主', 'huangquan_master', 'boss', 25],
  boss_twinhead_kong: ['双头金刚', 'twinhead_kong', 'boss', 26], boss_twinhead_blood: ['双头血魔', 'twinhead_blood', 'boss', 26],
};
// 1. 存在 + 立绘
for (const [id, [name, art, tier, fl]] of Object.entries(M4)) {
  const d = ENEMIES[id];
  ok(!!d && d.name === name && d.tier === tier && d.art === art && !!ASSETS[art] && existsSync(new URL('../public/' + ASSETS[art], import.meta.url)), `${name}：${tier}，立绘 ${art} 存在`);
  ok(FLOORS[fl].spawns.some(s => s.id === id), `${name} 在第 ${fl} 层（${FLOORS[fl].name}）`);
  ok(M4_OFFICIAL.some(m => m.id === id && m.src.startsWith('https://www.21cq.com/')), `${name} 有资料来源`);
}
// 2. 侧线层：不进主线
ok([24, 25, 26].every(i => SIDE_FLOORS.includes(i) && !FLOOR_ORDER.includes(i) && REGIONS.some(r => r.floors.includes(i) && r.nodes.some(n => n.floor === i))), '24–26 为侧线层，不在 FLOOR_ORDER，有区域入口');
ok(FLOOR_ORDER.join() === '0,1,2,3,4,13,14,15,16,17,18,5,6,7,8,9,10,11,12,19,20,21,22', '主线顺序不变');
// 3. 生成 + 再次进入重新刷新
for (const fl of [24, 25, 26]) {
  const w = new World(seeded(5), 55, FLOORS, 'warrior'); w.loadFloor(fl);
  const ids = new Set(w.alive('enemy').map(u => u.id));
  ok(FLOORS[fl].spawns.every(s => ids.has(s.id)), `进入 ${FLOORS[fl].name} 生成全部怪`);
  for (const u of w.alive('enemy')) w.kill(u);
  ok(w.alive('enemy').length === 0, `${FLOORS[fl].name} 全部可击杀`);
  w.loadFloor(fl); ok(w.alive('enemy').length === FLOORS[fl].spawns.length, `${FLOORS[fl].name} 再次进入重新刷新`);
}
// 4. 掉落：只用已有物品；击杀产出的掉落都在掉落表内
for (const id of Object.keys(M4)) ok(ENEMIES[id].drops!.every(d => !!ITEMS[d.item] && d.chance > 0 && d.chance <= 1), `${M4[id][0]} 掉落物品均已存在`);
{ const seen = new Set<string>();
  for (let s = 1; s <= 30; s++) { const w = new World(seeded(s), 55, FLOORS, 'warrior'); w.loadFloor(26);
    for (const u of w.alive('enemy')) w.kill(u);
    for (const e of w.drainEvents()) if (e.type === 'drop') for (const it of e.items) seen.add(it.item); }
  ok(seen.has('hp_mid') && seen.has('book_page'), `恶魔祭坛 BOSS 掉落药水/书页（${[...seen].join(',')}）`);
}
// 5. 行为：BOSS 复用已有机制；普通怪近战
ok(MECH_ALIAS.boss_huangquan === 'boss_zuma' && MECH_ALIAS.boss_twinhead_kong === 'boss_molong' && MECH_ALIAS.boss_twinhead_blood === 'boss_woma' && ['boss_huangquan', 'boss_twinhead_kong', 'boss_twinhead_blood'].every(i => BOSS_MECH.has(i)) && !BOSS_MECH.has('boss_yeti_king'), '机制映射：黄泉=祖玛 / 金刚=魔龙 / 血魔=沃玛；雪人王通用');
const duel = (fl: number, id: string, sec: number) => {
  const w = new World(seeded(9), 55, FLOORS, 'warrior'); w.loadFloor(fl); const h = w.hero!; h.hp = h.maxHp = 1e9; h.atk = 0;
  const b = w.units.find(u => u.id === id)!; for (const u of w.alive('enemy')) if (u !== b) w.kill(u); w.drainEvents();
  h.x = b.x - 150; b.ai = 'chase'; const ev: any[] = []; for (let t = 0; t < sec; t += 0.05) { w.step(0.05); ev.push(...w.drainEvents()); }
  return { w, b, ev };
};
{ const { w, b, ev } = duel(25, 'boss_huangquan', 40);
  ok(ev.some(e => e.type === 'bossfx' && e.kind === 'fireball') && ev.some(e => e.type === 'bossfx' && e.kind === 'call'), '黄泉教主：火球 + 召唤');
  const mins = w.alive('enemy').filter(u => u !== b); ok(mins.length > 0 && mins.every(u => ['axe_skeleton', 'cave_skel_warrior'].includes(u.id) && !u.exp && !(u.drops?.length)), '黄泉教主召唤骷髅系（无经验掉落）'); }
{ const { ev, b } = duel(26, 'boss_twinhead_kong', 40);
  ok(ev.some(e => e.type === 'bossfx' && e.kind === 'fly') && ev.some(e => e.type === 'attack' && e.source === b.uid), '双头金刚：近战 + 瞬移'); }
{ const w = new World(seeded(9), 55, FLOORS, 'warrior'); w.loadFloor(26); const h = w.hero!; h.hp = h.maxHp = 1e9; h.atk = 0;
  const b = w.units.find(u => u.id === 'boss_twinhead_blood')!; for (const u of w.alive('enemy')) if (u !== b) w.kill(u); w.drainEvents();
  h.x = b.x - 150; b.ai = 'chase'; b.hp = b.maxHp * 0.6; const ev: any[] = []; for (let t = 0; t < 40; t += 0.05) { w.step(0.05); ev.push(...w.drainEvents()); }
  ok(['daze', 'crazy', 'fly', 'spark'].every(k => ev.some(e => e.type === 'bossfx' && e.kind === k)), '双头血魔：发呆→狂暴、瞬移、闪电'); }
for (const [fl, id] of [[24, 'boss_yeti_king'], [24, 'rake_cat_king'], [24, 'orc_commander'], [24, 'hawk_guard'], [25, 'evil_lich']] as [number, string][]) {
  const { ev, b } = duel(fl, id, 15); ok(ev.some(e => e.type === 'attack' && e.source === b.uid), `${b.name} 会近战攻击主角`);
}
// 6. 旧存档兼容：存档结构不变；旧档（主线层）照常读；在新层存档读回层号不变
{ const w = new World(seeded(3), 55, FLOORS, 'warrior'); const keys0 = Object.keys(w.toSave()).sort().join();
  w.loadFloor(25); const sv = JSON.parse(JSON.stringify(w.toSave()));
  ok(Object.keys(sv).sort().join() === keys0, '存档字段不变');
  ok(new World(seeded(3), 55, FLOORS, 'warrior', sv).floorIndex === 25, '存档在骨魔洞五层：读档层号不变');
  const old: any = JSON.parse(JSON.stringify(new World(seeded(3), 50, FLOORS, 'warrior').toSave())); old.floorIndex = 22; delete old.companion;
  ok(new World(seeded(3), 50, FLOORS, 'warrior', old).floorIndex === 22, '旧存档（火龙神殿/无英雄）兼容'); }
console.log(`M4 新怪测试通过（${pass}）`);
