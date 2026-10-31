import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { Panel, PanelMode } from '../ui/Panel';
import { VirtualPad } from '../ui/VirtualPad';
import { IS_MOBILE } from '../mobile';
import { Settings } from '../settings';
import type { BattleScene } from './BattleScene';
/** HUD 独立场景：固定在屏幕上，不随世界镜头滚动；面板打开时战斗暂停 */
export class UIScene extends Phaser.Scene {
  panel!: Panel; pad?: VirtualPad;
  constructor() { super('UI'); }
  create() {
    const b = this.scene.get('Battle') as BattleScene;
    this.input.mouse?.disableContextMenu();
    this.panel = new Panel(this, () => b.world, (m, g) => { if (m) b.log(m, g); b.saveGame(); }, () => b.toTitle());
    this.panel.onTeleport = () => { b.handle(b.world.drainEvents()); b.saveGame(); };
    const modes: (PanelMode | 'shop')[] = ['bag', 'quests', 'skills', 'shop', 'settings'];
    b.attachHud(new Hud(this, b.world.floor.name, b.floorIcons(), b.world.skills, i => b.openPanel(modes[i]), IS_MOBILE));
    { this.pad = new VirtualPad(this, b.world.skills, k => b.onKey(k)); this.pad.onStep = d => b.stepKey(d); this.pad.setVisible(false); }
  }
  update() {
    const b = this.scene.get('Battle') as BattleScene; if (!this.pad || !b.world) return;
    this.pad.setVisible(Settings.wantPad(IS_MOBILE) && !this.panel.open && b.state === 'play');
    this.pad.update(b.cds, b.world.skills);
  }
}
