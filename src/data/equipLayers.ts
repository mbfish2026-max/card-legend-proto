// 装备上身分层渲染：配置 + 纯函数（无 Phaser 依赖，可单测）。
// 规范以 docs/equip-layers.md 为准：1024×1024 透明 PNG，左上角 (0,0) 直接叠加，顺序 body→armor→weapon。
// 只做衣服(armor)、武器(weapon)，不做头盔。美术追加法师/道士后只需改 EQUIP_CLASSES / 映射表。
import type { InvItem, Slot } from '../combat/types';

export type LayerSlot = 'armor' | 'weapon';
/** 叠加顺序（下→上），body 永远在最底 */
export const LAYER_ORDER: LayerSlot[] = ['armor', 'weapon'];
export const EQUIP_ROOT = 'assets/equip/';
/** 合成画布（规范 1024，合成时按 COMPOSE_SCALE 缩小以省显存） */
export const CANVAS = 1024, COMPOSE_SCALE = 0.5;

export interface LayerCfg { dx?: number; dy?: number; scale?: number }
export interface ClassLayerCfg {
  /** 已交付素材的装备 id → 文件（相对 equip/<cls>/），不在表中走 fallback */
  armor: Record<string, string>; weapon: Record<string, string>;
  /** 特定装备 id 借用其它图（如战士拿魔杖暂用铁剑） */
  alias?: Record<string, string>;
  /** 每层偏移/缩放（规范为同画布零偏移，留作对齐用） */
  offset?: Record<string, LayerCfg>;
}
/** 已交付分层素材的职业（法师/道士未交付 → 不在表中 → 回退原立绘） */
export const EQUIP_CLASSES: Record<string, ClassLayerCfg> = {
  warrior: {
    armor: { cloth: 'armor/cloth.png', armor: 'armor/armor.png' },
    weapon: { wood_sword: 'weapon/wood_sword.png', iron_sword: 'weapon/iron_sword.png', dragon_sword: 'weapon/dragon_sword.png' },
    alias: { magic_staff: 'iron_sword', tao_sword: 'iron_sword' },
  },
};

/** 规范「兜底规则」：未知衣服/武器按需求等级挑档 */
export function fallbackId(slot: LayerSlot, req: number): string {
  if (slot === 'armor') return req < 12 ? 'cloth' : 'armor';
  return req < 4 ? 'wood_sword' : req < 15 ? 'iron_sword' : 'dragon_sword';
}

export interface ResolvedLayer { slot: 'body' | LayerSlot; id: string; key: string; url: string; dx: number; dy: number; scale: number }
const mk = (cls: string, slot: ResolvedLayer['slot'], id: string, file: string, o?: LayerCfg): ResolvedLayer =>
  ({ slot, id, key: `eq_${cls}_${slot}_${id}`, url: EQUIP_ROOT + cls + '/' + file, dx: o?.dx ?? 0, dy: o?.dy ?? 0, scale: o?.scale ?? 1 });

/** 某一槽位的层（无装备/非分层槽位 → null） */
export function resolveSlot(cls: string, slot: LayerSlot, it: InvItem | undefined): ResolvedLayer | null {
  const c = EQUIP_CLASSES[cls]; if (!c || !it) return null;
  const tab = c[slot]; let id = c.alias?.[it.item] ?? it.item;
  if (!tab[id]) id = fallbackId(slot, it.req ?? 1);
  if (!tab[id]) return null;
  return mk(cls, slot, id, tab[id], c.offset?.[id]);
}
/**
 * 装备栏 → 有序层列表。没穿衣服也没拿武器（含旧存档/空装备栏）或职业无素材 → []，表示用原立绘。
 * 存档结构不变：只读 equip.armor / equip.weapon。
 */
export function resolveLayers(cls: string, equip: Partial<Record<Slot, InvItem>> | undefined): ResolvedLayer[] {
  const c = EQUIP_CLASSES[cls]; if (!c || !equip) return [];
  const ls = LAYER_ORDER.map(s => resolveSlot(cls, s, equip[s])).filter((x): x is ResolvedLayer => !!x);
  if (!ls.length) return [];
  return [mk(cls, 'body', 'body', 'body.png', c.offset?.body), ...ls];
}
/** 组合签名 = 合成缓存 key（同组合复用） */
export const comboKey = (cls: string, ls: ResolvedLayer[]) => ls.length ? `eqc_${cls}_${ls.map(l => l.id).join('+')}` : '';

/**
 * 决定显示哪张纹理：层全部就绪 → 合成 key；任一层加载失败/文件缺失 → 原立绘；尚在加载 → 原立绘（等就绪再切）。
 */
export function pickTexture(cls: string, baseKey: string, ls: ResolvedLayer[], ready: (k: string) => boolean, failed: (k: string) => boolean):
  { key: string; state: 'base' | 'fallback' | 'pending' | 'composed' } {
  if (!ls.length) return { key: baseKey, state: 'base' };
  if (ls.some(l => failed(l.key))) return { key: baseKey, state: 'fallback' };
  if (ls.some(l => !ready(l.key))) return { key: baseKey, state: 'pending' };
  return { key: comboKey(cls, ls), state: 'composed' };
}
/** 穿脱后哪些层变了（用于只刷新受影响的层 / 决定是否重合成） */
export function changedSlots(a: ResolvedLayer[], b: ResolvedLayer[]): string[] {
  const m = (ls: ResolvedLayer[]) => new Map(ls.map(l => [l.slot, l.key]));
  const ma = m(a), mb = m(b); const out: string[] = [];
  for (const s of ['body', ...LAYER_ORDER]) if (ma.get(s as any) !== mb.get(s as any)) out.push(s);
  return out;
}
