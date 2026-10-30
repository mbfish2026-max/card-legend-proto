import Phaser from 'phaser';
import { Settings } from './settings';
/** 背景音乐：每层/首领/标题不同曲目，交叉淡入淡出；受静音与音乐音量控制；移动端在首次触摸解锁音频后才开始播放 */
export const MUSIC: Record<string, string> = {
  title: 'assets/music/title.ogg', boss: 'assets/music/boss.ogg',
  floor1: 'assets/music/floor1.ogg', floor2: 'assets/music/floor2.ogg', floor3: 'assets/music/floor3.ogg', floor4: 'assets/music/floor4.ogg', floor5: 'assets/music/floor5.ogg',
};
let cur: Phaser.Sound.BaseSound | undefined, curKey = '';
export function playMusic(s: Phaser.Scene, key: string, fadeMs = 1200) {
  if (key === curKey && cur?.isPlaying) return;
  const id = 'bgm_' + key; if (!s.cache.audio.exists(id)) return;
  const start = () => {
    if (key === curKey && cur?.isPlaying) return;
    const old = cur; curKey = key;
    if (old) fade(s, old, 0, fadeMs, true);
    try {
      const m = s.sound.add(id, { loop: true, volume: 0 }); m.play(); cur = m;
      fade(s, m, Settings.music, fadeMs, false);
    } catch { /* ignore */ }
  };
  if (s.sound.locked) { curKey = ''; s.sound.once(Phaser.Sound.Events.UNLOCKED, start); } else start();
}
/** 用代理对象做淡入淡出，声音被销毁/场景切换时不会报错 */
function fade(s: Phaser.Scene, snd: Phaser.Sound.BaseSound, to: number, ms: number, kill: boolean) {
  const a = snd as any; const o = { v: safeVol(a) };
  const set = (v: number) => { try { if (a.pendingRemove === false || a.manager) a.volume = v; } catch { /* 已销毁 */ } };
  const done = () => { set(to); if (kill) { try { snd.stop(); snd.destroy(); } catch { /* */ } } };
  try { s.tweens.add({ targets: o, v: to, duration: ms, onUpdate: () => set(o.v), onComplete: done, onStop: done }); } catch { done(); }
}
function safeVol(a: any) { try { return a.volume ?? 0; } catch { return 0; } }
export function setMusicVolume(v: number) { if (cur) (cur as any).volume = v; }
export function stopMusic() { cur?.stop(); cur?.destroy(); cur = undefined; curKey = ''; }
