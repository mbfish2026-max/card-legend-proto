// 传世 16 技能 + 金甲骷髅：学习条件 / 耗魔 / 效果 / 自动 / 点击 / 召唤等级 / 旧存档
import { World, SaveData, SUMMON_NAME_COLORS } from '../src/combat/World';
import { CLASSES, ClassId, SkillDef } from '../src/data/classes';
import { BOOKS } from '../src/data/books';
import { ITEMS } from '../src/data/items';
import { Settings, DEFAULT_AUTO_SKILLS } from '../src/settings';
// @ts-ignore node
import { existsSync } from 'node:fs';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const CS: Record<ClassId, string[]> = {
  warrior: ['thunder_sword', 'break_strike', 'shield_break', 'vajra_body', 'dash_slash'],
  mage: ['ice_arrow', 'ice_dragon', 'frost_blade', 'five_thunder', 'ice_whirl'],
  taoist: ['drive_corpse', 'decoy_talisman', 'soul_wall', 'clear_mind', 'holy_light', 'cleanse', 'summon_golden_skeleton'],
} as any;
const sk = (c: ClassId, id: string) => CLASSES[c].skills.find(s => s.id === id)!;
const mkW = (c: ClassId, lv: number, spawns: any[] = [{ id: 'zombie', x: 700 }, { id: 'zombie', x: 760 }, { id: 'zombie', x: 820 }]) => {
  const w = new World(seeded(5), lv, [{ name: 't', spawns }], c); w.hero!.x = 600; for (const e of w.alive('enemy')) { e.hp = e.maxHp = 1e6; e.ai = 'chase'; }
  return w;
};
const hpSum = (w: World) => w.alive('enemy').reduce((a, e) => a + e.hp, 0);
for (const c of Object.keys(CS) as ClassId[]) for (const id of CS[c]) {
  const s = sk(c, id); const L0 = s.learn![0];
  ok(!!s && s.cs === true && !!BOOKS[id]?.cs && BOOKS[id].cls === c && !BOOKS[id].shop && BOOKS[id].drops.length === 0, `${s.name}：传世秘籍书存在、不进普通书店/掉落池`);
  ok(existsSync('public/' + s.icon.replace(/^.*?assets\//, 'assets/')) || existsSync(s.icon.replace(/^\//, 'public/')) || existsSync('public/assets/skills/skill_' + id + '.png') || id === 'summon_golden_skeleton', `${s.name}：图标文件存在`);
  if (id !== 'summon_golden_skeleton') ok(existsSync(`public/assets/skills/skill_${id}@2x.png`), `${s.name}：@2x 图标`);
  // 学习条件
  const lo = mkW(c, L0 - 1); lo.gold = 1e6; ok(lo.buyBook(id) === null, `${s.name}：可在传世秘籍购买`);
  const bi = lo.bag.findIndex(x => ITEMS[x.item]?.book === id); ok(lo.learnBook(bi).includes(`需等级 ${L0}`), `${s.name}：${L0 - 1} 级不能学`);
  const w = mkW(c, Math.max(s.learn![3], 45)); w.gold = 1e6; w.buyBook(id); const r = w.learnBook(w.bag.findIndex(x => ITEMS[x.item]?.book === id));
  ok(r.startsWith('学会'), `${s.name}：达到等级可学（${r}）`);
  ok(w.skillLevel(s) === 0, `${s.name}：初学 0 级`);
  w.skillTrain[id] = 99999; ok(w.skillLevel(s) === 3, `${s.name}：修炼点满 + 等级足 → 3 级`);
  if (s.passive) {
    ok(w.skills.every(k => k.id !== id), `${s.name}：被动不上快捷栏`);
    const m0 = new World(seeded(5), 45, [{ name: 't', spawns: [] }], c).clearMindMult(); let sum = 0; for (let i = 0; i < 4000; i++) sum += w.clearMindMult();
    ok(m0 === 1 && Math.abs(sum / 4000 - 1.2) < 0.04, `${s.name}：3 级经验翻倍期望 ×1.2（实测 ${(sum / 4000).toFixed(3)}）`);
    continue;
  }
  const h = w.hero!; h.mp = h.maxMp = 99999; if (id === 'decoy_talisman' || id === 'cleanse') h.hp = h.maxHp * 0.5;
  const i = w.skills.findIndex(k => k.id === id), cds = w.skills.map(() => 0), mp0 = h.mp, hp0 = hpSum(w);
  const cr = w.cast(i, cds);
  ok(cr.ok, `${s.name}：点击/F 键施放成功${cr.ok ? '' : '（' + (cr as any).reason + '）'}`);
  ok(mp0 - h.mp === w.skills[i].mana, `${s.name}：耗魔 ${w.skills[i].mana}`);
  // 效果
  const dmg = hp0 - hpSum(w), E = w.alive('enemy');
  if (['thunder_sword', 'break_strike', 'shield_break', 'dash_slash', 'ice_arrow', 'ice_dragon', 'frost_blade', 'five_thunder', 'ice_whirl', 'holy_light'].includes(id)) ok(dmg > 0, `${s.name}：造成伤害 ${Math.round(dmg)}`);
  if (id === 'vajra_body') ok((h.defUp ?? 0) > 0 && (h.mdefUp ?? 0) > 0, `${s.name}：同时加防御与魔御`);
  if (id === 'ice_arrow') ok(E.some(e => (e.slowUntil ?? 0) > w.time), `${s.name}：减速`);
  if (id === 'dash_slash') ok(E[0].x > 700, `${s.name}：推开目标（${Math.round(E[0].x)}）`);
  if (id === 'five_thunder' || id === 'frost_blade') ok(E.filter(e => e.hp < 1e6).length >= 2, `${s.name}：群体伤害`);
  if (id === 'soul_wall') ok(E.filter(e => (e.stunUntil ?? 0) > w.time).length >= 2, `${s.name}：定身区域内怪物`);
  if (id === 'decoy_talisman') ok(!!w.decoy && E.filter(e => Math.abs(e.x - h.x) < 600).every(e => w.summonAggro(e) === w.decoy), `${s.name}：生成替身并吸引仇恨`);
  if (id === 'drive_corpse' || id === 'summon_golden_skeleton') {
    const u = w.summon!; ok(!!u && u.id === id.replace('drive_corpse', 'summon_corpse') && u.sLv === 3, `${s.name}：召唤物等级 = 技能等级 3（${u?.id} sLv ${u?.sLv}）`);
    ok(SUMMON_NAME_COLORS.length >= 4, `${s.name}：等级名色表`);
  }
  if (id === 'cleanse') { h.poisonUntil = w.time + 99; w.skillTrain[id] = 99999; let n = 0; for (let k = 0; k < 20 && (h.poisonUntil ?? 0) > w.time; k++) { const cc = w.skills.map(() => 0); w.cast(i, cc); n++; } ok((h.poisonUntil ?? 0) <= w.time, `${s.name}：解除中毒（${n} 次）`); }
  // 自动释放
  ok(DEFAULT_AUTO_SKILLS[c].includes(id), `${s.name}：在默认自动技能列表`);
  const w2 = mkW(c, 50); w2.learned.add(id); w2.skillTrain[id] = 99999; const h2 = w2.hero!; h2.mp = h2.maxMp = 99999; if (id === 'decoy_talisman' || id === 'cleanse') h2.hp = h2.maxHp * 0.5;
  const ar = w2.autoCast([id], w2.skills.map(() => 0)); ok(ar?.id === id, `${s.name}：自动释放`);
}
{ // 金甲骷髅：升级变色 + 强于普通骷髅
  const w = mkW('taoist', 45, [{ id: 'zombie', x: 2000 }]); w.learned.add('summon_skeleton'); w.learned.add('summon_golden_skeleton'); w.hero!.mp = w.hero!.maxMp = 9999;
  w.cast(w.skills.findIndex(k => k.id === 'summon_skeleton'), w.skills.map(() => 0)); const sk0 = { ...w.summon! };
  w.cast(w.skills.findIndex(k => k.id === 'summon_golden_skeleton'), w.skills.map(() => 0)); const gs = w.summons, g = gs[0];
  ok(gs.length === 2 && gs.every(u => u.id === 'summon_golden_skeleton'), `金甲骷髅一次召唤 2 只并解散骷髅（${gs.map(u => u.id)}）`);
  const tH = gs[0].maxHp + gs[1].maxHp, tA = gs[0].atk + gs[1].atk;
  ok(g.maxHp > sk0.maxHp && tA > sk0.atk && tA < sk0.atk * 2 && tH < sk0.maxHp * 2.5, `金甲骷髅合计强于骷髅但不过强（单只 HP ${g.maxHp} 攻 ${g.atk}；合计 HP ${tH}/攻 ${tA} vs 骷髅 ${sk0.maxHp}/${sk0.atk}）`);
  ok(gs[0].sLv === gs[1].sLv && gs[0].sLv === w.skillLevel(sk('taoist', 'summon_golden_skeleton')!), '两只等级 = 技能等级');
  ok(gs.every(u => w.summonAggro !== undefined) && Math.abs(gs[0].x - gs[1].x) > 0, '两只错位站位');
  ok(g.card?.tint === 0xffd040, '金甲骷髅金色底色');
  const l0 = g.sLv ?? 0, c0 = g.nameColor, hp0 = g.maxHp; g.sKills = 1e6; w.kill(w.alive('enemy')[0]); ok((g.sLv ?? 0) > l0 && g.nameColor !== c0 && g.maxHp > hp0, `金甲骷髅击杀升级变色（${l0}→${g.sLv}，${c0}→${g.nameColor}，HP ${hp0}→${g.maxHp}）`);
  // 上限 2：再召唤替换最旧
  const gi = w.skills.findIndex(k => k.id === 'summon_golden_skeleton'), old = [...w.summons].sort((a, b) => a.uid - b.uid);
  w.cast(gi, w.skills.map(() => 0)); const now = w.summons;
  ok(now.length === 2 && !now.includes(old[0]) && now.includes(old[1]), `再召唤：仍 2 只，替换最旧（uid ${old[0].uid}）`);
  old[1].alive = false; w.cast(gi, w.skills.map(() => 0)); ok(w.summons.length === 2, '死 1 只后再召唤补足到 2 只');
  // autoCast：健康 2 只不重放；1 只 / 2 只受伤则重放
  const ar = () => w.autoCast(['summon_golden_skeleton'], w.skills.map(() => 0))?.id;
  ok(ar() === undefined, '健康 2 只存在：autoCast 不重放');
  w.summons[0].alive = false; ok(ar() === 'summon_golden_skeleton' && w.summons.length === 2, '只剩 1 只：autoCast 补召');
  w.summons[1].hp = 1; ok(ar() === 'summon_golden_skeleton', '有 1 只重伤：autoCast 重放（替换最旧）');
}
{ // 旧存档兼容：无 learned 的旧档不会自动学会传世技能；有 learned 的旧档原样
  const m = new World(seeded(3), 50, [{ name: 't', spawns: [] }], 'taoist');
  ok(![...m.learned].some(id => sk('taoist', id)?.cs), '新开 50 级道士不自动学传世技能');
  const legacy = { ...m.toSave(), learned: undefined } as SaveData; const m2 = new World(seeded(3), 1, [{ name: 't', spawns: [] }], 'taoist', legacy);
  ok(![...m2.learned].some(id => sk('taoist', id)?.cs), '旧存档（无 learned）不自动学传世技能');
  m2.learned.add('summon_golden_skeleton'); const m3 = new World(seeded(3), 1, [{ name: 't', spawns: [] }], 'taoist', JSON.parse(JSON.stringify(m2.toSave())));
  ok(m3.learned.has('summon_golden_skeleton'), '传世技能写入存档并可读回');
  ok(Settings.skillsFor('taoist').includes('summon_golden_skeleton'), '设置默认自动列表含金甲骷髅');
}
console.log(`全部通过 ${pass} 项`);
