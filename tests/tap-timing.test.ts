// feat/potion-expand：手机点按时序（双击解包/短按药水不稳的修复）
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { readFileSync } from 'node:fs';
declare const process: { exit(n: number): void };
import { flushInput } from '../src/ui/flushInput';
let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) { pass++; console.log('  ok', m); } else { fail++; console.log('  FAIL', m); } };
const cleared: unknown[] = [];
const a = { n: 'a' }, b = { n: 'b' }, c = { n: 'c' };
const ip: any = { _list: [a, b], _pendingRemoval: [a], _pendingInsertion: [c], clear(g: unknown) { cleared.push(g); } };
flushInput({ input: ip });
ok(ip._list.length === 2 && ip._list[0] === b && ip._list[1] === c, 'flushInput：待删移出、待插并入命中表（重绘后立即可点）');
ok(ip._pendingRemoval.length === 0 && ip._pendingInsertion.length === 0 && cleared[0] === a, 'flushInput：清空待处理队列并 clear 被删对象');
flushInput({ input: undefined }); flushInput({ input: { } }); ok(true, 'flushInput：无输入插件时安全跳过');
const P = readFileSync('src/ui/Panel.ts', 'utf8'), B = readFileSync('src/ui/potBar.ts', 'utf8');
ok(/render\(\) \{ this\.renderInner\(\); flushInput\(this\.s\); \}/.test(P), 'Panel.render 重绘后立即 flushInput');
ok(/if \(this\.sel \|\| this\.s\.time\.now - this\.lastDown < Panel\.AUTO_REFRESH_MS\) return false;/.test(P), '自动重绘避让：已选中（等第二下）或刚按下时不重建');
ok(/t0 = ev\.timeStamp/.test(B) && /const held = ev\.timeStamp - t0/.test(B) && /if \(held < LONG_MS\) \{ if \(long\) this\.close\(\)/.test(B), '手机药水格长按按事件时间戳判定，卡顿误开的弹层在抬起时关闭并按短按用药');
console.log(`\ntap-timing: ${pass} ok, ${fail} fail`); if (fail) process.exit(1);
