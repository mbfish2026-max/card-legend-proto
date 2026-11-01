#!/usr/bin/env python3
import sys, os, shutil
wt = sys.argv[1]; p = os.path.join(wt, 'tests/sim-lib.ts'); s = open(p).read()
assert 'sim-tune' not in s
a = "import { DL, dlVirt, dlTick, dlEnd } from './sim-droplog';"
assert a in s
s = s.replace(a, a + "\nimport './sim-tune'; // 默认关：SIM_TUNE_* 未设时不打任何补丁", 1)
open(p, 'w').write(s)
src = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tests', 'sim-tune.ts'); dst = os.path.join(wt, 'tests/sim-tune.ts')
if os.path.abspath(src) != os.path.abspath(dst): shutil.copy(src, dst)
print('ok', wt)
