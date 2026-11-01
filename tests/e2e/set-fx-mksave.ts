// 生成三职业穿三圣 4 件的存档（供 set-fx-verify.mjs）
// @ts-ignore node
import { writeFileSync } from 'node:fs';
import { World } from '../../src/combat/World';
import { FLOORS } from '../../src/data/world';
const SET: any = { warrior: 'shengzhan', mage: 'fashen', taoist: 'tianzun' }, out: any = {};
for (const cls of Object.keys(SET)) { const w = new World(() => 0.5, 50, FLOORS, cls as any);
  for (const [k, p] of [['helmet', 'helm'], ['necklace', 'necklace'], ['ring1', 'ring'], ['bracelet1', 'bracelet']]) (w.equip as any)[k] = w.makeItem(`${SET[cls]}_${p}`);
  for (const s of w.skillPool) { w.learned.add(s.id); w.skillTrain[s.id] = 99999; }
  out[cls] = w.toSave(); }
// @ts-ignore node
writeFileSync(process.argv[2] ?? '/tmp/set-fx-saves.json', JSON.stringify(out));
