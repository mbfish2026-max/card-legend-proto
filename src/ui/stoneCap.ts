/**
 * 血石容量显示（feat/stone-capacity-ui）：纯函数，供 Panel 装备栏/背包/提示与单测使用。
 * 只读 InvItem.charge 与 BLOODSTONES 总量，不改 tickStone。
 * 小血石只回红（World.STONE_S.mp=0），所以只显示红；中/大/特显示红+蓝。
 */
import type { InvItem } from '../combat/types';
import { BLOODSTONES, BloodstoneId } from '../shop/catalog';

export interface StonePool { kind: 'hp' | 'mp'; left: number; total: number }
export interface StoneCap { pools: StonePool[]; empty: boolean }

/** 简洁数字：<1000 原样；<10k 一位小数 k；<100k 一位小数 k；<1M 整数 k；否则 M。剩余量向下取整，避免未满显示成满 */
export function fmtCap(n: number): string {
  n = Math.max(0, Math.floor(n));
  if (n < 1000) return String(n);
  const tr = (v: number) => (Math.floor(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  if (n < 100_000) return tr(n / 1000) + 'k';
  if (n < 1_000_000) return Math.floor(n / 1000) + 'k';
  return tr(n / 1e6) + 'M';
}

/** 不是血石返回 null。旧档缺 charge：tickStone 不会补给，如实显示 0（耗尽） */
export function stoneCap(it: InvItem | undefined | null): StoneCap | null {
  const b = it && BLOODSTONES[it.item as BloodstoneId];
  if (!it || !b) return null;
  const c = it.charge, cl = (v: unknown, t: number) => Math.min(t, Math.max(0, Math.floor(Number(v) || 0)));
  const pools: StonePool[] = [{ kind: 'hp', left: cl(c?.hp, b.hp), total: b.hp }];
  if (it.item !== 'stone_s') pools.push({ kind: 'mp', left: cl(c?.mp, b.mp), total: b.mp });
  return { pools, empty: pools.every(p => p.left <= 0) };
}

export function isStoneEmpty(it: InvItem | undefined | null): boolean { return !!stoneCap(it)?.empty; }

export const fmtPool = (p: StonePool) => `${fmtCap(p.left)}/${fmtCap(p.total)}`;

/** 变化检测签名：装备栏 + 背包血石剩余量；Panel.statSnap 拼进快照，数值不变则不重绘 */
export function stoneSig(equipStone: InvItem | undefined, bag: (InvItem | undefined)[]): string {
  const one = (it?: InvItem) => { const c = stoneCap(it); return c ? c.pools.map(p => p.left).join(',') : ''; };
  return [one(equipStone), ...bag.filter(i => i && stoneCap(i)).map(i => i!.uid + '=' + one(i))].join(';');
}

/** 提示框文字行 [文本, 颜色] */
export function stoneTipLines(it: InvItem): [string, string][] {
  const c = stoneCap(it); if (!c) return [];
  const out: [string, string][] = c.pools.map(p => [`${p.kind === 'hp' ? '红' : '蓝'}储量 ${p.left}/${p.total}`, p.left <= 0 ? '#ff4040' : p.kind === 'hp' ? '#ff8080' : '#80b0ff']);
  if (it.item === 'stone_s') out.push(['小血石只补红', '#aaa']);
  if (c.empty) out.push(['储量耗尽（不再补给）', '#ff4040']);
  return out;
}
