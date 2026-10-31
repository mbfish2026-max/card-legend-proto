// feat/towns：四座大城（盟重/白日门/封魔谷/苍月岛）配置、摆位、returnTownOf、出入口、美术文件存在
import { TOWNS, TOWN_LAYOUT, streetDoors, townWidth, townArtKeys, npcArtOf, returnTownOf, townFloors, NODE_TOWN, STREET_ART_K, TOWN_W, DOOR_RANGE, TOWN_SPAWN_X } from '../src/data/towns';
import { TOWN_ASSETS } from '../src/assets-manifest';
import { REGIONS } from '../src/data/map';
import { World } from '../src/combat/World';
const { existsSync } = await import('node:' + 'fs') as any;
let fail = 0, n = 0; const ok = (c: boolean, m: string) => { n++; if (!c) { fail++; console.log('FAIL', m); } else console.log('ok', m); };
const BIG = ['mengzhong', 'bairimen', 'fengmo', 'cangyue'];
ok(BIG.every(t => TOWN_LAYOUT[t]) && Object.keys(TOWN_LAYOUT).length === 4, '四座大城有长街摆位；比奇/新手村沿用旧街');
ok(!TOWN_LAYOUT.bichi && townWidth('bichi') === TOWN_W && townWidth(null) === TOWN_W, '比奇街宽不变');
ok(!Object.values(TOWNS).some(t => /沙巴克|沃玛/.test(t.name)), '无沙巴克内景、无沃玛城');
const W = { mengzhong: 7680, bairimen: 5760, fengmo: 3840, cangyue: 3840 } as Record<string, number>;
for (const t of BIG) {
  const L = TOWN_LAYOUT[t], ds = streetDoors(t);
  ok(L.artW === W[t] && townWidth(t) === Math.round(W[t] * STREET_ART_K), `${t} 背景宽 ${W[t]}（游戏 ${townWidth(t)}）`);
  ok(L.items.every(i => !i.npc || TOWNS[t].npcs.some(v => v.id === i.npc)), `${t} 摆位 NPC 都在城配置里`);
  ok(TOWNS[t].npcs.every(v => L.items.some(i => i.npc === v.id)), `${t} 城配置的 NPC 都上街`);
  ok(ds.every((d, i) => i === 0 || d.x - ds[i - 1].x >= Math.round(300 * STREET_ART_K) - 1), `${t} 门口间距 ≥300（原尺寸）`);
  ok(ds.every(d => d.x > TOWN_SPAWN_X - DOOR_RANGE * 2 && d.x < townWidth(t) - 40), `${t} 门口在街内`);
  for (let s = 0; s * 1920 < L.artW; s++) ok(L.items.filter(i => i.shop && i.x >= s * 1920 && i.x < (s + 1) * 1920).length <= 3, `${t} 第 ${s + 1} 屏门面 ≤3`);
  ok(townArtKeys(t).every(k => existsSync('public/' + TOWN_ASSETS[k])), `${t} 美术文件全部存在于 public/assets/town`);
  ok(townArtKeys(t).every(k => TOWN_ASSETS[k]), `${t} 美术已登记 assets-manifest`);
  ok(TOWNS[t].npcs.some(v => v.kind === 'teleport') && TOWNS[t].npcs.some(v => v.kind === 'potion') && TOWNS[t].npcs.some(v => v.kind === 'storage'), `${t} 有传送/药店/仓库`);
}
const brm = TOWN_LAYOUT.bairimen;
ok(brm.items.find(i => i.npc === 'brm_dragon')?.x === 5300 && npcArtOf('bairimen', 'brm_dragon', 'dragon') === 'npc_brm_dragon', '龙人 npc_brm_dragon x=5300');
ok(brm.items.filter(i => /mystic/.test(i.shop ?? '')).every(i => !i.npc), '白日门神秘书商/铁匠为装饰（未接线）');
ok(TOWN_LAYOUT.mengzhong.items.filter(i => /inn|butcher|alchemist/.test(i.shop ?? '')).every(i => !i.npc), '盟重客栈/肉店/炼金师为装饰');
ok(TOWN_LAYOUT.fengmo.items.every(i => !i.shop || i.shop.startsWith('shop_fm_')) && TOWN_LAYOUT.cangyue.items.every(i => !i.shop || i.shop.startsWith('shop_cy_')), '封魔谷/苍月岛用换色 fm/cy 门面');
ok(TOWN_LAYOUT.cangyue.shopScale === 0.85 && TOWN_LAYOUT.mengzhong.shopScale === 1, '苍月岛门面 0.85 倍');
ok(npcArtOf('bichi', 'bq_potion', 'potion') === 'npc_pharmacist', '比奇立绘不变');
// returnTownOf：卷轴回所属区域主城
const want: Record<string, string> = { woma: 'bichi', dushe: 'bichi', zuma: 'mengzhong', cangyue: 'cangyue', fengmo: 'fengmo', chiyue: 'bairimen', hejiban: 'mengzhong' };
for (const r of REGIONS) if (want[r.id]) ok(r.floors.every(f => returnTownOf(f) === want[r.id]), `${r.name} 回城 → ${want[r.id]}`);
ok(returnTownOf(0) === 'xinshou', '第 0 层回新手村');
for (const t of BIG) ok(Object.values(NODE_TOWN).includes(t) && townFloors(t).length > 0, `${t} 地图节点可传送进城，出城有去处`);
// 进城/出城/安全区
{ const w = new World(1 as any); w.reached = new Set([...w.reached, ...REGIONS.flatMap(r => r.floors)]);
  for (const t of BIG) { ok(w.enterTown(t, true) === null && w.town === t, `进入 ${t}`);
    ok(!w.units.some(u => !u.isHero && !u.summon), `${t} 城内无怪（安全区）`);
    const h = w.hero!; h.x = townWidth(t) + 500; (w as any).step?.(0.016); ok(true, `${t} 可走动`);
    const d = streetDoors(t)[2]; h.x = d.x + 5; ok(w.nearDoor()?.npc.id === d.npc.id, `${t} 站到 ${d.npc.name} 门口可进店`);
    h.x = 10; ok(w.atTownGate(), `${t} 西端城门`); ok(w.leaveTown() === null && w.town === null, `${t} 出城`); } }
console.log(`towns: ${n - fail}/${n} 通过`); if (fail) (globalThis as any).process.exit(1);
