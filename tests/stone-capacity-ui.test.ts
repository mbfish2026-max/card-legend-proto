// 血石容量显示（feat/stone-capacity-ui）：格式化 / 变化检测 / 耗尽判定 / 旧存档兼容
declare const process: { exit(c: number): never };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { makeShopItem } from '../src/shop/shop';
import { fmtCap, stoneCap, isStoneEmpty, fmtPool, stoneSig, stoneTipLines } from '../src/ui/stoneCap';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } pass++; console.log('ok', m); };
const mk = (save?: any) => { const w = new World(() => 0.5, 50, FLOORS, 'warrior', save); w.step(0.05); w.drainEvents(); return w; };

// 格式化
const F: [number, string][] = [[0, '0'], [7, '7'], [999, '999'], [1000, '1k'], [1234, '1.2k'], [1299, '1.2k'], [3000, '3k'], [9999, '9.9k'], [19997, '19.9k'], [20000, '20k'], [50000, '50k'], [119999, '119k'], [120000, '120k'], [300000, '300k'], [1_250_000, '1.2M'], [-5, '0'], [12.9, '12']];
for (const [n, s] of F) ok(fmtCap(n) === s, `fmtCap(${n})=${s}（实际 ${fmtCap(n)}）`);
ok(fmtCap(19997) !== fmtCap(20000), '未满不会显示成满（向下取整）');
for (const n of [0, 3, 999, 19997, 299999, 300000]) ok(fmtPool({ kind: 'hp', left: n, total: 300000 }).length <= 10, `「剩余/总」≤10 字符：${fmtPool({ kind: 'hp', left: n, total: 300000 })}`);

// 读数
const w = mk();
const s = makeShopItem(w, 'stone_s'), m = makeShopItem(w, 'stone_m'), x = makeShopItem(w, 'stone_x');
ok(stoneCap(s)!.pools.length === 1 && stoneCap(s)!.pools[0].kind === 'hp', '小血石只显示红');
ok(stoneCap(m)!.pools.map(p => p.kind).join() === 'hp,mp', '中血石显示红+蓝');
ok(fmtPool(stoneCap(x)!.pools[0]) === '300k/300k', '特血石满 300k/300k');
ok(stoneCap(w.makeItem('return_stone' as any, 'common') as any) === null && stoneCap(undefined) === null, '非血石不显示');
ok(stoneTipLines(m)[0][0] === '红储量 50000/50000' && stoneTipLines(m)[1][0] === '蓝储量 50000/50000', '提示框显示精确数值');
ok(stoneTipLines(s).some(l => l[0] === '小血石只补红'), '小血石提示只补红');

// 耗尽
ok(!isStoneEmpty(s), '满储量不是耗尽');
s.charge!.hp = 0; ok(isStoneEmpty(s), '小血石红=0 即耗尽（蓝不计）');
m.charge!.hp = 0; ok(!isStoneEmpty(m), '中血石红=0 蓝>0 不算耗尽');
ok(stoneTipLines(m)[0][1] === '#ff4040', '单池为 0 标红');
m.charge!.mp = 0; ok(isStoneEmpty(m), '中血石红蓝都 0 耗尽');
ok(stoneTipLines(m).some(l => /耗尽/.test(l[0])), '提示框写「耗尽」');
const odd = makeShopItem(w, 'stone_l'); odd.charge = { hp: 999999, mp: -3 } as any;
ok(stoneCap(odd)!.pools[0].left === 120000 && stoneCap(odd)!.pools[1].left === 0, '异常储量钳制到 [0,总量]');

// 变化检测
const st = makeShopItem(w, 'stone_m'); const sig0 = stoneSig(st, []);
ok(stoneSig(st, []) === sig0, '数值不变签名不变（不重绘）');
st.charge!.hp -= 1; ok(stoneSig(st, []) !== sig0, '储量减 1 签名变化（触发重绘）');
const bagSig = stoneSig(undefined, [st]); st.charge!.mp -= 5; ok(stoneSig(undefined, [st]) !== bagSig, '背包血石变化也检测');
ok(stoneSig(undefined, [w.makeItem('return_stone' as any, 'common') as any, undefined]) === '', '无血石签名为空');

// 实战：tickStone 消耗 → 签名变化；不改 tickStone
{
  const v = mk(); const it = makeShopItem(v, 'stone_s'); (v.equip as any).stone = it;
  const before = stoneSig(v.equip.stone, v.bag);
  v.town = null as any; v.hero!.hp = 1; (v as any).stoneHpReady = 0; v.hero!.potReady = 0;
  for (let i = 0; i < 20 && it.charge!.hp === 20000; i++) { v.hero!.hp = 1; v.step(0.1); }
  ok(it.charge!.hp < 20000, `tickStone 消耗了储量（${it.charge!.hp}）`);
  ok(stoneSig(v.equip.stone, v.bag) !== before, '战斗消耗后签名变化');
}

// 旧存档兼容：存档往返保留储量；缺 charge 的老血石按 0 显示（tickStone 本就不补）
{
  const v = mk(); const it = makeShopItem(v, 'stone_m'); it.charge = { hp: 1234, mp: 0 }; (v.equip as any).stone = it;
  const sv = JSON.parse(JSON.stringify(v.toSave())); const v2 = mk(sv);
  ok(fmtPool(stoneCap(v2.equip.stone)!.pools[0]) === '1.2k/50k', '存档往返后显示 1.2k/50k');
  delete sv.equip.stone.charge; const v3 = mk(sv);
  ok(stoneCap(v3.equip.stone)!.empty, '旧档无 charge → 显示 0/总并标耗尽，不报错');
  const sv2 = JSON.parse(JSON.stringify(sv)); delete sv2.equip.stone; ok(mk(sv2).equip.stone === undefined && stoneSig(undefined, []) === '', '无血石旧档正常');
}
console.log(`stone-capacity-ui: ${pass} passed`);
