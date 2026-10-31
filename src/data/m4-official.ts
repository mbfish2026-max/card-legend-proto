/** M4 新怪原版资料（21cq 1.76 资料站 Mob 页等）。只记录查到的；查不到写「未查到」。本作数值见 units.ts（[适配]） */
export interface M4Official {
  id: string; name: string; boss: string; level: string; hp: string; atk: string; def: string; mdef: string; exp: string; interval: string;
  behavior: string; drops: string; respawn: string; map: string; src: string; extra?: string;
  /** 本作 [适配] 说明 */ adapt: string; /** 原版掉落中本作未实装的物品 */ missing: string;
}
const C = (id: number) => `https://www.21cq.com/mir/Mob.Aspx?ID=${id}`;
export const M4_OFFICIAL: M4Official[] = [
  { id: 'boss_yeti_king', name: '雪人王', boss: 'BOSS（17173「白日门专属BOSS」；21cq BOSS 列表未收录）', level: '50', hp: '1300', atk: '80-80', def: '20', mdef: '20', exp: '400', interval: '2000ms',
    behavior: '未查到（21cq 只有属性，不死系）', drops: '未查到（21cq 掉落表为空）', respawn: '120 分钟，2 只', map: '白日门 (348,132)', src: C(33), extra: 'http://mir.17173.com/content/2023-01-11/20230111174501762.shtml',
    adapt: '本作 37 级 / HP 15000 基数 / 攻 104 / 防 27：取火龙(36)与魔龙教主(38)之间一档；行为=通用 BOSS 近战（无专属机制，行为未查到）；掉落未查到 → 只给药水+金币', missing: '—（掉落未查到）' },
  { id: 'rake_cat_king', name: '钉耙猫王', boss: '普通（精英）', level: '50', hp: '1200', atk: '20-130', def: '15', mdef: '25', exp: '350', interval: '2300ms',
    behavior: '未查到（不死系，反隐身）', drops: '太阳水/金创药(中)/魔法药(中) 1/2；重盔甲/灵魂战衣/魔法长袍/金戒指等 1/8；降魔/破魂/斩马刀/偃月等 1/5；狂风戒指等 1/200', respawn: '120 分钟，1 只', map: '白日门 (380,270)', src: C(32),
    adapt: '本作 34 级 / HP 1950 / 攻 86 / 防 24：取火龙守卫(33)后一档；通用近战', missing: '太阳水、蓝翡翠项链、金手镯、道德/魅力/黑色水晶/蛇眼/珍珠/生铁/骷髅戒指、道士/黑檀/小手镯、白色虎齿/白金项链、狂风戒指、夏普儿/辟邪手镯、躲避手链' },
  { id: 'orc_commander', name: '半兽统领', boss: '普通（精英）', level: '50', hp: '700', atk: '24-36', def: '12', mdef: '25', exp: '500', interval: '1800ms',
    behavior: '未查到（生物系）', drops: '强效太阳水/太阳水/疗伤药/强效金创药/强效魔法药 1/2；重盔甲等 1/8；降魔/破魂/斩马刀/偃月等 1/5；罗刹等 1/200', respawn: '60 分钟（白日门 4/4/6/4 只，封魔谷 2 只）', map: '白日门 多点；封魔谷 (322,334)', src: C(42),
    adapt: '本作 34 级 / HP 1900 / 攻 84 / 防 24；通用近战', missing: '强效太阳水、太阳水、疗伤药、强效金创药、强效魔法药、各类首饰（同钉耙猫王）、魔力手镯、罗刹' },
  { id: 'evil_lich', name: '恶灵尸王', boss: '普通', level: '35', hp: '500', atk: '17-45', def: '4', mdef: '8', exp: '460', interval: '2000ms',
    behavior: '未查到（不死系）', drops: '药水 1/200–1/400；戒指/手镯 1/800–1/5000；凝霜 1/1000；死神手套 1/2000；群体治疗术/圣言术等技能书', respawn: '10 分钟（尸魔洞 1–3 层、骨魔洞一层，多点 20–60 只）', map: '尸魔洞一~三层、骨魔洞一层', src: C(198), extra: 'https://actcq.web.sdo.com/project/2015/CqIntro/monster/mst_cangyuedao.html',
    adapt: '本作 34 级 / HP 1850 / 攻 84 / 防 22；放在骨魔洞五层（黄泉教主层）作小怪 [适配]；技能书 → 书页 book_page 5% [适配]', missing: '强效药水、各类戒指手镯、死神手套、记忆手镯、技能书（以书页代）' },
  { id: 'boss_huangquan', name: '黄泉教主', boss: 'BOSS（21cq BOSS 列表）', level: '50', hp: '3000', atk: '35-70', def: '18', mdef: '22', exp: '2500', interval: '1200ms',
    behavior: '魔法攻击 + 远程火球；按血量阈值召唤骷髅弓箭手/长枪兵/刀斧手 4–7 只（上限 20）', drops: '祝福油/太阳水等 1/1；神水 1/6；井中月/无极棍 1/800；裁决/骨玉/龙纹 1/3200；银蛇/魔杖/炼狱 1/160；魔血/虹魔/祈祷等', respawn: '180 分钟，1 只', map: '骨魔洞五层 (195,240)', src: C(208), extra: 'https://www.guabo.cn/gonglueheji/178.html',
    adapt: '本作 38 级 / HP 16000 / 攻 106 / 防 27；祝福油 1/1 由本作 BOSS 必掉祝福油覆盖；行为复用祖玛教主机制（火球远程 + 定时召唤，上限沿用 zumaCallMax）；召唤物用本作已有掷斧骷髅/洞穴骷髅战士代替（无经验掉落）；技能书 → 书页', missing: '神水×6、太阳水、强效药水、疗伤药、祈祷套、半月弯刀/困魔咒/地狱雷光/野蛮冲撞/魔法盾技能书、生命/幽灵/天珠项链、记忆头盔、魔血/虹魔套、其余首饰' },
  { id: 'hawk_guard', name: '鹰卫', boss: '普通（精英）', level: '10', hp: '1500', atk: '30-50', def: '15', mdef: '18', exp: '500', interval: '1500ms',
    behavior: '未查到（生物系）', drops: '未查到（21cq 掉落表为空）', respawn: '240 分钟，1 只', map: '丛林迷宫 (50,300)', src: C(186),
    adapt: '本作 34 级 / HP 2000 / 攻 86 / 防 25；原版丛林迷宫本作无此图 → 并入白日门·雪域 [适配]；掉落未查到 → 只给药水+金币', missing: '—（掉落未查到）' },
  { id: 'boss_twinhead_kong', name: '双头金刚', boss: 'BOSS（21cq BOSS 列表）', level: '50', hp: '5000', atk: '100-100', def: '5', mdef: '50', exp: '4000', interval: '1500ms',
    behavior: '近战，带麻痹/石化（今日头条）', drops: '祝福油/药水 1/1；神水 1/6；凝霜/降妖除魔戒指 1/80；重盔甲/灵魂战衣/魔法长袍 1/50；修罗/骷髅头盔 1/240；银蛇/魔杖/炼狱 1/160；法神套 1/2000 等', respawn: '360 分钟，1 只', map: '赤月峡谷·恶魔祭坛 (15,18)', src: C(163), extra: 'https://www.toutiao.com/zixun/7510036912754001920/',
    adapt: '本作 39 级 / HP 17000 / 攻 110 / 防 22 / 魔御 40（原版低防高魔御）；祝福油由 BOSS 必掉覆盖；行为复用魔龙教主机制（近战 + 被贴身 30 秒瞬移）；麻痹/石化本作无怪物对主角控制机制 → 未实装', missing: '麻痹/石化、神水、太阳水、强效药水、技能书（以书页代）、祈祷套、首饰、竹笛、道士头盔、死神手套、法神套' },
  { id: 'boss_twinhead_blood', name: '双头血魔', boss: 'BOSS（21cq BOSS 列表）', level: '55', hp: '5000', atk: '80-150', def: '40', mdef: '10', exp: '4000', interval: '1500ms',
    behavior: '瞬移、发狂（百度百科）；攻击类似沃玛教主闪电（今日头条）', drops: '同双头金刚（凝霜 1/240、圣战套 1/2000 等）', respawn: '360 分钟，1 只', map: '赤月峡谷·恶魔祭坛 (15,18)', src: C(162), extra: 'https://baike.baidu.com/item/%E5%8F%8C%E5%A4%B4%E8%A1%80%E9%AD%94/9240865',
    adapt: '本作 40 级 / HP 17000 / 攻 112 / 防 32 / 魔御 10（原版高防低魔御）；祝福油由 BOSS 必掉覆盖；行为复用沃玛教主机制（发呆→狂暴、30 秒瞬移、半物理半魔法闪电）', missing: '同双头金刚（圣战套代替法神套）' },
];
export function renderM4(): string {
  const L = ['', '## M4 新怪（feat/m4-monsters）', '', '来源：21cq 1.76 资料站（非官方，民间资料站）+ 表内补充链接。原版数值为 1.76 原值；本作数值全部为 [适配]（原版均为 50 级段后期怪，按本作同层位相邻档：火龙守卫 33 / 火龙 36 / 魔龙教主 38 取值）。', '',
    '| 本作 id | 名 | 级别 | 原版等级 | HP | 攻击 | 防御 | 魔御 | 经验 | 攻速 | 行为/技能 | 掉落（原版） | 刷新 | 地图 | 来源 |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const m of M4_OFFICIAL) L.push(`| ${m.id} | ${m.name} | ${m.boss} | ${m.level} | ${m.hp} | ${m.atk} | ${m.def} | ${m.mdef} | ${m.exp} | ${m.interval} | ${m.behavior} | ${m.drops} | ${m.respawn} | ${m.map} | [21cq](${m.src})${m.extra ? ` [补充](${m.extra})` : ''} |`);
  L.push('', '### [适配] 与未实装', '', '| 本作 id | [适配] 依据 | 原版掉落未实装 |', '|---|---|---|');
  for (const m of M4_OFFICIAL) L.push(`| ${m.id} | ${m.adapt} | ${m.missing} |`);
  L.push('', '放置：新增侧线层 34 白日门·雪域（雪人王/钉耙猫王/半兽统领/鹰卫）、35 骨魔洞五层（恶灵尸王/黄泉教主）、36 恶魔祭坛（双头金刚/双头血魔 + 赤月小怪）。均在 SIDE_FLOORS、不在 FLOOR_ORDER，主线 9 种子模拟不受影响。',
    '', '### 美术注记', '', '- 魔龙教主 boss_molong 立绘（boss_molong_full.png）已到位：魔龙教主与魔龙守将 boss_hj_home 的 art key 均指向 boss_molong（原占位：沃玛教主贴图 + 紫色着色）。', '');
  return L.join('\n');
}
