#!/usr/bin/env python3
# 在已打过 apply-sim-gear.py 的 worktree 上加 SIM_DROP_LOG 钩子（默认关：每处都 `DL &&` 短路）
import sys, shutil, os
wt = sys.argv[1]; p = os.path.join(wt, 'tests/sim-lib.ts'); s = open(p).read()
assert 'sim-droplog' not in s
s = s.replace("import { GEAR_SWAP, gearTick, gearEnd } from './sim-gear';", "import { GEAR_SWAP, gearTick, gearEnd } from './sim-gear';\nimport { DL, dlVirt, dlTick, dlEnd } from './sim-droplog';", 1)
a = "lvVK[w.level] = (lvVK[w.level] ?? 0) + 1;"
assert s.count(a) == 2
s = s.replace(a, a + " if (DL) dlVirt(id, w.level);")
b = "// feat/sim-gear-swap\n"
assert s.count(b) == 1
s = s.replace(b, "// feat/sim-gear-swap\n      if (DL) dlTick(w);\n", 1)
c = "gearEnd(w, c, seed);"
assert s.count(c) == 1
s = s.replace(c, c + " dlEnd(w, c, seed);", 1)
open(p, 'w').write(s)
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests', 'sim-droplog.ts')
if os.path.abspath(src) != os.path.abspath(os.path.join(wt, 'tests/sim-droplog.ts')): shutil.copy(src, os.path.join(wt, 'tests/sim-droplog.ts'))
print('ok', wt)
