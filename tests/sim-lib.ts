// 难度模拟（从 battle.test.ts 抽出，供测试与 scripts/sim-bands.ts 共用；逻辑不变，另记每次死亡的层/等级与每层进入等级）
declare const process: { env: Record<string, string | undefined> };
import { World } from '../src/combat/World';
import { FLOORS } from '../src/data/world';
import { CLASSES, ClassId } from '../src/data/classes';
import { ITEMS } from '../src/data/items';
import { BOOKS } from '../src/data/books';
import { comboFor } from '../src/data/companion';
import { WORLD, FLOOR_ORDER } from '../src/data/world';
import { MAIN_ANCHORS, killExp, monsterLevelAt } from '../src/data/balance';
import { ENEMIES } from '../src/data/units';
export function seeded(s: number) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const learnAll = (w: World) => { w.learned = new Set(CLASSES[w.cls].skills.map(s => s.id)); return w; };
export const SEEDS = [3, 7, 11, 19, 23, 42, 57, 88, 101];
const NEW_BOOKS = ['big_fireball', 'burst_fire', 'hell_fire', 'lightning_flash', 'hell_thunder', 'ghost_shield', 'holy_armor', 'mass_heal'];
/** 模拟时长上限（游戏内秒） */
export const SIM_MAX_T = 7200 * 6; // 任务 A 层长 ×~2.3：模拟时长上限按比例放宽（仅防死循环的保护上限，非验收指标）
/** 练级：主线层清完但等级 < 下一层进入等级时，真打重刷本层最多 SIM_REPLAYS 次，之后按本层实测「秒/击杀」虚拟刷怪（只加经验与估算用时，不掉装备、不计死亡）——否则 60h 量级的模拟跑不完 */
export const SIM_REPLAYS = Number(process.env.SIM_REPLAYS ?? 2);
/** 同层连死几次后回上一层练 1 级（玩家行为模拟 [适配]） */
export const SIM_STUCK = 5;
const band = (lv: number) => Math.min(5, Math.floor((lv - 1) / 10));
export const simRun = (c: ClassId, seed: number, maxT = SIM_MAX_T) => {
    const w = (process.env.ALL ? learnAll : (x: World) => x)(new World(seeded(seed), 1, FLOORS, c)); let cds = w.skills.map(() => 0); let t = 0, potUsed = 0; const learnLog: string[] = []; let hjCombo = 0, hjHeroDmg = 0, hjAllDmg = 0, hjT = 0, hjOut = 0;
    const deathAt: { floor: number; lv: number }[] = []; const floorLv: Record<number, number> = {};
    const kills = [0, 0, 0, 0, 0, 0], killT = [0, 0, 0, 0, 0, 0], virtKills = [0, 0, 0, 0, 0, 0], virtT = [0, 0, 0, 0, 0, 0], replays: Record<number, number> = {}; let floorKills = 0, floorT = 0, lastF = -1;
    /** 首清经验：每层第一次进入到清完（离开）所得经验 ÷ 进入时等级所需 */
    const firstClear: Record<number, { lv: number; exp: number }> = {}; let curFirst: number | null = null;
    while (!w.done && t < maxT) {
      if (floorLv[w.floorIndex] === undefined && !w.town) floorLv[w.floorIndex] = w.level;
      const h = w.hero;
      if (!h) { if (process.env.SIMDBG && deathAt.length % 25 === 0) console.log('died', w.floorIndex, 'Lv', w.level, (globalThis as any)._near); deathAt.push({ floor: w.floorIndex, lv: w.level }); learnLog.push(`死@${w.floorIndex + 1}层Lv${w.level}`); w.respawn();
        // 任务 A 后层更长、怪更多，死亡即整层重刷：同层连死 SIM_STUCK 次 → 模拟玩家「回上一层练 1 级再来」（虚拟刷怪，只加经验与估算用时，死亡照常计数）
        const fd = deathAt.filter(d => d.floor === w.floorIndex).length, pk = FLOOR_ORDER.indexOf(w.floorIndex);
        if (fd % SIM_STUCK === 0 && pk > 0) { const pf = FLOOR_ORDER[pk - 1], ids = FLOORS[pf].spawns.map(sp => sp.id).filter(id => ENEMIES[id]?.tier !== 'boss'), lv0 = w.level, spk = 6;
          let i = 0; while (w.level === lv0 && i < 5000) { const id = ids[i++ % ids.length]; const b = band(w.level); w.gainExp(killExp(id, pf, w.level, monsterLevelAt(id, pf))); virtKills[b]++; virtT[b] += spk; t += spk; }
          w.drainEvents(); w.recompute(true); learnLog.push(`卡关练级@${pf + 1}层→Lv${w.level}`); }
        continue; }
      if (h.hp < h.maxHp * 0.4 && w.usePotion(w.pots[1] > 0 ? 1 : 0)) potUsed++;
      if ((h.mp ?? 0) < 40) w.usePotion(w.pots[3] > 0 ? 3 : 2);
      for (let i = 0; i < w.skills.length; i++) { if (w.skills[i].id === 'charm' && !w.charmAutoOk()) continue; w.cast(i, cds); }
      for (let i = 0; i < w.skills.length; i++) w.cast(i, cds, { auto: true }); // 模拟 = 自动施法（施毒跳过已中毒）
      for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[w.targetSlot(it)!]) w.equipItem(i); }
      // 黑铁：模拟脚本卖掉（避免碎装干扰难度基线；玩家可手动强化）
      for (let i = w.bag.length - 1; i >= 0; i--) if (w.bag[i]?.item === 'black_iron') w.sellItem(i);
      // 黑铁：模拟脚本卖掉（避免碎装干扰难度基线；玩家可手动强化）
      for (let i = w.bag.length - 1; i >= 0; i--) if (w.bag[i]?.item === 'black_iron') w.sellItem(i);
      // 合击版阶段 A 专项（HJ=1）：40 级领英雄并召唤（攻击状态），补英雄药/火龙之心，怒满即爆发；默认不开 → 与 main 完全一致
      if (process.env.HJ && w.level >= 40 && !w.town) { if (!w.companion) { w.recruitCompanion(process.env.HJ_CLS as ClassId || c, '英雄'); const cp = w.companion!; cp.combo = [comboFor(c, cp.cls)!.id]; cp.equip.heart = { uid: 0, item: 'fire_heart', name: '火龙之心', rarity: 'common', stats: {}, req: 0, price: 0 } as any; cp.heartStore = 30000; }
        const cp = w.companion!; if (cp.bag.length < 4) { const pot = (item: string, name: string) => ({ uid: 0, item, name, rarity: 'common', stats: {}, req: 0, price: 0, qty: 5 }) as any; cp.bag.push(pot('hp_strong', '强效金创药'), pot('mp_strong', '强效魔法药')); }
        if (!cp.out && w.companionCooldown() <= 0) w.toggleCompanion(); w.unleashCombo(); }
      if (process.env.SIM && Math.round(t * 20) % 2000 === 0) console.log("   t", Math.round(t), "lv", w.level, "gold", w.gold, "floor", w.floorIndex + 1, "deaths", w.deaths);
      // R11 技能书：达到等级且金币有余就买，背包里的书能学就学（学会后快捷栏重排，冷却重置）
      for (const b of process.env.CS ? [...w.shopBooks(), ...w.csBooks()] : w.shopBooks()) { const sk = w.skillPool.find(x => x.id === b.skill)!; if (!w.learned.has(b.skill) && w.level >= w.needLevel(sk) && w.gold >= b.price && !w.bag.some(x => ITEMS[x.item]?.book === b.skill)) w.buyBook(b.skill); }
      for (let i = w.bag.length - 1; i >= 0; i--) if (ITEMS[w.bag[i].item]?.book && w.learnBook(i).startsWith('学会')) { cds = w.skills.map(() => 0); learnLog.push(`${w.level}级${w.skillPool.find(x => x.id === [...w.learned].pop())!.name}@${w.floorIndex + 1}层`); }
      // 可选对照（NEWBOOKS=1）：#11/#12 新书达到官方学习等级即学会（最坏情况；默认 = 已接入后的真实书店/掉落）
      if (process.env.NEWBOOKS) for (const b of Object.values(BOOKS)) if (NEW_BOOKS.includes(b.skill) &&  b.cls === w.cls && !w.learned.has(b.skill) && w.level >= w.needLevel(w.skillPool.find(x => x.id === b.skill)!)) { w.learned.add(b.skill); cds = w.skills.map(() => 0); }
      // 去城镇商人补药（简化：金币够就买）。town-return 后战斗地图无商人，这里抽象为“随时回城补给”（回城免费），不调用战斗图商店。
      // 实测：origin/main 2b14653 同样是战士 5/6/3/2/0/9/5/0/0（种子42=9），非本分支回归；改成仅脱战/换层补给会让战士中位数升到 5–8。
      // 有可学的书店技能书时攒钱（药只补到 1 瓶）
      const saving = w.shopBooks().some(b => !w.learned.has(b.skill) && w.level >= w.needLevel(w.skillPool.find(x => x.id === b.skill)!)); // 补给策略：进图前回村补药，药量随层深增加（存钱买书时也按层深少量补）
      const depth = w.floorIndex;
      const cap = saving ? Math.min(3, 1 + Math.floor(depth / 4)) : 3 + Math.floor(depth / 2);
      while (w.gold >= 60 && w.pots[1] < cap) w.buyPotion(1);
      while (w.gold >= 60 && w.pots[3] < cap) w.buyPotion(3);
      if (w.floorIndex !== lastF) { lastF = w.floorIndex; if (process.env.SIMDBG && w.hero) console.log('enter', w.floorIndex, 'Lv', w.level, 'hp', w.hero.maxHp, 'atk', w.hero.atk, 'def', w.hero.def, 'deaths', w.deaths); floorKills = 0; floorT = 0; if (!w.town && !(w.floorIndex in firstClear)) { firstClear[w.floorIndex] = { lv: w.level, exp: 0 }; curFirst = w.floorIndex; } else curFirst = null; }
      const k = FLOOR_ORDER.indexOf(w.floorIndex);
      if (!w.town && k >= 0 && w.hero && w.hero.x >= w.exitX - WORLD.exitRadius - 20 && !w.alive('enemy').some(u => u.tier === 'boss') && w.level < MAIN_ANCHORS[k + 1]) {
        curFirst = null; const f = w.floorIndex;
        if ((replays[f] ?? 0) < SIM_REPLAYS) { replays[f] = (replays[f] ?? 0) + 1; w.loadFloor(f); lastF = f; continue; }
        const ids = w.floor.spawns.map(sp => sp.id).filter(id => ENEMIES[id]?.tier !== 'boss'); const spk = floorKills ? Math.max(1, floorT / floorKills) : 5;
        let i = 0; while (w.level < MAIN_ANCHORS[k + 1] && i < 1e6) { const id = ids[i++ % ids.length]; const b = band(w.level); w.gainExp(killExp(id, f, w.level, monsterLevelAt(id, f))); virtKills[b]++; virtT[b] += spk; }
        w.drainEvents(); w.recompute(true);
      }
      const _d0 = w.deaths, _near = process.env.SIMDBG ? w.units.filter(u => u.alive && u.team !== 'ally' && Math.abs(u.x - w.hero!.x) < 300).map(u => `${u.id}:${u.hp}/${u.maxHp}a${u.atk}`).join(',') : '';
      w.step(0.05, { dx: (() => { const f = w.queue(1)[0]; return f && w.inMelee(h, f) ? 0 : 1; })(), dy: 0 }); (globalThis as any)._near = _near; { const evs = w.drainEvents(); for (const e of evs) if (e.type === 'exp') { if (curFirst !== null) firstClear[curFirst].exp += (e as any).amount; } else if (e.type === 'death' && !w.town) { kills[band(w.level)]++; floorKills++; }
      killT[band(w.level)] += 0.05; floorT += 0.05; if (process.env.HJ) { const cu = w.companionUnit?.uid; if (w.level >= 40) hjT += 0.05; if (w.companionUnit) hjOut += 0.05; for (const e of evs) { if (e.type === 'combo') hjCombo++; else if (e.type === 'damage' && (e as any).source !== undefined && w.units.some(u => u.uid === (e as any).target && u.team === 'enemy') || (e.type === 'damage' && (e as any).source === cu && cu !== undefined)) { if ((e as any).source === cu) hjHeroDmg += (e as any).amount; else hjAllDmg += (e as any).amount; } } } } t += 0.05; /* 玩家：前方接战时站定输出（可穿怪） */ for (let i = 0; i < cds.length; i++) cds[i] = Math.max(0, cds[i] - 0.05);
    }
    if (process.env.HJ_STATS) console.log(`   HJ ${c} 种子${seed}: lv≥40 时长 ${Math.round(hjT)}s 英雄在场 ${Math.round(hjOut)}s 合击 ${hjCombo} 次 英雄伤害占比 ${(100 * hjHeroDmg / Math.max(1, hjHeroDmg + hjAllDmg)).toFixed(1)}% 英雄等级 ${w.companion?.level ?? "-"} Lv≥40后死亡 ${learnLog.filter(x => /死@.*Lv(\d+)/.test(x) && +x.match(/Lv(\d+)/)![1] >= 40).length}`);
    return { deaths: w.deaths, done: w.done, potUsed, t, level: w.level, learnLog, deathAt, floorLv, kills, killT, virtKills, virtT, firstClear };
  };
export const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[(b.length - 1) >> 1] / 2 + b[b.length >> 1] / 2; };
