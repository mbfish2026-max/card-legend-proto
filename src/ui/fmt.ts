/** R54 技能数值显示统一取整：四舍五入（Math.round），只影响显示，不改内部计算 */
export const fmtInt = (n: number): string => String(Math.round(n) || 0);
/** 文本中的小数（如「倍率 3.0」「1.5s」「×1.25」）四舍五入为整数显示 */
export const fmtText = (s: string): string => s.replace(/(\d+)\.(\d+)/g, m => fmtInt(+m));
