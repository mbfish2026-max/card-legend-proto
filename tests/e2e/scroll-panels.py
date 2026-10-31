# e2e：长列表面板滚到底（844×390 / 932×430 / 1280×720），最后一项可见且可点；其它面板检查是否溢出面板框
# 用法：先 npm run build，并把 dist 以 /card-legend-proto/ 起服务；python3 tests/e2e/scroll-panels.py [url]
import sys, time, json
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8766/card-legend-proto/'
SHOTS = '/workspace/shared-mobile/shots/'
fails = []
def ok(c, m):
  print(('ok ' if c else 'FAIL ') + m)
  if not c: fails.append(m)
BOOT = """()=>{const g=window.__game; if(!g.scene.getScene('Battle').sys.isActive()){g.scene.stop('Title'); g.scene.start('Battle',{cls:'warrior'});}}"""
SETUP = """()=>{const b=window.__game.scene.getScene('Battle'), w=b.world; w.level=60; w.recompute(); w.gold=1e7; w.reached=new Set(w.floors.map((_,i)=>i)); w.enterTown('bichi'); w.teleportReadyAt=0; return w.floors.length;}"""
def panel_state(pg):
  return pg.evaluate("""()=>{const u=window.__game.scene.getScene('UI'), P=u.panel; return {info:P.scrollInfo, mode:P.mode};}""")
def open_npc(pg, npc):
  pg.evaluate(f"""()=>{{const P=window.__game.scene.getScene('UI').panel; P.mode='town'; P.npc='{npc}'; P.npcScroll={{}}; P.render();}}""")
def btn_screen(pg, label):
  # 最后一行（可视窗口最下面一个可滚动按钮）的屏幕坐标
  return pg.evaluate(f"""()=>{{const u=window.__game.scene.getScene('UI'), R=u.panel.root, cam=u.cameras.main, cv=u.game.canvas.getBoundingClientRect();
    const bs=R.list.filter(o=>o.getData&&o.getData('scrollBtn')==='{label}'); if(!bs.length) return null; const b=bs.reduce((a,c)=>c.y>a.y?c:a);
    const m=b.getWorldTransformMatrix(); const sx=cv.width/u.scale.gameSize.width, sy=cv.height/u.scale.gameSize.height;
    return {{x:cv.left+(m.tx-cam.scrollX)*sx, y:cv.top+(m.ty-cam.scrollY)*sy, bottom:cv.top+(m.ty+15*R.scaleY)*sy, vh:window.innerHeight}};}}""")
def col_center(pg, X):
  return pg.evaluate(f"""()=>{{const u=window.__game.scene.getScene('UI'), R=u.panel.root, cv=u.game.canvas.getBoundingClientRect(); const top=Math.max(40,360-250);
    const sx=cv.width/u.scale.gameSize.width, sy=cv.height/u.scale.gameSize.height; return {{x:cv.left+(R.x+({X}+110)*R.scaleX)*sx, y:cv.top+(R.y+(top+250)*R.scaleY)*sy}};}}""")
with sync_playwright() as p:
  br = p.chromium.launch()
  for vp, mob in [((844, 390), True), ((932, 430), True), ((1280, 720), False)]:
    tag = f'{vp[0]}x{vp[1]}'
    ctx = br.new_context(viewport={'width': vp[0], 'height': vp[1]}, is_mobile=mob, has_touch=mob); pg = ctx.new_page()
    pg.goto(URL); time.sleep(6); pg.evaluate(BOOT); time.sleep(5); nf = pg.evaluate(SETUP); time.sleep(1)
    for npc, X in [('bq_tele', 340), ('bq_veteran', 340)]:
      open_npc(pg, npc); time.sleep(0.5); st = panel_state(pg); info = st['info'].get(str(X))
      ok(info is not None and info['n'] == nf, f'{tag} {npc} 传送列表 {info and info["n"]}/{nf} 项、可滚动')
      c = col_center(pg, X); bx = btn_screen(pg, '传送')
      if bx: c['x'] = bx['x'] - 40  # 移动端根节点有逻辑偏移：用列内按钮的屏幕坐标定 x，保证落在列内
      pg.screenshot(path=f'{SHOTS}scroll-{npc}-{tag}-top.png')
      if mob:  # 触摸拖动：每次往上拖 200px，直到到底
        for _ in range(80):
          i = panel_state(pg)['info'][str(X)]
          if i['off'] >= i['n'] - i['vis']: break
          y0 = c['y'] + vp[1] * 0.2; pg.mouse.move(c['x'], y0); pg.mouse.down()
          for k in range(1, 5): pg.mouse.move(c['x'], y0 - k * vp[1] * 0.12)
          pg.mouse.up(); time.sleep(0.05)
      else:
        pg.mouse.move(c['x'], c['y'])
        for _ in range(nf + 5): pg.mouse.wheel(0, 120); time.sleep(0.02)
      time.sleep(0.3); i = panel_state(pg)['info'][str(X)]
      ok(i['off'] == i['n'] - i['vis'], f'{tag} {npc} 滚到底 off={i["off"]} n={i["n"]} vis={i["vis"]}')
      bs = btn_screen(pg, '传送'); ok(bs is not None and bs['bottom'] <= bs['vh'] + 1, f'{tag} {npc} 最后一项按钮在屏幕内 {bs}')
      pg.screenshot(path=f'{SHOTS}scroll-{npc}-{tag}-bottom.png')
      # 拖动不误触：在按钮上按下拖动 60px 不应传送
      fl0 = pg.evaluate("()=>window.__game.scene.getScene('Battle').world.town")
      pg.mouse.move(bs['x'], bs['y']); pg.mouse.down(); pg.mouse.move(bs['x'], bs['y'] - 60, steps=6); pg.mouse.up(); time.sleep(0.3)
      ok(pg.evaluate("()=>window.__game.scene.getScene('Battle').world.town") == fl0, f'{tag} {npc} 拖动超过阈值不触发传送')
      if npc == 'bq_veteran':
        open_npc(pg, npc); time.sleep(0.3); c = col_center(pg, X)
        pg.evaluate(f"""()=>{{const P=window.__game.scene.getScene('UI').panel; const i=P.scrollInfo[{X}]; P.npcScroll[i.key]=i.n; P.render();}}"""); time.sleep(0.3)
        bs = btn_screen(pg, '传送'); pg.mouse.click(bs['x'], bs['y']); time.sleep(1)
        w = pg.evaluate("()=>{const w=window.__game.scene.getScene('Battle').world; return {town:w.town, f:w.floorIndex, n:w.floors.length};}")
        ok(w['town'] is None and w['f'] == w['n'] - 1, f'{tag} 点最后一个传送点 → 第 {w["f"]+1} 层')
        pg.evaluate(SETUP); time.sleep(0.5)
    # 其它面板：内容是否超出面板框（top-20 ~ top+480）或屏幕
    for mode in ['bag', 'shop', 'skills', 'quests', 'map']:
      r = pg.evaluate(f"""()=>{{const u=window.__game.scene.getScene('UI'), P=u.panel; P.mode=null; P.toggle('{mode}'); const R=P.root; if(!R) return null; const top=Math.max(40,360-250);
        let mb=0, who=''; for(const o of R.list){{ if(!o.visible||o.alpha===0) continue; const b=o.getBounds?o.getBounds():null; if(!b) continue; const bot=(b.bottom-R.y)/R.scaleY; if(b.height<700 && bot>mb){{mb=bot; who=(o.text||o.type||'')+'';}} }}
        return {{maxBottom:Math.round(mb), frame:top+480, who:who.slice(0,30)}};}}""")
      ok(r is not None and r['maxBottom'] <= r['frame'] + 2, f'{tag} {mode} 面板内容不溢出 {r}')
      pg.screenshot(path=f'{SHOTS}scroll-{mode}-{tag}.png')
      pg.evaluate("()=>window.__game.scene.getScene('UI').panel.close()")
    ctx.close()
  br.close()
print(json.dumps({'fails': fails}, ensure_ascii=False)); sys.exit(1 if fails else 0)
