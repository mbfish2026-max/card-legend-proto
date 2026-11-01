// feat/account-p1：云存档同步（mock 客户端）：会话恢复、首次登录备份+迁移、冲突玩家选择、离线、keepalive、未配置退回游客
export {};
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.has(k) ? mem.get(k)! : null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
const { Slots, SaveStore, slotKey } = await import('../src/settings');
const { CloudSync, planMigration, STATE_KEY, BACKUP_PREFIX, FLUSH_DELAY } = await import('../src/cloud/sync');
const { usernameToEmail, emailToUsername, validUsername, validPassword } = await import('../src/cloud/account');
const { keyLooksPublic, localSlots, initCloud } = await import('../src/cloud/index');
const { MockCloud } = await import('./cloud-mock');
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const sv = (cls: string, level: number, floorIndex = 0, gold = 1) => ({ v: 1, cls, level, exp: 0, gold, pots: [0, 0, 0, 0], floorIndex, kills: 0, nextUid: 1, equip: {}, bag: [], learned: [] }) as any;
const kv = globalThis.localStorage as any;
let clock = 1_000; const timers: (() => void)[] = []; const sched = (fn: () => void) => { timers.push(fn); return timers.length as any; };
const mk = (api: any) => { const c = new CloudSync(api, localSlots, kv, () => ++clock, sched); return c; };

// 账号映射
ok(usernameToEmail('Hua_Yang') === usernameToEmail(' hua_yang ') && usernameToEmail('hua_yang').endsWith('@fcl.local'), '用户名大小写/空格不敏感，假邮箱 @fcl.local');
ok(emailToUsername(usernameToEmail('传奇玩家1')) === '传奇玩家1', '中文用户名可往返');
ok(validUsername('a') !== null && validUsername('ab c') !== null && validUsername('战士_01') === null, '用户名校验');
ok(validPassword('1234567') !== null && validPassword('12345678') === null, '密码至少 8 位');
ok(keyLooksPublic('sb_publishable_x') && !keyLooksPublic('sb_secret_x') && !keyLooksPublic(''), 'key 只接受 publishable，拒绝 secret');
{ const jwt = (role: string) => 'x.' + btoa(JSON.stringify({ role })) + '.y'; ok(keyLooksPublic(jwt('anon')) && !keyLooksPublic(jwt('service_role')), '旧式 JWT：anon 可用，service_role 拒绝'); }

// 未配置：退回游客
{ const c = initCloud(); ok(c.status === 'off' && !c.configured, '未配置 VITE_SUPABASE_* → status=off（游客，入口显示未配置）');
  SaveStore.write(sv('warrior', 3)); ok(Slots.read(1)?.level === 3 && !mem.has(STATE_KEY), '未配置时写档行为不变、无云状态'); }

// 迁移计划
{ const p = planMigration([sv('a', 1), null, sv('c', 3), sv('d', 4)], [{ slot: 2, data: sv('b', 2), updated_at: 't2' }, { slot: 3, data: sv('c', 9), updated_at: 't3' }, { slot: 4, data: sv('d', 4), updated_at: 't4' }, { slot: 7, data: sv('g', 7), updated_at: 't7' }]);
  ok(p.up.join() === '1' && p.down.map(r => r.slot).join() === '2,7' && p.conflict.join() === '3' && p.adopt.map(r => r.slot).join() === '4', '迁移计划：只一边有→上/下传；内容相同→采纳；不同→冲突'); }

// 首次登录：先备份再迁移；冲突不自动覆盖
const api = new MockCloud();
{ mem.clear(); Slots.meta(); Slots.select(1); SaveStore.write(sv('warrior', 10)); Slots.select(2); SaveStore.write(sv('mage', 20)); Slots.select(1);
  api.users.set('hy', { id: 'uid-hy', pw: 'password1' }); api.remoteWrite('uid-hy', 2, sv('mage', 25)); api.remoteWrite('uid-hy', 6, sv('taoist', 30));
  const before1 = mem.get(slotKey(1)), before2 = mem.get(slotKey(2));
  const c = mk(api); await c.start(); ok(c.status === 'guest', '未登录：恢复会话为空 → 游客');
  await c.login('hy', 'password1');
  const bk = [...mem.keys()].find(k => k.startsWith(BACKUP_PREFIX)); const b = bk ? JSON.parse(mem.get(bk)!) : {};
  ok(!!bk && b[slotKey(1)] === before1 && b[slotKey(2)] === before2, '首次登录先整体备份本地存档');
  ok(api.calls.indexOf('list') > -1 && [...mem.keys()].indexOf(bk!) > -1, '备份在迁移读云端前完成');
  ok(api.rows.get('uid-hy:1')?.data.level === 10, '本地独有槽 1 上传');
  ok(Slots.count() >= 6 && Slots.read(6)?.level === 30, '云端独有槽 6 下载（槽数扩到 6）');
  ok(c.status === 'conflict' && c.conflicts.length === 1 && c.conflicts[0].slot === 2, '槽 2 两边不同 → 冲突');
  ok(mem.get(slotKey(2)) === before2 && api.rows.get('uid-hy:2')?.data.level === 25, '冲突未解决前两边都不被覆盖');
  ok(JSON.parse(mem.get(slotKey(1))!).v === 1 && mem.get(slotKey(1)) === before1, '旧存档格式（v:1、键名）不变');
  await c.resolve(2, 'cloud');
  ok(Slots.read(2)?.level === 25 && c.status === 'online', '玩家选云端 → 本地槽 2 改为云端版本');
  ok([...mem.keys()].some(k => k.startsWith(BACKUP_PREFIX) && k.endsWith('_s2_local') && JSON.parse(mem.get(k)!).level === 20), '被放弃的本地版本写入备份键');
  // 会话恢复（模拟刷新页面）
  const c2 = mk(api); const listCalls = api.calls.filter(x => x === 'list').length; await c2.start();
  ok(c2.status === 'online' && c2.username === 'hy', '会话恢复：刷新后自动登录');
  ok(api.calls.filter(x => x === 'list').length === listCalls, '已迁移过：恢复后不再重复迁移');
  // 写档 → 标脏 → 30 秒节流上传
  const { saveHooks } = await import('../src/settings'); saveHooks.onWrite = i => c2.markDirty(i);
  Slots.select(1); SaveStore.write(sv('warrior', 11)); SaveStore.write(sv('warrior', 12));
  ok(c2.dirty.join() === '1' && timers.length === 1 && FLUSH_DELAY === 30_000, '写档标脏，30 秒节流只排一次');
  timers.shift()!(); await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
  ok(api.rows.get('uid-hy:1')?.data.level === 12 && c2.dirty.length === 0, '节流到期上传最新存档');
  // 离线：照常写本地，上传失败保留脏标记；恢复网络后补传
  api.offline = true; SaveStore.write(sv('warrior', 13)); await c2.onHidden();
  ok(c2.status === 'offline' && Slots.read(1)?.level === 13 && c2.dirty.join() === '1', '离线：本地照常保存，云端失败标离线并保留待传');
  const c3 = mk(api); await c3.start(); ok(c3.status === 'offline' && c3.username === 'hy', '离线启动：保持账号显示离线，不清本地');
  api.offline = false; await c2.flush(); ok(c2.status === 'online' && api.rows.get('uid-hy:1')?.data.level === 13, '联网后补传');
  // 多设备冲突：另一台设备改了槽 1
  api.remoteWrite('uid-hy', 1, sv('warrior', 40)); SaveStore.write(sv('warrior', 14)); await c2.flush();
  ok(c2.status === 'conflict' && c2.conflicts[0]?.slot === 1 && api.rows.get('uid-hy:1')?.data.level === 40 && Slots.read(1)?.level === 14, '乐观锁冲突：不覆盖云端、不覆盖本地，等玩家选');
  await c2.resolve(1, 'local'); ok(api.rows.get('uid-hy:1')?.data.level === 14 && c2.status === 'online', '玩家选本地 → 按云端 updated_at 上传');
  ok([...mem.keys()].some(k => k.endsWith('_s1_cloud') && JSON.parse(mem.get(k)!).level === 40), '被放弃的云端版本写入备份键');
  // keepalive
  SaveStore.write(sv('warrior', 15)); ok(c2.onPageHide() === true && api.beacons.length === 1 && api.beacons[0].slot === 1, 'pagehide：脏的当前槽发 keepalive');
  await c2.flush(); ok(c2.dirty.length === 0 && c2.conflicts.length === 0, 'keepalive 已送达：下次内容相同直接采纳，不误报冲突');
  ok(c2.onPageHide() === false, '无脏数据不发 keepalive');
  const big = sv('warrior', 16); big.bag = Array.from({ length: 3000 }, (_, i) => ({ id: 'x' + i, name: '大背包填充物' })); SaveStore.write(big);
  ok(c2.onPageHide() === false && api.beacons.length === 1, '存档 ≥60KB 不走 keepalive（改由 visibilitychange 普通上传）');
  // 退出
  await c2.logout(); ok(c2.status === 'guest' && !mem.has(STATE_KEY) && Slots.read(1)?.level === 16, '退出登录：回游客，本地存档保留');
}
console.log(`cloud-sync: ${n - fail}/${n}`); if (fail) { console.log("cloud-sync: FAILED"); (globalThis as any).process.exit(1); } else console.log('cloud-sync: all passed');
