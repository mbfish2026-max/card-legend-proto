import { defineConfig } from 'vite';
// GitHub Pages 子路径：仅 build 时用 /card-legend-proto/；dev 仍为根路径。资源均为相对路径（assets/...），随 BASE_URL 解析
export default defineConfig(({ command }) => ({ base: command === 'build' ? '/card-legend-proto/' : '/', server: { port: 5180, host: true }, build: { outDir: 'dist' } }));
