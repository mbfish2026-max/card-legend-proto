// 「第一章看得到的怪打完，还有一些看不到的怪在攻击我」回归：幽暗森林是 farm 图，小怪死后原地刷新，刷新不发 summon 事件。
// 模拟场景只按事件建卡（修复前），打完屏幕内的怪后等刷新怪追击；断言修复后的对账（foesWithoutView）补齐所有攻击者，
// 且攻击者都落在手机相机可视范围内（逻辑宽 1561=932×430、2016=上限；相机以主角为中心，死区 ±160）。
import { World } from '../src/combat/World';
import { FLOORS, WORLD, FARM_RESPAWN } from '../src/data/world';
import { foesWithoutView } from '../src/ui/foeViews';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
ok(!!FLOORS[0].farm && FLOORS[0].name === '幽暗森林', '第一张图幽暗森林是练级刷新图');
for (const lw of [1280, 1561, 2016]) {
  const w = new World(seeded(7), 12, FLOORS, 'warrior'); w.loadFloor(0);
  const views = new Set<number>(); const fromEvents = () => { for (const e of w.drainEvents() as any[]) { if (e.type === 'summon') views.add(e.uid); if (e.type === 'death') views.delete(e.uid); } };
  w.alive('enemy').forEach(u => views.add(u.uid)); fromEvents();
  const h = w.hero!; const camL = () => Math.max(0, Math.min(WORLD.mapWidth - lw, h.x - lw / 2)), camR = () => camL() + lw;
  // 打完屏幕内可见的怪
  for (const u of w.alive('enemy')) if (u.x < camR()) w.kill(u); fromEvents();
  h.x = 380; const t0 = w.time;
  let attackers: number[] = [];
  for (let t = 0; t < FARM_RESPAWN + 12 && !attackers.length; t += 0.05) { w.step(0.05, { dx: 0, dy: 0 }); fromEvents(); h.x = 380; h.hp = h.maxHp;
    attackers = w.alive('enemy').filter(u => u.ai === 'alert' || u.ai === 'chase' || Math.abs(u.x - h.x) <= WORLD.aggroRange).map(u => u.uid); }
  ok(w.time - t0 >= FARM_RESPAWN - 0.1 && attackers.length > 0, `lw=${lw} 刷新怪已仇恨主角（${attackers.length} 只）`);
  const invisibleBefore = attackers.filter(uid => !views.has(uid));
  ok(invisibleBefore.length > 0, `lw=${lw} 复现：仅按事件建卡时 ${invisibleBefore.length} 只攻击者没有卡牌`);
  foesWithoutView(w, uid => views.has(uid)).forEach(u => views.add(u.uid));
  ok(attackers.every(uid => views.has(uid)), `lw=${lw} 对账后所有攻击者都有卡牌`);
  ok(w.alive('enemy').filter(u => attackers.includes(u.uid)).every(u => u.x >= camL() && u.x <= camR()), `lw=${lw} 攻击者 x=${w.alive('enemy').filter(u => attackers.includes(u.uid)).map(u => Math.round(u.x))} 都在相机 [${camL()},${camR()}] 内`);
  ok(foesWithoutView({ town: 'bichi', alive: () => w.alive('enemy') }, () => false).length === 0, `lw=${lw} 城内不建怪物卡`);
}
console.log(`invisible-attackers: ${pass} passed`);
