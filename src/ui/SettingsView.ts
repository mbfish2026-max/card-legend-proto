import Phaser from 'phaser';
import { Settings, ZOOM_STEP } from '../settings';
import { CLASSES, ClassId } from '../data/classes';
import { txt, button } from '../scenes/TitleScene';
import { IS_MOBILE } from '../mobile';
import { FxQuality } from './Fx';
import { Render, RES_OPTIONS, type ResId } from '../render';

export interface SettingsViewOpts {
  cls: ClassId;
  /** R11 已学技能：自动技能勾选只列已学的（缺省 = 全部） */
  learned?: Set<string>;
  rerender: () => void;
  /** 标题界面：可切换为哪个职业设置自动技能 */
  onPickClass?: (c: ClassId) => void;
  footer: { label: string; w: number; fn: () => void }[];
}
/** 设置面板唯一实现：标题（进入前）与游戏内共用，同一份 Settings 数据 */
export function autoSkillList(cls: ClassId, learned?: Set<string>) {
  return CLASSES[cls].skills.filter(s => !s.passive && (!learned || learned.has(s.id))).map((s, i) => ({ ...s, key: `F${i + 1}` }));
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
    R.add([...button(s, 400, top + 162, 200, 36, `虚拟按键：${on ? '开' : '关'}`, () => {
      Settings.showPadMobile = !Settings.wantPad(true); Settings.save(); o.rerender();
    }, 15)]);
  } else {
    R.add(txt(s, 400, top + 162, '虚拟按键：电脑默认关', 13, '#888').setOrigin(0.5));
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
  autoSkillList(cls, o.learned).forEach((sk, i) => {
    const on = selected.has(sk.id);
    const x = 280 + (i % 4) * 180, y = top + 288 + Math.floor(i / 4) * 40;
    R.add([...button(s, x, y, 168, 34, `${on ? '✓' : '○'} ${sk.key} ${sk.name}`, () => {
      Settings.toggleAutoSkill(sk.id, cls); o.rerender();
    }, 13)]);
  });
  const auto = Settings.isAutoZoom();
  R.add(txt(s, 640, top + 372, auto ? `画面缩放 自适应（${Settings.fitPercent()}%）` : `画面缩放 ${Math.round(Settings.zoom * 100)}%`, 18, '#ffe8a0').setOrigin(0.5));
  R.add([...button(s, 460, top + 372, 50, 36, '－', () => { Settings.setZoom((auto ? 1 : Settings.zoom) - ZOOM_STEP); o.rerender(); })]);
  R.add([...button(s, 820, top + 372, 50, 36, '＋', () => { Settings.setZoom((auto ? 1 : Settings.zoom) + ZOOM_STEP); o.rerender(); })]);
  R.add([...button(s, 360, top + 414, 86, 30, `${auto ? '●' : ''}自适应`, () => { Settings.setAutoZoom(true); o.rerender(); }, 13)]);
  ;[0.8, 0.9, 1, 1.1, 1.2].forEach((z, i) => {
    const on = !auto && Math.abs(Settings.zoom - z) < 0.001;
    R.add([...button(s, 460 + i * 80, top + 414, 70, 30, `${on ? '●' : ''}${Math.round(z * 100)}%`, () => { Settings.setZoom(z); o.rerender(); }, 13)]);
  });
  const fw = o.footer.reduce((a, f) => a + f.w + 40, -40); let fx = 640 - fw / 2;
  for (const f of o.footer) { R.add([...button(s, fx + f.w / 2, top + 460, f.w, 40, f.label, f.fn, 16)]); fx += f.w + 40; }
  // 画质/分辨率：只改渲染像素，布局不变；切换后重载生效
  R.add(txt(s, 555, top + 162, `画质 ${RES_OPTIONS.find(r => r.k === Render.k)?.label ?? ''}`, 14, '#ffe0a0').setOrigin(0.5));
  (['auto', '720', '1080', '1440'] as ResId[]).forEach((id, i) => {
    const on = Settings.res === id, lab = id === 'auto' ? '自动' : RES_OPTIONS.find(r => r.id === id)!.label;
    R.add([...button(s, 650 + i * 86, top + 162, 80, 32, `${on ? '●' : ''}${lab}`, () => { if (Settings.res === id) return; Settings.res = id; Settings.save(); location.reload(); }, 13)]);
  });
  refresh();
}
