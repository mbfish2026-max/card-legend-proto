# 角色装备分层素材（equip-layers）

本轮仅完成 **战士** 样板；法师、道士待样板确认后再做。只做「衣服」「武器」两处，不做头盔。

## 数据来源
`src/data/items.ts`（`SLOTS` 中 `armor`=衣服、`weapon`=武器）：

| 槽位 | id | 名称 | 需求等级 | 战士是否使用 |
|---|---|---|---|---|
| armor | `cloth` | 布衣 | 1 | 是 |
| armor | `armor` | 重盔甲 | 12 | 是 |
| weapon | `wood_sword` | 木剑 | 1 | 是 |
| weapon | `iron_sword` | 铁剑 | 4 | 是 |
| weapon | `magic_staff` | 魔杖 | 6 | 否（法师向，留给法师轮次） |
| weapon | `tao_sword` | 银蛇剑 | 6 | 否（道士向，留给道士轮次） |
| weapon | `dragon_sword` | 屠龙刀 | 15 | 是 |

套装（`SETS`）：沃玛 = 头盔/项链/手镯，祖玛 = 头盔/戒指/靴子，赤月 = 项链/戒指/手镯 —— **三套均无衣服件、无武器件**，因此不需要套装衣服图。

## 文件
所有图均为 **1024×1024 RGBA 透明 PNG**，同画布、同原点 (0,0)，直接按左上角对齐叠加，无需偏移。

| 文件 | 内容 | 不透明区域包围盒 (x0,y0,x1,y1) |
|---|---|---|
| `public/assets/equip/warrior/body.png` | 基础身体：米白短袖内衫+棕色布裤+布鞋，无武器；右手空心握拳（持武器手姿） | 47,2,691,1007 |
| `public/assets/equip/warrior/armor/cloth.png` | 布衣：深蓝绗缝无袖坎肩、皮护肩、皮腰带（裸臂） | 204,261,617,661 |
| `public/assets/equip/warrior/armor/armor.png` | 重盔甲：银灰板甲、红边、大护肩、护臂、甲裙 | 97,238,673,638 |
| `public/assets/equip/warrior/weapon/wood_sword.png` | 木剑：浅木色剑身、麻绳缠护手 | 568,386,996,703 |
| `public/assets/equip/warrior/weapon/iron_sword.png` | 铁剑：带血槽的钢长剑、黑铁十字护手、圆柄头 | 567,378,1012,740 |
| `public/assets/equip/warrior/weapon/dragon_sword.png` | 屠龙刀：宽背单刃、金龙首护手、红宝石、红缠柄 | 561,378,1009,724 |

## 锚点（画布坐标）
- **手部锚点（右手握持中心）：(632, 470)**。武器层的握柄穿过此点，剑身沿约 35° 斜向右下方伸出（保留原卡面“武器斜向侧伸”效果）。
- 武器层自带「握剑的右手」像素（手指包住剑柄），所以叠上去后会覆盖身体层的空拳。
- 身体脚底约 y=1007，头顶约 y=2；在游戏中缩放时以画布整体缩放即可。

## 叠加顺序
`body → armor → weapon`（武器层在最上，即武器与握持手在衣服前方）。未穿衣服时直接 body → weapon。

## 兜底规则
- 战士衣服、武器全部有专属图，无需兜底。
- 若战士装备了 `magic_staff` / `tao_sword`（数据上无职业限制），暂用 `iron_sword.png` 兜底（同为中档单手武器）；后续法师/道士轮次出专属图后可替换。
- 未知/新增衣服：`req < 12` 用 `cloth.png`，否则用 `armor.png`；未知武器：`req < 4` 用 wood_sword，`< 15` 用 iron_sword，否则 dragon_sword。

## 预览
`docs/equip-preview/warrior_light.png`、`warrior_dark.png`（8 种组合：裸身、布衣、重盔甲、木剑、布衣+铁剑、重盔甲+屠龙刀、布衣+屠龙刀、重盔甲+铁剑）。

## 制作方法
先生成基础身体（纯绿底），再以其为参考图生成各“穿衣/持武器”变体，Python 抠绿、按腿部区域平移对齐，与身体做差分得到装备层。全部为原创生成图。
