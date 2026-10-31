import { writeFileSync } from 'fs';
import { renderMonsters } from '../src/data/monsters-doc';
writeFileSync(new URL('../docs/monsters-official.md', import.meta.url), renderMonsters()); console.log('docs/monsters-official.md written');
