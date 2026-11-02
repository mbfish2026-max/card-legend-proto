#!/usr/bin/env python3
"""只读：生成 docs/drop-realign.csv 与 drop-realign.md 的 B/C/H 表片段（不改游戏代码）。
输入：rl-dump.json（scripts/drop-realign-dump.ts 输出）、cq.json（21cq 抓取解析）、da-items.json（阶段1审计）。
用法：python3 scripts/drop-realign-plan.py DUMP CQ DA OUTDIR"""
import json, sys, re, csv, statistics
DUMP, CQ, DA, OUT = sys.argv[1:5]
d = json.load(open(DUMP)); cq = json.load(open(CQ)); da = {x['id']: x for x in json.load(open(DA))}
CQI = {int(k): v for k, v in cq['items'].items()}; CQM = cq['mobs']
# ---- 怪物：本作单位 → 最低出现层级 ----
ulv, ufl = {}, {}
for f in d['floors']:
    for u in f['units']:
        if u not in ulv or f['lv'] < ulv[u]: ulv[u] = f['lv']; ufl[u] = f
U = d['units']
ALIAS = {'千年树妖': '万年树妖', '半兽人': '兽人战士'}
def norm(n): n = re.sub(r'\d+$', '', n); return ALIAS.get(n, n)
name2u = {}
for k, v in U.items():
    if k in ulv: name2u.setdefault(v['name'], []).append(k)
for k, v in d['official'].items(): name2u.setdefault(v['name'], [])
# 官方怪页爆率 N（1/N）：OFFICIAL_DROPS raw ∪ 21cq 怪物页
offN = {}
for uid, v in d['official'].items():
    for nm, n in v.get('raw', []):
        if n > 0: offN[(norm(v['name']), re.sub(r'\((男|女)\)', '', nm))] = int(n)
for m in CQM.values():
    for nm, n in m['drops'].items(): offN.setdefault((norm(m['name']), re.sub(r'\((男|女)\)', '', nm)), int(n))
# ---- 曲线 ----
BANDS = [(1, 9, 16, 2, 30, 4),  # early-gear-3-5 ×2；表已按 docs/early-gear-3-5.md §3.2 手工同步，未重跑本脚本
          (10, 19, 10, 5, 100, 12), (20, 29, 15, 8, 150, 20), (30, 39, 25, 12, 250, 30), (40, 49, 40, 20, 400, 50), (50, 999, 40, 30, 600, 80)]
def band(req): return next(b for b in BANDS if b[0] <= req <= b[1])
def rate(req, boss, N):
    lo, hi, K, cap, flo, de = band(req)
    m = 1 if boss else 2
    cap, flo, de = cap * m, flo * m, de * m
    if N is None: return de, '未查到→段默认'
    den = max(cap, min(flo, round(N / K)))
    return den, f'官方1/{N}÷{K}'
X_N, X_B, OVER = 6, 8, 15
OFF_NAME = {'tao_sword': '银蛇', 'dragon_sword': '屠龙', 'armor': '重盔甲'}
SANSHENG = {'shengzhan': 'boss_twinhead_blood', 'fashen': 'boss_twinhead_kong', 'tianzun': 'boss_redmoon'}
D1 = {'魔杖': 26, '银蛇剑': 26, '骨玉权杖': 35, '青铜头盔': 10, '铁剑': 10, '逍遥扇': 35, '嗜魂法杖': 35, '破魂': 20, '重盔甲': 22, '金戒指': 22}
FIRST_LV = {}
def cands(names, req):
    out = []
    for n in names:
        for u in name2u.get(norm(n), []):
            if u in ulv: out.append(u)
    return sorted(set(out), key=lambda u: (ulv[u], u))
rows, changed = [], 0
for iid, it in d['items'].items():
    a = da.get(iid, {}); name = it['name']; req0 = it['req']
    req = D1.get(name, req0); need = a.get('need'); tags = []
    if name in D1 and D1[name] != req0: tags.append(f'D1 需求{req0}→{req}')
    if need and need.get('type') not in (None, '等级'): tags.append(f"D4 属性需求({need.get('type')}{need.get('value')})仅注释")
    cqid = a.get('cq') or 0; offn = OFF_NAME.get(iid, re.sub(r'剑$|法杖$|权杖$', '', name) if False else name)
    mobs = [m for m in (CQI[cqid]['mobs'] if cqid in CQI else []) if not m.startswith(('暗之', '宝箱'))]
    cs = cands(mobs, req); src = []
    selfmade = a.get('official') == '自创'
    if selfmade:
        oldu = [k for k in ulv if any(f"×{U[k]['name']}" in x and 'setDrop' not in x and '副本补正' not in x for x in a.get('src', []))]
        cs = sorted(set(oldu), key=lambda u: (ulv[u], u))
    win = [u for u in cs if ulv[u] >= req - (X_B if U[u]['tier'] == 'boss' else X_N) and ulv[u] <= req + OVER]
    nb = [u for u in win if U[u]['tier'] != 'boss'][:3]; bb = [u for u in win if U[u]['tier'] == 'boss'][:2]
    pick = nb + bb; note = ''
    if not pick and cs:
        ok = [u for u in cs if ulv[u] >= req - (X_B if U[u]['tier'] == 'boss' else X_N)]
        pick = ok[:2]; note = '仅高档怪有官方源，按物品档爆率' if pick else ''
    kind = '自创保留' if selfmade and pick else '官方'
    sset = (it.get('set') or '')
    for k, b in SANSHENG.items():
        if iid.startswith(k): pick = [b]; kind = 'D9 按职业'; note = ''
    if not pick:
        kind = '适配'
        lvmin = max(req - X_B, 40 if req >= 40 else 0)
        bs = sorted([u for u in ulv if U[u]['tier'] == 'boss' and lvmin <= ulv[u] <= req + OVER], key=lambda u: (ulv[u], u))
        old = [s for s in a.get('src', []) if '(BOSS)' in s]
        keep = [u for u in bs if any(U[u]['name'] in s for s in old)]
        pick = (keep or bs)[:2]
        if req >= 40 and kind == '适配': tags.append('D10 40+BOSS适配')
    if iid == 'armor' or iid == 'gold_ring':
        if 'orc_chief' not in pick: pick.append('orc_chief')
        tags.append('D3 兽人酋长保留(适配,违反X)')
    if a.get('official') == '自创': tags.append('自创保留(适配)')
    if a.get('tier') == 'eg40' and not cs and kind == '适配': tags.append('D12 EG未查到维持')
    srcs = []; plan = []
    for u in pick:
        boss = U[u]['tier'] == 'boss'
        N = offN.get((norm(U[u]['name']), OFF_NAME.get(iid, name))) or offN.get((norm(d['official'].get(u, {}).get('name', U[u]['name'])), OFF_NAME.get(iid, name)))
        den, why = rate(req, boss, N); plan.append([u, den])
        f = ufl[u]; srcs.append(f"{f['n']}{f['name']}L{ulv[u]}×{U[u]['name']}{'(BOSS)' if boss else ''}×1/{den}[{why}]")
    mech = [s for s in a.get('src', []) if 'setDrop' in s or '副本补正' in s]
    if mech: srcs.append(f'机制源保留×{len(mech)}(setDrop/副本补正)')
    old = a.get('src', [])
    oldset = {m for x in old for m in re.findall(r'×([^×]+?)(?:\(BOSS\))?×', x)}
    newset = {U[u]['name'] for u in pick}
    chg = []
    if req != req0: chg.append('需求')
    if oldset != newset: chg.append('来源')
    chg.append('爆率')
    rows.append(dict(id=iid, name=name, slot=it['slot'], cls='/'.join(it.get('cls') or []) or '通用', req_old=req0, req_new=req,
        official=a.get('official', ''), cq=cqid, tier=a.get('tier', ''), kind=kind, old_n=len(old),
        old_min=min([int(m) for s in old for m in re.findall(r'L(\d+)×', s)] or [0]), new_src=' ; '.join(srcs), change='+'.join(chg), tags=' ; '.join(tags), note=note, plan=plan))
PLAN = {r['id']: r.pop('plan') for r in rows}
json.dump(PLAN, open(f'{OUT}/plan.json', 'w'))
json.dump(rows, open(f'{OUT}/rows.json', 'w'), ensure_ascii=False, indent=0)
with open(f'{OUT}/drop-realign.csv', 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(len(rows), 'rows')
# ================= H/I：新增物品（仅提案，不进游戏代码） =================
SK = {'攻击': 'atk', '魔法': 'mag', '道术': 'tao', '防御': 'def', '魔御': 'mdef'}
def omax(v):
    a = [int(x) for x in re.findall(r'\d+', v)]; return max(a) if a else 0
kk = {}
for iid, it in d['items'].items():
    a = da.get(iid, {}); c = CQI.get(a.get('cq') or 0)
    if not c or a.get('official') == '自创': continue
    for cn, sk in SK.items():
        if cn in c['stats'] and omax(c['stats'][cn]) > 0 and it['equip'].get(sk):
            kk.setdefault((it['slot'], sk), []).append(it['equip'][sk] / omax(c['stats'][cn]))
K = {k: round(statistics.median(v), 2) for k, v in kk.items()}
SLOTK = {'项链': 'necklace', '手镯': 'bracelet', '戒指': 'ring'}
NEWC = [('金项链', '通用'), ('黑色水晶项链', '战'), ('黑檀项链', '法'), ('黄色水晶项链', '道'), ('魔鬼项链', '战'), ('琥珀项链', '法'), ('凤凰明珠', '道'), ('蓝翡翠项链', '战'),
        ('皮制手套', '通用'), ('钢手镯', '通用'), ('大手镯', '通用'), ('魔法手镯', '通用'), ('坚固手套', '通用'), ('黑檀手镯', '法'), ('道士手镯', '道'), ('魔力手镯', '战'), ('死神手套', '战'), ('金手镯', '通用'),
        ('六角戒指', '法'), ('玻璃戒指', '道'), ('牛角戒指', '战'), ('蓝色水晶戒指', '战'), ('黑色水晶戒指', '战'), ('蛇眼戒指', '法'), ('珍珠戒指', '道')]
by = {v['name']: v for v in CQI.values()}
newrows = []
def conv(slot, stats):
    out, drop, why = {}, [], []
    for cn, v in stats.items():
        if cn not in SK: drop.append(f'{cn}{v}'); continue
        sk = SK[cn]; k = K.get((slot, sk)) or K.get((slot, 'def' if sk in ('def', 'mdef') else 'atk')) or 1.0
        out[sk] = max(1, round(k * omax(v))); why.append(f'{cn}{v}×{k}')
    return out, drop, why
def srcs_for(names, req):
    cs = cands([m for m in names if not m.startswith(('暗之', '宝箱'))], req)
    win = [u for u in cs if ulv[u] >= req - (X_B if U[u]['tier'] == 'boss' else X_N) and ulv[u] <= req + OVER]
    pick = [u for u in win if U[u]['tier'] != 'boss'][:3] + [u for u in win if U[u]['tier'] == 'boss'][:2]
    kind = '官方'
    if not pick:
        kind = '适配'; pick = sorted([u for u in ulv if U[u]['tier'] == 'boss' and max(req - X_B, 48 if req >= 45 else 0) <= ulv[u] <= req + OVER and (req < 45 or U[u]['name'] in ('雷炎蛛王', '魔龙教主'))], key=lambda u: (ulv[u], u))[:2]
    out = []; plan = []
    for u in pick:
        boss = U[u]['tier'] == 'boss'; den, why = rate(req, boss, None); plan.append([u, den])
        out.append(f"{ufl[u]['n']}{ufl[u]['name']}L{ulv[u]}×{U[u]['name']}{'(BOSS)' if boss else ''}×1/{den}")
    return kind, out, plan
for nm, cl in NEWC:
    c = by[nm]; slot = SLOTK[c['type']]; req = int(c['need'][1])
    st, drop, why = conv(slot, c['stats']); kind, ss, pl = srcs_for(c['mobs'], req)
    newrows.append(dict(name=nm, slot=slot, cls=cl, req=req, official=' '.join(f'{k}{v}' for k, v in c['stats'].items()), ours=st, conv='；'.join(why) + ('；舍弃' + '/'.join(drop) + '(本作无此属性)' if drop else ''),
        price_off=c['price'], price=max(1, round(int(c['price']) / 100)), src_kind=kind, src=' ; '.join(ss), url=c['url'], plan=pl))
# 靴子/腰带：17173 + tayewan（1.76 21cq 无此类别 → 掉落/价格未查到）
BB = [('布鞋', 'boots', 15, '防御0-1 负重+3', {'def': 1}), ('鹿皮靴', 'boots', 22, '防御0-2 负重+4', {'def': 2}), ('紫绸靴', 'boots', 30, '防御0-3 负重+5', {'def': 3}), ('避魂靴', 'boots', 35, '防御1-3 负重+6', {'def': 3}),
      ('兽皮腰带', 'belt', 15, '防御0-1', {'def': 1}), ('铁腰带', 'belt', 22, '防御0-2', {'def': 2}), ('青铜腰带', 'belt', 30, '防御0-3（另有资料1-2+魔御0-1，有出入；G8 取保守值：防御上限 2、不加魔御）', {'def': 2}),
      ('钢铁腰带', 'belt', 35, '防御0-3 魔御0-1', {'def': 3, 'mdef': 1}), ('雷霆腰带', 'belt', 45, '需攻击45；防御2-3 魔御0-1 攻击1', {'def': 3, 'mdef': 1, 'atk': 1}),
      ('烈焰腰带', 'belt', 45, '需魔法30；数值未查到', None), ('光芒腰带', 'belt', 45, '需道术28；数值未查到', None)]
kb = K.get(('boots', 'def')) or 1.67
for nm, slot, req, off, base in BB:
    if base is None: base = {'def': 3, 'mdef': 1, ('mag' if nm.startswith('烈焰') else 'tao'): 1}; prov = '数值未查到，暂按雷霆腰带同档换职业属性（适配）'
    else: prov = f'防御类×{kb}（雷霆战靴折算系数）'
    st = {k: max(1, round(v * kb)) if k in ('def', 'mdef') else v for k, v in base.items()}
    st['hp'] = st['def'] * 8
    kind, ss, pl = srcs_for([], req)
    newrows.append(dict(name=nm, slot=slot, cls={'雷霆腰带': '战', '烈焰腰带': '法', '光芒腰带': '道'}.get(nm, '通用'), req=req, official=off, ours=st, conv=prov + '；hp=防御×8（沿用本作护甲 hp/def 比，适配）',
        price_off='未查到', price='未查到→暂按同档鞋/镯定价', src_kind='适配（1.76 掉落未查到）', src=' ; '.join(ss), url='https://mir.17173.com/0323/item4.htm', plan=pl))
json.dump(dict(K={f'{a}.{b}': v for (a, b), v in K.items()}, new=newrows), open(f'{OUT}/new.json', 'w'), ensure_ascii=False, indent=0)
print(len(newrows), 'new', K)

# ---- md 片段 ----
def md_b():
    L = ['| # | 物品 | 部位 | 职业 | 需求 旧→新 | 类型 | 变更 | 新来源（层/怪/爆率[依据]） | 标记 |', '|---|---|---|---|---|---|---|---|---|']
    for i, r in enumerate(sorted(rows, key=lambda r: (r['req_new'], r['slot'], r['name'])), 1):
        L.append(f"| {i} | {r['name']} | {r['slot']} | {r['cls']} | {r['req_old']}→{r['req_new']} | {r['kind']} | {r['change']} | {r['new_src'].replace(' ; ', '<br>')} | {r['tags']}{('；' + r['note']) if r['note'] else ''} |")
    return '\n'.join(L)
def md_new():
    L = ['| 物品 | 部位 | 职业 | 需求 | 官方属性 | 本作提案属性 | 折算依据 | 官方售价→本作 | 来源类型 | 提案来源（爆率） |', '|---|---|---|---|---|---|---|---|---|---|']
    for r in newrows:
        L.append(f"| {('[' + r['name'] + '](' + r['url'] + ')') if '21cq' in r['url'] else r['name'] + '¹'} | {r['slot']} | {r['cls']} | {r['req']} | {r['official']} | {' '.join(f'{k}{v}' for k, v in r['ours'].items())} | {r['conv']} | {r['price_off']}→{r['price']} | {r['src_kind']} | {r['src'].replace(' ; ', '<br>')} |")
    return '\n'.join(L)
open(f'{OUT}/B.md', 'w').write(md_b()); open(f'{OUT}/NEW.md', 'w').write(md_new())
