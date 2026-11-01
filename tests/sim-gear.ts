// feat/sim-gear-swap：sim 换装（SIM_GEAR_SWAP=1；默认关 = 旧行为「只往空格穿」）。只改 sim，不改游戏代码/数据。
// 打分：score = Σ 权重×属性（物品 stats + 未写 mdef 时按 World.itemMdef 推算的魔御 + 幸运），权重见 W。
// 每个栏位组（武器/头盔/衣服/项链/靴子/腰带单格；戒指/手镯双格）从「背包里可穿的件 + 已穿戴」中取分数最高的；
// 可穿 = 有 slot、req ≤ 当前等级、ITEMS.cls 为空或含本职业。只在分数严格更高时替换（需求更高但分更低不换）；换下的件经 equipItem 回到背包原位。
// 换装后清包：卖他职业件与已被淘汰的件（见 gearTick）。
// 评估时机：每个 tick 检查「背包签名（长度+uid 序列）或等级」是否变化，变化即评估（= 拾取、商店买入、解包、升级、复活、进图后背包变动时）。
// SIM_GEAR_DUMP=路径：Lv40/45/50 首次到达时把各栏位穿戴写成 JSONL（只读）。
// @ts-ignore tsconfig 无 node 类型（运行于 tsx）
import { appendFileSync } from 'node:fs';
declare const process: any;
import { ITEMS } from '../src/data/items';
export const GEAR_SWAP = !!process.env.SIM_GEAR_SWAP;
const DUMP = process.env.SIM_GEAR_DUMP;
export const W: Record<string, Record<string, number>> = {
  warrior: { atk: 10, mag: 0, tao: 0, def: 4, mdef: 3, hp: 0.2, mp: 0.02, luck: 8 },
  mage: { atk: 0.5, mag: 10, tao: 0, def: 4, mdef: 3, hp: 0.2, mp: 0.05, luck: 2 },
  taoist: { atk: 0.5, mag: 0, tao: 10, def: 4, mdef: 3, hp: 0.2, mp: 0.05, luck: 2 },
};
const GROUPS: Record<string, string[]> = { ring: ['ring1', 'ring2'], bracelet: ['bracelet1', 'bracelet2'] };
export function gearScore(w: any, it: any): number {
  const wt = W[w.cls] ?? W.warrior; let s = 0;
  for (const [k, v] of Object.entries(it.stats ?? {})) s += (wt[k] ?? 0) * ((v as number) ?? 0);
  if (it.stats?.mdef === undefined && w.itemMdef) s += wt.mdef * w.itemMdef(it);
  return s + wt.luck * (it.luck ?? 0);
}
// 职业：ITEMS.cls 有值按 cls；无 cls 的件按「主属性归属」——别职业主属性之和 > 本职业主属性 即视为他职业件不穿（如战士不穿魔法长袍 mag6、法师不穿灵魂战衣 tao6）
const MAIN: Record<string, string> = { warrior: 'atk', mage: 'mag', taoist: 'tao' }, OTHER: Record<string, string[]> = { warrior: ['mag', 'tao'], mage: ['tao'], taoist: ['mag'] };
export const foreign = (cls: string, it: any) => { const cl = ITEMS[it.item]?.cls; if (cl?.length) return !(cl as string[]).includes(cls); const s = it.stats ?? {}; return (OTHER[cls] ?? []).reduce((a, k) => a + (s[k] ?? 0), 0) > (s[MAIN[cls]] ?? 0); };
const ok = (w: any, it: any) => !!it?.slot && it.req <= w.level && !foreign(w.cls, it);
const st = new WeakMap<any, { sig: string; dumped: Set<number> }>();
export function gearTick(w: any, cls: string, seed: number, swap = GEAR_SWAP) {
  let m = st.get(w); if (!m) { m = { sig: '', dumped: new Set() }; st.set(w, m); }
  const sig = w.level + ':' + w.bag.map((x: any) => x.uid).join(',');
  if (swap && sig !== m.sig) {
    for (let guard = 0; guard < 50; guard++) { let best: [number, string, number] | null = null;
      for (let i = 0; i < w.bag.length; i++) { const it = w.bag[i]; if (!ok(w, it)) continue;
        const sl = GROUPS[it.slot] ?? [it.slot]; const sc = gearScore(w, it);
        // 目标格：空格优先，否则分最低的已穿件
        let tgt = sl.find(s => !w.equip[s]); let cur = -Infinity;
        if (!tgt) { tgt = sl.reduce((a, b) => gearScore(w, w.equip[a]) <= gearScore(w, w.equip[b]) ? a : b); cur = gearScore(w, w.equip[tgt]); }
        const gain = sc - cur; if (gain > 1e-9 && (!best || gain > best[0])) best = [gain, tgt, i]; }
      if (!best) break; if (w.equipItem(best[2], best[1])) break; }
    // 清包（像真人卖垃圾）：旧 sim 从不卖装备 → 实测 Lv40 前背包 200/200 满（173 件装备），之后什么都捡不起来。
    // 卖：他职业件；以及 req ≤ 当前等级、且分数 ≤ 该栏位组已穿最低分的件（已被淘汰）。req 高于当前等级的件保留（以后可穿）。
    for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (!it?.slot) continue;
      const sl = GROUPS[it.slot] ?? [it.slot]; if (sl.some(s => !w.equip[s])) { if (foreign(w.cls, it)) w.sellItem(i); continue; }
      const worst = Math.min(...sl.map(s => gearScore(w, w.equip[s])));
      if (foreign(w.cls, it) || (it.req <= w.level && gearScore(w, it) <= worst)) w.sellItem(i); }
    m.sig = w.level + ':' + w.bag.map((x: any) => x.uid).join(',');
  }
  if (DUMP && [40, 45, 50].includes(w.level) && !m.dumped.has(w.level)) { m.dumped.add(w.level); dump(w, cls, seed, w.level); }
}
function dump(w: any, cls: string, seed: number, lv: number | string) {
  const nm = (v: any) => `${v.name}(${v.item},req${v.req})`;
  appendFileSync(DUMP, JSON.stringify({ cls, seed, lv, swap: GEAR_SWAP, equip: Object.fromEntries(Object.entries(w.equip).filter(([, v]) => v).map(([k, v]: any) => [k, nm(v)])),
    bagN: w.bag.length, bagEq: w.bag.filter((x: any) => x.slot).length, bag40: w.bag.filter((x: any) => x.slot && x.req >= 35).map(nm) }) + '\n'); }
/** sim 结束时（通关即 Lv50 后循环退出，tick 里拿不到 Lv50）再记一次，lv 记 'end@等级' */
export function gearEnd(w: any, cls: string, seed: number) { if (DUMP) dump(w, cls, seed, 'end@' + w.level); }
