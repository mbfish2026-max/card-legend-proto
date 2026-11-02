// feat/float-joystick：方向/死区/钳制/激活区纯函数
import { joyClamp, joyDir, inJoyZone, JOY_R } from '../src/ui/joyMath';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const eq = (a: number[], b: number[]) => a[0] === b[0] && a[1] === b[1];
ok(eq(joyDir(30, 0), [1, 0]) && eq(joyDir(-30, 0), [-1, 0]), '左右');
ok(eq(joyDir(0, -30), [0, -1]) && eq(joyDir(0, 30), [0, 1]), '上下');
ok(eq(joyDir(0, 0), [0, 0]) && eq(joyDir(15, 0), [0, 0]) && eq(joyDir(0, 21), [0, 0]), '死区内无方向（横 0.35R≈15.4，纵 0.5R=22）');
ok(eq(joyDir(16, 0), [1, 0]) && eq(joyDir(0, 23), [0, 1]), '刚出死区即有方向');
ok(eq(joyDir(400, 10), [1, 0]), '远超半径仍按方向，纵向小偏移不触发');
const [x, y] = joyClamp(300, 400); ok(Math.abs(Math.hypot(x, y) - JOY_R) < 1e-9 && Math.abs(x / y - 0.75) < 1e-9, '超半径钳在半径上、方向不变');
ok(eq(joyClamp(10, 10), [10, 10]), '半径内不钳');
ok(inJoyZone(100, 300, 844) && inJoyZone(421, 200, 844), '左半屏顶栏以下激活');
ok(!inJoyZone(423, 300, 844) && !inJoyZone(100, 60, 844), '右半屏/顶栏不激活');
console.log(`float-joystick: ${pass} ok`);
