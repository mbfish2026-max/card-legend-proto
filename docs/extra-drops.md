# BOSS 额外掉落钩子（extraDrops）
`src/data/drop-plan.ts` 的 `BOSS_EXTRA_DROPS: Record<bossId, {item, chance}[]>`，模块加载时由 `applyExtraDrops()` 追加到 BOSS 掉落表。
- 只接受 BOSS id、只接受已存在物品；几率夹到 ≤1；重复物品跳过。
- 默认空表（不改变现有掉落）。技能书等官方掉落查到来源后再填，未查到的不填。
- 测试：tests/extra-drops.test.ts。
