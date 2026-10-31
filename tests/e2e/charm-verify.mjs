// 诱惑之光：读档法师 → 技能面板/快捷栏出现 → 对鹿施放（成功/失败/免疫）→ 宠物标识 → 存档不含宠物
// 用法：npm run build && node tests/e2e/charm-verify.mjs [截图目录]
import { startPreview, launch, watch, findPos, sleep } from './lib.mjs';
const dir = process.argv[2] ?? '/tmp';
const save = { v: 1, cls: 'mage', level: 30, exp: 0, gold: 5000, pots: [5, 0, 0, 9], floorIndex: 0, kills: 0, nextUid: 100, mapV: 3, eqV: 2, expV: 2, equip: {}, bag: [], learned: ['fireball', 'charm'] };
const sv = await startPreview(), b = await launch(); let out = {};
try {
  const page = await b.newPage(); await page.setViewport({ width: 1280, height: 720 }); const w = watch(page);
  await page.evaluateOnNewDocument(s => localStorage.setItem('fcl_save_v1', JSON.stringify(s)), save);
  await page.goto(sv.url);
  await page.waitForFunction(() => window.__game?.scene.getScene('Title')?.sys.isActive(), { timeout: 30000 }); await sleep(1500);
  const p = await findPos(page, 'Title', '继'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle')?.world?.hero, { timeout: 30000 }); await sleep(2000);
  await page.evaluate(() => window.__game.scene.getScene('Battle').openPanel('skills')); await sleep(800);
  const panelHas = !!(await findPos(page, 'UI', '诱惑之光')); await page.screenshot({ path: `${dir}/charm-1-skills.png` });
  await page.keyboard.press('Escape'); await sleep(400);
  const r = await page.evaluate(async () => {
    const B = window.__game.scene.getScene('Battle'), W = B.world, h = W.hero; h.mp = h.maxMp = 9999; const res = {};
    const k = W.skills.find(s => s.id === 'charm')?.key; res.key = k;
    const ENE = W.units.filter(u => u.team === 'enemy' && u.alive);
    const shoot = async (e, roll) => { const o = W.rng; W.rng = () => roll; W.units.forEach(u => { if (u.team === 'enemy' && u !== e && Math.abs(u.x - e.x) < 900) u.x += 2000; }); h.x = e.x - 200; B.cds = B.cds.map(() => 0); const r = B.onKey(k); await new Promise(r => setTimeout(r, 100)); W.rng = o; await new Promise(r => setTimeout(r, 600)); return r; };
    const e1 = ENE[0]; if (!e1) return { err: 'no enemy' }; e1.level = 1; e1.hp = e1.maxHp = 1e9; e1.atk = 0; // 防止主角自动攻击打死目标
    const id0 = e1.id; e1.id = 'skeleton'; await shoot(e1, 0); res.immune = e1.team; e1.id = id0;
    await shoot(e1, 0.999); res.fail = e1.team;
    await shoot(e1, 0); res.ok = e1.team; res.pet = !!e1.pet; res.pets = W.pets.length;
    res.saveHasPet = JSON.stringify(W.toSave()).includes('petUntil');
    return res; });
  await sleep(500); await page.screenshot({ path: `${dir}/charm-2-pet.png` });
  out = { panelHas, ...r, errs: w.errs.filter(e => !/404|Failed to load/.test(e)).slice(0, 8) };
} finally { await b.close(); sv.stop(); }
console.log(JSON.stringify(out, null, 1));
