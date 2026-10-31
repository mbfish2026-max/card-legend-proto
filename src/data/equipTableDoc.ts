// docs/equip-table.md 生成器（纯函数）。改装备数据后运行 `npm run gen:equip`；单测校验文档与数据一致。
import { ITEMS, SLOT_NAMES, STAT_NAMES } from './items';
import { EQUIP_META, ADAPT, TIER_REQ, NEED_CN, CQ, OffStats, Cls } from './equip-official';

const CLS_CN: Record<Cls, string> = { warrior: '战士', mage: '法师', taoist: '道士' };
const TIER_CN = { base: '普通', woma: '沃玛', zuma: '祖玛', chiyue: '赤月' } as const;
const ORDER = ['weapon', 'armor', 'helmet', 'necklace', 'ring', 'bracelet', 'boots'] as const;
const fmtOff = (o?: OffStats) => !o ? '未查到' : [o.atk && `攻${o.atk.join('-')}`, o.mag && `魔${o.mag.join('-')}`, o.tao && `道${o.tao.join('-')}`, o.def && `防${o.def.join('-')}`, o.mdef && `魔御${o.mdef.join('-')}`, o.extra].filter(Boolean).join(' ') || '—';
const fmtStats = (e: Record<string, number | undefined> = {}) => Object.entries(e).filter(([, v]) => v).map(([k, v]) => `${STAT_NAMES[k] ?? k}+${v}`).join(' ') || '—';

export function equipIds(): string[] { return Object.keys(ITEMS).filter(id => ITEMS[id].slot); }

export function renderEquipTable(): string {
  const ids = equipIds();
  const out: string[] = [];
  out.push('# 官方装备表 v1', '', '> 本文件由 `npm run gen:equip`（src/data/equipTableDoc.ts）生成，勿手改；`npm test` 校验与数据一致。', '');
  out.push('## 规则', '',
    `- 来源：21cq 热血传奇 1.76 物品库（每行「来源」链接）；沃玛/祖玛/赤月 职业归属：https://www.21cq.com/mir/Suit.aspx 、https://zhidao.baidu.com/question/56230124.html`,
    `- [适配] 系数（v1 新增件）：属性 = 官方区间中值 × 系数（攻×${ADAPT.atk}、魔/道×${ADAPT.mag}、防×${ADAPT.def}，四舍五入），生命 = 适配后防御×${ADAPT.hpPerDef}；魔御×${ADAPT.mdef}（#10 起回填，含存量件；不折算生命）；准确不换算（本作无此属性）；售价 = 官方出售价/100。`,
    `- 存量件（R18 及以前）数值保持不变（旧档与平衡），仅骨玉权杖 道术→魔法 修正。`,
    `- 本作门槛 = 需求等级 req。官方为等级需求 → 取官方值；官方为攻击力/魔法力/精神力 → [适配] 档次等级：沃玛 ${TIER_REQ.woma}、祖玛 ${TIER_REQ.zuma}、赤月 ${TIER_REQ.chiyue}、黑铁头盔 30。`,
    `- 职业：1.76 无硬职业锁，按官方需求类型推导（攻击力→战士、魔法力→法师、精神力→道士，等级需求→通用）；穿戴时校验（「职业不符」）。`,
    `- 套装计件：官方「相同款式不生效」（记忆套需两只不同款手镯/戒指，https://www.moon-soft.com/program/BBS/readelite593510.htm）→ 同 id 重复只计 1 件。1.76 沃玛/祖玛/赤月 为档次名，官方无套装加成数值（未查到），本作 SETS 加成为 [适配]。`,
    '');
  const counts = ORDER.map(s => `${SLOT_NAMES[s]} ${ids.filter(i => ITEMS[i].slot === s).length}`).join('，');
  out.push(`## 统计`, '', `共 ${ids.length} 件（${counts}）；存量 ${ids.filter(i => EQUIP_META[i]?.origin === 'r18').length}，v1 新增 ${ids.filter(i => EQUIP_META[i]?.origin === 'v1').length}。`, '');
  out.push('## 装备表', '', '| id | 名称 | 部位 | 档次 | 官方需求 | 本作 req | 职业 | 官方属性 | 本作属性 | 来源 |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const s of ORDER) for (const id of ids.filter(i => ITEMS[i].slot === s)) {
    const d = ITEMS[id], m = EQUIP_META[id];
    const need = m?.need ? `${NEED_CN[m.need.kind]} ${m.need.v}` : '未查到';
    const cls = d.cls?.length ? d.cls.map(c => CLS_CN[c]).join('/') : '通用';
    const src = m?.cq ? CQ(m.cq) : '自创';
    out.push(`| ${id} | ${d.name} | ${SLOT_NAMES[s]} | ${m?.tier ? TIER_CN[m.tier] : '—'} | ${m?.official === '自创' ? '自创' : need} | ${d.req} | ${cls} | ${m?.official === '自创' ? '自创' : fmtOff(m?.off)} | ${fmtStats(d.equip as any)} | ${src} |`);
  }
  out.push('', '## 去重盘点（存量 → 官方对应）', '', '| id | 本作名 | 官方对应 | 备注 |', '|---|---|---|---|');
  for (const id of ids.filter(i => EQUIP_META[i]?.origin === 'r18')) { const m = EQUIP_META[id]; out.push(`| ${id} | ${ITEMS[id].name} | ${m.official} | ${m.note ?? ''} |`); }
  out.push('');
  return out.join('\n');
}
