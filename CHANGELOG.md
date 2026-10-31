# CHANGELOG

- fix/h-bugs aa7b2f2：修复 BUG-001（fx 图集最多重试 2 次）、BUG-002（低特效 Graphics 兜底共用上限）、BUG-003（贴图跨加载器去重），冒烟测试改为严格。## 合击版 #1 英雄数据模型（feat/hj-hero）
- src/data/companion.ts：英雄（id companion，不与主角 hero 冲突）职业/名字/独立等级经验/英雄包裹 10 格 [适配]/英雄栏 9 格+火龙之心槽/模式 follow·fight·rest/怒槽字段
- 物品须经英雄包裹再穿（H5）；属性 = 同职业成长 ×0.8 [适配]；经验分成 50%、等级≤主人 [适配]（官方未查到）
- 存档新增 companion（缺省 null，旧档兼容）；tests/hejiban.test.ts


