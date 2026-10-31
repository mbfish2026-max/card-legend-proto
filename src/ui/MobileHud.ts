import { POTIONS } from '../data/skills';
import { fmtInt } from './fmt';
import { Settings } from '../settings';
import { fmtExp } from '../data/expCurve';
import type { BattleScene } from '../scenes/BattleScene';
import type { Hud } from './Hud';
/**
 * 手机专用 HUD（DOM 层，CSS 像素 + safe-area）：只替换显示/输入层，所有动作都转发给 BattleScene.onKey / dx,dy，
 * 不复制任何游戏逻辑。电脑端不创建本类（见 UIScene）。docs/mobile-ui.md 有「桌面功能 → 手机入口」对照表。
 */
const CSS = `
#mhud{position:fixed;inset:0;pointer-events:none;z-index:20;font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#ffe8a0;
 -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;
 --sl:max(env(safe-area-inset-left),6px);--sr:max(env(safe-area-inset-right),6px);--st:max(env(safe-area-inset-top),4px);--sb:max(env(safe-area-inset-bottom),6px)}
#mhud.off .ctl{display:none}
#mhud .b{pointer-events:auto;box-sizing:border-box;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;flex-direction:column;
 background:radial-gradient(circle at 50% 35%,rgba(74,50,22,.9),rgba(30,20,10,.88));border:2px solid #b8893a;border-radius:10px;color:#ffe8a0;font-size:12px;line-height:1.1;
 text-shadow:0 1px 2px #000;touch-action:none}
#mhud .b:active,#mhud .b.on{filter:brightness(1.35)}
#mhud .b .ic{font-size:17px;line-height:1}
#mh-bars{position:absolute;left:var(--sl);top:var(--st);width:min(30vw,250px);pointer-events:none}
.mh-bar{position:relative;height:13px;margin-bottom:3px;background:rgba(0,0,0,.6);border:1px solid #6b5020;border-radius:3px;overflow:hidden}
.mh-bar i{position:absolute;left:0;top:0;bottom:0;width:0}
.mh-bar span{position:absolute;inset:0;font-size:11px;line-height:13px;text-align:center;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}
.mh-bar.exp{height:12px}.mh-bar.exp span{font-size:10px;line-height:12px}
#mh-info{font-size:11px;color:#ffe8a0;text-shadow:0 0 2px #000,0 0 2px #000;white-space:nowrap}
#mh-log{position:absolute;left:var(--sl);top:calc(var(--st) + 66px);width:min(30vw,250px);background:rgba(0,0,0,.35);border-radius:6px;padding:2px 6px;
 font-size:12px;line-height:16px;max-height:50px;overflow:hidden;pointer-events:auto;min-height:44px;box-sizing:border-box}
#mh-log.open{max-height:none;background:rgba(0,0,0,.7)}
#mh-log div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mh-log.open div{white-space:normal}
#mh-top{position:absolute;right:var(--sr);top:var(--st);display:flex;gap:4px}
#mh-top .b{width:48px;height:46px}
#mh-floor{position:absolute;top:var(--st);left:50%;transform:translateX(-50%);font-size:13px;color:#ffe8a0;text-shadow:0 0 3px #000,0 0 3px #000;white-space:nowrap;pointer-events:none;text-align:center}
#mh-joy{position:absolute;left:0;bottom:0;width:34vw;height:60vh;pointer-events:auto;touch-action:none}
#mh-joy .base{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;display:none;
 background:rgba(0,0,0,.18);border:2px solid rgba(255,232,160,.35)}
#mh-joy.act .base{display:block}#mh-joy.act .hint{opacity:.15}
#mh-joy .hint{position:absolute;left:var(--sl);bottom:var(--sb);width:56px;height:56px;border-radius:50%;background:rgba(0,0,0,.25);border:2px solid rgba(255,232,160,.45);
 color:rgba(255,232,160,.85);font-size:11px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2}
#mh-joy .knob{position:absolute;left:36px;top:36px;width:48px;height:48px;border-radius:50%;background:rgba(255,232,160,.35);border:2px solid rgba(255,232,160,.6)}
#mh-act.hot{box-shadow:0 0 12px 3px rgba(255,210,90,.85);border-color:#ffd060!important}
#mh-act{position:absolute;right:calc(var(--sr) + 8px);bottom:calc(var(--sb) + 8px);width:68px;height:68px;border-radius:50%!important;font-size:15px!important;font-weight:bold}
#mhud .sk{position:absolute;width:50px;height:50px;border-radius:50%;padding:0;overflow:hidden;background-size:cover;background-position:center}
#mhud .sk .cd{position:absolute;inset:0;border-radius:50%}
#mhud .sk .k{position:absolute;bottom:1px;right:6px;font-size:10px;color:#fff}
#mhud .sk .cdt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:bold}
#mh-pots{position:absolute;bottom:calc(var(--sb) + 4px);display:flex;gap:4px}
#mh-pots .b{width:46px;height:46px;position:relative;padding:0;background-size:70%;background-repeat:no-repeat;background-position:center}
#mh-pots .b span{position:absolute;right:3px;bottom:1px;font-size:11px;color:#fff}
#mh-auto{position:absolute;width:52px;height:44px}
#mh-page{position:absolute;width:52px;height:44px}
#mh-comp{position:absolute;display:flex;gap:4px}
#mh-comp .b{width:48px;height:44px}
`;
type Btn = HTMLDivElement;
export class MobileHud {
  root: HTMLDivElement; dx = 0; dy = 0; onStep?: (d: number) => void;
  private bars: Record<string, [HTMLElement, HTMLElement]> = {}; private info!: HTMLElement; private log!: HTMLElement; private floor!: HTMLElement;
  private skBtns: { el: Btn; cd: HTMLElement; t: HTMLElement; i: number }[] = []; private potBtns: HTMLElement[] = [];
  private act!: Btn; private auto!: Btn; private page!: Btn; skPage = 0; private comp!: HTMLElement; private skSig = ''; private logSig = '';
  constructor(private b: BattleScene, private hud: Hud) {
    if (!document.getElementById('mhud-css')) { const st = document.createElement('style'); st.id = 'mhud-css'; st.textContent = CSS; document.head.appendChild(st); }
    document.getElementById('mhud')?.remove();
    const r = this.root = document.createElement('div'); r.id = 'mhud'; document.body.appendChild(r);
    // 左上：细条 HP/MP/EXP（带数字）+ 简要属性
    const bars = this.el('div', r, 'ctl'); bars.id = 'mh-bars';
    for (const [k, c] of [['hp', '#c0201a,#ff5a3a'], ['mp', '#1a3cc0,#4a8aff'], ['exp', '#b08a20,#ffd24a']]) {
      const w = this.el('div', bars, 'mh-bar ' + k); const i = this.el('i', w); i.style.background = `linear-gradient(${c})`; this.bars[k] = [i, this.el('span', w)];
    }
    this.info = this.el('div', bars); this.info.id = 'mh-info';
    // 可折叠日志（默认 3 行，点开 6 行）
    this.log = this.el('div', r, 'ctl'); this.log.id = 'mh-log'; this.tap(this.log, () => this.log.classList.toggle('open'));
    this.floor = this.el('div', r, 'ctl'); this.floor.id = 'mh-floor';
    // 右上：功能图标，每个功能只出现一次
    const top = this.el('div', r, 'ctl'); top.id = 'mh-top';
    const icon = (ic: string, label: string, k: string, id: string) => { const e = this.btn(top, `<span class="ic">${ic}</span>${label}`, () => b.onKey(k)); e.dataset.id = id; return e; };
    icon('🎒', '角色', 'B', 'bag'); icon('📜', '技能', 'K', 'skills'); icon('🎯', '悬赏', 'Q', 'quests'); icon('🗺', '传送', 'M', 'map'); // 地图面板即传送界面（点已到达入口传送）
    // 商人/传送合并为右下「对话/进入」键（城里 T 与 W 同为 townUse；战斗地图没有商人），不再单列商店图标
    icon('🏯', '回城', 'S', 'town'); icon('⚙', '设置', 'ESCAPE', 'settings');
    // 左下：浮动摇杆（左下区域任意处按下即在指下出现，不常驻遮挡主角；角落只留一个小提示），多点触控按 pointerId 区分
    const joy = this.el('div', r, 'ctl'); joy.id = 'mh-joy'; this.el('div', joy, 'hint').innerHTML = '◀ ▶<br>移动';
    const base = this.el('div', joy, 'base'); const knob = this.el('div', base, 'knob');
    let pid = -1; const R = 44;
    const mv = (e: PointerEvent) => {
      const bb = base.getBoundingClientRect(); let x = e.clientX - (bb.left + bb.width / 2), y = e.clientY - (bb.top + bb.height / 2);
      const d = Math.hypot(x, y); if (d > R) { x *= R / d; y *= R / d; }
      knob.style.transform = `translate(${x}px,${y}px)`;
      this.dx = Math.abs(x) > R * 0.35 ? Math.sign(x) : 0; this.dy = Math.abs(y) > R * 0.5 ? Math.sign(y) : 0;
    };
    const end = (e: PointerEvent) => { if (e.pointerId !== pid) return; pid = -1; this.dx = this.dy = 0; knob.style.transform = ''; joy.classList.remove('act'); };
    joy.addEventListener('pointerdown', e => { if (pid >= 0) return; pid = e.pointerId; joy.setPointerCapture?.(pid); e.preventDefault();
      const jb = joy.getBoundingClientRect(); base.style.left = Math.max(62, e.clientX - jb.left) + 'px'; base.style.top = Math.min(jb.height - 62, e.clientY - jb.top) + 'px'; joy.classList.add('act'); mv(e); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === pid) mv(e); });
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    // 右下：互动（传送/对话）+ 技能弧 + 自动 + 药水 + 合击
    this.act = this.btn(r, '进入', () => b.mobileAct()); this.act.id = 'mh-act'; this.act.classList.add('ctl');
    this.auto = this.btn(r, '', () => { Settings.autoAttack = !Settings.autoAttack; Settings.save(); }); this.auto.id = 'mh-auto'; this.auto.classList.add('ctl');
    // 技能多于 10 个（传世技能等）：弧形翻页，每页 10 个（内 4 外 6）
    this.page = this.btn(r, '', () => { this.skPage++; this.layoutSkills(); }); this.page.id = 'mh-page'; this.page.classList.add('ctl');
    const pots = this.el('div', r, 'ctl'); pots.id = 'mh-pots';
    POTIONS.forEach((p, i) => { const e = this.btn(pots, '<span></span>', () => b.onKey(p.key)); e.dataset.id = 'pot' + i; e.style.backgroundImage = this.texUrl('potion_' + i); this.potBtns.push(e.firstChild as HTMLElement); });
    this.comp = this.el('div', r, 'ctl'); this.comp.id = 'mh-comp';
    [['召唤', 'R'], ['状态', 'E'], ['合击', 'G']].forEach(([l, k]) => { const e = this.btn(this.comp, l, () => b.onKey(k)); e.dataset.id = 'comp' + k; });
    // 禁止页面缩放/下拉刷新/长按菜单（body.mobile 已 touch-action:none，这里再兜底）
    r.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    this.layoutSkills();
  }
  private el<K extends keyof HTMLElementTagNameMap>(t: K, p: HTMLElement, cls = '') { const e = document.createElement(t); if (cls) e.className = cls; p.appendChild(e); return e; }
  private tap(e: HTMLElement, fn: () => void) { e.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); }); }
  private btn(p: HTMLElement, html: string, fn: () => void): Btn { const e = this.el('div', p, 'b'); e.innerHTML = html; this.tap(e, fn); return e; }
  private texUrl(key: string) {
    const t = this.b.textures; if (!t.exists(key)) return '';
    // Phaser 用 blob URL 加载后会回收，不能直接用 img.src；画到 canvas 转 dataURL
    try { const img: any = t.get(key).getSourceImage(); const c = document.createElement('canvas'); const k = Math.min(1, 96 / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k)); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); return `url("${c.toDataURL()}")`; } catch { return ''; }
  }
  /** 技能弧：以「进入」键为圆心的两圈（内圈 4、外圈其余），被动技能不放 */
  private layoutSkills() {
    this.skBtns.forEach(s => s.el.remove()); this.skBtns = [];
    const sk = this.b.world.skills; const act = sk.map((s, i) => ({ s, i })).filter(o => !o.s.passive);
    this.skSig = sk.map(s => s.id).join();
    const ring = (n: number, k: number, rad: number) => { const a0 = 180, a1 = 270, a = n === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * k / (n - 1); return [Math.cos(a * Math.PI / 180) * rad, Math.sin(a * Math.PI / 180) * rad]; };
    const pages = Math.max(1, Math.ceil(act.length / 10)); this.skPage %= pages;
    const cur = act.slice(this.skPage * 10, this.skPage * 10 + 10), inner = cur.slice(0, 4), outer = cur.slice(4, 10);
    this.page.style.display = pages > 1 ? 'flex' : 'none'; this.page.innerHTML = `翻页<br>${this.skPage + 1}/${pages}`;
    [[inner, 92], [outer, 152]].forEach(([list, rad]) => (list as typeof act).forEach((o, k) => {
      const [x, y] = ring((list as typeof act).length, k, rad as number);
      const e = this.btn(this.root, '', () => this.b.onKey(o.s.key)); e.classList.add('sk', 'ctl'); e.dataset.id = 'sk_' + o.s.id; e.title = o.s.name;
      e.style.backgroundImage = this.texUrl('sk_' + o.s.id);
      e.style.right = `calc(var(--sr) + ${42 - 25 - x + 8}px)`; e.style.bottom = `calc(var(--sb) + ${42 - 25 - y + 8}px)`;
      const cd = this.el('div', e, 'cd'), t = this.el('div', e, 'cdt'); this.el('span', e, 'k').textContent = o.s.key.replace('F', 'F');
      this.skBtns.push({ el: e, cd, t, i: o.i });
    }));
    // 自动开关放弧的上方；药水放弧左侧；合击放药水上方
    const outerR = act.length > 4 ? 152 : 92;
    this.auto.style.right = `calc(var(--sr) + 8px)`; this.auto.style.bottom = `calc(var(--sb) + ${outerR + 50 + 8}px)`;
    this.page.style.right = `calc(var(--sr) + 66px)`; this.page.style.bottom = `calc(var(--sb) + ${outerR + 50 + 8}px)`;
    const pots = this.root.querySelector('#mh-pots') as HTMLElement; pots.style.right = `calc(var(--sr) + ${outerR + 50 + 14}px)`;
    this.comp.style.right = `calc(var(--sr) + ${outerR + 50 + 14}px)`; this.comp.style.bottom = `calc(var(--sb) + 56px)`;
  }
  reset() { this.dx = this.dy = 0; }
  setVisible(v: boolean) { this.root.classList.toggle('off', !v); if (!v) this.dx = this.dy = 0; }
  update(cds: number[]) {
    const w = this.b.world, h = w.hero; if (!w) return;
    if (w.skills.map(s => s.id).join() !== this.skSig) this.layoutSkills();
    const set = (k: string, cur: number, max: number, label: string) => { const [i, s] = this.bars[k]; i.style.width = (100 * Math.max(0, Math.min(1, cur / Math.max(1, max)))) + '%'; s.textContent = label; };
    const hp = h?.hp ?? 0, mhp = h?.maxHp ?? 1, mp = h?.mp ?? 0, mmp = h?.maxMp ?? 1;
    set('hp', hp, mhp, `HP ${Math.ceil(hp)}/${Math.ceil(mhp)}`); set('mp', mp, mmp, `MP ${Math.ceil(mp)}/${Math.ceil(mmp)}`);
    set('exp', w.exp, w.expNext, `Lv${w.level}  ${fmtExp(w.exp)}/${fmtExp(w.expNext)}`);
    this.info.textContent = `${w.classDef.name}  金币 ${w.gold}`;
    const dead = this.hud.dead, left = dead.filter(d => !d).length;
    this.floor.textContent = `${this.hud.floorName}${dead.length ? `  怪 ${left}/${dead.length}` : ''}`;
    const sig = this.hud.lines.map(l => l.t + l.at).join('|');
    if (sig !== this.logSig) { this.logSig = sig; this.log.innerHTML = ''; this.hud.lines.slice().reverse().forEach(l => { const d = this.el('div', this.log); d.textContent = l.t; d.style.color = l.c; }); }
    const en = this.b.entranceHere(); // 入口在范围内时高亮并显示具体去向
    this.act.innerHTML = en === 'talk' ? '对话' : en === 'gate' ? '出城' : en === 'town' ? '回城' : en === 'prev' ? '上一层' : en === 'sealed' ? '封印' : w.town ? '对话' : '进入';
    this.act.classList.toggle('hot', !!en && en !== 'sealed');
    this.auto.innerHTML = `自动<br>${Settings.autoAttack ? '开' : '关'}`; this.auto.classList.toggle('on', Settings.autoAttack);
    this.comp.style.display = w.companion ? 'flex' : 'none';
    POTIONS.forEach((_, i) => { this.potBtns[i].textContent = String(w.pots[i] ?? 0); });
    this.skBtns.forEach(s => {
      const max = w.skills[s.i]?.cooldown ?? 0, c = cds[s.i] ?? 0;
      if (max && c > 0) { const deg = 360 * Math.min(1, c / max); s.cd.style.background = `conic-gradient(from ${360 - deg}deg, rgba(0,0,0,.62) 0 ${deg}deg, transparent ${deg}deg)`; s.t.textContent = c >= 0.5 ? fmtInt(c) : ''; }
      else { s.cd.style.background = ''; s.t.textContent = ''; }
      s.el.style.opacity = (h && (h.mp ?? 0) < (w.skills[s.i]?.mana ?? 0)) ? '0.5' : '1';
    });
    // 拾取飞入动画的目标：手机为「角色」图标（换算成 1280×720 逻辑坐标）
    const bag = this.root.querySelector('[data-id="bag"]') as HTMLElement, cv = this.b.game.canvas.getBoundingClientRect();
    if (bag && cv.width) { const bb = bag.getBoundingClientRect(); this.hud.bagPos = { x: Math.max(0, Math.min(1280, (bb.left + bb.width / 2 - cv.left) * 1280 / cv.width)), y: Math.max(0, (bb.top + bb.height / 2 - cv.top) * 720 / cv.height) }; }
  }
  /** 测试用：所有可点控件 */
  hits() { return Array.from(this.root.querySelectorAll<HTMLElement>('.b, #mh-log, #mh-joy .hint')); }
  destroy() { this.root.remove(); }
}
