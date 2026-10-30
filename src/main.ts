import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { UIScene } from './scenes/UIScene';
// 图标原图 64x64，放大时用最近邻缩放保持清晰
const game = new Phaser.Game({ type: Phaser.AUTO, width: 1280, height: 720, parent: 'game', backgroundColor: '#111', pixelArt: true, scene: [TitleScene, BattleScene, UIScene] });
(window as any).__game = game;
