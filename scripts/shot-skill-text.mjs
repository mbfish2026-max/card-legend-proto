/**
 * 独立截图/测量（不是测试，不断言）。
 * 打开技能页，记录 DPR / CSS 视口 / canvas backing / 文本纹理 resolution，
 * 保存整屏与技能说明文字裁剪。
 *
 * node /tmp/text-measure/measure.mjs <outDir> <label>
 */
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || '/opt/cursor/artifacts/text-blur/before';
const LABEL = process.argv[3] || 'before';
const CHROME = '/usr/bin/google-chrome';
const BASE = 'http://127.0.0.1:5180/';

const VIEWS = [
  { id: 'm932', cssW: 932, cssH: 430, dpr: 3, mobile: true },
  { id: 'm844', cssW: 844, cssH: 390, dpr: 3, mobile: true },
  { id: 'd1280', cssW: 1280, cssH: 720, dpr: 1, mobile: false },
];

function softness(buf, width, height, channels) {
  let opaque = 0, mid = 0;
  for (let i = 0; i < buf.length; i += channels) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    const a = channels === 4 ? buf[i + 3] : 255;
    if (a < 8) continue;
    opaque++;
    const y = (r + g + b) / 3;
    if (a < 230 || (y > 28 && y < 215)) mid++;
  }
  return { opaque, midRatio: opaque ? +(mid / opaque).toFixed(4) : null };
}

async function cropSoft(png, left, top, width, height) {
  const meta = await sharp(png).metadata();
  const l = Math.max(0, Math.min(meta.width - 2, Math.round(left)));
  const t = Math.max(0, Math.min(meta.height - 2, Math.round(top)));
  const w = Math.max(2, Math.min(meta.width - l, Math.round(width)));
  const h = Math.max(2, Math.min(meta.height - t, Math.round(height)));
  const img = sharp(png).extract({ left: l, top: t, width: w, height: h });
  const raw = await img.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { png: await img.png().toBuffer(), box: { l, t, w, h }, soft: softness(raw.data, raw.info.width, raw.info.height, raw.info.channels), meta: { w: meta.width, h: meta.height } };
}

async function shot(view) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.clear(); } catch { /* ignore */ }
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
      }
      return orig.call(this, type, attrs);
    };
  });
  await page.setViewport({ width: view.cssW, height: view.cssH, deviceScaleFactor: view.dpr, isMobile: view.mobile, hasTouch: view.mobile });
  const q = view.mobile
    ? 'mobile=1&class=mage&floor=1&lv=15&panel=skills'
    : 'mobile=0&class=mage&floor=1&lv=15&panel=skills';
  await page.goto(BASE + '?' + q, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => {
    const g = window.__game;
    const ui = g?.scene?.getScene?.('UI');
    if (!ui?.panel?.root) return false;
    let hit = false;
    const walk = (o) => { if (!o) return; if (o.type === 'Text' && typeof o.text === 'string' && o.text.includes('火球术')) hit = true; if (o.list) o.list.forEach(walk); };
    walk(ui.children);
    return hit;
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
    const walk = (o) => { if (!o) return; if (o.type === 'Text' && typeof o.text === 'string' && o.text.includes('修炼')) n++; if (o.list) o.list.forEach(walk); };
    walk(ui.children);
    return n >= 1;
  }, { timeout: 10000 });
  // 让面板画完一帧再停循环，避免粒子继续变
  await page.evaluate(() => new Promise((resolve) => {
    const g = window.__game;
    requestAnimationFrame(() => requestAnimationFrame(() => { try { g.loop.sleep(); } catch { /* ignore */ } resolve(); }));
  }));

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas');
    const rect = canvas.getBoundingClientRect();
    const g = window.__game;
    const R = window.__render;
    const ui = g.scene.getScene('UI');
    const cam = ui.cameras.main;
    const dpr = window.devicePixelRatio;
    const texts = [];
    const hits = [];
    let texPx = 0, texN = 0;
    const walk = (o, ps) => {
      if (!o) return;
      const worldScale = (o.scaleX || 1) * ps;
      if (o.type === 'Text') {
        const m = o.getWorldTransformMatrix();
        const x0 = -o.displayOriginX, y0 = -o.displayOriginY;
        const x1 = x0 + o.width, y1 = y0 + o.height;
        const pt = (x, y) => {
          const wx = m.tx + m.a * x + m.c * y;
          const wy = m.ty + m.b * x + m.d * y;
          return { cx: (wx - cam.scrollX) * cam.zoom, cy: (wy - cam.scrollY) * cam.zoom };
        };
        const tl = pt(x0, y0), br = pt(x1, y1);
        texts.push({
          text: String(o.text).slice(0, 48),
          fontSize: o.style.fontSize,
          font: o.context?.font || o.style.fontFamily,
          stroke: o.style.strokeThickness,
          resolution: o.style.resolution,
          sourceResolution: o.frame?.source?.resolution,
          texW: o.canvas?.width, texH: o.canvas?.height,
          logicalW: +o.width.toFixed(2), logicalH: +o.height.toFixed(2),
          scaleX: o.scaleX, parentScale: ps,
          canvasX: +tl.cx.toFixed(2), canvasY: +tl.cy.toFixed(2),
          canvasW: +(br.cx - tl.cx).toFixed(2), canvasH: +(br.cy - tl.cy).toFixed(2),
          filter: o.frame?.source?.scaleMode,
        });
        texPx += (o.canvas?.width || 0) * (o.canvas?.height || 0);
        texN++;
      }
      if (o.input?.hitArea && o.getData && o.getData('rowHit')) {
        const m = o.getWorldTransformMatrix();
        const ha = o.input.hitArea;
        const pt = (x, y) => ({ cx: (m.tx + m.a * x + m.c * y - cam.scrollX) * cam.zoom, cy: (m.ty + m.b * x + m.d * y - cam.scrollY) * cam.zoom });
        const tl = pt(ha.x, ha.y), br = pt(ha.x + ha.width, ha.y + ha.height);
        hits.push({ name: o.getData('rowHit'), pitch: o.getData('rowPitch'), canvasH: +(br.cy - tl.cy).toFixed(2), canvasW: +(br.cx - tl.cx).toFixed(2) });
      }
      if (o.list) for (const c of o.list) walk(c, (o.scaleX || 1) * ps);
    };
    walk(ui.children, 1);
    const battle = g.scene.getScene('Battle');
    if (battle?.children) walk(battle.children, 1);
    const sample = texts.find(t => t.text.includes('修炼')) || texts.find(t => t.text.includes('火球术')) || texts[0];
    let texPng = null, backingPng = null, sampleCanvasBox = null;
    if (sample) {
      const owner = (() => {
        let found = null;
        const w2 = (o) => { if (!o || found) return; if (o.type === 'Text' && String(o.text).slice(0, 48) === sample.text && o.canvas?.width === sample.texW) found = o; if (o.list) o.list.forEach(w2); };
        w2(ui.children); return found;
      })();
      if (owner?.canvas) texPng = owner.canvas.toDataURL('image/png');
      sampleCanvasBox = { x: sample.canvasX, y: sample.canvasY, w: sample.canvasW, h: sample.canvasH };
    }
    let blank = true;
    try {
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (ctx) {
        const pix = new Uint8Array(4);
        ctx.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pix);
        blank = pix[0] + pix[1] + pix[2] + pix[3] === 0;
      }
      backingPng = canvas.toDataURL('image/png');
    } catch (e) { backingPng = 'err:' + e.message; }
    const c2 = document.createElement('canvas'); c2.width = 8; c2.height = 8;
    const cx = c2.getContext('2d');
    const faces = ['"PingFang SC"', '"Microsoft YaHei"', '"WenQuanYi Micro Hei"', '"Droid Sans Fallback"', 'sans-serif'];
    const widths = {};
    for (const f of faces) { cx.font = `16px ${f}`; widths[f] = +cx.measureText('火球术修炼').width.toFixed(2); }
    return {
      dpr, innerW: window.innerWidth, innerH: window.innerHeight,
      vv: window.visualViewport ? { w: window.visualViewport.width, h: window.visualViewport.height, scale: window.visualViewport.scale } : null,
      render: { k: R.k, lw: R.lw, ox: R.ox },
      renderer: g.renderer?.type, // 1 canvas, 2 webgl
      antialias: g.config?.antialias ?? g.renderer?.config?.antialias ?? null,
      cam: { zoom: cam.zoom, w: cam.width, h: cam.height, scrollX: +cam.scrollX.toFixed(2), scrollY: +cam.scrollY.toFixed(2) },
      mscale: ui.panel?.mscale,
      canvas: { w: canvas.width, h: canvas.height, cssW: +rect.width.toFixed(2), cssH: +rect.height.toFixed(2), left: +rect.left.toFixed(2), top: +rect.top.toFixed(2), styleW: canvas.style.width, styleH: canvas.style.height, transform: canvas.style.transform || '' },
      fontCheck: {
        pingfang: document.fonts.check('16px "PingFang SC"'),
        yahei: document.fonts.check('16px "Microsoft YaHei"'),
        widths,
      },
      backingBlankGuess: blank,
      texts: texts.filter(t => /火球|诱惑|修炼|地狱火|技能|已学会|升级|需Lv/.test(t.text)).slice(0, 16),
      hits: hits.slice(0, 8),
      texPx, texN,
      texPng, backingPng, sampleCanvasBox,
      textCount: texts.length,
    };
  });

  const full = await page.screenshot({ type: 'png' });
  await browser.close();

  const dir = join(OUT, view.id);
  mkdirSync(dir, { recursive: true });
  const fullPath = join(dir, `${LABEL}-full.png`);
  writeFileSync(fullPath, full);

  const sample = metrics.texts.find(t => t.text.includes('修炼')) || metrics.texts[0];
  const report = {
    id: view.id, label: LABEL,
    cssViewport: { w: view.cssW, h: view.cssH },
    requestedDpr: view.dpr,
    measured: {
      dpr: metrics.dpr, innerW: metrics.innerW, innerH: metrics.innerH, vv: metrics.vv,
      render: metrics.render, renderer: metrics.renderer, cam: metrics.cam, mscale: metrics.mscale,
      canvas: metrics.canvas,
      fontCheck: metrics.fontCheck,
      backingBlankGuess: metrics.backingBlankGuess,
      textCount: metrics.textCount,
    },
    sample, texts: metrics.texts, hits: metrics.hits,
    files: { full: fullPath },
  };

  const cssPerCanvasX = metrics.canvas.cssW / metrics.canvas.w;
  const cssPerCanvasY = metrics.canvas.cssH / metrics.canvas.h;
  const devicePerCanvasX = cssPerCanvasX * metrics.dpr;
  const devicePerCanvasY = cssPerCanvasY * metrics.dpr;
  report.scale = {
    cssPerCanvasX: +cssPerCanvasX.toFixed(4),
    cssPerCanvasY: +cssPerCanvasY.toFixed(4),
    devicePerCanvasX: +devicePerCanvasX.toFixed(4),
    devicePerCanvasY: +devicePerCanvasY.toFixed(4),
  };
  report.tex = { n: metrics.texN, px: metrics.texPx, bytes: (metrics.texPx || 0) * 4 };
  const CROPS = {
    m932: [{ name: 'skill-row', left: 280, top: 248, width: 1000, height: 110 }, { name: 'train-line', left: 410, top: 298, width: 860, height: 48 }],
    m844: [{ name: 'skill-row', left: 240, top: 210, width: 980, height: 110 }, { name: 'train-line', left: 360, top: 268, width: 820, height: 46 }],
    d1280: [{ name: 'skill-row', left: 120, top: 110, width: 780, height: 160 }, { name: 'train-line', left: 200, top: 182, width: 560, height: 24 }],
  };
  report.fixedCrops = {};
  for (const c of CROPS[view.id] || []) {
    const crop = await cropSoft(full, c.left, c.top, c.width, c.height);
    const p = join(dir, `${LABEL}-${c.name}.png`);
    writeFileSync(p, crop.png);
    report.files[c.name] = p;
    report.fixedCrops[c.name] = { box: c, soft: crop.soft };
  }
  if (sample) {
    const texelsPerCanvas = sample.texW / Math.max(1, sample.canvasW);
    report.sampleScale = {
      texelsPerCanvasX: +texelsPerCanvas.toFixed(4),
      texelsPerDeviceX: +(texelsPerCanvas / devicePerCanvasX).toFixed(4),
      resolution: sample.resolution,
      sourceResolution: sample.sourceResolution,
      parentScale: sample.parentScale,
      camZoom: metrics.cam.zoom,
    };
    // screenshot crop in device pixels
    const sx = (metrics.canvas.left + sample.canvasX * cssPerCanvasX) * metrics.dpr;
    const sy = (metrics.canvas.top + sample.canvasY * cssPerCanvasY) * metrics.dpr;
    const sw = sample.canvasW * cssPerCanvasX * metrics.dpr;
    const sh = sample.canvasH * cssPerCanvasY * metrics.dpr;
    const padX = Math.round(sw * 0.04), padY = Math.round(sh * 0.35);
    const crop = await cropSoft(full, sx - padX, sy - padY, sw + padX * 2, sh + padY * 2);
    const cropPath = join(dir, `${LABEL}-textcrop.png`);
    writeFileSync(cropPath, crop.png);
    report.files.textcrop = cropPath;
    report.screenshotCrop = { box: crop.box, soft: crop.soft, png: { w: crop.meta.w, h: crop.meta.h } };
    if (metrics.texPng?.startsWith('data:')) {
      const buf = Buffer.from(metrics.texPng.split(',')[1], 'base64');
      const texPath = join(dir, `${LABEL}-texttex.png`);
      writeFileSync(texPath, buf);
      const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      report.files.texttex = texPath;
      report.texttex = { w: raw.info.width, h: raw.info.height, soft: softness(raw.data, raw.info.width, raw.info.height, raw.info.channels) };
    }
  }
  if (typeof metrics.backingPng === 'string' && metrics.backingPng.startsWith('data:') && sample) {
    const buf = Buffer.from(metrics.backingPng.split(',')[1], 'base64');
    const meta = await sharp(buf).metadata();
    report.backing = { w: meta.width, h: meta.height, bytes: buf.length };
    if (meta.width === metrics.canvas.w && meta.height === metrics.canvas.h) {
      const crop = await cropSoft(buf, sample.canvasX - 4, sample.canvasY - 4, sample.canvasW + 8, sample.canvasH + 8);
      const p = join(dir, `${LABEL}-canvastext.png`);
      writeFileSync(p, crop.png);
      report.files.canvastext = p;
      report.canvasTextSoft = crop.soft;
      // 只留裁剪，整张 backing 太大不落盘
    }
  }
  if (metrics.hits?.length) {
    const cssPerCanvas = metrics.canvas.cssH / metrics.canvas.h;
    report.hitCss = metrics.hits.map(h => ({ ...h, cssH: +(h.canvasH * cssPerCanvas).toFixed(2), cssW: +(h.canvasW * cssPerCanvas).toFixed(2) }));
  }
  delete metrics.texPng; delete metrics.backingPng;
  writeFileSync(join(dir, `${LABEL}-metrics.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    id: view.id,
    dpr: report.measured.dpr,
    css: [report.measured.innerW, report.measured.innerH],
    canvas: [report.measured.canvas.w, report.measured.canvas.h],
    canvasCss: [report.measured.canvas.cssW, report.measured.canvas.cssH],
    k: report.measured.render.k,
    lw: report.measured.render.lw,
    mscale: report.measured.mscale,
    zoom: report.measured.cam.zoom,
    renderer: report.measured.renderer,
    scale: report.scale,
    sampleScale: report.sampleScale,
    sample: sample && { text: sample.text, fontSize: sample.fontSize, res: sample.resolution, srcRes: sample.sourceResolution, tex: [sample.texW, sample.texH], onCanvas: [sample.canvasW, sample.canvasH], parent: sample.parentScale, stroke: sample.stroke, font: sample.font },
    soft: { tex: report.texttex?.soft, canvas: report.canvasTextSoft, shot: report.screenshotCrop?.soft, fixed: report.fixedCrops },
    tex: report.tex,
    hitCss: report.hitCss?.slice(0, 3),
    font: report.measured.fontCheck,
    png: report.screenshotCrop?.png,
    files: report.files,
  }, null, 2));
}

for (const v of VIEWS) {
  console.log('\n=== ' + v.id + ' ===');
  await shot(v);
}
