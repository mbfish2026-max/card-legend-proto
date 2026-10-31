// 世界大地图 W1：节点覆盖全部 83 层、连接双向、迷雾等级段、探索状态存取/旧档兼容/槽隔离、传送限制
export {};
const mem = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => mem.has(k) ? mem.get(k)! : null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k) };
const { Slots, SaveStore, Settings } = await import('../src/settings');
const { World } = await import('../src/combat/World');
const { FLOORS } = await import('../src/data/world');
const { FLOOR_TARGET_LV } = await import('../src/data/balance');
const WM = await import('../src/data/worldmap');
const { WM_ASSETS } = await import('../src/assets-manifest');
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
// 覆盖
ok(FLOORS.length === 83, '83 层');
const all = WM.WM_IDS.flatMap(id => WM.REGION_GEO[id].floors);
ok(all.length === 83 && new Set(all).size === 83, '区域层集合恰好覆盖 0–82 各一次');
const nf = WM.WM_IDS.flatMap(id => WM.NODE_GEO[id].filter(x => x.floor !== undefined).map(x => x.floor!));
ok(nf.length === 83 && new Set(nf).size === 83, '节点恰好覆盖 83 层各一次');
ok(WM.WM_IDS.every(id => WM.NODE_GEO[id].every(x => x.floor === undefined || WM.areaOf(x.floor) === id)), '节点所在区域与层归属一致');
ok(WM.WM_IDS.every(id => WM.NODE_GEO[id].every(x => x.x >= 0 && x.x <= WM.WM_ART_W && x.y >= 0 && x.y <= WM.WM_ART_H)), '节点在插画像素范围内');
ok(WM.WM_IDS.length === 8 && WM.WM_IDS.every(id => WM_ASSETS['world_region_' + id]), '8 区域 id 与区域插画一一对应（W-2）');
ok(WM.REGION_GEO.hejiban.floors.join() === '19,20,21,22,23', '魔龙=hejiban（合击层 19–23）');
ok(WM.RIFT_FLOORS.length > 0 && WM.RIFT_FLOORS.every(f => WM.areaOf(f) !== null && WM.NODE_GEO[WM.areaOf(f)!].find(x => x.floor === f)!.rift && WM.wmIcon(WM.NODE_GEO[WM.areaOf(f)!].find(x => x.floor === f)!) === 'icon_wm_rift'), `异界裂隙 ${WM.RIFT_FLOORS.length} 层挂在各区域，用 icon_wm_rift`);
{ const fs: any = await import('node:' + 'fs'); ok(Object.values(WM_ASSETS).length === 26 && Object.values(WM_ASSETS).every(p => fs.existsSync('public/' + p)), 'WM_ASSETS 26 个文件均存在'); }
ok(Object.keys(WM.ANCHORS).every(k => WM.WM_IDS.some(id => WM.NODE_GEO[id].some(n => n.node === k || 'grp_' + n.group === k))), 'W-2 锚点 key 都对应到节点/图群');
ok(WM.NODE_GEO.bichi.find(n => n.node === 'bichi_town')!.x === 630 && WM.clusters('zuma').some(c => WM.isCluster(c) && c.id === 'grp_wugong' && c.x === 1420 && c.y === 220), '节点坐标按 W-2 锚点回填（群节点放地标上）');
ok(WM.WM_IDS.every(id => WM.REGION_GEO[id].links.every(l => WM.REGION_GEO[l.to]?.links.some(b => b.to === id))), '区域连接双向');
ok(WM.REGION_GEO.cangyue.links.every(l => l.kind === 'sea') && WM.REGION_GEO.bichi.poly[0].join() === '240,1000', '苍月岛仅海路（虚线）；多边形按 W-1');
ok(WM.WM_IDS.every(id => WM.REGION_GEO[id].poly.every(([x, y]) => x >= 0 && x <= WM.WM_W && y >= 0 && y <= WM.WM_H)), '区域多边形在 4096×2304 内');
ok(WM.WM_TILE_KEYS.length === 8 && WM.WM_TILE_W * WM.WM_TILES_X === WM.WM_W && WM.WM_TILE_H * WM.WM_TILES_Y === WM.WM_H, '底图 4×2 分块');
// 收拢
const bc = WM.clusters('bichi'); const grp = bc.filter(WM.isCluster);
ok(grp.length > 0 && grp.every(g => g.members.length >= 2 && new Set(g.members.map(m => m.group)).size === 1), '多层图群收拢为群节点');
ok(WM.WM_IDS.every(id => WM.clusters(id).reduce((a, c) => a + (WM.isCluster(c) ? c.members.length : 1), 0) === WM.NODE_GEO[id].length), '收拢不丢节点');
// 迷雾与等级段
for (const id of WM.WM_IDS) { const l = WM.REGION_GEO[id].floors.map(f => FLOOR_TARGET_LV[f]); const [a, b] = WM.levelBand(id); if (a !== Math.min(...l) || b !== Math.max(...l)) ok(false, `${id} 等级段`); }
ok(true, '等级段 = FLOOR_TARGET_LV 区间');
const e0 = { reached: new Set([0]) };
ok(WM.areaFog('bichi', e0) === 'lit' && WM.areaFog('zuma', e0) === 'fog', '仅到过的区域点亮');
const fl = WM.fogLabel('zuma', e0); ok(fl.name === '？？？' && fl.band === WM.bandText('zuma') && /^Lv\d+/.test(fl.band), `迷雾区显示 ？？？ + 等级段（${fl.band}）`);
const zt = WM.NODE_GEO.zuma.find(x => x.town)!; ok(!WM.nodeLit('zuma', zt, e0) && WM.nodeLit('zuma', zt, { reached: new Set([0]), townsSeen: new Set([zt.town!]) }), '城镇节点：去过才亮（townsSeen）');
ok(WM.nodeLit('bichi', WM.NODE_GEO.bichi.find(x => x.town)!, { reached: new Set([0]) }), '旧档无 townsSeen：区域点亮则城镇亮');
ok(!WM.nodeLit('bichi', WM.NODE_GEO.bichi.find(x => x.floor !== undefined && x.floor !== 0)!, e0), '未到过的层节点暗');
// 探索状态存取 + 旧档兼容
const w = new World(seeded(1), 10, FLOORS, 'warrior'); w.reached.add(5); w.enterTown('mengzhong', true);
const sv = w.toSave(); ok(sv.townsSeen!.includes('mengzhong') && sv.reached!.includes(5), '存档写 reached + townsSeen');
const w2 = new World(seeded(2), 1, FLOORS, 'warrior', JSON.parse(JSON.stringify(sv)));
ok(w2.townsSeen.has('mengzhong') && w2.reached.has(5), '读档恢复探索状态');
const oldSv: any = JSON.parse(JSON.stringify(sv)); delete oldSv.townsSeen; oldSv.reached = [0, 1, 2];
const w3 = new World(seeded(3), 1, FLOORS, 'warrior', oldSv);
ok([...w3.townsSeen].join() === String(oldSv.town) && [...w3.reached].sort((a, b) => a - b).join() === '0,1,2' && WM.areaFog('zuma', w3) === 'fog' && WM.areaFog('bichi', w3) === 'lit', '旧档无字段：仅已到过的层点亮（城镇仅当前所在城）');
const bad: any = { ...oldSv, townsSeen: 'x' }; ok([...new World(seeded(4), 1, FLOORS, 'warrior', bad).townsSeen].join() === String(oldSv.town), '坏字段容错');
// 槽隔离
Slots.select(1); SaveStore.write(sv as any, 1000);
Slots.select(2); const s2 = new World(seeded(5), 1, FLOORS, 'warrior').toSave(); SaveStore.write(s2 as any, 2000);
ok((Slots.read(1) as any).townsSeen.includes('mengzhong') && !((Slots.read(2) as any).townsSeen ?? []).includes('mengzhong') && !(Slots.read(2) as any).reached.includes(5), '探索状态按存档槽隔离');
Settings.wmZoom = 9; Settings.wmArea = 'zuma'; Settings.save(); Settings.wmZoom = 1; Settings.wmArea = null; Settings.load();
ok(Settings.wmZoom === 2.5 && Settings.wmArea === 'zuma', '地图缩放/上次区域存全局设置（夹 0.5–2.5）');
Slots.select(1); Settings.load(); ok(Settings.wmArea === 'zuma', '切槽不影响地图设置');
// 传送限制
const t = new World(seeded(6), 30, FLOORS, 'warrior'); t.gold = 100000;
t.reached = new Set([0, 1, 2]); t.loadFloor(0);
const nd = (f: number) => WM.NODE_GEO[WM.areaOf(f)!].find(x => x.floor === f)!;
ok(WM.nodeTeleport(t, nd(3)).why === '到达该层后解锁传送', '未到过：不可传送');
ok(WM.nodeTeleport(t, nd(0)).why === '你已在此地图', '当前层：不可传送');
const r2 = WM.nodeTeleport(t, nd(2)); ok(r2.ok && r2.cost === t.teleportCost(2) && r2.cost === 60, `已到过：可传送，费用 (i+1)*20=${r2.cost}`);
ok(t.teleport(2) === null && WM.nodeTeleport(t, nd(1)).ok === false, '冷却 30s 内不可再传（走 World.canTeleport）');
const tn = WM.NODE_GEO.bichi.find(x => x.town)!; ok(WM.nodeTeleport(t, tn).kind === 'town', '城镇节点走回城');
ok(Object.keys(WM_ASSETS).every(k => WM.WM_ART_KEYS.includes(k)), 'WM_ASSETS 只登记已知美术 key');
console.log(`${n - fail}/${n} passed`); if (fail) (globalThis as any).process.exit(1);
