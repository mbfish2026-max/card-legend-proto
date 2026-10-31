import { PreloadScene } from './loader';
import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
import { IS_MOBILE, setupMobile, enableMobileOnTouch } from './mobile';
import { Settings } from './settings';
import { FxQuality } from './ui/Fx';
Settings.load();
Settings.applyZoom();
// 虚拟按键：手机端 showPadMobile===null 即默认开（Settings.wantPad），不写死进存档，避免电脑设置污染手机
if (Settings.lowFx === null) Settings.lowFx = IS_MOBILE;
FxQuality.low = !!Settings.lowFx;
setupMobile(); enableMobileOnTouch();
// 逻辑分辨率固定 1280×720，Scale.FIT 等比缩放居中，适配不同手机比例（画布像素与 devicePixelRatio 无关，手机上不会按 3x 渲染）
const game = new Phaser.Game({
  type: Phaser.AUTO, width: 1280, height: 720, parent: 'game', backgroundColor: '#111', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 5 },
  scene: [TitleScene, BattleScene, UIScene, PreloadScene],
});
(window as any).__game = game; (window as any).__mobile = IS_MOBILE;
// 画布创建后再应用一次缩放
game.events.once('ready', () => { Settings.applyZoom(); document.getElementById('boot')?.remove(); });
// 尺寸变化/旋转实时重算（iOS 旋转后视口晚到，补两次）
const reflow = () => { Settings.applyZoom(); setTimeout(() => Settings.applyZoom(), 120); setTimeout(() => Settings.applyZoom(), 400); };
window.addEventListener('resize', reflow);
window.addEventListener('orientationchange', reflow);
window.visualViewport?.addEventListener('resize', reflow);
// R10：生产环境注册 Service Worker（重复访问走缓存）
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {}));
