import { BOOKS, BookDef, BOOK_DROP, BOOK_RATES, STARTER, bookItemId } from '../data/books';
// 纯逻辑世界模块（无 Phaser 依赖，可在 node 中单测）：职业/等级成长、分层横版地图、怪物 AI、
// 自动战斗与技能、召唤物、掉落/背包/装备/商店、死亡复活、存档序列化。
import { BattleEvent, GroundItem, InvItem, Rarity, Slot, Stats, Team, Unit, UnitDef } from './types';
import { POTIONS } from '../data/skills';
import { CLASSES, ClassId, SkillDef } from '../data/classes';
import { ITEMS, SLOTS, SETS, ENHANCE_SLOTS, ENHANCE_MAX, ENHANCE_STAT, IRON_PRICE, IRON_MAX_PURITY, enhanceChance, shatterChance } from '../data/items';
import { HERO, ENEMIES, EXP_PER_LEVEL, SUMMON, SUMMON_BEAST } from '../data/units';
import { WORLD, FLOORS, Floor } from '../data/world';
import { QUESTS, ACHIEVES, QuestDef, AchieveDef } from '../data/quests';

export const CRIT_CHANCE = 0.15, CRIT_MULT = 1.8;
export interface Input { dx: number; dy: number; use?: boolean; step?: number; /** false 时关闭自动普攻；缺省/true 保持原行为 */ autoAttack?: boolean }
export interface SaveData {
  v: 1; cls: ClassId; level: number; exp: number; gold: number; pots: number[];
  equip: Partial<Record<Slot, InvItem>>; bag: InvItem[]; floorIndex: number; kills: number; nextUid: number;
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
}
/** R11 旧层号 → 新层号（按原版递进重排：兽人要塞提前到第 2 层） */
export const FLOOR_MIGRATE = [0, 2, 3, 1, 4, 5, 6, 7];
/** R13 新增 5 张地图后，mapV2 的 8 层层号 → mapV3 层号 */
export const FLOOR_MIGRATE_V3 = [0, 1, 2, 4, 5, 8, 9, 12];
/** 商店祝福油价格（较贵，每层限购 1） */
export const OIL_PRICE = 400;
export { IRON_PRICE } from '../data/items';
export type CastResult = { ok: true; targets: number[]; skill: string; kind: string } | { ok: false; reason: string };
const ZERO: Stats = { hp: 0, mp: 0, atk: 0, mag: 0, tao: 0, def: 0 };

export class World {
  units: Unit[] = []; events: BattleEvent[] = []; ground: GroundItem[] = [];
  /** 火墙等地面持续区：[适配] 落点灼烧 */
  zones: { x: number; until: number; dps: number; radius: number; tick: number; skill: string }[] = [];
  exp = 0; expNext: number; nextUid = 1; nextGid = 1; nextItem = 1; time = 0;
  pots = POTIONS.map(p => p.count); gold = 0;
  /** 背包（最多 WORLD.bagSize 格）与装备栏 */
  bag: InvItem[] = []; equip: Partial<Record<Slot, InvItem>> = {};
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
      this.cls = save.cls; this.level = save.level; this.exp = save.exp; this.gold = save.gold; this.pots = [...save.pots];
      this.equip = { ...save.equip }; this.bag = [...save.bag]; this.kills = save.kills; this.nextItem = save.nextUid;
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
      this.learned = new Set(save.learned ?? this.skillPool.filter(s => this.level >= (s.unlock ?? s.learn?.[0] ?? 1)).map(s => s.id));
    }
    this.learned.add(this.starter);
    this.expNext = EXP_PER_LEVEL(this.level);
    this.spawnHero();
    this.loadFloor(save ? Math.min(save.floorIndex, this.floors.length - 1) : 0);
  }
  /** 兼容旧接口：已拾取的装备（背包+身上） */
  get inventory() { return [...Object.values(this.equip), ...this.bag].filter((x): x is InvItem => !!x && !!x.slot); }
  get classDef() { return CLASSES[this.cls]; }
  /** 职业全部技能（含被动） */
  get skillPool(): SkillDef[] { return this.classDef.skills; }
  /** 快捷栏主动技能：去掉被动后按顺序重标 F1..Fn */
  get skills(): SkillDef[] {
    return this.skillPool.filter(s => !s.passive && this.learned.has(s.id)).map((s, i) => ({ ...s, key: `F${i + 1}` }));
  }
  get floor() { return this.floors[this.floorIndex]; }
  get exitX() { return WORLD.mapWidth - WORLD.exitMargin; }
  get hero() { return this.units.find(u => u.isHero && u.alive); }
  get summon() { return this.units.find(u => u.summon && u.alive); }

  // ---------- 属性 ----------
  baseStats(lv = this.level): Stats {
    const c = this.classDef, l = lv - 1, r: any = {};
    for (const k of Object.keys(ZERO) as (keyof Stats)[]) r[k] = Math.round(c.base[k] + c.grow[k] * l);
    return r;
  }
  equipStats(): Stats {
    const r = { ...ZERO };
    for (const it of Object.values(this.equip)) if (it) for (const [k, v] of Object.entries(it.stats)) (r as any)[k] += v ?? 0;
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
    for (const it of Object.values(this.equip)) { const s = it && ITEMS[it.item]?.set; if (s) c[s] = (c[s] ?? 0) + 1; }
    return c;
  }
  /** 当前激活的套装加成 */
  setBonuses() { const c = this.setCounts(); return Object.values(SETS).flatMap(s => s.bonus.filter(b => (c[s.id] ?? 0) >= b.n)); }
  stats(): Stats { const b = this.baseStats(), e = this.equipStats(), r: any = {}; for (const k of Object.keys(ZERO)) r[k] = (b as any)[k] + (e as any)[k]; return r; }
  recompute(fill = false) {
    const h = this.hero; if (!h) return;
    const s = this.stats();
    h.maxHp = s.hp; h.maxMp = s.mp; h.atk = s.atk; h.mag = s.mag; h.tao = s.tao; h.def = s.def; h.level = this.level;
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
  enhanceWithIron(bagIdx: number, slot: Slot): string {
    const ore = this.bag[bagIdx]; if (!ore || ore.item !== 'black_iron') return '需要黑铁矿石';
    if (!ENHANCE_SLOTS.includes(slot)) return '该部位不能强化（首饰不可强化）';
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
    this.questDone.add(id); this.gold += q.gold; this.gainExp(q.exp);
    this.checkAchieves(); this.events.push({ type: 'log', text: `完成悬赏 ${q.name}，获得 ${q.gold} 金 / ${q.exp} 经验`, color: 'green' });
    return `完成 ${q.name}！+${q.gold} 金 +${q.exp} 经验`;
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
    this.floorIndex = i; this.cleared = false; this.ground = []; this.zones = []; this.reached.add(i); this.checkAchieves();
    this.units = this.units.filter(u => u.isHero || u.summon);
    const h = this.hero; if (h) { h.x = WORLD.heroStartX; h.y = 0; h.facing = 1; }
    const s = this.summon; if (s) { s.x = WORLD.heroStartX - 110; s.y = WORLD.summonLane; }
    for (const sp of this.floor.spawns) this.spawn(ENEMIES[sp.id], 'enemy', sp.x, sp.y ?? 0);
    this.events.push({ type: 'floor', index: i, name: this.floor.name });
  }
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

  damage(target: Unit, amount: number, source?: Unit, canCrit = true, dot = false) {
    if (!target.alive) return 0;
    const crit = canCrit && this.rng() < (source?.isHero ? this.critChance() : CRIT_CHANCE);
    if (crit) amount *= CRIT_MULT;
    amount = Math.max(amount * 0.2, amount - (target.def ?? 0) * WORLD.defFactor);
    if (target.armorUntil && target.armorUntil > this.time) amount *= 1 - (target.armorReduce ?? 0.5);
    amount = Math.max(1, Math.round(amount));
    target.hp -= amount;
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
  kill(u: Unit) {
    u.hp = 0; u.alive = false;
    this.events.push({ type: 'death', uid: u.uid });
    if (u.team !== 'enemy') return;
    this.kills++;
    this.onKillQuest(u.id);
    this.checkAchieves();
    const entries = (u.drops ?? []).filter(d => this.rng() < d.chance);
    if (entries.length) {
      const items = entries.map(d => {
        const x = Math.max(40, Math.min(WORLD.mapWidth - 40, u.x + (this.rng() - 0.5) * WORLD.dropSpread));
        const y = WORLD.laneMin + this.rng() * (WORLD.laneMax - WORLD.laneMin);
        return this.rollDrop(d.item, d.rarity, x, y);
      });
      this.ground.push(...items);
      this.events.push({ type: 'drop', uid: u.uid, x: u.x, y: u.y, items });
    }
    // 额外掉落：独立随机流 lootRng（不消耗主 rng，保持平衡模拟稳定）。Boss 必掉 1 瓶祝福油；setDrop 随机 1 件套装
    if (u.tier === 'boss') this.bossKilled.add(this.floorIndex);
    const extra: { id: string; purity?: number }[] = [];
    if (u.tier === 'boss' || this.lootRng() < (u.oilChance ?? 0)) extra.push({ id: 'bless_oil' });
    // R11 技能书掉落（本职业、未学、背包里也没有）
    { const pool = Object.values(BOOKS).filter(b => b.cls === this.cls && (u.id in BOOK_RATES ? (BOOK_RATES[u.id][b.skill] ?? 0) > 0 : b.drops.includes(u.id)) && !this.learned.has(b.skill) && !this.bag.some(x => x.item === bookItemId(b.skill)));
      // R13：有资料的怪逐本按资料爆率（1/N）独立判定；无资料的怪沿用 [适配] 首领/普通几率随机一本
      if (u.id in BOOK_RATES) { for (const b of pool) if (this.lootRng() < BOOK_RATES[u.id][b.skill]) { extra.push({ id: bookItemId(b.skill) }); break; } }
      else if (pool.length && this.lootRng() < (u.tier === 'boss' ? BOOK_DROP.boss : BOOK_DROP.normal)) extra.push({ id: bookItemId(pool[Math.floor(this.lootRng() * pool.length)].skill) }); }
    if (u.setDrop?.length && this.lootRng() < (u.setChance ?? 1)) extra.push({ id: u.setDrop[Math.floor(this.lootRng() * u.setDrop.length)] });
    // 黑铁：Boss 必掉 1 块纯度 1–3；普通怪 8% 掉纯度 1（lootRng，不影响平衡模拟主序列）
    if (u.tier === 'boss') extra.push({ id: 'black_iron', purity: 1 + Math.floor(this.lootRng() * 3) });
    else if (this.lootRng() < 0.05) extra.push({ id: 'black_iron', purity: 1 });
    if (extra.length) {
      const items = extra.map((e, i) => {
        const inv = this.makeItem(e.id, 'common', e.purity ? { purity: e.purity } : undefined);
        const x = Math.max(40, Math.min(WORLD.mapWidth - 40, u.x + (i - (extra.length - 1) / 2) * 50));
        return { gid: this.nextGid++, item: e.id, name: inv.name, rarity: 'common' as const, x, y: 0, landAt: this.time + WORLD.dropLandSec, atk: inv.stats.atk ?? 0, hp: inv.stats.hp ?? 0, amount: 1, inv } as GroundItem;
      });
      this.ground.push(...items); this.events.push({ type: 'drop', uid: u.uid, x: u.x, y: u.y, items });
    }
    this.gainExp(u.exp ?? 10);
    if (!this.alive('enemy').length && !this.cleared) { this.cleared = true; this.events.push({ type: 'cleared' }); }
  }
  gainExp(n: number) {
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
  equipItem(bagIdx: number): string | null {
    const it = this.bag[bagIdx]; if (!it) return '没有物品';
    if (!it.slot) return '该物品无法装备';
    if (this.level < it.req) return `需要等级 ${it.req}`;
    this.bag.splice(bagIdx, 1);
    const old = this.equip[it.slot]; if (old) this.bag.splice(bagIdx, 0, old);
    this.equip[it.slot] = it; this.recompute(); this.events.push({ type: 'inventory' });
    return null;
  }
  unequip(slot: Slot): string | null {
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

  // ---------- 技能 ----------
  cast(i: number, cds: number[]): CastResult {
    const s = this.skills[i], h = this.hero;
    if (!s || !h) return { ok: false, reason: '' };
    const need = this.needLevel(s);
    if (this.level < need) return { ok: false, reason: `${s.name} 需等级 ${need}` };
    if (s.passive) return { ok: false, reason: `${s.name} 为被动技能` };
    const slv = Math.max(0, this.skillLevel(s)), lvF = 1 + 0.1 * slv;
    if (cds[i] > 0) return { ok: false, reason: `${s.name} 冷却中` };
    if ((h.mp ?? 0) < s.mana) return { ok: false, reason: '魔法值不足' };
    let targets: Unit[] = [];
    if (s.kind === 'melee' || s.kind === 'pierce') {
      const side = this.meleeSide(); if (side === null) return { ok: false, reason: '没有可攻击的目标' };
      const q = this.queue(side); h.facing = side as 1 | -1;
      targets = s.kind === 'pierce' ? q.slice(0, s.pierce ?? 3) : [q[0]];
    } else if (s.kind === 'ranged' || s.kind === 'dot' || s.kind === 'zone') {
      const side = this.rangedSide(s.range ?? 500); if (side === null) return { ok: false, reason: '射程内没有目标' };
      h.facing = side as 1 | -1; targets = [this.queue(side)[0]];
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
    h.mp = (h.mp ?? 0) - s.mana; cds[i] = s.cooldown;
    this.events.push({ type: 'attack', source: h.uid, target: targets[0]?.uid ?? h.uid, skill: s.id });
    this.addTrain(s, 100);
    const pw = this.power(s.stat) * this.skillScale() * (s.lvMult ? 1 : lvF);
    const dur = (s.duration ?? 8) + (s.durPerLv ?? 0) * slv;
    if (s.kind === 'buff') {
      if (s.reduce) {
        h.armorUntil = this.time + dur; h.armorReduce = s.reduce;
        this.events.push({ type: 'log', text: `${s.name}：受到伤害降低 ${Math.round(s.reduce * 100)}%，持续 ${dur} 秒` });
      }
      if (s.heal) this.heal(h, pw * s.heal);
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
        const atk0 = beast ? 14 + tao * 1.15 : 8 + tao * 0.9;
        const def0 = beast ? 7 + this.level * 1.0 : 3 + this.level * 0.8;
        const def: UnitDef = { ...base, level: this.level + (beast ? slv : 0), hp: Math.round(hp0 * lvF), atk: Math.round(atk0 * lvF), def: Math.round(def0) };
        const u = this.spawn(def, 'ally', h.x - h.facing * 110, WORLD.summonLane); u.summon = true; u.facing = h.facing; u.ai = 'chase';
        this.events.push({ type: 'summon', uid: u.uid });
      }
    } else if (s.kind === 'dot') {
      for (const t of targets) { t.poisonUntil = this.time + dur; t.poisonDps = pw * (s.mult ?? 0.5); t.poisonTick = this.time + 1; this.damage(t, pw * (s.mult ?? 0.5), h, false); }
    } else if (s.kind === 'zone') {
      // 火墙：官方 2×2、等级延长燃烧时间；[适配] 落在目标脚下，半径约一格，每秒灼烧
      const t0 = targets[0];
      const dps = pw * (s.mult ?? 0.8);
      this.zones.push({ x: t0.x, until: this.time + dur, dps, radius: 160, tick: this.time + 0.5, skill: s.id });
      this.damage(t0, dps * 0.6, h, false); // 落点瞬时轻伤
      this.events.push({ type: 'log', text: `${s.name}：燃烧 ${dur} 秒` });
    } else if (s.kind === 'rush') {
      for (const t of targets) {
        t.x += h.facing * 150;
        t.x = Math.max(t.width / 2, Math.min(WORLD.mapWidth - t.width / 2, t.x));
        this.damage(t, pw * (s.mult ?? 0.5) * this.roll(0.95, 0.1), h);
      }
      this.events.push({ type: 'log', text: `${s.name}：撞开 ${targets.length} 个低等级目标` });
    } else {
      targets.forEach((t, j) => {
        // 战士剑法：官方各级倍率（刺杀/半月：主目标 100%，其余按倍率；烈火：主目标倍率）
        const m = s.lvMult ? (s.kind === 'pierce' ? (j === 0 ? 1 : s.lvMult[slv]) : s.lvMult[slv]) : (s.mult ?? 1);
        this.damage(t, pw * m * this.roll(0.95, 0.1), h);
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
  toSave(): SaveData {
    return { v: 1, cls: this.cls, level: this.level, exp: this.exp, gold: this.gold, pots: [...this.pots], equip: { ...this.equip }, bag: [...this.bag], floorIndex: this.floorIndex, kills: this.kills, nextUid: this.nextItem, skillTrain: { ...this.skillTrain }, reached: [...this.reached], bossKilled: [...this.bossKilled], questProg: { ...this.questProg }, questDone: [...this.questDone], achieves: [...this.achieves], learned: [...this.learned], mapV: 3 };
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
      h.x = Math.max(h.width / 2, Math.min(WORLD.mapWidth - h.width / 2, nx));
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

  step(dt: number, inp: Input = { dx: 0, dy: 0 }) {
    if (this.done) return;
    this.time += dt;
    const h = this.hero;
    const fighting = this.alive('enemy').some(u => u.ai === 'chase');
    if (h) {
      this.moveHero(h, inp, dt);
      h.mp = Math.min(h.maxMp, (h.mp ?? 0) + WORLD.mpRegen * dt);
      h.hp = Math.min(h.maxHp, h.hp + WORLD.hpRegen * (fighting ? 1 : 5) * dt);
    }
    const chase = WORLD.baseSpeed * WORLD.chaseSpeedRatio, ret = WORLD.baseSpeed * WORLD.returnSpeedRatio;
    if (h) for (const u of this.alive('enemy')) if (u.ai === 'idle' && Math.hypot(u.x - h.x, u.y - h.y) < WORLD.aggroRange) {
      for (const v of this.alive('enemy')) if (v.ai === 'idle' && Math.abs(v.homeX - u.homeX) <= WORLD.groupRadius) {
        v.ai = 'alert'; v.alertT = WORLD.alertSec; this.events.push({ type: 'aggro', uid: v.uid });
      }
    }
    for (const u of this.alive('enemy')) {
      u.moving = false;
      // 中毒：每秒结算一次（不暴击）
      if (u.poisonUntil && u.poisonTick !== undefined && this.time >= u.poisonTick && u.poisonTick <= u.poisonUntil) {
        u.poisonTick += 1; this.damage(u, u.poisonDps ?? 1, h, false, true); if (!u.alive) continue;
      }
      if (u.ai === 'alert') { u.alertT -= dt; if (u.alertT <= 0) u.ai = 'chase'; }
      else if (u.ai === 'return') {
        u.facing = Math.sign(u.homeX - u.x || u.facing) as 1 | -1;
        if (this.toward(u, u.homeX, u.homeY, ret, dt)) { u.ai = 'idle'; u.hp = u.maxHp; u.moving = false; }
      } else if (u.ai === 'chase' && (!h || Math.abs(u.x - h.x) > WORLD.leashRange || Math.abs(u.x - u.homeX) > WORLD.leashRange * 1.5)) {
        u.ai = 'return'; this.events.push({ type: 'leash', uid: u.uid });
      }
    }
    if (h) for (const side of [1, -1]) {
      const q = this.queue(side); let prevDist = 0, prev: Unit | null = null;
      for (const u of q) {
        const stop = prev ? prevDist + prev.width * WORLD.queueSpacing : (h.width + u.width) / 2 + u.range;
        const dist = Math.abs(u.x - h.x);
        if (u.ai === 'chase') {
          u.facing = -side as 1 | -1;
          const sp = chase * (u.slowUntil && u.slowUntil > this.time ? 0.5 : 1);
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
          for (const e of this.alive('enemy')) if (Math.abs(e.x - z.x) <= z.radius) this.damage(e, z.dps * 0.5, h, false, true);
        }
      }

    for (const u of this.units) if (u.alive) u.cd = Math.max(0, u.cd - dt);
    // 召唤骷髅：跟随主角；有交战中的敌人则冲上去近战
    const sm = this.summon;
    if (sm && h) {
      const tg = this.alive('enemy').filter(e => e.ai === 'chase' && Math.abs(e.x - h.x) < 700).sort((a, b) => Math.abs(a.x - sm.x) - Math.abs(b.x - sm.x))[0];
      if (tg) {
        const side = Math.sign(tg.x - sm.x) || 1; sm.facing = side as 1 | -1;
        if (!this.inMelee(sm, tg)) this.toward(sm, tg.x - side * ((sm.width + tg.width) / 2), WORLD.summonLane, WORLD.baseSpeed * 1.1, dt);
        else { sm.moving = false; if (sm.cd <= 0) { sm.cd = sm.atkInterval; this.events.push({ type: 'attack', source: sm.uid, target: tg.uid }); this.damage(tg, sm.atk * (0.9 + this.rng() * 0.2), sm); } }
      } else {
        const tx = h.x - h.facing * 110;
        if (Math.abs(tx - sm.x) > 30) { sm.facing = Math.sign(tx - sm.x) as 1 | -1; this.toward(sm, tx, WORLD.summonLane, WORLD.baseSpeed * 1.1, dt); } else sm.moving = false;
      }
    }
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
      for (const s of [1, -1]) {
        const f = this.queue(s)[0];
        if (!f || f.ai !== 'chase' || f.cd > 0 || !h.alive) continue;
        const s2 = this.summon, hitSummon = s2 && this.inMelee(s2, f) && this.rng() < 0.5;
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
      } else if (this.floorIndex >= this.floors.length - 1) { this.done = true; this.events.push({ type: 'win' }); }
      else this.loadFloor(this.floorIndex + 1);
    }
  }
  /** S 键：在本层起点附近返回上一层（出生在上一层出口前） */
  prevFloor(): boolean {
    const h = this.hero; if (!h || this.floorIndex <= 0 || h.x > WORLD.heroStartX + 150) return false;
    this.loadFloor(this.floorIndex - 1); h.x = this.exitX - WORLD.exitRadius - 80; return true;
  }
  drainEvents() { const e = this.events; this.events = []; return e; }
}
export { SLOTS };
