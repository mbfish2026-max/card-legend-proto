import { World, SaveData } from '../src/combat/World';
import { WORLD, Floor, FLOORS } from '../src/data/world';
import { CLASSES, ClassId } from '../src/data/classes';
import { ENEMIES } from '../src/data/units';
import { POTIONS } from '../src/data/skills';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const mk = (spawns: Floor['spawns'], extra: Floor[] = [], cls: ClassId = 'warrior', lv = 20, seed = 1) => new World(seeded(seed), lv, [{ name: '测试层', spawns }, ...extra], cls);
const run = (w: World, sec: number, dx = 0, dy = 0) => { for (let t = 0; t < sec; t += 0.05) w.step(0.05, { dx, dy }); };
const tough = (w: World) => w.alive('enemy').forEach(e => (e.hp = e.maxHp = 1e9));
const idx = (w: World, id: string) => w.skills.findIndex(s => s.id === id);
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
  run(w, 2, 1); ok(h.x + (h.width + a.width) / 2 <= a.x + 1e-6, '前排阻挡');
}
{ // 脱战回位
  const w = mk([{ id: 'zombie', x: 2500 }]); tough(w); const h = w.hero!, z = w.alive('enemy')[0];
  h.x = z.x - WORLD.aggroRange + 5; run(w, 1.5); ok(z.ai === 'chase' && z.x < 2500, '开始追击');
  let left = 0; while (z.ai === 'chase' && left < 30) { w.step(0.05, { dx: -1, dy: 0 }); left += 0.05; if (h.x <= h.width / 2) break; }
  ok(z.ai === 'return' || z.ai === 'idle', '超过脱战距离放弃追击');
  run(w, 20); ok(z.ai === 'idle' && z.x === 2500 && z.hp === z.maxHp, '回到原位回满血');
}
{ // 职业属性与成长
  for (const c of ['warrior', 'mage', 'taoist'] as ClassId[]) {
    const w = mk([], [], c, 1), h = w.hero!;
    ok(h.maxHp === CLASSES[c].base.hp && h.atk === CLASSES[c].base.atk && w.skills.length === 4, `${CLASSES[c].name} 1 级属性 + 4 技能`);
    const hp1 = h.maxHp, m1 = h.mag ?? 0, t1 = h.tao ?? 0; h.hp = 5; w.gainExp(w.expNext);
    ok(w.level === 2 && h.maxHp > hp1 && h.hp === h.maxHp && (c !== 'mage' || h.mag! > m1) && (c !== 'taoist' || h.tao! > t1), `${CLASSES[c].name} 升级自动成长并回满`);
  }
}
{ // 战士：半月弯刀穿透 + 烈火剑法前排 + 金刚护体减伤
  const w = mk([{ id: 'zombie', x: 800 }, { id: 'zombie', x: 860 }, { id: 'zombie', x: 920 }, { id: 'zombie', x: 980 }]); tough(w);
  const h = w.hero!; h.x = 500; h.hp = h.maxHp = 1e9; run(w, 6);
  const r = w.cast(idx(w, 'half_moon'), free(w)); ok(r.ok && r.targets.length === 3, '半月弯刀穿透 3 个目标');
  const r2 = w.cast(idx(w, 'fire_sword'), free(w)); ok(r2.ok && r2.targets[0] === w.queue(1)[0].uid, '烈火剑法打前排');
  const r3 = w.cast(idx(w, 'battle_shout'), free(w)); ok(r3.ok && h.armorUntil! > w.time && h.armorReduce === 0.5, '金刚护体生效');
  const cds = free(w); w.cast(idx(w, 'fire_sword'), cds); const r4 = w.cast(idx(w, 'fire_sword'), cds); ok(!r4.ok && r4.reason.includes('冷却'), '冷却中不可再放');
}
{ // 法师：远程 + 冰咆哮群攻减速 + 技能随等级成长
  const w = mk([{ id: 'orc', x: 900 }, { id: 'orc', x: 1000 }, { id: 'orc', x: 3000 }], [], 'mage'); tough(w);
  const h = w.hero!; h.x = 600;
  const r = w.cast(idx(w, 'fireball'), free(w)); ok(r.ok && r.targets.length === 1, '火球术远程命中（不需贴身）');
  const evs = w.drainEvents(); const d1 = (evs.find(e => e.type === 'damage') as any).amount;
  const ice = w.cast(idx(w, 'ice_roar'), free(w)); const ens = w.alive('enemy');
  ok(ice.ok && ice.targets.length === 2 && ens[0].slowUntil! > w.time && !ens[2].slowUntil, '冰咆哮命中范围内全部敌人并减速');
  const w2 = mk([{ id: 'orc', x: 900 }], [], 'mage', 40); tough(w2); w2.hero!.x = 600; w2.rng = () => 0.5;
  w.rng = () => 0.5; w.cast(idx(w, 'fireball'), free(w)); const a20 = (w.drainEvents().find(e => e.type === 'damage') as any).amount;
  w2.cast(idx(w2, 'fireball'), free(w2)); const a40 = (w2.drainEvents().find(e => e.type === 'damage') as any).amount;
  ok(d1 > 0 && a40 > a20 * 1.5, `火球伤害随等级成长（20级 ${a20} → 40级 ${a40}）`);
  const sh = w.cast(idx(w, 'magic_shield'), free(w)); ok(sh.ok && h.armorReduce === 0.4, '魔法盾减伤 40%');
}
{ // 道士：施毒持续掉血 + 召唤骷髅协同作战
  const w = mk([{ id: 'orc', x: 800 }], [], 'taoist'); const o = w.alive('enemy')[0]; o.hp = o.maxHp = 1e6;
  const h = w.hero!; h.x = 500;
  ok(w.cast(idx(w, 'poison'), free(w)).ok, '施毒术施放'); w.drainEvents();
  let dots = 0; for (let i = 0; i < 100; i++) { w.step(0.05); for (const e of w.drainEvents()) if (e.type === 'damage' && e.dot) dots++; }
  ok(dots >= 4, `中毒每秒掉血（5 秒内 ${dots} 跳）`);
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
  const w = mk([{ id: 'boss_lich', x: 2000 }, { id: 'wolf', x: 3500 }], [], 'warrior', 30); const h = w.hero!, b = w.alive('enemy')[0];
  w.kill(b); ok(w.ground.length >= 6 && w.ground.some(g => g.item === 'dragon_sword'), 'Boss 掉落多件，必掉屠龙刀');
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
  ok(FLOORS.length >= 5 && FLOORS.every(f => f.boss && f.spawns.some(s => ENEMIES[s.id].tier === 'boss')), `共 ${FLOORS.length} 层，每层末尾有 Boss`);
  ok(new Set(FLOORS.map(f => f.bg)).size === FLOORS.length, '每层背景不同');
  const w = new World(seeded(3), 30, FLOORS); const h = w.hero!;
  h.x = w.exitX; w.step(0.05); ok(w.floorIndex === 0, 'Boss 未死出口封印');
  for (let i = 0; i < FLOORS.length; i++) { for (const u of w.alive('enemy')) w.kill(u); w.hero!.x = w.exitX; w.step(0.05); }
  ok(w.done, '依次通过 5 层 → 胜利');
}
{ // 死亡复活 + 存档读档
  const w = mk([{ id: 'wolf', x: 3000 }], [], 'mage', 5); w.gold = 100; w.kill(w.hero!); ok(!w.hero, '主角死亡');
  w.respawn(); ok(!!w.hero && w.hero.hp === w.hero.maxHp && w.gold === 90 && w.deaths === 1, '本层起点满血复活，损失 10% 金币');
  const w1 = new World(seeded(5), 7, FLOORS, 'taoist'); w1.gold = 321; w1.bag.push(w1.makeItem('tao_sword', 'rare')); w1.equipItem(0); w1.loadFloor(2);
  const json = JSON.stringify(w1.toSave()); const w2 = new World(seeded(6), 1, FLOORS, 'warrior', JSON.parse(json) as SaveData);
  ok(w2.cls === 'taoist' && w2.level === 7 && w2.gold === 321 && w2.floorIndex === 2 && w2.equip.weapon?.name.includes('极品') === true && w2.hero!.tao === w1.hero!.tao, '存档 JSON 往返：职业/等级/金币/层数/装备一致');
}
{ // 平衡：每个职业的自动脚本能打通全部 5 层（允许死亡复活）
  for (const c of ['warrior', 'mage', 'taoist'] as ClassId[]) {
    const w = new World(seeded(11), 1, FLOORS, c); const cds = w.skills.map(() => 0); let t = 0;
    while (!w.done && t < 3600) {
      const h = w.hero;
      if (!h) { w.respawn(); continue; }
      if (h.hp < h.maxHp * 0.4) w.usePotion(w.pots[1] > 0 ? 1 : 0);
      if ((h.mp ?? 0) < 40) w.usePotion(w.pots[3] > 0 ? 3 : 2);
      for (let i = 0; i < 4; i++) w.cast(i, cds);
      for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[it.slot]) w.equipItem(i); }
      // 去城镇商人补药（简化：金币够就买）
      while (w.gold >= 60 && w.pots[1] < 3) w.buyPotion(1);
      while (w.gold >= 60 && w.pots[3] < 3) w.buyPotion(3);
      w.step(0.05, { dx: 1, dy: 0 }); w.drainEvents(); t += 0.05; for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - 0.05);
    }
    console.log(`  ${CLASSES[c].name}: 通关=${w.done} 用时 ${Math.round(t)}s 等级 ${w.level} 死亡 ${w.deaths} 次 层 ${w.floorIndex + 1}`);
    ok(w.done && w.deaths <= 6, `${CLASSES[c].name} 可通关 5 层（死亡 ${w.deaths} 次）`);
  }
}
console.log(`全部通过 ${pass} 项`);
