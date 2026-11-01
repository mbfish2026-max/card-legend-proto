/** 增益脚下光环：映射表 + 状态驱动逻辑（无 Phaser） */
import { World, TAO_BUFF_RANGE } from '../src/combat/World';
import { BUFF_FX, GROUND_AURA_SKILLS, auraKeys, wantAura, auraScale, isBodyShieldKey, AURA_DEPTH } from '../src/ui/groundAuraPlan';
// @ts-ignore node
import { existsSync, readFileSync } from 'node:fs';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const FX_SRC = readFileSync('src/ui/FxPlayer.ts', 'utf8');
const def = (k: string) => FX_SRC.match(new RegExp(`^\\s+${k}: D\\((\\d+), '(\\w+)', (\\d+)[^\\n]*`, 'm'));
for (const id of GROUND_AURA_SKILLS) {
  ok(BUFF_FX[id].kind === 'ground' && !BUFF_FX[id].keys.some(isBodyShieldKey), `${id} 映射为脚下光环，不含身体罩特效`);
  const k = auraKeys(id), n: Record<string, number> = { start: 5, loop: 10, end: 4 };
  for (const ph of ['start', 'loop', 'end'] as const) {
    const m = def(k[ph]); ok(!!m && m[1] === '12' && m[2] === 'ADD' && +m[3] === AURA_DEPTH && /loop: true/.test(m[0]) === (ph === 'loop'), `${k[ph]} FX_DEFS 12fps ADD depth 9 loop=${ph === 'loop'}`);
    const f = `public/assets/fx/${k[ph]}`; ok(existsSync(f + '.png') && existsSync(f + '.json'), `${k[ph]} 素材存在`);
    const fr = JSON.parse(readFileSync(f + '.json', 'utf8')).frames, names = Object.keys(fr);
    ok(names.length === n[ph] && names.every(x => fr[x].sourceSize.w === 256 && fr[x].sourceSize.h === 96 && (fr[x].anchor?.x ?? 0.5) === 0.5 && (fr[x].anchor?.y ?? 0.5) === 0.5), `${k[ph]} ${n[ph]} 帧 256×96 pivot(128,48)`);
  }
}
ok(BUFF_FX.magic_shield.kind === 'body' && BUFF_FX.magic_shield.keys.every(isBodyShieldKey), '魔法盾仍为身体罩');
const BS = readFileSync('src/scenes/BattleScene.ts', 'utf8');
const seg = (a: string, b: string) => BS.slice(BS.indexOf(a), BS.indexOf(b, BS.indexOf(a)));
const g1 = seg("case 'vajra_body': {", "case 'ice_arrow'"), g2 = seg("case 'ghost_shield': case 'holy_armor': {", "case 'mass_heal'"), ms = seg("case 'magic_shield': {", "case 'poison'");
ok(!/fx_(magic_shield|holy_armor|ghost_shield)_(cast|loop)/.test(g1 + g2), '源码：三技能分支不再播身体罩');
ok(/fx_magic_shield_cast/.test(ms) && /fx_magic_shield_loop/.test(ms), '源码：魔法盾分支仍播身体罩');
ok(!/kl\b|'fx_holy_armor_loop'/.test(BS), '源码：BattleScene 不再引用 fx_holy_armor_loop');
ok(auraScale(10) === 0.8 && auraScale(1000) === 1.2 && auraScale(150) === 1, '缩放夹在 0.8–1.2');
// 状态驱动
const u: any = { uid: 1, alive: true };
ok(wantAura(u, 0) === null, '无增益无光环');
Object.assign(u, { auraSkill: 'holy_armor', defUp: 5, defUpUntil: 10 }); ok(wantAura(u, 1) === 'holy_armor' && wantAura(u, 11) === null, '神甲：持续中有、到期无');
Object.assign(u, { auraSkill: 'ghost_shield', mdefUp: 5, mdefUpUntil: 20 }); ok(wantAura(u, 1) === 'ghost_shield', '后施放的幽灵盾优先（单位只 1 个光环）');
ok(wantAura({ ...u, mdefUpUntil: 0 }, 1) === 'holy_armor', '幽灵盾到期 → 回到仍有效的神甲');
ok(wantAura({ ...u, defUp: -3, mdefUp: -3 }, 1) === null, '被驱散（破击写负值）→ 无光环');
ok(wantAura({ ...u, alive: false }, 1) === null, '死亡 → 无光环');
ok(wantAura({ uid: 2, defUp: 5, defUpUntil: 10 }, 1) === null, '非光环来源的加成不触发');
// World：施放写 auraSkill（道士神甲/幽灵盾）
const w = new World(() => 0.5, 41, [{ name: 't', spawns: [] }], 'taoist' as any); w.step(0.05); w.drainEvents();
for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
for (const id of ['holy_armor', 'ghost_shield']) { const i = w.skills.findIndex(s => s.id === id); w.hero!.mp = 99999; const r = w.cast(i, w.skills.map(() => 0)); ok(i >= 0 && r.ok && w.hero!.auraSkill === id && wantAura(w.hero as any, w.time) === id, `${id} 施放 → 英雄显示 ${id} 光环`); }

// feat/ground-aura-ally：目标 = 主角 + 5×5（TAO_BUFF_RANGE）内召唤物 + 合击英雄；不叠加；全员已有才拒绝
{
  const mkW = () => { const w = new World(() => 0.5, 45, [{ name: 'a', spawns: [] }, { name: 'b', spawns: [] }], 'taoist' as any); w.step(0.05);
    for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; } w.hero!.mp = w.hero!.maxMp = 99999; return w; };
  const w = mkW(), h = w.hero!, cds = () => w.skills.map(() => 0), idx = (id: string) => w.skills.findIndex(s => s.id === id);
  ok(w.cast(idx('summon_skeleton'), cds()).ok, '召唤骷髅');
  ok(w.recruitCompanion('taoist' as any, '英雄') === null, '领取合击英雄');
  for (let k = 0; k < 4 && !w.companionUnit; k++) w.step(0.05);
  if (!w.companionUnit) w.loadFloor(w.floorIndex);
  const sm = w.units.find(u => u.summon && u.alive)!, cp = w.companionUnit!;
  ok(!!sm && !!cp, '场上有召唤物与合击英雄');
  sm.x = h.x + 100; cp.x = h.x - 150;
  const far: any = w.units.find(u => u.summon && u !== sm && u.alive); if (far) far.x = h.x + TAO_BUFF_RANGE + 50;
  w.drainEvents();
  const r = w.cast(idx('holy_armor'), cds());
  ok(r.ok && [h, sm, cp].every(u => (u.defUp ?? 0) > 0 && (u.defUpUntil ?? 0) > w.time && u.auraSkill === 'holy_armor'), '神圣战甲术：主角/召唤物/合击英雄均获得防御+光环');
  ok([h, sm, cp].every(u => wantAura(u as any, w.time) === 'holy_armor'), '三者都显示神甲光环');
  if (far) ok(!(far.defUp > 0), '范围外召唤物不受益');
  const v0 = sm.defUp!, mp0 = h.mp!;
  const r2 = w.cast(idx('holy_armor'), cds());
  ok(!r2.ok && h.mp === mp0 && sm.defUp === v0, '全员已有 → 拒绝、不扣魔、数值不叠加');
  sm.defUpUntil = 0; const r3 = w.cast(idx('holy_armor'), cds());
  ok(r3.ok && sm.defUp === v0 && h.defUp === v0 && (sm.defUpUntil ?? 0) > w.time, '宠物缺 buff → 施放刷新，数值不叠加');
  ok(w.cast(idx('ghost_shield'), cds()).ok && [h, sm, cp].every(u => (u.mdefUp ?? 0) > 0 && u.auraSkill === 'ghost_shield'), '幽灵盾：三者均获得魔御+光环');
  // 自动施法：全员有 → 不施；不刷屏
  let n = 0; for (let k = 0; k < 20; k++) { const rr = w.cast(idx('holy_armor'), cds(), { auto: true }); if (rr.ok) n++; }
  ok(n === 0, '自动施法：全员已生效时 0 次施放（不浪费魔）');
  // 换图：buff 未过期 → 新图仍应显示光环
  const until = h.defUpUntil!; w.loadFloor(1);
  const sm2 = w.units.find(u => u.uid === sm.uid), cp2 = w.companionUnit;
  ok(h.defUpUntil === until && wantAura(h as any, w.time) !== null, '换图后主角未过期 buff 保留 → 光环重新显示');
  if (sm2) ok(wantAura(sm2 as any, w.time) !== null, '换图后召唤物光环重新显示');
  if (cp2) ok(wantAura(cp2 as any, w.time) !== null, '换图后合击英雄光环重新显示');
  ok(!/suppress/.test(readFileSync('src/ui/groundAura.ts', 'utf8')), '源码：GroundAuras 不再换图抑制');
  // 金刚护体保持仅自身（官方自身增益）
  const ww = new World(() => 0.5, 45, [{ name: 'a', spawns: [] }], 'warrior' as any); ww.step(0.05); for (const s of ww.skillPool) { ww.learned.add(s.id); ww.skillTrain[s.id] = 99999; }
  ww.hero!.mp = 99999; const vi = ww.skills.findIndex(s => s.id === 'vajra_body');
  if (vi >= 0) ok(ww.cast(vi, ww.skills.map(() => 0)).ok && ww.units.filter(u => u !== ww.hero && (u.defUp ?? 0) > 0).length === 0, '金刚护体仅自身');
}
console.log(`ground-aura: ${pass} 项通过`);
