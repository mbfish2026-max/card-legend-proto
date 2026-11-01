// feat/set-fx：圣战/法神/天尊 4 件特效（docs/set-fx.md）
declare const process: { exit(c: number): never };
import { World, CRIT_CHANCE, SET_FX } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { SET_SPECIALS } from '../src/data/eg-sets';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } pass++; console.log('ok', m); };
const SLOTS = [['helmet', 'helm'], ['necklace', 'necklace'], ['ring1', 'ring'], ['bracelet1', 'bracelet']] as const;
const wear = (w: World, set: string, n = 4) => { for (const [k, p] of SLOTS.slice(0, n)) w.equip[k] = w.makeItem(`${set}_${p}`); };
const dummy = (w: World): any => { const t: any = { uid: 9999, id: 'dummy', team: 'enemy', alive: true, hp: 1e9, maxHp: 1e9, x: 0, y: 0, width: 50, ai: 'chase', level: 1 }; w.units.push(t); return t; };
const mk = (c: any) => { const w = new World(() => 0.5, 50, FLOORS, c); w.step(0.05); w.drainEvents(); return w; };

// ── 圣战 4 件
{
  const w = mk('warrior'), c0 = w.critChance();
  wear(w, 'shengzhan', 3); ok(!w.hasSpecial('shengzhan4') && w.critChance() === c0, '圣战 3 件：不生效');
  wear(w, 'shengzhan', 4); ok(w.hasSpecial('shengzhan4') && Math.abs(w.critChance() - c0 - 0.05) < 1e-9, `圣战 4 件：暴击率 +5%（${c0.toFixed(3)}→${w.critChance().toFixed(3)}）`);
  const t = dummy(w), h = w.hero!; (w as any).rng = () => 0;
  const d4 = w.damage(t, 100, h, true, false, true);
  w.equip.ring1 = null as any; const d3 = w.damage(t, 100, h, true, false, true);
  ok(d3 === 180 && d4 === 220, `暴击伤害：额外部分 ×1.5（1.8→2.2）：${d3}→${d4}；脱件即取消`);
  ok(Math.abs(w.critChance() - c0) < 1e-9, '脱件：暴击率恢复');
  wear(w, 'shengzhan'); ok(w.setSpecials().filter(x => x === 'shengzhan4').length === 1, '特效不重复');
  // 非主角来源不受影响
  const sm: any = { uid: 8888, summon: true, team: 'hero', alive: true }; ok(w.damage(t, 100, sm, true, false, true) === 180, '非主角暴击仍 1.8');
}
// ── 法神 4 件
{
  const w = mk('mage'), h = w.hero!; for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  const sk = w.skills.find(s => s.mana >= 10)!;
  ok(w.manaCost(sk) === sk.mana, '法神未穿：原耗魔');
  wear(w, 'fashen'); ok(w.manaCost(sk) === Math.ceil(sk.mana * 0.9), `法神 4 件：${sk.name} ${sk.mana}→${w.manaCost(sk)}（向上取整）`);
  ok(w.manaCost({ mana: 1 }) === 1 && w.manaCost({ mana: 5 }) === 5 && w.manaCost({ mana: 11 }) === 10 && w.manaCost({ mana: 0 }) === 0, '取整规则：1→1(最低1)、5→5(4.5↑)、11→10；0 耗魔仍为 0');
  for (const u of w.units) if (u.team === 'enemy') u.alive = false;
  const i = w.skills.findIndex(s => (s as any).kind === 'buff' || (s as any).reduce);
  if (i >= 0) { h.mp = 1000; const need = w.manaCost(w.skills[i]); const r = w.cast(i, w.skills.map(() => 0)); ok(!r.ok || h.mp === 1000 - need, `施放扣魔 = 折后 ${need}（${r.ok ? '已施放' : r.reason}）`);
    h.mp = need; (w as any).hero.armorUntil = 0; const r2 = w.cast(i, w.skills.map(() => 0)); ok(r2.ok || r2.reason !== '魔法值不足', '魔量 = 折后耗魔即可施放'); }
  w.unequip('helmet'); ok(w.manaCost(sk) === sk.mana, '脱件：耗魔恢复');
}
// ── 天尊 4 件
{
  const w = mk('taoist'), h = w.hero!, t = dummy(w);
  const sm: any = { uid: 7777, summon: true, team: 'hero', alive: true, isHero: false };
  const s0 = w.damage(t, 100, sm, false, false, true); h.hp = 1; w.heal(h, 100); const h0 = h.hp - 1;
  wear(w, 'tianzun', 3); ok(w.damage(t, 100, sm, false, false, true) === s0, '天尊 3 件：召唤物伤害不变');
  wear(w, 'tianzun');
  ok(w.damage(t, 100, sm, false, false, true) === Math.round(s0 * 1.1), `天尊 4 件：召唤物伤害 +10%（${s0}→${Math.round(s0 * 1.1)}）`);
  h.hp = 1; w.heal(h, 100); ok(h.hp - 1 === Math.round(h0 * 1.1), `治疗 +10%（${h0}→${h.hp - 1}）`);
  h.hp = 1; w.heal(h, 100, false); ok(h.hp - 1 === 100, '药水（boost=false）不加成');
  const e: any = { uid: 6666, team: 'enemy', alive: true, hp: 1, maxHp: 1000, x: 0 }; w.heal(e, 100); ok(e.hp === 101, '敌方被治疗不加成');
  ok(w.damage(t, 100, h, false, false, true) === 100, '主角自身伤害不受天尊影响');
  // 读档刷新
  const sv = JSON.parse(JSON.stringify(w.toSave())), re = new World(() => 0.5, 1, FLOORS, 'taoist', sv);
  ok(re.hasSpecial('tianzun4'), '读档：特效仍生效');
  re.unequip('ring1'); ok(!re.hasSpecial('tianzun4'), '读档后脱件：特效取消');
}
ok(Object.values(SET_SPECIALS).every(s => !/待战斗开发/.test(s.text)), '套装描述已同步（无「待战斗开发」）');
ok(SET_FX.shengzhanCrit === 0.05 && SET_FX.shengzhanCritDmg === 1.5 && SET_FX.fashenMana === 0.1 && SET_FX.tianzunSummon === 0.1 && SET_FX.tianzunHeal === 0.1 && CRIT_CHANCE === 0.15, '数值 = 用户指定');
console.log(`set-fx: ${pass} 项通过`);
