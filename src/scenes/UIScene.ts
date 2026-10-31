import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { Panel, PanelMode } from '../ui/Panel';
import { VirtualPad } from '../ui/VirtualPad';
import { MobileHud } from '../ui/MobileHud';
import { IS_MOBILE } from '../mobile';
import { Settings } from '../settings';
import type { BattleScene } from './BattleScene';
/** HUD 独立场景：固定在屏幕上，不随世界镜头滚动；面板打开时战斗暂停 */
export class UIScene extends Phaser.Scene {
  panel!: Panel; pad?: VirtualPad | MobileHud; mhud?: MobileHud;
  constructor() { super('UI'); }
  create() {
    const b = this.scene.get('Battle') as BattleScene;
    this.input.mouse?.disableContextMenu();
    this.panel = new Panel(this, () => b.world, (m, g) => { if (m) b.log(m, g); b.saveGame(); }, () => b.toTitle());
    this.panel.onTeleport = () => { b.handle(b.world.drainEvents()); b.saveGame(); };
    const modes: (PanelMode | 'shop')[] = ['bag', 'quests', 'skills', 'shop', 'settings'];
    const hud = new Hud(this, b.world.floor.name, b.floorIcons(), b.world.skills, i => b.openPanel(modes[i]), IS_MOBILE, k => b.onKey(k));
    b.attachHud(hud);
    // 手机：DOM 版专用 HUD 取代旧的映射方向键（输入只转发给 onKey/dx,dy）；电脑：保持原样
    if (IS_MOBILE) { this.pad = this.mhud = new MobileHud(b, hud); this.events.once('shutdown', () => { this.mhud?.destroy(); this.mhud = undefined; }); (window as any).__mhud = this.mhud; return; }
    { this.pad = new VirtualPad(this, b.world.skills, k => b.onKey(k)); this.pad.onStep = d => b.stepKey(d); this.pad.setVisible(false); }
  }
  update() {
    const b = this.scene.get('Battle') as BattleScene; if (!b?.world) return;
    this.panel?.refreshIfStale(); // #11：角色/技能面板打开时等级、经验变化即时刷新
    if (this.mhud) { this.mhud.setVisible(!this.panel.open && b.state === 'play'); this.mhud.update(b.cds); return; }
    if (!this.pad) return;
    this.pad.setVisible(Settings.wantPad(IS_MOBILE) && !this.panel.open && b.state === 'play');
    (this.pad as VirtualPad).update(b.cds, b.world.skills);
  }
}
