// 设置与存档（localStorage）
import type { SaveData } from './combat/World';
const SET_KEY = 'fcl_settings_v1', SAVE_KEY = 'fcl_save_v1';
const ls = () => { try { return globalThis.localStorage; } catch { return undefined; } };
export const Settings = {
  volume: 0.7, muted: false,
  load() { try { Object.assign(this, JSON.parse(ls()?.getItem(SET_KEY) ?? '{}')); } catch { /* ignore */ } return this; },
  save() { ls()?.setItem(SET_KEY, JSON.stringify({ volume: this.volume, muted: this.muted })); },
  apply(sound: { volume: number; mute: boolean }) { sound.volume = this.volume; sound.mute = this.muted; },
};
export const SaveStore = {
  has() { return !!ls()?.getItem(SAVE_KEY); },
  load(): SaveData | null { try { const s = JSON.parse(ls()?.getItem(SAVE_KEY) ?? 'null'); return s?.v === 1 ? s : null; } catch { return null; } },
  write(d: SaveData) { ls()?.setItem(SAVE_KEY, JSON.stringify(d)); },
  clear() { ls()?.removeItem(SAVE_KEY); },
};
