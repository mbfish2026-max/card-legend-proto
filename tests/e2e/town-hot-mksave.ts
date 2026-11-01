// fix/town-hot e2e 存档：新手村城内、HP 10、金创药 5 瓶
import { World } from '../../src/combat/World';
// @ts-ignore node
import { writeFileSync } from 'node:fs';
const w = new World(Math.random); w.startInVillage(); w.pots[0] = 5; w.hero!.hp = 10;
writeFileSync((globalThis as any).process.argv[2] ?? '/tmp/town-hot-save.json', JSON.stringify(w.toSave()));
