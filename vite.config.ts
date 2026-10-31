import { defineConfig, Plugin } from 'vite';
import { readdirSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * R10 构建期压缩：dist 里的立绘/背景/地图转 webp（public/ 原图保留不动）。
 * 立绘按实际显示 ~2x 缩尺寸（卡面立绘最高 ~260 逻辑像素 → 长边 ≤ 640）；背景保持 1280 宽。
 * 运行时由 src/loader.ts assetUrl() 把 .png/.jpg 改成 .webp。*_old.* 备份不进 dist。
 */
function compressAssets(): Plugin {
  return {
    name: 'compress-assets', apply: 'build',
    async closeBundle() {
      const sharp = (await import('sharp')).default;
      const root = 'dist/assets'; let before = 0, after = 0, n = 0;
      const walk = (d: string): string[] => existsSync(d) ? readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; }) : [];
      for (const f of walk(root)) if (/_old\.(png|jpe?g)$/i.test(f)) unlinkSync(f);
      const targets = [...walk(join(root, 'portraits')), ...walk(join(root, 'bg')), ...walk(join(root, 'map')), join(root, 'ui/bg_dungeon.jpg')]
        .filter(f => existsSync(f) && /\.(png|jpe?g)$/i.test(f));
      for (const f of targets) {
        const out = f.slice(0, -extname(f).length) + '.webp';
        before += statSync(f).size;
        const img = sharp(f); const meta = await img.metadata();
        const portrait = f.includes('/portraits/') && /_full\.png$/.test(f);
        let pipe = img;
        if (portrait) pipe = pipe.resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true });
        else if ((meta.width ?? 0) > 1280) pipe = pipe.resize({ width: 1280, withoutEnlargement: true });
        const small = (meta.width ?? 0) <= 128;
        await pipe.webp(small ? { lossless: true } : portrait ? { quality: 80, alphaQuality: 85, effort: 5 } : { quality: 72, effort: 5 }).toFile(out);
        after += statSync(out).size; unlinkSync(f); n++;
      }
      console.log(`[compress-assets] ${n} 张：${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);
    },
  };
}
// GitHub Pages 子路径：仅 build 时用 /card-legend-proto/；dev 仍为根路径。资源均为相对路径（assets/...），随 BASE_URL 解析
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/card-legend-proto/' : '/',
  server: { port: 5180, host: true },
  plugins: [compressAssets()],
  build: {
    outDir: 'dist', chunkSizeWarningLimit: 1500,
    // Phaser 单独 chunk：游戏代码改动不让用户重下 1.2MB 引擎（文件名带哈希，可长期缓存）
    rollupOptions: { output: { manualChunks: id => id.includes('node_modules/phaser') ? 'phaser' : undefined } },
  },
}));
