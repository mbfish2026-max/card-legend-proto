import { writeFileSync } from 'fs';
import '../src/combat/World';
import { renderDropPlan } from '../src/data/drop-plan-doc';
writeFileSync(new URL('../docs/drop-plan.md', import.meta.url), renderDropPlan()); console.log('docs/drop-plan.md written');
