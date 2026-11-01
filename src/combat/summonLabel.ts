/**
 * 召唤物名字/颜色（道士骷髅·神兽·赶尸·金甲骷髅 与 法师诱惑之光宠物 共用）。纯函数，无 Phaser 依赖。
 * 颜色规则沿用道士：0 级白（官方白名），1–7 级蓝色逐级加深；满级（7）及以上仍为蓝色。
 */
export const SUMMON_NAME_COLORS = ['#ffffff', '#a8d8ff', '#7cc0ff', '#4fa3ff', '#2f86f5', '#1f68e0', '#1a4cc4', '#1a33a6'];
/** 等级 → 名字颜色；<0 / 非数按 0，超过最高级按满级蓝 */
export function summonNameColor(lv: number): string {
  const L = Number.isFinite(lv) ? Math.max(0, Math.floor(lv)) : 0;
  return SUMMON_NAME_COLORS[Math.min(L, SUMMON_NAME_COLORS.length - 1)];
}
export const CLASS_LABEL: Record<string, string> = { warrior: '战士', mage: '法师', taoist: '道士' };
/** 主人显示名：存档槽角色名（去空白，非空）优先，否则职业名 */
export function summonOwnerLabel(slotName: string | null | undefined, cls: string): string {
  const n = typeof slotName === 'string' ? slotName.trim() : '';
  return n || CLASS_LABEL[cls] || cls;
}
/** 名字两段：「骷髅·3级」+「道士的宠物」；单行时以一个空格连接：「骷髅·3级 道士的宠物」 */
export function summonNameParts(base: string, lv: number, owner: string): [string, string] {
  return [`${base}·${lv}级`, `${owner}的宠物`];
}
export function summonDisplayName(base: string, lv: number, owner: string): string { return summonNameParts(base, lv, owner).join(' '); }

export type Measure = (text: string, size: number) => number;
export interface FitOpts { max: number; min: number; maxW: number }
/** 名字自适应：先单行缩字号（max→min）；仍放不下则两行（名字/归属）再缩字号；仍超宽则逐行尾部截断加「…」（归属行截人名，保留「的宠物」） */
export function fitSummonName(parts: [string, string], m: Measure, o: FitOpts): { lines: string[]; size: number } {
  const one = parts.join(' ');
  for (let s = o.max; s >= o.min; s--) if (m(one, s) <= o.maxW) return { lines: [one], size: s };
  for (let s = o.max; s >= o.min; s--) if (parts.every(p => m(p, s) <= o.maxW)) return { lines: [...parts], size: s };
  const s = o.min, cut = (t: string, keepTail = '') => {
    if (m(t, s) <= o.maxW) return t;
    let head = t.slice(0, t.length - keepTail.length);
    while (head.length > 1 && m(head + '…' + keepTail, s) > o.maxW) head = head.slice(0, -1);
    return head + '…' + keepTail;
  };
  return { lines: [cut(parts[0]), cut(parts[1], '的宠物')], size: s };
}
