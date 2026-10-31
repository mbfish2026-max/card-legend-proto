# CHANGELOG

## 合击版 #5 怒槽+火龙之心（feat/hj-rage）
- 火龙之心（储量 30000，H1/H5）、8 种补充物（蝎尾/鹿茸/阴阳仙草/九花玉露/九花雪露/元神丹/回气糕/补气丹，补充量 [适配]），肉/技能书也可补；怒槽满值 100 [适配]
- World.feedCompanionHeart；老兵面板显示怒槽/储量与「补充」；存档兜底夹值
- 战斗占位：rageTick / canUnleash / unleash（无结算）

## 合击版 #2 获取英雄（feat/hj-recruit）
- Lv40 在城镇老兵处免费领取英雄（选职业，默认名「职业+英雄」[适配]，H2/H3），一次性；召唤/收回开关写 recallAt（冷却结算留给战斗）

- fix/h-bugs aa7b2f2：修复 BUG-001（fx 图集最多重试 2 次）、BUG-002（低特效 Graphics 兜底共用上限）、BUG-003（贴图跨加载器去重），冒烟测试改为严格。

## 合击版 #1 英雄数据模型（feat/hj-hero）
- src/data/companion.ts：英雄（id companion，不与主角 hero 冲突）职业/名字/独立等级经验/英雄包裹 10 格 [适配]/英雄栏 9 格+火龙之心槽/模式 follow·fight·rest/怒槽字段
- 物品须经英雄包裹再穿（H5）；属性 = 同职业成长 ×0.8 [适配]；经验分成 50%、等级≤主人 [适配]（官方未查到）
- 存档新增 companion（缺省 null，旧档兼容）；tests/hejiban.test.ts


