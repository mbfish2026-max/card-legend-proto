/** 增益脚下光环：映射表 + 状态驱动逻辑（无 Phaser） */
import { World } from '../src/combat/World';
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
// World：施放写 auraSkill
const w = new World(() => 0.5, 41, [{ name: 't', spawns: [] }], 'warrior' as any); w.step(0.05); w.drainEvents();
const i = w.skills.findIndex(s => s.id === 'vajra_body');
if (i >= 0) { w.learned.add('vajra_body'); w.hero!.mp = 9999; const r = w.cast(i, w.skills.map(() => 0)); ok(r.ok && w.hero!.auraSkill === 'vajra_body' && wantAura(w.hero as any, w.time) === 'vajra_body', '金刚护体施放 → 英雄 auraSkill'); }
console.log(`ground-aura: ${pass} 项通过`);
