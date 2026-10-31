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
  card?: { w: number; h: number; figureScale: number; anchorX?: number; footSink?: number; maxWidthRatio?: number; artFacing?: 1 | -1; bg?: number };
}
/** idle 原地待机；alert 发现主角（感叹号）；chase 追击/战斗；return 脱战回位 */
export type AIState = 'idle' | 'alert' | 'chase' | 'return';
export interface Unit extends UnitDef {
  uid: number; team: Team; x: number; y: number; maxHp: number; maxMp: number; cd: number;
  alive: boolean; isHero?: boolean; summon?: boolean;
  armorUntil?: number; armorReduce?: number;
  leapUntil?: number; leapReady?: number; slowUntil?: number; poisonUntil?: number; poisonDps?: number; poisonTick?: number;
  /** R13 红毒：受到伤害 +20% 截止时间 */
  redUntil?: number;
  /** R13 官方 BOSS 机制状态（沃玛发呆/狂暴、瞬移计时；祖玛召唤；赤月地刺） */
  boss?: BossState;
  mag?: number; tao?: number;
  homeX: number; homeY: number; ai: AIState; alertT: number; facing: 1 | -1; moving: boolean;
}
export interface BossState { stage: number; dazeUntil: number; crazyUntil: number; crazyOn: boolean; flyT: number; summonT: number; spikeT: number; spikeX?: number; spikeAt?: number; minions: number[] }
export type Rarity = 'common' | 'magic' | 'rare';
export interface ItemDef { id: string; name: string; icon: string; potion?: number; slot?: Slot; equip?: Partial<Stats>; req?: number; price?: number; set?: string; /** 技能书：对应技能 id */ book?: string; /** 职业限制（空 = 通用） */ cls?: ('warrior' | 'mage' | 'taoist')[] }
/** 背包/装备栏里的一件物品 */
export interface InvItem { uid: number; item: string; name: string; rarity: Rarity; slot?: Slot; stats: Partial<Stats>; req: number; price: number; luck?: number; /** 强化等级 0..7 */ enhance?: number; /** 黑铁矿石纯度 1..5 */ purity?: number; /** 堆叠数量（黑铁等） */ qty?: number }
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
  | { type: 'respawn' }
  | { type: 'inventory' }
  | { type: 'bossfx'; uid: number; kind: 'spark' | 'fireball' | 'spike_warn' | 'spike' | 'daze' | 'crazy' | 'fly' | 'call'; x: number; target?: number }
  | { type: 'log'; text: string; color?: 'white' | 'green' };
