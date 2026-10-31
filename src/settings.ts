// 设置与存档（localStorage）
import type { SaveData } from './combat/World';
import type { ClassId } from './data/classes';
const SET_KEY = 'fcl_settings_v1', SAVE_KEY = 'fcl_save_v1';
const ls = () => { try { return globalThis.localStorage; } catch { return undefined; } };

/** 各职业自动技能推荐（按优先级） */
export const DEFAULT_AUTO_SKILLS: Record<ClassId, string[]> = {
  warrior: ['fire_sword', 'half_moon', 'thrust'],
  mage: ['magic_shield', 'ice_roar', 'thunder', 'fireball'],
  taoist: ['summon_skeleton', 'heal', 'poison', 'soul_fire'],
};
export const ZOOM_MIN = 0.8, ZOOM_MAX = 1.2, ZOOM_STEP = 0.05;

export const Settings = {
  volume: 0.7, muted: false, music: 0.5,
  /** 手机端虚拟按键：null=默认开；电脑端从不创建 pad，此字段仅在手机生效，与电脑设置互不影响 */
  showPadMobile: null as boolean | null,
  /** @deprecated 旧字段，加载时若 showPadMobile 未写入则忽略（避免电脑关按键影响手机） */
  showPad: undefined as boolean | null | undefined,
  lowFx: null as boolean | null,
  /** 进入怪物近战范围时自动普攻（不追怪，移动仍由玩家控制） */
  autoAttack: true,
  /** 自动释放的技能 id 列表（按优先级）；null=用职业推荐；[]=不放技能 */
  autoSkills: null as string[] | null,
  /** 画面缩放 0.8~1.2，适配不同手机；经 CSS transform 作用在画布上，HUD/虚拟键同步缩放 */
  zoom: 1,
  load() {
    try {
      const raw = JSON.parse(ls()?.getItem(SET_KEY) ?? '{}') as Record<string, unknown>;
      if (typeof raw.volume === 'number') this.volume = raw.volume;
      if (typeof raw.muted === 'boolean') this.muted = raw.muted;
      if (typeof raw.music === 'number') this.music = raw.music;
      if (typeof raw.lowFx === 'boolean' || raw.lowFx === null) this.lowFx = raw.lowFx as boolean | null;
      // 仅认 showPadMobile；旧 showPad 不迁移到手机，避免电脑关掉后手机也没按键
      if (typeof raw.showPadMobile === 'boolean' || raw.showPadMobile === null) this.showPadMobile = raw.showPadMobile as boolean | null;
      else this.showPadMobile = null;
      if (typeof raw.autoAttack === 'boolean') this.autoAttack = raw.autoAttack;
      if (raw.autoSkills === null) this.autoSkills = null;
      else if (Array.isArray(raw.autoSkills)) this.autoSkills = raw.autoSkills.filter((x): x is string => typeof x === 'string');
      if (typeof raw.zoom === 'number' && Number.isFinite(raw.zoom)) this.zoom = clampZoom(raw.zoom);
    } catch { /* ignore */ }
    return this;
  },
  save() {
    ls()?.setItem(SET_KEY, JSON.stringify({
      volume: this.volume, muted: this.muted, music: this.music,
      showPadMobile: this.showPadMobile, lowFx: this.lowFx,
      autoAttack: this.autoAttack, autoSkills: this.autoSkills, zoom: this.zoom,
    }));
  },
  /** 手机/触屏：null 或 true → 显示虚拟按键；电脑永远 false */
  wantPad(isMobile: boolean) { return isMobile && this.showPadMobile !== false; },
  apply(sound: { volume: number; mute: boolean }) { sound.volume = this.volume; sound.mute = this.muted; },
  /** 用 CSS transform 缩放画布；Phaser 用 getBoundingClientRect 映射输入，触控与虚拟键不跑偏 */
  applyZoom() {
    const z = clampZoom(this.zoom);
    this.zoom = z;
    try {
      const canvas = document.querySelector('#game canvas') as HTMLElement | null;
      if (canvas) {
        canvas.style.transform = z === 1 ? '' : `scale(${z})`;
        canvas.style.transformOrigin = 'center center';
      }
      const g = (globalThis as any).__game;
      if (g?.scale?.refresh) g.scale.refresh();
    } catch { /* node / 无 DOM */ }
  },
  setZoom(z: number) { this.zoom = clampZoom(z); this.applyZoom(); this.save(); },
  /** 取当前职业的自动技能：null → 职业推荐；[] → 不放 */
  skillsFor(cls: ClassId): string[] {
    return this.autoSkills === null ? DEFAULT_AUTO_SKILLS[cls] : this.autoSkills;
  },
  toggleAutoSkill(id: string, cls: ClassId) {
    const cur = [...this.skillsFor(cls)];
    const i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else cur.push(id);
    this.autoSkills = cur; // 一旦勾选过就写成显式列表（可为空）
    this.save();
  },
};
function clampZoom(z: number) {
  const n = Math.round(z / ZOOM_STEP) * ZOOM_STEP;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +n.toFixed(2)));
}
export const SaveStore = {
  has() { return !!ls()?.getItem(SAVE_KEY); },
  load(): SaveData | null { try { const s = JSON.parse(ls()?.getItem(SAVE_KEY) ?? 'null'); return s?.v === 1 ? s : null; } catch { return null; } },
  write(d: SaveData) { ls()?.setItem(SAVE_KEY, JSON.stringify(d)); },
  clear() { ls()?.removeItem(SAVE_KEY); },
};
