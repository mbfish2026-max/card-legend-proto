/** 药水格尺寸（MobileHud 与 domSkin 共用，避免循环引用） */
/** 药水键边长（CSS px，≥44）；技能弧最左键左缘距右安全区 = 外圈半径 + 25 + 50，药水再留 8px，避免挤占技能栏 */
export const POT_CSS = 56;
/** fix/mobile-potion-clip：药水格框的 CSS 宽（T R B L）。btn_normal 1x 边距 14/16 在 56px 格里会把图标边和数量数字盖住，药水格用一半宽 */
export const POT_FRAME = [7, 8, 7, 8] as const;
/** 药水图标边长 = 格内净空（扣掉框和 2px 留白） */
export const POT_ICON = POT_CSS - POT_FRAME[1] - POT_FRAME[3] - 4;
