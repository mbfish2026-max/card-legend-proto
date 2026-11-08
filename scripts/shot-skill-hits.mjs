/**
 * 独立测量技能页点击区（不是测试，不断言）。
 * 用与 Phaser 命中相同的局部坐标（hit 空间 = 逆变换 + displayOrigin）
 * 把每个可点对象换成 CSS 矩形，并在中心 / 四边外侧用引擎 hitTest 复核。
 *
 * node scripts/shot-skill-hits.mjs <outDir>
 */
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || '/tmp/skill-hits';
const CHROME = '/usr/bin/google-chrome';
const BASE = 'http://127.0.0.1:5180/';
const VIEWS = [
  { id: 'm844', cssW: 844, cssH: 390, dpr: 3, mobile: true },
  { id: 'm932', cssW: 932, cssH: 430, dpr: 3, mobile: true },
  { id: 'd1280', cssW: 1280, cssH: 720, dpr: 1, mobile: false },
];

async function shot(view) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.clear(); } catch { /* ignore */ }
  });
  await page.setViewport({ width: view.cssW, height: view.cssH, deviceScaleFactor: view.dpr, isMobile: view.mobile, hasTouch: view.mobile });
  const q = view.mobile
    ? 'mobile=1&class=mage&floor=1&lv=15&panel=skills'
    : 'mobile=0&class=mage&floor=1&lv=15&panel=skills';
  await page.goto(BASE + '?' + q, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const ui = window.__game?.scene?.getScene?.('UI');
    return !!ui?.panel?.root;
  }, { timeout: 30000 });
  await page.evaluate(() => {
    const g = window.__game;
    const b = g.scene.getScene('Battle');
    const ui = g.scene.getScene('UI');
    const w = b.world;
    w.learned.add('fireball');
    w.learned.add('charm');
    w.skillTrain.fireball = 3000;
    w.skillTrain.charm = 4000;
    w.skillOrder = ['fireball', 'charm'];
    ui.panel.mode = 'skills';
    ui.panel.skPage = 0;
    ui.panel.render();
  });
  await page.waitForFunction(() => {
    const ui = window.__game.scene.getScene('UI');
    let n = 0;
    const walk = (o) => { if (!o) return; if (o.type === 'Text' && String(o.text).includes('修炼')) n++; if (o.list) o.list.forEach(walk); };
    walk(ui.children);
    return n >= 1;
  }, { timeout: 10000 });
  await page.evaluate(() => new Promise((resolve) => {
    const g = window.__game;
    requestAnimationFrame(() => requestAnimationFrame(() => { try { g.loop.sleep(); } catch { /* ignore */ } resolve(); }));
  }));

  const data = await page.evaluate(() => {
    const g = window.__game;
    const ui = g.scene.getScene('UI');
    const cam = ui.cameras.main;
    const canvas = document.querySelector('#game canvas');
    const crect = canvas.getBoundingClientRect();
    const sx = crect.width / canvas.width;
    const sy = crect.height / canvas.height;
    const texts = [];
    const gos = [];
    const walk = (o) => {
      if (!o) return;
      if (o.type === 'Text') texts.push(o);
      const interactive = !!(o.input && o.input.hitArea);
      const sized = typeof o.width === 'number' && o.width > 0 && typeof o.x === 'number';
      if (interactive || (sized && (o.type === 'NineSlice' || o.type === 'Rectangle') && o.width <= 120 && o.height <= 90)) gos.push(o);
      if (o.list) o.list.forEach(walk);
    };
    walk(ui.children);

    const labelOf = (o) => {
      let best = '', bestD = 1e9;
      for (const t of texts) {
        const dx = t.x - o.x, dy = t.y - o.y;
        const d = dx * dx + dy * dy;
        if (d < bestD && d < 4) { bestD = d; best = String(t.text); }
      }
      const dataLabel = o.getData?.('mtab') || o.getData?.('hitLabel') || '';
      return (best || dataLabel || o.name || o.type || '').slice(0, 24);
    };

    // 与 InputManager.pointWithinHitArea / Camera.getWorldPoint 互逆：
    // screen = camera.matrix * world − scroll * zoom（相机原点在视口中心，不能写成 (world−scroll)*zoom）
    const toCss = (o, hx, hy) => {
      const m = o.getWorldTransformMatrix();
      const lx = hx - o.displayOriginX;
      const ly = hy - o.displayOriginY;
      const wx = m.tx + m.a * lx + m.c * ly;
      const wy = m.ty + m.b * lx + m.d * ly;
      const sp = { x: 0, y: 0 };
      cam.matrix.transformPoint(wx, wy, sp);
      const cx = sp.x - cam.scrollX * cam.zoomX;
      const cy = sp.y - cam.scrollY * cam.zoomY;
      return { x: crect.left + cx * sx, y: crect.top + cy * sy };
    };

    const mgr = g.input;
    const hitsAt = (cssX, cssY) => {
      const pageX = cssX + window.scrollX;
      const pageY = cssY + window.scrollY;
      const px = mgr.scaleManager.transformX(pageX);
      const py = mgr.scaleManager.transformY(pageY);
      const world = { x: 0, y: 0 };
      cam.getWorldPoint(px, py, world);
      const found = [];
      const test = (o) => {
        if (!o) return;
        if (o.list) o.list.forEach(test);
        if (!o.input?.hitArea || o.input.enabled === false || !(o.width <= 200)) return;
        const m = o.getWorldTransformMatrix();
        const inv = { x: 0, y: 0 };
        m.applyInverse(world.x, world.y, inv);
        const hx = inv.x + o.displayOriginX;
        const hy = inv.y + o.displayOriginY;
        if (o.input.hitAreaCallback(o.input.hitArea, hx, hy, o)) found.push(labelOf(o) + '@' + Math.round(o.y));
      };
      test(ui.children);
      return found;
    };

    const rects = gos.filter(o => {
      const ha = o.input?.hitArea;
      return ha && o.input.enabled !== false && o.width <= 200 && o.height <= 160
        && Number.isFinite(o.x) && Number.isFinite(ha.x) && Number.isFinite(ha.width) && Number.isFinite(ha.height);
    }).map(o => {
      const ha = o.input.hitArea;
      const tl = toCss(o, ha.x, ha.y);
      const br = toCss(o, ha.x + ha.width, ha.y + ha.height);
      const left = Math.min(tl.x, br.x), top = Math.min(tl.y, br.y);
      const right = Math.max(tl.x, br.x), bottom = Math.max(tl.y, br.y);
      const rec = {
        label: labelOf(o),
        x: +o.x.toFixed(2), y: +o.y.toFixed(2),
        visW: +o.width.toFixed(2), visH: +o.height.toFixed(2),
        hitX: +ha.x.toFixed(2), hitY: +ha.y.toFixed(2),
        hitW: +ha.width.toFixed(2), hitH: +ha.height.toFixed(2),
        left: +left.toFixed(2), top: +top.toFixed(2),
        width: +(right - left).toFixed(2), height: +(bottom - top).toFixed(2),
        right: +right.toFixed(2), bottom: +bottom.toFixed(2),
      };
      const cx = (left + right) / 2, cy = (top + bottom) / 2;
      rec.centerHits = hitsAt(cx, cy);
      rec.outside = {
        left: hitsAt(left - 1, cy),
        right: hitsAt(right + 1, cy),
        top: hitsAt(cx, top - 1),
        bottom: hitsAt(cx, bottom + 1),
      };
      rec.inside = {
        left: hitsAt(left + 0.5, cy),
        right: hitsAt(right - 0.5, cy),
      };
      rec.gap = {
        left: hitsAt(left - 0.2, cy),
        right: hitsAt(right + 0.2, cy),
        top: hitsAt(cx, top - 0.2),
        bottom: hitsAt(cx, bottom + 0.2),
      };
      return rec;
    });

    const overlaps = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 0.05 && oy > 0.05) overlaps.push({ a: a.label, b: b.label, ax: a.x, ay: a.y, bx: b.x, by: b.y, ox: +ox.toFixed(2), oy: +oy.toFixed(2) });
      }
    }
    return {
      cssW: window.innerWidth, cssH: window.innerHeight, dpr: window.devicePixelRatio,
      canvasW: canvas.width, canvasH: canvas.height,
      canvasCssW: +crect.width.toFixed(2), canvasCssH: +crect.height.toFixed(2),
      lw: window.__render?.lw, k: window.__render?.k, mscale: ui.panel.mscale,
      n: rects.length,
      rects,
      overlaps,
    };
  });
  const png = await page.screenshot({ type: 'png' });
  await browser.close();
  data.screenshot = png;
  return data;
}

mkdirSync(OUT, { recursive: true });
const all = {};
for (const v of VIEWS) {
  process.stdout.write('measure ' + v.id + '\n');
  const d = await shot(v);
  const png = d.screenshot;
  delete d.screenshot;
  const dir = join(OUT, v.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'full.png'), png);
  all[v.id] = d;
  const panel = d.rects.filter(r => r.y < 500);
  const slim = panel.map(r => ({
    label: r.label, xy: [r.x, r.y], vis: [r.visW, r.visH],
    hit: [r.hitX, r.hitY, r.hitW, r.hitH],
    css: [r.left, r.top, r.width, r.height],
    center: r.centerHits,
    outL: r.outside.left, outR: r.outside.right, outT: r.outside.top, outB: r.outside.bottom,
    gapL: r.gap.left, gapR: r.gap.right, gapT: r.gap.top, gapB: r.gap.bottom,
  }));
  process.stdout.write(JSON.stringify({ id: v.id, css: [d.cssW, d.cssH], dpr: d.dpr, canvas: [d.canvasW, d.canvasH], mscale: d.mscale, overlaps: d.overlaps, rects: slim }, null, 2) + '\n');
}
writeFileSync(join(OUT, 'hits.json'), JSON.stringify(all, null, 2));
