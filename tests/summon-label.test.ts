import { summonNameColor, SUMMON_NAME_COLORS, summonOwnerLabel, summonDisplayName, summonNameParts, fitSummonName } from '../src/combat/summonLabel';
import { World, SUMMON_LV_KILLS } from '../src/combat/World';
import { FLOORS, WORLD } from '../src/data/world';
let n = 0; const ok = (c: boolean, m: string) => { if (!c) throw new Error('FAIL ' + m); n++; };
const blue = (c: string) => { const v = parseInt(c.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255; return b > r && b > g; };
// 等级 → 颜色
ok(summonNameColor(0) === '#ffffff', '0 级白');
for (let l = 1; l <= 7; l++) ok(blue(summonNameColor(l)), `${l} 级蓝`);
ok(summonNameColor(7) === SUMMON_NAME_COLORS[7] && summonNameColor(9) === SUMMON_NAME_COLORS[7], '满级/超满级仍为满级蓝');
ok(summonNameColor(-1) === '#ffffff' && summonNameColor(NaN) === '#ffffff', '非法等级回退白');
for (let l = 2; l <= 7; l++) ok(parseInt(summonNameColor(l).slice(5), 16) + parseInt(summonNameColor(l).slice(3, 5), 16) < parseInt(summonNameColor(l - 1).slice(5), 16) + parseInt(summonNameColor(l - 1).slice(3, 5), 16), `${l} 级比 ${l - 1} 级深`);
// 名字与回退
ok(summonOwnerLabel('阿强', 'taoist') === '阿强', '有角色名用角色名');
ok(summonOwnerLabel('  ', 'taoist') === '道士' && summonOwnerLabel(undefined, 'mage') === '法师' && summonOwnerLabel(null, 'warrior') === '战士', '无角色名回退职业名');
ok(summonDisplayName('骷髅', 3, '道士') === '骷髅·3级 道士的宠物', '格式');
// 长名字自适应（等宽假测量：每字 size px）
const m = (t: string, s: number) => [...t].length * s;
let f = fitSummonName(summonNameParts('骷髅', 1, '道士'), m, { max: 12, min: 10, maxW: 120 });
ok(f.lines.length === 1 && f.size === 10, '短名单行缩字号');
f = fitSummonName(summonNameParts('金甲骷髅', 7, '道士'), m, { max: 12, min: 10, maxW: 120 });
ok(f.lines.length === 2 && f.lines[1] === '道士的宠物', '放不下 → 两行');
f = fitSummonName(summonNameParts('骷髅', 2, '一二三四五六七八九十十一十二'), m, { max: 12, min: 10, maxW: 100 });
ok(f.lines.length === 2 && f.lines.every(l => m(l, f.size) <= 100) && f.lines[1].endsWith('…的宠物') && f.lines[1].startsWith('一') && !/[（）()]/.test(f.lines.join('')), '超长角色名截断仍保留「的宠物」');
// World：道士骷髅 / 法师宠物 共用规则
const w = new World(() => 0.01, 30, FLOORS, 'taoist'); (w as any).ownerName = '';
const h = w.hero!; const sk: any = { hp: 100, atk: 10, start: 0, name: '骷髅' };
const fake: any = { ...h, uid: 9991, summon: true, sLv: 0, sKills: 0, sBase: sk, maxHp: 100, hp: 100, isHero: false };
w.applySummonLv(fake); ok(fake.name === '骷髅·0级 道士的宠物' && fake.nameColor === '#ffffff', '道士骷髅名字');
(w as any).ownerName = '小明'; fake.sLv = 7; w.applySummonLv(fake); ok(fake.name === '骷髅·7级 小明的宠物' && fake.nameColor === SUMMON_NAME_COLORS[7], '角色名 + 满级蓝');
const wm = new World(() => 0.01, 30, FLOORS, 'mage');
const pet: any = { ...h, uid: 9992, summon: true, pet: true, sLv: 1, sKills: 0, sBase: { hp: 200, atk: 20, start: 1, name: '钉耙猫' }, maxHp: 200, hp: 200, atk: 20, isHero: false };
wm.applySummonLv(pet); ok(pet.name === '钉耙猫·1级 法师的宠物' && pet.nameColor === summonNameColor(1) && pet.maxHp === Math.round(200 * WORLD.summonSurvHp) && pet.atk === 20, '法师宠物同格式；同级只乘生存血量、攻击不变');
pet.sLv = 5; wm.applySummonLv(pet); ok(pet.maxHp > 200 && pet.nameColor === summonNameColor(5), '法师宠物升级成长 + 变色');
ok(SUMMON_LV_KILLS.length === 8, '等级阈值表');
console.log(`summon-label: ${n} ok`);
