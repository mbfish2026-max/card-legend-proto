// balance-sys 阶段4：黑铁矿只能挖矿获得；祝福油只由高级 BOSS 掉落。见 docs/drop-plan.md「祝福油 / 黑铁矿」
/** 有矿的层（下标）：比奇矿区（废矿入口/废矿区东部/矿区一层/矿区·桥/矿区B二层）+ 毒蛇山谷·山谷矿区一/二。
 * 出处：传奇永恒官方资料站「挖矿：只有在矿区才能挖矿……产出金/银/铜/铁和黑铁矿石」https://actcq.web.sdo.com/project/2016/web/0428dataStation/content.aspx?aid=247754 ；
 * 17173「毒蛇山谷矿区……也可以挖矿」https://mir.17173.com/content/2022-06-16/20220616183105995.shtml 。
 * 石墓/封魔矿区等是否有矿：官方未查到 → 不放。 */
export const MINE_FLOORS = [27, 28, 29, 30, 31, 32, 33];
/** 读条秒数 [适配]（官方为连续挥锄，无读条） */
export const MINE_CAST = 4;
/** 矿点刷新间隔（游戏秒）[适配]：官方「单点连挖会暂时枯竭」，具体时长未查到 */
export const MINE_RESPAWN = 300;
/** 交互半径（px） */
export const MINE_RADIUS = 120;
/** 矿点位置：本层宽度的 45% 处（避开起点回城口与右端出口） */
export const mineX = (mapW: number) => Math.round(mapW * 0.45);
/** 产出纯度 1–3 [适配]（官方纯度 5–25 量级与本作 1–IRON_MAX_PURITY 强化体系不同；越深矿层上限越高） */
export const minePurity = (floorIndex: number, r: number) => 1 + Math.floor(r * (floorIndex >= 31 ? 3 : 2));
/** 祝福油：只由高级 BOSS 掉。名单 = 1.76 版祝福油掉落怪（thelegendofmir2 物品库 https://www.thelegendofmir2.com/item/e557bdf0f3dd51da6e1817a342d95c26.html ）
 * ∩ 本作等级 ≥28 的 BOSS；掉率官方「未查到」→ [适配] 1/8 */
export const OIL_BOSSES = ['boss_zuma', 'boss_bull_king', 'boss_hongmo', 'boss_redmoon', 'boss_huangquan', 'boss_twinhead_kong', 'boss_twinhead_blood'];
export const OIL_RATE = 1 / 8;
