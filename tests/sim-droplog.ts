// feat/sim-gear-swap：掉落统计开关 SIM_DROP_LOG=<jsonl 路径>（默认关；只读，不消耗 rng，不改轨迹）
// 记录：每怪实战击杀数（按英雄等级段 <40 / 40–49 / ≥50）、虚拟刷怪击杀数（不掉装备）、
//       需求≥SIM_DROP_REQ(默认 35) 的武器/衣服掉落事件 → 结局（picked / lost[地面清掉，含背包满标记] / sold / 穿上）
declare const process: { env: Record<string, string | undefined> };
import { World } from '../src/combat/World';
import { ITEMS } from '../src/data/items';
import { WORLD } from '../src/data/world';
import * as fs from 'fs';
export const DL = process.env.SIM_DROP_LOG || '';
const REQ = Number(process.env.SIM_DROP_REQ ?? 35);
const SLOTS = new Set(['weapon', 'armor']);
const bandOf = (lv: number) => (lv < 40 ? 0 : lv < 50 ? 1 : 2);
type Rec = { gid: number; uid: number; item: string; req: number; lv: number; mon: string; fate: string; bagFull: boolean; equipped?: number; soldLv?: number; floor: number };
let cur: { kills: Record<string, number[]>; virt: Record<string, number[]>; drops: Rec[]; fullTicks40: number; ticks40: number } = fresh();
function fresh() { return { kills: {}, virt: {}, drops: [], fullTicks40: 0, ticks40: 0 }; }
if (DL) {
  const orig = World.prototype.kill;
  World.prototype.kill = function (this: World, u: any) {
    const before = new Set(this.ground.map(g => g.gid));
    const r = orig.call(this, u);
    if (u.team === 'enemy' && !u.summon) {
      (cur.kills[u.id] ??= [0, 0, 0])[bandOf(this.level)]++;
      for (const g of this.ground) if (!before.has(g.gid) && g.inv) { const d: any = ITEMS[g.item]; if (d?.slot && SLOTS.has(d.slot) && (d.req ?? 0) >= REQ) cur.drops.push({ gid: g.gid, uid: g.inv.uid, item: g.item, req: d.req, lv: this.level, mon: u.id, fate: 'ground', bagFull: false, floor: this.floorIndex }); }
    }
    return r;
  } as any;
}
export function dlVirt(id: string, lv: number) { (cur.virt[id] ??= [0, 0, 0])[bandOf(lv)]++; }
export function dlTick(w: World) {
  if (w.level >= 40) { cur.ticks40++; if (w.bag.length >= WORLD.bagSize) cur.fullTicks40++; }
  for (const d of cur.drops) {
    if (d.fate === 'sold' || d.fate === 'lost') continue;
    const inBag = w.bag.some(x => x.uid === d.uid), worn = Object.values(w.equip).some((x: any) => x?.uid === d.uid);
    if (worn && d.equipped === undefined) d.equipped = w.level;
    if (d.fate === 'ground') {
      if (w.ground.some(g => g.gid === d.gid)) { if (w.bag.length >= WORLD.bagSize) d.bagFull = true; }
      else d.fate = inBag || worn ? 'picked' : 'lost';
    } else if (d.fate === 'picked' && !inBag && !worn) { d.fate = 'sold'; d.soldLv = w.level; }
  }
}
export function dlEnd(w: World, cls: string, seed: number) {
  if (!DL) return;
  fs.appendFileSync(DL, JSON.stringify({ cls, seed, level: w.level, ...cur }) + '\n');
  cur = fresh();
}
