#!/usr/bin/env node
// 一键回归：npm run regress            → 对本地 dist 构建（自动 npm run build，--no-build 跳过）
//          npm run regress -- --url URL  或 REGRESS_URL=URL → 另加线上校验（index/JS/素材 200 + JS 哈希对比本地 dist）
// 退出码：全过 0，否则 1。线上哈希不一致只报告（WARN），不算失败。
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { startPreview, launch, watch, texts, findPos, sleep } from './e2e/lib.mjs';
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist');
const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const URL_ = arg('--url') ?? process.env.REGRESS_URL;
const rows = []; const add = (group, name, status, info = '') => rows.push({ group, name, status, info });

// 0. 构建
if (!argv.includes('--no-build')) { try { execSync('npm run build', { cwd: ROOT, stdio: 'pipe' }); add('构建', 'npm run build', 'PASS'); } catch (e) { add('构建', 'npm run build', 'FAIL', String(e.stdout ?? e).slice(-200)); } }

// 1. 逻辑回归（存档迁移 / 技能书 / 传送 / 设置存取）
{
  const r = spawnSync('npx', ['tsx', 'tests/regress.unit.ts'], { cwd: ROOT, encoding: 'utf8' });
  const line = (r.stdout ?? '').split('\n').find(l => l.startsWith('__REGRESS__'));
  if (!line) add('逻辑', 'regress.unit.ts', 'FAIL', (r.stderr ?? '').slice(-300));
  else for (const x of JSON.parse(line.slice(11))) add(x.group, x.name, x.ok ? 'PASS' : 'FAIL', x.info ?? '');
  const o = spawnSync('npx', ['tsx', 'tests/battle.test.ts'], { cwd: ROOT, encoding: 'utf8' });
  const m = /全部通过 (\d+) 项/.exec(o.stdout ?? ''); add('原有单测', 'tests/battle.test.ts', o.status === 0 ? 'PASS' : 'FAIL', m ? `${m[1]} 项` : (o.stderr ?? '').split('\n').find(l => l.includes('FAIL')) ?? '');
}

// 2. 浏览器（本地 dist）：启动无报错 / 设置界面与存储一致 / 旧存档继续游戏
if (existsSync(join(DIST, 'index.html'))) {
  const sv = await startPreview(); const b = await launch();
  const run = async (group, name, fn) => { const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page); try { const r = await fn(page, w); add(group, name, r === true ? 'PASS' : 'FAIL', r === true ? '' : String(r)); } catch (e) { add(group, name, 'FAIL', String(e.message ?? e).slice(0, 200)); } await page.close(); };
  const toTitle = async (page, qs = '') => { await page.goto(sv.url + qs); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(800); };
  const click = async (page, k, re) => { const p = await findPos(page, k, re); if (!p) throw new Error('找不到 ' + re); await page.mouse.click(p.x, p.y); await sleep(600); };
  const ignorable = e => /Texture key already in use/.test(e); // 已知 BUG-003
  await run('冒烟', '本地构建启动标题页无 JS 报错', async (page, w) => { await toTitle(page); const e = w.errs.filter(x => !ignorable(x)); return !e.length || e.join(' | '); });
  const preset = { volume: 0.3, muted: true, lowFx: true, autoAttack: false };
  await run('设置', '标题设置界面显示 = 已存设置', async page => {
    await page.evaluateOnNewDocument(p => { if (!sessionStorage.getItem('x')) { localStorage.setItem('fcl_settings_v1', JSON.stringify(p)); sessionStorage.setItem('x', '1'); } }, preset);
    await toTitle(page); await click(page, 'Title', '^设 置$'); const t = await texts(page, 'Title');
    const need = ['音量 30%（静音）', '低特效：开', '自动攻击：关']; const miss = need.filter(x => !t.includes(x)); return !miss.length || '缺少 ' + miss.join(',');
  });
  await run('设置', '界面切换低特效 → 写入存储 → 刷新后界面一致', async page => {
    await page.evaluateOnNewDocument(p => { if (!sessionStorage.getItem('x')) { localStorage.setItem('fcl_settings_v1', JSON.stringify(p)); sessionStorage.setItem('x', '1'); } }, preset);
    await toTitle(page); await click(page, 'Title', '^设 置$'); await click(page, 'Title', '^低特效：开$');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fcl_settings_v1')).lowFx);
    await page.reload(); await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive()); await sleep(800); await click(page, 'Title', '^设 置$');
    const t = await texts(page, 'Title'); return (stored === false && t.includes('低特效：关') && t.includes('音量 30%（静音）')) || `stored=${stored} ui=${t.filter(x => /低特效|音量/.test(x))}`;
  });
  await run('设置', '游戏内设置面板与标题一致（同一份 Settings）', async page => {
    await page.evaluateOnNewDocument(p => localStorage.setItem('fcl_settings_v1', JSON.stringify(p)), preset);
    await page.goto(sv.url + '?class=warrior'); await page.waitForFunction(() => window.__game?.scene.getScene('Battle')?.world, { timeout: 30000 }); await sleep(1500);
    await page.evaluate(() => window.__game.scene.getScene('Battle').onKey('ESCAPE')); await sleep(800);
    const all = [...await texts(page, 'UI'), ...await texts(page, 'Battle')]; const miss = ['音量 30%（静音）', '低特效：开', '自动攻击：关'].filter(x => !all.includes(x)); return !miss.length || '缺少 ' + miss.join(',');
  });
  await run('存档迁移', '浏览器：旧版存档(无 mapV/learned) 点「继续」进入迁移后的层且金币保留', async page => {
    const legacy = await page.evaluate(() => null); void legacy;
    await page.evaluateOnNewDocument(() => localStorage.setItem('fcl_save_v1', JSON.stringify({ v: 1, cls: 'mage', level: 25, exp: 10, gold: 777, pots: [2, 1, 2, 1], equip: {}, bag: [], floorIndex: 1, kills: 40, nextUid: 10, reached: [0, 1], bossKilled: [0] })));
    await toTitle(page); await click(page, 'Title', '^继 续$');
    await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 });
    const r = await page.evaluate(() => { const w = window.__game.scene.getScene('Battle').world; return { f: w.floorIndex, g: w.gold, lv: w.level, l: [...w.learned] }; });
    return (r.f === 2 && r.g === 777 && r.lv === 25 && r.l.includes('thunder')) || JSON.stringify(r);
  });
  await b.close(); sv.stop();
} else add('浏览器', 'dist 不存在', 'FAIL');

// 3. 线上校验
if (URL_) {
  const base = URL_.endsWith('/') ? URL_ : URL_ + '/';
  const sha = buf => createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const get = async u => { try { const r = await fetch(u, { cache: 'no-store' }); return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) }; } catch (e) { return { status: 0, err: String(e) } } };
  const idx = await get(base); add('线上', `index ${base}`, idx.status === 200 ? 'PASS' : 'FAIL', `HTTP ${idx.status}`);
  if (idx.status === 200) {
    const html = idx.buf.toString(); const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^https?:|^#|^data:/.test(u));
    const localHtml = existsSync(join(DIST, 'index.html')) ? readFileSync(join(DIST, 'index.html'), 'utf8') : '';
    for (const ref of refs) {
      const u = new URL(ref, base).href, r = await get(u); const rel = new URL(u).pathname.replace(/^\/card-legend-proto\//, '');
      add('线上', `引用 ${rel}`, r.status === 200 ? 'PASS' : 'FAIL', `HTTP ${r.status}`);
      if (/\.js$/.test(rel)) {
        const lf = join(DIST, rel); const inLocal = localHtml.includes(rel);
        if (!existsSync(lf)) add('线上哈希', rel, 'WARN', `本地 dist 无此文件（本地构建与线上不一致；本地引用: ${(localHtml.match(/assets\/[\w-]+\.js/g) ?? []).join(',')}）`);
        else { const a = sha(r.buf ?? Buffer.alloc(0)), c = sha(readFileSync(lf)); add('线上哈希', rel, a === c && inLocal ? 'PASS' : 'WARN', a === c ? `sha256 ${a} 一致` : `线上 ${a} ≠ 本地 ${c}`); }
      }
    }
    // 素材：本地 dist 里的全部素材文件在线上应为 200
    const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
    const files = existsSync(DIST) ? walk(join(DIST, 'assets')).map(f => relative(DIST, f)).filter(f => !f.endsWith('.js')) : [];
    const bad = []; let okN = 0; const q = [...files];
    await Promise.all(Array.from({ length: 12 }, async () => { while (q.length) { const f = q.shift(); const r = await fetch(new URL(f, base), { method: 'HEAD' }).catch(() => ({ status: 0 })); r.status === 200 ? okN++ : bad.push(`${f}:${r.status}`); } }));
    add('线上', `素材 ${files.length} 个（按本地 dist 清单）`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${okN} 个 200，失败 ${bad.length}: ${bad.slice(0, 5).join(' ')}` : `${okN}/${files.length} 均 200`);
    for (const f of ['sw.js', 'manifest.webmanifest']) { const r = await get(base + f); add('线上', f, r.status === 200 ? 'PASS' : 'FAIL', `HTTP ${r.status}`); }
  }
}

// 汇总
const n = s => rows.filter(r => r.status === s).length;
const w = Math.max(...rows.map(r => (r.group + r.name).length)) + 4;
console.log('\n结果  分组/用例'.padEnd(w) + '  说明');
for (const r of rows) console.log(`${r.status.padEnd(5)} [${r.group}] ${r.name}${r.info ? '  — ' + r.info : ''}`);
console.log(`\n汇总：PASS ${n('PASS')}  FAIL ${n('FAIL')}  WARN ${n('WARN')}  共 ${rows.length}${URL_ ? '（含线上 ' + URL_ + '）' : '（本地构建）'}`);
process.exit(n('FAIL') ? 1 : 0);
