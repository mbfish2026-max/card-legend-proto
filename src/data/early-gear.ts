/**
 * feat/early-gear-3-5（docs/early-gear-3-5.md §7，G-10/G-11/G-12）：出生自带木剑。
 * 三职业相同；装在武器栏；绑定不可出售（bound + 售价 0）；需求/属性沿用 ITEMS.wood_sword（req 1，攻6 魔3 道3）。
 * 旧存档：武器栏为空且无 starterGiven 标记 → 补发一次并写标记；有标记不再补（卸下/存仓后也不重复补）。
 * G-13 暂不送布衣；G-14 本次不回调数值（回调条件见文档）。
 */
import type { InvItem } from '../combat/types';
export const STARTER_WEAPON = 'wood_sword';
export function makeStarterWeapon(make: (item: string) => InvItem): InvItem {
  const it = make(STARTER_WEAPON); it.bound = true; it.price = 0; return it;
}
