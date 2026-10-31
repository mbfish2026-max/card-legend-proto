import { CompanionState, migrateCompanion, companionGainExp, COMPANION_BAG, COMPANION_UNLOCK_LEVEL, newCompanion, feedHeart, heartFeedValue, HEART_STORE_MAX, RAGE_MAX, COMBO_LEVEL, COMBO_GOLD_BARS, BRM_BOOK, BOOK_PAGE, GOLD_BAR, PAGES_PER_BOOK, comboFor, HEART_ITEM, COMPANION_UNIT_ID, COMPANION_RECALL_CD, COMPANION_MODES, COMPANION_MODE_NAME, CompanionMode, companionStats, rageTick, unleash, canUnleash, comboEffect, COMBO_RANGE, pickPotion, COMPANION_POT_HP, COMPANION_POT_MP } from '../data/companion';
import { BOOKS, BookDef, BOOK_DROP, BOOK_RATES, STARTER, bookItemId } from '../data/books';
import { sortBag } from './bagSort';
// 纯逻辑世界模块（无 Phaser 依赖，可在 node 中单测）：职业/等级成长、分层横版地图、怪物 AI、
// 自动战斗与技能、召唤物、掉落/背包/装备/商店、死亡复活、存档序列化。
import { BattleEvent, EquipSlot, GroundItem, InvItem, Rarity, Slot, Stats, Team, Unit, UnitDef } from './types';
import { POTIONS } from '../data/skills';
import { CLASSES, ClassId, SkillDef, CAST_GAP } from '../data/classes';
import { ITEMS, SLOTS, SETS, equipSlotsFor, EQUIP_VERSION, ENHANCE_SLOTS, ENHANCE_MAX, ENHANCE_STAT, IRON_PRICE, IRON_MAX_PURITY, enhanceChance, shatterChance } from '../data/items';
import { HERO, ENEMIES, SUMMON, SUMMON_BEAST } from '../data/units';
import { EXP_PER_LEVEL, EXP_VERSION, migrateExp, scaledExp, fmtExp } from '../data/expCurve';
import { killExp, foeStatsAt } from '../data/balance';
import { WORLD, FLOORS, Floor, FARM_RESPAWN, FARM_SAFE_DIST, nextFloorOf, SIDE_FLOORS, DEPTH_STEP, prevLayerOf, prevFloorOf, floorWidth, OLD_MAP_W } from '../data/world';
/** 任务 A：待机怪离主角超过「半屏 + 2 屏」即休眠 */
export const SLEEP_DIST = 640 + 2 * 1280;
import { TOWNS, townFloors, townOfFloor, returnTownOf, STORAGE_SIZE, TOWN_W, TOWN_GATE_X, GATE_RANGE, TOWN_SPAWN_X, DOOR_RANGE, streetDoors } from '../data/towns';
import { CONSUMABLE } from '../data/items-town';
import { WOMA_FLOOR_NAME, WOMA_SECTIONS, WOMA_DOOR_X, HORN_MOB_CHANCE, HORN_MOBS, RING_MIN_LEVEL, RingQuest, ringReward, IDENT_MIN_LEVEL, IDENT_PRICE, IDENT_POOL, identValue } from '../data/r14b';
import { QUESTS, ACHIEVES, QuestDef, AchieveDef } from '../data/quests';

export const CRIT_CHANCE = 0.15, CRIT_MULT = 1.8;
export interface Input { dx: number; dy: number; use?: boolean; step?: number; /** false 时关闭自动普攻；缺省/true 保持原行为 */ autoAttack?: boolean }
export interface SaveData {
  v: 1; cls: ClassId; level: number; exp: number; gold: number; pots: number[];
  equip: Partial<Record<EquipSlot, InvItem>>; bag: InvItem[]; floorIndex: number; kills: number; nextUid: number;
  /** 技能修炼点（熟练度），按技能 id */
  skillTrain?: Record<string, number>;
  /** 地图：已到达的层（index）与已击杀的 BOSS（层 index） */
  reached?: number[]; bossKilled?: number[];
  /** 悬赏进度 / 已完成悬赏 / 已解锁成就 */
  questProg?: Record<string, number>; questDone?: string[]; achieves?: string[];
  /** R11 已学技能 id；缺省 = 旧存档（按等级视为全部已学） */
  learned?: string[];
  /** R11 地图顺序版本：缺省 = 旧顺序，读档时迁移层号 */
  mapV?: 2 | 3;
  /** 城镇返回：存档时所在城镇/新手村（缺省 = 旧档，保持在原层） */
  town?: string | null;
  /** R14 仓库物品 / 快捷栏技能顺序 */
  storage?: InvItem[]; skillOrder?: string[]; ringQ?: RingQuest | null; ringDone?: number;
  /** 合击版 #1 英雄（伙伴）；缺省 = 旧档/未领取 */
  companion?: CompanionState | null;
  /** 装备结构版本：缺省/1 = 单戒单镯旧档，2 = 双戒双镯 */
  eqV?: number;
  /** R22 经验曲线版本：缺省=1（旧线性），2=官方形状 */
  expV?: number;
}
/** R11 旧层号 → 新层号（按原版递进重排：兽人要塞提前到第 2 层） */
export const FLOOR_MIGRATE = [0, 2, 3, 1, 4, 5, 6, 7];
/** R13 新增 5 张地图后，mapV2 的 8 层层号 → mapV3 层号 */
export const FLOOR_MIGRATE_V3 = [0, 1, 2, 4, 5, 8, 9, 12];
/** 商店祝福油价格（较贵，每层限购 1） */
export const OIL_PRICE = 400;
export { IRON_PRICE } from '../data/items';
/** 新书接入（#11/#12 书）：无 learned 字段的旧档迁移时不白送这些技能（保持接入前行为） */
const LATE_BOOKS: Record<string, true> = { big_fireball: true, burst_fire: true, hell_fire: true, lightning_flash: true, hell_thunder: true, ghost_shield: true, holy_armor: true, mass_heal: true };
export type CastResult = { ok: true; targets: number[]; skill: string; kind: string } | { ok: false; reason: string };
/** R13 官方 BOSS 机制（来源见 docs/combat-official.md）：沃玛教主/祖玛教主/赤月恶魔由 bossStep 接管攻击 */
/**
 * #12 幽灵盾/神圣战甲术（docs/skills-official.md #12）：
 * 增益 官方（新浪 2003 实测）= 0~(2 + ⌊目标等级/7⌋) 加在上限；[适配] 取区间中值 ×3（同装备防/魔御系数）= round(1.5 × (2 + ⌊等级/7⌋))
 * 持续 官方（21cq 盛大火炬引擎）= 30 + 10×技能等级 + 5×道术下限 + 随机；[适配] 道术单值 ÷10 当下限、去随机：30 + 10×slv + 5×⌊道术/10⌋ 秒
 */
export const taoBuffValue = (level: number) => Math.round(1.5 * (2 + Math.floor(level / 7)));
export const taoBuffDur = (slv: number, tao: number) => 30 + 10 * Math.max(0, slv) + 5 * Math.floor(tao / 10);
/** 热血传奇 1.76 变异骷髅（召唤骷髅）官方成长，按技能等级 0–3：HP=(L×0.1+0.3)×60×L+60；攻击上限=(L×0.1+0.3)×3×L+25，下限 10。
 *  来源 https://www.21cq.com/chuanqi/325.html 、https://www.cqtieba.com/thread-19128-1-1.html ；防御 未查到 */
export const SKELETON_OFFICIAL = { hp: [60, 84, 120, 168, 228, 300, 384, 480], atkMin: 10, atkMax: [25, 26, 28, 30.4, 33.4, 37, 41.2, 46] };
/** 召唤物等级（0–7）：官方 宝宝最高 7 级、技能 3 级召出即 3 级、杀怪升级、每级名字颜色加深（https://zhidao.baidu.com/question/36876719.html 、https://www.21cq.com/chuanqi/554.html ）；
 *  4–7 级 HP 168/228/300/384/480 与上式一致，攻击上限按同式外推 [适配]。
 *  [适配] 升级按「召出后主角+召唤物总击杀数」（官方按击杀怪物等级总和，神兽 0→1 级需 600，各级阈值 未查到）；累计阈值见 SUMMON_LV_KILLS。 */
export const SUMMON_MAX_LV = 7;
export const SUMMON_LV_KILLS = [0, 10, 25, 45, 75, 115, 165, 225];
/** [适配] 名字颜色：0 级白（官方白名），1–7 级蓝色逐级加深 */
export const SUMMON_NAME_COLORS = ['#ffffff', '#a8d8ff', '#7cc0ff', '#4fa3ff', '#2f86f5', '#1f68e0', '#1a4cc4', '#1a33a6'];
/** [适配] 治愈术主角满血时治疗召唤物的范围：官方未查到，沿用群体治愈术 170px */
export const HEAL_SUMMON_RANGE = 170;
/** [适配] 自动施放召唤技能：已有召唤物且血量 ≥ 该比例时跳过（不耗魔、不占公共间隔）；低于则自动重召（= 回满血/替换）。手动不受限 */
export const AUTO_RESUMMON_HP = 0.5;
export const BOSS_MECH = new Set(['boss_woma', 'boss_zuma', 'boss_redmoon', 'boss_molong', 'boss_huangquan', 'boss_twinhead_kong', 'boss_twinhead_blood']);
/** M4：新 BOSS 复用已有机制（不新增机制）。黄泉教主=祖玛式火球+召唤（召唤骷髅系）；双头金刚=魔龙式近战+瞬移；双头血魔=沃玛式发呆/狂暴/瞬移/闪电 */
export const MECH_ALIAS: Record<string, string> = { boss_huangquan: 'boss_zuma', boss_twinhead_kong: 'boss_molong', boss_twinhead_blood: 'boss_woma' };
/** 召唤型 BOSS 的小怪池（按已召唤数轮换）；黄泉教主原版召唤骷髅弓箭手/长枪兵/刀斧手（本作未实装）→ [适配] 用已有骷髅系 */
export const MECH_MINIONS: Record<string, string[]> = { boss_zuma: ['zuma_statue', 'zuma_guard'], boss_huangquan: ['axe_skeleton', 'cave_skel_warrior'] };
/**
 * 诱惑之光（docs/skills-official.md「诱惑之光」）
 * 官方 C：可驯服等级 ≤ 法师等级+2 的生物系怪物；A：对高智商对手无效。资料站（17173）：宠物上限 Lv0..3 = 2/3/4/5。
 * [适配]：免疫名单（BOSS + 不死系/石像 + 沃玛/祖玛/赤月/虹魔系 + 人形法师）、成功率公式、叛变时间（资料站 6 小时 → 卡牌节奏 90+30×技能等级 秒）。
 */
export const CHARM = {
  levelGap: 2, maxPets: [2, 3, 4, 5],
  immune: new Set(['skeleton', 'zombie', 'blood_zombie', 'zuma_statue', 'zuma_guard', 'woma_warrior', 'woma_guard', 'darkmage', 'bull_mage', 'redmoon_spider', 'hongmo_pig', 'hongmo_scorpion']),
  /** [适配] 成功率：技能等级、人物与怪物等级差、怪物最大血量（因素来自资料站 21cq 文章，公式本作自拟） */
  chance: (slv: number, heroLv: number, mon: { level: number; maxHp: number }) => Math.max(0.05, Math.min(0.85, 0.3 + 0.1 * slv + 0.05 * (heroLv - mon.level) - Math.min(0.3, mon.maxHp / 4000))),
  duration: (slv: number) => 90 + 30 * slv,
};
/** R13 官方参数 */
export const OFFICIAL = {
  womaStages: [5, 4, 3, 2, 1], womaDaze: 8, womaCrazy: 8, womaCrazyInterval: 0.5, womaFlySec: 30,
  /** [适配] 祖玛教主召唤频率/上限未查到：每 12 秒最多唤醒 1 只，同时最多 2 只（F4 平衡取值） */
  zumaCallSec: 12, zumaCallMax: 2, zumaRange: 420,
  /** 赤月地刺：官方「每隔 2~3 秒」取 2.5；[适配] 预警 0.8 秒、判定半径 60px */
  spikeEvery: 2.5, spikeWarn: 0.8, spikeRadius: 60,
  /** 施毒：绿毒每 2.5 秒掉血、无视防御；红毒受伤 +20%；持续 = 道术×2 + 表值（秒） */
  /** 沃玛教主电火花：魔法伤害占比（官方 50%） */
  womaMagic: 0.5,
  poisonTick: 2.5, redAmp: 0.2, greenDur: [20, 27, 33, 40], redDur: [15, 20, 25, 30],
  /** 魔法盾 0–3 级减伤 */
  shieldReduce: [0.15, 0.3, 0.45, 0.6],
};
const ZERO: Stats = { hp: 0, mp: 0, atk: 0, mag: 0, tao: 0, def: 0, mdef: 0 };

/**
 * 防御结算（[适配] 卡牌化）：物理部分按防御、魔法部分按魔御（MAC）减免，各部分减免量按占比分摊：
 *   伤害 = Σ max(部分×20%, 部分 − 对应防御×defFactor×占比)；magic=0 与旧公式完全一致。
 */
export function mitigate(amount: number, def: number, mdef: number, magic = 0): number {
  const m = Math.max(0, Math.min(1, magic)), red = (a: number, d: number, w: number) => w <= 0 ? 0 : Math.max(a * w * 0.2, a * w - d * WORLD.defFactor * w);
  return red(amount, def, 1 - m) + red(amount, mdef, m);
}
export class World {
  units: Unit[] = []; events: BattleEvent[] = []; ground: GroundItem[] = [];
  /** 火墙等地面持续区：[适配] 落点灼烧 */
  zones: { x: number; until: number; dps: number; radius: number; tick: number; skill: string }[] = [];
  exp = 0; expNext: number; nextUid = 1; nextGid = 1; nextItem = 1; time = 0;
  pots = POTIONS.map(p => p.count); gold = 0;
  /** 背包（最多 WORLD.bagSize 格）与装备栏 */
  bag: InvItem[] = []; equip: Partial<Record<EquipSlot, InvItem>> = {};
  /** true：到达传送点后需按空格（Input.use）才切层；模拟/测试默认自动 */
  requireUse = false; atExit = false; private exitHintT = -99;
  floorIndex = 0; cleared = false; done = false; private sealedLogT = -99; private bagFullLogT = -99;
  kills = 0; deaths = 0;
  /** 额外掉落用的独立随机流（固定种子 LCG），与主 rng 隔离 */
  lootRng = (() => { let s = 0x2f6b1d; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); })();
  /** 商店祝福油：每层限购 1 瓶 */
  oilBoughtFloor = -1;
  /** 商店黑铁：每层限购次数（用尽后不可再买） */
  ironBoughtFloor = -1;
  ironBoughtCount = 0;
  /** 技能修炼点（官方等级要求/点数见 docs/skills-official.md） */
  skillTrain: Record<string, number> = {};
  reached = new Set<number>(); bossKilled = new Set<number>();
  questProg: Record<string, number> = {}; questDone = new Set<string>(); achieves = new Set<string>();
  /** R11 已学技能（新角色只有初始技能，其余用技能书学习） */
  learned = new Set<string>();
  get starter() { return STARTER[this.cls]; }
  /** 技能可用等级：初始技能 [适配] 1 级；其余按原版学习等级 */
  needLevel(s: SkillDef) { return s.id === this.starter ? 1 : (s.unlock ?? s.learn?.[0] ?? 1); }
  /** 技能等级 0..3：Lv k 需人物等级 ≥ learn[k] 且修炼点 ≥ train[k-1]（官方）；未学会返回 -1 */
  skillLevel(s: SkillDef): number {
    const learn = s.learn ?? [s.unlock ?? 1];
    if (!this.learned.has(s.id) || this.level < this.needLevel(s)) return -1;
    const pts = this.skillTrain[s.id] ?? 0; let lv = 0;
    for (let k = 1; k <= 3 && s.train; k++) if (this.level >= (learn[k] ?? 999) && pts >= s.train[k - 1]) lv = k; else break;
    return lv;
  }
  /** [适配] 修炼点获得：施放 +100，被动 +10（原版获得量未查到） */
  addTrain(s: SkillDef, n: number) {
    const before = this.skillLevel(s); this.skillTrain[s.id] = Math.min((this.skillTrain[s.id] ?? 0) + n, s.train?.[2] ?? 0);
    const after = this.skillLevel(s); if (after > before) { this.events.push({ type: 'log', text: `${s.name} 修炼到 ${after} 级` }); if (s.passive && this.hero) this.events.push({ type: 'proc', skill: s.id, target: this.hero.uid }); }
  }
  constructor(public rng: () => number = Math.random, public level = 1, public floors: Floor[] = FLOORS, public cls: ClassId = 'warrior', save?: SaveData) {
    if (save) {
      this.cls = save.cls; this.level = save.level; this.exp = migrateExp(save.level, save.exp, save.expV); this.gold = save.gold; this.pots = [...save.pots];
      this.equip = migrateEquip(save); this.bag = [...save.bag]; this.kills = save.kills; this.nextItem = save.nextUid;
      this.skillTrain = { ...(save.skillTrain ?? {}) }; this.reached = new Set(save.reached ?? []); this.bossKilled = new Set(save.bossKilled ?? []);
      this.questProg = { ...(save.questProg ?? {}) }; this.questDone = new Set(save.questDone ?? []); this.achieves = new Set(save.achieves ?? []);
      if (save.mapV !== 2 && save.mapV !== 3 && this.floors === FLOORS) {
        const m = (i: number) => FLOOR_MIGRATE[i] ?? i;
        save = { ...save, floorIndex: m(save.floorIndex) }; this.reached = new Set([...this.reached].map(m)); this.bossKilled = new Set([...this.bossKilled].map(m));
      }
      if (save.mapV !== 3 && this.floors === FLOORS) { // R13：旧 8 层存档层号迁移到 13 层
        const m = (i: number) => FLOOR_MIGRATE_V3[i] ?? i;
        save = { ...save, floorIndex: m(save.floorIndex ?? 0) }; this.reached = new Set([...this.reached].map(m)); this.bossKilled = new Set([...this.bossKilled].map(m));
      }
      // 旧存档兼容：已达到学习等级的技能视为已学
      this.storage = [...(save.storage ?? [])]; this.skillOrder = [...(save.skillOrder ?? [])]; this.ringQ = save.ringQ ?? null; this.ringDone = save.ringDone ?? 0; this.companion = migrateCompanion(save.companion);
      // #11：旧档推导排除尚无获取途径的新书技能（shop:false 且无掉落）
      this.learned = new Set(save.learned ?? this.skillPool.filter(s => this.level >= (s.unlock ?? s.learn?.[0] ?? 1) && !(s.id in LATE_BOOKS) && (!BOOKS[s.id] || BOOKS[s.id].shop || BOOKS[s.id].drops.length)).map(s => s.id));
    }
    this.learned.add(this.starter);
    this.expNext = EXP_PER_LEVEL(this.level);
    this.spawnHero();
    this.loadFloor(save ? Math.min(save.floorIndex, this.floors.length - 1) : 0);
    if (save?.town && TOWNS[save.town]) this.enterTown(save.town, true);
  }
  /** 新档：出生在新手村（银杏村） */
  startInVillage() { this.enterTown('xinshou', true); }
  /** 兼容旧接口：已拾取的装备（背包+身上） */
  get inventory() { return [...Object.values(this.equip), ...this.bag].filter((x): x is InvItem => !!x && !!x.slot); }
  get classDef() { return CLASSES[this.cls]; }
  /** 职业全部技能（含被动） */
  get skillPool(): SkillDef[] { return this.classDef.skills; }
  /** 快捷栏主动技能：去掉被动后按顺序重标 F1..Fn */
  get skills(): SkillDef[] {
    const ord = (id: string) => { const i = this.skillOrder.indexOf(id); return i < 0 ? 999 : i; };
    return this.skillPool.filter(s => !s.passive && this.learned.has(s.id)).map((s, i) => ({ s, i })).sort((a, b) => ord(a.s.id) - ord(b.s.id) || a.i - b.i).map(({ s }, i) => ({ ...s, key: `F${i + 1}` }));
  }
  get floor() { return this.floors[this.floorIndex]; }
  get exitX() { return this.mapW - WORLD.exitMargin; }
  /** 本层宽度（px，任务 A：按 Floor.widthScreens） */
  get mapW() { return floorWidth(this.floor); }
  get hero() { return this.units.find(u => u.isHero && u.alive); }
  /** 道士骷髅/神兽（不含诱惑之光宠物） */
  get summon() { return this.units.find(u => u.summon && !u.pet && u.alive); }
  /** 自动施放门槛 [适配]：射程内最近目标可驯服且成功率 ≥50% 才放（免疫/等级过高/满宠不浪费魔法） */
  charmAutoOk() {
    const s = this.skillPool.find(x => x.id === 'charm'), side = s ? this.rangedSide(s.range ?? 520) : null;
    if (side === null) return false; const c = this.charmCheck(this.queue(side)[0]); return c.res === 'ok' && c.p >= 0.3;
  }
  get pets() { return this.units.filter(u => u.pet && u.alive); }
  /** 诱惑之光判定（不消耗随机数）：immune / high / full / ok + 成功率 */
  charmCheck(t: Unit | undefined): { res: 'ok' | 'immune' | 'high' | 'full' | 'none'; p: number } {
    const s = this.skillPool.find(x => x.id === 'charm'); if (!t || !s) return { res: 'none', p: 0 };
    const slv = Math.max(0, this.skillLevel(s));
    if (t.tier === 'boss' || BOSS_MECH.has(t.id) || CHARM.immune.has(t.id) || t.boss) return { res: 'immune', p: 0 };
    if (t.level > this.level + CHARM.levelGap) return { res: 'high', p: 0 };
    if (this.pets.length >= CHARM.maxPets[Math.min(3, slv)]) return { res: 'full', p: 0 };
    return { res: 'ok', p: CHARM.chance(slv, this.level, t) };
  }
  /** [适配] 召唤物仇恨：怪被召唤物打过（aggroUid）且主角离怪 > summonAggroNear 时，返回该召唤物；否则 undefined（走原主角/50% 规则） */
  summonAggro(u: Unit): Unit | undefined {
    if (u.aggroUid === undefined || BOSS_MECH.has(u.id)) return undefined;
    const h = this.hero, sm = this.units.find(x => x.uid === u.aggroUid && x.alive);
    if (!sm || !h || Math.abs(u.x - h.x) <= WORLD.summonAggroNear) return undefined;
    return sm;
  }

  // ---------- 属性 ----------
  baseStats(lv = this.level): Stats {
    const c = this.classDef, l = lv - 1, r: any = {};
    for (const k of Object.keys(ZERO) as (keyof Stats)[]) r[k] = Math.round((c.base[k] ?? 0) + (c.grow[k] ?? 0) * l); // 魔御职业成长未查到 → 0
    return r;
  }
  equipStats(): Stats {
    const r = { ...ZERO };
    for (const it of Object.values(this.equip)) if (it) { for (const [k, v] of Object.entries(it.stats)) (r as any)[k] += v ?? 0; if (it.stats.mdef === undefined) r.mdef += this.itemMdef(it); }
    for (const b of this.setBonuses()) for (const [k, v] of Object.entries(b.stats)) (r as any)[k] += v ?? 0;
    for (const a of this.activeAchieves()) for (const [k, v] of Object.entries(a.bonus)) (r as any)[k] += v ?? 0;
    return r;
  }
  activeAchieves(): AchieveDef[] { return ACHIEVES.filter(a => this.achieves.has(a.id)); }
  /** 当前显示称号：取已解锁中 need 最高的一个 */
  title(): string | null {
    const list = this.activeAchieves(); if (!list.length) return null;
    return list.slice().sort((a, b) => b.need - a.need)[0].title;
  }
  /** 各套装已穿件数 */
  setCounts(): Record<string, number> {
    const c: Record<string, number> = {};
    // 官方规则：相同款式重复穿戴不重复计件（记忆套需不同款手镯/戒指）→ 按不同物品 id 计数
    const seen = new Set<string>();
    for (const it of Object.values(this.equip)) { const s = it && ITEMS[it.item]?.set; if (s && !seen.has(it!.item)) { seen.add(it!.item); c[s] = (c[s] ?? 0) + 1; } }
    return c;
  }
  /** 当前激活的套装加成 */
  setBonuses() { const c = this.setCounts(); return Object.values(SETS).flatMap(s => s.bonus.filter(b => (c[s.id] ?? 0) >= b.n)); }
  stats(): Stats { const b = this.baseStats(), e = this.equipStats(), r: any = {}; for (const k of Object.keys(ZERO)) r[k] = (b as any)[k] + (e as any)[k]; return r; }
  /** 旧档装备（存档 stats 无 mdef）：按物品定义 × 品质 × 强化 推导魔御，不改存档结构 */
  itemMdef(it: InvItem): number {
    const v = ITEMS[it.item]?.equip?.mdef; if (!v) return 0;
    const mul = 1 + (it.rarity === 'common' ? 0 : WORLD.affix[it.rarity]);
    return Math.round(v * mul * (1 + (it.enhance ?? 0) * ENHANCE_STAT));
  }
  recompute(fill = false) {
    const h = this.hero; if (!h) return;
    const s = this.stats();
    h.maxHp = s.hp; h.maxMp = s.mp; h.atk = s.atk; h.mag = s.mag; h.tao = s.tao; h.def = s.def; h.mdef = s.mdef; h.level = this.level;
    if (fill) { h.hp = h.maxHp; h.mp = h.maxMp; } else { h.hp = Math.max(1, Math.min(h.maxHp, Math.round(h.hp))); h.mp = Math.min(h.maxMp, h.mp ?? 0); }
  }
  /** 总幸运（装备 luck 之和；负数=诅咒） */
  luck(): number { let l = 0; for (const it of Object.values(this.equip)) l += it?.luck ?? 0; for (const b of this.setBonuses()) l += b.luck ?? 0; return l; }
  /** 伤害浮动：幸运越高越易打出上限（幸运≥9 必上限），诅咒越高越易打出下限 */
  roll(lo: number, span: number): number {
    const L = this.luck();
    if (L >= 9 || (L > 0 && this.rng() < L / 9)) return lo + span;
    if (L < 0 && this.rng() < Math.min(1, -L / 9)) return lo;
    return lo + this.rng() * span;
  }
  /** 使用背包里的祝福油（作用于当前武器） */
  useOil(bagIdx: number): string {
    const it = this.bag[bagIdx]; if (!it || it.item !== 'bless_oil') return '不是祝福油';
    const wpn = this.equip.weapon; if (!wpn) return '需要先装备武器';
    const L = wpn.luck ?? 0;
    if (L >= 7) return '武器幸运已达上限 7';
    this.bag.splice(bagIdx, 1); this.events.push({ type: 'inventory' });
    const r = this.rng();
    if (L < 0 || r < 1 - L * 0.12) { wpn.luck = L + 1; return L < 0 ? `诅咒减轻，武器幸运 ${wpn.luck}` : `武器幸运 +1（当前 ${wpn.luck}）`; }
    if (r > 0.9) { wpn.luck = L - 1; return `武器被诅咒了！幸运 ${wpn.luck}`; }
    return '祝福油没有效果';
  }
  /** 黑铁强化：消耗背包中的一块矿石，强化已装备的指定部位。失败扣材料，高等可能破碎（适配）。 */
  enhanceWithIron(bagIdx: number, slot: EquipSlot): string {
    const ore = this.bag[bagIdx]; if (!ore || ore.item !== 'black_iron') return '需要黑铁矿石';
    if (!ENHANCE_SLOTS.includes(slot as any)) return '该部位不能强化（首饰不可强化）';
    const it = this.equip[slot]; if (!it) return '该栏位没有装备';
    const cur = it.enhance ?? 0;
    if (cur >= ENHANCE_MAX) return `已达强化上限 +${ENHANCE_MAX}`;
    const purity = ore.purity ?? 1;
    if (!this.consumeIron(bagIdx)) return '需要黑铁矿石';
    const chance = enhanceChance(cur, purity);
    if (this.rng() < chance) {
      it.enhance = cur + 1; this.applyEnhanceStats(it); this.recompute(); this.checkAchieves();
      return `${it.name} 强化成功！（成功率 ${Math.round(chance * 100)}%）`;
    }
    const sc = shatterChance(cur);
    if (sc > 0 && this.rng() < sc) {
      delete this.equip[slot]; this.recompute();
      return `${it.name} 强化失败，装备破碎了！`;
    }
    return `${it.name} 强化失败（成功率 ${Math.round(chance * 100)}%，材料已消耗）`;
  }
  /** 提纯：两块同纯度黑铁 → 纯度+1（官方 100%）。返回新矿在背包的下标，或错误信息。 */
  refineIron(a: number, b: number): string {
    const ia = this.bag[a];
    if (!ia || ia.item !== 'black_iron') return '只能提纯黑铁矿石';
    const pa = ia.purity ?? 1;
    if (pa >= IRON_MAX_PURITY) return `纯度已达上限 ${IRON_MAX_PURITY}`;
    // 同一堆 qty>=2，或两格同纯度
    if (a === b || (b < 0 && (ia.qty ?? 1) >= 2)) {
      if ((ia.qty ?? 1) < 2) return '需要两块同纯度矿石';
      ia.qty = (ia.qty ?? 1) - 2;
      if (ia.qty <= 0) this.bag.splice(a, 1);
      this.addIron(pa + 1);
      return `提纯成功：黑铁矿石[+${pa + 1}]`;
    }
    const ib = this.bag[b];
    if (!ib || ib.item !== 'black_iron') return '只能提纯黑铁矿石';
    const pb = ib.purity ?? 1;
    if (pa !== pb) return '纯度必须相同';
    // 先消耗较高下标，避免错位
    const idxs = [a, b].sort((x, y) => y - x);
    for (const i of idxs) this.consumeIron(i);
    this.addIron(pa + 1);
    return `提纯成功：黑铁矿石[+${pa + 1}]`;
  }
  buyIron(): string | null {
    const LIM = 5;
    if (this.ironBoughtFloor === this.floorIndex && this.ironBoughtCount >= LIM) return `黑铁矿石每层限购 ${LIM} 块`;
    if (this.gold < IRON_PRICE) return `金币不足（需 ${IRON_PRICE}）`;
    const canStack = this.bag.some(x => x.item === 'black_iron' && (x.purity ?? 1) === 1);
    if (!canStack && this.bag.length >= WORLD.bagSize) return '背包已满';
    this.gold -= IRON_PRICE;
    if (this.ironBoughtFloor !== this.floorIndex) { this.ironBoughtFloor = this.floorIndex; this.ironBoughtCount = 0; }
    this.ironBoughtCount++;
    this.addIron(1);
    return null;
  }
  /** feat/bag-sort：整理背包（品质→等级降序，合并可叠加）；已穿装备不动 */
  sortBag(): void { const before = this.bag.length; const nb = sortBag(this.bag); if (nb.length <= Math.max(before, WORLD.bagSize)) this.bag = nb; this.events.push({ type: 'inventory' }); }
  /** 黑铁入包：同纯度堆叠 */
  addIron(purity = 1): boolean {
    purity = Math.max(1, Math.min(IRON_MAX_PURITY, purity));
    const exist = this.bag.find(x => x.item === 'black_iron' && (x.purity ?? 1) === purity);
    if (exist) { exist.qty = (exist.qty ?? 1) + 1; this.events.push({ type: 'inventory' }); return true; }
    if (this.bag.length >= WORLD.bagSize) return false;
    this.bag.push(this.makeItem('black_iron', 'common', { purity })); this.events.push({ type: 'inventory' }); return true;
  }
  /** 消耗一枚黑铁（堆叠减 1 或移除） */
  consumeIron(bagIdx: number): boolean {
    const ore = this.bag[bagIdx]; if (!ore || ore.item !== 'black_iron') return false;
    if ((ore.qty ?? 1) > 1) { ore.qty! -= 1; this.events.push({ type: 'inventory' }); return true; }
    this.bag.splice(bagIdx, 1); this.events.push({ type: 'inventory' }); return true;
  }
  onKillQuest(enemyId: string) {
    if (this.ringQ && this.ringQ.target === enemyId && this.ringQ.prog < this.ringQ.need && ++this.ringQ.prog >= this.ringQ.need) this.events.push({ type: 'log', text: `环式任务可交付（找老兵）`, color: 'green' });
    for (const q of QUESTS) {
      if (this.questDone.has(q.id) || q.target !== enemyId) continue;
      // 悬赏在对应层或已到达该层后可累计（适配：不强制人必须在该层）
      if (!this.reached.has(q.floor) && this.floorIndex !== q.floor) continue;
      const n = (this.questProg[q.id] ?? 0) + 1;
      this.questProg[q.id] = Math.min(n, q.need);
      if (n >= q.need) this.events.push({ type: 'log', text: `悬赏可交付：${q.name}`, color: 'green' });
    }
  }
  claimQuest(id: string): string {
    const q = QUESTS.find(x => x.id === id); if (!q) return '无此悬赏';
    if (this.questDone.has(id)) return '已完成';
    if ((this.questProg[id] ?? 0) < q.need) return `进度 ${(this.questProg[id] ?? 0)}/${q.need}`;
    const qe = scaledExp(q.exp, q.floor); this.questDone.add(id); this.gold += q.gold; this.gainExp(qe);
    this.checkAchieves(); this.events.push({ type: 'log', text: `完成悬赏 ${q.name}，获得 ${q.gold} 金 / ${fmtExp(qe)} 经验`, color: 'green' });
    return `完成 ${q.name}！+${q.gold} 金 +${fmtExp(qe)} 经验`;
  }
  checkAchieves() {
    const maxEnh = Math.max(0, ...Object.values(this.equip).map(it => it?.enhance ?? 0), ...this.bag.map(it => it.enhance ?? 0));
    const vals: Record<string, number> = {
      kills: this.kills, bosses: this.bossKilled.size, enhance: maxEnh,
      floors: this.reached.size, quests: this.questDone.size,
    };
    for (const a of ACHIEVES) {
      if (this.achieves.has(a.id)) continue;
      if ((vals[a.kind] ?? 0) >= a.need) {
        this.achieves.add(a.id); this.recompute();
        this.events.push({ type: 'log', text: `成就解锁：${a.name}（称号「${a.title}」）`, color: 'green' });
      }
    }
  }
  power(stat: 'atk' | 'mag' | 'tao') { const h = this.hero; return h ? (stat === 'atk' ? h.atk : stat === 'mag' ? h.mag ?? 0 : h.tao ?? 0) : 0; }
  skillScale() { return 1 + 0.02 * (this.level - 1); }

  spawnHero() {
    const c = this.classDef;
    const def: UnitDef = { ...HERO, name: c.name, art: c.art, atkInterval: c.atkInterval, card: { ...HERO.card!, bg: c.bg, artFacing: c.artFacing } };
    const h = this.spawn(def, 'ally', WORLD.heroStartX, 0, true);
    this.recompute(true);
    return h;
  }
  spawn(def: UnitDef, team: Team, x: number, y = 0, isHero = false): Unit {
    const u: Unit = { ...def, uid: this.nextUid++, team, x, y, maxHp: def.hp, maxMp: def.mp ?? 0, cd: isHero ? 0.3 : 0.6, alive: true, isHero,
      homeX: x, homeY: y, ai: 'idle', alertT: 0, facing: isHero ? 1 : -1, moving: false };
    if (isHero) u.level = this.level;
    this.units.push(u); return u;
  }
  loadFloor(i: number) { this.stepTarget = null; this.stepQueued = 0;
    this.floorIndex = i; this.cleared = false; this.womaPending = null; this.womaSec = -1; this.womaWarnAt = -99; this.ground = []; this.zones = []; this.farmQueue = []; this.reached.add(i); this.checkAchieves();
    this.units = this.units.filter(u => u.isHero || u.summon || u.companion); this.companionTarget = null;
    const h = this.hero; if (h) { h.x = WORLD.heroStartX; h.y = 0; h.facing = 1; }
    this.units.filter(u => u.summon).forEach((s, k) => { s.x = WORLD.heroStartX - 110 - k * 60; s.y = WORLD.summonLane; });
    const cu = this.companionUnit; if (cu) { cu.x = WORLD.heroStartX - 80; cu.y = WORLD.summonLane; }
    for (const sp of this.floor.spawns) {
      if (sp.id === 'boss_woma' && this.floor.name === WOMA_FLOOR_NAME) { this.womaPending = { x: sp.x, y: sp.y ?? 0 }; continue; } // R14 #14：教主之家需号角
      this.spawnFoe(sp.id, sp.x, sp.y ?? 0);
    }
    this.events.push({ type: 'floor', index: i, name: this.floor.name });
  }
  /** feat/maps-more：刷怪并按子层深度加成（官方第 d 层 攻/血 ×(1+DEPTH_STEP×(d−1))，原有层 depth 缺省=1 不变） */
  spawnFoe(id: string, x: number, y: number) { const u = this.spawn(ENEMIES[id], 'enemy', x, y), d = this.floor.depth ?? 1;
    const bs = this.floors === FLOORS ? foeStatsAt(id, this.floorIndex) : null; // balance-sys：按层目标等级生成面板（新手图豁免）
    if (bs) { u.level = bs.level; u.hp = u.maxHp = bs.hp; u.atk = bs.atk; u.def = bs.def; }
    else if (d > 1) { const k = 1 + DEPTH_STEP * (d - 1); u.hp = u.maxHp = Math.round(u.hp * k); u.atk = Math.round(u.atk * k); }
    return u; }
  /** 子层：返回同图群上一层（仅非战斗、已到达过该层时可用），出生在起点 */
  upLayer(): string { const p = prevLayerOf(this.floorIndex, this.floors); if (p < 0) return '没有上一层';
    if (this.town) return '城内不可用'; this.loadFloor(p); this.events.push({ type: 'log', text: `返回上一层：${this.floor.name}` }); return 'ok'; }
  /** 主角死亡后：损失部分金币，在本层起点满血复活，本层怪物重置 */
  respawn() { this.stepTarget = null; this.stepQueued = 0;
    if (this.hero) return;
    this.deaths++;
    this.gold = Math.floor(this.gold * (1 - WORLD.deathGoldLoss));
    this.units = [];
    this.spawnHero();
    this.loadFloor(this.floorIndex);
    this.events.push({ type: 'respawn' });
  }

  alive(team: Team) { return this.units.filter(u => u.alive && u.team === team); }
  gap(a: Unit, b: Unit) { return Math.abs(a.x - b.x) - (a.width + b.width) / 2; }
  inMelee(a: Unit, b: Unit) { return this.gap(a, b) <= Math.max(a.range, b.range) + 0.5; }
  /** 主角某一侧（1 右 / -1 左）的敌人，按距离排序：[0] 为前排 */
  queue(side: number) {
    const h = this.hero; if (!h) return [];
    return this.alive('enemy').filter(u => Math.sign(u.x - h.x || 1) === side).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x));
  }
  meleeSide(): number | null {
    const h = this.hero; if (!h) return null;
    for (const s of [h.facing, -h.facing]) { const f = this.queue(s)[0]; if (f && this.inMelee(h, f)) return s; }
    return null;
  }
  /** 远程目标：面向侧最近的前排（距离内），否则另一侧 */
  rangedSide(range: number): number | null {
    const h = this.hero; if (!h) return null;
    for (const s of [h.facing, -h.facing]) { const f = this.queue(s)[0]; if (f && this.gap(h, f) <= range) return s; }
    return null;
  }

  /**
   * magic = 魔法伤害占比（0 物理 / 1 魔法 / 0.5 沃玛教主混合）。官方：物理只算防御，魔法只算魔御（MAC）。
   * 物理部分 − 防御×defFactor，魔法部分 − 魔御×defFactor，各自保底 20%。ignoreDef（绿毒）两者都无视。
   */
  damage(target: Unit, amount: number, source?: Unit, canCrit = true, dot = false, ignoreDef = false, magic = 0) {
    if (!target.alive) return 0;
    const crit = canCrit && this.rng() < (source?.isHero ? this.critChance() : CRIT_CHANCE);
    if (crit) amount *= CRIT_MULT;
    if (!ignoreDef) { const up = (u?: number, v?: number) => u && u > this.time ? v ?? 0 : 0; amount = mitigate(amount, (target.def ?? 0) + up(target.defUpUntil, target.defUp), (target.mdef ?? target.def ?? 0) + up(target.mdefUpUntil, target.mdefUp), magic); }
    if (target.redUntil && target.redUntil > this.time) amount *= 1 + OFFICIAL.redAmp; // R13 红毒
    if (target.vulnUntil && target.vulnUntil > this.time) amount *= 1 + (target.vulnPhys ?? 0) * (1 - magic) + (target.vulnMag ?? 0) * magic; // 阶段 B 合击受伤加深 [适配]
    if (target.armorUntil && target.armorUntil > this.time) amount *= 1 - (target.armorReduce ?? 0.5);
    amount = Math.max(1, Math.round(amount));
    target.hp -= amount;
    if (target.team === 'enemy' && (source?.summon || source?.companion) && source.alive) target.aggroUid = source.uid; // 召唤物/英雄打一下即记仇
    if (target.team === 'enemy' && source?.isHero) this.heroTargetUid = target.uid; // 合击「同一目标」判定用（不耗随机数）
    if (target.team === 'enemy' && target.ai !== 'chase') { target.ai = 'chase'; this.events.push({ type: 'aggro', uid: target.uid }); }
    this.events.push({ type: 'damage', source: source?.uid, target: target.uid, amount, x: target.x, crit, dot });
    if (target.hp <= 0) this.kill(target);
    return amount;
  }
  heal(target: Unit, amount: number) {
    if (!target.alive) return;
    const a = Math.min(Math.round(amount), target.maxHp - target.hp);
    target.hp += a;
    this.events.push({ type: 'damage', target: target.uid, amount: a, x: target.x, heal: true });
  }
  makeItem(item: string, rarity: Rarity = 'common', opts?: { purity?: number; enhance?: number }): InvItem {
    const def = ITEMS[item], mul = 1 + (rarity === 'common' ? 0 : WORLD.affix[rarity]);
    const stats: Record<string, number> = {};
    for (const [k, v] of Object.entries(def.equip ?? {})) stats[k] = Math.round((v ?? 0) * mul);
    let name = def.name + (rarity === 'magic' ? '[精良]' : rarity === 'rare' ? '[极品]' : '');
    const it: InvItem = { uid: this.nextItem++, item, name, rarity, slot: def.slot, stats, req: def.req ?? 1, price: Math.round((def.price ?? 1) * mul) };
    if (item === 'black_iron') {
      it.purity = Math.max(1, Math.min(IRON_MAX_PURITY, opts?.purity ?? 1));
      it.qty = 1;
      it.name = `黑铁矿石[+${it.purity}]`;
      it.price = Math.round((def.price ?? 20) * it.purity);
    } else if (def.slot) {
      it.enhance = opts?.enhance ?? 0;
      this.applyEnhanceStats(it);
    }
    return it;
  }
  /** 按强化等级重算装备属性（基于物品定义 × 品质 × (1+enhance×8%)） */
  applyEnhanceStats(it: InvItem) {
    const def = ITEMS[it.item]; if (!def?.equip) return;
    const mul = 1 + (it.rarity === 'common' ? 0 : WORLD.affix[it.rarity]);
    const e = it.enhance ?? 0;
    const stats: Record<string, number> = {};
    for (const [k, v] of Object.entries(def.equip)) stats[k] = Math.round((v ?? 0) * mul * (1 + e * ENHANCE_STAT));
    it.stats = stats;
    const base = def.name + (it.rarity === 'magic' ? '[精良]' : it.rarity === 'rare' ? '[极品]' : '');
    it.name = e > 0 ? `${base} +${e}` : base;
  }
  rollDrop(item: string, forced: Rarity | undefined, x: number, y: number): GroundItem {
    const def = ITEMS[item];
    let rarity: Rarity = forced ?? 'common';
    if (!forced && def.slot) { const r = this.rng(); rarity = r < WORLD.rarityRoll.rare ? 'rare' : r < WORLD.rarityRoll.rare + WORLD.rarityRoll.magic ? 'magic' : 'common'; }
    const [g0, g1] = WORLD.goldAmount, amount = item === 'gold' ? Math.round((g0 + this.rng() * (g1 - g0)) * (1 + this.floorIndex * 0.6)) : 1;
    const inv = item === 'gold' || def.potion !== undefined ? undefined : this.makeItem(item, rarity);
    let name = inv?.name ?? def.name;
    if (item === 'gold') name = `金币×${amount}`;
    return { gid: this.nextGid++, item, name, rarity, x, y, landAt: this.time + WORLD.dropLandSec, atk: inv?.stats.atk ?? 0, hp: inv?.stats.hp ?? 0, amount, inv };
  }
  /** 召唤物等级 → 属性（相对初始等级按官方 HP/攻击上限比例放大）、名字「骷髅·3级」、名字颜色 */
  applySummonLv(u: Unit) {
    const b = u.sBase!, L = u.sLv ?? 0, O = SKELETON_OFFICIAL, r = u.maxHp > 0 ? u.hp / u.maxHp : 1;
    u.maxHp = u.hp = Math.round(b.hp * O.hp[L] / O.hp[b.start]); u.hp = Math.round(u.maxHp * r); u.atk = Math.round(b.atk * O.atkMax[L] / O.atkMax[b.start]);
    u.name = `${b.name}·${L}级`; u.nameColor = SUMMON_NAME_COLORS[L];
  }
  private summonKill() {
    for (const sm of this.units) if (sm.summon && sm.alive && sm.sBase) {
      sm.sKills = (sm.sKills ?? 0) + 1;
      while ((sm.sLv ?? 0) < SUMMON_MAX_LV && sm.sKills >= SUMMON_LV_KILLS[(sm.sLv ?? 0) + 1]) {
        sm.sLv = (sm.sLv ?? 0) + 1; this.applySummonLv(sm);
        this.events.push({ type: 'log', text: `${sm.sBase.name}升到 ${sm.sLv} 级`, color: 'green' });
      }
    }
  }
  kill(u: Unit) {
    u.hp = 0; u.alive = false;
    this.events.push({ type: 'death', uid: u.uid });
    if (u.companion) { this.onCompanionDeath(); return; }
    if (u.team !== 'enemy') return;
    this.kills++; this.summonKill();
    this.onKillQuest(u.id);
    this.checkAchieves();
    const entries = (u.drops ?? []).filter(d => this.rng() < d.chance);
    if (entries.length) {
      const items = entries.map(d => {
        const x = Math.max(40, Math.min(this.mapW - 40, u.x + (this.rng() - 0.5) * WORLD.dropSpread));
        const y = WORLD.laneMin + this.rng() * (WORLD.laneMax - WORLD.laneMin);
        return this.rollDrop(d.item, d.rarity, x, y);
      });
      this.ground.push(...items);
      this.events.push({ type: 'drop', uid: u.uid, x: u.x, y: u.y, items });
    }
    // 额外掉落：独立随机流 lootRng（不消耗主 rng，保持平衡模拟稳定）。Boss 必掉 1 瓶祝福油；setDrop 随机 1 件套装
    if (u.tier === 'boss') this.bossKilled.add(this.floorIndex);
    else if (this.floor?.farm && !u.summon) this.farmQueue.push({ id: u.id, x: u.homeX, y: u.homeY, at: this.time + FARM_RESPAWN });
    const extra: { id: string; purity?: number }[] = [];
    if (u.tier === 'boss' || this.lootRng() < (u.oilChance ?? 0)) extra.push({ id: 'bless_oil' });
    // R11 技能书掉落（本职业、未学、背包里也没有）
    { const pool = Object.values(BOOKS).filter(b => b.cls === this.cls && (u.id in BOOK_RATES ? (BOOK_RATES[u.id][b.skill] ?? 0) > 0 : b.drops.includes(u.id)) && !this.learned.has(b.skill) && !this.bag.some(x => x.item === bookItemId(b.skill)));
      // R13：有资料的怪逐本按资料爆率（1/N）独立判定；无资料的怪沿用 [适配] 首领/普通几率随机一本
      if (u.id in BOOK_RATES) { for (const b of pool) if (this.lootRng() < BOOK_RATES[u.id][b.skill]) { extra.push({ id: bookItemId(b.skill) }); break; } }
      else if (pool.length && this.lootRng() < (u.tier === 'boss' ? BOOK_DROP.boss : BOOK_DROP.normal)) extra.push({ id: bookItemId(pool[Math.floor(this.lootRng() * pool.length)].skill) }); }
    if (u.setDrop?.length && this.lootRng() < (u.setChance ?? 1)) { const own = u.setDrop.filter(id => ITEMS[id]?.cls?.includes(this.cls)), pool = own.length ? own : u.setDrop; extra.push({ id: pool[Math.floor(this.lootRng() * pool.length)] }); } // R14 #13：职业套优先掉本职业
    if (this.womaPending) { const has = this.bag.some(x => x.item === 'woma_horn') || this.ground.some(g => g.item === 'woma_horn');
      if (!has && HORN_MOBS.includes(u.id) && this.lootRng() < HORN_MOB_CHANCE) extra.push({ id: 'woma_horn' });
    } // R14 #14：号角 [适配] 8%；清怪保底见 womaTick
    // 黑铁：Boss 必掉 1 块纯度 1–3；普通怪 8% 掉纯度 1（lootRng，不影响平衡模拟主序列）
    if (u.tier === 'boss') extra.push({ id: 'black_iron', purity: 1 + Math.floor(this.lootRng() * 3) });
    else if (this.lootRng() < 0.05) extra.push({ id: 'black_iron', purity: 1 });
    if (extra.length) {
      const items = extra.map((e, i) => {
        const inv = this.makeItem(e.id, 'common', e.purity ? { purity: e.purity } : undefined);
        const x = Math.max(40, Math.min(this.mapW - 40, u.x + (i - (extra.length - 1) / 2) * 50));
        return { gid: this.nextGid++, item: e.id, name: inv.name, rarity: 'common' as const, x, y: 0, landAt: this.time + WORLD.dropLandSec, atk: inv.stats.atk ?? 0, hp: inv.stats.hp ?? 0, amount: 1, inv } as GroundItem;
      });
      this.ground.push(...items); this.events.push({ type: 'drop', uid: u.uid, x: u.x, y: u.y, items });
    }
    this.gainExp(killExp(u.id, this.floorIndex, this.level, u.level ?? 1)); // balance-sys：官方经验 × 层倍率 × 等级差衰减
    if (!this.alive('enemy').length && !this.cleared && !this.womaPending) { this.cleared = true; this.events.push({ type: 'cleared' }); }
  }
  gainExp(n: number) {
    if (this.companion?.out && companionGainExp(this.companion, n, this.level)) this.events.push({ type: 'log', text: `英雄 ${this.companion.name} 升到 ${this.companion.level} 级`, color: 'green' });
    this.exp += n; this.events.push({ type: 'exp', amount: n });
    let up = false;
    while (this.exp >= this.expNext) { this.exp -= this.expNext; this.level++; this.expNext = EXP_PER_LEVEL(this.level); up = true; this.events.push({ type: 'levelup', level: this.level }); }
    if (up) this.recompute(true);
  }
  pickup(g: GroundItem): boolean {
    const def = ITEMS[g.item];
    if (g.inv && this.bag.length >= WORLD.bagSize) {
      if (this.time - this.bagFullLogT > 3) { this.bagFullLogT = this.time; this.events.push({ type: 'log', text: '背包已满，无法拾取' }); }
      return false;
    }
    this.ground.splice(this.ground.indexOf(g), 1);
    if (g.item === 'gold') this.gold += g.amount;
    else if (def.potion !== undefined) this.pots[def.potion]++;
    else if (g.item === 'black_iron' && g.inv) {
      const pur = g.inv.purity ?? 1;
      const exist = this.bag.find(x => x.item === 'black_iron' && (x.purity ?? 1) === pur);
      if (exist) { exist.qty = (exist.qty ?? 1) + (g.inv.qty ?? 1); this.events.push({ type: 'inventory' }); }
      else this.bag.push(g.inv);
    }
    else if (g.inv) { this.bag.push(g.inv); this.events.push({ type: 'inventory' }); }
    this.events.push({ type: 'pickup', gid: g.gid, name: g.name, item: g.item });
    return true;
  }

  // ---------- 背包 / 装备 / 商店 ----------
  /** 物品应放入的穿戴位：指定 target 优先；否则同类空位优先，都满替换第一位 */
  targetSlot(it: InvItem, target?: EquipSlot): EquipSlot | null {
    if (!it.slot) return null; const c = equipSlotsFor(it.slot);
    if (target) return c.includes(target) ? target : null;
    return c.find(sl => !this.equip[sl]) ?? c[0];
  }
  equipItem(bagIdx: number, target?: EquipSlot): string | null {
    const it = this.bag[bagIdx]; if (!it) return '没有物品';
    if (!it.slot) return '该物品无法装备';
    if (this.level < it.req) return `需要等级 ${it.req}`;
    const cl = ITEMS[it.item]?.cls; if (cl?.length && !cl.includes(this.cls)) return '职业不符';
    const sl = this.targetSlot(it, target); if (!sl) return '部位不符';
    this.bag.splice(bagIdx, 1);
    const old = this.equip[sl]; if (old) this.bag.splice(bagIdx, 0, old);
    this.equip[sl] = it; this.recompute(); this.events.push({ type: 'inventory' });
    return null;
  }
  unequip(slot: EquipSlot): string | null {
    const it = this.equip[slot]; if (!it) return '该栏位为空';
    if (this.bag.length >= WORLD.bagSize) return '背包已满';
    delete this.equip[slot]; this.bag.push(it); this.recompute(); this.events.push({ type: 'inventory' });
    return null;
  }
  dropItem(bagIdx: number): InvItem | null { const [it] = this.bag.splice(bagIdx, 1); if (it) this.events.push({ type: 'inventory' }); return it ?? null; }
  sellItem(bagIdx: number): number { const it = this.bag[bagIdx]; if (!it) return 0; this.bag.splice(bagIdx, 1); this.gold += it.price; this.events.push({ type: 'inventory' }); return it.price; }
  buyPotion(i: number): string | null {
    const p = POTIONS[i]; if (!p) return '无效商品';
    if (this.gold < p.price) return '金币不足';
    this.gold -= p.price; this.pots[i]++; return null;
  }
  /** R11 书店：本职业 shop 书 */
  shopBooks(): BookDef[] { return Object.values(BOOKS).filter(b => b.cls === this.cls && b.shop); }
  buyBook(skill: string): string | null {
    const b = BOOKS[skill]; if (!b || !b.shop || b.cls !== this.cls) return '书店没有这本书';
    if (this.gold < b.price) return `金币不足（需 ${b.price}）`;
    if (this.bag.length >= WORLD.bagSize) return '背包已满';
    this.gold -= b.price; this.bag.push(this.makeItem(bookItemId(skill))); this.events.push({ type: 'inventory' }); return null;
  }
  /** 使用技能书：职业/等级/是否已学 校验；成功后技能出现在快捷栏 */
  learnBook(bagIdx: number): string {
    const it = this.bag[bagIdx], sid = it && ITEMS[it.item]?.book; if (!sid) return '这不是技能书';
    const s = this.skillPool.find(x => x.id === sid); if (!s) return '职业不符，无法学习';
    if (this.learned.has(sid)) return `已学会 ${s.name}`;
    const need = this.needLevel(s); if (this.level < need) return `${s.name} 需等级 ${need}`;
    this.bag.splice(bagIdx, 1); this.learned.add(sid);
    this.events.push({ type: 'inventory' }, { type: 'learned', skill: sid }, { type: 'log', text: `学会了 ${s.name}`, color: 'green' });
    return `学会了 ${s.name}`;
  }
  buyOil(): string | null {
    if (this.oilBoughtFloor === this.floorIndex) return '祝福油每层限购 1 瓶';
    if (this.gold < OIL_PRICE) return '金币不足';
    if (this.bag.length >= WORLD.bagSize) return '背包已满';
    this.gold -= OIL_PRICE; this.oilBoughtFloor = this.floorIndex; this.bag.push(this.makeItem('bless_oil')); this.events.push({ type: 'inventory' }); return null;
  }

  // ---------- 地图传送 ----------
  /** 传送规则：只能去已到达的层；不能是当前层；有敌人正在追击（战斗中）禁止；冷却 30 秒；花费 层号×20 金币 */
  teleportReadyAt = 0;
  static TELEPORT_CD = 30;
  teleportCost(i: number) { return (i + 1) * 20; }
  inCombat() { const h = this.hero; return !!h && this.alive('enemy').some(e => e.ai === 'chase'); }
  canTeleport(i: number): string | null {
    if (i < 0 || i >= this.floors.length) return '无此层';
    if (!this.reached.has(i)) return '尚未到达该层';
    if (i === this.floorIndex) return '已在该层';
    if (this.inCombat()) return '战斗中无法传送';
    if (this.time < this.teleportReadyAt) return `传送冷却中（${Math.ceil(this.teleportReadyAt - this.time)} 秒）`;
    if (this.gold < this.teleportCost(i)) return `金币不足（需 ${this.teleportCost(i)}）`;
    return null;
  }
  teleport(i: number): string | null {
    const r = this.canTeleport(i); if (r) return r;
    this.gold -= this.teleportCost(i); this.teleportReadyAt = this.time + World.TELEPORT_CD;
    this.loadFloor(i); this.events.push({ type: 'log', text: `传送到 ${this.floors[i].name}` }); return null;
  }

  // ---------- R14 城镇 / NPC / 仓库 ----------
  /** 当前所在城镇（null=野外）。城内为安全区：step 不结算战斗 */
  town: string | null = null;
  storage: InvItem[] = [];
  skillOrder: string[] = [];
  enterTown(t: string, free = false): string | null {
    if (!TOWNS[t]) return '无此城镇';
    if (this.town === t) return null;
    if (!free && this.inCombat()) return '战斗中无法回城';
    this.town = t; this.stepTarget = null; this.stepQueued = 0;
    const h = this.hero; if (h) { h.hp = h.maxHp; h.mp = h.maxMp; h.x = TOWN_SPAWN_X; h.y = WORLD.laneMin + (WORLD.laneMax - WORLD.laneMin) / 2; }
    // 横版长街：清掉野外怪物/地上物品（出城时重新刷层）
    this.units = this.units.filter(u => u.isHero || u.summon); this.ground = []; this.zones = [];
    this.events.push({ type: 'town', id: t });
    this.events.push({ type: 'log', text: `进入 ${TOWNS[t].name}（安全区）：左右走到店铺门口进店，西端城门出城` }); return null;
  }
  /** 长街：当前站在哪家店门口（null=不在门口） */
  nearDoor() { const h = this.hero; if (!this.town || !h) return null; return streetDoors(this.town).find(d => Math.abs(d.x - h.x) <= DOOR_RANGE) ?? null; }
  atTownGate() { const h = this.hero; return !!this.town && !!h && h.x <= TOWN_GATE_X + GATE_RANGE; }
  /** 出城：去指定层（需已到达或为 0 层），默认本城区域第一层 */
  leaveTown(f?: number): string | null {
    if (!this.town) return '不在城内';
    const fl = f ?? townFloors(this.town)[0];
    if (fl !== 0 && !this.reached.has(fl)) return '尚未到达该层';
    this.town = null; this.loadFloor(fl); this.events.push({ type: 'log', text: `出城：${this.floors[fl].name}` }); return null;
  }
  /** 城内传送员：去已到达的层（沿用传送费用/冷却） */
  townTeleport(i: number): string | null {
    if (!this.town) return '不在城内';
    if (!this.reached.has(i)) return '尚未到达该层';
    if (this.time < this.teleportReadyAt) return `传送冷却中（${Math.ceil(this.teleportReadyAt - this.time)} 秒）`;
    if (this.gold < this.teleportCost(i)) return `金币不足（需 ${this.teleportCost(i)}）`;
    this.gold -= this.teleportCost(i); this.teleportReadyAt = this.time + World.TELEPORT_CD; return this.leaveTown(i);
  }
  /** NPC 商品购买：只卖该 NPC 的 goods（商店装，不含首领掉落装） */
  buyGoods(npcId: string, item: string): string | null {
    const n = Object.values(TOWNS).flatMap(t => t.npcs).find(x => x.id === npcId), gd = n?.goods?.find(x => x.item === item);
    if (!gd) return '该 NPC 不卖此物';
    if (this.gold < gd.price) return `金币不足（需 ${gd.price}）`;
    if (this.bag.length >= WORLD.bagSize) return '背包已满';
    this.gold -= gd.price; this.bag.push(this.makeItem(item)); this.events.push({ type: 'inventory' }); return null;
  }
  deposit(bagIdx: number): string | null {
    const it = this.bag[bagIdx]; if (!it) return '无物品';
    if (this.storage.length >= STORAGE_SIZE) return '仓库已满';
    this.bag.splice(bagIdx, 1); this.storage.push(it); this.events.push({ type: 'inventory' }); return null;
  }
  withdraw(i: number): string | null {
    const it = this.storage[i]; if (!it) return '无物品';
    if (this.bag.length >= WORLD.bagSize) return '背包已满';
    this.storage.splice(i, 1); this.bag.push(it); this.events.push({ type: 'inventory' }); return null;
  }
  /** 背包消耗品：强效药/太阳水/回城卷/地牢逃脱卷 */
  useConsumable(bagIdx: number): string {
    const it = this.bag[bagIdx], c = it && CONSUMABLE[it.item]; if (!c) return '无法使用';
    if (c.town) {
      const t = c.town === 'bichi' ? 'bichi' : townOfFloor(this.floorIndex);
      if (this.town === t) return '已在城内';
      this.bag.splice(bagIdx, 1); this.enterTown(t, true); this.events.push({ type: 'inventory' }); return `使用 ${it.name}：回到 ${TOWNS[t].name}`;
    }
    const h = this.hero; if (!h) return '无法使用';
    this.bag.splice(bagIdx, 1);
    if (c.hp) h.hp = Math.min(h.maxHp, h.hp + c.hp);
    if (c.mp) h.mp = Math.min(h.maxMp, (h.mp ?? 0) + c.mp);
    this.events.push({ type: 'inventory' }); return `使用 ${it.name}`;
  }
  /** 技能页：快捷栏顺序（拖放/上下移） */
  moveSkill(id: string, to: number) {
    const ids = this.skills.map(s => s.id); const from = ids.indexOf(id); if (from < 0) return;
    ids.splice(from, 1); ids.splice(Math.max(0, Math.min(ids.length, to)), 0, id);
    this.skillOrder = ids; this.events.push({ type: 'learned', skill: id });
  }

  /** buff 持续秒数（#12 幽灵盾/神甲按道术；其余沿用 duration + durPerLv×等级） */
  buffDuration(s: SkillDef) { const slv = Math.max(0, this.skillLevel(s)); return s.buffStat ? taoBuffDur(slv, this.hero?.tao ?? 0) : (s.duration ?? 8) + (s.durPerLv ?? 0) * slv; }
  // ---------- 技能 ----------
  /** 自动施放轮转（feat/skill-cd-light）：从上次自动施放技能 last 的下一项开始扫描 list，冷却中/不满足条件（召唤物已存在、已中毒、诱惑门槛等）跳过，施放第一个成功的 */
  autoCast(list: string[], cds: number[], last = ''): { id: string; r: Extract<CastResult, { ok: true }> } | null {
    const st = Math.max(0, list.indexOf(last) + 1);
    for (let n = 0; n < list.length; n++) {
      const id = list[(st + n) % list.length], si = this.skills.findIndex(s => s.id === id);
      if (si < 0 || cds[si] > 0) continue;
      if (id === 'charm' && !this.charmAutoOk()) continue;
      const r = this.cast(si, cds, { auto: true });
      if (r.ok) return { id, r };
    }
    return null;
  }
  /** opts.auto：自动施法（施毒术跳过已中毒的怪，无未中毒目标则不施放）；手动释放不受限 */
  cast(i: number, cds: number[], opts: { auto?: boolean } = {}): CastResult {
    const s = this.skills[i], h = this.hero;
    if (!s || !h) return { ok: false, reason: '' };
    const need = this.needLevel(s);
    if (this.level < need) return { ok: false, reason: `${s.name} 需等级 ${need}` };
    if (s.passive) return { ok: false, reason: `${s.name} 为被动技能` };
    const slv = Math.max(0, this.skillLevel(s)), lvF = 1 + 0.1 * slv;
    if (cds[i] > 0) return { ok: false, reason: `${s.name} 冷却中（${cds[i].toFixed(1)}s）` };
    if ((h.mp ?? 0) < s.mana) return { ok: false, reason: '魔法值不足' };
    if (s.kind === 'summon' && opts.auto) {
      const ex = this.summon;
      if (ex && ex.hp >= ex.maxHp * AUTO_RESUMMON_HP) return { ok: false, reason: `${ex.name}已存在` };
    }
    let targets: Unit[] = [];
    if (s.kind === 'melee' || s.kind === 'pierce') {
      const side = this.meleeSide(); if (side === null) return { ok: false, reason: '没有可攻击的目标' };
      const q = this.queue(side); h.facing = side as 1 | -1;
      targets = s.kind === 'pierce' ? q.slice(0, s.pierce ?? 3) : [q[0]];
    } else if (s.kind === 'dot' && opts.auto) {
      // 自动施毒：射程内最近的未中毒（绿毒未结束 = 已中毒）敌人；全部已中毒 → 不施放、不耗蓝、不占公共间隔
      const t = this.alive('enemy').filter(e => (e.poisonUntil ?? 0) <= this.time && this.gap(h, e) <= (s.range ?? 500)).sort((a, b) => this.gap(h, a) - this.gap(h, b))[0];
      if (!t) return { ok: false, reason: '射程内敌人均已中毒' };
      h.facing = (t.x >= h.x ? 1 : -1); targets = [t];
    } else if (s.kind === 'ranged' || s.kind === 'dot' || s.kind === 'zone') {
      const side = this.rangedSide(s.range ?? 500); if (side === null) return { ok: false, reason: '射程内没有目标' };
      h.facing = side as 1 | -1; targets = [this.queue(side)[0]];
    } else if (s.kind === 'charm') {
      const side = this.rangedSide(s.range ?? 520); if (side === null) return { ok: false, reason: '射程内没有目标' };
      h.facing = side as 1 | -1; targets = [this.queue(side)[0]];
      if (this.charmCheck(targets[0]).res === 'full') return { ok: false, reason: '宠物数量已达上限' };
    } else if (s.kind === 'line') {
      // 地狱火/疾光电影：直线 [适配] 选边后命中该方向射程内全部敌人（穿透）
      const side = this.rangedSide(s.range ?? 500); if (side === null) return { ok: false, reason: '射程内没有目标' };
      h.facing = side as 1 | -1; targets = this.queue(side).filter(e => this.gap(h, e) <= (s.range ?? 500));
    } else if (s.kind === 'blast') {
      // 爆裂火焰：3×3 [适配] 以首个目标为中心，左右 splash 像素内敌人一并命中
      const side = this.rangedSide(s.range ?? 500); if (side === null) return { ok: false, reason: '射程内没有目标' };
      h.facing = side as 1 | -1; const t0 = this.queue(side)[0];
      targets = [t0, ...this.alive('enemy').filter(e => e !== t0 && Math.abs(e.x - t0.x) <= (s.splash ?? 170))];
    } else if (s.kind === 'aoe') {
      targets = this.alive('enemy').filter(e => Math.max(0, this.gap(h, e)) <= (s.range ?? 400));
      if (!targets.length) return { ok: false, reason: '范围内没有目标' };
    } else if (s.kind === 'rush') {
      // 冲撞：射程内选边，撞开等级低于自己的目标（官方）；[适配] 伤害
      const reach = s.range ?? 220;
      const side = this.rangedSide(reach); if (side === null) return { ok: false, reason: '没有可冲撞的目标' };
      h.facing = side as 1 | -1;
      targets = this.queue(side).filter(e => e.level < this.level && this.gap(h, e) <= reach).slice(0, 3);
      if (!targets.length) return { ok: false, reason: '附近没有等级低于自己的目标' };
    }
    if (s.kind === 'buff' && s.reduce && (h.armorUntil ?? 0) > this.time) return { ok: false, reason: `${s.name}持续中（官方：持续期间重复开启无效）` };
    if (s.buffStat && ((s.buffStat === 'def' ? h.defUpUntil : h.mdefUpUntil) ?? 0) > this.time) return { ok: false, reason: `${s.name}持续中（沿用魔法盾：持续期间重复开启无效）` };
    if (s.heal && !s.area) {
      // 治愈术：主角未满血 → 主角；主角满血 → 范围内血量比例最低的召唤物（[适配] 范围同群疗 170px，官方未查到）；都满 → 不施放、不耗蓝、不触发公共间隔
      if (h.hp < h.maxHp) targets = [h];
      else {
        const sm = this.units.filter(u => u.summon && u.alive && u.hp < u.maxHp && Math.abs(u.x - h.x) <= HEAL_SUMMON_RANGE).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (!sm) return { ok: false, reason: '主角与召唤物生命已满' };
        targets = [sm];
      }
    }
    if (s.area) targets = [h, ...this.units.filter(u => u.summon && u.alive && Math.abs(u.x - h.x) <= s.area!)];
    h.mp = (h.mp ?? 0) - s.mana; for (let j = 0; j < cds.length; j++) cds[j] = Math.max(cds[j], CAST_GAP); cds[i] = Math.max(cds[i], s.cooldown); // 公共施法间隔 0.8s + 本技能轻量冷却（手动/自动共用）
    this.events.push({ type: 'attack', source: h.uid, target: targets[0]?.uid ?? h.uid, skill: s.id });
    this.addTrain(s, 100);
    const pw = this.power(s.stat) * this.skillScale() * (s.lvMult ? 1 : lvF);
    const dur = (s.duration ?? 8) + (s.durPerLv ?? 0) * slv;
    if (s.kind === 'buff') {
      if (s.reduce) {
        h.armorUntil = this.time + dur; h.armorReduce = OFFICIAL.shieldReduce[Math.min(3, slv)];
        this.events.push({ type: 'log', text: `${s.name}：受到伤害降低 ${Math.round(h.armorReduce * 100)}%，持续 ${dur} 秒` });
      }
      if (s.buffStat) {
        // #12 官方说明「5×5 友方」；21cq 资料称宝宝不受益 → 只作用于主角
        const v = taoBuffValue(this.level), d = this.buffDuration(s);
        if (s.buffStat === 'def') { h.defUpUntil = this.time + d; h.defUp = v; } else { h.mdefUpUntil = this.time + d; h.mdefUp = v; }
        this.events.push({ type: 'log', text: `${s.name}：${s.buffStat === 'def' ? '防御' : '魔御'} +${v}，持续 ${d} 秒` });
      }
      if (s.heal) { if (s.area) for (const t of targets) this.heal(t, pw * s.heal); else this.heal(targets[0], pw * s.heal); }
    } else if (s.kind === 'summon') {
      const beast = s.id === 'summon_beast';
      const base = beast ? SUMMON_BEAST : SUMMON;
      const ex = this.summon;
      if (ex && ex.id === base.id) {
        this.heal(ex, ex.maxHp); this.events.push({ type: 'log', text: `${base.name}已存在：恢复其生命` });
      } else {
        if (ex) { ex.alive = false; this.events.push({ type: 'death', uid: ex.uid }); this.events.push({ type: 'log', text: `解散 ${ex.name}，召唤 ${base.name}` }); }
        const tao = h.tao ?? 0;
        // 骷髅 / 神兽：随道术与技能等级成长（C：神兽 1/2/3 级）
        const hp0 = beast ? 250 + tao * 7 : 140 + tao * 5;
        const atk0 = beast ? 14 + tao * 1.15 : SKELETON_OFFICIAL.atkMin + tao * 1.0;
        const def0 = beast ? 7 + this.level * 1.0 : 3 + this.level * 0.8;
        // [适配] 加强骷髅：按官方成长比例（相对 0 级）放大，HP ×1/1.4/2/2.8、攻击 ×(官方攻击上限/25)；基础攻击 8+道术×0.9 → 10+道术×1.0（10=官方下限）；神兽仍 ×(1+0.1×等级)
        const L = Math.min(3, slv), hpF = beast ? lvF : SKELETON_OFFICIAL.hp[L] / SKELETON_OFFICIAL.hp[0], atkF = beast ? lvF : SKELETON_OFFICIAL.atkMax[L] / SKELETON_OFFICIAL.atkMax[0];
        const def: UnitDef = { ...base, level: this.level + (beast ? slv : 0), hp: Math.round(hp0 * hpF), atk: Math.round(atk0 * atkF), def: Math.round(def0) };
        const u = this.spawn(def, 'ally', h.x - h.facing * 110, WORLD.summonLane); u.summon = true; u.facing = h.facing; u.ai = 'chase';
        // 召唤物等级：初始 = 技能等级（最高 3）；「重启」= 重新召唤从技能等级对应初始等级开始，不继承上一只已升等级
        u.sLv = L; u.sKills = 0; u.sBase = { hp: def.hp, atk: def.atk, start: L, name: base.name }; this.applySummonLv(u);
        this.events.push({ type: 'summon', uid: u.uid });
      }
    } else if (s.kind === 'charm') {
      const t = targets[0], c = this.charmCheck(t);
      if (c.res === 'immune') { this.events.push({ type: 'charm', uid: t.uid, result: 'immune' }, { type: 'log', text: `${t.name}免疫诱惑之光` }); }
      else if (c.res === 'high') { this.events.push({ type: 'charm', uid: t.uid, result: 'high' }, { type: 'log', text: `诱惑失败：${t.name}等级高于自身 ${CHARM.levelGap} 级以上` }); }
      else if (this.rng() < c.p) {
        Object.assign(t, { team: 'ally', summon: true, pet: true, petUntil: this.time + CHARM.duration(slv), ai: 'chase', y: WORLD.summonLane, boss: undefined, poisonUntil: 0, redUntil: 0, slowUntil: 0, facing: h.facing });
        this.events.push({ type: 'charm', uid: t.uid, result: 'ok' }, { type: 'log', text: `诱惑成功：${t.name}成为宠物（${CHARM.duration(slv)} 秒后叛变）`, color: 'green' });
      } else {
        if (t.ai !== 'chase') { t.ai = 'chase'; this.events.push({ type: 'aggro', uid: t.uid }); }
        this.events.push({ type: 'charm', uid: t.uid, result: 'fail' }, { type: 'log', text: `诱惑失败（成功率 ${Math.round(c.p * 100)}%）` });
      }
    } else if (s.kind === 'dot') {
      // R13 官方施毒：红绿毒同时施加（[适配] 本作不区分毒粉），无直接伤害；绿毒每 2.5 秒掉血且无视防御，红毒受伤 +20%
      const lv4 = Math.min(3, slv), tao2 = (h.tao ?? 0) * 2;
      for (const t of targets) {
        t.poisonUntil = this.time + tao2 + OFFICIAL.greenDur[lv4]; t.redUntil = this.time + tao2 + OFFICIAL.redDur[lv4];
        t.poisonDps = pw * (s.mult ?? 0.5); t.poisonTick = this.time + OFFICIAL.poisonTick;
        if (t.ai !== 'chase') { t.ai = 'chase'; this.events.push({ type: 'aggro', uid: t.uid }); }
      }
    } else if (s.kind === 'zone') {
      // 火墙：官方 2×2、等级延长燃烧时间；[适配] 落在目标脚下，半径约一格，每秒灼烧
      const t0 = targets[0];
      const dps = pw * (s.mult ?? 0.8);
      this.zones.push({ x: t0.x, until: this.time + dur, dps, radius: 160, tick: this.time + 0.5, skill: s.id });
      this.damage(t0, dps * 0.6, h, false, false, false, 1); // 落点瞬时轻伤（魔法）
      this.events.push({ type: 'log', text: `${s.name}：燃烧 ${dur} 秒` });
    } else if (s.kind === 'rush') {
      for (const t of targets) {
        t.x += h.facing * 150;
        t.x = Math.max(t.width / 2, Math.min(this.mapW - t.width / 2, t.x));
        this.damage(t, pw * (s.mult ?? 0.5) * this.roll(0.95, 0.1), h, true, false, false, s.stat === 'atk' ? 0 : 1);
      }
      this.events.push({ type: 'log', text: `${s.name}：撞开 ${targets.length} 个低等级目标` });
    } else {
      targets.forEach((t, j) => {
        // 战士剑法：官方各级倍率（刺杀/半月：主目标 100%，其余按倍率；烈火：主目标倍率）
        const m = s.lvMult ? (s.kind === 'pierce' ? (j === 0 ? 1 : s.lvMult[slv]) : s.lvMult[slv]) : (s.mult ?? 1);
        this.damage(t, pw * m * this.roll(0.95, 0.1), h, true, false, false, s.stat === 'atk' ? 0 : 1); // 魔法/道术技能 = 魔法伤害
        if (s.slow && t.alive) t.slowUntil = this.time + (s.duration ?? 3);
      });
    }
    return { ok: true, targets: targets.map(t => t.uid), skill: s.id, kind: s.kind };
  }
  usePotion(i: number): string | null {
    const p = POTIONS[i], h = this.hero;
    if (!p?.item || !h || this.pots[i] <= 0) return null;
    if ((p.hp && h.hp >= h.maxHp && !p.mp) || (p.mp && (h.mp ?? 0) >= h.maxMp && !p.hp)) return null;
    this.pots[i]--;
    if (p.hp) this.heal(h, p.hp);
    if (p.mp) h.mp = Math.min(h.maxMp, (h.mp ?? 0) + p.mp);
    return ITEMS[p.item].name;
  }

  // ---------- 存档 ----------
  // ===== 合击版 #1 英雄包裹：主角包裹 ↔ 英雄包裹（H5：物品须先放入英雄包裹） =====
  companion: CompanionState | null = null;
  giveToCompanion(bagIdx: number): string | null {
    const c = this.companion; if (!c) return '还没有英雄'; const it = this.bag[bagIdx]; if (!it) return '没有物品';
    if (c.bag.length >= COMPANION_BAG) return '英雄包裹已满'; this.bag.splice(bagIdx, 1); c.bag.push(it); this.events.push({ type: 'inventory' }); return null;
  }
  /** 合击版 #2：40 级免费领取英雄（一次） */
  recruitCompanion(cls: ClassId, name: string): string | null {
    if (this.companion) return '已有英雄'; if (this.level < COMPANION_UNLOCK_LEVEL) return `${COMPANION_UNLOCK_LEVEL} 级才能领取英雄`;
    if (!CLASSES[cls]) return '职业无效'; this.companion = newCompanion(cls, name); this.companion.out = true;
    this.events.push({ type: 'log', text: `获得英雄 ${this.companion.name}（${CLASSES[cls].name}）`, color: 'green' }, { type: 'inventory' }); return null;
  }
  /** 合击版 #5：背包物品喂火龙之心（须已装火龙之心；满储量不消耗） */
  feedCompanionHeart(bagIdx: number): string | null {
    const c = this.companion; if (!c) return '还没有英雄'; if (!c.equip.heart) return '英雄未装备火龙之心';
    const it = this.bag[bagIdx]; if (!it) return '没有物品'; if (!heartFeedValue(it.item)) return '该物品不能补充火龙之心';
    if (c.heartStore >= HEART_STORE_MAX) return '火龙之心已满'; const got = feedHeart(c, it.item);
    if ((it.qty ?? 1) > 1) it.qty!--; else this.bag.splice(bagIdx, 1);
    this.events.push({ type: 'log', text: `火龙之心 +${got}（${c.heartStore}/${HEART_STORE_MAX}）`, color: 'green' }, { type: 'inventory' }); return null;
  }
  /** 背包内某物品总数（含堆叠） */
  countItem(id: string): number { return this.bag.reduce((n, b) => n + (b.item === id ? b.qty ?? 1 : 0), 0); }
  private takeItems(id: string, n: number) { for (let i = this.bag.length - 1; i >= 0 && n > 0; i--) { const b = this.bag[i]; if (b.item !== id) continue; const q = b.qty ?? 1, k = Math.min(q, n); n -= k; if (q > k) b.qty = q - k; else this.bag.splice(i, 1); } }
  private makeSimple(id: string): InvItem { const d = ITEMS[id]; return { uid: this.nextItem++, item: id, name: d.name, rarity: 'common' as any, stats: {}, req: 0, price: d.price ?? 0 }; }
  /** 合击版 #7：龙人处 书页 → 白日门技能书 [适配] */
  craftBrmBook(): string | null {
    if (this.town !== 'bairimen') return '请到白日门找龙人'; if (this.countItem(BOOK_PAGE) < PAGES_PER_BOOK) return `需要书页 ×${PAGES_PER_BOOK}`;
    if (this.bag.length >= WORLD.bagSize) return '背包已满'; this.takeItems(BOOK_PAGE, PAGES_PER_BOOK); this.bag.push(this.makeSimple(BRM_BOOK)); this.events.push({ type: 'inventory' }); return null;
  }
  /** 合击版 #7：英雄 43 级 + 2 本白日门技能书 + 金条 2 → 学会合击、获得火龙之心（H1；秘籍双击学习简化为直接学会 [适配]） */
  learnCombo(): string | null {
    const c = this.companion; if (!c) return '还没有英雄'; if (this.town !== 'bairimen') return '请到白日门找龙人';
    if (c.level < COMBO_LEVEL) return `英雄需要 ${COMBO_LEVEL} 级`; const cb = comboFor(this.cls, c.cls)!;
    if (c.combo?.includes(cb.id)) return `已学会 ${cb.name}`;
    if (this.countItem(BRM_BOOK) < 2) return '需要白日门技能书 ×2'; if (this.countItem(GOLD_BAR) < COMBO_GOLD_BARS) return `需要金条 ×${COMBO_GOLD_BARS}`;
    this.takeItems(BRM_BOOK, 2); this.takeItems(GOLD_BAR, COMBO_GOLD_BARS); (c.combo ??= []).push(cb.id);
    if (!c.equip.heart) c.equip.heart = this.makeSimple(HEART_ITEM);
    this.events.push({ type: 'log', text: `英雄学会合击「${cb.name}」，获得火龙之心`, color: 'green' }, { type: 'inventory' }); return null;
  }
  takeFromCompanion(idx: number): string | null {
    const c = this.companion; if (!c) return '还没有英雄'; const it = c.bag[idx]; if (!it) return '没有物品';
    if (this.bag.length >= WORLD.bagSize) return '背包已满'; c.bag.splice(idx, 1); this.bag.push(it); this.events.push({ type: 'inventory' }); return null;
  }
  // ===== 合击版阶段 A：英雄战斗（A1 生成/AI、A2 召回、A3 用药、A4 怒气/合击） =====
  companionTarget: number | null = null;
  heroTargetUid: number | null = null;
  get companionUnit() { return this.units.find(u => u.companion && u.alive); }
  /** 官方：收回后 1 分钟内无法再次召唤（怀旧版专题 detail02）。剩余秒数（0 = 可召唤） */
  companionCooldown() { const c = this.companion; return c ? Math.max(0, Math.ceil(c.recallAt + COMPANION_RECALL_CD - this.time)) : 0; }
  private spawnCompanion(): Unit | undefined {
    const c = this.companion, h = this.hero; if (!c?.out || !h || this.town) return;
    const st = companionStats(c), cd = CLASSES[c.cls];
    const def: UnitDef = { ...HERO, id: COMPANION_UNIT_ID, name: c.name, art: cd.art, atkInterval: cd.atkInterval, hp: Math.max(1, st.hp), mp: st.mp, atk: st.atk,
      card: { ...HERO.card!, w: 130, h: 175, bg: cd.bg, artFacing: cd.artFacing } };
    const u = this.spawn(def, 'ally', h.x - h.facing * 80, WORLD.summonLane);
    Object.assign(u, { companion: true, level: c.level, mag: st.mag, tao: st.tao, def: st.def, mdef: st.mdef, mp: st.mp, maxMp: st.mp, facing: h.facing });
    this.events.push({ type: 'summon', uid: u.uid }); return u;
  }
  private despawnCompanion() { const u = this.companionUnit; if (u) { u.alive = false; this.units = this.units.filter(x => x !== u); this.events.push({ type: 'death', uid: u.uid }); } this.companionTarget = null; }
  /** 召唤/收回切换（官方按钮/快捷键同键切换）。返回错误文字或 null */
  toggleCompanion(): string | null {
    const c = this.companion; if (!c) return '还没有英雄';
    if (c.out) { c.out = false; c.recallAt = this.time; c.burst = false; this.despawnCompanion(); this.events.push({ type: 'log', text: `收回英雄 ${c.name}（${COMPANION_RECALL_CD} 秒内无法再次召唤）` }); return null; }
    const cdl = this.companionCooldown(); if (cdl > 0) return `英雄召唤冷却中（${cdl} 秒）`;
    c.out = true; this.spawnCompanion(); this.events.push({ type: 'log', text: `召唤英雄 ${c.name}（${COMPANION_MODE_NAME[c.mode]}）`, color: 'green' }); return null;
  }
  /** 官方 Ctrl+E：攻击 → 跟随 → 休息 循环 */
  cycleCompanionMode(m?: CompanionMode): string | null {
    const c = this.companion; if (!c) return '还没有英雄';
    c.mode = m ?? COMPANION_MODES[(COMPANION_MODES.indexOf(c.mode) + 1) % COMPANION_MODES.length];
    if (c.mode === 'rest') this.companionTarget = null;
    this.events.push({ type: 'log', text: `英雄状态：${COMPANION_MODE_NAME[c.mode]}` }); return null;
  }
  /** 官方 Ctrl+W：指定英雄攻击目标（本作：点击怪物卡） */
  setCompanionTarget(uid: number): string | null {
    const c = this.companion; if (!c?.out || !this.companionUnit) return '英雄未召唤';
    const t = this.units.find(u => u.uid === uid && u.alive && u.team === 'enemy'); if (!t) return '目标无效';
    if (c.mode === 'rest') return '英雄休息中';
    this.companionTarget = uid; this.events.push({ type: 'log', text: `英雄目标：${t.name}` }); return null;
  }
  /** 官方 Ctrl+S：怒槽满 → 进入爆发；之后同目标同范围自动放合击，怒气耗尽作废 */
  unleashCombo(): string | null {
    const c = this.companion; if (!c) return '还没有英雄'; if (!c.out || !this.companionUnit) return '英雄未召唤';
    if (!c.equip.heart) return '英雄未装备火龙之心'; if (c.burst) return '合击爆发中';
    if (c.rage < RAGE_MAX) return `怒气未满（${Math.floor(c.rage)}/${RAGE_MAX}）`;
    const cb = comboFor(this.cls, c.cls); if (!cb || !c.combo?.includes(cb.id)) return '尚未学会合击';
    if (!canUnleash(c) || !unleash(c)) return '无法爆发';
    this.events.push({ type: 'log', text: `怒气爆发！与英雄攻击同一目标释放「${cb.name}」`, color: 'green' }); return null;
  }
  private onCompanionDeath() {
    const c = this.companion; if (!c) return; c.out = false; c.recallAt = this.time; c.burst = false; this.companionTarget = null;
    this.events.push({ type: 'log', text: `英雄 ${c.name} 阵亡，${COMPANION_RECALL_CD} 秒后可再次召唤` });
  }
  private static POT_TABLE: Record<string, { hp?: number; mp?: number }> | null = null;
  private potTable() {
    if (!World.POT_TABLE) { const t: Record<string, { hp?: number; mp?: number }> = {}; for (const p of POTIONS) t[p.item] = { hp: p.hp, mp: p.mp };
      for (const [k, v] of Object.entries(CONSUMABLE)) if (!v.town && (v.hp || v.mp)) t[k] = { hp: v.hp, mp: v.mp }; World.POT_TABLE = t; }
    return World.POT_TABLE;
  }
  /** A3：英雄按需自动喝包裹药（阈值 [适配]），无药不喝 */
  companionPotions(u: Unit) {
    const c = this.companion!, tb = this.potTable();
    for (const need of ['hp', 'mp'] as const) {
      const low = need === 'hp' ? u.hp < u.maxHp * COMPANION_POT_HP : u.maxMp > 0 && (u.mp ?? 0) < u.maxMp * COMPANION_POT_MP; if (!low) continue;
      const i = pickPotion(c, need, tb); if (i < 0) continue; const it = c.bag[i], p = tb[it.item];
      if ((it.qty ?? 1) > 1) it.qty!--; else c.bag.splice(i, 1);
      if (p.hp) this.heal(u, p.hp); if (p.mp) u.mp = Math.min(u.maxMp, (u.mp ?? 0) + p.mp);
      this.events.push({ type: 'log', text: `英雄使用 ${it.name}` }, { type: 'inventory' });
    }
  }
  /** [适配] 法/道英雄施法距离、施法耗蓝 */
  static readonly COMPANION_CAST_RANGE = 300; static readonly COMPANION_CAST_MP = 8;
  companionStep(dt: number, h: Unit) {
    const c = this.companion!; let u = this.companionUnit;
    if (!u) u = this.spawnCompanion(); if (!u) return;
    u.mp = Math.min(u.maxMp, (u.mp ?? 0) + WORLD.mpRegen * dt);
    const fighting = this.alive('enemy').some(e => e.ai === 'chase');
    u.hp = Math.min(u.maxHp, u.hp + WORLD.hpRegen * (fighting ? 1 : 5) * dt);
    this.companionPotions(u);
    if (rageTick(c, dt) === 'expired') this.events.push({ type: 'log', text: '怒气耗尽，合击未释放（作废）' });
    const followX = h.x - h.facing * 80;
    if (c.mode === 'rest') { u.moving = false; return; } // 官方：休息 = 原地等待
    let tg = this.companionTarget !== null ? this.units.find(e => e.uid === this.companionTarget && e.alive) : undefined;
    if (!tg) this.companionTarget = null;
    // 官方：攻击 = 主动打选定目标或附近怪；跟随 = 一直跟随主号，受到攻击也不自己攻击（指定目标 Ctrl+W 仍执行 [适配]）
    if (!tg && c.mode === 'fight') tg = this.alive('enemy').filter(e => e.ai === 'chase' && Math.abs(e.x - h.x) < (e.aggroUid === u!.uid ? WORLD.leashRange : 700)).sort((a, b) => Math.abs(a.x - u!.x) - Math.abs(b.x - u!.x))[0];
    if (!tg) { if (Math.abs(followX - u.x) > 30) { u.facing = Math.sign(followX - u.x) as 1 | -1; this.toward(u, followX, WORLD.summonLane, this.companionSpeed(u, h), dt); } else u.moving = false; this.comboCheck(c, u, h); return; }
    const caster = c.cls !== 'warrior', side = Math.sign(tg.x - u.x) || 1; u.facing = side as 1 | -1;
    const inRange = caster ? this.gap(u, tg) <= World.COMPANION_CAST_RANGE : this.inMelee(u, tg);
    if (!inRange) this.toward(u, tg.x - side * ((u.width + tg.width) / 2 + (caster ? World.COMPANION_CAST_RANGE * 0.8 : 0)), WORLD.summonLane, this.companionSpeed(u, h), dt);
    else if (u.cd <= 0) {
      u.moving = false; u.cd = u.atkInterval;
      // [适配] 职业策略：战=近战普攻；法=火球（魔法）；道=主人 HP<50% 先治疗，否则灵魂火符（道术）；蓝不足退化为物理普攻
      const mpOk = (u.mp ?? 0) >= World.COMPANION_CAST_MP;
      if (c.cls === 'taoist' && mpOk && h.hp < h.maxHp * 0.5) { u.mp! -= World.COMPANION_CAST_MP; this.heal(h, (u.tao ?? 0) * 2 + 20); this.events.push({ type: 'log', text: `英雄 ${c.name} 治愈术` }); }
      else {
        this.events.push({ type: 'attack', source: u.uid, target: tg.uid });
        if (caster && mpOk) { u.mp! -= World.COMPANION_CAST_MP; this.damage(tg, (c.cls === 'mage' ? u.mag ?? 0 : u.tao ?? 0) * 1.2 * (0.9 + this.rng() * 0.2) + 5, u, true, false, false, 1); }
        else this.damage(tg, u.atk * (0.9 + this.rng() * 0.2), u);
      }
    }
    this.comboCheck(c, u, h);
  }
  /** 阶段 B 战士英雄修复 [适配]：离主人超过 COMBO_RANGE 时以主角速度追赶（原 baseSpeed×1.2 追不上奔跑的主角，近战英雄掉队→几乎不出手、合击永远不满足同范围） */
  private companionSpeed(u: Unit, h: Unit) { return Math.abs(u.x - h.x) > COMBO_RANGE ? Math.max(WORLD.heroSpeed, WORLD.baseSpeed * 1.2) : WORLD.baseSpeed * 1.2; }
  /** A4：爆发中 + 主人与英雄同一目标 + 双方都在 COMBO_RANGE 内 → 放合击（阶段 A 占位伤害），清空怒气 */
  private comboCheck(c: CompanionState, u: Unit, h: Unit) {
    if (!c.burst || this.heroTargetUid === null) return;
    const t = this.units.find(e => e.uid === this.heroTargetUid && e.alive && e.team === 'enemy'); if (!t) return;
    const ct = this.companionTarget ?? (c.mode === 'fight' ? t.uid : null); if (ct !== t.uid) return;
    if (this.gap(h, t) > COMBO_RANGE || this.gap(u, t) > COMBO_RANGE) return;
    const cb = comboFor(this.cls, c.cls), fx = comboEffect(cb?.id);
    const pw = (k: 'atk' | 'mag' | 'tao', x: Unit) => k === 'atk' ? x.atk : (x[k] ?? 0);
    const amt = (pw(this.classDef.autoStat as any, h) + pw(CLASSES[c.cls].autoStat as any, u)) * fx.mult;
    c.burst = false; c.rage = 0;
    const targets = fx.aoe > 0 ? this.alive('enemy').filter(e => e === t || Math.abs(e.x - t.x) <= fx.aoe) : [t];
    let dealt = 0; const affected: number[] = []; // 表现层用：本次被施加持续状态（毒/麻痹）的目标
    for (const e of targets) {
      const d = this.damage(e, amt, h, false, false, !!fx.ignoreDef, fx.magic); dealt += d;
      if (!e.alive) continue;
      if (fx.poison) { e.poisonUntil = this.time + fx.poison.dur; e.poisonDps = Math.max(1, Math.round(d * fx.poison.frac)); e.poisonTick = this.time + OFFICIAL.poisonTick; }
      if (fx.stun && e.tier !== 'boss') { e.stunUntil = this.time + fx.stun; e.cd = Math.max(e.cd, fx.stun); }
      if (fx.slow) e.slowUntil = this.time + fx.slow;
      if (fx.vuln) { e.vulnUntil = this.time + fx.vuln.dur; e.vulnPhys = fx.vuln.phys ?? 0; e.vulnMag = fx.vuln.mag ?? 0; }
      if (fx.poison || (fx.stun && e.tier !== 'boss')) affected.push(e.uid);
    }
    const statusUntil = fx.poison ? this.time + fx.poison.dur : fx.stun ? this.time + fx.stun : undefined;
    if (fx.lifesteal && h.alive) this.heal(h, Math.round(dealt * fx.lifesteal));
    this.events.push({ type: 'combo', id: cb?.id ?? 'placeholder', name: cb?.name ?? '合击', source: h.uid, partner: u.uid, target: t.uid, amount: dealt, hits: targets.length, affected, statusUntil }, { type: 'log', text: `合击「${cb?.name ?? '合击'}」造成 ${dealt} 伤害`, color: 'green' });
  }
  toSave(): SaveData {
    return { v: 1, cls: this.cls, level: this.level, exp: this.exp, gold: this.gold, pots: [...this.pots], equip: { ...this.equip }, bag: [...this.bag], floorIndex: this.floorIndex, town: this.town, kills: this.kills, nextUid: this.nextItem, skillTrain: { ...this.skillTrain }, reached: [...this.reached], bossKilled: [...this.bossKilled], questProg: { ...this.questProg }, questDone: [...this.questDone], achieves: [...this.achieves], learned: [...this.learned], mapV: 3, storage: [...this.storage], skillOrder: [...this.skillOrder], ringQ: this.ringQ, ringDone: this.ringDone, eqV: EQUIP_VERSION, expV: EXP_VERSION, companion: this.companion ? JSON.parse(JSON.stringify(this.companion)) : null  };
  }

  /** 点按一格：滑行中的按键全部排队（同向最多 10 格，反向则替换队列），每次按键都会走一格 */
  stepTarget: number | null = null; stepQueued = 0; stepAge = 0;
  queueStep(d: number) { const h = this.hero; if (!h || !d) return; if (this.stepTarget === null) { this.stepAge = 0; this.stepTarget = h.x + Math.sign(d) * WORLD.stepPx; } else { const sd = Math.sign(d); this.stepQueued = Math.sign(this.stepQueued) === sd ? Math.min(10, Math.abs(this.stepQueued) + 1) * sd : (Math.sign(this.stepTarget - h.x) === sd ? sd : sd); } }
  private moveHero(h: Unit, inp: Input, dt: number) {
    if (inp.step) this.queueStep(inp.step);
    let speed = WORLD.heroSpeed, sdx = 0;
    if (!inp.dx && this.stepTarget !== null) { sdx = Math.sign(this.stepTarget - h.x); speed = WORLD.stepPx / WORLD.stepSec; speed = Math.min(speed, Math.abs(this.stepTarget - h.x) / dt); }
    const dx = Math.sign(inp.dx) || sdx, dy = Math.sign(inp.dy); const x0 = h.x;
    h.moving = !!(dx || dy);
    if (dx) {
      // 后退：附近有怪在身后（与移动方向相反）时保持面向怪物，速度不变
      const near = this.alive('enemy').filter(u => Math.abs(u.x - h.x) <= WORLD.aggroRange).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0];
      h.facing = (near && Math.sign(near.x - h.x) === -dx ? -dx : dx) as 1 | -1;
      let nx = h.x + dx * speed * dt;
      // 接触帧对齐：本帧从“未接战”跨入怪物卡牌时停在近战贴脸位置（下一帧继续按住即可穿过），避免高速一帧冲进怪堆
      const f = this.queue(dx)[0];
      if (f) { const reach = (h.width + f.width) / 2 + Math.max(h.range, f.range); const d0 = Math.abs(f.x - h.x), d1 = Math.abs(f.x - nx); if (d0 > reach + 0.5 && d1 < reach) nx = f.x - dx * reach; }
      // 可直接穿过怪物卡牌（不阻挡、不推开）；穿到怪身后后，怪会转身/跳跃追到新的一侧
      h.x = Math.max(h.width / 2, Math.min(this.mapW - h.width / 2, nx));
    }
    if (this.stepTarget !== null) this.stepAge += dt;
    // 超时保险：补间被打断/卡住（如被暂停、帧率抖动）也必定释放，不会永久 busy
    if (this.stepTarget !== null && (this.stepAge > WORLD.stepSec * 3 || inp.dx || !sdx || Math.abs(h.x - this.stepTarget) < 0.5 || h.x === x0)) {
      this.stepTarget = null; // 到达 / 被地图边界挡住：结束本格
      if (this.stepQueued) { const sd = Math.sign(this.stepQueued); this.stepTarget = h.x + sd * WORLD.stepPx; this.stepQueued -= sd; this.stepAge = 0; }
    }
    if (dy) h.y = Math.max(WORLD.laneMin, Math.min(WORLD.laneMax, h.y + dy * WORLD.heroLaneSpeed * dt));
  }
  private toward(u: Unit, tx: number, ty: number, speed: number, dt: number) {
    const d = Math.hypot(tx - u.x, ty - u.y); u.moving = d > 0.5;
    if (d <= speed * dt) { u.x = tx; u.y = ty; return true; }
    u.x += (tx - u.x) / d * speed * dt; u.y += (ty - u.y) / d * speed * dt; return false;
  }
  /** [适配] 基本剑术/精神力战法准确 → 暴击率加成（官方准确数值 / 100） */
  critChance() {
    let c = CRIT_CHANCE;
    for (const s of this.skillPool) {
      if (!s.passive || !s.accBonus) continue;
      const lv = this.skillLevel(s); if (lv < 0) continue;
      c += (s.accBonus[lv] ?? 0) / 100;
      this.addTrain(s, 1); // 被动微弱修炼；[适配] 原版获得量未查到
    }
    return c;
  }
  private autoDamage(h: Unit) { const c = this.classDef; return h.atk + (c.autoStat === 'atk' ? 0 : this.power(c.autoStat) * 0.6); }

  // ===== R14 #14 沃玛寺庙多层 =====
  womaPending: { x: number; y: number } | null = null; womaSec = -1; womaWarnAt = -99;
  womaSection() { const h = this.hero; if (!h || this.floor.name !== WOMA_FLOOR_NAME) return null; const k = this.mapW / OLD_MAP_W; return WOMA_SECTIONS.findIndex(s => h.x < s.until * k); }
  /** 教主之家门口：按层宽等比（任务 A 层变长后门仍在原相对位置，门后无小怪） */
  get womaDoorX() { return WOMA_DOOR_X * this.mapW / OLD_MAP_W; }
  womaTick() {
    const h = this.hero; if (!h || this.town || this.floor.name !== WOMA_FLOOR_NAME) return;
    const sec = this.womaSection()!; if (sec !== this.womaSec) { this.womaSec = sec; this.events.push({ type: 'log', text: `进入 ${WOMA_SECTIONS[sec].name}`, color: 'green' }); }
    if (!this.womaPending) return;
    let k = this.bag.findIndex(x => x.item === 'woma_horn');
    if (k < 0 && !this.alive('enemy').some(u => u.x < this.womaDoorX)) { this.ground = this.ground.filter(g => g.item !== 'woma_horn'); this.bag.push(this.makeItem('woma_horn')); k = this.bag.length - 1; this.events.push({ type: 'log', text: '获得沃玛号角（清怪保底）', color: 'green' }); } // [适配] 背包满也给
    if (h.x < this.womaDoorX - h.width / 2) return;
    if (k < 0) { h.x = this.womaDoorX - h.width / 2 - 1; if (this.time - this.womaWarnAt > 3) { this.womaWarnAt = this.time; this.events.push({ type: 'log', text: '教主之家大门紧闭：需要沃玛号角（沃玛战士/卫士掉落）', color: 'white' }); } return; }
    this.bag.splice(k, 1); const p = this.womaPending; this.womaPending = null;
    this.spawn(ENEMIES.boss_woma, 'enemy', p.x, p.y); this.events.push({ type: 'log', text: '吹响沃玛号角，教主之家大门打开，沃玛教主现身！', color: 'green' }, { type: 'inventory' });
  }
  // ===== R14 #17 环式任务 / 鉴定 =====
  ringQ: RingQuest | null = null; ringDone = 0;
  ringAccept(): string | null {
    if (this.level < RING_MIN_LEVEL) return `环式任务 ${RING_MIN_LEVEL} 级开放`;
    if (this.ringQ) return '已有环式任务';
    const fs = [...this.reached].filter(f => this.floors[f]?.spawns.some(sp => ENEMIES[sp.id]?.tier !== 'boss'));
    if (!fs.length) return '没有可去的楼层';
    const f = fs[Math.floor(this.lootRng() * fs.length)], ts = [...new Set(this.floors[f].spawns.map(sp => sp.id).filter(id => ENEMIES[id]?.tier !== 'boss'))];
    const t = ts[Math.floor(this.lootRng() * ts.length)];
    this.ringQ = { n: this.ringDone + 1, floor: f, target: t, name: ENEMIES[t].name, need: 5 + Math.min(this.ringDone, 10), prog: 0 }; return null;
  }
  ringClaim(): string | null {
    const q = this.ringQ; if (!q) return '没有环式任务'; if (q.prog < q.need) return `进度 ${q.prog}/${q.need}`;
    const r = ringReward(q.n, q.floor); this.gold += r.gold; this.gainExp(scaledExp(r.exp, q.floor)); this.ringDone = q.n; this.ringQ = null;
    this.events.push({ type: 'log', text: `完成第 ${q.n} 环：+${r.gold} 金`, color: 'green' }); return null;
  }
  identify(slot: EquipSlot): string | null {
    const it = this.equip[slot]; if (!it) return '该栏位为空';
    if (this.level < IDENT_MIN_LEVEL) return `鉴定 ${IDENT_MIN_LEVEL} 级开放`;
    if (it.ided) return '已鉴定'; if (this.gold < IDENT_PRICE) return '金币不足';
    this.gold -= IDENT_PRICE; const n = 1 + Math.floor(this.lootRng() * 3), pool: string[] = [...IDENT_POOL], got: string[] = [];
    for (let i = 0; i < n; i++) { const k = pool.splice(Math.floor(this.lootRng() * pool.length), 1)[0] as keyof typeof it.stats; const v = identValue(k, it.req); it.stats[k] = (it.stats[k] ?? 0) + v; got.push(`${k}+${v}`); }
    it.ided = n; this.events.push({ type: 'inventory' }, { type: 'log', text: `鉴定 ${it.name}：${got.join(' ')}`, color: 'green' }); return null;
  }
  /** 首图练级：待刷新的小怪 */
  farmQueue: { id: string; x: number; y: number; at: number }[] = [];
  private farmTick() { const h = this.hero;
    for (const q of [...this.farmQueue]) if (q.at <= this.time) {
      if (h && Math.abs(h.x - q.x) < FARM_SAFE_DIST) { q.at = this.time + 3; continue; }
      this.farmQueue.splice(this.farmQueue.indexOf(q), 1); this.spawnFoe(q.id, q.x, q.y); this.cleared = false;
    } }
  step(dt: number, inp: Input = { dx: 0, dy: 0 }) {
    if (this.farmQueue.length) this.farmTick();
    this.womaTick();
    if (this.done) return;
    this.time += dt;
    if (this.town) { // R14 安全区：城内只左右走，不结算战斗
      const h = this.hero; if (!h) return; const dx = Math.sign(inp.dx), dy = Math.sign(inp.dy); h.moving = !!(dx || dy);
      if (dx) { h.facing = dx as 1 | -1; h.x = Math.max(24, Math.min(TOWN_W - h.width / 2, h.x + dx * WORLD.heroSpeed * dt)); }
      if (dy) h.y = Math.max(WORLD.laneMin, Math.min(WORLD.laneMax, h.y + dy * WORLD.heroLaneSpeed * dt));
      return;
    }
    const h = this.hero;
    const fighting = this.alive('enemy').some(u => u.ai === 'chase');
    if (h) {
      this.moveHero(h, inp, dt);
      h.mp = Math.min(h.maxMp, (h.mp ?? 0) + WORLD.mpRegen * dt);
      h.hp = Math.min(h.maxHp, h.hp + WORLD.hpRegen * (fighting ? 1 : 5) * dt);
    }
    const chase = WORLD.baseSpeed * WORLD.chaseSpeedRatio, ret = WORLD.baseSpeed * WORLD.returnSpeedRatio;
    // 任务 A 性能：离屏超过 2 屏的待机怪休眠（不跑仇恨/回血/AI；中毒照常结算）
    const act = this.alive('enemy').filter(u => !h || u.ai !== 'idle' || Math.abs(u.x - h.x) <= SLEEP_DIST || (u.poisonUntil ?? 0) > this.time);
    if (h) for (const u of act) if (u.ai === 'idle' && Math.hypot(u.x - h.x, u.y - h.y) < WORLD.aggroRange) {
      for (const v of act) if (v.ai === 'idle' && Math.abs(v.homeX - u.homeX) <= WORLD.groupRadius) {
        v.ai = 'alert'; v.alertT = WORLD.alertSec; this.events.push({ type: 'aggro', uid: v.uid });
      }
    }
    for (const u of act) {
      u.moving = false;
      // 中毒（R13 官方绿毒）：每 2.5 秒结算一次，无视防御、不暴击
      if (u.poisonUntil && u.poisonTick !== undefined && this.time >= u.poisonTick && u.poisonTick <= u.poisonUntil) {
        u.poisonTick += OFFICIAL.poisonTick; this.damage(u, (u.poisonDps ?? 1) * OFFICIAL.poisonTick, h, false, true, true); if (!u.alive) continue;
      }
      // 脱战缓慢回血：仅返回/待机且未中毒时（官方：绿毒期间回复无效）；追击中不回，避免风筝无法击杀
      if ((u.ai === 'return' || u.ai === 'idle') && u.hp < u.maxHp && !(u.poisonUntil && u.poisonUntil > this.time)) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * WORLD.leashRegen * dt);
      if (u.ai === 'alert') { u.alertT -= dt; if (u.alertT <= 0) u.ai = 'chase'; }
      else if (u.ai === 'return') {
        u.facing = Math.sign(u.homeX - u.x || u.facing) as 1 | -1;
        if (this.toward(u, u.homeX, u.homeY, ret, dt)) { u.ai = 'idle'; u.moving = false; }
      } else if (u.ai === 'chase' && (!h || Math.abs(u.x - h.x) > WORLD.leashRange || Math.abs(u.x - u.homeX) > WORLD.leashRange * 1.5)) {
        u.ai = 'return'; this.events.push({ type: 'leash', uid: u.uid });
        // BOSS 脱战：清除发呆/狂暴/飞身/地刺预警等计时残留；阶段 stage 随保留的血量保留，不会重复触发
        if (u.boss) Object.assign(u.boss, { dazeUntil: 0, crazyUntil: 0, crazyOn: false, flyT: 0, spikeX: undefined, spikeT: OFFICIAL.spikeEvery });
      }
    }
    if (h) for (const side of [1, -1]) {
      const q = this.queue(side); let prevDist = 0, prev: Unit | null = null;
      for (const u of q) {
        const stop = prev ? prevDist + prev.width * WORLD.queueSpacing : (h.width + u.width) / 2 + u.range;
        const dist = Math.abs(u.x - h.x);
        if (u.ai === 'chase') {
          const ag = this.summonAggro(u);
          if (ag) { // 仇恨在召唤物：走向召唤物贴身，不占主角排队位
            const sd = Math.sign(u.x - ag.x) || 1; u.facing = -sd as 1 | -1;
            if (u.id !== 'boss_redmoon' && !this.inMelee(u, ag)) this.toward(u, ag.x + sd * ((u.width + ag.width) / 2 + u.range), h.y, (u.stunUntil && u.stunUntil > this.time ? 0 : 1) * chase * (u.slowUntil && u.slowUntil > this.time ? 0.5 : 1), dt);
            continue;
          }
          u.facing = -side as 1 | -1;
          if (u.id === 'boss_redmoon') { prevDist = Math.abs(u.x - h.x); prev = u; continue; } // R13 赤月恶魔：速度 0，不移动
          const sp = (u.stunUntil && u.stunUntil > this.time) ? 0 : chase * (u.slowUntil && u.slowUntil > this.time ? 0.5 : 1);
          const tx = dist > stop ? h.x + side * stop : u.x;
          // 近战怪：玩家后退拉开距离时，跳跃式扑上去补位（短时间 3 倍速，有冷却）
          if (u.tier !== 'boss' && dist > stop + WORLD.leapGap && this.time >= (u.leapReady ?? 0)) {
            u.leapUntil = this.time + WORLD.leapSec; u.leapReady = this.time + WORLD.leapCd; this.events.push({ type: 'leap', uid: u.uid });
          }
          const leaping = (u.leapUntil ?? 0) > this.time;
          this.toward(u, tx, h.y, sp * (leaping ? WORLD.leapSpeed : 1), dt);
        }
        prevDist = Math.abs(u.x - h.x); prev = u;
      }
    }

      // 火墙等地面区：每 0.5 秒灼烧范围内敌人
      if (this.zones.length) {
        this.zones = this.zones.filter(z => z.until > this.time);
        for (const z of this.zones) {
          if (this.time < z.tick) continue;
          z.tick += 0.5;
          for (const e of this.alive('enemy')) if (Math.abs(e.x - z.x) <= z.radius) this.damage(e, z.dps * 0.5, h, false, true, false, 1);
        }
      }

    for (const u of this.units) if (u.alive) u.cd = Math.max(0, u.cd - dt);
    // 召唤骷髅/神兽 + 诱惑之光宠物：跟随主角；有交战中的敌人则冲上去近战
    for (const p of this.pets) if ((p.petUntil ?? 0) <= this.time) {
      // 叛变（资料站：到时变回敌人）[适配] 城镇内直接离开
      if (this.town) { p.alive = false; this.events.push({ type: 'death', uid: p.uid }, { type: 'log', text: `${p.name}离开了` }); continue; }
      Object.assign(p, { team: 'enemy', summon: false, pet: false, petUntil: undefined, ai: 'chase', y: 0, homeX: p.x });
      this.events.push({ type: 'charm', uid: p.uid, result: 'betray' }, { type: 'aggro', uid: p.uid }, { type: 'log', text: `${p.name}叛变了！` });
    }
    const allies = this.units.filter(u => u.summon && u.alive);
    for (const [k, sm] of allies.entries()) if (h) {
      const tg = this.alive('enemy').filter(e => e.ai === 'chase' && Math.abs(e.x - h.x) < (e.aggroUid === sm.uid ? WORLD.leashRange : 700)).sort((a, b) => Math.abs(a.x - sm.x) - Math.abs(b.x - sm.x))[0];
      if (tg) {
        const side = Math.sign(tg.x - sm.x) || 1; sm.facing = side as 1 | -1;
        if (!this.inMelee(sm, tg)) this.toward(sm, tg.x - side * ((sm.width + tg.width) / 2), WORLD.summonLane, WORLD.baseSpeed * 1.1, dt);
        else { sm.moving = false; if (sm.cd <= 0) { sm.cd = sm.atkInterval; this.events.push({ type: 'attack', source: sm.uid, target: tg.uid }); this.damage(tg, sm.atk * (0.9 + this.rng() * 0.2), sm); } }
      } else {
        const tx = h.x - h.facing * (110 + k * 60);
        if (Math.abs(tx - sm.x) > 30) { sm.facing = Math.sign(tx - sm.x) as 1 | -1; this.toward(sm, tx, WORLD.summonLane, WORLD.baseSpeed * 1.1, dt); } else sm.moving = false;
      }
    }
    if (h && h.alive && this.companion?.out) this.companionStep(dt, h);
    if (h && h.alive) this.bossStep(dt, h);
    if (h && h.alive) {
      const side = this.meleeSide();
      // 自动普攻：仅在近战贴脸时打（不追怪）；可由 Input.autoAttack=false 关闭
      if (inp.autoAttack !== false && side !== null && h.cd <= 0) {
        const f = this.queue(side)[0]; h.cd = h.atkInterval; if (!h.moving) h.facing = side as 1 | -1;
        this.events.push({ type: 'attack', source: h.uid, target: f.uid });
        let dmg = this.autoDamage(h) * this.roll(0.9, 0.2);
        // 被动：攻杀剑术（官方附加伤害/几率）+ 准确系（修炼）；用 lootRng 不扰动主随机序列
        for (const sl of this.skillPool) {
          if (!sl.passive) continue;
          const lv = this.skillLevel(sl); if (lv < 0) continue;
          if (sl.lvBonus && sl.lvChance) {
            this.addTrain(sl, 10);
            if (this.lootRng() < sl.lvChance[lv]) { dmg += sl.lvBonus[lv]; this.events.push({ type: 'log', text: `${sl.name} +${sl.lvBonus[lv]}` }, { type: 'proc', skill: sl.id, target: f.uid }); }
          } else if (sl.accBonus) this.addTrain(sl, 10);
        }
        this.damage(f, dmg, h);
      }
      // 召唤物仇恨：锁定召唤物的怪只打召唤物（主角走开时）
      for (const f of this.alive('enemy')) {
        const ag = f.ai === 'chase' && f.cd <= 0 ? this.summonAggro(f) : undefined;
        if (!ag || !this.inMelee(ag, f)) continue;
        f.cd = f.atkInterval * (f.slowUntil && f.slowUntil > this.time ? 1.5 : 1);
        this.events.push({ type: 'attack', source: f.uid, target: ag.uid });
        this.damage(ag, f.atk * (0.9 + this.rng() * 0.2), f);
      }
      for (const s of [1, -1]) {
        const f = this.queue(s).find(u => !this.summonAggro(u));
        if (!f || f.ai !== 'chase' || f.cd > 0 || !h.alive || BOSS_MECH.has(f.id)) continue;
        const s2 = this.summon ?? this.units.find(u => (u.summon || u.companion) && u.alive && this.inMelee(u, f)), hitSummon = s2 && this.inMelee(s2, f) && this.rng() < 0.5;
        if (!hitSummon && !this.inMelee(h, f)) continue;
        const tgt = hitSummon ? s2! : h;
        f.cd = f.atkInterval * (f.slowUntil && f.slowUntil > this.time ? 1.5 : 1);
        this.events.push({ type: 'attack', source: f.uid, target: tgt.uid });
        this.damage(tgt, f.atk * (0.9 + this.rng() * 0.2), f);
      }
    }
    this.units = this.units.filter(u => u.alive);
    const hh = this.hero; if (!hh) return;
    for (const g of [...this.ground]) if (g.landAt <= this.time && Math.hypot(g.x - hh.x, (g.y - hh.y) * 0.5) <= WORLD.pickupRadius) this.pickup(g);
    this.atExit = Math.abs(hh.x - this.exitX) <= WORLD.exitRadius || hh.x >= this.exitX;
    if (this.atExit && this.requireUse && !inp.use) {
      if (!(this.floor.boss && this.alive('enemy').some(u => u.tier === 'boss')) && this.time - this.exitHintT > 4) { this.exitHintT = this.time; this.events.push({ type: 'log', text: '到达传送门：按 W/空格 进入下一层' }); }
    } else if (this.atExit) {
      const boss = this.alive('enemy').find(u => u.tier === 'boss');
      if (this.floor.boss && boss) {
        if (this.time - this.sealedLogT > 3) { this.sealedLogT = this.time; this.events.push({ type: 'log', text: `出口被${boss.name}的力量封印，击败${boss.name}后开启` }); }
      } else if (this.floors === FLOORS && SIDE_FLOORS.includes(this.floorIndex)) { this.events.push({ type: 'log', text: `${this.floor.name}已肃清，返回城镇`, color: 'green' }); this.enterTown(returnTownOf(this.floorIndex), true); }
      else if (nextFloorOf(this.floorIndex, this.floors) < 0) { this.done = true; this.events.push({ type: 'win' }); }
      else this.loadFloor(nextFloorOf(this.floorIndex, this.floors));
    }
  }
  /** R13 官方 BOSS 机制（沃玛教主 / 祖玛教主 / 赤月恶魔），来源与 [适配] 说明见 docs/combat-official.md */
  bossStep(dt: number, h: Unit) {
    for (const b of this.alive('enemy')) {
      if (!BOSS_MECH.has(b.id) || b.ai !== 'chase') continue;
      const m = b.boss ??= { stage: 0, dazeUntil: 0, crazyUntil: 0, crazyOn: false, flyT: 0, summonT: 0, spikeT: OFFICIAL.spikeEvery, minions: [] };
      const sm = this.summon, slow = b.slowUntil && b.slowUntil > this.time ? 1.5 : 1;
      const pick = () => (sm && this.inMelee(sm, b) && this.rng() < 0.5 ? sm : h);
      const mid = MECH_ALIAS[b.id] ?? b.id;
      if (mid === 'boss_woma') {
        // 血量跌破 5/7…1/7：先发呆 8 秒（不攻击）再狂暴 8 秒（每秒攻击 2 次）
        const st = OFFICIAL.womaStages.filter(k => b.hp <= b.maxHp * k / 7).length;
        if (st > m.stage) {
          m.stage = st; m.dazeUntil = this.time + OFFICIAL.womaDaze; m.crazyUntil = m.dazeUntil + OFFICIAL.womaCrazy; m.crazyOn = false;
          this.events.push({ type: 'bossfx', uid: b.uid, kind: 'daze', x: b.x }, { type: 'log', text: `${b.name}陷入发呆（8 秒不攻击），随后将狂暴！` });
        }
        const crazy = this.time >= m.dazeUntil && this.time < m.crazyUntil;
        if (crazy && !m.crazyOn) { m.crazyOn = true; this.events.push({ type: 'bossfx', uid: b.uid, kind: 'crazy', x: b.x }, { type: 'log', text: `${b.name}狂暴：攻速翻倍（8 秒）` }); }
        if (!crazy) m.crazyOn = false;
        // 30 秒计时 + 有仇恨 + 被围攻（[适配] 主角贴身）→ 飞到目标背后
        m.flyT += dt;
        if (m.flyT >= OFFICIAL.womaFlySec && this.inMelee(h, b)) {
          m.flyT = 0; const side = Math.sign(b.x - h.x) || 1;
          b.x = h.x - side * ((h.width + b.width) / 2 + b.range); b.facing = side as 1 | -1;
          this.events.push({ type: 'bossfx', uid: b.uid, kind: 'fly', x: b.x }, { type: 'log', text: `${b.name}飞到了你的背后！` });
        }
        if (this.time < m.dazeUntil || b.cd > 0) continue;
        const t = pick(); if (!this.inMelee(t, b)) continue;
        b.cd = crazy ? OFFICIAL.womaCrazyInterval : b.atkInterval * slow;
        this.events.push({ type: 'attack', source: b.uid, target: t.uid, skill: 'boss' }, { type: 'bossfx', uid: b.uid, kind: 'spark', x: t.x, target: t.uid });
        this.damage(t, b.atk * (0.9 + this.rng() * 0.2), b, true, false, false, OFFICIAL.womaMagic); // 官方 50% 物理 + 50% 魔法
      } else if (mid === 'boss_molong') {
        // 阶段 B 魔龙教主：国服只用翅膀近战 + 保留瞬移（21cq）。瞬移复用沃玛教主 fly 计时（30 秒 + 被贴身）[适配]：瞬移到主角身后
        m.flyT += dt;
        if (m.flyT >= OFFICIAL.womaFlySec && this.inMelee(h, b)) {
          m.flyT = 0; const side = Math.sign(b.x - h.x) || 1;
          b.x = h.x - side * ((h.width + b.width) / 2 + b.range); b.facing = side as 1 | -1;
          this.events.push({ type: 'bossfx', uid: b.uid, kind: 'fly', x: b.x }, { type: 'log', text: `${b.name}瞬移到了你的背后！` });
        }
        if (b.cd > 0) continue;
        const t = pick(); if (!this.inMelee(t, b)) continue;
        b.cd = b.atkInterval * slow;
        this.events.push({ type: 'attack', source: b.uid, target: t.uid, skill: 'boss' }, { type: 'bossfx', uid: b.uid, kind: 'spark', x: t.x, target: t.uid });
        this.damage(t, b.atk * (0.9 + this.rng() * 0.2), b);
      } else if (mid === 'boss_zuma') {
        // 丢火球远程攻击，边攻击边召唤祖玛雕像/卫士
        if (b.cd > 0 || Math.abs(b.x - h.x) > OFFICIAL.zumaRange) continue;
        const t = pick(); b.cd = b.atkInterval * slow; b.facing = (Math.sign(t.x - b.x) || 1) as 1 | -1;
        this.events.push({ type: 'attack', source: b.uid, target: t.uid, skill: 'boss' }, { type: 'bossfx', uid: b.uid, kind: 'fireball', x: t.x, target: t.uid });
        this.damage(t, b.atk * (0.9 + this.rng() * 0.2), b);
        m.minions = m.minions.filter(id => this.units.some(u => u.uid === id && u.alive));
        if (this.time >= m.summonT && m.minions.length < OFFICIAL.zumaCallMax) {
          m.summonT = this.time + OFFICIAL.zumaCallSec;
          const pool = MECH_MINIONS[b.id] ?? MECH_MINIONS.boss_zuma, base = ENEMIES[pool[m.minions.length % pool.length]];
          // [适配] 召唤物不给经验/掉落，防止刷怪
          const u = this.spawn({ ...base, exp: 0, drops: [], setDrop: undefined, oilChance: 0 }, 'enemy', b.x + b.facing * 90, b.y);
          u.ai = 'chase'; m.minions.push(u.uid);
          this.events.push({ type: 'summon', uid: u.uid }, { type: 'bossfx', uid: b.uid, kind: 'call', x: u.x }, { type: 'log', text: `${b.name}唤醒了${base.name}` });
        }
      } else {
        // 赤月恶魔：不移动；全屏地刺落在目标当时所在位置，走开可躲
        if (m.spikeX === undefined) {
          m.spikeT -= dt;
          if (m.spikeT <= 0) { m.spikeX = h.x; m.spikeAt = this.time + OFFICIAL.spikeWarn; m.spikeT = OFFICIAL.spikeEvery; this.events.push({ type: 'bossfx', uid: b.uid, kind: 'spike_warn', x: h.x }); }
        } else if (this.time >= (m.spikeAt ?? 0)) {
          const x = m.spikeX; m.spikeX = undefined;
          this.events.push({ type: 'attack', source: b.uid, target: h.uid, skill: 'boss' }, { type: 'bossfx', uid: b.uid, kind: 'spike', x });
          for (const t of [h, sm]) if (t && t.alive && Math.abs(t.x - x) <= OFFICIAL.spikeRadius) this.damage(t, b.atk * (0.9 + this.rng() * 0.2), b);
        }
      }
    }
  }
  /** 每张战斗层起点都有「回城/回村」入口：原路回到进来的城镇（未查到官方连接的统一回本区域主城） */
  returnTownName(): string { return TOWNS[returnTownOf(this.floorIndex)].name; }
  atReturnGate(): boolean { const h = this.hero; return !this.town && !!h && h.x <= WORLD.heroStartX + 150; }
  returnToTown(): string | null {
    if (this.town) return '已在城内'; if (!this.atReturnGate()) return '回城入口在本层起点（左侧）';
    if (this.inCombat()) return '战斗中无法回城'; return this.enterTown(returnTownOf(this.floorIndex));
  }
  /** S 键：在本层起点附近返回上一层（出生在上一层出口前） */
  prevFloor(): boolean {
    const h = this.hero; if (!h || this.floorIndex <= 0 || h.x > WORLD.heroStartX + 150) return false;
    const p = prevFloorOf(this.floorIndex, this.floors); if (p < 0) return false; this.loadFloor(p); h.x = this.exitX - WORLD.exitRadius - 80; return true;
  }
  drainEvents() { const e = this.events; this.events = []; return e; }
}
export { SLOTS };
/** 存档迁移：eqV<2 的旧档单戒指/单手镯 → ring1/bracelet1，ring2/bracelet2 为空 */
export function migrateEquip(save: Pick<SaveData, 'equip' | 'eqV'>): Partial<Record<EquipSlot, InvItem>> {
  const e: any = { ...save.equip };
  if ((save.eqV ?? 1) < EQUIP_VERSION) {
    if (e.ring && !e.ring1) e.ring1 = e.ring; if (e.bracelet && !e.bracelet1) e.bracelet1 = e.bracelet;
    delete e.ring; delete e.bracelet;
  }
  return e;
}
