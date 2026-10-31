import Phaser from 'phaser';
import { ASSETS, SFX } from './assets-manifest';
import { MUSIC } from './music';
import { CLASSES } from './data/classes';
import { ITEMS } from './data/items';
import { ENEMIES } from './data/units';
import { FLOORS, Floor } from './data/world';
import { ITEM_ICON_2X } from './data/item-icons-2x';
import { Render } from './render';
import { fxLoadOrder, fxUrl } from './ui/FxPlayer';

/** 生产构建：大图（立绘/背景/地图）在构建期压成 webp（vite.config 插件），原 PNG/JPG 仍保留在 public/ */
const OPT = typeof import.meta !== 'undefined' && !!(import.meta as any).env?.PROD;
/** 物品图标：画质 >720p（Render.k>1）且存在 @2x 文件时用 @2x（显示尺寸由 setDisplaySize 固定，不影响布局）；加载失败 → 纹理不存在 → 各处原有色块/无图回退 */
export function itemIconUrl(p: string) { const m = /^assets\/items\/(.+)\.png$/.exec(p); return Render.k > 1 && m && ITEM_ICON_2X.has(m[1]) ? `assets/items/${m[1]}@2x.png` : p; }
export function assetUrl(p: string) { return OPT && /^assets\/(portraits|bg|map)\//.test(p) || OPT && p === 'assets/ui/bg_dungeon.jpg' ? p.replace(/\.(png|jpe?g)$/i, '.webp') : p; }

const BIG = (k: string) => /^assets\/(portraits\/.*_full|bg|map\/map_world)/.test(ASSETS[k] ?? '') || k === 'bg';
/** 某层需要的大图：背景 + 该层怪物立绘 */
export function floorKeys(f: Floor | undefined): string[] {
  if (!f) return [];
  const ks = new Set<string>(); if (f.bg) ks.add(f.bg);
  for (const s of f.spawns) ks.add((ENEMIES as any)[s.id]?.art ?? s.id);
  return [...ks].filter(k => ASSETS[k]);
}
/** 首屏关键：全部小图标/音效 + 三职业立绘 + 召唤物 + 第 1 层 */
export function criticalImageKeys(): string[] {
  const small = Object.keys(ASSETS).filter(k => !BIG(k));
  return [...small, 'hero', 'mage', 'taoist', 'skeleton', 'wolf', 'bg_floor1', ...floorKeys(FLOORS[0])];
}
/** 已排队/加载中的贴图（跨 Title/Preload 两个加载器去重，避免 "Texture key already in use"，BUG-003） */
const pending = new Set<string>(); const hooked = new WeakSet<object>();
export const imagePending = (k: string) => pending.has(k);
function hook(load: Phaser.Loader.LoaderPlugin) {
  if (hooked.has(load)) return; hooked.add(load);
  load.on('filecomplete', (key: string) => pending.delete(key));
  load.on('loaderror', (f: { key: string }) => pending.delete(f.key));
}
export function queueImages(load: Phaser.Loader.LoaderPlugin, tex: Phaser.Textures.TextureManager, keys: string[]) {
  let n = 0; hook(load);
  for (const k of new Set(keys)) if (ASSETS[k] && !tex.exists(k) && !pending.has(k)) { pending.add(k); load.image(k, assetUrl(ASSETS[k])); n++; }
  return n;
}
/** 特效图集失败次数：首次 + 最多重试 2 次，之后放弃（走 Graphics 兜底），不再阻塞音乐队列（BUG-001） */
const FX_MAX_TRIES = 3; const fxTries = new Map<string, number>();
export function queueCritical(s: Phaser.Scene) {
  queueImages(s.load, s.textures, criticalImageKeys());
  for (const c of Object.values(CLASSES)) for (const sk of c.skills) if (!s.textures.exists('sk_' + sk.id)) s.load.image('sk_' + sk.id, sk.icon);
  for (const it of Object.values(ITEMS)) if (!s.textures.exists('item_' + it.id)) s.load.image('item_' + it.id, itemIconUrl(it.icon));
  for (const [id, p] of Object.entries(SFX)) if (p && !s.cache.audio.exists('sfx_' + id)) s.load.audio('sfx_' + id, p);
}
/** 剩余资源的后台加载顺序：按层顺序（近的层先），最后音乐 */
export function backgroundKeys(): string[] {
  const out: string[] = [];
  for (const f of FLOORS) out.push(...floorKeys(f));
  out.push(...Object.keys(ASSETS));
  return [...new Set(out)];
}
/** 常驻场景：后台预加载其余层资源，不阻塞游玩；Title/Battle 切换不会中断 */
export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'Preload', active: false }); }
  private first: string[] = [];
  /** 让某些资源插队（例如即将进入的层） */
  prioritize(keys: string[]) { this.first.push(...keys); if (!this.load.isLoading()) this.pump(); }
  create() { this.pump(); }
  private pump() {
    const order = [...this.first, ...backgroundKeys()]; this.first = [];
    // 每批 4 张，避免与当前层抢带宽
    const batch = order.filter(k => ASSETS[k] && !this.textures.exists(k) && !pending.has(k)).slice(0, 4);
    if (batch.length) { queueImages(this.load, this.textures, batch); this.load.once('complete', () => this.pump()); this.load.start(); return; }
    // R12 技能特效图集：图片之后、音乐之前；本职业已学技能优先（registry 由 BattleScene 写入）
    const fx = fxLoadOrder(this.registry.get('fxCls') ?? '', this.registry.get('fxLearned') ?? []).filter(k => !this.textures.exists(k) && (fxTries.get(k) ?? 0) < FX_MAX_TRIES).slice(0, 4);
    if (fx.length) { for (const k of fx) { fxTries.set(k, (fxTries.get(k) ?? 0) + 1); this.load.atlas(k, ...fxUrl(k)); } this.load.once('complete', () => this.pump()); this.load.start(); return; }
    let m = 0; for (const [id, p] of Object.entries(MUSIC)) if (!this.cache.audio.exists('bgm_' + id)) { this.load.audio('bgm_' + id, p); m++; }
    if (m) { this.load.once('complete', () => this.game.events.emit('music-ready')); this.load.start(); }
  }
}
