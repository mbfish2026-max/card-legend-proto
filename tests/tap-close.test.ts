// feat/mobile-tapclose：手机版对比面板点外部关闭的判定逻辑
import { shouldTapClose, isTap, TAP_SLOP } from '../src/ui/tapClose';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
const T = (o: Partial<{ dx: number; dy: number; inside: boolean; slot: boolean }> = {}) => ({ downX: 100, downY: 100, upX: 100 + (o.dx ?? 0), upY: 100 + (o.dy ?? 0), insidePanel: !!o.inside, onSlot: !!o.slot });
ok(shouldTapClose(T(), true, true), '手机：点空白关闭');
ok(!shouldTapClose(T({ inside: true }), true, true), '点面板内部不关');
ok(!shouldTapClose(T({ slot: true }), true, true), '点其他装备格不关（交给格子切换）');
ok(!shouldTapClose(T({ dx: 9 }), true, true), '拖动 9px 不算点击');
ok(shouldTapClose(T({ dx: 6, dy: 5 }), true, true), '7.8px 仍算点击');
ok(isTap({ downX: 0, downY: 0, upX: TAP_SLOP, upY: 0 }) && !isTap({ downX: 0, downY: 0, upX: 0, upY: TAP_SLOP + 1 }), `阈值 ${TAP_SLOP}px`);
ok(!shouldTapClose(T(), false, true), '桌面不触发');
ok(!shouldTapClose(T(), true, false), '没打开面板不触发');
console.log(`tap-close: ${pass} passed`);
