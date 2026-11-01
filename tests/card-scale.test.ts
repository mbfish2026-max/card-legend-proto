// 卡牌本体不放大：动作关键帧 ≤1；姿态帧换纹理后按固定显示高度归一化；场景内不对卡牌容器做 scale tween
const { readFileSync } = await import('node:' + 'fs') as any;
import { SWING_SCALE, WINDUP_SCALE, HIT_SCALE, breathScaleY } from '../src/ui/cardMotion';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; console.log('ok', m); };
for (const [k, v] of Object.entries({ SWING_SCALE, WINDUP_SCALE, HIT_SCALE })) ok(v.x <= 1 && v.y <= 1, `${k} ≤ 1`);
ok(Array.from({ length: 400 }, (_, i) => breathScaleY(i * 0.05)).every(y => y <= 1), '呼吸全程 ≤ 1');
const cv = readFileSync('src/ui/CardView.ts', 'utf8'), bs = readFileSync('src/scenes/BattleScene.ts', 'utf8');
const pose = cv.slice(cv.indexOf('showPose(key'), cv.indexOf('private fitArt'));
ok((pose.match(/setTexture\([^)]*\);\s*this\.fitArt\(\)/g) ?? []).length === 2, 'showPose 换帧/还原后都 fitArt 归一化（构建后立绘 webp 640px vs 姿态帧原图）');
ok(!/targets:\s*(v|sv|tv|view)\b[^}]*\bscale/.test(bs), 'BattleScene 不对卡牌容器做 scale tween（狂暴改为跳动）');
const atk = bs.indexOf("showPose?.(sv0.unit.id + '_atk')"), anim = bs.indexOf('const r = playCombatAnim(e');
ok(atk > 0 && atk < anim, '攻击姿态帧在 swing 之前换（动作取归一化后的基准）');
const hurt = bs.indexOf("+ '_hurt', 220)"); ok(hurt > 0 && hurt < bs.indexOf('playCombatAnim(e, uid => this.views.get(uid)); // 受击'), '受伤姿态帧在 hit 之前换');
console.log(`card-scale: ${n} ok`);
