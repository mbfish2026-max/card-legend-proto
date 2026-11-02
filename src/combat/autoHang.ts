// feat/auto-hang P1/MVP：自动挂机控制层。只根据 World 状态逐帧产出移动输入（dx）与停止原因，
// 不改战斗数值；攻击/技能/拾取全部复用 World.step（autoAttack）与 autoCast。设计见 docs/auto-hang.md。
import type { World } from './World';
import { WORLD } from '../data/world';

export type HangStop = 'lowhp' | 'dead' | 'bagfull' | 'cleared' | 'boss' | 'stuck' | 'manual' | 'town' | 'toggle';
/** 停止原因 → 中文提示（醒目横幅 + 日志） */
export const HANG_STOP_TEXT: Record<HangStop, string> = {
  lowhp: '血量过低且没有药水，挂机已停止',
  dead: '角色阵亡，挂机已停止（复活后不会自动恢复）',
  bagfull: '背包已满，挂机已停止',
  cleared: '本层已清空，挂机已停止',
  boss: '遭遇首领，挂机已停止（挂机不打首领）',
  stuck: '挂机卡住（连续 3 次无法前进），已停止',
  manual: '手动操作，挂机已关闭',
  town: '城内不能挂机',
  toggle: '挂机已关闭',
};
export const HANG = {
  pickupDetour: 400,   // 拾取绕行半径（px）
  giveUpSec: 8,        // 追击 8 秒内对目标无伤害 → 放弃
  stuckSec: 2, stuckPx: 8, stuckMax: 3, // 2 秒内 |Δx|<8px 视为卡住；连续 3 次 → 停
  lowHpStop: 0.2,      // 无药时 HP < 20% → 停
  rangedStand: 300,    // 法师/道士：目标间距 ≤300px 且有蓝时站定放技能
  standSec: 1.5,       // fix/hang-stuck：站桩后 1.5 秒内英雄没有出手（普攻/耗蓝施法）→ 本目标改为贴脸普攻
  idleSec: 4,          // fix/hang-stuck：有目标却原地不动且英雄不出手累计 4 秒 → 放弃目标并掉头（兜底，绝不原地空转）
};
export interface HangThresholds { red: number; sun: number; blue: number }

export class AutoHang {
  on = false; dir: 1 | -1 = 1; target: number | null = null;
  private tgtT = 0; private tgtHp = 0; private stuckT = 0; private stuckX = 0; private stuckN = 0;
  private ignore = new Map<number, number>();
  /** fix/hang-stuck：英雄出手检测（h.cd 被重置 = 普攻；MP 下降 = 施法）与站桩空转计时 */
  private lastCd = 0; private lastMp = 0; private actT = 0; private standT = 0; private idleT = 0; private meleeOnly: number | null = null;
  private acted(w: World) { const h = w.hero!; const a = h.cd > this.lastCd + 1e-3 || (h.mp ?? 0) < this.lastMp - 1e-3; this.lastCd = h.cd; this.lastMp = h.mp ?? 0; if (a) this.actT = w.time; return a; }
  start(w: World): HangStop | null {
    if (w.town || !w.hero?.alive) return 'town';
    this.on = true; this.target = null; this.stuckN = 0; this.stuckT = 0; this.stuckX = w.hero.x; this.ignore.clear();
    this.lastCd = w.hero.cd; this.lastMp = w.hero.mp ?? 0; this.actT = w.time; this.standT = 0; this.idleT = 0; this.meleeOnly = null;
    const { L, R } = this.anchors(w); this.dir = w.hero.x < (L + R) / 2 ? 1 : -1; return null;
  }
  stop() { this.on = false; this.target = null; }
  /** 巡逻锚点：左避开回城/入口，右避开出口圈；首领层右锚停在首领仇恨圈外 */
  anchors(w: World) {
    const L = WORLD.heroStartX + 150 + 40; let R = w.exitX - WORLD.exitRadius - 40;
    for (const b of w.alive('enemy')) if (b.tier === 'boss') R = Math.min(R, b.homeX - WORLD.aggroRange - 60);
    return { L, R: Math.max(L + 40, R) };
  }
  /** 应使用的药水格（0 红 / 1 蓝 / 2 太阳水）；冷却与数量由 usePotion 自己拒绝 */
  potionSlots(w: World, t: HangThresholds): number[] {
    const h = w.hero; if (!h?.alive) return [];
    const out: number[] = []; const hr = h.hp / h.maxHp;
    if (hr < t.sun) out.push(2);
    if (hr < t.red) out.push(0);
    if (h.maxMp > 0 && (h.mp ?? 0) / h.maxMp < t.blue) out.push(1);
    return out;
  }
  private hasHpPotion(w: World) { return [0, 2].some(s => { const i = w.selectedPotionIndex(s); return i >= 0 && w.pots[i] > 0; }); }
  /** 每帧：返回本帧 dx，或停止原因 */
  tick(w: World, dt: number): { dx: number; stop?: HangStop } {
    const h = w.hero; if (!h) return { dx: 0 };
    if (!h.alive) return { dx: 0, stop: 'dead' };
    if (w.town) return { dx: 0, stop: 'town' };
    if (h.hp / h.maxHp < HANG.lowHpStop && !this.hasHpPotion(w)) return { dx: 0, stop: 'lowhp' };
    const foes = w.alive('enemy'), now = w.time; const acted = this.acted(w);
    if (foes.some(b => b.tier === 'boss' && (b.ai === 'chase' || b.ai === 'alert' || Math.abs(b.x - h.x) <= WORLD.aggroRange + 60))) return { dx: 0, stop: 'boss' };
    const { L, R } = this.anchors(w);
    const ground = w.ground.filter(g => g.landAt <= now && g.x >= L - 60 && g.x <= R + 60 && Math.abs(g.x - h.x) <= HANG.pickupDetour);
    if (w.bag.length >= WORLD.bagSize && ground.some(g => g.inv)) return { dx: 0, stop: 'bagfull' };
    const inRange = (x: number) => x >= L - WORLD.leashRange && x <= R + WORLD.leashRange;
    // 目标维护
    let t = this.target !== null ? foes.find(u => u.uid === this.target) : undefined;
    if (t && (!inRange(t.x) || Math.abs(t.x - h.x) > WORLD.leashRange)) t = undefined;
    if (t) { if (t.hp < this.tgtHp) { this.tgtHp = t.hp; this.tgtT = now; } else if (now - this.tgtT > HANG.giveUpSec) { this.ignore.set(t.uid, now + 10); t = undefined; } }
    if (!t) {
      const c = foes.filter(u => u.tier !== 'boss' && !u.pet && inRange(u.x) && Math.abs(u.x - h.x) <= WORLD.leashRange && (this.ignore.get(u.uid) ?? -Infinity) <= now)
        .sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      if (c) { t = c; this.tgtT = now; this.tgtHp = c.hp; this.standT = 0; this.idleT = 0; this.meleeOnly = null; }
    }
    this.target = t?.uid ?? null;
    // 层清空：区间内外都无非首领怪、无待刷新、无可捡物品
    const rest = foes.filter(u => u.tier !== 'boss' && !u.pet);
    if (!t && !rest.length && !w.farmQueue.length && !ground.length) return { dx: 0, stop: 'cleared' };
    let dx = 0, fighting = false;
    if (t) {
      fighting = true;
      // fix/hang-stuck：远程站桩只在「站下后英雄确实在出手」时成立。道士只会治愈术 / 符毒用完 / 技能全冷却时
      // 旧逻辑在 gap≤300 处站着既不放技能也打不到普攻（普攻只在贴脸 inMelee 时触发），直到 8 秒放弃 → 改为走到贴脸普攻
      const melee = w.inMelee(h, t);
      let ranged = this.meleeOnly !== t.uid && w.cls !== 'warrior' && (h.mp ?? 0) >= 10 && w.gap(h, t) <= HANG.rangedStand;
      if (ranged && !melee) { this.standT += dt; if (now - this.actT > HANG.standSec && this.standT > HANG.standSec) { this.meleeOnly = t.uid; ranged = false; } } else this.standT = 0;
      dx = melee || ranged ? 0 : Math.sign(t.x - h.x);
      if (dx) this.dir = dx as 1 | -1;
      // 兜底：有目标、不移动、英雄也不出手 → 累计 idleSec 放弃该目标并掉头巡逻
      if (!dx && !acted && now - this.actT > HANG.idleSec) { this.idleT += dt; } else this.idleT = 0;
      if (!dx && now - this.actT > HANG.idleSec && this.idleT > 0) { this.ignore.set(t.uid, now + 10); this.target = null; this.meleeOnly = null; this.actT = now; this.dir = -this.dir as 1 | -1; return { dx: this.dir }; }
    } else if (ground.length && !(w.bag.length >= WORLD.bagSize)) {
      const g = ground.sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      dx = Math.abs(g.x - h.x) < WORLD.pickupRadius * 0.5 ? 0 : Math.sign(g.x - h.x); fighting = !dx;
    } else {
      if (h.x >= R) this.dir = -1; else if (h.x <= L) this.dir = 1;
      dx = this.dir;
    }
    // 卡住检测（只在想移动时计）
    if (dx && !fighting) {
      this.stuckT += dt;
      if (this.stuckT >= HANG.stuckSec) {
        if (Math.abs(h.x - this.stuckX) < HANG.stuckPx) { this.stuckN++; this.dir = -this.dir as 1 | -1; if (this.stuckN >= HANG.stuckMax) return { dx: 0, stop: 'stuck' }; }
        else this.stuckN = 0;
        this.stuckT = 0; this.stuckX = h.x;
      }
    } else { this.stuckT = 0; this.stuckX = h.x; }
    return { dx };
  }
}
