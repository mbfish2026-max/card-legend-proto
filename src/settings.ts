import { IS_MOBILE } from './mobile';
// 设置与存档（localStorage）
import type { SaveData } from './combat/World';
import type { ClassId } from './data/classes';
const SET_KEY = 'fcl_settings_v1', SAVE_KEY = 'fcl_save_v1';
const ls = () => { try { return globalThis.localStorage; } catch { return undefined; } };

/** 各职业自动技能推荐（按优先级） */
export const DEFAULT_AUTO_SKILLS: Record<ClassId, string[]> = {
  warrior: ['fire_sword', 'half_moon', 'rush', 'thrust'],
  mage: ['magic_shield', 'hell_thunder', 'ice_roar', 'lightning_flash', 'burst_fire', 'fire_wall', 'hell_fire', 'thunder', 'big_fireball', 'fireball'],
  taoist: ['summon_beast', 'summon_skeleton', 'heal', 'poison', 'soul_fire'],
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
  /** 已手动改过自动技能的职业；null=旧存档（列表对所有职业生效）。未改过的职业用推荐默认，避免改战士后法师/道士全被清空 */
  autoTouched: null as ClassId[] | null,
  /** 画面缩放 0.8~1.2，适配不同手机；经 CSS transform 作用在画布上，HUD/虚拟键同步缩放 */
  zoom: 1,
  /** 自适应：按视口（含安全区）等比 FIT，完整显示不裁切；null=手机默认开/电脑默认关 */
  zoomAuto: null as boolean | null,
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
      if (Array.isArray(raw.autoTouched)) this.autoTouched = raw.autoTouched.filter((x): x is ClassId => typeof x === 'string' && x in DEFAULT_AUTO_SKILLS);
      if (typeof raw.zoomAuto === 'boolean' || raw.zoomAuto === null) this.zoomAuto = raw.zoomAuto as boolean | null;
      if (typeof raw.zoom === 'number' && Number.isFinite(raw.zoom)) this.zoom = clampZoom(raw.zoom);
    } catch { /* ignore */ }
    return this;
  },
  save() {
    ls()?.setItem(SET_KEY, JSON.stringify({
      volume: this.volume, muted: this.muted, music: this.music,
      showPadMobile: this.showPadMobile, lowFx: this.lowFx,
      autoAttack: this.autoAttack, autoSkills: this.autoSkills, autoTouched: this.autoTouched, zoom: this.zoom, zoomAuto: this.zoomAuto,
    }));
  },
  /** 手机/触屏：null 或 true → 显示虚拟按键；电脑永远 false */
  wantPad(isMobile: boolean) { return isMobile && this.showPadMobile !== false; },
  apply(sound: { volume: number; mute: boolean }) { sound.volume = this.volume; sound.mute = this.muted; },
  /** 用 CSS transform 缩放画布；Phaser 用 getBoundingClientRect 映射输入，触控与虚拟键不跑偏 */
  isAutoZoom(mobile = IS_MOBILE) { return this.zoomAuto ?? mobile; },
  setAutoZoom(on = true) { this.zoomAuto = on; this.applyZoom(); this.save(); },
  /** 自适应时实际显示比例（相对 1280×720 逻辑分辨率），用于面板显示 */
  fitPercent(): number {
    try {
      const el = document.querySelector('#game') as HTMLElement | null; if (!el) return 100;
      const cs = getComputedStyle(el), px = (v: string) => parseFloat(v) || 0;
      const w = el.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight), h = el.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
      return Math.round(fitScale(w, h) * 100);
    } catch { return 100; }
  },
  applyZoom() {
    const z = this.isAutoZoom() ? 1 : clampZoom(this.zoom);
    if (!this.isAutoZoom()) this.zoom = z;
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
  setZoom(z: number) { this.zoomAuto = false; this.zoom = clampZoom(z); this.applyZoom(); this.save(); },
  /** 取当前职业的自动技能：null → 职业推荐；[] → 不放 */
  skillsFor(cls: ClassId): string[] {
    if (this.autoSkills === null) return DEFAULT_AUTO_SKILLS[cls];
    if (this.autoTouched && !this.autoTouched.includes(cls)) return DEFAULT_AUTO_SKILLS[cls];
    return this.autoTouched ? this.autoSkills.filter(id => DEFAULT_AUTO_SKILLS[cls].includes(id)) : this.autoSkills;
  },
  toggleAutoSkill(id: string, cls: ClassId) {
    const cur = [...this.skillsFor(cls)];
    const i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else cur.push(id);
    // 按职业分别保存：保留其他职业已改过的勾选，本职业写成显式列表（可为空）
    const mine = new Set(DEFAULT_AUTO_SKILLS[cls]);
    const touched = this.autoTouched ?? [];
    const others = this.autoSkills === null ? [] : this.autoSkills.filter(id => !mine.has(id));
    this.autoSkills = [...others, ...cur];
    this.autoTouched = touched.includes(cls) ? touched : [...touched, cls];
    this.save();
  },
};
/** 等比完整放入 w×h 的比例（不裁切、不失真） */
export function fitScale(w: number, h: number) { return w > 0 && h > 0 ? Math.min(w / 1280, h / 720) : 1; }
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
