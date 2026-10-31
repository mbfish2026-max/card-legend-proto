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
  leashRange: 6 * CARD,        // 脱战距离恢复为 6 卡宽（1020px），离家上限 ×1.5=1530；用户反馈 10 卡宽太长跑不掉
  summonAggroNear: 1.5 * CARD, // [适配] 召唤物仇恨：主角离怪中心 > 1.5 卡宽（255px，约贴身距离 ~165px + 半卡余量）时，被召唤物打过的怪只追打召唤物；≤ 该距离不强制转移
  leashRegen: 0.01,            // [适配] 脱战返回/待机时每秒回最大血量 1%（中毒时不回，追击中不回）；回位不再回满
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
export interface Floor { name: string; spawns: Spawn[]; boss?: boolean; bg?: string; /** R11 对应原版区域（docs/legend-research.md「地图递进」） */ zone?: string }
export const FLOORS: Floor[] = [
  { name: '幽暗森林', bg: 'bg_floor1', boss: true, zone: '比奇省·新手村周边（原版 1–7 级）', spawns: [
    { id: 'deer', x: 800 }, { id: 'deer', x: 900, y: 20 },
    { id: 'bat', x: 1500 }, { id: 'wolf', x: 1620, y: -15 },
    { id: 'wolf', x: 2300 }, { id: 'bat', x: 2400, y: -20 }, { id: 'deer', x: 2480, y: 15 },
    { id: 'wolf_king', x: 3350 } ] },
  { name: '兽人要塞', bg: 'bg_floor4', boss: true, zone: '沃玛森林·半兽人出没（原版 8–14 级）', spawns: [
    { id: 'orc', x: 800 }, { id: 'orc', x: 910, y: 20 },
    { id: 'darkmage', x: 1550 }, { id: 'orc', x: 1650, y: -15 },
    { id: 'orc', x: 2250 }, { id: 'darkmage', x: 2350, y: 15 }, { id: 'orc', x: 2450 },
    { id: 'orc_chief', x: 3350 } ] },
  { name: '蛛网晶洞', bg: 'bg_floor2', boss: true, zone: '沃玛森林深处（原版 8–14 级）', spawns: [
    { id: 'spider', x: 800 }, { id: 'bat', x: 880, y: 20 },
    { id: 'spider', x: 1500 }, { id: 'spider', x: 1610, y: -15 },
    { id: 'wolf', x: 2200 }, { id: 'spider', x: 2300 }, { id: 'bat', x: 2400, y: 15 },
    { id: 'spider_queen', x: 3350 } ] },
  { name: '毒蛇山谷', bg: 'bg_floor9', boss: true, zone: '毒蛇山谷（原版 21 级起推荐练级；BOSS 取自经毒蛇山谷进入的情缘峡谷）', spawns: [
    { id: 'red_snake', x: 800 }, { id: 'tiger_snake', x: 910, y: 20 },
    { id: 'scorpion', x: 1550 }, { id: 'red_snake', x: 1650, y: -15 },
    { id: 'tiger_snake', x: 2300 }, { id: 'scorpion', x: 2400, y: 15 }, { id: 'red_snake', x: 2500 },
    { id: 'tree_demon', x: 3350 } ] },
  { name: '白骨墓穴', bg: 'bg_floor3', boss: true, zone: '比奇省·半兽人古墓/骷髅洞（原版 15–21 级）', spawns: [
    { id: 'skeleton', x: 800 }, { id: 'skeleton', x: 900, y: 20 },
    { id: 'zombie', x: 1550 }, { id: 'skeleton', x: 1650, y: -15 },
    { id: 'zombie', x: 2250 }, { id: 'zombie', x: 2360, y: 15 }, { id: 'skeleton', x: 2460 },
    { id: 'skeleton_lord', x: 3350 } ] },
  { name: '尸王殿', bg: 'bg_floor5', boss: true, zone: '比奇矿区·尸王殿（原版 18 级起）', spawns: [
    { id: 'skeleton', x: 750 }, { id: 'zombie', x: 850, y: 20 },
    { id: 'darkmage', x: 1450 }, { id: 'zombie', x: 1550, y: -15 }, { id: 'skeleton', x: 1650 },
    { id: 'darkmage', x: 2250 }, { id: 'darkmage', x: 2350, y: 15 },
    { id: 'skeleton', x: 3150, y: -20 }, { id: 'boss_lich', x: 3380 } ] },
  { name: '蜈蚣洞', bg: 'bg_floor10', boss: true, zone: '盟重土城·蜈蚣洞（原版 26–31 级怪）', spawns: [
    { id: 'centipede', x: 800 }, { id: 'jump_bee', x: 910, y: 20 },
    { id: 'black_maggot', x: 1550 }, { id: 'centipede', x: 1650, y: -15 },
    { id: 'jump_bee', x: 2300 }, { id: 'black_maggot', x: 2400, y: 15 }, { id: 'centipede', x: 2500 },
    { id: 'boss_chulong', x: 3350 } ] },
  { name: '石墓·猪洞', bg: 'bg_floor11', boss: true, zone: '盟重·石墓（猪洞，原版 32–35 级怪）', spawns: [
    { id: 'red_boar', x: 800 }, { id: 'black_boar', x: 910, y: 20 },
    { id: 'scorpion_snake', x: 1550 }, { id: 'red_boar', x: 1650, y: -15 },
    { id: 'black_boar', x: 2300 }, { id: 'scorpion_snake', x: 2400, y: 15 }, { id: 'red_boar', x: 2500 },
    { id: 'boss_white_boar', x: 3350 } ] },
  { name: '沃玛寺庙', bg: 'bg_floor6', boss: true, zone: '沃玛寺庙（经沃玛森林进入）', spawns: [
    { id: 'woma_warrior', x: 800 }, { id: 'woma_warrior', x: 910, y: 20 },
    { id: 'woma_guard', x: 1550 }, { id: 'woma_warrior', x: 1650, y: -15 },
    { id: 'woma_guard', x: 2300 }, { id: 'woma_warrior', x: 2400, y: 15 },
    { id: 'boss_woma', x: 3350 } ] },
  { name: '祖玛阁', bg: 'bg_floor7', boss: true, zone: '盟重省·祖玛寺庙', spawns: [
    { id: 'zuma_statue', x: 800 }, { id: 'zuma_statue', x: 910, y: 20 },
    { id: 'zuma_guard', x: 1550 }, { id: 'zuma_statue', x: 1650, y: -15 },
    { id: 'zuma_guard', x: 2300 }, { id: 'zuma_statue', x: 2400, y: 15 },
    { id: 'boss_zuma', x: 3350 } ] },
  { name: '牛魔寺庙', bg: 'bg_floor12', boss: true, zone: '苍月岛·牛魔寺庙（原版 33–45 级怪，40 级地图）', spawns: [
    { id: 'bull_warrior', x: 800 }, { id: 'bull_mage', x: 910, y: 20 },
    { id: 'bull_guard', x: 1550 }, { id: 'bull_warrior', x: 1650, y: -15 },
    { id: 'bull_mage', x: 2300 }, { id: 'bull_guard', x: 2400, y: 15 }, { id: 'bull_warrior', x: 2500 },
    { id: 'boss_bull_king', x: 3350 } ] },
  { name: '封魔殿', bg: 'bg_floor13', boss: true, zone: '封魔谷·封魔矿区/封魔殿（原版 40 级地图）', spawns: [
    { id: 'hongmo_pig', x: 800 }, { id: 'hongmo_scorpion', x: 910, y: 20 },
    { id: 'hongmo_pig', x: 1550 }, { id: 'hongmo_pig', x: 1650, y: -15 },
    { id: 'hongmo_scorpion', x: 2300 }, { id: 'hongmo_pig', x: 2400, y: 15 }, { id: 'hongmo_pig', x: 2500 },
    { id: 'boss_hongmo', x: 3350 } ] },
  { name: '赤月魔穴', bg: 'bg_floor8', boss: true, zone: '白日门·赤月峡谷', spawns: [
    { id: 'blood_zombie', x: 800 }, { id: 'redmoon_spider', x: 910, y: 20 },
    { id: 'blood_zombie', x: 1550 }, { id: 'redmoon_spider', x: 1650, y: -15 },
    { id: 'blood_zombie', x: 2300 }, { id: 'redmoon_spider', x: 2400, y: 15 },
    { id: 'boss_redmoon', x: 3380 } ] }
];
