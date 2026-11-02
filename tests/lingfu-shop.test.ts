// 灵符商城：钱包 / 购买扣费 / 库存 / 冷却 / 存档迁移 / 价格表一致性 / 旧存档兼容（docs/lingfu-shop.md）
declare const process: { exit(c: number): never };
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
import { World, migrateEquip } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
import { ITEMS, EQUIP_SLOTS, EQUIP_SLOT_NAMES, SLOT_NAMES } from '../src/data/items';
import { TOWNS, returnTownOf } from '../src/data/towns';
import { LocalWallet, LINGFU_KEY, SIGNUP_GRANT, LINGFU_PER_YUAN, yuanOf, parseWallet, RemoteWallet } from '../src/shop/wallet';
import { PRODUCTS, PRODUCT_BY_SKU, BLOODSTONES, SHOP_ITEMS, productsOf, SHOP_TABS, RETURN_STONE_USES, RETURN_STONE_CD_MS, RECHARGE_TIERS } from '../src/shop/catalog';
import { buy, useReturnStone, useSummonScroll, makeShopItem, isShopUsable } from '../src/shop/shop';
const last = <T>(a: T[]): T => a[a.length - 1];
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } pass++; console.log('ok', m); };
const mem = () => { const m = new Map<string, string>(); return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const mk = (c: any = 'warrior', save?: any) => { const w = new World(() => 0.5, 50, FLOORS, c, save); w.step(0.05); w.drainEvents(); return w; };

// ── 钱包
{
  const st = mem(); const a = new LocalWallet(st);
  ok(a.balance() === SIGNUP_GRANT && a.justGranted && st.m.has(LINGFU_KEY), '首次创建钱包发 5000 并写入 fcl_lingfu_v1');
  const b = new LocalWallet(st); ok(!b.justGranted && b.balance() === SIGNUP_GRANT, '再次加载不重复发放');
  b.spend('return_stone', 100, 1, 'k1'); const c = new LocalWallet(st); ok(c.balance() === 4900, '扣费持久化，删槽/新槽不影响（钱包与存档槽无关）');
  ok(parseWallet('{bad') === null && parseWallet(JSON.stringify({ balance: 'x' })) === null, '坏数据视为不存在');
  ok(parseWallet(JSON.stringify({ balance: 12.7 }))!.balance === 12, '余额取整');
  ok(c.spend('x', 100, 1, 'k1').ok && (c.spend('x', 100, 1, 'k1') as any).dup && c.balance() === 4900, '幂等键重复不重复扣费');
  ok(!c.spend('x', 100, 0, 'k2').ok && !c.spend('x', 100, 1.5, 'k3').ok, '数量非法拒绝');
  const r = c.spend('x', 99999, 1, 'k4'); ok(!r.ok && r.error === 'balance' && c.balance() === 4900, '余额不足不扣');
  ok(LINGFU_PER_YUAN === 10 && yuanOf(300) === 30, '1 元 = 10 灵符（只作显示）');
  const bad = { getItem: () => null, setItem: () => { throw new Error('quota'); } }; const d = new LocalWallet(bad as any);
  const rr = d.spend('x', 100, 1, 'q'); ok(!rr.ok && rr.error === 'io' && d.balance() === SIGNUP_GRANT, '写入失败回滚，不扣费');
}
// ── 远端适配层（空实现）
{ const r = new RemoteWallet(); const x = await r.spend('return_stone', 100, 1, 'k'); ok(!x.ok && x.error === 'not_configured' && r.kind === 'remote', 'RemoteWallet 预留：未配置返回 not_configured'); }
// ── 价格表一致性
{
  const want: Record<string, number> = { summon_lv7_scroll: 300, return_stone: 100, skill_necklace: 500, stone_s: 200, stone_m: 450, stone_l: 900, stone_x: 1800, exp_scroll: 300 /* feat/exp-scroll 建议价，待用户定 */ };
  ok(PRODUCTS.length === 8 && PRODUCTS.every(p => want[p.sku] === p.price), '价格表 = 简报（300/100/500/200/450/900/1800）');
  ok(PRODUCTS.every(p => ITEMS[p.item] && SHOP_ITEMS[p.item]), '每个商品都有物品定义');
  ok(['stone_s', 'stone_m', 'stone_l', 'stone_x'].map(k => (BLOODSTONES as any)[k]).map((b: any) => `${b.hp}/${b.req}`).join(',') === '20000/1,50000/35,120000/40,300000/45', '血石储量/佩戴等级');
  ok(!PRODUCTS.some(p => /bless_oil|black_iron/.test(p.item)) && PRODUCTS.every(p => !ITEMS[p.item].equip || Object.keys(ITEMS[p.item].equip!).length === 0), '不售祝福油/黑铁/带属性装备');
  const doc = readFileSync('docs/lingfu-shop.md', 'utf8'); ok(PRODUCTS.every(p => doc.includes(`| ${p.sku} |`) && doc.includes(`${p.price}`)), '文档实现表与价格表一致');
  ok(SHOP_TABS.length === 6 && productsOf('recharge').length === 0 && productsOf('hot').length > 0 && RECHARGE_TIERS.every(t => t.lingfu === t.yuan * 10), '页签/充值档位');
  ok(PRODUCTS.every(p => !/原创素材/.test(p.desc + p.note)), '文案无「原创素材」');
}
// ── stone 装备栏
ok(EQUIP_SLOTS.includes('stone') && EQUIP_SLOT_NAMES.stone === '血石' && SLOT_NAMES.stone === '血石', '新增血石栏 stone');
// ── 购买扣费 / 库存
{
  const w = mk(), wal = new LocalWallet(mem());
  const r = buy(w, wal, 'return_stone'); ok(r.ok && wal.balance() === 4900 && last(w.bag).item === 'return_stone' && last(w.bag).uses === RETURN_STONE_USES && last(w.bag).bound, '购买回城石：扣 100，入包 10 次，绑定');
  const s = buy(w, wal, 'stone_x'); ok(s.ok && last(w.bag).charge!.hp === 300000 && last(w.bag).req === 45 && last(w.bag).slot === 'stone', '血石（特）储量 30 万、45 级');
  const n0 = w.bag.length; const f = buy(w, wal, 'stone_x');
  const bal = wal.balance(); const g = buy(w, wal, 'stone_x'); ok(!g.ok && g.reason === 'balance' && wal.balance() === bal && w.bag.length === n0 + 1 && f.ok, '灵符不足：不扣费不发货');
  ok(!buy(w, wal, 'nope').ok, '未知商品拒绝');
  while (w.bag.length < WORLD.bagSize) w.bag.push(makeShopItem(w, 'summon_lv7_scroll'));
  const b2 = wal.balance(); const h = buy(w, wal, 'return_stone'); ok(!h.ok && h.reason === 'bag' && wal.balance() === b2, '背包满：不扣费');
}
// ── 血石佩戴等级 / 技巧项链占项链栏
{
  const w = mk(); w.level = 1; const wal = new LocalWallet(mem()); buy(w, wal, 'stone_s'); buy(w, wal, 'skill_necklace');
  const si = w.bag.findIndex(i => i.item === 'stone_s'); ok(!w.equipItem(si) && w.equip.stone?.item === 'stone_s', '1 级即可戴小血石进 stone 栏（无等级限制）');
  { const w2 = mk(); w2.level = 34; const wal2 = new LocalWallet(mem()); buy(w2, wal2, 'stone_m'); const mi = w2.bag.findIndex(i => i.item === 'stone_m'); ok(!!w2.equipItem(mi) && !w2.equip.stone, '34 级戴中血石（Lv35）→ 等级不足'); w2.level = 35; ok(!w2.equipItem(w2.bag.findIndex(i => i.item === 'stone_m')) && w2.equip.stone?.item === 'stone_m', '35 级可戴中血石'); }
  const ni = w.bag.findIndex(i => i.item === 'skill_necklace'); ok(!w.equipItem(ni) && w.equip.necklace?.item === 'skill_necklace', '技巧项链占项链栏');
}
// ── 回城石：冷却 / 次数 / 目的地
{
  const w = mk(), wal = new LocalWallet(mem()); (w as any).town = null; w.loadFloor(5); w.step(0.05); w.drainEvents(); buy(w, wal, 'return_stone');
  const i = w.bag.findIndex(x => x.item === 'return_stone'); const f = w.floorIndex, want = returnTownOf(f);
  const t0 = 1_000_000; const r = useReturnStone(w, i, t0);
  ok(r.ok && w.town === want && w.bag[i].uses === RETURN_STONE_USES - 1, `回城石：无读条回到所在区域主城（${TOWNS[want].name}），剩 9 次`);
  ok(!useReturnStone(w, i, t0 + 1000).ok, '城内/冷却中不可用');
  (w as any).town = null; const c = useReturnStone(w, i, t0 + RETURN_STONE_CD_MS - 1); ok(!c.ok && /冷却/.test(c.msg), '30 秒冷却');
  w.bag[i].uses = 1; (w as any).town = null; const d = useReturnStone(w, i, t0 + RETURN_STONE_CD_MS); ok(d.ok && !w.bag.some(x => x.item === 'return_stone'), '最后一次用完后移除');
  ok(isShopUsable('return_stone') && isShopUsable('summon_lv7_scroll') && !isShopUsable('stone_s'), '可使用物品判定');
}
// ── 召唤直升卷轴
{
  const w0 = mk('taoist'); const sv: any = w0.toSave(); const def = (w0 as any).summonDefs[0];
  sv.summons = [{ id: def.id, sLv: 1, sKills: 0, base: { hp: 100, atk: 10, start: 1, name: def.name ?? '骷髅' }, hpR: 1 }];
  const w = mk('taoist', sv); ok(w.summons.length === 1, '读档恢复召唤物');
  w.bag.push(makeShopItem(w, 'summon_lv7_scroll')); const i = w.bag.length - 1; const hp1 = w.summons[0].maxHp;
  const r = useSummonScroll(w, i); ok(r.ok && w.summons[0].sLv === 7 && w.summons[0].maxHp > hp1 && !w.bag.some(x => x.item === 'summon_lv7_scroll'), '召唤物直升 7 级并消耗');
  w.bag.push(makeShopItem(w, 'summon_lv7_scroll')); ok(!useSummonScroll(w, w.bag.length - 1).ok && w.bag.some(x => x.item === 'summon_lv7_scroll'), '已满级不消耗');
  const w2 = mk(); w2.bag.push(makeShopItem(w2, 'summon_lv7_scroll')); ok(!useSummonScroll(w2, w2.bag.length - 1).ok, '无召唤物不消耗');
}
// ── 存档迁移 / 旧存档兼容
{
  const w = mk(), wal = new LocalWallet(mem()); w.level = 40; buy(w, wal, 'stone_l'); w.equipItem(w.bag.findIndex(x => x.item === 'stone_l')); buy(w, wal, 'return_stone');
  last(w.bag).uses = 3; last(w.bag).cdAt = 123;
  const sv = JSON.parse(JSON.stringify(w.toSave())); ok(!('lingfu' in sv) && !JSON.stringify(sv).includes('balance'), '灵符余额不进 SaveData');
  const w2 = mk('warrior', sv); ok(w2.equip.stone?.charge?.hp === 120000 && last(w2.bag).uses === 3 && last(w2.bag).cdAt === 123, 'stone 栏/次数/冷却随存档往返');
  const old: any = JSON.parse(JSON.stringify(mk().toSave())); delete old.equip.stone; old.eqV = 1; old.equip.ring = old.equip.ring1; delete old.equip.ring1;
  const e = migrateEquip(old); ok(!e.stone && !('ring' in e), '旧档（无 stone）迁移：stone 为空');
  const w3 = mk('warrior', old); ok(!w3.equip.stone && w3.stats().hp > 0, '旧存档可加载');
  const cur = JSON.parse(JSON.stringify(mk().toSave())); cur.bossCdId = { '3:boss_x': 30 }; const w4 = mk('warrior', cur); ok(!!w4, '含 bossCdId（feat/maps-3050-combat）字段的存档可加载');
}
console.log(`lingfu-shop 全部通过 ${pass} 项`);
