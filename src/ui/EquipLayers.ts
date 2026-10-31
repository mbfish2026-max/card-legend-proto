import Phaser from 'phaser';
import type { EquipSlot, InvItem, Slot } from '../combat/types';
import { resolveLayers, pickTexture, comboKey, ResolvedLayer, CANVAS, COMPOSE_SCALE } from '../data/equipLayers';
import { assetUrl } from '../loader';

/** 运行时：按需懒加载层图（不进首屏 preload），失败记入 failed 后永久回退原立绘；合成结果按组合 key 缓存 */
const failed = new Set<string>();
const waiting = new Map<string, (() => void)[]>();
export const equipFailed = (k: string) => failed.has(k);

/** 确保层图已加载；全部结束（成功或失败）后回调 */
export function ensureLayers(s: Phaser.Scene, ls: ResolvedLayer[], done: () => void) {
  const need = ls.filter(l => !s.textures.exists(l.key) && !failed.has(l.key));
  if (!need.length) { done(); return; }
  let left = need.length;
  const one = () => { if (--left === 0) done(); };
  for (const l of need) {
    const q = waiting.get(l.key);
    if (q) { q.push(one); continue; }
    waiting.set(l.key, [one]);
    const fin = () => { const cbs = waiting.get(l.key) ?? []; waiting.delete(l.key); cbs.forEach(f => f()); };
    s.load.once('filecomplete-image-' + l.key, fin);
    const onErr = (f: Phaser.Loader.File) => { if (f.key !== l.key) return; s.load.off('loaderror', onErr); failed.add(l.key); fin(); };
    s.load.on('loaderror', onErr);
    s.load.once('filecomplete-image-' + l.key, () => s.load.off('loaderror', onErr));
    s.load.image(l.key, assetUrl(l.url));
  }
  if (!s.load.isLoading()) s.load.start();
}

/** Canvas 合成并缓存：同组合只合成一次 */
function compose(s: Phaser.Scene, key: string, ls: ResolvedLayer[]) {
  if (s.textures.exists(key)) return;
  const n = Math.round(CANVAS * COMPOSE_SCALE);
  const ct = s.textures.createCanvas(key, n, n); if (!ct) return;
  const ctx = ct.getContext();
  for (const l of ls) {
    const src = s.textures.get(l.key).getSourceImage() as CanvasImageSource & { width: number; height: number };
    const k = COMPOSE_SCALE * l.scale;
    ctx.drawImage(src, l.dx * COMPOSE_SCALE, l.dy * COMPOSE_SCALE, src.width * k, src.height * k);
  }
  ct.refresh();
}

export interface Look { key: string; state: 'base' | 'fallback' | 'pending' | 'composed'; sig: string }
/**
 * 求当前应显示的纹理 key。pending 时先返回原立绘，并在加载完成后调用 onReady（调用方重绘）。
 */
export function equipLook(s: Phaser.Scene, cls: string, baseKey: string, equip: Partial<Record<EquipSlot, InvItem>> | undefined, onReady?: () => void): Look {
  const ls = resolveLayers(cls, equip), sig = comboKey(cls, ls);
  const r = pickTexture(cls, baseKey, ls, k => s.textures.exists(k), equipFailed);
  if (r.state === 'composed') compose(s, r.key, ls);
  else if (r.state === 'pending') ensureLayers(s, ls, () => onReady?.());
  return { ...r, sig };
}
