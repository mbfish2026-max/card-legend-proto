// feat/multi-save：存档位（≥5 可配置）、旧档迁移槽 1 + 备份键不覆盖、槽间无串档、设置全局、删除/改名/时长
export {};
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.has(k) ? mem.get(k)! : null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k) };
const { Slots, SaveStore, Settings, slotKey, BACKUP_KEY, META_KEY, SLOT_MIN, SLOT_MAX, fmtPlay } = await import('../src/settings');
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const sv = (cls: string, level: number, floorIndex: number) => ({ v: 1, cls, level, exp: 0, gold: 1, pots: [0, 0, 0, 0], floorIndex, kills: 0, nextUid: 1, equip: {}, bag: [], learned: [] }) as any;
// 迁移：旧档 fcl_save_v1 即槽 1，备份一份
const old = JSON.stringify(sv('mage', 33, 20)); mem.set('fcl_save_v1', old);
ok(SaveStore.load()?.level === 33 && Slots.active() === 1, '旧存档迁移为槽 1（键不变，导出/导入格式不变）');
ok(mem.get(BACKUP_KEY) === old, '迁移时写备份键');
ok(slotKey(1) === 'fcl_save_v1' && slotKey(2) === 'fcl_save_v1_s2', '槽键');
// 已有备份不覆盖
{ mem.delete(META_KEY); mem.set(BACKUP_KEY, 'OLDBK'); Slots.meta(); ok(mem.get(BACKUP_KEY) === 'OLDBK', '已有备份不覆盖'); }
ok(Slots.count() === SLOT_MIN && SLOT_MIN >= 5, `默认 ${SLOT_MIN} 个存档位`);
ok(Slots.setCount(8) === 8 && Slots.list().length === 8, '可配置为 8 个');
ok(Slots.setCount(99) === SLOT_MAX && Slots.setCount(1) === SLOT_MIN, `数量夹在 ${SLOT_MIN}–${SLOT_MAX}`);
// 槽间隔离
ok(Slots.select(2) && !SaveStore.has() && SaveStore.load() === null, '切到空槽 2 无数据（不串档）');
SaveStore.write(sv('taoist', 12, 5), 1_000_000);
ok(Slots.read(1)?.cls === 'mage' && Slots.read(2)?.cls === 'taoist', '写槽 2 不影响槽 1');
SaveStore.write(sv('taoist', 13, 6), 1_060_000); SaveStore.write(sv('taoist', 14, 7), 1_000_000 + 60_000 + 10 * 60_000);
const l2 = Slots.list()[1]; ok(l2.playMs === 60_000 && l2.lastAt === 1_660_000, '游玩时长累计（挂起 >5 分钟不计）+ 最后游玩');
ok(l2.data?.level === 14 && l2.data.floorIndex === 7, '列表显示职业/等级/层数');
ok(fmtPlay(60_000) === '1 分钟' && fmtPlay(3_900_000) === '1 小时 5 分', '时长格式');
Slots.select(1); SaveStore.clear(); ok(Slots.read(1) === null && Slots.read(2)?.level === 14, '新游戏清当前槽，不动其他槽');
ok(mem.get(BACKUP_KEY) === 'OLDBK', '清档不动备份');
ok(Slots.rename(2, '  道士小号  ') && Slots.list()[1].name === '道士小号' && Slots.rename(3, '') && Slots.list()[2].name === '存档 3', '改名（去空格；空名回默认）');
ok(Slots.firstEmpty() === 1, '第一个空槽');
ok(Slots.remove(2) && Slots.read(2) === null && Slots.list()[1].name === '存档 2', '删除槽 2（存档+元数据）');
ok(!Slots.select(0) && !Slots.select(99), '越界槽拒绝');
// 设置全局，不分槽
Settings.volume = 0.3; Settings.save(); Slots.select(3); Settings.volume = 1; Settings.load(); ok(Settings.volume === 0.3, '设置全局共享，不随槽切换');
mem.set(META_KEY, '{bad'); ok(Slots.active() === 1 && Slots.count() === SLOT_MIN, '坏元数据可重建');
console.log(`multi-save: ${n - fail}/${n} 通过`); if (fail) (globalThis as any).process.exit(1);
