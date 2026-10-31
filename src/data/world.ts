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
  bagSize: 200, // feat/bag-200：用户要求扩到 200 格（[适配]；原版格数此处未查证）；面板分页 30 格/页
  deathGoldLoss: 0.1,          // 死亡损失金币比例
  summonLane: -36,             // 召唤物站位（纵深偏后）
};
export interface Spawn { id: string; x: number; y?: number }
export interface Floor { name: string; spawns: Spawn[]; boss?: boolean; bg?: string; /** 来源链接 */ src?: string; /** 官方多层图中的第几层（1 起） */ depth?: number; /** 图群 id */ group?: string; /** 官方子层名 */ sub?: string; /** R11 对应原版区域（docs/legend-research.md「地图递进」） */ zone?: string; /** 练级图：小怪死后定时原地刷新（[适配]，见 FARM_RESPAWN） */ farm?: boolean }
/** 练级图小怪刷新间隔（秒）。官方各图刷怪间隔未查到 → [适配] 20s，且主角在 400px 内时顺延，避免贴脸刷出 */
export const FARM_RESPAWN = 20, FARM_SAFE_DIST = 400;
export const FLOORS: Floor[] = [
  { name: '幽暗森林', bg: 'bg_floor1', boss: true, farm: true, zone: '比奇省·新手村周边（原版 1–7 级）', spawns: [
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
    { id: 'boss_redmoon', x: 3380 } ] },
  // feat/maps-more（plan-60h B1）：洞穴群子层追加在下标 13–18（旧档下标不变；白骨墓穴=兽人古墓一层 D001 原样保留）。depth=官方第几层
  { name: '兽人古墓二层', bg: 'bg_floor14', boss: true, farm: true, group: 'shouren', sub: '兽人古墓二层 D002', depth: 2, zone: '比奇省·兽人古墓二层（21cq：洞蛆/骷髅战士/掷斧骷髅/骷髅战将/骷髅/山洞蝙蝠 8 分钟，骷髅精灵×1 60 分钟）', src: 'https://www.21cq.com/mir/Map.aspx?id=218', spawns: [
    { id: 'skeleton', x: 800 }, { id: 'cave_skel_warrior', x: 900, y: 20 }, { id: 'axe_skeleton', x: 1500 }, { id: 'cave_skel_general', x: 1600, y: -15 }, { id: 'cave_maggot', x: 1700 }, { id: 'cave_bat', x: 2300 }, { id: 'cave_skel_warrior', x: 2400, y: 15 }, { id: 'axe_skeleton', x: 2500 }, { id: 'skeleton_lord', x: 3350 } ] },
  { name: '兽人古墓三层', bg: 'bg_floor15', boss: true, farm: true, group: 'shouren', sub: '兽人古墓三层 D003', depth: 3, zone: '兽人古墓三层（21cq：同二层，骷髅精灵×2 60 分钟；连通沃玛自然洞穴）', src: 'https://www.21cq.com/mir/Map.aspx?id=221', spawns: [
    { id: 'cave_skel_general', x: 800 }, { id: 'cave_skel_warrior', x: 900, y: 20 }, { id: 'axe_skeleton', x: 1500 }, { id: 'skeleton', x: 1600, y: -15 }, { id: 'cave_maggot', x: 1700 }, { id: 'cave_bat', x: 2300 }, { id: 'cave_skel_general', x: 2400, y: 15 }, { id: 'axe_skeleton', x: 2500 }, { id: 'skeleton_lord', x: 3350 } ] },
  { name: '骷髅洞·洞穴一层', bg: 'bg_floor16', boss: true, farm: true, group: 'tianran', sub: '洞穴一层 D011', depth: 1, zone: '比奇省·天然洞穴一层（21cq：骷髅/骷髅战士/蝎子/山洞蝙蝠/洞蛆 8 分钟，骷髅精灵×1 60 分钟）', src: 'https://www.21cq.com/mir/Map.aspx?id=248', spawns: [
    { id: 'skeleton', x: 800 }, { id: 'cave_skel_warrior', x: 900, y: 20 }, { id: 'scorpion', x: 1500 }, { id: 'cave_bat', x: 1600, y: -15 }, { id: 'cave_maggot', x: 1700 }, { id: 'skeleton', x: 2300 }, { id: 'cave_skel_warrior', x: 2400, y: 15 }, { id: 'scorpion', x: 2500 }, { id: 'skeleton_lord', x: 3350 } ] },
  { name: '骷髅洞·洞穴二层', bg: 'bg_floor17', boss: true, farm: true, group: 'tianran', sub: '洞穴二层 D012', depth: 2, zone: '天然洞穴二层（21cq：骷髅/战士/战将/掷斧/蝎子/洞蛆/蝙蝠 8 分钟，骷髅精灵×2 60 分钟；连通沃玛自然洞穴）', src: 'https://www.21cq.com/mir/Map.aspx?id=249', spawns: [
    { id: 'skeleton', x: 800 }, { id: 'cave_skel_warrior', x: 900, y: 20 }, { id: 'cave_skel_general', x: 1500 }, { id: 'axe_skeleton', x: 1600, y: -15 }, { id: 'scorpion', x: 1700 }, { id: 'cave_maggot', x: 2300 }, { id: 'cave_bat', x: 2400, y: 15 }, { id: 'cave_skel_general', x: 2500 }, { id: 'skeleton_lord', x: 3350 } ] },
  { name: '沃玛自然洞穴·一', bg: 'bg_floor18', boss: false, farm: true, group: 'woma_cave', sub: '沃玛自然洞穴 E001', depth: 1, zone: '沃玛自然洞穴 E001（21cq：骷髅系/山洞蝙蝠/洞蛆 23 分钟，无 BOSS；连通兽人古墓三层）', src: 'https://www.21cq.com/mir/Map.aspx?id=1506', spawns: [
    { id: 'skeleton', x: 800 }, { id: 'cave_skel_warrior', x: 900, y: 20 }, { id: 'axe_skeleton', x: 1500 }, { id: 'cave_bat', x: 1600, y: -15 }, { id: 'cave_skel_general', x: 1700 }, { id: 'cave_maggot', x: 2300 }, { id: 'cave_skel_general', x: 2400, y: 15 }, { id: 'cave_skel_warrior', x: 2500 } ] },
  { name: '沃玛自然洞穴·二', bg: 'bg_floor19', boss: false, farm: true, group: 'woma_cave', sub: '沃玛自然洞穴 E002', depth: 2, zone: '沃玛自然洞穴 E002（21cq：同 E001，无 BOSS；连通洞穴二层）', src: 'https://www.21cq.com/mir/Map.aspx?id=1507', spawns: [
    { id: 'cave_skel_warrior', x: 800 }, { id: 'axe_skeleton', x: 900, y: 20 }, { id: 'cave_skel_general', x: 1500 }, { id: 'cave_bat', x: 1600, y: -15 }, { id: 'cave_maggot', x: 1700 }, { id: 'skeleton', x: 2300 }, { id: 'cave_skel_general', x: 2400, y: 15 }, { id: 'axe_skeleton', x: 2500 } ] },
  // 合击版 #8（合并 main 后下标 19–22，排在洞穴群 13–18 之后）（docs/hejiban-official.md §4）：追加在末尾，旧存档层号不变
  { name: '保卫家园', bg: 'bg_floor20', boss: true, zone: '合击·英雄地（保卫家园四连本合为一层 [适配]，官方 40 级）', spawns: [
    { id: 'hj_guard', x: 800 }, { id: 'redmoon_spider', x: 910, y: 20 },
    { id: 'hj_guard', x: 1550 }, { id: 'redmoon_spider', x: 1650, y: -15 },
    { id: 'hj_guard', x: 2300 }, { id: 'redmoon_spider', x: 2400, y: 15 },
    { id: 'boss_hj_home', x: 3380 } ] },
  { name: '卧龙山庄', bg: 'bg_floor21', boss: true, zone: '盟重卧龙笔记(330,340)·卧龙山庄（官方 47 级）', spawns: [
    { id: 'wolong_guard', x: 800 }, { id: 'hj_guard', x: 910, y: 20 },
    { id: 'wolong_guard', x: 1550 }, { id: 'hj_guard', x: 1650, y: -15 },
    { id: 'wolong_guard', x: 2300 }, { id: 'hj_guard', x: 2400, y: 15 },
    { id: 'boss_wolong', x: 3380 } ] },
  { name: '雷炎洞穴', bg: 'bg_floor22', boss: true, zone: '盟重店小二(382,308)·雷炎洞穴（官方 47 级，2 层合 1 [适配]）', spawns: [
    { id: 'leiyan_spider', x: 800 }, { id: 'wolong_guard', x: 910, y: 20 },
    { id: 'leiyan_spider', x: 1550 }, { id: 'wolong_guard', x: 1650, y: -15 },
    { id: 'leiyan_spider', x: 2300 }, { id: 'wolong_guard', x: 2400, y: 15 },
    { id: 'boss_leiyan', x: 3380 } ] },
  { name: '火龙神殿', bg: 'bg_floor23', boss: true, zone: '火龙神殿（1.90 终章，入口/等级未查到）', spawns: [
    { id: 'fire_dragon_guard', x: 800 }, { id: 'leiyan_spider', x: 910, y: 20 },
    { id: 'fire_dragon_guard', x: 1550 }, { id: 'leiyan_spider', x: 1650, y: -15 },
    { id: 'fire_dragon_guard', x: 2300 }, { id: 'leiyan_spider', x: 2400, y: 15 },
    { id: 'boss_fire_dragon', x: 3380 } ] },
  // 阶段 B #9 下标 23：魔龙血域（魔龙教主）。侧线层：不进 FLOOR_ORDER（主线模拟/通关不受影响），清层后回城、不判通关
  { name: '魔龙血域', bg: 'bg_floor24', boss: true, zone: '魔龙城·魔龙血域（魔龙教主，6 小时刷新；入口等级未查到）', src: 'https://www.21cq.com/chuanqi/628.html', spawns: [
    { id: 'fire_dragon_guard', x: 800 }, { id: 'hj_guard', x: 910, y: 20 },
    { id: 'fire_dragon_guard', x: 1550 }, { id: 'wolong_guard', x: 1650, y: -15 },
    { id: 'fire_dragon_guard', x: 2300 }, { id: 'leiyan_spider', x: 2400, y: 15 },
    { id: 'boss_molong', x: 3380 } ] }
];
/** 侧线层（不在通关顺序里，清完回城） */
export const SIDE_FLOORS: readonly number[] = [23];
/** 通关顺序：兽人古墓一层(白骨墓穴)→二层→三层→洞穴一层→二层→沃玛自然洞穴一→二→尸王殿…（按 21cq 进出表连通） */
export const FLOOR_ORDER = [0, 1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 21, 22];
/** 图群：白骨墓穴（下标 4）作为兽人古墓一层 */
export const FLOOR_GROUP: Record<number, { group: string; depth: number }> = { 4: { group: 'shouren', depth: 1 } };
export const groupOf = (i: number, floors: Floor[] = FLOORS) => floors[i]?.group ?? (floors === FLOORS ? FLOOR_GROUP[i]?.group : undefined);
/** 同图群上一层下标（无则 -1），用于「上一层」入口 */
export const prevLayerOf = (i: number, floors: Floor[] = FLOORS) => { const g = groupOf(i, floors); if (!g || floors !== FLOORS) return -1; const k = FLOOR_ORDER.indexOf(i); const p = FLOOR_ORDER[k - 1]; return p !== undefined && groupOf(p) === g ? p : -1; };
/** 通关顺序上的前一层（无则 -1）；自定义层表线性 */
export const prevFloorOf = (i: number, floors: Floor[] = FLOORS) => floors !== FLOORS ? i - 1 : (FLOOR_ORDER[FLOOR_ORDER.indexOf(i) - 1] ?? -1);
/** [适配] 层深难度（plan-60h §4：每深一层 HP/ATK 约 +8%）；原有层无 depth 不受影响 */
export const DEPTH_STEP = 0.08;
/** 下标 i 的通关序号（1 起，显示「第 N 层」用）；非默认层表按下标 */
export const floorNo = (i: number, floors: Floor[] = FLOORS) => floors === FLOORS && FLOOR_ORDER.includes(i) ? FLOOR_ORDER.indexOf(i) + 1 : i + 1;
/** 下一层下标；最后一层返回 -1 */
export const nextFloorOf = (i: number, floors: Floor[] = FLOORS) => { if (floors !== FLOORS) return i + 1 < floors.length ? i + 1 : -1; const k = FLOOR_ORDER.indexOf(i); return k >= 0 && k + 1 < FLOOR_ORDER.length ? FLOOR_ORDER[k + 1] : -1; };

