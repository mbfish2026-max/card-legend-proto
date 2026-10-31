import { PreloadScene } from './loader';
import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
import { IS_MOBILE, setupMobile, enableMobileOnTouch } from './mobile';
import { Settings } from './settings';
import { FxQuality } from './ui/Fx';
import { Render, resolveResK, LOGIC_W, LOGIC_H } from './render';
Settings.load();
Settings.applyZoom();
// 虚拟按键：手机端 showPadMobile===null 即默认开（Settings.wantPad），不写死进存档，避免电脑设置污染手机
if (Settings.lowFx === null) Settings.lowFx = IS_MOBILE;
FxQuality.low = !!Settings.lowFx;
setupMobile(); enableMobileOnTouch();
// 画质：画布 = 1280k×720k，各场景相机 zoom=k 居中，逻辑坐标不变；文字按 k 倍分辨率栅格化
const K = Render.k = resolveResK(Settings.res, window.devicePixelRatio || 1, window.innerWidth, window.innerHeight, IS_MOBILE);
const origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (this: Phaser.GameObjects.GameObjectFactory, ...a: Parameters<typeof origText>) { const t = origText.apply(this, a); if (K !== 1) t.setResolution(K); return t; };
const origMake = Phaser.GameObjects.GameObjectCreator.prototype.text;
Phaser.GameObjects.GameObjectCreator.prototype.text = function (this: Phaser.GameObjects.GameObjectCreator, ...a: Parameters<typeof origMake>) { const t = origMake.apply(this, a); if (K !== 1) t.setResolution(K); return t; };
// 逻辑分辨率固定 1280×720，Scale.FIT 等比缩放居中，适配不同手机比例（画布像素与 devicePixelRatio 无关，手机上不会按 3x 渲染）
const game = new Phaser.Game({
  type: Phaser.AUTO, width: LOGIC_W * K, height: LOGIC_H * K, parent: 'game', backgroundColor: '#111',
  // 720p 维持原 pixelArt（最近邻）；高档位：素材多为手绘插画（非像素画），非整数倍放大时最近邻粗细不均，改线性过滤 + 抗锯齿
  pixelArt: K === 1, antialias: K !== 1, roundPixels: K === 1,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 5 },
  scene: [TitleScene, BattleScene, UIScene, PreloadScene],
});
// 每个场景 create 后：相机 zoom=k；非跟随相机把视口中心对准逻辑中心（跟随相机由 Phaser 按 zoom 计算）
if (K !== 1) game.events.once('ready', () => { for (const sc of game.scene.scenes) sc.sys.events.on('create', () => { const c = sc.cameras.main; c.setZoom(K); if (!(c as any)._follow) c.centerOn(LOGIC_W / 2, LOGIC_H / 2); }); });
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
