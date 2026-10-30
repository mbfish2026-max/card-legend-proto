import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { Panel, PanelMode } from '../ui/Panel';
import type { BattleScene } from './BattleScene';
/** HUD 独立场景：固定在屏幕上，不随世界镜头滚动；面板打开时战斗暂停 */
export class UIScene extends Phaser.Scene {
  panel!: Panel;
  constructor() { super('UI'); }
  create() {
    const b = this.scene.get('Battle') as BattleScene;
    this.input.mouse?.disableContextMenu();
    this.panel = new Panel(this, () => b.world, (m, g) => { if (m) b.log(m, g); b.saveGame(); }, () => b.toTitle());
    const modes: (PanelMode | 'shop')[] = ['bag', 'bag', 'skills', 'shop', 'settings'];
    b.attachHud(new Hud(this, b.world.floor.name, b.floorIcons(), b.world.skills, i => b.openPanel(modes[i])));
  }
}
