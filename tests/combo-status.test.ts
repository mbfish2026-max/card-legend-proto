/** 阶段 B 合击持续状态表现：事件字段 + 句柄生命周期（ComboStatusTracker 无 Phaser，可无头测） */
import { World } from '../src/combat/World';
import { ENEMIES } from '../src/data/units';
import { comboFor, RAGE_MAX, COMBO_EFFECTS } from '../src/data/companion';
import { ComboStatusTracker, StatusUnit, comboStatusPlan, fallbackAnimKey, COMBO_STATUS } from '../src/ui/comboStatus';
import { ASSETS as MANIFEST } from '../src/assets-manifest';
import { existsSync, readFileSync } from 'node:fs';
const FX_SRC = readFileSync('src/ui/FxPlayer.ts', 'utf8'); const FX_DEFS: Record<string, true> = Object.fromEntries([...FX_SRC.matchAll(/^\s+(fx_\w+): D\(/gm)].map(m => [m[1], true])); // FxPlayer 依赖 Phaser，无头只解析源码键名
import type { InvItem } from '../src/combat/types';
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const item = (id: string): InvItem => ({ uid: 0, item: id, name: id, rarity: 'common' as any, stats: {}, req: 0, price: 0, qty: 1 });
const fake = () => { const log: string[] = []; let live = 0, made = 0;
  const t = new ComboStatusTracker((id, u) => { live++; made++; log.push(`make ${id} ${u.uid}`); let dead = false; return { update: () => { if (dead) throw new Error('update after destroy'); }, destroy: () => { if (dead) throw new Error('double destroy'); dead = true; live--; } }; });
  return { t, get live() { return live; }, get made() { return made; }, log }; };
const fire = (mc: any, hc: any, boss = false) => {
  const w = new World(seeded(5), 45, [{ name: '测试层', spawns: [] }], mc); w.recruitCompanion(hc, '小英'); w.step(0.05); w.drainEvents();
  const c = w.companion!, h = w.hero!; h.hp = h.maxHp = 1e9; c.level = 45; c.combo = [comboFor(mc, hc)!.id]; c.equip.heart = item('fire_heart'); c.heartStore = 30000; c.rage = RAGE_MAX; c.out = true; w.step(0.05); w.drainEvents();
  const e = w.spawn(boss ? ENEMIES.boss_molong : ENEMIES.orc, 'enemy', h.x + 160, 0); e.hp = e.maxHp = 1e9; e.ai = 'chase'; e.atk = 0;
  const e2 = w.spawn(ENEMIES.orc, 'enemy', h.x + 300, 0); e2.hp = e2.maxHp = 1e9; e2.atk = 0; e2.ai = 'chase';
  w.unleashCombo(); let combo: any = null; for (let i = 0; i < 200 && !combo; i++) { w.step(0.05); combo = w.drainEvents().find(x => x.type === 'combo'); }
  return { w, e, e2, combo };
};
for (const [mc, hc, id, dur] of [['taoist', 'taoist', 'shihun', 10], ['mage', 'taoist', 'mori', 8], ['warrior', 'taoist', 'pixing', 3]] as const) {
  const r = fire(mc, hc); const f = fake(); const look = (uid: number) => r.w.units.find(u => u.uid === uid && u.alive) as StatusUnit | undefined;
  ok(!!r.combo && r.combo.id === id && r.combo.affected?.includes(r.combo.target) && Math.abs(r.combo.statusUntil - r.w.time - dur) < 0.11, `${id}：combo 事件带 affected/statusUntil（${dur}s）`);
  if (id === 'shihun') ok(r.combo.affected.length >= 2, 'shihun：范围内多个目标进入 affected');
  f.t.start(r.combo.id, r.combo.target, r.combo.affected, r.combo.statusUntil, r.w.time);
  const samples: number[] = []; const t0 = r.w.time;
  for (let i = 0; i < (dur + 1.5) * 20; i++) { r.w.step(0.05); r.w.drainEvents(); f.t.sync(r.w.time, look); if (i % 10 === 0) samples.push(f.live); if (r.w.time - t0 > dur + 0.2) break; }
  const mid = samples.slice(1, Math.floor(dur * 2) - 1);
  ok(mid.every(n => n === (id === 'pixing' ? 1 : 1)), `${id}：状态期间句柄持续存在（采样 ${mid.join('')}）`);
  ok(f.live === 0 && f.t.size === 0 && f.made === 1, `${id}：状态结束后句柄销毁，无泄漏（创建 ${f.made}）`);
  ok(r.w.units.every(u => (u.poisonUntil ?? 0) <= r.w.time && (u.stunUntil ?? 0) <= r.w.time || u === r.w.hero), `${id}：结束时 World 状态也已到期`);
}
{ // 目标死亡立即清理
  const r = fire('mage', 'taoist'); const f = fake(); const look = (uid: number) => r.w.units.find(u => u.uid === uid && u.alive);
  f.t.start('mori', r.combo.target, r.combo.affected, r.combo.statusUntil, r.w.time);
  for (let i = 0; i < 20; i++) { r.w.step(0.05); f.t.sync(r.w.time, look); } ok(f.live === 1, 'mori：起手段后出现循环句柄');
  r.w.kill(r.e); f.t.sync(r.w.time, look); ok(f.live === 0 && f.t.size === 0, 'mori：目标死亡 → 当帧销毁');
}
{ // shihun：主目标死亡 → 跟随仍中毒的目标；全部死亡 → 清理
  const r = fire('taoist', 'taoist'); const f = fake(); const look = (uid: number) => r.w.units.find(u => u.uid === uid && u.alive);
  f.t.start('shihun', r.combo.target, r.combo.affected, r.combo.statusUntil, r.w.time);
  for (let i = 0; i < 20; i++) { r.w.step(0.05); f.t.sync(r.w.time, look); }
  r.w.kill(r.e); f.t.sync(r.w.time, look); ok(f.live === 1, 'shihun：主目标死亡，毒沼跟随其余中毒目标');
  for (const u of r.w.alive('enemy')) r.w.kill(u); f.t.sync(r.w.time, look); ok(f.live === 0, 'shihun：中毒目标全死 → 销毁');
}
{ // 重复合击替换旧句柄 + clear
  const f = fake(); const u: StatusUnit = { uid: 1, alive: true, poisonUntil: 10 };
  f.t.start('mori', 1, [1], 10, 0); f.t.sync(0.5, () => u); f.t.start('mori', 1, [1], 12, 1); f.t.sync(1.5, () => u);
  ok(f.made === 2 && f.live === 1, '同目标再次合击：旧句柄先销毁再建新句柄');
  f.t.clear(); ok(f.live === 0 && f.t.size === 0, '场景关闭 clear()：全部销毁');
  f.t.start('mori', 1, [1], 10, 0); f.t.sync(0.2, () => u); ok(f.made === 2, '起手段（0.4s）内不建循环句柄');
  f.t.start('pohun', 1, [1], 10, 0); f.t.start('mori', 1, [], 10, 0); ok(f.t.size === 1, '无持续状态合击 / affected 为空不建句柄');
  f.t.clear();
}
{ // 劈星斩打 BOSS：免疫麻痹 → affected 空 → 不显示
  const r = fire('warrior', 'taoist', true); const f = fake();
  f.t.start('pixing', r.combo.target, r.combo.affected, r.combo.statusUntil, r.w.time); f.t.sync(r.w.time + 0.1, uid => r.w.units.find(u => u.uid === uid));
  ok(!!r.combo && f.t.size === 0 && f.made === 0, 'pixing 打 BOSS：免疫麻痹，不建麻痹标记');
}
ok(COMBO_EFFECTS.shihun!.poison!.dur === 10 && COMBO_EFFECTS.mori!.poison!.dur === 8 && COMBO_EFFECTS.pixing!.stun === 3, '数值未改：中毒 10s / 掉血 8s / 麻痹 3s');
{ // 素材接入方案：专用 loop/end/stun/icon 优先；缺图逐级回退；回退动画 key 不与素材 key 冲突
  const all = (k: string) => true, none = (k: string) => false, baseOnly = (k: string) => /^fx_combo_(shihun|mori|pixing)$/.test(k);
  for (const id of ['shihun', 'mori']) {
    const p = comboStatusPlan(id, all); ok(p.loop?.anim === `fx_combo_${id}_loop` && !p.loop.fallback && p.end === `fx_combo_${id}_end`, `${id}：有素材 → _loop 循环 + _end 收尾`);
    const q = comboStatusPlan(id, baseOnly); ok(q.loop?.fallback === true && q.loop.tex === `fx_combo_${id}` && q.end === null, `${id}：缺 _loop/_end → 回退起手帧往返，不播收尾`);
  }
  const px = comboStatusPlan('pixing', all); ok(px.loop?.tex === 'fx_combo_pixing_stun' && px.icon === 'icon_status_stun' && px.end === null, 'pixing：有素材 → pixing_stun + 图标');
  const pn = comboStatusPlan('pixing', none); ok(pn.loop === null && pn.icon === null, 'pixing：全缺 → Graphics/文字回退');
  for (const id of Object.keys(COMBO_STATUS)) { const k = fallbackAnimKey(id); ok(!FX_DEFS[k] && !(k in MANIFEST) && !existsSync(`public/assets/fx/${k}.png`), `回退动画 key ${k} 不与素材 key 重名`); }
  for (const d of Object.values(COMBO_STATUS)) for (const k of [d.loopKey, d.endKey].filter(Boolean) as string[]) ok(!!FX_DEFS[k] && existsSync(`public/assets/fx/${k}.png`) && existsSync(`public/assets/fx/${k}.json`), `素材在库且已注册：${k}`);
  ok((MANIFEST as any).icon_status_stun && existsSync('public/assets/ui/icon_status_stun.png'), '素材在库且已注册：icon_status_stun');
}
console.log(`combo-status: ${pass} passed`);
