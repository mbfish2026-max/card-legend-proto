#!/usr/bin/env python3
"""drop-audit-full：只读。输入 da-items.json（npx tsx scripts/drop-audit-items.ts 导出）+ 21cq 物品页缓存目录，
输出 docs/drop-audit-full.csv 与逐件 Markdown 片段。用法：python3 scripts/drop-audit-full.py <items.json> <21cq缓存目录> <输出前缀>"""
import json, re, sys, csv, os
items = json.load(open(sys.argv[1])); C = sys.argv[2]; OUT = sys.argv[3]
names = json.load(open(os.path.join(C, 'names.json')))
URL = 'https://www.21cq.com/mir/View.aspx?id=%s'
ALIAS = {'万年树妖': '千年树妖', '兽人战士': '半兽人'}
NEEDK = {'level': '等级', 'atk': '攻击', 'mag': '魔法', 'tao': '道术'}
def page(i):
    f = os.path.join(C, f'{i}.html')
    if not os.path.exists(f) or os.path.getsize(f) < 5000: return None
    t = open(f, 'rb').read().decode('gb18030', 'ignore')
    n = re.search(r'selectable">([^<]+)</div>', t)
    return {'name': n.group(1).strip() if n else '', 'need': re.findall(r'需要([^：<]*)：(\d+)', t),
            'mobs': list(dict.fromkeys(re.findall(r'alt="([^"]+)" /></a>', t)))}
norm = lambda s: re.sub(r'\d+$', '', s)
rows, parsed = [], {}
for x in items:
    cq = x['cq'] or names.get(x['official']) or names.get(x['official'] + '(男)')
    if x['official'] == '自创': cq = None
    p = page(cq) if cq else None
    if p: parsed[x['id']] = {'cq': int(cq), **p}
    tags, note = [], []
    our = f"Lv{x['req']}" + (f"（{'/'.join(x['cls'])}）" if x['cls'] else '')
    mob_src = [s for s in x['src'] if not s.startswith('商店') and '副本补正' not in s]
    shop = [s for s in x['src'] if s.startswith('商店')]
    if x['official'] == '自创':
        tags = ['官方无此物（自创适配）']; off_need = '—'; off_src = '1.76 无此物品（21cq 物品索引按名未找到）'; link = ''
    elif not p:
        tags = ['未查到']; off_need = '未查到'; link = ''
        off_src = '未查到' + ('（仅取自 equip-official.ts EG_META：' + x['note'] + '）' if x['origin'] == 'eg' else '（仅取自 equip-official.ts）')
        if x['need']: off_need = f"{NEEDK[x['need']['kind']]}{x['need']['v']}（仅取自 equip-official.ts）"
    else:
        link = URL % cq
        off_need = '、'.join(f'{k}{v}' for k, v in p['need'] if k != '') or '未查到'
        lv = [int(v) for k, v in p['need'] if k == '等级']
        attr = [(k, int(v)) for k, v in p['need'] if k in ('攻击力', '魔法力', '精神力', '道术')]
        if lv and lv[0] != x['req']: tags.append('等级不符')
        if attr: note.append(f'官方为属性需求，本作按档位换算 Lv{x["req"]} [适配]')
        off_src = '、'.join(p['mobs']) or '（物品页无掉落怪物）'
        offn = {norm(m) for m in p['mobs']}
        bad = []
        for s in mob_src:
            mob = re.sub(r'\(BOSS\)', '', s.split('×')[1])
            if ALIAS.get(mob, mob) not in offn: bad.append(s)
        if bad:
            tags.append('地点不符')
            hj = [b for b in bad if re.match(r'(2[0-4])[^0-9]', b)]
            note.append(f'官方无此来源 {len(bad)} 处' + (f'（其中合击版 20–24 层 {len(hj)} 处为适配）' if hj else '') + '：' + '；'.join(bad[:6]) + ('…' if len(bad) > 6 else ''))
        if p['name'] and norm(p['name']).replace('(男)', '') != x['name']: note.append(f'名称：官方「{p["name"]}」本作「{x["name"]}」')
        if not tags: tags = ['一致']
    if not x['src']: note.append('本作当前无任何来源')
    if shop: note.append('商店来源未与官方逐店核对（towns.ts 自带出处注记）')
    rows.append({'id': x['id'], '名称': x['name'], '栏位': x['slot'], '套装': x['set'], '我方等级/需求': our,
                 '官方等级/需求': off_need, '官方来源': off_src, '我方来源': '；'.join(x['src']) or '无',
                 '标签': '+'.join(tags), '链接': link, '备注': '；'.join(note), '_origin': x['origin'], '_verified': bool(p)})
with open(OUT + '.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=[k for k in rows[0] if not k.startswith('_')], extrasaction='ignore'); w.writeheader(); w.writerows(rows)
json.dump(rows, open(OUT + '.rows.json', 'w'), ensure_ascii=False, indent=1)
json.dump(parsed, open(OUT + '.21cq.json', 'w'), ensure_ascii=False, indent=1)
# 逐件 Markdown（按套装/栏位分表）
SLOTN = {'weapon': '武器', 'armor': '衣服', 'helmet': '头盔', 'necklace': '项链', 'bracelet': '手镯', 'ring': '戒指', 'boots': '靴子'}
esc = lambda s: str(s).replace('|', '／').replace('\n', ' ')
groups = {}
for r in rows: groups.setdefault(('套装 ' + r['套装']) if r['套装'] else ('栏位 ' + SLOTN.get(r['栏位'], r['栏位'])), []).append(r)
md = []
for g in sorted(groups, key=lambda k: (k.startswith('套装'), k)):
    md.append(f'\n### {g}（{len(groups[g])} 件）\n\n| id | 名称 | 我方需求 | 官方需求 | 官方来源 | 我方来源 | 标签 | 链接 | 备注 |\n|---|---|---|---|---|---|---|---|---|')
    for r in groups[g]:
        src = r['我方来源']; src = src if len(src) < 400 else src[:400] + f'…（共 {src.count("；") + 1} 处，全文见 CSV）'
        off = r['官方来源']; off = off if len(off) < 300 else off[:300] + '…（全文见 CSV）'
        md.append('| ' + ' | '.join(esc(v) for v in [r['id'], r['名称'], r['我方等级/需求'], r['官方等级/需求'], off, src, r['标签'], r['链接'], r['备注']]) + ' |')
open(OUT + '.items.md', 'w').write('\n'.join(md) + '\n')
