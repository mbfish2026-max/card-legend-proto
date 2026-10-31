import Phaser from 'phaser';
import { Settings, ZOOM_STEP } from '../settings';
import { CLASSES, ClassId } from '../data/classes';
import { txt, button } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';

export interface SettingsViewOpts {
  cls: ClassId;
  rerender: () => void;
  /** 标题界面：可切换为哪个职业设置自动技能 */
  onPickClass?: (c: ClassId) => void;
  footer: { label: string; w: number; fn: () => void }[];
}
/** 设置面板唯一实现：标题（进入前）与游戏内共用，同一份 Settings 数据 */
export function autoSkillList(cls: ClassId) {
  return CLASSES[cls].skills.filter(s => !s.passive).map((s, i) => ({ ...s, key: `F${i + 1}` }));
}
export function renderSettingsView(s: Phaser.Scene, R: Phaser.GameObjects.Container, top: number, o: SettingsViewOpts) {
  const cls = o.cls;
  const vol = txt(s, 640, top + 70, '', 20).setOrigin(0.5); R.add(vol);
  const refresh = () => { vol.setText(`音量 ${Math.round(Settings.volume * 100)}%${Settings.muted ? '（静音）' : ''}`); Settings.apply(s.sound); Settings.save(); };
  R.add([...button(s, 500, top + 70, 50, 36, '－', () => { Settings.volume = Math.max(0, +(Settings.volume - 0.1).toFixed(1)); refresh(); })]);
  R.add([...button(s, 780, top + 70, 50, 36, '＋', () => { Settings.volume = Math.min(1, +(Settings.volume + 0.1).toFixed(1)); refresh(); })]);
  R.add([...button(s, 560, top + 118, 160, 36, '静音 (N)', () => { Settings.muted = !Settings.muted; refresh(); }, 16)]);
  R.add([...button(s, 740, top + 118, 160, 36, `低特效：${Settings.lowFx ? '开' : '关'}`, () => { Settings.lowFx = !Settings.lowFx; FxQuality.low = !!Settings.lowFx; Settings.save(); o.rerender(); }, 15)]);
  if (IS_MOBILE) {
    const on = Settings.wantPad(true);
    R.add([...button(s, 640, top + 162, 220, 36, `虚拟按键：${on ? '开' : '关'}`, () => {
      Settings.showPadMobile = !Settings.wantPad(true); Settings.save(); o.rerender();
    }, 15)]);
  } else {
    R.add(txt(s, 640, top + 162, '虚拟按键：电脑默认关', 13, '#888').setOrigin(0.5));
  }
  R.add([...button(s, 640, top + 210, 280, 38, `自动攻击：${Settings.autoAttack ? '开' : '关'}`, () => {
    Settings.autoAttack = !Settings.autoAttack; Settings.save(); o.rerender();
  }, 17)]);
  R.add(txt(s, 640, top + 248, '开启后贴脸自动普攻（不追怪）；勾选技能按优先级/冷却自动放；手动按键优先', 12, '#9ab').setOrigin(0.5));
  // 自动技能勾选（标题界面可切职业；游戏内为当前职业）
  if (o.onPickClass) (Object.keys(CLASSES) as ClassId[]).forEach((c, i) => {
    R.add([...button(s, 770 + i * 64, top + 22, 60, 30, `${c === cls ? '▶' : ''}${CLASSES[c].name}`, () => o.onPickClass!(c), 13)]);
  });
  const selected = new Set(Settings.skillsFor(cls));
  autoSkillList(cls).forEach((sk, i) => {
    const on = selected.has(sk.id);
    const x = 280 + (i % 4) * 180, y = top + 288 + Math.floor(i / 4) * 40;
    R.add([...button(s, x, y, 168, 34, `${on ? '✓' : '○'} ${sk.key} ${sk.name}`, () => {
      Settings.toggleAutoSkill(sk.id, cls); o.rerender();
    }, 13)]);
  });
  R.add(txt(s, 640, top + 372, `画面缩放 ${Math.round(Settings.zoom * 100)}%`, 18, '#ffe8a0').setOrigin(0.5));
  R.add([...button(s, 480, top + 372, 50, 36, '－', () => { Settings.setZoom(Settings.zoom - ZOOM_STEP); o.rerender(); })]);
  R.add([...button(s, 800, top + 372, 50, 36, '＋', () => { Settings.setZoom(Settings.zoom + ZOOM_STEP); o.rerender(); })]);
  ;[0.8, 0.9, 1, 1.1, 1.2].forEach((z, i) => {
    R.add([...button(s, 400 + i * 80, top + 414, 70, 30, `${Math.round(z * 100)}%`, () => { Settings.setZoom(z); o.rerender(); }, 13)]);
  });
  const fw = o.footer.reduce((a, f) => a + f.w + 40, -40); let fx = 640 - fw / 2;
  for (const f of o.footer) { R.add([...button(s, fx + f.w / 2, top + 460, f.w, 40, f.label, f.fn, 16)]); fx += f.w + 40; }
  R.add(txt(s, 640, top + 500, IS_MOBILE
    ? '缩放用于适配不同手机；虚拟键/HUD 随画布一起缩放。竖屏会提示旋转'
    : '电脑也可调缩放预览；手机浏览器打开虚拟按键默认开', 12, '#999').setOrigin(0.5));
  refresh();
}
