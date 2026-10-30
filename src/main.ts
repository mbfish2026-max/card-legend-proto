import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
import { IS_MOBILE, setupMobile } from './mobile';
import { Settings } from './settings';
import { FxQuality } from './ui/Fx';
Settings.load();
if (Settings.showPad === null) Settings.showPad = IS_MOBILE;
if (Settings.lowFx === null) Settings.lowFx = IS_MOBILE;
FxQuality.low = !!Settings.lowFx;
setupMobile();
// 逻辑分辨率固定 1280×720，Scale.FIT 等比缩放居中，适配不同手机比例（画布像素与 devicePixelRatio 无关，手机上不会按 3x 渲染）
const game = new Phaser.Game({
  type: Phaser.AUTO, width: 1280, height: 720, parent: 'game', backgroundColor: '#111', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 5 },
  scene: [TitleScene, BattleScene, UIScene],
});
(window as any).__game = game; (window as any).__mobile = IS_MOBILE;
