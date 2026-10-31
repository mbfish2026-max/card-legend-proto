// R10 缓存策略（GitHub Pages 无法设置 Cache-Control，用 Service Worker 补）：
// - 带哈希的 JS/CSS（assets/*-xxxxxxxx.js）：cache-first，永不过期
// - 图片/音频：stale-while-revalidate（先用缓存秒开，后台更新，美术替换后下次生效）
// - 页面/manifest：network-first，离线回落缓存
const CACHE = 'fcl-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const hashed = /\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css)$/.test(u.pathname);
  const media = /\.(webp|png|jpe?g|ogg|mp3)$/i.test(u.pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r);
    if (hashed && hit) return hit;
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; });
    if (media && hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; } catch (err) { if (hit) return hit; throw err; }
  }));
});
