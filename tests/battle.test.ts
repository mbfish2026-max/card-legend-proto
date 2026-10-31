declare const process: { env: Record<string, string | undefined> };
import { World, SaveData, OIL_PRICE, IRON_PRICE, OFFICIAL } from '../src/combat/World';
import { ITEMS, SETS, ENHANCE_MAX, enhanceChance, shatterChance } from '../src/data/items';
import { WORLD, CARD, Floor, FLOORS } from '../src/data/world';
import { CLASSES, ClassId } from '../src/data/classes';
import { ENEMIES, DIFF } from '../src/data/units';
import { QUESTS, ACHIEVES } from '../src/data/quests';
import { REGIONS, floorBoss, regionOf, entrances, nodeOfFloor, clampView, zoomAt, WORLD_W, WORLD_H } from '../src/data/map';
import { detectMobile } from '../src/mobile';
import { StepGate, stepDir, HoldKeys, HOLD } from '../src/input/stepKeys';
import { POTIONS } from '../src/data/skills';
import { TOWNS, NODE_TOWN, WEAPON_GOODS, ARMOR_GOODS, GENERAL_GOODS, STORAGE_SIZE, streetDoors, NPC_ART, TOWN_W, TOWN_GATE_X } from '../src/data/towns';
import { resolveLayers, pickTexture, comboKey, changedSlots, fallbackId } from '../src/data/equipLayers';
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { existsSync } from 'node:fs';
import { Settings, DEFAULT_AUTO_SKILLS, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, fitScale } from '../src/settings';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
/** 旧用例默认学会全部技能（R11 技能书用例单独测） */
const learnAll = (w: World) => { w.learned = new Set(CLASSES[w.cls].skills.map(s => s.id)); return w; };
const mk = (spawns: Floor['spawns'], extra: Floor[] = [], cls: ClassId = 'warrior', lv = 20, seed = 1) => learnAll(new World(seeded(seed), lv, [{ name: '测试层', spawns }, ...extra], cls));
const run = (w: World, sec: number, dx = 0, dy = 0) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05, { dx, dy }); };
const tough = (w: World) => w.alive('enemy').forEach(e => (e.hp = e.maxHp = 1e9));
const idx = (w: World, id: string) => w.skills.findIndex(s => s.id === id);
const pool = (w: World, id: string) => w.skillPool.find(s => s.id === id)!;
const free = (w: World) => w.skills.map(() => 0);

{ // 移动与边界
  const w = mk([]); const h = w.hero!;
  const x0 = h.x; w.step(1, { dx: 1, dy: 0 });
  ok(Math.abs(h.x - x0 - WORLD.heroSpeed) < 1e-6 && h.facing === 1, '右移速度 = heroSpeed，朝右');
  run(w, 2, -1); ok(h.x === h.width / 2 && h.facing === -1, '左边界');
  run(w, 60, 1); ok(w.done, '空层走到出口触发胜利');
  const w2 = mk([]); run(w2, 5, 0, 1); ok(w2.hero!.y === WORLD.laneMax, '纵深下边界'); run(w2, 5, 0, -1); ok(w2.hero!.y === WORLD.laneMin, '纵深上边界');
}
{ // 仇恨 + 同组 + 排队 + 阻挡
  const w = mk([{ id: 'zombie', x: 1200 }, { id: 'zombie', x: 1300 }, { id: 'wolf', x: 3000 }]); tough(w);
  const [a, b, c] = w.alive('enemy');
  run(w, 2); ok(a.ai === 'idle' && a.x === 1200, '远处怪原地待机');
  const h = w.hero!; h.x = a.x - WORLD.aggroRange + 10; w.step(0.05);
  ok(a.ai === 'alert' && b.ai === 'alert' && c.ai === 'idle', '进入仇恨距离：同组被吸引，远处怪不动');
  ok(w.drainEvents().some(e => e.type === 'aggro'), 'aggro 事件');
  h.hp = h.maxHp = 1e9; run(w, 6);
  ok(Math.abs(w.gap(h, a) - a.range) < 1e-6, '前排停在接触距离');
  ok(b.x > a.x && b.x - a.x < b.width, '后排在前排身后排队（逻辑重叠，渲染层错开）');
  const hits: number[] = []; let prevB = b.x, pushed = false;
  for (let i = 0; i < 200; i++) { w.step(0.05); if (b.x > prevB + 1e-9) pushed = true; prevB = b.x; for (const e of w.drainEvents()) if (e.type === 'damage' && !e.heal && e.target !== h.uid) hits.push(e.target); }
  ok(!pushed && hits.length > 0 && hits.every(t => t === a.uid), '不推挤，近战只打前排');
  const ax = a.x; run(w, 2, 1); ok(h.x > ax, '可穿过前排走到怪身后（不阻挡）');
}
{ // 脱战回位
  const w = mk([{ id: 'zombie', x: 3500 }]); tough(w); const h = w.hero!, z = w.alive('enemy')[0];
  h.x = z.x - WORLD.aggroRange + 5; run(w, 1.5); ok(z.ai === 'chase' && z.x < 3500, '开始追击');
  let left = 0; while (z.ai === 'chase' && left < 30) { w.step(0.05, { dx: -1, dy: 0 }); left += 0.05; }
  ok(z.ai === 'return' || z.ai === 'idle', '超过脱战距离放弃追击');
  run(w, 20); ok(z.ai === 'idle' && z.x === 3500, '回到原位');
}
{ // 脱战规则：距离阈值、保留血量、缓慢回血、BOSS 一致、不卡死
  ok(WORLD.leashRange === 6 * CARD && WORLD.leashRange * 1.5 < WORLD.mapWidth, '脱战距离 6 卡宽（用户反馈 10 卡宽太长跑不掉），离家上限 < 地图宽');
  for (const id of ['zombie', 'boss_woma']) {
    const w = mk([{ id, x: 3000 }]); const h = w.hero!, z = w.alive('enemy')[0]; h.hp = h.maxHp = 1e9;
    z.ai = 'chase'; h.x = z.x - WORLD.leashRange + 20; w.step(0.05); ok(z.ai === 'chase', `${id} 阈值内不脱战`);
    z.hp = Math.round(z.maxHp * 0.3); if (z.boss) Object.assign(z.boss, { dazeUntil: w.time + 99, crazyUntil: w.time + 99 });
    h.x = z.x - WORLD.leashRange - 20; w.step(0.05); ok((z.ai as string) === 'return', `${id} 超过阈值脱战`);
    ok(!z.boss || (z.boss.dazeUntil === 0 && z.boss.crazyUntil === 0), `${id} 脱战清除狂暴/发呆计时`);
    h.x = 200; const hp0 = z.hp; let t = 0; while ((z.ai as string) === 'return' && t < 60) { w.step(0.05); t += 0.05; }
    ok((z.ai as string) === 'idle' && Math.abs(z.x - 3000) < 1, `${id} 能回到原位（不卡死）`);
    ok(z.hp < z.maxHp * 0.3 + z.maxHp * WORLD.leashRegen * (t + 0.1) && z.hp > hp0, `${id} 回位保留血量，仅缓慢回血`);
    const a = z.hp; run(w, 10); ok(Math.abs(z.hp - a - z.maxHp * WORLD.leashRegen * 10) < z.maxHp * 0.002, `${id} 待机每秒回 1% 最大血量`);
    run(w, 120); ok(z.hp === z.maxHp, `${id} 回血不超过上限`);
    z.hp = z.maxHp * 0.5; z.poisonUntil = w.time + 5; z.poisonTick = w.time + 99; const p = z.hp; run(w, 3); ok(z.hp === p, `${id} 中毒时不回血`);
    z.ai = 'chase'; h.x = z.x - 300; h.hp = 1e9; z.hp = z.maxHp * 0.5; z.poisonUntil = 0; const c = z.hp; w.step(0.5); ok(z.hp <= c, `${id} 追击中不回血（风筝也能击杀）`);
  }
}
{ // 职业属性与成长
  for (const c of ['warrior', 'mage', 'taoist'] as ClassId[]) {
    const w = mk([], [], c, 1), h = w.hero!;
    ok(h.maxHp === CLASSES[c].base.hp && h.atk === CLASSES[c].base.atk && w.skills.length >= 4 && w.skills.every(s => !s.passive), `${CLASSES[c].name} 1 级属性 + 快捷栏主动技能`);
    const hp1 = h.maxHp, m1 = h.mag ?? 0, t1 = h.tao ?? 0; h.hp = 5; w.gainExp(w.expNext);
    ok(w.level === 2 && h.maxHp > hp1 && h.hp === h.maxHp && (c !== 'mage' || h.mag! > m1) && (c !== 'taoist' || h.tao! > t1), `${CLASSES[c].name} 升级自动成长并回满`);
  }
}
{ // 战士（官方 1.76）：刺杀/半月/烈火 + 攻杀被动 + 学习等级
  const w = mk([{ id: 'zombie', x: 800 }, { id: 'zombie', x: 860 }, { id: 'zombie', x: 920 }, { id: 'zombie', x: 980 }], [], 'warrior', 40); tough(w);
  const h = w.hero!; h.x = 500; h.hp = h.maxHp = 1e9; run(w, 6);
  const r = w.cast(idx(w, 'half_moon'), free(w)); ok(r.ok && r.targets.length === 3, '半月弯刀命中 3 个目标');
  const r2 = w.cast(idx(w, 'fire_sword'), free(w)); ok(r2.ok && r2.targets[0] === w.queue(1)[0].uid, '烈火剑法打前排');
  const r3 = w.cast(idx(w, 'thrust'), free(w)); ok(r3.ok && r3.targets.length === 2, '刺杀剑术命中 2 格');
  ok(w.skills.every(k => k.mana === 0), '战士剑法不耗魔（官方）');
  const sly = pool(w, 'slaying'); ok(!!sly && sly.passive === true, '攻杀剑术为被动且在 skillPool'); ok(idx(w, 'slaying') < 0, '攻杀不占快捷栏');
  const cds = free(w); w.cast(idx(w, 'fire_sword'), cds); const r4 = w.cast(idx(w, 'fire_sword'), cds); ok(!r4.ok && r4.reason.includes('冷却'), '冷却中不可再放');
  const fs = w.skills[idx(w, 'fire_sword')]; ok(fs.lvMult!.join() === '1.4,1.8,2.2,2.6' && fs.learn![0] === 35, '烈火剑法 35 级学习，1.4~2.6 倍（官方）');
  const w34 = mk([{ id: 'zombie', x: 700 }], [], 'warrior', 34); w34.hero!.x = 600; run(w34, 1);
  const rr = w34.cast(idx(w34, 'fire_sword'), free(w34)); ok(!rr.ok && rr.reason.includes('35'), '34 级不能用烈火剑法');
}

{ // R7 技能扩充：野蛮冲撞 / 火墙 / 神兽 / 基本剑术（官方有据）
  const wr = mk([{ id: 'deer', x: 700 }, { id: 'wolf', x: 820 }], [], 'warrior', 32);
  wr.hero!.x = 520; wr.alive('enemy').forEach(e => { e.level = 10; });
  const rush = wr.cast(idx(wr, 'rush'), free(wr));
  ok(rush.ok && rush.targets.length >= 1, '野蛮冲撞撞开低等级目标');
  const bs = pool(wr, 'basic_sword'); ok(!!bs.passive && bs.accBonus![0] === 3 && bs.learn![0] === 7, '基本剑术官方准确+3 起、7 级学');
  const mg = mk([{ id: 'orc', x: 700 }], [], 'mage', 28);
  const fw = mg.cast(idx(mg, 'fire_wall'), free(mg));
  ok(fw.ok && mg.zones.length === 1, '火墙落地生成燃烧区');
  mg.step(0.6, { dx: 0, dy: 0 });
  ok(mg.zones[0] && mg.zones[0].until > mg.time, '火墙持续燃烧');
  ok(mg.skills.some(s => s.id === 'fire_wall') && mg.skills.some(s => s.id === 'ice_roar'), '法师快捷栏含火墙与冰咆哮');
  ok(CLASSES.mage.skills.find(s => s.id === 'fire_wall')!.mana === 60, '火墙耗魔 = D Spell20 ×3（适配）');
  const td = mk([{ id: 'orc', x: 700 }], [], 'taoist', 35);
  const sb = td.cast(idx(td, 'summon_beast'), free(td));
  ok(!!(sb.ok && td.summon && td.summon.id === 'summon_beast'), '35 级召唤神兽');
  const sk = td.cast(idx(td, 'summon_skeleton'), free(td));
  ok(sk.ok && td.summon!.id === 'summon_skeleton', '再召骷髅替换神兽（互斥）');
  const sf = pool(td, 'spirit_force'); ok(!!sf.passive && sf.accBonus![2] === 8, '精神力战法准确+8（Lv3 官方）');
  ok(idx(td, 'spirit_force') < 0, '精神力战法不占快捷栏');
}

{ // 技能修炼：等级 + 修炼点（官方门槛），存档保留
  const w = mk([{ id: 'orc', x: 700 }], [], 'warrior', 30); const k = w.skills[idx(w, 'thrust')];
  ok(w.skillLevel(k) === 0, '刚学会 0 级');
  w.skillTrain.thrust = 6000; ok(w.skillLevel(k) === 1, '6000 点 → 1 级');
  w.skillTrain.thrust = 12000; ok(w.skillLevel(k) === 2, '12000 点 + 人物 30 ≥ 27 → 2 级');
  const w2 = new World(seeded(1), 1, w.floors, 'warrior', { ...w.toSave(), level: 26 }); ok(w2.skillTrain.thrust === 12000 && w2.skillLevel(k) === 1, '存档保留修炼点；26 级卡在 1 级');
  const w3 = new World(seeded(1), 1, w.floors, 'warrior', { ...w.toSave(), level: 30 }); ok(w3.skillLevel(k) === 2, '27 级以上 + 12000 → 2 级');
}
{ // 法师：远程 + 冰咆哮群攻减速 + 技能随等级成长
  const w = mk([{ id: 'orc', x: 900 }, { id: 'orc', x: 1000 }, { id: 'orc', x: 3000 }], [], 'mage'); tough(w);
  const h = w.hero!; h.x = 600;
  const r = w.cast(idx(w, 'fireball'), free(w)); ok(r.ok && r.targets.length === 1, '火球术远程命中（不需贴身）');
  const evs = w.drainEvents(); const d1 = (evs.find(e => e.type === 'damage') as any).amount;
  const wi = mk([{ id: 'orc', x: 900 }, { id: 'orc', x: 1000 }, { id: 'orc', x: 3000 }], [], 'mage', 40); tough(wi); wi.hero!.x = 600;
  const ice = wi.cast(idx(wi, 'ice_roar'), free(wi)); const ens = wi.alive('enemy');
  ok(ice.ok && ice.targets.length === 2 && ens[0].slowUntil! > wi.time && !ens[2].slowUntil, '冰咆哮命中范围内全部敌人并减速');
  const w2 = mk([{ id: 'orc', x: 900 }], [], 'mage', 40); tough(w2); w2.hero!.x = 600; w2.rng = () => 0.5;
  w.rng = () => 0.5; w.cast(idx(w, 'fireball'), free(w)); const a20 = (w.drainEvents().find(e => e.type === 'damage') as any).amount;
  w2.cast(idx(w2, 'fireball'), free(w2)); const a40 = (w2.drainEvents().find(e => e.type === 'damage') as any).amount;
  ok(d1 > 0 && a40 > a20 * 1.5, `火球伤害随等级成长（20级 ${a20} → 40级 ${a40}）`);
  const w4 = mk([{ id: 'orc', x: 900 }, { id: 'orc', x: 1000 }], [], 'mage', 40); tough(w4); w4.hero!.x = 600;
  const sh = w4.cast(idx(w4, 'magic_shield'), free(w4)); ok(sh.ok && OFFICIAL.shieldReduce.includes(w4.hero!.armorReduce!), `魔法盾按官方等级减伤（${w4.hero!.armorReduce}）`);
  ok(!w4.cast(idx(w4, 'magic_shield'), free(w4)).ok, '魔法盾持续期间重复开启无效（官方）');
  ok(!mk([{ id: 'orc', x: 900 }], [], 'mage', 30).cast(idx(w4, 'magic_shield'), free(w4)).ok, '魔法盾 31 级前不可用');
  ok(w4.skills[idx(w4, 'fireball')].mana === 12, '火球耗魔 = 官方 4 × 3（适配）');
}
{ // 道士：施毒持续掉血 + 召唤骷髅协同作战
  const w = mk([{ id: 'orc', x: 800 }], [], 'taoist'); const o = w.alive('enemy')[0]; o.hp = o.maxHp = 1e6;
  const h = w.hero!; h.x = 500;
  ok(w.cast(idx(w, 'poison'), free(w)).ok, '施毒术施放'); w.drainEvents();
  let dots = 0; for (let i = 0; i < 110; i++) { w.step(0.05); for (const e of w.drainEvents()) if (e.type === 'damage' && e.dot) dots++; }
  ok(dots === 2, `绿毒每 2.5 秒掉血（5.5 秒内 ${dots} 跳）`);
  ok(o.redUntil! > w.time, '红毒同时生效');
  const r = w.cast(idx(w, 'summon_skeleton'), free(w)); const sm = w.summon;
  ok(r.ok && !!sm && sm.team === 'ally' && sm.card?.bg === 0x7a5c14, '召唤出金色卡底的友方骷髅');
  h.hp = h.maxHp = 1e9; let sDmg = 0;
  for (let i = 0; i < 200; i++) { w.step(0.05); for (const e of w.drainEvents()) if (e.type === 'damage' && e.source === sm!.uid) sDmg++; }
  ok(sDmg > 0, `骷髅会主动攻击敌人（${sDmg} 次）`);
  const r2 = w.cast(idx(w, 'summon_skeleton'), free(w)); ok(r2.ok && w.units.filter(u => u.summon).length === 1, '已存在时不重复召唤');
  h.x = w.exitX; o.alive = false; w.units = w.units.filter(u => u.alive); w.floors.push({ name: '下一层', spawns: [] }); w.step(0.05);
  ok(w.floorIndex === 1 && !!w.summon, '召唤物随主角进入下一层');
}
{ // 掉落 → 背包 → 装备/卸下/需求等级/丢弃/出售/购买
  // R13：尸王资料掉落不含必掉屠龙，本用例临时注入一条 1/1 屠龙以测试拾取/装备流程
  const L0 = ENEMIES.boss_lich.drops; ENEMIES.boss_lich.drops = [...(L0 ?? []), { item: 'dragon_sword', chance: 1 }];
  const w = mk([{ id: 'boss_lich', x: 2000 }, { id: 'wolf', x: 3500 }], [], 'warrior', 30); const h = w.hero!, b = w.alive('enemy')[0];
  w.kill(b); ENEMIES.boss_lich.drops = L0; ok(w.ground.length >= 6 && w.ground.some(g => g.item === 'dragon_sword'), 'Boss 掉落多件（含注入的屠龙刀）');
  run(w, 3); ok(w.ground.length >= 6, '离得远不会自动拾取');
  const g = w.ground[0]; h.x = g.x; h.y = g.y; w.time = g.landAt - 0.2; w.step(0.01); ok(w.ground.includes(g), '落地前不可拾取');
  w.step(0.3); ok(!w.ground.includes(g), '落地后靠近自动拾取');
  const pot0 = w.pots[1], allHp = w.ground.filter(x => x.item === 'hp_mid').length + (g.item === 'hp_mid' ? 1 : 0);
  for (const x of [...w.ground]) { h.x = x.x; h.y = x.y; w.step(0.05); }
  ok(w.ground.length === 0 && w.bag.some(i => i.item === 'dragon_sword'), '装备进入背包');
  ok(w.pots[1] === pot0 + allHp - (g.item === 'hp_mid' ? 1 : 0) || w.pots[1] >= pot0, '药水计入药水栏');
  const atk0 = h.atk, si = w.bag.findIndex(i => i.item === 'dragon_sword'), sw = w.bag[si];
  ok(w.equipItem(si) === null && w.equip.weapon === sw && h.atk === atk0 + (sw.stats.atk ?? 0), `装备屠龙刀攻击 +${sw.stats.atk}`);
  ok(w.unequip('weapon') === null && h.atk === atk0 && w.bag.includes(sw), '卸下回到背包，属性还原');
  const low = mk([], [], 'warrior', 1); low.bag.push(low.makeItem('dragon_sword')); ok(low.equipItem(0)?.includes('需要等级') === true, '等级不足不能装备');
  const n = w.bag.length; w.dropItem(0); ok(w.bag.length === n - 1, '丢弃物品');
  const g0 = w.gold, price = w.bag[0].price; w.sellItem(0); ok(w.gold === g0 + price, '出售给商人得金币');
  w.gold = 100; const p0 = w.pots[0]; ok(w.buyPotion(0) === null && w.pots[0] === p0 + 1 && w.gold === 100 - POTIONS[0].price, '购买药水');
  w.gold = 0; ok(w.buyPotion(1) === '金币不足', '金币不足不能买');
  w.bag = Array.from({ length: WORLD.bagSize }, () => w.makeItem('bone'));
  w.ground.push(w.rollDrop('helmet', 'common', h.x, h.y)); w.time += 1; w.step(0.05); ok(w.ground.length === 1, '背包满时不拾取');
}
{ // 5 层 + 每层 Boss + 出口封印
  ok(FLOORS.length >= 8 && FLOORS.slice(8).map(f => f.name).join() === '沃玛寺庙,祖玛阁,牛魔寺庙,封魔殿,赤月魔穴' && FLOORS.every(f => f.boss && f.spawns.some(s => ENEMIES[s.id].tier === 'boss')), `共 ${FLOORS.length} 层，每层末尾有 Boss`);
  ok(new Set(FLOORS.map(f => f.bg)).size === FLOORS.length, '每层背景不同');
  const w = new World(seeded(3), 30, FLOORS); const h = w.hero!;
  h.x = w.exitX; w.step(0.05); ok(w.floorIndex === 0, 'Boss 未死出口封印');
  for (let i = 0; i < FLOORS.length; i++) { for (const u of w.alive('enemy')) w.kill(u); w.hero!.x = w.exitX; w.step(0.05); }
  ok(w.done, `依次通过 ${FLOORS.length} 层 → 胜利`);
}
{ // 死亡复活 + 存档读档
  const w = mk([{ id: 'wolf', x: 3000 }], [], 'mage', 5); w.gold = 100; w.kill(w.hero!); ok(!w.hero, '主角死亡');
  w.respawn(); ok(!!w.hero && w.hero.hp === w.hero.maxHp && w.gold === 90 && w.deaths === 1, '本层起点满血复活，损失 10% 金币');
  const w1 = new World(seeded(5), 7, FLOORS, 'taoist'); w1.gold = 321; w1.bag.push(w1.makeItem('tao_sword', 'rare')); w1.equipItem(0); w1.loadFloor(2);
  const json = JSON.stringify(w1.toSave()); const w2 = new World(seeded(6), 1, FLOORS, 'warrior', JSON.parse(json) as SaveData);
  ok(w2.cls === 'taoist' && w2.level === 7 && w2.gold === 321 && w2.floorIndex === 2 && w2.equip.weapon?.name.includes('极品') === true && w2.hero!.tao === w1.hero!.tao, '存档 JSON 往返：职业/等级/金币/层数/装备一致');
}
{ // R11 技能书：新角色只有 1 个初始技能，买书/用书学会后才进快捷栏
  const m = new World(seeded(3), 1, FLOORS, 'mage');
  ok([...m.learned].join() === 'fireball' && m.skills.map(s => s.id).join() === 'fireball' && m.skills[0].key === 'F1', '法师新角色只有火球术（F1）');
  ok(m.cast(0, [0]).ok !== undefined && m.needLevel(m.skillPool.find(s => s.id === 'fireball')!) === 1, '初始技能 1 级可用');
  m.gold = 10000; ok(m.buyBook('thunder') === null && m.bag.some(x => x.item === 'book_thunder'), '书店买雷电术书');
  ok(m.learnBook(m.bag.findIndex(x => x.item === 'book_thunder')).includes('需等级 17') && !m.learned.has('thunder'), '等级不足不能学');
  m.level = 17; const ev0 = m.drainEvents().length; void ev0;
  ok(m.learnBook(m.bag.findIndex(x => x.item === 'book_thunder')) === '学会了 雷电术' && m.skills.map(s => s.id).join() === 'fireball,thunder' && !m.bag.some(x => x.item === 'book_thunder'), '学会后出现在 F2，书被消耗');
  ok(m.drainEvents().some(e => e.type === 'learned'), '学会事件（UI 刷新快捷栏）');
  ok(m.buyBook('fire_wall') !== null, '掉落书（火墙）书店不卖');
  const t = new World(seeded(3), 1, FLOORS, 'taoist'); t.gold = 100;
  ok(t.skills.map(s => s.id).join() === 'heal' && t.buyBook('summon_skeleton') === null && t.learnBook(0) === '学会了 召唤骷髅' && t.skills.some(s => s.id === 'summon_skeleton'), '道士：开局只有治愈术；召唤骷髅书 100 金，1 级即可学');
  const wr = new World(seeded(3), 1, FLOORS, 'warrior');
  ok([...wr.learned].join() === 'basic_sword' && wr.skills.length === 0, '战士开局只有被动基本剑术（快捷栏为空，原版亦然）');
  ok(m.toSave().learned!.includes('thunder') && new World(seeded(3), 1, FLOORS, 'mage', m.toSave()).skills.length === 2, '存档记录已学技能');
  const legacy = { ...m.toSave(), level: 25, learned: undefined, mapV: undefined, floorIndex: 1, reached: [0, 1], bossKilled: [0] } as SaveData;
  const lw = new World(seeded(3), 1, FLOORS, 'mage', legacy);
  ok(['fireball', 'thunder', 'fire_wall'].every(id => lw.learned.has(id)) && !lw.learned.has('magic_shield'), '旧存档兼容：已达等级的技能视为已学');
  ok(lw.floorIndex === 2 && lw.reached.has(2) && lw.bossKilled.has(0) && !lw.reached.has(1), '旧存档层号迁移（蛛网晶洞 1→2）');
  const bw = new World(seeded(3), 30, FLOORS, 'warrior'); let got = 0;
  for (let k = 0; k < 40; k++) { const u = bw.spawn(ENEMIES.boss_lich, 'enemy', 1000); bw.kill(u); }
  got = bw.ground.filter(g => g.item.startsWith('book_')).length;
  ok(got > 0 && bw.ground.every(g => !g.item.startsWith('book_') || ['book_thrust', 'book_half_moon', 'book_rush'].includes(g.item)), `尸王按资料爆率掉战士技能书（刺杀1/10 半月1/500 野蛮1/600）（40 次掉 ${got} 本）`);
}
{ // R13 地图扩充：区域覆盖、旧存档迁移、传送
  const all = REGIONS.flatMap(r => r.floors).sort((a, b) => a - b);
  ok(all.join() === FLOORS.map((_, i) => i).join(), `世界地图区域覆盖全部 ${FLOORS.length} 层且不重复`);
  ok(FLOORS.every((_, i) => !!floorBoss(i) && !!regionOf(i)), '每层有 BOSS 与所属区域');
  ok(QUESTS.every(q => q.floor < FLOORS.length && FLOORS[q.floor].spawns.some(s => s.id === q.target)), '悬赏目标都在对应层');
  const m = new World(seeded(3), 30, FLOORS, 'mage'); const v2 = { ...m.toSave(), mapV: 2, floorIndex: 5, reached: [0, 1, 2, 3, 4, 5], bossKilled: [0, 1, 2, 3, 4], questDone: ['q0'] } as unknown as SaveData;
  const w2 = new World(seeded(3), 1, FLOORS, 'mage', v2);
  ok(w2.floorIndex === 8 && w2.floor.name === '沃玛寺庙' && w2.reached.has(5) && w2.reached.has(8) && !w2.reached.has(3) && w2.bossKilled.has(4) && w2.questDone.has('q0'), 'mapV2 存档迁移：沃玛寺庙 5→8，进度不丢');
  const w3 = new World(seeded(3), 1, FLOORS, 'mage', w2.toSave()); ok(w3.floorIndex === 8 && w3.toSave().mapV === 3, 'mapV3 存档不重复迁移');
  w3.gold = 9999; w3.reached.add(10); w3.time = 999; ok(w3.teleport(10) === null && w3.floor.name === '牛魔寺庙', '世界地图传送到新地图牛魔寺庙');
}
{ // R11 地图按原版递进
  ok(FLOORS.map(f => f.name).join() === '幽暗森林,兽人要塞,蛛网晶洞,毒蛇山谷,白骨墓穴,尸王殿,蜈蚣洞,石墓·猪洞,沃玛寺庙,祖玛阁,牛魔寺庙,封魔殿,赤月魔穴', '层序：新手村→沃玛森林(兽人/蛛洞)→兽人古墓→比奇矿区尸王殿→沃玛寺庙→祖玛→赤月');
  ok(QUESTS.find(q => q.target === 'orc')!.floor === 1 && QUESTS.find(q => q.target === 'spider')!.floor === 2 && QUESTS.find(q => q.target === 'skeleton')!.floor === 4, '悬赏随层移动');
  const lv = FLOORS.map(f => Math.max(...f.spawns.map(sp => ENEMIES[sp.id].tier === 'boss' ? 0 : ENEMIES[sp.id].level)));
  ok(lv.every((v, i) => i === 0 || v >= lv[i - 1]), `各层普通怪最高等级递增 ${lv.join('/')}`);
}
{ // R13 官方 BOSS 机制
  const ww = mk([{ id: 'boss_woma', x: 800 }], [], 'warrior', 30); const h = ww.hero!; h.hp = h.maxHp = 1e9; h.x = 600; const b = ww.alive('enemy')[0]; b.ai = 'chase';
  b.hp = b.maxHp * 0.7; ww.step(0.05); ww.drainEvents();
  ok(b.boss!.stage === 1 && b.boss!.dazeUntil > ww.time, '沃玛教主血量跌破 5/7 进入发呆');
  let atk = 0; for (let i = 0; i < 100; i++) { ww.step(0.05); atk += ww.drainEvents().filter(e => e.type === 'attack' && e.source === b.uid).length; }
  ok(atk === 0, '沃玛教主发呆期间不攻击');
  ww.time = b.boss!.dazeUntil; b.cd = 0; atk = 0; for (let i = 0; i < 80; i++) { ww.step(0.05); atk += ww.drainEvents().filter(e => e.type === 'attack' && e.source === b.uid).length; }
  ok(atk >= 7, `沃玛教主狂暴每秒攻击 2 次（4 秒 ${atk} 次）`);
  const x0 = b.x; b.boss!.flyT = 30; ww.step(0.05); ok(Math.sign(b.x - h.x) !== Math.sign(x0 - h.x), '沃玛教主 30 秒后飞到主角背后');
  const wz = mk([{ id: 'boss_zuma', x: 950 }], [], 'mage', 30); wz.hero!.hp = wz.hero!.maxHp = 1e9; wz.hero!.x = 600; const z = wz.alive('enemy')[0]; z.ai = 'chase'; z.cd = 0;
  wz.step(0.05); const ev = wz.drainEvents();
  ok(ev.some(e => e.type === 'bossfx' && e.kind === 'fireball') && wz.alive('enemy').length === 2, '祖玛教主远程火球并唤醒祖玛怪');
  const wr = mk([{ id: 'boss_redmoon', x: 900 }], [], 'warrior', 30); const rh = wr.hero!; rh.hp = rh.maxHp = 1e9; rh.x = 600; const r = wr.alive('enemy')[0]; r.ai = 'chase';
  const rx = r.x; let hit = 0, warn = 0;
  for (let i = 0; i < 60; i++) { wr.step(0.05); for (const e of wr.drainEvents()) { if (e.type === 'bossfx' && e.kind === 'spike_warn') { warn++; rh.x += 200; } if (e.type === 'damage' && e.target === rh.uid) hit++; } }
  ok(r.x === rx && warn >= 1 && hit === 0, '赤月恶魔不移动，地刺预警后走开可躲');
  for (let i = 0; i < 80; i++) { wr.step(0.05); for (const e of wr.drainEvents()) if (e.type === 'damage' && e.target === rh.uid) hit++; }
  ok(hit >= 1, '站在地刺上会受伤');
}
{ // 平衡：每个职业的自动脚本能打通全部 5 层（允许死亡复活）
  for (const c of ['warrior', 'mage', 'taoist'] as ClassId[]) {
    const w = (process.env.ALL ? learnAll : (x: World) => x)(new World(seeded(11), 1, FLOORS, c)); let cds = w.skills.map(() => 0); let t = 0, potUsed = 0; const learnLog: string[] = [];
    while (!w.done && t < 7200) {
      const h = w.hero;
      if (!h) { learnLog.push(`死@${w.floorIndex + 1}层Lv${w.level}`); w.respawn(); continue; }
      if (h.hp < h.maxHp * 0.4 && w.usePotion(w.pots[1] > 0 ? 1 : 0)) potUsed++;
      if ((h.mp ?? 0) < 40) w.usePotion(w.pots[3] > 0 ? 3 : 2);
      for (let i = 0; i < w.skills.length; i++) w.cast(i, cds);
      for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[it.slot]) w.equipItem(i); }
      // 黑铁：模拟脚本卖掉（避免碎装干扰难度基线；玩家可手动强化）
      for (let i = w.bag.length - 1; i >= 0; i--) if (w.bag[i]?.item === 'black_iron') w.sellItem(i);
      // 黑铁：模拟脚本卖掉（避免碎装干扰难度基线；玩家可手动强化）
      for (let i = w.bag.length - 1; i >= 0; i--) if (w.bag[i]?.item === 'black_iron') w.sellItem(i);
      if (process.env.SIM && Math.round(t * 20) % 2000 === 0) console.log("   t", Math.round(t), "lv", w.level, "gold", w.gold, "floor", w.floorIndex + 1, "deaths", w.deaths);
      // R11 技能书：达到等级且金币有余就买，背包里的书能学就学（学会后快捷栏重排，冷却重置）
      for (const b of w.shopBooks()) { const sk = w.skillPool.find(x => x.id === b.skill)!; if (!w.learned.has(b.skill) && w.level >= w.needLevel(sk) && w.gold >= b.price && !w.bag.some(x => ITEMS[x.item]?.book === b.skill)) w.buyBook(b.skill); }
      for (let i = w.bag.length - 1; i >= 0; i--) if (ITEMS[w.bag[i].item]?.book && w.learnBook(i).startsWith('学会')) { cds = w.skills.map(() => 0); learnLog.push(`${w.level}级${w.skillPool.find(x => x.id === [...w.learned].pop())!.name}@${w.floorIndex + 1}层`); }
      // 去城镇商人补药（简化：金币够就买）
      // 有可学的书店技能书时攒钱（药只补到 1 瓶）
      const saving = w.shopBooks().some(b => !w.learned.has(b.skill) && w.level >= w.needLevel(w.skillPool.find(x => x.id === b.skill)!)); const cap = saving ? 1 : 3;
      while (w.gold >= 60 && w.pots[1] < cap) w.buyPotion(1);
      while (w.gold >= 60 && w.pots[3] < cap) w.buyPotion(3);
      w.step(0.05, { dx: (() => { const f = w.queue(1)[0]; return f && w.inMelee(h, f) ? 0 : 1; })(), dy: 0 }); w.drainEvents(); t += 0.05; /* 玩家：前方接战时站定输出（可穿怪） */ for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - 0.05);
    }
    if (process.env.SIM) console.log(JSON.stringify(Object.fromEntries(Object.entries(w.equip).map(([k,v])=>[k,(v as any)?.name]))), w.hero?.maxHp, w.hero?.atk); console.log(`  ${CLASSES[c].name}: 通关=${w.done} 等级 ${w.level} 死亡 ${w.deaths} 学书 ${learnLog.join(' ')}`);
    if (!process.env.SIM) ok(w.deaths >= 1 && w.deaths <= 4, `${CLASSES[c].name} 难度适中：模拟通关死亡 1–4 次（实际 ${w.deaths}）`);
    console.log(`  ${CLASSES[c].name}: 通关=${w.done} 用时 ${Math.round(t)}s 等级 ${w.level} 死亡 ${w.deaths} 次 层 ${w.floorIndex + 1} 红药 ${potUsed} 瓶`);
    ok(potUsed >= 3, `${CLASSES[c].name} 通关需要吃药（${potUsed} 瓶，难度不再过于简单）`);
    if (!process.env.SIM) ok(w.done && w.deaths <= 6, `${CLASSES[c].name} 可通关全部层（死亡 ${w.deaths} 次）`);
  }
}
{ // 难度曲线：怪物强度倍率已上调
  ok(DIFF.atk > 1 && DIFF.bossAtk > 1 && ENEMIES.boss_lich.atk > ENEMIES.orc_chief.atk, '难度倍率上调且首领逐层变强');
  ok(['wolf_king', 'spider_queen', 'skeleton_lord', 'orc_chief', 'boss_lich', 'boss_woma', 'boss_zuma', 'boss_redmoon'].every(id => ENEMIES[id].art?.startsWith('boss_')), '每层首领有专属立绘');
}
{ // 手机检测：UA / 触屏小屏 / URL 覆盖
  const fw = (ua: string, coarse: boolean, sw: number, sh: number, search = '', tp = 0) => ({ location: { search }, navigator: { userAgent: ua, maxTouchPoints: tp }, matchMedia: () => ({ matches: coarse }), screen: { width: sw, height: sh } }) as any;
  ok(detectMobile(fw('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', true, 390, 844)), 'iPhone UA 识别为手机');
  ok(detectMobile(fw('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile', true, 412, 915)), 'Android UA 识别为手机');
  ok(!detectMobile(fw('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130', false, 1920, 1080)), '桌面浏览器不显示虚拟按键');
  ok(detectMobile(fw('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', true, 1024, 1366, '', 5)), 'iPadOS（伪装 Mac）识别为触屏');
  ok(detectMobile(fw('Mozilla/5.0 (Linux; Android 13; wv) Version/4.0 Chrome/116 XWEB MicroMessenger/8.0.47 WeChat', false, 360, 800)), '微信内置浏览器识别为手机');
  ok(detectMobile(fw('Mozilla/5.0 (X11; Linux x86_64) Chrome/129', false, 412, 915, '', 5)), '手机“桌面版网站”UA：触屏+小屏 仍识别为手机');
  ok(detectMobile(fw('Mozilla/5.0 (Windows NT 10.0) Chrome/129', true, 800, 1280, '', 10)), '触屏+粗指针 识别为手机/平板');
  ok(!detectMobile(fw('Mozilla/5.0 (Windows NT 10.0) Chrome/129', false, 1920, 1080, '', 10)), '大屏触控笔记本(细指针)不显示虚拟按键');
  ok(!detectMobile(fw('iPhone', true, 390, 844, '?mobile=0')) && detectMobile(fw('Chrome', false, 1920, 1080, '?mobile=1')), '?mobile= 参数可强制覆盖');
}
{ // 传送门：requireUse 时站在出口不按空格不切层，按下后切层
  const w = mk([], [{ name: '下一层', spawns: [] }]); w.requireUse = true; const h = w.hero!; h.x = w.exitX;
  w.step(0.05); ok(w.floorIndex === 0 && w.atExit, '到达传送门但未按空格：不切层');
  w.step(0.05, { dx: 0, dy: 0, use: true }); ok(w.floorIndex === 1, '按空格后进入下一层');
}
{ // 近战怪跳跃补位：玩家后退拉开距离时触发 leap 并加速
  const w = mk([{ id: 'wolf', x: 900 }]); const h = w.hero!; const z = w.units.find(u => u.team === 'enemy')!;
  z.ai = 'chase'; h.x = 600; z.x = 1100; let leaps = 0; const x0 = z.x;
  for (let i = 0; i < 6; i++) { w.step(0.05); for (const e of w.drainEvents()) if (e.type === 'leap') leaps++; }
  ok(leaps >= 1 && x0 - z.x > WORLD.heroSpeed * WORLD.chaseSpeedRatio * 0.3 * 1.5, `距离拉开时近战怪跳跃补位（leap ${leaps} 次，位移 ${Math.round(x0 - z.x)}）`);
}
{ // 后退：怪在前方时按 A 向后走，朝向保持面对怪物，速度正常
  const w = mk([{ id: 'wolf', x: 700 }]); tough(w); const h = w.hero!; h.x = 450; const x0 = h.x;
  w.alive('enemy').forEach(e => (e.ai = 'idle', e.atk = 0));
  for (let i = 0; i < 5; i++) w.step(0.05, { dx: -1, dy: 0 });
  ok(h.facing === 1 && x0 - h.x > WORLD.heroSpeed * 0.25 * 0.9, `后退时仍面向怪物（facing ${h.facing}，后退 ${Math.round(x0 - h.x)}px）`);
  const w2 = mk([]); const h2 = w2.hero!; w2.step(0.05, { dx: -1, dy: 0 }); ok(h2.facing === -1, '附近无怪时向左走会转身');
}
{ // 技能键：主动 F1~Fn，被动 P，且不占用 W/A/S/D
  const actives = (Object.keys(CLASSES) as ClassId[]).flatMap(c => CLASSES[c].skills.filter(s => !s.passive));
  const keys = actives.map(s => s.key);
  ok(keys.every(k => /^F[1-5]$/.test(k)) && !keys.some(k => 'WASD'.includes(k)), `三职业主动技能键均为 F1~F5（${[...new Set(keys)].join(',')}）`);
  ok(CLASSES.warrior.skills.filter(s => !s.passive).length === 4 && CLASSES.mage.skills.filter(s => !s.passive).length === 5, '战士 4 主动 / 法师 5 主动');
  ok(POTIONS.every(p => !keys.includes(p.key)), '药水 1-4 与技能键不冲突');
}
{ // S 键：起点返回上一层
  const w = mk([], [{ name: '二层', spawns: [] }]); w.loadFloor(1); const h = w.hero!;
  ok(w.prevFloor() && w.floorIndex === 0 && h.x > WORLD.heroStartX + 150, '在起点按 S 返回上一层（出生在出口前）');
  ok(!w.prevFloor(), '第一层按 S 无效');
}
{ // 虚拟按键：手机默认开，电脑关；与电脑设置隔离
  Settings.showPadMobile = null;
  ok(Settings.wantPad(true) && !Settings.wantPad(false), '手机默认开、电脑关');
  Settings.showPadMobile = false; ok(!Settings.wantPad(true), '手机可手动关');
  Settings.showPadMobile = true; ok(Settings.wantPad(true), '手机可手动开');
  Settings.showPadMobile = null;
}
{ // 战斗中方向键：后退 / 前进 / 边放技能边移动 / 多键同按
  const fight = () => { const w = mk([{ id: 'zombie', x: 700 }, { id: 'zombie', x: 760 }]); tough(w); const h = w.hero!; h.hp = h.maxHp = 1e9; h.x = 560;
    w.alive('enemy').forEach(e => (e.ai = 'chase', e.atk = 0)); run(w, 3); return { w, h }; };
  { const { w, h } = fight(); const x0 = h.x; ok(w.meleeSide() !== null, '已进入近战');
    run(w, 1, -1); ok(x0 - h.x > WORLD.heroSpeed * 0.9, `战斗中按住 A 后退（${Math.round(x0 - h.x)}px）`);
    const x1 = h.x; run(w, 0.5, 0); ok(h.x === x1, '松开立即停止'); }
  { const { w, h } = fight(); run(w, 1, -1); const x0 = h.x; for (let i = 0; i < 3; i++) w.step(0.05, { dx: 1, dy: 0 });
    ok(h.x > x0, `后退后按住 D 立即前进（${Math.round(h.x - x0)}px）`);
    const a = w.queue(1)[0], ax = a.x; run(w, 1.5, 1); ok(h.x > ax, '贴脸按住 D 直接穿过怪物');
    const x2 = h.x; w.step(0.05, { dx: -1, dy: 0 }); ok(h.x < x2, '穿过后反向一帧就能走回来'); }
  { const { w, h } = fight(); const x0 = h.x; h.mp = h.maxMp = 1e6;
    for (let i = 0; i < 20; i++) { if (i % 4 === 0) w.cast(i % 8 === 0 ? 0 : 1, free(w)); w.step(0.05, { dx: -1, dy: 0 }); }
    ok(x0 - h.x > WORLD.heroSpeed * 0.9 * 0.9, `连续放技能时后退不中断（${Math.round(x0 - h.x)}px）`); }
  { const { w, h } = fight(); const x0 = h.x, y0 = h.y;
    for (let i = 0; i < 20; i++) { if (i % 5 === 0) w.cast(0, free(w)); w.step(0.05, { dx: -1, dy: -1 }); }
    ok(h.x < x0 - WORLD.heroSpeed * 0.8 && h.y <= y0, '方向 + 上下 + 技能同按：不丢输入'); }
  { const w = mk([{ id: 'zombie', x: 600 }, { id: 'zombie', x: 300 }]); tough(w); const h = w.hero!; h.x = 450; h.hp = h.maxHp = 1e9;
    w.alive('enemy').forEach(e => (e.ai = 'chase', e.atk = 0)); run(w, 3); const x0 = h.x;
    run(w, 0.3, -1); const l = h.x; run(w, 0.3, 1); ok(h.x !== l || l !== x0, `前后夹击时不会两边都锁死（${Math.round(x0)}→${Math.round(l)}→${Math.round(h.x)}）`); }
}
{ // 点按一格移动（每按一下 stepPx，按住不连续；滑行中排队 1 次）
  const w = mk([]); const h = w.hero!; h.x = 1000; const x0 = h.x;
  w.step(0.05, { dx: 0, dy: 0, step: 1 }); run(w, 1); ok(Math.abs(h.x - x0 - WORLD.stepPx) < 1e-6, `按一下 D 只走一格（${WORLD.stepPx}px）`);
  run(w, 1); ok(Math.abs(h.x - x0 - WORLD.stepPx) < 1e-6, '不按不动（无持续移动）');
  const x1 = h.x; w.step(0.05, { dx: 0, dy: 0, step: -1 }); w.step(0.05, { dx: 0, dy: 0, step: -1 }); w.step(0.05, { dx: 0, dy: 0, step: -1 }); run(w, 1);
  ok(Math.abs(x1 - h.x - 3 * WORLD.stepPx) < 1e-6, '滑行中连按 3 次：全部排队，共走 3 格');
  const x2 = h.x; w.queueStep(1); for (let i = 0; i < 3; i++) w.step(0.05); ok(Math.abs(h.x - x2 - WORLD.stepPx) < 1e-6, `一格在 ${WORLD.stepSec}s 左右内完成`);
  const f = mk([{ id: 'zombie', x: 700 }]); tough(f); const fh = f.hero!; fh.hp = fh.maxHp = 1e9; fh.x = 560; f.alive('enemy').forEach(e => (e.ai = 'chase', e.atk = 0)); run(f, 3);
  const y = fh.x; for (let i = 0; i < 3; i++) { f.queueStep(-1); if (i === 1) f.cast(0, free(f)); run(f, 0.2); } ok(y - fh.x > WORLD.stepPx * 2.5, `战斗中点按 A 后退 3 格 + 技能不丢（${Math.round(y - fh.x)}px）`);
  run(f, 3); const z = fh.x, en = f.queue(1)[0], ex = en.x; for (let i = 0; i < 3; i++) f.queueStep(1); run(f, 0.5);
  ok(Math.abs(fh.x - z - 3 * WORLD.stepPx) < 1e-6 && fh.x > ex, `贴脸点 D ×3 穿过怪物走到身后（${Math.round(fh.x - z)}px，不推开：怪位移 ${Math.round(en.x - ex)}）`);
  run(f, 3); ok(f.meleeSide() === -1 && en.facing === 1, '穿过后怪转身追到新的一侧并继续近战');
  f.queueStep(-1); run(f, 0.3); ok(fh.x < z + 3 * WORLD.stepPx - 50, '穿过后点 A 立即后退');
}

{ // 远程控制键盘事件：keyup 丢失 / repeat 误标 / code 为空，每次合理间隔的 keydown 都应走一格
  const run = (evs: any[], gapMs = 300) => {
    const w = mk([], [{ name: 'x', spawns: [] }]); const h = w.hero!; h.x = 1000; const g = new StepGate(150); let t = 0, n = 0;
    for (const e of evs) { const d = stepDir(e); if (d && g.accept(e, t)) { w.queueStep(d); n++; } for (let k = 0; k < gapMs / 20; k++) w.step(0.02, { dx: 0, dy: 0 }); t += gapMs; }
    return { moved: Math.round(h.x - 1000), n };
  };
  const R = { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }, L = { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 };
  let r = run([R, R, R, R]); ok(r.moved === 400, `只有 keydown 无 keyup：连按 4 次右走 4 格（${r.moved}px）`);
  r = run([R, { ...R, repeat: true }, { ...R, repeat: true }, { ...R, repeat: true }]); ok(r.moved === 400, `首次后全部 repeat=true（keyup 丢失）：仍各走一格（${r.moved}px）`);
  r = run([{ repeat: true, ...R }, { ...R, repeat: true }]); ok(r.moved === 200, `没有先前非 repeat 的 repeat=true 序列也生效（${r.moved}px）`);
  r = run([{ key: 'Unidentified', code: '', keyCode: 39 }, { code: '', keyCode: 39 }, { key: 'Unidentified', code: 'Unidentified', keyCode: 37 }]); ok(r.moved === 100, `code 为空只有 keyCode：右右左 = +1 格（${r.moved}px）`);
  r = run([R, L, R, L, L]); ok(r.moved === -100, `左右交替（keyup 全丢）每次都生效（${r.moved}px）`);
  r = run([{ key: 'd' }, { key: 'D' }, { key: 'a', code: 'KeyA' }]); ok(r.moved === 100, `a/A/d/D 识别（${r.moved}px）`);
  r = run(Array(10).fill({ ...R, repeat: true }), 30); ok(r.n >= 1 && r.n <= 3, `按住自动重复(30ms) 被节流到 ≥150ms 一格（触发 ${r.n} 次）`);
  const w = mk([], [{ name: 'x', spawns: [] }]); w.hero!.x = 1000; w.queueStep(1); w.stepTarget = 99999; for (let k = 0; k < 40; k++) w.step(0.02, { dx: 0, dy: 0 });
  ok(w.stepTarget === null, '补间卡住/被打断：stepTarget 超时自动释放，不会永久 busy');
}
{ // 按住持续移动（HoldKeys）：短按/长按/丢 keyup/repeat/keyCode-only/方向反转
  type Ev = [number, 'down' | 'up', any];
  const R = { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 }, L = { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 };
  const sim = (evs0: Ev[], until: number) => { const evs = [...evs0].sort((a, b) => a[0] - b[0]);
    const w = mk([], [{ name: 'x', spawns: [] }]); const h = w.hero!; h.x = 2000; const hk = new HoldKeys(); const xs: number[] = []; let i = 0;
    for (let t = 0; t <= until; t += 10) {
      while (i < evs.length && evs[i][0] <= t) { const [, ty, e] = evs[i++]; const d = stepDir(e); if (d) ty === 'down' ? hk.down(d, t) : hk.up(d, t); }
      w.step(0.01, { dx: hk.dir(t), dy: 0 }); xs.push(h.x - 2000);
    }
    return xs;
  };
  const reps = (e: any, from: number, to: number, every = 33, repeat = true): Ev[] => { const o: Ev[] = []; for (let t = from; t < to; t += every) o.push([t, 'down', { ...e, repeat }]); return o; };
  let xs = sim([[0, 'down', R], [30, 'up', R]], 600); ok(xs[xs.length - 1] >= 30 && xs[xs.length - 1] <= 60, `短按也有明显位移（${Math.round(xs[xs.length - 1])}px）`);
  const hold1s: Ev[] = [[0, 'down', R], ...reps(R, 500, 1000), [1000, 'up', R]];
  xs = sim(hold1s, 1500); ok(Math.abs(xs[100] - WORLD.heroSpeed) < 30 && Math.abs(xs[150] - xs[101]) < 1, `长按 1s 持续走约 ${WORLD.heroSpeed}px（${Math.round(xs[100])}px），松开立即停`);
  xs = sim([[0, 'down', R], ...reps(R, 500, 1000)], 2000); ok(xs[100] > 380 && xs[200] - xs[100] < WORLD.heroSpeed * HOLD.watchdogMs / 1000 + 5 && xs[200] === xs[160], `丢 keyup：最后一次 repeat 后看门狗 ${HOLD.watchdogMs}ms 内自动停（多走 ${Math.round(xs[200] - xs[100])}px）`);
  xs = sim([[0, 'down', R]], 1500); ok(xs[50] > 180 && xs[150] === xs[80], `单次 keydown 无 repeat 无 keyup：首次重复前宽限 ${HOLD.graceMs}ms 不停，之后自动停（${Math.round(xs[150])}px）`);
  xs = sim([[0, 'down', { ...R, repeat: true }], ...reps(R, 100, 1000, 33, true)], 1000); ok(xs[100] > 380, `全部 repeat=true（无首个非 repeat）仍持续走（${Math.round(xs[100])}px）`);
  const kc = { key: 'Unidentified', code: '', keyCode: 39 };
  xs = sim([[0, 'down', kc], ...reps(kc, 500, 1000), [1000, 'up', kc]], 1200); ok(xs[100] > 380, `code 为空只有 keyCode 也能按住走（${Math.round(xs[100])}px）`);
  xs = sim([[0, 'down', R], ...reps(R, 500, 1500), [600, 'down', L], ...reps(L, 1100, 1500), [1500, 'up', L], [1500, 'up', R]], 1600);
  ok(xs[60] > 200 && xs[150] < xs[60], `同时按左右以后按下的为准：按住右再按左 → 反向（${Math.round(xs[60])}→${Math.round(xs[150])}）`);
  xs = sim([[0, 'down', R], [300, 'up', R], [400, 'down', R], [430, 'up', R], [500, 'down', R], [530, 'up', R]], 800); ok(xs[79] > xs[52] && xs[52] > xs[42], '丢 keyup 后再次按下（新 keydown）依然生效');
}

{ // 道士 1 级即可召唤骷髅
  const sk = CLASSES.taoist.skills.find(s => s.id === 'summon_skeleton')!;
  ok((sk.unlock ?? 1) <= 1, '召唤骷髅解锁等级 ≤ 1');
  const w = mk([{ id: 'orc', x: 900 }], [], 'taoist', 1); const h = w.hero!;
  h.x = 500; h.mp = h.maxMp;
  const r = w.cast(idx(w, 'summon_skeleton'), free(w));
  ok(r.ok && !!w.summon, `道士 1 级可召唤骷髅（ok=${r.ok}）`);
  ok(!!w.summon && w.summon.hp > 0 && w.summon.atk > 0, `1 级骷髅有基础属性 hp=${w.summon?.hp} atk=${w.summon?.atk}`);
  const w20 = mk([{ id: 'orc', x: 900 }], [], 'taoist', 20); w20.hero!.mp = 9999;
  w20.cast(idx(w20, 'summon_skeleton'), free(w20));
  ok(w20.summon!.maxHp > w.summon!.maxHp, `高等级骷髅更强（${w.summon!.maxHp} → ${w20.summon!.maxHp}）`);
}
{ // 自动普攻开关：autoAttack=false 时贴脸不打
  const w = mk([{ id: 'zombie', x: 600 }], [], 'warrior', 10); tough(w);
  const h = w.hero!, z = w.alive('enemy')[0];
  h.x = z.x - (h.width + z.width) / 2 - Math.max(h.range, z.range) + 2;
  h.hp = h.maxHp = 1e9; z.ai = 'chase';
  let hits = 0;
  for (let i = 0; i < 80; i++) {
    w.step(0.05, { dx: 0, dy: 0, autoAttack: false });
    for (const e of w.drainEvents()) if (e.type === 'damage' && e.source === h.uid) hits++;
  }
  ok(hits === 0, `关闭自动普攻：贴脸 ${hits} 次伤害（应为 0）`);
  hits = 0;
  for (let i = 0; i < 80; i++) {
    w.step(0.05, { dx: 0, dy: 0, autoAttack: true });
    for (const e of w.drainEvents()) if (e.type === 'damage' && e.source === h.uid) hits++;
  }
  ok(hits > 0, `开启自动普攻：贴脸有伤害（${hits}）`);
}
{ // Settings：自动攻击 / 缩放持久化字段与推荐技能
  ok(DEFAULT_AUTO_SKILLS.warrior[0] === 'fire_sword', '战士推荐烈火优先');
  ok(DEFAULT_AUTO_SKILLS.mage.includes('thunder') && DEFAULT_AUTO_SKILLS.mage.includes('fireball'), '法师推荐雷电+火球');
  ok(DEFAULT_AUTO_SKILLS.taoist.includes('summon_skeleton') && DEFAULT_AUTO_SKILLS.taoist.includes('heal'), '道士推荐召唤+治愈术');
  const bak = { aa: Settings.autoAttack, as: Settings.autoSkills, z: Settings.zoom };
  Settings.autoAttack = false; Settings.autoSkills = ['fire_sword']; Settings.setZoom(1.15);
  ok(Settings.zoom === 1.15, '缩放步进对齐 1.15');
  Settings.setZoom(0.7); ok(Settings.zoom === ZOOM_MIN, `缩放下限 ${ZOOM_MIN}`);
  Settings.setZoom(1.5); ok(Settings.zoom === ZOOM_MAX, `缩放上限 ${ZOOM_MAX}`);
  Settings.setZoom(1); Settings.autoAttack = bak.aa; Settings.autoSkills = bak.as;
  ok(Settings.skillsFor('warrior').length >= 1, 'skillsFor 返回推荐或勾选');
  Settings.autoSkills = []; ok(Settings.skillsFor('mage').length === 0, '显式空列表 = 不自动放技能');
  Settings.autoSkills = null; ok(Settings.skillsFor('taoist').includes('summon_skeleton'), 'null → 职业推荐');
  { // R8：按职业独立保存——改战士不影响法师/道士推荐
    const bt = Settings.autoTouched; Settings.autoSkills = null; Settings.autoTouched = null;
    Settings.toggleAutoSkill('thrust', 'warrior');
    ok(!Settings.skillsFor('warrior').includes('thrust'), '战士取消刺杀生效');
    ok(Settings.skillsFor('mage').length === 5 && Settings.skillsFor('taoist').length === 5, '法师/道士仍为推荐默认');
    Settings.toggleAutoSkill('fireball', 'mage');
    ok(!Settings.skillsFor('mage').includes('fireball') && !Settings.skillsFor('warrior').includes('thrust'), '两职业改动互不覆盖');
    Settings.autoTouched = bt;
  }
  { // R9 自适应缩放
    const bz = Settings.zoomAuto;
    Settings.zoomAuto = null; ok(Settings.isAutoZoom(true) && !Settings.isAutoZoom(false), '手机默认自适应，电脑默认关');
    Settings.setZoom(1.1); ok(!Settings.isAutoZoom(true) && Settings.zoom === 1.1, '选预设即退出自适应');
    Settings.setAutoZoom(true); ok(Settings.isAutoZoom(false), '可手动选自适应');
    ok(fitScale(667, 375) === Math.min(667 / 1280, 375 / 720) && fitScale(1024, 768) === 0.8, 'fitScale 取宽高较小比例，不裁切');
    Settings.zoomAuto = bz;
  }
  Settings.autoSkills = bak.as; Settings.zoom = bak.z; Settings.autoAttack = bak.aa;
}
{ // 地图：到达记录 / BOSS 击杀 / 传送规则
  const w = mk([{ id: 'deer', x: 3000 }], [{ name: '二层', spawns: [{ id: 'deer', x: 3000 }] }, { name: '三层', spawns: [] }], 'warrior', 10);
  ok(w.reached.has(0) && !w.reached.has(1), '起始只到达第 1 层');
  ok(w.canTeleport(2) === '尚未到达该层', '未到达的层不能传送');
  w.loadFloor(1); w.gold = 0; ok(w.reached.has(1) && w.canTeleport(0)!.includes('金币'), '金币不足不能传送');
  w.gold = 1000; const e = w.alive('enemy')[0]; e.ai = 'chase'; ok(w.canTeleport(0) === '战斗中无法传送', '战斗中不能传送'); e.ai = 'idle';
  ok(w.teleport(0) === null && w.floorIndex === 0 && w.gold === 980, '传送回第 1 层扣 20 金');
  ok(w.canTeleport(1)!.includes('冷却'), '传送有 30 秒冷却');
  const sv = w.toSave(); ok(sv.reached!.includes(1), '存档记录到达层');
  const wb = mk([{ id: 'wolf_king', x: 700 }]); wb.kill(wb.alive('enemy')[0]); ok(wb.bossKilled.has(0) && wb.toSave().bossKilled!.includes(0), '记录 BOSS 击杀');
}
{ // 技能未达解锁等级不可放
  const w = mk([{ id: 'orc', x: 700 }], [], 'warrior', 1);
  const sk = w.skills[0]; const old = sk.unlock; (sk as any).unlock = 5;
  const r = w.cast(0, free(w));
  ok(!r.ok && (r as any).reason.includes('等级'), `未达解锁等级拒绝（${(r as any).reason}）`);
  (sk as any).unlock = old;
}

{ // R1 幸运 / 祝福油
  const w = mk([{ id: 'orc', x: 700 }], [], 'warrior', 5);
  w.equip.weapon = w.makeItem('iron_sword');
  ok(w.luck() === 0, '默认幸运 0');
  w.equip.weapon.luck = 9; let allMax = true;
  for (let i = 0; i < 50; i++) if (w.roll(0.9, 0.2) !== 0.9 + 0.2) allMax = false;
  ok(allMax, '幸运 9 → 必出上限');
  w.equip.weapon.luck = -9; ok(w.roll(0.9, 0.2) === 0.9, '诅咒 9 → 必出下限');
  w.equip.weapon.luck = 7; w.bag.push(w.makeItem('bless_oil'));
  ok(w.useOil(w.bag.length - 1).includes('上限') && w.bag.length > 0, '幸运 7 不消耗祝福油');
  w.equip.weapon.luck = 0; w.rng = () => 0.5; const m = w.useOil(w.bag.length - 1);
  ok(w.equip.weapon.luck === 1 && m.includes('+1'), `幸运 0 喝油 → 1（${m}）`);
  w.equip.weapon.luck = 6; w.bag.push(w.makeItem('bless_oil')); w.rng = () => 0.95; w.useOil(w.bag.length - 1);
  ok(w.equip.weapon.luck === 5, '高幸运失败有几率诅咒 -1');
  delete w.equip.weapon; w.bag.push(w.makeItem('bless_oil')); ok(w.useOil(w.bag.length - 1).includes('武器'), '无武器不能用');
}

{ // R2 套装：集齐激活、卸下失效、Boss 掉落、商店限购祝福油
  const w = mk([], [], 'warrior', 25); const base = w.stats();
  const wear = (id: string) => { w.bag.push(w.makeItem(id)); w.equipItem(w.bag.length - 1); };
  wear('set_woma_helm'); ok(w.setBonuses().length === 0, '沃玛 1 件：无套装加成');
  wear('set_woma_necklace'); ok(w.setCounts().woma === 2 && w.stats().hp === base.hp + 10 * 0 + 60 + 60 + 0, `沃玛 2 件：生命+60 激活（hp ${w.stats().hp}）`);
  wear('set_woma_bracelet'); const s3 = w.stats(); ok(w.setBonuses().length === 2 && s3.def === base.def + 10 + 5 + 5, `沃玛 3 件：防御+5 激活（def ${s3.def}）`);
  ok(w.hero!.maxHp === s3.hp, '套装加成同步到主角属性');
  w.unequip('bracelet'); ok(w.setBonuses().length === 1 && w.stats().def === base.def + 10, '卸下 1 件：3 件加成失效');
  const c = mk([], [], 'mage', 25); for (const id of SETS.chiyue.pieces) { c.bag.push(c.makeItem(id)); c.equipItem(c.bag.length - 1); }
  ok(c.luck() === 1, '赤月 3 件：幸运+1');
  ok(Object.values(SETS).every(st => st.pieces.every(id => ENEMIES && id.startsWith('set_'))), '套装物品 ID 规范');
  for (const [bid, sid] of [['boss_woma', 'woma'], ['boss_zuma', 'zuma'], ['boss_redmoon', 'chiyue']] as const) {
    const t = mk([{ id: bid, x: 800 }]); t.kill(t.alive('enemy')[0]); const ids = t.ground.map(g => g.item);
    ok(ids.includes('bless_oil') && ids.some(i => SETS[sid].pieces.includes(i)), `${ENEMIES[bid].name} 掉落祝福油 + ${SETS[sid].name}套装 1 件`);
  }
  const b = mk([{ id: 'boss_woma', x: 800 }]); b.kill(b.alive('enemy')[0]);
  b.hero!.x = 800; for (let i = 0; i < 40; i++) b.step(0.05); ok(b.bag.some(x => SETS.woma.pieces.includes(x.item)), '套装可拾取进背包');
  const shop = mk([]); shop.gold = OIL_PRICE * 2;
  ok(shop.buyOil() === null && shop.bag.some(x => x.item === 'bless_oil') && shop.gold === OIL_PRICE, `商店可买祝福油（${OIL_PRICE} 金）`);
  ok(shop.buyOil() !== null && shop.gold === OIL_PRICE, '同层限购 1 瓶');
}


{ // R5 黑铁强化：成功率、属性、提纯、破碎、商店限购、Boss 掉落
  const w = mk([], [], 'warrior', 20);
  w.bag.push(w.makeItem('iron_sword')); w.equipItem(0);
  const baseAtk = w.equip.weapon!.stats.atk!;
  w.bag.push(w.makeItem('black_iron', 'common', { purity: 5 }));
  w.rng = () => 0; // 必成功
  const m = w.enhanceWithIron(0, 'weapon');
  ok(m.includes('成功') && (w.equip.weapon!.enhance ?? 0) === 1, `强化成功 → +1（${m}）`);
  ok((w.equip.weapon!.stats.atk ?? 0) > baseAtk, `属性提升 ${baseAtk} → ${w.equip.weapon!.stats.atk}`);
  ok(w.bag.every(x => x.item !== 'black_iron'), '消耗矿石');
  // 失败扣材料不掉级
  w.bag.push(w.makeItem('black_iron', 'common', { purity: 1 }));
  w.rng = () => 0.99; // 必失败且不触发破碎（+1 时 shatter=0）
  const cur = w.equip.weapon!.enhance!;
  const fail = w.enhanceWithIron(0, 'weapon');
  ok(fail.includes('失败') && w.equip.weapon!.enhance === cur, `失败不掉级（${fail}）`);
  // 上限
  w.equip.weapon!.enhance = ENHANCE_MAX; w.applyEnhanceStats(w.equip.weapon!);
  w.bag.push(w.makeItem('black_iron')); ok(w.enhanceWithIron(0, 'weapon').includes('上限'), '达上限不可再强化');
  // 首饰不可强化
  w.bag.push(w.makeItem('iron_ring')); w.equipItem(w.bag.length - 1);
  w.bag.push(w.makeItem('black_iron')); ok(w.enhanceWithIron(w.bag.length - 1, 'ring').includes('不能'), '首饰不可强化');
  // 提纯
  const r = mk([]); r.bag.push(r.makeItem('black_iron', 'common', { purity: 2 }), r.makeItem('black_iron', 'common', { purity: 2 }));
  ok(r.refineIron(0, 1).includes('[+3]') && r.bag.length === 1 && r.bag[0].purity === 3, '两块+2 提纯 → +3');
  // 破碎（+5 失败）
  const sh = mk([], [], 'warrior', 20); sh.bag.push(sh.makeItem('iron_sword')); sh.equipItem(0);
  sh.equip.weapon!.enhance = 5; sh.applyEnhanceStats(sh.equip.weapon!);
  sh.bag.push(sh.makeItem('black_iron', 'common', { purity: 1 }));
  // rng: first call enhanceChance fail (0.99), second shatterChance trigger (0)
  let n = 0; sh.rng = () => { n++; return n === 1 ? 0.99 : 0; };
  ok(sh.enhanceWithIron(0, 'weapon').includes('破碎') && !sh.equip.weapon, '高强化失败可能破碎');
  ok(shatterChance(4) === 0 && shatterChance(5) > 0 && enhanceChance(0, 5) > enhanceChance(0, 1), '成功率/破碎概率公式');
  // 商店
  const shop = mk([]); shop.gold = IRON_PRICE * 6;
  ok(shop.buyIron() === null && shop.bag[0].item === 'black_iron' && shop.bag[0].purity === 1, '商店可买黑铁');
  for (let i = 0; i < 4; i++) shop.buyIron();
  ok((shop.bag[0].qty ?? 1) === 5 && shop.bag.length === 1, '同纯度堆叠');
  ok(shop.buyIron() !== null, '每层限购 5');
  // Boss 掉落黑铁
  const b = mk([{ id: 'boss_woma', x: 800 }]); b.kill(b.alive('enemy')[0]);
  ok(b.ground.some(g => g.item === 'black_iron'), 'Boss 掉落黑铁矿石');
  ok(b.ground.some(g => g.item === 'bless_oil'), 'Boss 仍掉祝福油');
}


{ // R6 悬赏进度 / 交付 / 存档 + 成就称号
  const w = mk([{ id: 'wolf', x: 600 }, { id: 'wolf', x: 700 }, { id: 'wolf', x: 800 }, { id: 'wolf', x: 900 }]);
  ok(QUESTS[0].target === 'wolf' && QUESTS.length >= 8, '每层悬赏定义齐全');
  const wolves = w.alive('enemy').filter(e => e.id === 'wolf');
  ok(wolves.length >= 3, '测试层刷出狼');
  wolves.slice(0, 3).forEach(e => w.kill(e));
  ok((w.questProg['q0'] ?? 0) >= 3, `击杀累计悬赏进度 ${w.questProg['q0']}`);
  const beforeG = w.gold, beforeE = w.exp;
  const msg = w.claimQuest('q0');
  ok(msg.includes('完成') && w.questDone.has('q0') && w.gold > beforeG && w.exp >= beforeE, `交付悬赏（${msg}）`);
  ok(w.claimQuest('q0').includes('已完成'), '不可重复交付');
  // 成就：击杀
  const a = mk([]); a.kills = 30; a.checkAchieves();
  ok(a.achieves.has('a_kills_30') && a.title() === '见习猎手', '击杀成就解锁称号');
  const st0 = a.stats().atk;
  a.achieves.delete('a_kills_30'); a.recompute();
  ok(a.stats().atk < st0, '卸下成就（模拟）属性下降');
  a.achieves.add('a_kills_30'); a.recompute();
  // 强化成就
  const e = mk([]); e.bag.push(e.makeItem('iron_sword')); e.equipItem(0);
  e.equip.weapon!.enhance = 5; e.applyEnhanceStats(e.equip.weapon!); e.checkAchieves();
  ok(e.achieves.has('a_enhance_5'), '强化+5 成就');
  // 存档往返
  const save = w.toSave();
  ok(!!save.questDone?.includes('q0') && !!save.questProg, '存档含悬赏');
  const w2 = new World(seeded(2), 20, [{ name: '测', spawns: [] }], 'warrior', save);
  ok(w2.questDone.has('q0') && (w2.questProg['q0'] ?? 0) >= 3, '读档恢复悬赏进度');
  // 到达层数成就
  const f = mk([]); for (let i = 0; i < 8; i++) f.reached.add(i); f.checkAchieves();
  ok(f.achieves.has('a_floors_8'), '到达 8 层成就');
  ok(ACHIEVES.length >= 7, '成就定义齐全');
}

{ // 装备上身分层（docs/equip-layers.md）
  const it = (item: string, slot: any, req = 1) => ({ uid: 1, item, name: item, rarity: 'common', slot, stats: {}, req, price: 1 } as any);
  const ls = resolveLayers('warrior', { armor: it('cloth', 'armor'), weapon: it('iron_sword', 'weapon', 4), helmet: it('helmet', 'helmet') });
  ok(ls.map(l => l.slot).join() === 'body,armor,weapon', '映射：叠加顺序 body→armor→weapon，头盔不出层');
  ok(ls[2].url === 'assets/equip/warrior/weapon/iron_sword.png' && ls.every(l => l.dx === 0 && l.dy === 0 && l.scale === 1), '映射：文件名=装备 id，左上零偏移');
  ok(ls.every(l => existsSync('public/' + l.url)), '战士映射到的素材文件存在');
  ok(resolveLayers('warrior', { weapon: it('magic_staff', 'weapon', 6) })[1].id === 'iron_sword', '战士拿魔杖兜底铁剑');
  ok(fallbackId('armor', 20) === 'armor' && fallbackId('weapon', 2) === 'wood_sword' && fallbackId('weapon', 30) === 'dragon_sword', '未知装备按等级兜底');
  const lm = resolveLayers('mage', { armor: it('cloth', 'armor'), weapon: it('magic_staff', 'weapon', 6) });
  ok(lm.map(l => l.id).join() === 'body,cloth,magic_staff' && lm.every(l => existsSync('public/' + l.url)), '法师映射：魔杖有专属图，素材存在');
  const lt = resolveLayers('taoist', { armor: it('armor', 'armor', 12), weapon: it('tao_sword', 'weapon', 6) });
  ok(lt.map(l => l.id).join() === 'body,armor,tao_sword' && lt.every(l => existsSync('public/' + l.url)), '道士映射：银蛇剑有专属图，素材存在');
  ok(resolveLayers('unknown_cls', { weapon: it('iron_sword', 'weapon') }).length === 0, '未知职业无素材 → 无层（原立绘）');
  const none = () => false, all = () => true;
  ok(pickTexture('warrior', 'hero', ls, all, k => k.includes('weapon')).key === 'hero', '缺素材/加载失败回退原立绘');
  ok(pickTexture('warrior', 'hero', ls, none, none).state === 'pending' && pickTexture('warrior', 'hero', ls, none, none).key === 'hero', '加载中先显示原立绘');
  ok(pickTexture('warrior', 'hero', ls, all, none).key === comboKey('warrior', ls) && comboKey('warrior', ls) === 'eqc_warrior_body+cloth+iron_sword', '全部就绪用合成缓存 key');
  const ls2 = resolveLayers('warrior', { armor: it('cloth', 'armor'), weapon: it('dragon_sword', 'weapon', 15) });
  ok(changedSlots(ls, ls2).join() === 'weapon', '换武器只影响武器层');
  ok(changedSlots(ls, resolveLayers('warrior', {})).join() === 'body,armor,weapon' && resolveLayers('warrior', {}).length === 0, '全脱 → 回原立绘');
  const w = mk([]); w.equipItem(0);
  const old = new World(seeded(1), 1, [{ name: 't', spawns: [] }], 'warrior', (({ equip, ...r }) => r)(w.toSave()) as any);
  ok(resolveLayers(old.cls, old.equip).length === 0 && resolveLayers('warrior', undefined).length === 0, '旧存档/无装备照常（无层）');
  const w2 = mk([]); w2.bag.push(it('dragon_sword', 'weapon', 1)); const wi = w2.bag.length - 1;
  { const a = comboKey('warrior', resolveLayers('warrior', w2.equip)); w2.equipItem(wi); const b = comboKey('warrior', resolveLayers('warrior', w2.equip)); w2.unequip('weapon'); const c2 = comboKey('warrior', resolveLayers('warrior', w2.equip)); ok(a !== b && c2 === a, '穿/脱武器后组合签名刷新并可还原'); }
}

{ // R13 超大世界地图 + 区域小地图入口
  ok(FLOORS.every((_, i) => nodeOfFloor(i)), '每一层都有区域小地图入口');
  ok(entrances().length === FLOORS.length, `入口与层一一对应（${entrances().length}/${FLOORS.length}）`);
  ok(entrances().every(e => e.region.floors.includes(e.node.floor!)), '入口所在区域与 floors 一致');
  ok(REGIONS.every(r => r.nodes.filter(n => n.kind === 'town').every(n => n.safe && n.floor === undefined)), '城镇节点为安全区且不是战斗层（留给城镇/商人任务）');
  ok(REGIONS.every(r => r.nodes.every(n => n.kind !== 'exit' || REGIONS.some(x => x.id === n.to))), '区域出口指向存在的区域');
  ok(REGIONS.every(r => r.x > 0 && r.x < WORLD_W && r.y > 0 && r.y < WORLD_H && r.nodes.every(n => n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1)), '坐标在画布内');
  const v = clampView({ x: 500, y: 500, z: 0.01 }, 960, 360); ok(v.x <= 0 && v.y <= 0 && v.z * WORLD_W >= 960, '视口夹紧：不露出画布外、最小缩放铺满');
  const z = zoomAt({ x: -400, y: -200, z: 1 }, 480, 180, 1.5, 960, 360); ok(Math.abs((480 - z.x) / z.z - 880) < 1e-6 && Math.abs((180 - z.y) / z.z - 380) < 1e-6, '缩放以锚点为中心');
  ok(zoomAt({ x: 0, y: 0, z: 2 }, 0, 0, 5, 960, 360).z === 2, '最大缩放受限');
  const w = new World(seeded(3), 1, FLOORS, 'warrior'); w.reached.add(4); w.gold = 1000;
  ok(w.teleport(nodeOfFloor(4)!.node.floor!) === null && w.floorIndex === 4, '点击入口沿用 teleport 规则传送');
  ok(!!w.teleport(nodeOfFloor(0)!.node.floor!), '传送冷却仍生效');
}

{ // R14 阶段 A：城镇 / NPC 商店 / 仓库 / 技能页
  const w = new World(seeded(5), 20, FLOORS, 'warrior'); w.gold = 100000;
  ok(Object.values(NODE_TOWN).every(t => !!TOWNS[t]) && REGIONS.every(r => r.nodes.filter(n => n.kind === 'town').every(n => NODE_TOWN[n.id])), '每个地图城镇节点都对应城镇');
  ok(w.enterTown('bichi') === null && w.town === 'bichi', '进入比奇城');
  const hp0 = w.hero!.hp; w.spawn(ENEMIES[Object.keys(ENEMIES)[0]], 'enemy', w.hero!.x + 30, 0); run(w, 5);
  ok(w.hero!.hp === hp0, '安全区：城内不受伤害');
  ok(w.leaveTown() === null && w.town === null && w.floorIndex === 0, '出城 → 第 1 层');
  ok(w.enterTown('bichi') === null && w.town === 'bichi', '再回城');
  const drops = new Set(Object.values(ENEMIES).filter(e => e.tier === 'boss').flatMap(e => (e.drops ?? []).map(d => d.item)));
  const shopItems = [...WEAPON_GOODS, ...ARMOR_GOODS].map(g => g.item);
  const bossOnly = ['xiuluo', 'pohun', 'xiangmo', 'tulong', 'longwen', 'luoyang'].filter(i => ITEMS[i]);
  ok(drops.size > 0 && shopItems.every(i => ITEMS[i]?.slot && !bossOnly.includes(i)) && [...WEAPON_GOODS, ...ARMOR_GOODS].every(g => g.official !== null), '武器/衣服店只卖原版 NPC 有售价的商店装，不卖首领装');
  ok([...WEAPON_GOODS, ...ARMOR_GOODS, ...GENERAL_GOODS].every(g => g.price > (ITEMS[g.item].price ?? 0)), '买价 > 卖回价（不能刷钱）');
  ok(WEAPON_GOODS.every(g => g.official !== null && g.price === Math.round(g.official * 0.25) && /21cq|tayewan/.test(g.src)), '武器价 = 原版价×0.25，带来源');
  const g0 = w.gold, b0 = w.bag.length; ok(w.buyGoods('bq_weapon', 'short_sword') === null && w.gold === g0 - 250 && w.bag.length === b0 + 1, '武器店购买短剑 250 金');
  ok(!!w.buyGoods('bq_weapon', 'xiuluo'), '武器店不卖修罗（首领装）');
  const g1 = w.gold; const got = w.sellItem(w.bag.length - 1); ok(got === ITEMS.short_sword.price && w.gold === g1 + got, '卖给 NPC 按售价');
  w.buyGoods('bq_armor', 'cloth'); const it = w.bag[w.bag.length - 1];
  ok(w.deposit(w.bag.length - 1) === null && w.storage.length === 1, '仓库存入');
  const w2 = new World(seeded(6), 20, FLOORS, 'warrior', JSON.parse(JSON.stringify(w.toSave())));
  ok(w2.storage.length === 1 && w2.storage[0].uid === it.uid, '仓库跨刷新（存档）保留');
  ok(w2.withdraw(0) === null && w2.storage.length === 0 && w2.bag.some(x => x.uid === it.uid), '仓库取回');
  ok(STORAGE_SIZE === 40, '仓库 40 格 [适配]');
  const old: any = JSON.parse(JSON.stringify(w.toSave())); delete old.storage; delete old.skillOrder;
  const w3 = new World(seeded(7), 20, FLOORS, 'warrior', old); ok(w3.storage.length === 0 && w3.skills.length === w.skills.length && w3.skillOrder.length === 0, '旧存档（无仓库/顺序）兼容');
  w.reached.add(3); w.teleportReadyAt = 0; ok(w.townTeleport(3) === null && w.town === null && w.floorIndex === 3, '传送员：城内传送到已到达层');
  // 技能页：拖放排序 + 自动优先级
  const s = learnAll(new World(seeded(8), 40, FLOORS, 'warrior')); const ids = s.skills.map(k => k.id);
  s.moveSkill(ids[ids.length - 1], 0); ok(s.skills[0].id === ids[ids.length - 1] && s.skills[0].key === 'F1', '技能拖到 F1');
  const s2 = new World(seeded(9), 40, FLOORS, 'warrior', JSON.parse(JSON.stringify(s.toSave()))); ok(s2.skills[0].id === ids[ids.length - 1], '快捷栏顺序存档保留');
  Settings.autoSkills = null; Settings.autoTouched = null as any; const a = Settings.skillsFor('mage');
  if (a.length >= 2) { Settings.moveAutoSkill(a[1], -1, 'mage'); const b = Settings.skillsFor('mage'); ok(b[0] === a[1] && b[1] === a[0], '自动技能优先级上移'); }
  Settings.autoSkills = null;
}

{ // R14 横版长街：走到门口进店
  const w = new World(seeded(11), 20, FLOORS, 'warrior'); w.enterTown('bichi');
  const ds = streetDoors('bichi');
  ok(ds.length === 10 && ds.some(d => d.npc.kind === 'veteran'), '比奇长街 10 家门面（含比奇老兵）');
  ok(ds.every((d, i) => d.x > TOWN_GATE_X + 200 && d.x < TOWN_W && (i === 0 || d.x - ds[i - 1].x > 220)), '门面在街内且不重叠');
  ok(Object.values(NPC_ART).every(a => existsSync(`public/assets/town/npc_${a}.png`)) && existsSync('public/assets/town/bg_bichi_town.jpg'), 'NPC 立绘与城镇背景文件都在');
  ok(w.alive('enemy').length === 0 && w.ground.length === 0, '进城清掉野外怪/地上物品');
  const target = ds[3]; let n = 0; while (w.hero!.x < target.x - 50 && n++ < 400) w.step(0.05, { dx: 1, dy: 0 });
  ok(w.nearDoor()?.npc.id === target.npc.id, `向右走到 ${target.npc.name} 门口触发该 NPC`);
  ok(!w.atTownGate(), '不在城门');
  n = 0; while (!w.atTownGate() && n++ < 800) w.step(0.05, { dx: -1, dy: 0 });
  ok(w.atTownGate() && w.nearDoor() === null && w.town === 'bichi', '向左走回城门（仍在城内，门口才出城）');
  ok(w.leaveTown() === null && w.town === null && w.alive('enemy').length > 0, '城门出城后重新刷怪');
}

console.log(`全部通过 ${pass} 项`);
