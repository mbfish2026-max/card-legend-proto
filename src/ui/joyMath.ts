/** feat/float-joystick：浮动摇杆纯函数（无 DOM），便于单测。 */
export const JOY_R = 44;            // 拇指最大位移（底盘 120px 直径，拇指 48px）
export const JOY_DEAD_X = 0.35;     // 横向死区（×R）
export const JOY_DEAD_Y = 0.5;      // 纵向死区（×R，纵向用于上/下入口，死区更大防误触）
export const JOY_TOP_PX = 64;       // 激活区上沿：safe-area 顶 + 64px 以下（避开顶栏/层名/进度条）
export const JOY_ZONE_W = 0.5;      // 激活区：左半屏
/** 拇指偏移钳制在半径内（底盘不跟随） */
export function joyClamp(x: number, y: number, R = JOY_R): [number, number] {
  const d = Math.hypot(x, y); return d > R ? [x * R / d, y * R / d] : [x, y];
}
/** 偏移 → 方向（-1/0/1），带死区 */
export function joyDir(x: number, y: number, R = JOY_R): [number, number] {
  const [cx, cy] = joyClamp(x, y, R);
  return [Math.abs(cx) > R * JOY_DEAD_X ? Math.sign(cx) : 0, Math.abs(cy) > R * JOY_DEAD_Y ? Math.sign(cy) : 0];
}
/** 按下点是否在激活区（左半屏、顶部条以下） */
export function inJoyZone(x: number, y: number, vw: number, safeTop = 4): boolean {
  return x >= 0 && x < vw * JOY_ZONE_W && y > safeTop + JOY_TOP_PX;
}
