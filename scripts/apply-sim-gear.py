# 把 sim 换装钩子打到任一版本的 tests/sim-lib.ts（三个版本该行一致）。用法：python3 scripts/apply-sim-gear.py <worktree>
import sys,shutil,os
d=sys.argv[1]; p=os.path.join(d,'tests/sim-lib.ts'); s=open(p).read()
old="      for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[w.targetSlot(it)!]) w.equipItem(i); }"
assert s.count(old)==1, 'hook line not found'
new="      if (GEAR_SWAP) gearTick(w, c, seed); else { for (let i = w.bag.length - 1; i >= 0; i--) { const it = w.bag[i]; if (it.slot && it.req <= w.level && !w.equip[w.targetSlot(it)!]) w.equipItem(i); } if (process.env.SIM_GEAR_DUMP) gearTick(w, c, seed, false); } // feat/sim-gear-swap"
s=s.replace(old,new)
s=s.replace("import { World } from '../src/combat/World';","import { World } from '../src/combat/World';\nimport { GEAR_SWAP, gearTick } from './sim-gear';",1)
open(p,'w').write(s)
src=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','tests','sim-gear.ts')
if os.path.abspath(src)!=os.path.abspath(os.path.join(d,'tests/sim-gear.ts')): shutil.copy(src,os.path.join(d,'tests/sim-gear.ts'))
print('ok',p)
