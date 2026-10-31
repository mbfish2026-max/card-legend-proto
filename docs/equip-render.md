# 装备上身分层渲染（equip-render）

素材规范见 `docs/equip-layers.md`（美术交付，分支 art/equip-layers）。只做衣服(armor)、武器(weapon)，不做头盔。

## 配置：`src/data/equipLayers.ts`
- `EQUIP_CLASSES[职业]`：`armor` / `weapon` 两张表，内容是装备 id 到 `equip/<职业>/` 下相对文件的映射；`alias` 用来借图（例如战士拿魔杖、银蛇剑时用铁剑）；`offset[id]` 填 `{dx,dy,scale}`，规范要求零偏移，这一项只留着以后对齐用。
- 叠加顺序 `body → armor → weapon`（`LAYER_ORDER`），1024×1024 画布左上角 (0,0) 对齐叠加。
- 兜底 `fallbackId`：未知衣服 req<12 用 cloth，否则用 armor；未知武器 req<4 用 wood_sword，<15 用 iron_sword，否则用 dragon_sword（来自规范）。
- 法师、道士素材交付后，只需在 `EQUIP_CLASSES` 里加 `mage` / `taoist`，代码不用改。

## 显示位置
- 战场主角卡：`CardView.refreshEquip()` 只换同一张立绘 Image 的纹理，所以缩放、翻转朝向、受击闪白、状态染色、挥砍动作都照常生效，不会错位。
- 角色面板中间的立绘（背包模式）。
- 背包预览：悬停或选中背包里的衣服、武器时，提示框旁会显示「试穿」小图，只是预览，不会改动真实装备。
- 穿脱装备时 World 会发出 `inventory` 事件，`BattleScene.refreshHeroLook()` 和面板随即重绘。

## 懒加载与缓存
- 层图不在 `assets-manifest` / 首屏 preload 里。只有穿上装备、或悬停预览某件装备时，才会经 `src/ui/EquipLayers.ts#ensureLayers` 加载对应 PNG，同一张图并发请求时会去重。
- 层图全部加载完后用 Canvas 合成为 512×512 纹理，key 为 `eqc_<职业>_body+<衣服>+<武器>`。同一组合只合成一次，穿脱时按组合签名判断，签名没变就不刷新。

## 回退
- 职业没有素材、没穿衣服也没拿武器（包括旧存档）时显示原立绘。
- 加载中先显示原立绘，加载完成后自动切换。
- 任一层加载失败（404 或解码失败）会记入 failed，此后这个组合一直用原立绘，不报错，也不会出现破图。
- 存档结构没有改动，只读 `equip.armor` / `equip.weapon`。

截图见 `docs/equip-shots/`。
