export type Team = 'ally' | 'enemy';
export type Tier = 'player' | 'normal' | 'boss';
export interface DropEntry { item: string; chance: number; rarity?: Rarity }
export type Slot = 'weapon' | 'helmet' | 'armor' | 'necklace' | 'ring' | 'bracelet' | 'boots';
export interface Stats { hp: number; mp: number; atk: number; mag: number; tao: number; def: number }
export interface UnitDef {
  id: string; name: string; level: number; hp: number; mp?: number; atk: number;
  atkInterval: number; range: number; speed: number; width: number; height: number;
  tier: Tier; exp?: number; drops?: DropEntry[]; deathSfx?: string; def?: number;
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
  mag?: number; tao?: number;
  homeX: number; homeY: number; ai: AIState; alertT: number; facing: 1 | -1; moving: boolean;
}
export type Rarity = 'common' | 'magic' | 'rare';
export interface ItemDef { id: string; name: string; icon: string; potion?: number; slot?: Slot; equip?: Partial<Stats>; req?: number; price?: number }
/** 背包/装备栏里的一件物品 */
export interface InvItem { uid: number; item: string; name: string; rarity: Rarity; slot?: Slot; stats: Partial<Stats>; req: number; price: number; luck?: number }
export interface GroundItem { gid: number; item: string; name: string; rarity: Rarity; x: number; y: number; landAt: number; atk: number; hp: number; amount: number; inv?: InvItem }
export type BattleEvent =
  | { type: 'attack'; source: number; target: number; skill?: string }
  | { type: 'damage'; source?: number; target: number; amount: number; x: number; heal?: boolean; crit?: boolean; dot?: boolean }
  | { type: 'death'; uid: number }
  | { type: 'drop'; uid: number; x: number; y: number; items: GroundItem[] }
  | { type: 'pickup'; gid: number; name: string; item: string }
  | { type: 'aggro'; uid: number }
  | { type: 'leash'; uid: number }
  | { type: 'leap'; uid: number }
  | { type: 'floor'; index: number; name: string }
  | { type: 'cleared' }
  | { type: 'win' }
  | { type: 'exp'; amount: number }
  | { type: 'levelup'; level: number }
  | { type: 'summon'; uid: number }
  | { type: 'respawn' }
  | { type: 'inventory' }
  | { type: 'log'; text: string; color?: 'white' | 'green' };
