// 纯函数（不依赖 Phaser，可单测）
/** 构建版资源改用 .webp（与 vite.config.ts compressAssets 的 targets 一一对应）。B0：ui_atlas.png 与手机 DOM 2x 图也压（只许无损），json 帧表不变 */
export const WEBP_ASSETS = /^assets\/(portraits|bg|map)\/|^assets\/ui\/(bg_dungeon\.jpg|ui_atlas\.png|dom\/[\w-]+@2x\.png)$/;
export function mapAssetUrl(p: string, opt: boolean) { return opt && WEBP_ASSETS.test(p) ? p.replace(/\.(png|jpe?g)$/i, '.webp') : p; }
