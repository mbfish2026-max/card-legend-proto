// 地图/移动/仇恨/掉落的可调常量（数值均为估计，玩过后按手感调）。距离单位：像素；CARD = 主角卡宽。
import { HERO } from './units';
export const CARD = HERO.width; // 170
export const WORLD = {
  screenW: 1280,
  mapWidth: 1280 * 3,          // 每层地图宽度（3 倍屏宽）
  laneMin: -40, laneMax: 30,   // 纵深带：相对 GROUND_Y 的 Y 偏移范围
  heroStartX: 220,
  stepPx: 100, stepSec: 0.12, // 点按移动：每按一下滑行一格（100px，约 0.6 卡宽），0.12s 补间
  baseSpeed: 1.2 * CARD,       // 怪物追击/召唤物速度基准（原主角速度，不随按住速度变化）
  heroSpeed: 400,              // 按住移动速度 px/s（约 2.35 卡宽/秒，可调 350~450）
  heroLaneSpeed: 120,
  aggroRange: 2.5 * CARD,
  groupRadius: 1.6 * CARD,
  alertSec: 0.45,
  chaseSpeedRatio: 0.85,
  returnSpeedRatio: 1.3,
  leashRange: 6 * CARD,
  queueSpacing: 0.8,           // 逻辑排队间距（卡宽比例，<1 重叠）；渲染层另做视觉错开，不影响战斗
  leapGap: 120, leapSec: 0.35, leapSpeed: 3.2, leapCd: 2.5, // 近战怪跳跃补位
  visualSpacing: 0.92,         // 渲染：后排至少错开 卡宽×该值，避免卡牌重叠
  pickupRadius: 0.45 * CARD,
  dropLandSec: 0.55,
  dropSpread: 0.9 * CARD,
  exitRadius: 90,
  exitMargin: 160,
  mpRegen: 4,                  // 每秒回蓝
  hpRegen: 1,                  // 每秒回血（脱战时 ×5）
  defFactor: 0.6,              // 伤害 = 原始 − 防御×该值（最低保留 20%）
  rarityRoll: { magic: 0.3, rare: 0.1 },
  affix: { magic: 0.5, rare: 1.2 },
  goldAmount: [5, 40] as [number, number],
  bagSize: 30,
  deathGoldLoss: 0.1,          // 死亡损失金币比例
  summonLane: -36,             // 召唤物站位（纵深偏后）
};
export interface Spawn { id: string; x: number; y?: number }
export interface Floor { name: string; spawns: Spawn[]; boss?: boolean; bg?: string }
export const FLOORS: Floor[] = [
  { name: '幽暗森林', bg: 'bg_floor1', boss: true, spawns: [
    { id: 'deer', x: 800 }, { id: 'deer', x: 900, y: 20 },
    { id: 'bat', x: 1500 }, { id: 'wolf', x: 1620, y: -15 },
    { id: 'wolf', x: 2300 }, { id: 'bat', x: 2400, y: -20 }, { id: 'deer', x: 2480, y: 15 },
    { id: 'wolf_king', x: 3350 } ] },
  { name: '蛛网晶洞', bg: 'bg_floor2', boss: true, spawns: [
    { id: 'spider', x: 800 }, { id: 'bat', x: 880, y: 20 },
    { id: 'spider', x: 1500 }, { id: 'spider', x: 1610, y: -15 },
    { id: 'wolf', x: 2200 }, { id: 'spider', x: 2300 }, { id: 'bat', x: 2400, y: 15 },
    { id: 'spider_queen', x: 3350 } ] },
  { name: '白骨墓穴', bg: 'bg_floor3', boss: true, spawns: [
    { id: 'skeleton', x: 800 }, { id: 'skeleton', x: 900, y: 20 },
    { id: 'zombie', x: 1550 }, { id: 'skeleton', x: 1650, y: -15 },
    { id: 'zombie', x: 2250 }, { id: 'zombie', x: 2360, y: 15 }, { id: 'skeleton', x: 2460 },
    { id: 'skeleton_lord', x: 3350 } ] },
  { name: '兽人要塞', bg: 'bg_floor4', boss: true, spawns: [
    { id: 'orc', x: 800 }, { id: 'orc', x: 910, y: 20 },
    { id: 'darkmage', x: 1550 }, { id: 'orc', x: 1650, y: -15 },
    { id: 'orc', x: 2250 }, { id: 'darkmage', x: 2350, y: 15 }, { id: 'orc', x: 2450 },
    { id: 'orc_chief', x: 3350 } ] },
  { name: '尸王殿', bg: 'bg_floor5', boss: true, spawns: [
    { id: 'skeleton', x: 750 }, { id: 'zombie', x: 850, y: 20 },
    { id: 'darkmage', x: 1450 }, { id: 'zombie', x: 1550, y: -15 }, { id: 'skeleton', x: 1650 },
    { id: 'darkmage', x: 2250 }, { id: 'darkmage', x: 2350, y: 15 },
    { id: 'skeleton', x: 3150, y: -20 }, { id: 'boss_lich', x: 3380 } ] },
];
