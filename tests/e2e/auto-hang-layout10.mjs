import { startPreview, launch, sleep, findPos } from './lib.mjs';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const sv = await startPreview(), b = await launch();
for (const [vw,vh] of [[844,390],[874,402],[932,430]]) {
const p = await b.newPage(); await p.setUserAgent(UA); await p.setViewport({ width: vw, height: vh, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(s => { localStorage.clear(); localStorage.setItem('fcl_save_v1', JSON.stringify(s)); }, { v: 1, cls:'mage', level: 50, exp: 0, gold: 99999, pots: [5, 0, 0, 9], floorIndex: 2, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: [] });
await p.goto(sv.url); await p.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 60000 }); await sleep(1500);
const t = await findPos(p, 'Title', '继'); await p.touchscreen.tap(t.x, t.y);
await p.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero && document.getElementById('mhud'), { timeout: 30000 }); await sleep(1500);
await p.evaluate(() => { const W = window.__game.scene.getScene('Battle').world; for (const s of W.skillPool) W.learned.add(s.id); window.__game.scene.getScene('Battle').skillsDirty = true; }); await sleep(2000);
const r = await p.evaluate(() => { const g = e => e.getBoundingClientRect(); const h = g(document.getElementById('mh-hang')); const tops=[...document.querySelectorAll('#mhud *')].filter(e=>e.id!=='mh-hang'&&!e.contains(document.getElementById('mh-hang'))&&!document.getElementById('mh-hang').contains(e)&&getComputedStyle(e).display!=='none').map(g).filter(t=>t.width&&!(t.right<=h.left||t.left>=h.right||t.bottom<=h.top||t.top>=h.bottom)); return { n: document.querySelectorAll('#mhud .sk').length, h: [h.left,h.top,h.right,h.bottom].map(Math.round), top: tops.map(t=>[t.left,t.top,t.right,t.bottom].map(Math.round)) }; });
console.log(vw, JSON.stringify(r)); if (r.top.length) { console.log('OVERLAP'); process.exitCode = 1; } await p.screenshot({path:`/workspace/pcsim/hang-shots/m${vw}-mage10.png`}); await p.close(); }
await b.close(); sv.stop();
console.log(process.exitCode ? 'layout10 FAIL' : 'layout10 ALL OK');
