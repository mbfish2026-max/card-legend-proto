import { writeFileSync } from 'node:fs';
import { renderEquipTable } from '../src/data/equipTableDoc';
writeFileSync(new URL('../docs/equip-table.md', import.meta.url), renderEquipTable());
console.log('docs/equip-table.md written');
