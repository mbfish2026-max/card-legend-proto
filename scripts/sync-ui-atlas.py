#!/usr/bin/env python3
"""B0 UI 图集管线：把美术2 的最终图集/DOM 2x 图同步进 public，并从 slices.json 生成边距表。
来源（origin/art/ui-plan）：docs/ui-preview/atlas/ui_atlas.{png,webp,json}、docs/ui-preview/dom/2x/*@2x.png、docs/ui-preview/slices.json
输出：public/assets/ui/ui_atlas.*、public/assets/ui/dom/*@2x.png、src/data/ui-slices.ts（勿手改）。
美术换图集后重跑：python3 scripts/sync-ui-atlas.py（代码无需改）。"""
import json, shutil, glob, os
D = 'docs/ui-preview'; P = 'public/assets/ui'
os.makedirs(P + '/dom', exist_ok=True)
for e in ('png', 'json'): shutil.copy(f'{D}/atlas/ui_atlas.{e}', f'{P}/ui_atlas.{e}')
for f in sorted(glob.glob(f'{D}/dom/2x/*@2x.png')): shutil.copy(f, f'{P}/dom/' + os.path.basename(f))
sl = json.load(open(f'{D}/slices.json'))
keep = ('w', 'h', 'left', 'right', 'top', 'bottom', 'fixed', 'dom')
sl = {k: {f: v[f] for f in keep if f in v} for k, v in sorted(sl.items())}
open('src/data/ui-slices.ts', 'w').write('// 自动生成：scripts/sync-ui-atlas.py（来源 docs/ui-preview/slices.json），勿手改\nexport default ' + json.dumps(sl, ensure_ascii=False, indent=1) + ' as const;\n')
print(len(sl), 'slices;', len(glob.glob(f'{P}/dom/*.png')), 'dom 2x')
