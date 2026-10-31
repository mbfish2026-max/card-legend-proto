# FX MANIFEST

26 个原创程序化特效，均为透明 PNG（RGBA）图集 + Phaser 3 JSON Hash。每帧的 `anchor` 为归一化 pivot（Phaser 3 会读取为 customPivot）；meta.fx 中包含 pivot/blend/fps/loop。源码：`src/fxlib.py`、`src/effects.py`、`src/build.py`（`python3 build.py [前缀]`）、`src/preview_scene.py`（合成预览）、`src/validate.py`（JSON 与 PNG 尺寸校验，最近一次结果：ALL OK）。预览：`preview/sheet_*.png`（每帧 + 品红 pivot 十字）和 `preview/preview_fx_{warrior,mage,taoist}.png`。

| 文件 | 帧 | 帧尺寸 | fps | 循环 | 锚点 (pivot px) | 技能 | 阶段 | 混合 | PNG 字节 |
|---|---|---|---|---|---|---|---|---|---|
| fx_common_explosion | 8 | 192×192 | 20 | once | target (96,96) | common/fireball/soul_fire(tint) | hit | ADD | 150233 |
| fx_common_hitspark | 6 | 192×192 | 24 | once | target (96,96) | common 普攻命中 | hit | ADD | 39673 |
| fx_common_slash | 6 | 128×128 | 24 | once | caster (40,64) | common 普攻 | hit | ADD | 17480 |
| fx_fire_sword_hit | 8 | 192×192 | 18 | once | target (96,96) | fire_sword | hit | ADD | 127924 |
| fx_fire_wall_loop | 8 | 192×192 | 16 | loop | ground (96,176) | fire_wall | loop | ADD | 163681 |
| fx_fireball_cast | 6 | 128×128 | 20 | once | caster (64,64) | fireball | cast | ADD | 57553 |
| fx_fireball_fly | 6 | 128×64 | 20 | loop | screen-line (96,32) | fireball | projectile | ADD | 21123 |
| fx_fireball_hit | 8 | 256×256 | 20 | once | target (128,128) | fireball | hit | ADD | 214679 |
| fx_half_moon_sweep | 8 | 256×192 | 20 | once | caster (48,120) | half_moon | hit | ADD | 124454 |
| fx_heal_pillar | 8 | 128×256 | 16 | once | ground (64,244) | heal | hit | ADD | 70027 |
| fx_ice_roar_burst | 10 | 256×192 | 20 | once | ground (128,168) | ice_roar | hit | NORMAL | 221249 |
| fx_magic_shield_cast | 6 | 256×256 | 20 | once | caster (128,128) | magic_shield | cast | ADD | 297362 |
| fx_magic_shield_loop | 8 | 256×256 | 12 | loop | caster (128,128) | magic_shield | loop | ADD | 334720 |
| fx_passive_glint | 6 | 128×128 | 18 | once | ground (64,100) | basic_sword / spirit_force (tint) | hit | ADD | 18346 |
| fx_poison_fly | 6 | 128×64 | 20 | loop | screen-line (96,32) | poison | projectile | ADD | 19373 |
| fx_poison_loop | 8 | 128×128 | 12 | loop | target (64,72) | poison | loop | NORMAL | 174126 |
| fx_rush_dash | 6 | 256×128 | 20 | once | caster (200,64) | rush | cast | NORMAL | 58345 |
| fx_rush_hit | 6 | 192×192 | 20 | once | target (96,96) | rush | hit | ADD | 53995 |
| fx_slaying_proc | 6 | 128×128 | 24 | once | target (64,64) | slaying | hit | ADD | 54661 |
| fx_soul_fire_fly | 6 | 64×64 | 18 | loop | screen-line (32,32) | soul_fire | projectile | NORMAL | 7886 |
| fx_soul_fire_hit | 8 | 192×192 | 20 | once | target (96,96) | soul_fire | hit | ADD | 96734 |
| fx_summon_beast_circle | 10 | 256×128 | 16 | once | ground (128,96) | summon_beast | summon | NORMAL | 225037 |
| fx_summon_circle | 10 | 256×128 | 16 | once | ground (128,96) | summon_skeleton | summon | NORMAL | 220450 |
| fx_summon_pillar | 8 | 128×256 | 16 | once | ground (64,244) | summon_skeleton / summon_beast | summon | ADD | 65177 |
| fx_thrust_hit | 7 | 256×128 | 24 | once | caster (12,64) | thrust | hit | ADD | 69473 |
| fx_thunder_strike | 8 | 128×640 | 20 | once | ground (64,628) | thunder | hit | ADD | 408854 |

## Phaser 接入示例
```ts
// preload
const FX = ['fx_fireball_cast','fx_fireball_fly', /* ...26 个 */];
FX.forEach(k => this.load.atlas(k, `assets/fx/${k}.png`, `assets/fx/${k}.json`));
// create：用 meta.fx 建动画（也可以手写 fps/repeat）
FX.forEach(k => {
  const m = (this.cache.json.get(k) ?? this.textures.get(k).customData)?.meta?.fx; // 或直接写死
  this.anims.create({ key: k, frames: this.anims.generateFrameNames(k, { prefix: `${k}_`, start: 0, end: m.n - 1, zeroPad: 2 }),
    frameRate: m.fps, repeat: m.loop ? -1 : 0 });
});
// 播放（帧的 anchor 会自动作为 origin，无需 setOrigin）
const s = this.add.sprite(x, y, 'fx_fireball_hit').setDepth(58).setBlendMode(Phaser.BlendModes.ADD); // v2 起 1× 即可
s.play('fx_fireball_hit').once('animationcomplete', () => s.destroy());
// 有 tint 的通用特效：s.setTint(0xffb060)；面朝左时：s.setFlipX(true)（注意 pivot 镜像）
```

## 触发时序（基于 BattleScene：windupMs=200 之后进入 skillFx）
| 技能 | 时序 | sfx |
|---|---|---|
| fireball | t0 在 caster_front(cx+dir·w·0.4, cy−20) 播放 cast（300ms）→ t0+150 生成 fly 并做 tween（max(160,|dx|·0.7)ms，Quad.easeIn；按方向 flipX/rotation）→ 到达后播放 hit，并同时出伤害数字 | fireball_cast / fireball_impact |
| thunder | 目标 ground 播放 thunder_strike，第 1 帧（50ms）时出伤害并震屏 | shockwave2 |
| fire_wall | 目标 ground 循环 fire_wall_loop，持续 6+2lv s，结束时 alpha 淡出 300ms；depth 30 | shockwave |
| magic_shield | caster center 先播 cast（300ms），之后接 loop，持续 12+4lv s；scale≈1.0–1.3 | heal2 |
| ice_roar | range 420 内每个目标的 ground 各播放一次 burst（500ms，错开 40ms）；NORMAL 混合 | shockwave |
| 基础攻击/刺杀/半月/烈火/野蛮 | 挥砍帧时播放 common_slash（tint 按职业）/thrust/half_moon（caster center）/rush_dash（位移期间跟随）；命中帧时播放 hitspark/rush_hit/fire_sword_hit；slaying 触发时额外叠加 slaying_proc | swing_crit（烈火、刺杀暴击、slaying）/ cleave（半月）/ shout（野蛮） |
| 被动 basic_sword/spirit_force | 触发时在 ground 播放 passive_glint（tint） | — |
| heal | 目标 ground 播放 heal_pillar（500ms），第 3 帧时出治疗数字 | heal |
| poison | poison_fly 弹道 → 目标 center 循环 poison_loop，持续 8+2lv s；NORMAL | — |
| soul_fire | soul_fire_fly 弹道 → soul_fire_hit | fireball_impact |
| summon / 神兽 | 召唤位 ground 播放 circle（625ms，depth 9）→ 第 4 帧时叠加 summon_pillar → 生成单位卡 | summon / summon2 |

## 接入注意
- 锚点：center 对准视觉中心（卡片 y−125 左右），ground 对准 GROUND_Y=545；projectile 的 pivot 为弹头位置。
- 缩放（v2）：命中类与 thunder 已在图内放大，1× 使用即可；shield 1.0–1.3。
- v2 尺寸变化：fireball_hit 128²→256²，pivot (128,128)；common_explosion、soul_fire_hit、common_hitspark、rush_hit 128²→192²，pivot (96,96)；thunder_strike 128×384→128×640，pivot (64,372)→(64,628)。帧数和 fps 均未变。fire_wall_loop、poison_loop 的尺寸和帧数不变，仅画面改变。
- 混合：表中为 ADD 的用 `BlendModes.ADD`；NORMAL 的（含冰、尘、雾、法阵底）不要设成 ADD，否则会发灰。
- 深度：一次性特效 55–60；fire_wall 30；summon circle 9（在卡片 10 之下）；shield loop 建议 11，略高于自己的卡。
