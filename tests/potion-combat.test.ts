// feat/potion-combat P4：按药水栏选中格用药；太阳水瞬回 + 独立冷却；强效药走 HoT；红/蓝/太阳冷却互不影响
import { World } from '../src/combat/World';
import { WORLD } from '../src/data/world';
import { POTIONS } from '../src/data/skills';
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const I = (it: string) => POTIONS.findIndex(p => p.item === it);
const mk = () => { const w = new World(() => 0.5, 40); w.leaveTown?.(0); const h = w.hero!; h.maxHp = 2000; h.maxMp = 2000; h.hp = 100; h.mp = 100; for (let i = 0; i < w.pots.length; i++) w.pots[i] = 5; return w; };
const run = (w: World, s: number) => { for (let i = 0; i < Math.round(s / 0.05); i++) w.step(0.05); };
// 数值（§1.1）
ok(POTIONS[I('hp_big')].hp === 560 && !POTIONS[I('hp_big')].instant, '强效金创药 HP560 HoT');
ok(POTIONS[I('mp_big')].mp === 900 && !POTIONS[I('mp_big')].instant, '强效魔法药 MP900 HoT');
ok(POTIONS[I('sun')].hp === 180 && POTIONS[I('sun')].mp === 240 && !!POTIONS[I('sun')].instant, '太阳水 HP180+MP240 瞬回');
ok(POTIONS[I('sun_big')].hp === 300 && POTIONS[I('sun_big')].mp === 480 && !!POTIONS[I('sun_big')].instant, '强效太阳水 HP300+MP480 瞬回');
// 选中格
{ const w = mk(); ok(w.setSelectedPotion(0, 'hp_big'), '红格选强效'); ok(w.usePotionSlot(0) !== null && w.pots[I('hp_big')] === 4 && w.pots[I('hp_small')] === 5, '红格用的是选中的强效金创药');
  ok((w.hero!.hots?.length ?? 0) === 1 && w.hero!.hp < 200, '强效金创药是 HoT（不立刻回）');
  ok(w.setSelectedPotion(1, 'mp_mid') && w.usePotionSlot(1) !== null && w.pots[I('mp_mid')] === 4, '蓝格用选中的中蓝');
  ok(w.usePotionSlot(2) !== null && w.pots[I('sun')] === 4, '太阳水格默认 = 太阳水'); }
// 瞬回 + 独立冷却
{ const w = mk(), h = w.hero!; const hp0 = h.hp, mp0 = h.mp ?? 0; ok(w.usePotion(I('sun')) !== null, '喝太阳水');
  ok(h.hp === hp0 + 180 && h.mp === mp0 + 240, `太阳水立刻 +180/+240（${h.hp - hp0}/${(h.mp ?? 0) - mp0}）`); ok(!(h.hots?.length), '太阳水不产生 HoT');
  ok(w.usePotion(I('sun_big')) === null, '太阳冷却内不能再喝强效太阳水'); ok(w.potionCooldown(I('sun')) > 0.9, 'potionCooldown 读 sunReady');
  ok(w.usePotion(I('hp_mid')) !== null, '太阳冷却不挡红药'); ok(w.usePotion(I('mp_mid')) !== null, '太阳冷却不挡蓝药');
  ok(w.usePotion(I('hp_small')) === null, '红药自身 1s 冷却仍在');
  run(w, WORLD.potCd + 0.05); const a = h.hp; ok(w.usePotion(I('sun_big')) !== null && h.hp === Math.min(h.maxHp, a + 300), '1s 后可喝强效太阳水 +300'); }
{ const w = mk(), h = w.hero!; w.usePotion(I('hp_mid')); w.usePotion(I('mp_mid')); ok(w.usePotion(I('sun')) !== null, '红蓝冷却中仍可喝太阳水'); }
{ const w = mk(), h = w.hero!; h.hp = h.maxHp; h.mp = h.maxMp; ok(w.usePotion(I('sun')) === null && w.pots[I('sun')] === 5, '满血满蓝不喝太阳水、不扣瓶'); h.hp = h.maxHp - 50; ok(w.usePotion(I('sun')) !== null && h.hp === h.maxHp, '瞬回封顶 maxHp'); }
{ const w = mk(); w.pots[I('sun')] = 0; ok(w.usePotionSlot(2) === null, '没药不喝'); }
// HoT 回归：强效 560 在 potHotSec 内到账
{ const w = mk(), h = w.hero!; const hp0 = h.hp; w.usePotion(I('hp_big')); run(w, 1); ok(h.hp - hp0 >= 560 && !(h.hots?.length), `强效金创药 1s 内到账 560（+${h.hp - hp0}）`); }
// 城内瞬回
{ const w = new World(() => 0.5); w.startInVillage(); w.pots[I('sun')] = 1; const h = w.hero!; h.hp = 10; ok(w.usePotion(I('sun')) !== null && h.hp === Math.min(h.maxHp, 190), '城内太阳水瞬回'); }
console.log(`potion-combat: ${n - fail}/${n}`); if (fail) { console.log('potion-combat: FAILED'); (globalThis as any).process.exit(1); } else console.log('potion-combat: all passed');
