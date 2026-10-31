// 长列表滚动范围计算（src/ui/scrollList.ts）
import { scrollMax, clampOff, visibleRange, dragOff, wheelOff, isTap, thumb, SCROLL_TAP_PX } from '../src/ui/scrollList';
import { FLOORS } from '../src/data/world';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const N = FLOORS.length, V = 7;
ok(N >= 82, `最大传送列表 = 全部 ${N} 层`);
ok(scrollMax(N, V) === N - V && scrollMax(5, V) === 0, '可滚动范围 = n − 可视行数；不足一屏不滚');
ok(clampOff(-3, N, V) === 0 && clampOff(999, N, V) === N - V, '偏移夹在 [0, n−vis]');
const [a, b] = visibleRange(999, N, V); ok(b === N && b - a === V, '滚到底：最后一项在可视窗口内');
ok(dragOff(0, -50 * 3, 50, N, V) === 3 && dragOff(2, 500, 50, N, V) === 0, '上拖 3 行 → 偏移 3；下拖到顶夹 0');
let o = 0; for (let i = 0; i < N; i++) o = wheelOff(o, 120, N, V); ok(o === N - V, `滚轮 ${N} 格到底`);
ok(isTap(SCROLL_TAP_PX) && !isTap(SCROLL_TAP_PX + 1), `拖动 > ${SCROLL_TAP_PX}px 不算点击`);
const t0 = thumb(0, N, V, 350), t1 = thumb(N - V, N, V, 350); ok(t0.y === 0 && Math.abs(t1.y + t1.h - 350) < 1e-6 && t0.h >= 20, '滚动条滑块顶/底对齐');
console.log(`scroll-list: ${pass} passed`);
