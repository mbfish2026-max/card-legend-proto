export type Team = 'ally' | 'enemy';
export type Tier = 'player' | 'normal' | 'boss';
export interface DropEntry { item: string; chance: number; rarity?: Rarity }
export type Slot = 'weapon' | 'helmet' | 'armor' | 'necklace' | 'ring' | 'bracelet' | 'boots';
/** 穿戴位（官方：左右戒指、左右手镯各两位）；Slot 是物品部位类别 */
export type EquipSlot = 'weapon' | 'helmet' | 'armor' | 'necklace' | 'ring1' | 'ring2' | 'bracelet1' | 'bracelet2' | 'boots';
export interface Stats { hp: number; mp: number; atk: number; mag: number; tao: number; def: number; /** 魔御（MAC）：只减魔法伤害 */ mdef: number }
export interface UnitDef {
  id: string; name: string; level: number; hp: number; mp?: number; atk: number;
  atkInterval: number; range: number; speed: number; width: number; height: number;
  tier: Tier; exp?: number; drops?: DropEntry[];
  /** 额外掉落（独立随机流，不影响主随机序列）：从 setDrop 里随机 1 件，概率 setChance */
  setDrop?: string[]; setChance?: number; oilChance?: number; deathSfx?: string; def?: number;
  /** 魔御（MAC，只减魔法伤害）；怪物未设 = 取 def（[适配] 怪物魔御多数未查到） */
  mdef?: number;
  /** 立绘纹理 ID（缺省 = id）；Boss 变体复用普通怪立绘 */
  art?: string;
  /** 渲染用（不影响战斗逻辑） */
  card?: { w: number; h: number; figureScale: number; anchorX?: number; footSink?: number; maxWidthRatio?: number; artFacing?: 1 | -1; bg?: number; tint?: number };
}
/** idle 原地待机；alert 发现主角（感叹号）；chase 追击/战斗；return 脱战回位 */
export type AIState = 'idle' | 'alert' | 'chase' | 'return';
export interface Unit extends UnitDef {
  uid: number; team: Team; x: number; y: number; maxHp: number; maxMp: number; cd: number;
  alive: boolean; isHero?: boolean; summon?: boolean;
  /** 合击版阶段 A：英雄（伙伴）战斗单位，id = COMPANION_UNIT_ID；不是 summon（不走召唤物逻辑），仇恨/挨打规则同召唤物 */
  companion?: boolean;
  /** 诱惑之光宠物（summon=true 且 pet=true）；petUntil = 叛变时间。不存档 */
  pet?: boolean; petUntil?: number;
  /** 召唤物仇恨：被召唤物打过一次后记录其 uid；主角离怪 > WORLD.summonAggroNear 时只追打该召唤物（召唤物死亡自动失效） */
  aggroUid?: number;
  /** 传世替身法符：替身单位（不攻击、不移动，到时消散；不存档） */
  decoy?: boolean; decoyUntil?: number;
  /** 召唤物等级 0–7（[适配] 官方 宝宝 7 级）、本只召唤物期间主角+召唤物总击杀、成长基准（初始属性与初始等级）、名字颜色；均不存档 */
  sLv?: number; sKills?: number; sBase?: { hp: number; atk: number; start: number; name: string }; nameColor?: string;
  armorUntil?: number; armorReduce?: number;
  /** #12 幽灵盾（魔御）/神圣战甲术（防御）增益，不存档 */
  mdefUpUntil?: number; mdefUp?: number; defUpUntil?: number; defUp?: number;
  leapUntil?: number; leapReady?: number; slowUntil?: number; stunUntil?: number; vulnUntil?: number; vulnPhys?: number; vulnMag?: number; poisonUntil?: number; poisonDps?: number; poisonTick?: number;
  /** R13 红毒：受到伤害 +20% 截止时间 */
  redUntil?: number;
  /** R13 官方 BOSS 机制状态（沃玛发呆/狂暴、瞬移计时；祖玛召唤；赤月地刺） */
  boss?: BossState;
  mag?: number; tao?: number;
  homeX: number; homeY: number; ai: AIState; alertT: number; facing: 1 | -1; moving: boolean;
}
export interface BossState { stage: number; dazeUntil: number; crazyUntil: number; crazyOn: boolean; flyT: number; summonT: number; spikeT: number; spikeX?: number; spikeAt?: number; minions: number[] }
export type Rarity = 'common' | 'magic' | 'rare';
export interface ItemDef { id: string; name: string; icon: string; potion?: number; slot?: Slot; equip?: Partial<Stats>; req?: number; price?: number; set?: string; /** 技能书：对应技能 id */ book?: string; /** 职业限制（空 = 通用） */ cls?: ('warrior' | 'mage' | 'taoist')[]; /** 合击版：火龙之心（英雄栏专属） */ heart?: boolean; /** 合击版：补充怒槽/火龙之心的量 */ rage?: number }
/** 背包/装备栏里的一件物品 */
export interface InvItem { uid: number; item: string; name: string; rarity: Rarity; slot?: Slot; stats: Partial<Stats>; req: number; price: number; luck?: number; /** 强化等级 0..7 */ enhance?: number; /** R14 鉴定词条数 1–3 */ ided?: number; /** 黑铁矿石纯度 1..5 */ purity?: number; /** 堆叠数量（黑铁等） */ qty?: number }
export interface GroundItem { gid: number; item: string; name: string; rarity: Rarity; x: number; y: number; landAt: number; atk: number; hp: number; amount: number; inv?: InvItem }
export type BattleEvent =
  | { type: 'attack'; source: number; target: number; skill?: string }
  | { type: 'proc'; skill: string; target: number }
  | { type: 'damage'; source?: number; target: number; amount: number; x: number; heal?: boolean; crit?: boolean; dot?: boolean }
  | { type: 'death'; uid: number }
  | { type: 'learned'; skill: string }
  | { type: 'drop'; uid: number; x: number; y: number; items: GroundItem[] }
  | { type: 'pickup'; gid: number; name: string; item: string }
  | { type: 'aggro'; uid: number }
  | { type: 'leash'; uid: number }
  | { type: 'leap'; uid: number }
  | { type: 'floor'; index: number; name: string }
  | { type: 'town'; id: string }
  | { type: 'cleared' }
  | { type: 'win' }
  | { type: 'exp'; amount: number }
  | { type: 'levelup'; level: number }
  | { type: 'summon'; uid: number }
  | { type: 'combo'; id: string; name: string; source: number; partner: number; target: number; amount: number; hits?: number; /** 表现层：被施加毒/麻痹的目标 uid */ affected?: number[]; /** 表现层：该合击持续状态结束的 world.time */ statusUntil?: number }
  | { type: 'charm'; uid: number; result: 'ok' | 'fail' | 'immune' | 'high' | 'betray' }
  | { type: 'respawn' }
  | { type: 'inventory' }
  | { type: 'bossfx'; uid: number; kind: 'spark' | 'fireball' | 'spike_warn' | 'spike' | 'daze' | 'crazy' | 'fly' | 'call'; x: number; target?: number }
  | { type: 'log'; text: string; color?: 'white' | 'green' };
