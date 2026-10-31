import { SWING_SCALE, WINDUP_SCALE, HIT_SCALE, breathScaleY } from '../src/ui/cardMotion';
import { SUMMON, SUMMON_BEAST, SUMMON_CORPSE, SUMMON_GOLDEN, DECOY } from '../src/data/units';
import { bookItemId } from '../src/data/books';
import { SKILL_BOOK_DROPS } from '../src/data/skillBookDrops';
import { ENEMIES } from '../src/data/units';
import { FLOORS } from '../src/data/world';
import { fmtInt, fmtText } from '../src/ui/fmt';
// 传世 16 技能 + 金甲骷髅：学习条件 / 耗魔 / 效果 / 自动 / 点击 / 召唤等级 / 旧存档
import { World, SaveData, SUMMON_NAME_COLORS } from '../src/combat/World';
import { CLASSES, ClassId, SkillDef } from '../src/data/classes';
import { BOOKS } from '../src/data/books';
import { ITEMS } from '../src/data/items';
import { Settings, DEFAULT_AUTO_SKILLS } from '../src/settings';
// @ts-ignore node
import { existsSync, readFileSync } from 'node:fs';
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
  const lo = mkW(c, L0 - 1); lo.gold = 1e6; ok(lo.bookLv(BOOKS[id]) <= 25 ? lo.buyBook(id) === null : lo.buyBook(id) !== null, `${s.name}：R54 ≤25 级书店可买 / >25 级书店不卖（BOSS 掉落）`); lo.bag.length = 0; lo.bag.push(lo.makeItem(bookItemId(id)));
  const bi = lo.bag.findIndex(x => ITEMS[x.item]?.book === id); ok(lo.learnBook(bi).includes(`需等级 ${L0}`), `${s.name}：${L0 - 1} 级不能学`);
  const w = mkW(c, Math.max(s.learn![3], 45)); w.gold = 1e6; w.bag.push(w.makeItem(bookItemId(id))); const r = w.learnBook(w.bag.findIndex(x => ITEMS[x.item]?.book === id));
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
{ // R54：书店出售本职业全部 ≤25 级技能书（按等级升序），>25 传世书在秘籍页；技能面板按学习等级升序
  for (const c of ['warrior', 'mage', 'taoist'] as const) {
    const w = new World(seeded(5), 50, [{ name: 't', spawns: [] }], c); w.gold = 1e7; w.learned.clear();
    const lv = (b: { skill: string }) => w.needLevel(w.skillPool.find(x => x.id === b.skill)!);
    const want = Object.values(BOOKS).filter(b => b.cls === c && lv(b) <= 25).map(b => b.skill).sort();
    const got = w.shopBooks(); ok(JSON.stringify(got.map(b => b.skill).sort()) === JSON.stringify(want), `${c} 书店含全部 ≤25 级书（${got.map(b => b.skill)}）`);
    ok(got.every((b, i) => i === 0 || lv(got[i - 1]) <= lv(b)), `${c} 书店按学习等级升序`);
    for (const b of got) { w.bag.length = 0; ok(w.buyBook(b.skill) === null, `${c} 可购买 ${b.skill}（Lv${lv(b)}，${b.price} 金）`); }
    ok(w.csBooks().every(b => lv(b) > 25), `${c} 传世秘籍页只剩 >25 级`);
    const sl = w.skillsByLevel(); ok(sl.length === w.skillPool.length && sl.every((k, i) => i === 0 || w.needLevel(sl[i - 1]) <= w.needLevel(k)), `${c} 技能面板按学习等级升序`);
  }
  for (const id of ['poison', 'soul_fire', 'drive_corpse', 'decoy_talisman', 'ghost_shield', 'holy_armor', 'ice_arrow']) ok(Object.values(BOOKS).some(b => b.skill === id), id);
  ok(['poison', 'soul_fire'].every(id => BOOKS[id].drops.length > 0), '≤25 书仍保留掉落池（未移除）');
}
{ // R54：技能数值显示只显示整数（四舍五入）
  ok(fmtInt(2.5) === '3' && fmtInt(1.4) === '1' && fmtInt(12) === '12' && fmtInt(-0.2) === '0', 'fmtInt 四舍五入');
  ok(fmtText('倍率 3.0') === '倍率 3' && fmtText('减速 1.5s') === '减速 2s' && fmtText('骷髅 ×1.25') === '骷髅 ×1' && fmtText('+37.6') === '+38', 'fmtText 去小数');
  for (const c of ['warrior', 'mage', 'taoist'] as const) for (const k of new World(seeded(1), 50, [{ name: 't', spawns: [] }], c).skillPool) ok(!/\d\.\d/.test(fmtText(`${k.desc} 耗魔${fmtInt(k.mana)} 冷却${fmtInt(k.cooldown)}s`)), `${k.name} 显示文本无小数`);
  const tw = new World(seeded(1), 50, [{ name: 't', spawns: [] }], 'taoist'); const heal = tw.skillPool.find(k => k.id === 'heal')!;
  ok(fmtText(`+${heal.mult ?? 1.37}`) .indexOf('.') < 0, '治愈术飘字无小数');
}
{ // R54：>25 级书不进商店，全部有 BOSS 来源；26–35 尸王掉率最高；书等级与 BOSS 所在层等级匹配；真实掉落接入
  for (const c of ['warrior', 'mage', 'taoist'] as const) {
    const w = new World(seeded(5), 50, [{ name: 't', spawns: [] }], c), lv = (b: { skill: string }) => w.bookLv(BOOKS[b.skill]);
    ok(w.shopBooks().every(b => lv(b) <= 25) && w.csBooks().length === 0, `${c} 商店没有 >25 级书`);
    for (const b of Object.values(BOOKS).filter(b => b.cls === c && lv(b) > 25)) {
      const d = SKILL_BOOK_DROPS.find(x => x.skill === b.skill); ok(!!d && d.src.length > 0 && d.lv === lv(b), `${b.skill}(Lv${lv(b)}) 有 BOSS 来源`); if (!d) continue;
      ok(d.src.every(x => ENEMIES[x.boss]?.tier === 'boss' && FLOORS[x.floor].spawns.some(s => s.id === x.boss)), `${b.skill} 来源 BOSS 存在且在所写层`);
      if (d.lv <= 35) { const L = d.src.find(x => x.boss === 'boss_lich'); ok(!!L && d.src.every(x => x.rate <= L.rate) && d.src.every(x => x.floorLv >= 22 && x.floorLv <= 35), `${b.skill} 26–35：尸王掉率最高、来源均为尸王及以上`); }
      else ok(d.src.every(x => x.floorLv >= 35 && Math.abs(x.floorLv - d.lv) <= 3), `${b.skill} >35：BOSS 层等级≈书等级（${d.src.map(x => x.floorLv)}）`);
    }
  }
  const w = new World(seeded(9), 50, [{ name: 't', spawns: [{ id: 'boss_lich', x: 600 }] }], 'warrior'); w.lootRng = () => 0;
  const boss = w.alive('enemy').find(u => u.id === 'boss_lich')!; w.kill(boss); w.drainEvents();
  const got = (w as any).ground?.map?.((g: any) => g.item) ?? []; const all = JSON.stringify([got, w.bag.map(x => x.item), (w as any).loot]);
  ok(/book_half_moon/.test(all), `尸王真实掉落 >25 级书（${all.slice(0, 160)}）`);
}
{ // R54 F：攻击/受击/前摇/待机立绘缩放不超过基准（所有卡牌共用 CardView：主角、怪物、全部召唤物）
  for (const [k, v] of Object.entries({ SWING_SCALE, WINDUP_SCALE, HIT_SCALE })) ok(v.x <= 1 && v.y <= 1, `${k} 关键帧不放大（${v.x}/${v.y}）`);
  let mx = 0; for (let i = 0; i < 2000; i++) mx = Math.max(mx, breathScaleY(i * 0.013)); ok(mx <= 1, `待机呼吸 max scaleY ${mx.toFixed(4)} ≤ 1`);
  const src = readFileSync('src/ui/CardView.ts', 'utf8'); ok(!/artS[XY] \* 1\.\d*[1-9]/.test(src) && !/scale(X|Y)?: \{?\s*(from: [\d.]+, )?to: 1\.\d*[1-9]/.test(src), 'CardView 无 artS×1.xx 放大');
  for (const d of [SUMMON, SUMMON_BEAST, SUMMON_CORPSE, SUMMON_GOLDEN, DECOY]) ok((d.card?.h ?? 0) <= 190 && (d.card?.figureScale ?? 1) <= 1.25, `${d.name} 静态卡面不大于常规（h ${d.card?.h} fs ${d.card?.figureScale}）`);
}
console.log(`全部通过 ${pass} 项`);
