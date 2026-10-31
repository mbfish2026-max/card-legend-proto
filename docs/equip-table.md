# 官方装备表 v1

> 本文件由 `npm run gen:equip`（src/data/equipTableDoc.ts）生成，勿手改；`npm test` 校验与数据一致。

## 规则

- 来源：21cq 热血传奇 1.76 物品库（每行「来源」链接）；沃玛/祖玛/赤月 职业归属：https://www.21cq.com/mir/Suit.aspx 、https://zhidao.baidu.com/question/56230124.html
- [适配] 系数（v1 新增件）：属性 = 官方区间中值 × 系数（攻×2、魔/道×4、防×3，四舍五入），生命 = 适配后防御×8；魔御×3（#10 起回填，含存量件；不折算生命）；准确不换算（本作无此属性）；售价 = 官方出售价/100。
- 存量件（R18 及以前）数值保持不变（旧档与平衡），仅骨玉权杖 道术→魔法 修正。
- 本作门槛 = 需求等级 req。官方为等级需求 → 取官方值；官方为攻击力/魔法力/精神力 → [适配] 档次等级：沃玛 24、祖玛 30、赤月 35、黑铁头盔 30。
- 职业：1.76 无硬职业锁，按官方需求类型推导（攻击力→战士、魔法力→法师、精神力→道士，等级需求→通用）；穿戴时校验（「职业不符」）。
- 套装计件：官方「相同款式不生效」（记忆套需两只不同款手镯/戒指，https://www.moon-soft.com/program/BBS/readelite593510.htm）→ 同 id 重复只计 1 件。1.76 沃玛/祖玛/赤月 为档次名，官方无套装加成数值（未查到），本作 SETS 加成为 [适配]。

## 统计

共 84 件（武器 26，衣服 9，头盔 10，项链 12，戒指 13，手镯 12，靴子 2）；存量 52，v1 新增 32。

## 装备表

| id | 名称 | 部位 | 档次 | 官方需求 | 本作 req | 职业 | 官方属性 | 本作属性 | 来源 |
|---|---|---|---|---|---|---|---|---|---|
| wood_sword | 木剑 | 武器 | — | 等级 1 | 1 | 通用 | 攻2-5 | 攻击+6 魔法+3 道术+3 | https://www.21cq.com/mir/View.aspx?id=80 |
| iron_sword | 铁剑 | 武器 | — | 等级 10 | 4 | 通用 | 攻5-9 | 攻击+14 | https://www.21cq.com/mir/View.aspx?id=85 |
| magic_staff | 魔杖 | 武器 | 沃玛 | 等级 26 | 6 | 通用 | 攻5-9 魔2-5 | 魔法+16 攻击+3 | https://www.21cq.com/mir/View.aspx?id=100 |
| tao_sword | 银蛇剑 | 武器 | 沃玛 | 等级 26 | 6 | 通用 | 攻7-14 道1-3 准确+1 | 道术+14 攻击+6 | https://www.21cq.com/mir/View.aspx?id=101 |
| dragon_sword | 屠龙刀 | 武器 | — | 等级 34 | 34 | 战士 | 攻5-35 | 攻击+50 | https://www.21cq.com/mir/View.aspx?id=108 |
| short_sword | 短剑 | 武器 | — | 等级 10 | 10 | 通用 | 攻3-11 | 攻击+16 | https://www.21cq.com/mir/View.aspx?id=84 |
| bronze_sword | 青铜剑 | 武器 | — | 等级 5 | 5 | 通用 | 攻3-7 | 攻击+10 | https://www.21cq.com/mir/View.aspx?id=83 |
| dagger | 匕首 | 武器 | — | 等级 1 | 1 | 通用 | 未查到 | 攻击+8 | https://www.21cq.com/mir/View.aspx?id=81 |
| ebony_sword | 乌木剑 | 武器 | — | 等级 1 | 1 | 通用 | 攻4-8 魔0-1 | 攻击+12 魔法+3 | https://www.21cq.com/mir/View.aspx?id=82 |
| bronze_axe | 青铜斧 | 武器 | — | 等级 13 | 13 | 通用 | 攻0-15 | 攻击+22 | https://www.21cq.com/mir/View.aspx?id=87 |
| bahuang | 八荒 | 武器 | — | 等级 15 | 15 | 通用 | 攻4-12 | 攻击+18 | https://www.21cq.com/mir/View.aspx?id=89 |
| banyue | 半月 | 武器 | — | 等级 15 | 15 | 通用 | 攻5-10 魔0-1 道1-1 | 攻击+15 魔法+3 道术+3 | https://www.21cq.com/mir/View.aspx?id=91 |
| haihun | 海魂 | 武器 | — | 等级 15 | 15 | 通用 | 攻3-10 魔1-2 | 攻击+15 魔法+6 | https://www.21cq.com/mir/View.aspx?id=90 |
| lingfeng | 凌风 | 武器 | — | 等级 19 | 19 | 通用 | 攻6-12 | 攻击+18 | https://www.21cq.com/mir/View.aspx?id=92 |
| xiangmo | 降魔 | 武器 | — | 等级 20 | 20 | 通用 | 攻6-11 道1-2 准确+1 | 攻击+16 道术+6 | https://www.21cq.com/mir/View.aspx?id=96 |
| yanyue | 偃月 | 武器 | — | 等级 20 | 20 | 通用 | 攻4-10 魔1-3 | 攻击+15 魔法+9 | https://www.21cq.com/mir/View.aspx?id=95 |
| xiuluo | 修罗 | 武器 | — | 等级 22 | 22 | 通用 | 攻0-20 | 攻击+30 | https://www.21cq.com/mir/View.aspx?id=97 |
| zhanma | 斩马刀 | 武器 | — | 等级 20 | 20 | 通用 | 攻5-15 | 攻击+22 | https://www.21cq.com/mir/View.aspx?id=94 |
| pohun | 破魂 | 武器 | — | 等级 20 | 22 | 通用 | 攻8-10 准确+2 | 攻击+21 | https://www.21cq.com/mir/View.aspx?id=93 |
| ningshuang | 凝霜 | 武器 | — | 等级 25 | 25 | 通用 | 攻10-13 | 攻击+20 | https://www.21cq.com/mir/View.aspx?id=98 |
| lianyu | 炼狱 | 武器 | 沃玛 | 等级 26 | 26 | 通用 | 攻0-25 | 攻击+38 | https://www.21cq.com/mir/View.aspx?id=99 |
| jingzhongyue | 井中月 | 武器 | 沃玛 | 等级 28 | 28 | 通用 | 攻7-22 | 攻击+33 | https://www.21cq.com/mir/View.aspx?id=102 |
| wujigun | 无极棍 | 武器 | 沃玛 | 精神力 25 | 30 | 道士 | 攻8-16 道3-5 | 攻击+24 道术+15 | https://www.21cq.com/mir/View.aspx?id=104 |
| longwen | 龙纹剑 | 武器 | 祖玛 | 等级 35 | 35 | 通用 | 攻8-20 道3-6 | 攻击+30 道术+18 | https://www.21cq.com/mir/View.aspx?id=107 |
| caijue | 裁决之杖 | 武器 | 祖玛 | 等级 30 | 30 | 通用 | 攻0-30 | 攻击+45 | https://www.21cq.com/mir/View.aspx?id=105 |
| guyu | 骨玉权杖 | 武器 | 祖玛 | 等级 35 | 26 | 通用 | 攻6-12 魔2-6 | 攻击+9 魔法+18 | https://www.21cq.com/mir/View.aspx?id=106 |
| cloth | 布衣 | 衣服 | — | 等级 1 | 1 | 通用 | 防0-2 魔御0-1 | 防御+5 生命+30 魔御+2 | https://www.21cq.com/mir/View.aspx?id=116 |
| armor | 重盔甲 | 衣服 | — | 等级 22 | 12 | 通用 | 防4-7 魔御2-3 | 防御+16 生命+120 魔御+8 | https://www.21cq.com/mir/View.aspx?id=122 |
| light_armor | 轻型盔甲 | 衣服 | — | 等级 11 | 11 | 通用 | 防3-3 魔御1-2 | 防御+7 生命+56 魔御+5 | https://www.21cq.com/mir/View.aspx?id=118 |
| soul_robe | 灵魂战衣 | 衣服 | — | 等级 22 | 22 | 通用 | 道0-2 防3-6 魔御3-3 | 防御+14 生命+112 道术+6 魔御+9 | https://www.21cq.com/mir/View.aspx?id=126 |
| magic_robe | 魔法长袍 | 衣服 | — | 等级 22 | 22 | 通用 | 魔0-2 防3-5 魔御3-4 | 防御+12 生命+96 魔法+6 魔御+11 | https://www.21cq.com/mir/View.aspx?id=124 |
| war_armor | 战神盔甲 | 衣服 | 祖玛 | 攻击力 46 | 30 | 战士 | 防5-9 魔御3-5 | 防御+21 生命+168 魔御+12 | https://www.21cq.com/mir/View.aspx?id=128 |
| ghost_robe | 幽灵战衣 | 衣服 | 祖玛 | 精神力 27 | 30 | 道士 | 道1-4 防4-7 魔御3-4 | 防御+16 生命+128 道术+12 魔御+11 | https://www.21cq.com/mir/View.aspx?id=132 |
| demon_robe | 恶魔长袍 | 衣服 | 祖玛 | 魔法力 28 | 30 | 法师 | 魔1-4 防4-7 魔御3-4 | 防御+16 生命+128 魔法+12 魔御+11 | https://www.21cq.com/mir/View.aspx?id=130 |
| medium_armor | 中型盔甲 | 衣服 | 普通 | 等级 16 | 16 | 通用 | 防3-5 魔御1-2 | 防御+12 生命+96 魔御+5 | https://www.21cq.com/mir/View.aspx?id=120 |
| set_woma_helm | 沃玛头盔 | 头盔 | 沃玛 | 自创 | 14 | 通用 | 自创 | 防御+10 生命+60 | 自创 |
| set_zuma_helm | 祖玛头盔 | 头盔 | 祖玛 | 自创 | 18 | 通用 | 自创 | 防御+13 生命+90 | 自创 |
| helmet | 青铜头盔 | 头盔 | — | 等级 10 | 3 | 通用 | 防0-1 | 防御+4 生命+20 | https://www.21cq.com/mir/View.aspx?id=147 |
| bone_helm | 骷髅头盔 | 头盔 | — | 攻击力 30 | 10 | 战士 | 防2-3 | 防御+9 生命+50 | https://www.21cq.com/mir/View.aspx?id=150 |
| tao_helm | 道士头盔 | 头盔 | — | 等级 24 | 24 | 通用 | 防1-2 魔御2-3 | 防御+5 生命+40 魔御+8 | https://www.21cq.com/mir/View.aspx?id=149 |
| magic_helm | 魔法头盔 | 头盔 | — | 等级 14 | 14 | 通用 | 防0-1 魔御1-1 | 防御+2 生命+16 魔御+3 | https://www.21cq.com/mir/View.aspx?id=148 |
| shengzhan_helm | 圣战头盔 | 头盔 | 赤月 | 攻击力 40 | 35 | 战士 | 攻0-1 防4-5 魔御2-3 | 攻击+1 防御+14 生命+112 魔御+8 | https://www.21cq.com/mir/View.aspx?id=232 |
| fashen_helm | 法神头盔 | 头盔 | 赤月 | 魔法力 28 | 35 | 法师 | 魔0-1 防4-4 魔御1-2 | 魔法+2 防御+12 生命+96 魔御+5 | https://www.21cq.com/mir/View.aspx?id=236 |
| tianzun_helm | 天尊头盔 | 头盔 | 赤月 | 精神力 25 | 35 | 道士 | 道0-1 防4-4 魔御1-2 | 道术+2 防御+12 生命+96 魔御+5 | https://www.21cq.com/mir/View.aspx?id=240 |
| black_iron_helm | 黑铁头盔 | 头盔 | 祖玛 | 攻击力 46 | 30 | 战士 | 防4-5 魔御2-3 | 防御+14 生命+112 魔御+8 | https://www.21cq.com/mir/View.aspx?id=151 |
| set_woma_necklace | 沃玛项链 | 项链 | 沃玛 | 自创 | 14 | 通用 | 自创 | 攻击+7 魔法+7 道术+7 | 自创 |
| set_chiyue_necklace | 赤月项链 | 项链 | 赤月 | 自创 | 22 | 通用 | 自创 | 攻击+14 魔法+14 道术+14 | 自创 |
| pearl | 黑珍珠项链 | 项链 | — | 自创 | 5 | 通用 | 自创 | 攻击+5 魔法+5 道术+5 | 自创 |
| ghost_necklace | 幽灵项链 | 项链 | 沃玛 | 等级 24 | 24 | 通用 | 攻0-5 | 攻击+5 | https://www.21cq.com/mir/View.aspx?id=168 |
| life_necklace | 生命项链 | 项链 | 沃玛 | 魔法力 25 | 24 | 法师 | 魔1-5 准确+1 | 魔法+12 | https://www.21cq.com/mir/View.aspx?id=169 |
| tianzhu_necklace | 天珠项链 | 项链 | 沃玛 | 精神力 22 | 24 | 道士 | 道1-5 | 道术+12 | https://www.21cq.com/mir/View.aspx?id=170 |
| green_necklace | 绿色项链 | 项链 | 祖玛 | 攻击力 39 | 30 | 战士 | 攻2-5 | 攻击+7 | https://www.21cq.com/mir/View.aspx?id=171 |
| demon_bell | 恶魔铃铛 | 项链 | 祖玛 | 魔法力 27 | 30 | 法师 | 魔0-7 准确+2 | 魔法+14 | https://www.21cq.com/mir/View.aspx?id=172 |
| soul_necklace | 灵魂项链 | 项链 | 祖玛 | 精神力 23 | 30 | 道士 | 道1-6 准确+2 | 道术+14 | https://www.21cq.com/mir/View.aspx?id=173 |
| shengzhan_necklace | 圣战项链 | 项链 | 赤月 | 攻击力 40 | 35 | 战士 | 攻3-6 | 攻击+9 | https://www.21cq.com/mir/View.aspx?id=233 |
| fashen_necklace | 法神项链 | 项链 | 赤月 | 魔法力 28 | 35 | 法师 | 魔1-8 准确+2 | 魔法+18 | https://www.21cq.com/mir/View.aspx?id=237 |
| tianzun_necklace | 天尊项链 | 项链 | 赤月 | 精神力 25 | 35 | 道士 | 道2-7 准确+2 | 道术+18 | https://www.21cq.com/mir/View.aspx?id=241 |
| set_zuma_ring | 祖玛戒指 | 戒指 | 祖玛 | 自创 | 18 | 通用 | 自创 | 攻击+11 魔法+11 道术+11 | 自创 |
| set_chiyue_ring | 赤月戒指 | 戒指 | 赤月 | 自创 | 22 | 通用 | 自创 | 攻击+14 魔法+14 道术+14 | 自创 |
| iron_ring | 铁戒指 | 戒指 | — | 自创 | 2 | 通用 | 自创 | 攻击+3 生命+20 | 自创 |
| gold_ring | 金戒指 | 戒指 | — | 等级 22 | 9 | 通用 | 攻1-1 魔1-1 道1-1 魔御0-3 | 攻击+8 魔法+8 道术+8 魔御+5 | https://www.21cq.com/mir/View.aspx?id=206 |
| dragon_ring | 龙之戒指 | 戒指 | 沃玛 | 攻击力 37 | 24 | 战士 | 攻0-5 | 攻击+5 | https://www.21cq.com/mir/View.aspx?id=212 |
| ruby_ring | 红宝石戒指 | 戒指 | 沃玛 | 魔法力 17 | 24 | 法师 | 魔0-4 | 魔法+8 | https://www.21cq.com/mir/View.aspx?id=213 |
| platinum_ring | 铂金戒指 | 戒指 | 沃玛 | 精神力 17 | 24 | 道士 | 道0-4 | 道术+8 | https://www.21cq.com/mir/View.aspx?id=214 |
| power_ring | 力量戒指 | 戒指 | 祖玛 | 攻击力 46 | 30 | 战士 | 攻0-6 | 攻击+6 | https://www.21cq.com/mir/View.aspx?id=215 |
| zibiluo | 紫碧螺 | 戒指 | 祖玛 | 魔法力 24 | 30 | 法师 | 魔0-5 | 魔法+10 | https://www.21cq.com/mir/View.aspx?id=216 |
| titan_ring | 泰坦戒指 | 戒指 | 祖玛 | 精神力 24 | 30 | 道士 | 道2-6 | 道术+16 | https://www.21cq.com/mir/View.aspx?id=217 |
| shengzhan_ring | 圣战戒指 | 戒指 | 赤月 | 攻击力 40 | 35 | 战士 | 攻0-7 魔御0-1 | 攻击+7 魔御+2 | https://www.21cq.com/mir/View.aspx?id=235 |
| fashen_ring | 法神戒指 | 戒指 | 赤月 | 魔法力 28 | 35 | 法师 | 魔1-6 魔御0-1 | 魔法+14 魔御+2 | https://www.21cq.com/mir/View.aspx?id=239 |
| tianzun_ring | 天尊戒指 | 戒指 | 赤月 | 精神力 25 | 35 | 道士 | 道2-7 魔御0-1 | 道术+18 魔御+2 | https://www.21cq.com/mir/View.aspx?id=243 |
| set_woma_bracelet | 沃玛手镯 | 手镯 | 沃玛 | 自创 | 14 | 通用 | 自创 | 防御+5 生命+50 | 自创 |
| set_chiyue_bracelet | 赤月手镯 | 手镯 | 赤月 | 自创 | 22 | 通用 | 自创 | 防御+8 生命+120 | 自创 |
| bracelet | 翡翠手镯 | 手镯 | — | 自创 | 4 | 通用 | 自创 | 防御+3 生命+30 | 自创 |
| ghost_glove | 幽灵手套 | 手镯 | 沃玛 | 等级 25 | 25 | 通用 | 防0-3 | 防御+5 生命+40 | https://www.21cq.com/mir/View.aspx?id=189 |
| sibeier_bracelet | 思贝儿手镯 | 手镯 | 沃玛 | 魔法力 24 | 24 | 法师 | 魔0-2 | 魔法+4 | https://www.21cq.com/mir/View.aspx?id=190 |
| heart_bracelet | 心灵手镯 | 手镯 | 沃玛 | 精神力 24 | 24 | 道士 | 道1-2 | 道术+6 | https://www.21cq.com/mir/View.aspx?id=195 |
| knight_bracelet | 骑士手镯 | 手镯 | 祖玛 | 攻击力 39 | 30 | 战士 | 攻2-2 | 攻击+4 | https://www.21cq.com/mir/View.aspx?id=193 |
| dragon_bracelet | 龙之手镯 | 手镯 | 祖玛 | 魔法力 28 | 30 | 法师 | 魔0-3 | 魔法+6 | https://www.21cq.com/mir/View.aspx?id=194 |
| sanyan_bracelet | 三眼手镯 | 手镯 | 祖玛 | 精神力 22 | 30 | 道士 | 道1-3 防1-1 | 道术+8 防御+3 生命+24 | https://www.21cq.com/mir/View.aspx?id=191 |
| shengzhan_bracelet | 圣战手镯 | 手镯 | 赤月 | 攻击力 40 | 35 | 战士 | 攻2-3 防0-1 | 攻击+5 防御+2 生命+16 | https://www.21cq.com/mir/View.aspx?id=234 |
| fashen_bracelet | 法神手镯 | 手镯 | 赤月 | 魔法力 28 | 35 | 法师 | 魔0-4 防0-1 | 魔法+8 防御+2 生命+16 | https://www.21cq.com/mir/View.aspx?id=238 |
| tianzun_bracelet | 天尊手镯 | 手镯 | 赤月 | 精神力 25 | 35 | 道士 | 道1-4 防1-2 | 道术+10 防御+5 生命+40 | https://www.21cq.com/mir/View.aspx?id=242 |
| set_zuma_boots | 祖玛靴 | 靴子 | 祖玛 | 自创 | 18 | 通用 | 自创 | 防御+8 生命+70 | 自创 |
| boots | 铁靴 | 靴子 | — | 自创 | 3 | 通用 | 自创 | 防御+4 生命+25 | 自创 |

## 去重盘点（存量 → 官方对应）

| id | 本作名 | 官方对应 | 备注 |
|---|---|---|---|
| set_woma_helm | 沃玛头盔 | 自创 | 沃玛头盔：1.76 无此物品（沃玛为档次名） |
| set_woma_necklace | 沃玛项链 | 自创 | 沃玛项链：1.76 无此物品 |
| set_woma_bracelet | 沃玛手镯 | 自创 | 沃玛手镯：1.76 无此物品 |
| set_zuma_helm | 祖玛头盔 | 自创 | 祖玛头盔：1.76 无此物品 |
| set_zuma_ring | 祖玛戒指 | 自创 | 祖玛戒指：1.76 无此物品 |
| set_zuma_boots | 祖玛靴 | 自创 | 祖玛靴：1.76 无此物品 |
| set_chiyue_necklace | 赤月项链 | 自创 | 赤月项链：1.76 无此物品（赤月级为圣战/法神/天尊） |
| set_chiyue_ring | 赤月戒指 | 自创 | 赤月戒指：1.76 无此物品 |
| set_chiyue_bracelet | 赤月手镯 | 自创 | 赤月手镯：1.76 无此物品 |
| wood_sword | 木剑 | 木剑 |  |
| iron_sword | 铁剑 | 铁剑 | 本作 req4（R2 存量，保留） |
| magic_staff | 魔杖 | 魔杖 | 本作 req6（R2 存量，保留） |
| tao_sword | 银蛇剑 | 银蛇 | 本作名「银蛇剑」、req6（R2 存量，保留） |
| dragon_sword | 屠龙刀 | 屠龙 | 本作名「屠龙刀」、req15（R2 存量，保留） |
| helmet | 青铜头盔 | 青铜头盔 | 本作 req3（R2 存量，保留） |
| bone_helm | 骷髅头盔 | 骷髅头盔 | 本作 req10（R2 存量，保留） |
| cloth | 布衣 | 布衣(男/女) |  |
| armor | 重盔甲 | 重盔甲(男/女) | 本作 req12（R2 存量，保留） |
| pearl | 黑珍珠项链 | 自创 | 黑珍珠项链：1.76 无此物品 |
| iron_ring | 铁戒指 | 自创 | 铁戒指：1.76 无此物品 |
| gold_ring | 金戒指 | 金戒指 | 本作 req9（R2 存量，保留） |
| bracelet | 翡翠手镯 | 自创 | 翡翠手镯：1.76 无此物品 |
| boots | 铁靴 | 自创 | 铁靴：1.76 无靴子栏（手游/后续版本） |
| short_sword | 短剑 | 短剑 |  |
| bronze_sword | 青铜剑 | 青铜剑 |  |
| dagger | 匕首 | 匕首 | 21cq id=81 页面无数据（未查到）；gap 文档 S3：攻 4-5 |
| ebony_sword | 乌木剑 | 乌木剑 |  |
| bronze_axe | 青铜斧 | 青铜斧 |  |
| bahuang | 八荒 | 八荒 |  |
| banyue | 半月 | 半月 |  |
| haihun | 海魂 | 海魂 |  |
| lingfeng | 凌风 | 凌风 |  |
| xiangmo | 降魔 | 降魔 |  |
| yanyue | 偃月 | 偃月 |  |
| xiuluo | 修罗 | 修罗 |  |
| zhanma | 斩马刀 | 斩马刀 |  |
| pohun | 破魂 | 破魂 |  |
| ningshuang | 凝霜 | 凝霜 |  |
| lianyu | 炼狱 | 炼狱 |  |
| jingzhongyue | 井中月 | 井中月 |  |
| wujigun | 无极棍 | 无极棍 |  |
| longwen | 龙纹剑 | 龙纹剑 |  |
| caijue | 裁决之杖 | 裁决之杖 |  |
| guyu | 骨玉权杖 | 骨玉权杖 | R13 误写为 道术+12；v1 按官方改为 魔法（R13 规则 上限6×3=18）；本作 req26（保留） |
| light_armor | 轻型盔甲 | 轻型盔甲(男/女) |  |
| soul_robe | 灵魂战衣 | 灵魂战衣(男/女) |  |
| magic_robe | 魔法长袍 | 魔法长袍(男/女) |  |
| war_armor | 战神盔甲 | 战神盔甲(男/女) |  |
| ghost_robe | 幽灵战衣 | 幽灵战衣(男/女) |  |
| demon_robe | 恶魔长袍 | 恶魔长袍(男/女) |  |
| tao_helm | 道士头盔 | 道士头盔 |  |
| magic_helm | 魔法头盔 | 魔法头盔 |  |
