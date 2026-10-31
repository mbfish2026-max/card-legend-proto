// 「不要重复使用小怪素材」：每个怪物/BOSS 的立绘文件唯一且存在；异界裂隙 57–80 背景按 key N → 第 N 层（下标 N−1）接线
// @ts-ignore 测试运行于 node（tsx），项目未装 @types/node
import { existsSync } from 'node:fs';
import { ENEMIES } from '../src/data/units';
import { FLOORS } from '../src/data/world';
import { ASSETS } from '../src/assets-manifest';
let pass = 0; const ok = (c: unknown, m: string) => { if (!c) { console.error('FAIL ' + m); throw new Error(m); } pass++; console.log('ok ' + m); };
/** 允许共用（显式名单 + 原因）。key = 立绘文件，value = 允许共用的单位 id */
const ALLOWED_SHARE: Record<string, { ids: string[]; why: string }> = {
  'assets/portraits/boss_molong_full.png': { ids: ['boss_molong', 'boss_hj_home'], why: '魔龙守将与魔龙教主按 art/sq-mir3 108d607 有意共用（m4-official 美术注记）；boss_hj_home_full.png 未交付' },
  'assets/portraits/boss_orc_chief_full.png': { ids: ['orc_chief', 'boss_wolong'], why: '卧龙名将 boss_wolong_full.png 未交付（合击版 BOSS，待美术），暂借兽人酋长' },
  'assets/portraits/boss_redmoon_full.png': { ids: ['boss_redmoon', 'boss_leiyan', 'boss_fire_dragon'], why: '雷炎蛛王/火龙 boss_leiyan_full.png、boss_fire_dragon_full.png 未交付（合击版 BOSS，待美术），暂借赤月恶魔' },
};
const by: Record<string, string[]> = {};
for (const u of Object.values(ENEMIES)) {
  const key = u.art ?? u.id; const f = ASSETS[key];
  ok(!!f && existsSync('public/' + f), `${u.name}(${u.id}) 立绘 ${key} → ${f} 存在`);
  (by[f] ??= []).push(u.id);
}
for (const [f, ids] of Object.entries(by)) if (ids.length > 1) {
  const a = ALLOWED_SHARE[f]; ok(!!a && ids.every(i => a.ids.includes(i)), `共用立绘 ${f}：${ids.join(',')} 在允许名单内${a ? '（' + a.why + '）' : ''}`);
}
const FIX = ['hj_guard', 'wolong_guard', 'fire_dragon_guard', 'leiyan_spider', 'cave_skel_warrior', 'cave_skel_general', 'axe_skeleton', 'cave_bat', 'cave_maggot', 'dark_warrior', 'dung_beetle', 'fire_woma', 'giant_worm', 'horn_fly', 'mine_zombie', 'pincer_bug', 'wedge_moth', 'woma_brave', 'woma_general'];
for (const id of FIX) ok(ASSETS[ENEMIES[id].art ?? id] === `assets/portraits/${id}_full.png`, `${id} 用自身 ${id}_full.png`);
for (let i = 55; i < 79; i++) for (const s of FLOORS[i].spawns) { const u = ENEMIES[s.id]; if (u) ok(ASSETS[u.art ?? u.id] === `assets/portraits/${u.id}_full.png`, `第${i + 1}层 ${u.id} 用自身立绘`); }
for (let n = 57; n <= 80; n++) { const f = FLOORS[n - 1]; ok(f.bg === `bg_floor${n}` && !!ASSETS[f.bg!] && existsSync('public/' + ASSETS[f.bg!]), `第${n}层 ${f.name} 背景 ${f.bg} → ${ASSETS[f.bg!]} 存在`); }
console.log(`art-unique: ${pass} passed`);
