// 共用：本地预览服务 + puppeteer 辅助（仅测试用）
import puppeteer from 'puppeteer';
import http from 'node:http';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
export const BASE = '/card-legend-proto/';
const ROOT = new URL('../../dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
/** 静态服务 dist（base=/card-legend-proto/）；block(url) 返回 true 时回 404，用于模拟素材缺失 */
export async function startPreview(opts = {}) {
  const block = opts.block ?? (() => false), root = opts.root ?? ROOT;
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (!u.startsWith(BASE)) { res.writeHead(404); return res.end(); }
    let f = join(root, u.slice(BASE.length)); if (u.endsWith('/')) f = join(f, 'index.html');
    if (block(u) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${srv.address().port}${BASE}`, stop() { srv.close(); } };
}
export const launch = () => puppeteer.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
export function watch(page) {
  const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); if (m.type() === 'warning') warns.push(m.text()); });
  return { errs, warns };
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
/** 场景内所有文本 */
export const texts = (page, key) => page.evaluate(k => { const s = window.__game?.scene.getScene(k); const out = []; const walk = l => l.forEach(o => { if (o.type === 'Text' && o.visible) out.push(o.text); if (o.list) walk(o.list); }); s && s.sys.isActive() && walk(s.children.list); return out; }, key);
/** 文本匹配的对象 → 页面像素坐标 */
export const findPos = (page, key, src) => page.evaluate((k, src) => {
  const re = new RegExp(src), s = window.__game.scene.getScene(k); let hit = null;
  const walk = l => l.forEach(o => { if (!hit && o.type === 'Text' && o.visible && re.test(o.text)) hit = o; if (o.list) walk(o.list); });
  walk(s.children.list); if (!hit) return null;
  const m = hit.getWorldTransformMatrix(), b = hit.getBounds(); const cv = window.__game.canvas.getBoundingClientRect();
  const wx = b.centerX, wy = b.centerY; // 容器内文本 getBounds 已是世界坐标
  const wv = s.cameras.main.worldView; // 手机铺满后可视宽≠1280：按相机 worldView 换算（电脑 = 0..1280）
  return { x: cv.left + (wx - wv.x) * cv.width / wv.width, y: cv.top + (wy - wv.y) * cv.height / wv.height, m: !!m };
}, key, src);
export const toScreen = (page, x, y) => page.evaluate((x, y) => { const cv = window.__game.canvas.getBoundingClientRect(); const R = window.__render ?? { lw: 1280, ox: 0 }; return { x: cv.left + (x + R.ox) * cv.width / R.lw, y: cv.top + y * cv.height / 720 }; }, x, y);
