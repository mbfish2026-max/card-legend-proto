/** R54 技能数值显示统一取整：四舍五入（Math.round），只影响显示，不改内部计算 */
export const fmtInt = (n: number): string => String(Math.round(n) || 0);
/** 文本中的小数（如「倍率 3.0」「1.5s」「×1.25」）四舍五入为整数显示 */
export const fmtText = (s: string): string => s.replace(/(\d+)\.(\d+)/g, m => fmtInt(+m));
/** R54 书店条目：去掉「（技能书）」后缀，按名称宽度自适应字号（CJK 约 1em/字），保证名称不进入按钮区 */
export const BOOK_NAME_W = 128;
export function bookEntry(name: string, need: number, level: number, learned: boolean, price: number, cs = false) {
  const nm = name.replace('（技能书）', ''), fs = Math.max(10, Math.min(14, Math.floor(BOOK_NAME_W / Math.max(1, nm.length))));
  const gap = need - level, sub = `需Lv${need} ${learned ? '已学会' : gap > 0 ? `差${gap}级` : '可学'} ${price}金`; void cs;
  return { nm, fs, sub, buyable: !learned && gap <= 0, gap };
}
