/** feat/balance-sys：sq-mir3 立绘接入、层长/怪量、层结构、BOSS 600s、回城卷轴 */
import { ENEMIES } from '../src/data/units';
import { ASSETS } from '../src/assets-manifest';
const { existsSync } = await import('node:' + 'fs') as any;
let pass = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); throw new Error(m); } pass++; console.log('ok', m); };

// ---- art-wire sq-mir3 ----
{
  const ids = Object.keys(ENEMIES).filter(k => /^(boss_)?(sq|m3)_/.test(k));
  ok(ids.length === 63, `sq-mir3 怪 63 个（${ids.length}）`);
  ok(ids.every(k => ENEMIES[k].art === k && ASSETS[k] && existsSync('public/' + ASSETS[k])), 'sq-mir3 怪立绘 art=id 且文件存在');
  for (const n of [57, 58, 62, 66, 69, 73, 76, 80]) ok(existsSync('public/' + ASSETS['bg_floor' + n]) && /bg_floor(57|62|69|76|80)\.jpg$/.test(ASSETS['bg_floor' + n]), `bg_floor${n} 用第8批合层背景`);
}
//@@MORE@@
console.log(`balance-sys 测试通过（${pass}）`);
