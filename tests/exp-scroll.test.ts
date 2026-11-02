// feat/exp-scroll：5 倍经验卷轴——倍率 / 计时扣减 / 续时与上限 / 存档读写与旧档兼容 / 钱包扣费与余额不足 / 只乘击杀经验
declare const process: { exit(c: number): never };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { killExp } from '../src/data/balance';
import { LocalWallet, SIGNUP_GRANT } from '../src/shop/wallet';
import { PRODUCT_BY_SKU, EXP_SCROLL_MUL, EXP_SCROLL_SEC, EXP_SCROLL_MAX_SEC, EXP_SCROLL_PRICE, SKILL_NECKLACE_MUL } from '../src/shop/catalog';
import { buy, isShopUsable, useShopItem } from '../src/shop/shop';
import { expScrollMult, tickExpScroll, extendExpScroll, loadExpScroll, fmtLeft, useExpScroll } from '../src/shop/expScroll';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } pass++; console.log('ok', m); };
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const mk = (save?: any, lv = 10) => { const w = new World(() => 0.5, lv, FLOORS, 'warrior', save); w.step(0.05); w.drainEvents(); return w; };
// 倍率
ok(EXP_SCROLL_MUL === 5 && EXP_SCROLL_SEC === 7200 && EXP_SCROLL_MAX_SEC === 28800, '常量：×5 / 2h / 上限 8h');
ok(expScrollMult(0) === 1 && expScrollMult(-3) === 1 && expScrollMult(0.01) === 5 && expScrollMult(28800) === 5, '倍率：剩余>0 → 5，否则 1（不叠加）');
// 计时
ok(tickExpScroll(100, 1)[0] === 99 && !tickExpScroll(100, 1)[1], '扣减 dt');
{ const [l, e] = tickExpScroll(0.5, 1); ok(l === 0 && e, '跨过 0 → 0 且报到期一次'); }
ok(!tickExpScroll(0, 1)[1] && tickExpScroll(0, 1)[0] === 0, '已为 0 不再报到期');
ok(tickExpScroll(50, 0)[0] === 50 && tickExpScroll(50, -1)[0] === 50, 'dt≤0 不扣');
// 续时与上限
ok(extendExpScroll(0).left === 7200 && extendExpScroll(3600).left === 10800, '续时累加 2h');
ok(extendExpScroll(21600).ok && extendExpScroll(21600).left === 28800, '6h + 2h = 8h 允许');
ok(!extendExpScroll(21601).ok && extendExpScroll(21601).left === 21601, '超过上限拒绝且不改剩余');
// 格式
ok(fmtLeft(7200) === '2:00:00' && fmtLeft(59.2) === '01:00' && fmtLeft(3599) === '59:59' && fmtLeft(0) === '00:00', '倒计时格式');
// 存档读
ok(loadExpScroll(undefined) === 0 && loadExpScroll('x') === 0 && loadExpScroll(NaN) === 0 && loadExpScroll(-5) === 0 && loadExpScroll(99999) === 28800 && loadExpScroll(123) === 123, '存档读：缺省/非法=0，超上限钳');
// 商品
{ const p = PRODUCT_BY_SKU.exp_scroll; ok(p && p.price === EXP_SCROLL_PRICE && EXP_SCROLL_PRICE === 300 && isShopUsable('exp_scroll'), '商品：价格读单一常量 EXP_SCROLL_PRICE=300（建议值）、背包可点用'); }
// 钱包扣费 / 余额不足
{
  const w = mk(), wal = new LocalWallet(mem()); const r = buy(w, wal, 'exp_scroll');
  ok(r.ok && wal.balance() === SIGNUP_GRANT - 300 && w.bag.some(i => i.item === 'exp_scroll' && i.bound), '购买扣 300 灵符并发货（绑定）');
  const poor = new LocalWallet(mem()); poor.spend('x', SIGNUP_GRANT - 100, 1, 'k'); const n = w.bag.length;
  const r2 = buy(w, poor, 'exp_scroll'); ok(!r2.ok && r2.reason === 'balance' && poor.balance() === 100 && w.bag.length === n, '余额不足：不扣不发');
}
// 使用 / 续用 / 上限拒绝不消耗
{
  const w = mk(); const wal = new LocalWallet(mem()); for (let i = 0; i < 5; i++) buy(w, wal, 'exp_scroll');
  const idx = () => w.bag.findIndex(i => i.item === 'exp_scroll'), cnt = () => w.bag.filter(i => i.item === 'exp_scroll').length;
  ok(w.getExpMultiplier() === 1, '未用 ×1');
  ok(useShopItem(w, idx()).ok && w.expScrollLeft === 7200 && cnt() === 4 && w.getExpMultiplier() === 5, '使用 → 2h、×5、消耗 1');
  for (let i = 0; i < 3; i++) useExpScroll(w, idx()); ok(w.expScrollLeft === 28800 && cnt() === 1, '连用 4 张 = 8h');
  const r = useExpScroll(w, idx()); ok(!r.ok && cnt() === 1 && w.expScrollLeft === 28800, '到上限再用：拒绝、未消耗');
}
// World.step 计时（在线游戏时间）+ 到期提示
{
  const w = mk(); w.expScrollLeft = 1; for (let i = 0; i < 10; i++) w.step(0.05); ok(Math.abs(w.expScrollLeft - 0.5) < 1e-6, 'step 扣减在线时间');
  for (let i = 0; i < 12; i++) w.step(0.05); const ev = w.drainEvents();
  ok(w.expScrollLeft === 0 && ev.filter((e: any) => e.type === 'log' && /经验卷轴效果已结束/.test(e.text)).length === 1 && w.getExpMultiplier() === 1, '到期 → 0、×1、提示一次');
}
// 存档往返 / 旧档
{
  const w = mk(); w.expScrollLeft = 3000.2; const s = w.toSave(); ok(s.expScrollSec === 3001, '存档写 expScrollSec（秒，向上取整）');
  const w2 = mk(JSON.parse(JSON.stringify(s))); ok(Math.abs(w2.expScrollLeft - 3001 + 0.05) < 1e-6 || w2.expScrollLeft <= 3001 && w2.expScrollLeft > 3000, '读档保留剩余时间');
  const w3 = mk(); ok(!('expScrollSec' in w3.toSave()), '无增益不写字段');
  const old: any = { ...w3.toSave() }; delete old.expScrollSec; const w4 = mk(old); ok(w4.expScrollLeft === 0 && w4.getExpMultiplier() === 1, '旧档无字段 = 无增益');
}
// 击杀经验 ×5；技巧项链不影响角色经验（只乘熟练度）
{
  const k = (left: number, neck = false) => { const w = mk(undefined, 10); w.expScrollLeft = left; if (neck) w.equip.necklace = w.makeItem('skill_necklace', 'common');
    const e = w.alive('enemy')[0]; const want = killExp(e.id, w.floorIndex, w.level, e.level ?? 1); const lv = w.level; w.exp = 0; e.hp = 0; w.kill(e); return { got: w.exp, want, up: w.level !== lv }; };
  const a = k(0), b = k(100), c = k(100, true);
  ok(!a.up && !b.up && a.got === a.want, `无卷轴：击杀经验 = killExp (${a.got})`);
  ok(b.got === b.want * 5, `有卷轴：击杀经验 ×5 (${b.want}→${b.got})`);
  ok(c.got === b.got && SKILL_NECKLACE_MUL === 5, '技巧项链不改角色经验（只乘熟练度），两者不冲突');
}
console.log(`exp-scroll: ${pass} passed`);
