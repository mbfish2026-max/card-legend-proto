/**
 * 灵符商城：购买（扣灵符 + 发货）与商城物品使用入口。
 * 只依赖 World 的公开接口（bag/makeItem/enterTown/summons/applySummonLv/events），不改战斗与技能逻辑；
 * 需要战斗开发正式接入的点见 docs/lingfu-shop.md「实现说明 · 待战斗开发接入」。
 */
import type { World } from '../combat/World';
import type { InvItem } from '../combat/types';
import { WORLD } from '../data/world';
import { TOWNS, returnTownOf } from '../data/towns';
import { PRODUCT_BY_SKU, BLOODSTONES, BloodstoneId, RETURN_STONE_USES, RETURN_STONE_CD_MS, SUMMON_SCROLL_LV } from './catalog';
import { WalletBackend, newIdem } from './wallet';

export type BuyResult = { ok: true; msg: string; balance: number } | { ok: false; reason: 'sku' | 'balance' | 'bag' | 'level' | 'wallet'; msg: string; balance: number };

/** 生成一件商城物品（带次数/储量/绑定） */
export function makeShopItem(w: World, item: string): InvItem {
  const it = w.makeItem(item, 'common'); it.price = 0; it.bound = true;
  if (item === 'return_stone') it.uses = RETURN_STONE_USES;
  const b = BLOODSTONES[item as BloodstoneId]; if (b) { it.charge = { hp: b.hp, mp: b.mp }; it.req = b.req; }
  return it;
}

/** 购买：先查背包空位 → 扣灵符 → 发货；发货失败退款。成功后由调用方存档（SaveStore）。 */
export function buy(w: World, wal: WalletBackend & { refund?(k: string, n: number): void }, sku: string, qty = 1, idem = newIdem()): BuyResult {
  const p = PRODUCT_BY_SKU[sku], bal = wal.balance();
  if (!p) return { ok: false, reason: 'sku', msg: '商品不存在', balance: bal };
  if (w.bag.length + qty > WORLD.bagSize) return { ok: false, reason: 'bag', msg: '背包已满，未扣灵符', balance: bal };
  if (bal < p.price * qty) return { ok: false, reason: 'balance', msg: `灵符不足：需要 ${p.price * qty}，当前 ${bal}`, balance: bal };
  const r = wal.spend(sku, p.price, qty, idem);
  if (r instanceof Promise) return { ok: false, reason: 'wallet', msg: '在线钱包尚未接入', balance: bal };
  if (!r.ok) return { ok: false, reason: r.error === 'balance' ? 'balance' : 'wallet', msg: r.error === 'balance' ? `灵符不足：当前 ${r.balance}` : '扣费失败，未发货', balance: r.balance };
  if (r.dup) return { ok: true, msg: '订单已处理', balance: r.balance };
  try {
    for (let i = 0; i < qty; i++) w.bag.push(makeShopItem(w, p.item));
  } catch { wal.refund?.(idem, p.price * qty); return { ok: false, reason: 'wallet', msg: '发货失败，已退回灵符', balance: wal.balance() }; }
  w.events.push({ type: 'inventory' });
  w.events.push({ type: 'log', text: `灵符商城：购买 ${p.name}${qty > 1 ? ' ×' + qty : ''}，花费 ${p.price * qty} 灵符`, color: 'gold' } as any);
  return { ok: true, msg: `购买成功：${p.name}`, balance: r.balance };
}

/** 背包里可点击使用的商城物品 */
export const isShopUsable = (item: string) => item === 'return_stone' || item === 'summon_lv7_scroll';

/** 回城石：无读条回到所在区域主城（returnTownOf），10 次，30 秒冷却。now 为 Date.now() 毫秒 */
export function useReturnStone(w: World, bagIdx: number, now = Date.now()): { ok: boolean; msg: string } {
  const it = w.bag[bagIdx]; if (!it || it.item !== 'return_stone') return { ok: false, msg: '无此物品' };
  if ((it.uses ?? RETURN_STONE_USES) <= 0) return { ok: false, msg: '回城石次数已用完' };
  if ((it.cdAt ?? 0) > now) return { ok: false, msg: `回城石冷却中：${Math.ceil((it.cdAt! - now) / 1000)} 秒` };
  const h = w.hero; if (!h || !h.alive) return { ok: false, msg: '无法使用' };
  const t = w.town ? null : returnTownOf(w.floorIndex);
  if (!t) return { ok: false, msg: '已在城内' };
  const e = w.enterTown(t, true); if (e) return { ok: false, msg: e };
  it.uses = (it.uses ?? RETURN_STONE_USES) - 1; it.cdAt = now + RETURN_STONE_CD_MS;
  if (it.uses <= 0) w.bag.splice(w.bag.indexOf(it), 1);
  w.events.push({ type: 'inventory' });
  return { ok: true, msg: `使用回城石：回到 ${TOWNS[t].name}（剩 ${Math.max(0, it.uses)} 次）` };
}

/** 召唤直升卷轴：场上召唤物升到 7 级（调用 World 现有 applySummonLv；正式接口 World.boostSummon 待战斗开发） */
export function useSummonScroll(w: World, bagIdx: number): { ok: boolean; msg: string } {
  const it = w.bag[bagIdx]; if (!it || it.item !== 'summon_lv7_scroll') return { ok: false, msg: '无此物品' };
  const boost = (w as any).boostSummon as ((lv: number) => number) | undefined;
  const list = w.summons.filter(u => u.sBase && (u.sLv ?? 0) < SUMMON_SCROLL_LV);
  if (!w.summons.length) return { ok: false, msg: '没有在场的召唤物（未消耗）' };
  if (!list.length) return { ok: false, msg: '召唤物已是满级（未消耗）' };
  if (boost) boost.call(w, SUMMON_SCROLL_LV);
  else for (const u of list) { u.sLv = SUMMON_SCROLL_LV; w.applySummonLv(u); }
  w.bag.splice(bagIdx, 1); w.events.push({ type: 'inventory' });
  return { ok: true, msg: `使用召唤直升卷轴：${list.map(u => u.sBase!.name).join('、')}升到 ${SUMMON_SCROLL_LV} 级` };
}

export function useShopItem(w: World, bagIdx: number, now = Date.now()) {
  const it = w.bag[bagIdx];
  return it?.item === 'return_stone' ? useReturnStone(w, bagIdx, now) : useSummonScroll(w, bagIdx);
}
