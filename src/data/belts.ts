// 阶段2 腰带（7 条）。来源未查到；starter-cloth 起兽皮/铁/青铜挂默认档位掉落（BELT_PLAN），不上商店；不计套装件（无 set 字段，id 不用套装前缀）。
// 等级按需求单：兽皮15、铁22、青铜30（保守）、钢铁35、雷霆/烈焰/光芒45；数值全部[暂定]，烈焰/光芒腰带另标[待核]。图标为美术2 AI 生成（art/belt-icons d581c18），含 @2x。
import type { ItemDef } from '../combat/types';
const B = (id: string, name: string, req: number, equip: ItemDef['equip'], price: number, cls?: ItemDef['cls']): ItemDef => ({ id, name, icon: 'assets/items/' + id + '.png', slot: 'belt', equip, req, price, ...(cls ? { cls } : {}) });
export const BELT_ITEMS: Record<string, ItemDef> = {
  belt_hide: B('belt_hide', '兽皮腰带', 15, { def: 4, hp: 70 }, 30), // [暂定]
  belt_iron: B('belt_iron', '铁腰带', 22, { def: 6, hp: 110 }, 60), // [暂定]
  belt_bronze: B('belt_bronze', '青铜腰带', 30, { def: 9, hp: 160 }, 120), // [暂定] 等级取保守值
  belt_steel: B('belt_steel', '钢铁腰带', 35, { def: 11, hp: 200 }, 180), // [暂定]
  belt_leiting: B('belt_leiting', '雷霆腰带', 45, { atk: 3, def: 13, hp: 240 }, 700, ['warrior']), // [暂定]
  belt_lieyan: B('belt_lieyan', '烈焰腰带', 45, { mag: 4, def: 12, hp: 220 }, 700, ['mage']), // [暂定][待核]
  belt_guangmang: B('belt_guangmang', '光芒腰带', 45, { tao: 4, def: 13, hp: 240 }, 700, ['taoist']), // [暂定][待核]
};
/** 官方盘点：官方名/21cq id 未查到，official 先填「本作名（待核）」以保持名称映射唯一；数值[暂定] */
export const BELT_META = Object.fromEntries(Object.values(BELT_ITEMS).map(b => [b.id, { official: b.name + '（待核）', cq: 0, ...(b.cls ? { cls: b.cls } : {}), origin: 'realign' as const, note: `阶段2 腰带；需求 ${b.req}；数值[暂定]${/lieyan|guangmang/.test(b.id) ? '，[待核]' : ''}；starter-cloth 起挂默认档位掉落（BELT_PLAN）` }]));

/** feat/starter-cloth（gear-tiers P3/D6）：兽皮/铁/青铜腰带挂默认档位掉落（官方来源未查到 → REALIGN 段默认；普通怪 ×2）。
 * 源怪满足 需求 ≤ 怪等级+6（BOSS +8）且 怪等级 ≤ 需求+15。T1/T2 腰带仍空（D6）。 */
export const BELT_PLAN: Record<string, [string, number][]> = {
  belt_hide: [['centipede', 24], ['black_maggot', 24], ['boss_evil_pincer', 12]],
  belt_iron: [['woma_guard', 40], ['boss_lich', 20]],
  belt_bronze: [['hongmo_pig', 60], ['boss_zuma', 30]],
};
