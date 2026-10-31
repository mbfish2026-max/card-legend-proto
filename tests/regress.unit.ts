// 回归单测（纯逻辑，无浏览器）：存档迁移 / 技能书 / 世界地图传送 / 设置存取。由 tests/regress.mjs 调用，输出 JSON 行。
import { World, SaveData, FLOOR_MIGRATE } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { CLASSES, ClassId } from '../src/data/classes';
import { BOOKS, bookItemId } from '../src/data/books';
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, String(v)), removeItem: (k: string) => mem.delete(k) };
const { Settings, SaveStore, ZOOM_MIN, ZOOM_MAX } = await import('../src/settings');
const R: { group: string; name: string; ok: boolean; info?: string }[] = [];
const t = (group: string, name: string, fn: () => boolean | string) => { try { const r = fn(); R.push({ group, name, ok: r === true, info: r === true ? undefined : String(r) }); } catch (e) { R.push({ group, name, ok: false, info: String(e) }); } };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ---------- 存档迁移 ----------
const base = new World(seeded(7), 1, FLOORS, 'taoist'); base.gold = 4321; base.level = 22; base.exp = 77; base.kills = 99;
base.bag.push(base.makeItem('hp_small'), base.makeItem(bookItemId('poison')));
base.checkAchieves(); // 直接改 kills 后补算成就，否则读档时才补发
const cur = base.toSave();
const legacy = (o: Partial<SaveData> = {}) => JSON.parse(JSON.stringify({ ...cur, learned: undefined, mapV: undefined, ...o })) as SaveData;
t('存档迁移', '当前版本 toSave 带 mapV=2 / v=1', () => cur.mapV === 2 && cur.v === 1);
for (let old = 0; old < FLOOR_MIGRATE.length && old < FLOORS.length; old++) t('存档迁移', `旧层号 ${old} → ${FLOOR_MIGRATE[old]}`, () => {
  const w = new World(seeded(1), 1, FLOORS, 'taoist', legacy({ floorIndex: old, reached: [0, old], bossKilled: [old] }));
  return w.floorIndex === FLOOR_MIGRATE[old] && w.reached.has(FLOOR_MIGRATE[old]) && w.bossKilled.has(FLOOR_MIGRATE[old]) || `got floor ${w.floorIndex}`;
});
t('存档迁移', '旧存档升级不丢数据（职业/等级/经验/金币/击杀/背包/装备/药/悬赏/成就/修炼）', () => {
  const l = legacy({ skillTrain: { heal: 345 }, questProg: { q0: 3 }, questDone: ['q1'], achieves: ['a0'] });
  const s = new World(seeded(1), 1, FLOORS, 'taoist', l).toSave();
  const keys = ['cls', 'level', 'exp', 'gold', 'kills', 'nextUid', 'pots', 'bag', 'equip', 'skillTrain', 'questProg', 'questDone'] as const;
  const bad: string[] = keys.filter(k => !eq(s[k], l[k])); if (!(l.achieves ?? []).every(a => s.achieves?.includes(a))) bad.push('achieves'); return !bad.length || '丢失/变化: ' + bad.join(',');
});
t('存档迁移', '旧存档：达到等级的技能视为已学', () => { const w = new World(seeded(1), 1, FLOORS, 'taoist', legacy()); return CLASSES.taoist.skills.filter(s => (s.unlock ?? s.learn?.[0] ?? 1) <= 22).every(s => w.learned.has(s.id)); });
t('存档迁移', '迁移后再存再读：幂等（不二次迁移）', () => {
  const a = new World(seeded(1), 1, FLOORS, 'taoist', legacy({ floorIndex: 1, reached: [0, 1] })).toSave();
  const b = new World(seeded(1), 1, FLOORS, 'taoist', JSON.parse(JSON.stringify(a))).toSave();
  return eq(a, b) || `floor ${a.floorIndex}→${b.floorIndex}`;
});
t('存档迁移', '当前版本存档 JSON 往返一致', () => eq(new World(seeded(1), 1, FLOORS, 'taoist', JSON.parse(JSON.stringify(cur))).toSave(), cur));
t('存档迁移', 'SaveStore 写入/读取一致；非 v1 拒绝', () => { SaveStore.write(cur); const ok1 = eq(SaveStore.load(), cur); localStorage.setItem('fcl_save_v1', JSON.stringify({ ...cur, v: 9 })); const ok2 = SaveStore.load() === null; SaveStore.clear(); return ok1 && ok2 && !SaveStore.has(); });

// ---------- 技能书 ----------
for (const [sid, b] of Object.entries(BOOKS)) t('技能书', `${CLASSES[b.cls as ClassId].name} ${sid}${b.shop ? '（书店）' : '（掉落）'}`, () => {
  const w = new World(seeded(3), 1, FLOORS, b.cls as ClassId); w.gold = 1e6;
  if (w.learned.has(sid)) return true;
  if (b.shop) { const r = w.buyBook(sid); if (r) return '购买失败 ' + r; } else { if (w.buyBook(sid) === null) return '掉落书不应在书店出售'; w.bag.push(w.makeItem(bookItemId(sid))); }
  const i = () => w.bag.findIndex(x => x.item === bookItemId(sid));
  const s = w.skillPool.find(x => x.id === sid)!; const need = w.needLevel(s);
  if (need > 1 && (!w.learnBook(i()).includes('需等级') || w.learned.has(sid))) return '等级不足仍学会';
  w.level = need; const r = w.learnBook(i());
  if (!r.startsWith('学会了') || !w.learned.has(sid) || i() !== -1) return '学习失败 ' + r;
  if (!s.passive && !w.skills.some(x => x.id === sid)) return '未进快捷栏';
  const re = new World(seeded(3), 1, FLOORS, w.cls, JSON.parse(JSON.stringify(w.toSave())));
  return re.learned.has(sid) || '读档后丢失';
});
t('技能书', '职业不符不能学；已学会不能重复学', () => {
  const w = new World(seeded(3), 50, FLOORS, 'warrior'); w.bag.push(w.makeItem(bookItemId('thunder')));
  const a = w.learnBook(0) === '职业不符，无法学习';
  w.bag = [w.makeItem(bookItemId('basic_sword' in BOOKS ? 'basic_sword' : 'slaying'))]; w.learnBook(0); w.bag.push(w.makeItem(bookItemId('slaying')));
  return a && w.learnBook(w.bag.length - 1).startsWith('已学会');
});
t('技能书', '金币不足买不了书', () => { const w = new World(seeded(3), 1, FLOORS, 'mage'); w.gold = 0; return !!w.buyBook('thunder')?.includes('金币不足'); });

// ---------- 世界地图传送 ----------
t('传送', '未到达 / 当前层 / 越界 拒绝', () => { const w = new World(seeded(1), 30, FLOORS, 'warrior'); return w.canTeleport(3) === '尚未到达该层' && w.canTeleport(0) === '已在该层' && w.canTeleport(99) === '无此层'; });
t('传送', '扣费 (层+1)×20、切层、30s 冷却、冷却后可再传', () => {
  const w = new World(seeded(1), 30, FLOORS, 'warrior'); w.loadFloor(3); w.loadFloor(1); w.gold = 1000; w.alive('enemy').forEach(e => (e.ai = 'idle'));
  if (w.teleport(3) !== null || w.floorIndex !== 3 || w.gold !== 1000 - 80) return `floor ${w.floorIndex} gold ${w.gold}`;
  w.alive('enemy').forEach(e => (e.ai = 'idle'));
  if (!w.canTeleport(0)?.includes('冷却')) return '无冷却';
  w.time += World.TELEPORT_CD + 0.1; return (w.teleport(0) === null && (w.floorIndex as number) === 0 && w.gold === 900) || `cd后 ${w.canTeleport(0)}`;
});
t('传送', '战斗中禁止 / 金币不足禁止', () => { const w = new World(seeded(1), 30, FLOORS, 'warrior'); w.loadFloor(1); w.gold = 1000; const e = w.alive('enemy')[0]; e.ai = 'chase'; const a = w.canTeleport(0) === '战斗中无法传送'; e.ai = 'idle'; w.alive('enemy').forEach(x => (x.ai = 'idle')); w.gold = 0; return a && !!w.canTeleport(0)?.includes('金币'); });
t('传送', '到达记录随存档保留，读档后可传送', () => { const w = new World(seeded(1), 30, FLOORS, 'warrior'); w.loadFloor(2); w.gold = 500; const r = new World(seeded(1), 1, FLOORS, 'warrior', JSON.parse(JSON.stringify(w.toSave()))); r.alive('enemy').forEach(e => (e.ai = 'idle')); return r.reached.has(2) && r.floorIndex === 2 && r.teleport(0) === null && (r.floorIndex as number) === 0; });

// ---------- 设置 ----------
const SK = 'fcl_settings_v1';
t('设置', '保存→读取 全字段一致', () => {
  Object.assign(Settings, { volume: 0.3, muted: true, music: 0.2, lowFx: true, showPadMobile: false, autoAttack: false, autoSkills: ['fireball'], autoTouched: ['mage'], zoom: 1.1, zoomAuto: false }); Settings.save();
  const snap = JSON.parse(localStorage.getItem(SK)!);
  Object.assign(Settings, { volume: 0.7, muted: false, music: 0.5, lowFx: null, showPadMobile: null, autoAttack: true, autoSkills: null, autoTouched: null, zoom: 1, zoomAuto: null }); Settings.load();
  const got = { volume: Settings.volume, muted: Settings.muted, music: Settings.music, showPadMobile: Settings.showPadMobile, lowFx: Settings.lowFx, autoAttack: Settings.autoAttack, autoSkills: Settings.autoSkills, autoTouched: Settings.autoTouched, zoom: Settings.zoom, zoomAuto: Settings.zoomAuto };
  return eq(got, snap) || JSON.stringify(got) + ' vs ' + JSON.stringify(snap);
});
t('设置', '非法值被忽略、缩放钳制到范围', () => { localStorage.setItem(SK, JSON.stringify({ volume: 'x', muted: 1, zoom: 9, autoSkills: [1, 'thunder'] })); Settings.volume = 0.5; Settings.load(); return Settings.volume === 0.5 && Settings.zoom === ZOOM_MAX && eq(Settings.autoSkills, ['thunder']) && ZOOM_MIN < ZOOM_MAX; });
t('设置', '损坏的 JSON 不崩溃', () => { localStorage.setItem(SK, '{bad'); Settings.load(); return true; });
console.log('__REGRESS__' + JSON.stringify(R));
