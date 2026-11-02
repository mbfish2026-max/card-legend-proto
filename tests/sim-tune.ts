// feat/sim-gear-swap：sim 内存调参开关（默认全关；只在进程内改，不改仓库数据）——用于估计 40–50 杠杆效果
//  SIM_TUNE_ATK="战,法,道"  主线目标等级 ≥ SIM_TUNE_MINLV(默认 40) 的层：怪物（含 BOSS）攻击 × 系数（按英雄职业）
//  SIM_TUNE_HP ="战,法,道"  同上，血量 × 系数
//  SIM_TUNE_EXP="战,法,道"  英雄等级 ≥40 时获得经验 ÷ 系数（等价 40–49 级升级所需 × 系数）
//  SIM_TUNE_DROP=k          需求 40–49 的武器/衣服在 ENEMIES.drops 里的 chance × k（上限 1）
declare const process: { env: Record<string, string | undefined> };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { FLOOR_TARGET_LV } from '../src/data/balance';
import { ENEMIES } from '../src/data/units';
import { ITEMS } from '../src/data/items';
const E = process.env, IDX: Record<string, number> = { warrior: 0, mage: 1, taoist: 2 };
const tri = (s?: string) => (s ? s.split(',').map(Number) : null);
const A = tri(E.SIM_TUNE_ATK), H = tri(E.SIM_TUNE_HP), X = tri(E.SIM_TUNE_EXP), MINLV = Number(E.SIM_TUNE_MINLV ?? 40);
export const TUNE_ON = !!(A || H || X || E.SIM_TUNE_DROP);
if (A || H) {
  const orig = World.prototype.spawnFoe;
  World.prototype.spawnFoe = function (this: World, id: string, x: number, y: number) {
    const u = orig.call(this, id, x, y);
    if (this.floors === FLOORS && (FLOOR_TARGET_LV[this.floorIndex] ?? 0) >= MINLV) { const i = IDX[this.cls];
      if (A) u.atk = Math.round(u.atk * A[i]);
      if (H) { u.maxHp = Math.round(u.maxHp * H[i]); u.hp = u.maxHp; } }
    return u;
  } as any;
}
if (X) { const orig = World.prototype.gainExp; World.prototype.gainExp = function (this: World, n: number) { return orig.call(this, this.level >= 40 ? n / X[IDX[this.cls]] : n); } as any; }
if (E.SIM_TUNE_DROP) { const k = +E.SIM_TUNE_DROP;
  for (const u of Object.values(ENEMIES) as any[]) for (const d of u.drops ?? []) { const it: any = ITEMS[d.item]; if (it?.slot && ['weapon', 'armor'].includes(it.slot) && it.req >= 40 && it.req <= 49) d.chance = Math.min(1, d.chance * k); } }
