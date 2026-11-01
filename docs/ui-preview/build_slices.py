"""UI 九宫格切片生成（仅美术工具，不进游戏代码）。材质来自 GenerateImage 生成图 src/，结构由 PIL 绘制。"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
import json, os
H=os.path.dirname(os.path.abspath(__file__)); S=os.path.join(H,'slices'); os.makedirs(S,exist_ok=True)
MET=Image.open(f'{H}/src/tex_metal_256.jpg').convert('RGB'); DRK=Image.open(f'{H}/src/tex_dark_256.jpg').convert('RGB')
C=Image.open(f'{H}/src/corner_src.png').convert('RGB')
def tile(t,w,h,off=0):
    o=Image.new('RGB',(w,h))
    for y in range(-off,h,t.height):
        for x in range(-off,w,t.width): o.paste(t,(x,y))
    return o
def tint(img,mul):  # 乘色
    r,g,b=img.split(); return Image.merge('RGB',[c.point(lambda v,m=m:min(255,int(v*m))) for c,m in zip((r,g,b),mul)])
GOLD=(1.75,1.45,0.85); DGOLD=(1.1,0.9,0.55); RED=(2.1,0.7,0.55)
def metal(w,h,mul=GOLD,off=0): return tint(tile(MET,w,h,off),mul)
def bevel_ring(w,h,t,mul=GOLD,r=3):
    """金属边框环：厚 t，外亮内暗斜角"""
    base=metal(w,h,mul).convert('RGBA')
    m=Image.new('L',(w,h),0); d=ImageDraw.Draw(m)
    d.rounded_rectangle((0,0,w-1,h-1),r,fill=255); d.rounded_rectangle((t,t,w-1-t,h-1-t),max(0,r-1),fill=0)
    sh=Image.new('L',(w,h),128); ds=ImageDraw.Draw(sh)
    for i in range(t):
        k=i/(max(1,t-1)); v=int(200-110*k)    # 外沿亮 -> 内沿暗
        ds.rounded_rectangle((i,i,w-1-i,h-1-i),max(0,r-i),outline=v)
    hl=ImageDraw.Draw(sh); hl.line((r,1,w-r,1),fill=235); hl.line((1,r,1,h-r),fill=215)  # 顶/左高光
    hl.line((r,h-2,w-r,h-2),fill=70); hl.line((w-2,r,w-2,h-r),fill=80)
    lit=Image.merge('RGBA',[*(ImageChops.multiply(c,sh.point(lambda v:min(255,v*2))) for c in base.convert('RGB').split()),m])
    return lit
def comp_frame(w,h,t,fill,mul=GOLD,r=3,inner_line=True,alpha=242):
    o=Image.new('RGBA',(w,h),(0,0,0,0))
    if fill is not None:
        f=fill.convert('RGBA').resize((w,h)) if fill.size!=(w,h) else fill.convert('RGBA')
        m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((1,1,w-2,h-2),r,fill=alpha); f.putalpha(m); o.alpha_composite(f)
        # 内阴影
        sh=Image.new('RGBA',(w,h),(0,0,0,0)); ds=ImageDraw.Draw(sh)
        for i in range(min(6,(min(w,h)-2*t)//2)): ds.rounded_rectangle((t+i,t+i,w-1-t-i,h-1-t-i),r,outline=(0,0,0,int(120*(1-i/6))))
        o.alpha_composite(sh)
    o.alpha_composite(bevel_ring(w,h,t,mul,r))
    if inner_line:
        d=ImageDraw.Draw(o); d.rounded_rectangle((t+1,t+1,w-2-t,h-2-t),max(0,r-2),outline=(110,30,20,200))
    return o
def corner_orn(size):
    c=C.copy(); L=c.convert('L'); a=L.point(lambda v:0 if v<22 else min(255,(v-22)*4))
    c=c.convert('RGBA'); c.putalpha(a); return c.resize((size,size),Image.LANCZOS)
def add_corners(img,size,inset=-2):
    w,h=img.size; co=corner_orn(size)
    for fx,fy in ((0,0),(1,0),(0,1),(1,1)):
        k=co
        if fx: k=ImageOps.mirror(k)
        if fy: k=ImageOps.flip(k)
        img.alpha_composite(k,(w-size-inset if fx else inset, h-size-inset if fy else inset))
    return img
def darkfill(w,h,mul=(1,1,1)): return tint(tile(DRK,w,h),mul)
def grad(w,h,top,bot):
    g=Image.new('RGB',(w,h)); d=ImageDraw.Draw(g)
    for y in range(h):
        k=y/max(1,h-1); d.line((0,y,w,y),fill=tuple(int(top[i]+(bot[i]-top[i])*k) for i in range(3)))
    return g
SPEC={}
def save(name,img,l,r,t,b,use):
    p=os.path.join(S,name+'.png'); img.save(p,optimize=True); SPEC[name]=dict(w=img.width,h=img.height,left=l,right=r,top=t,bottom=b,use=use)

# 1 大面板（背包/商店/技能/任务/设置…）
p=comp_frame(192,192,10,darkfill(192,192),r=4); add_corners(p,56,-3); save('panel_frame',p,52,52,52,52,'全屏大面板底+框（Panel 1000×500、存档 1000×640、设置 640×580）')
# 2 小窗弹框（确认/提示/传送确认）
p=comp_frame(128,128,7,darkfill(128,128,(1.15,1,1)),r=3); add_corners(p,36,-2); save('dialog_frame',p,34,34,34,34,'小窗弹框/确认框/传送员面板')
# 2b 标题牌（窗口顶部标题底板，文字代码渲染）
t=Image.new('RGBA',(160,40),(0,0,0,0)); bar=comp_frame(160,40,4,grad(160,40,(120,20,14),(50,8,6)),RED,r=6); t.alpha_composite(bar)
save('title_plate',t,24,24,12,12,'面板标题底牌、HUD 地图名牌（Hud.ts 1130,36 270×46）')
# 3 内框（装备栏人物框/对比框/子区域）
save('inset_frame',comp_frame(64,64,4,darkfill(64,64,(0.6,0.6,0.6)),DGOLD,r=2),12,12,12,12,'子区域内框：人物展示框、列表容器、对比面板列')
# 4 tooltip
save('tooltip_frame',comp_frame(48,48,3,grad(48,48,(16,12,12),(6,5,8)),(1.2,1.2,1.25),r=2,alpha=245),10,10,10,10,'物品提示框/装备对比框（原 0x05060c + 灰边）')
# 5 按钮三态 + 悬停
def btn(state):
    w,h=96,40
    fills={'normal':((92,24,16),(40,10,8)),'hover':((130,36,20),(60,14,10)),'pressed':((34,8,6),(70,18,12)),'disabled':((46,40,36),(24,22,20))}
    mul={'disabled':(1.0,1.0,1.0)}.get(state,GOLD)
    f=Image.blend(grad(w,h,*fills[state]),darkfill(w,h,(2.2,1.6,1.6)),0.25)
    o=comp_frame(w,h,4,f,mul,r=5,inner_line=False)
    if state=='disabled': o=Image.merge('RGBA',[*ImageOps.grayscale(o.convert('RGB')).point(lambda v:int(v*0.8)).convert('RGB').split(),o.split()[3]])
    d=ImageDraw.Draw(o)
    if state in('normal','hover'): d.line((8,5,w-9,5),fill=(255,220,150,90))  # 上缘光
    if state=='pressed': d.line((8,h-6,w-9,h-6),fill=(255,200,120,60))
    return o
for st in ('normal','hover','pressed','disabled'): save('btn_'+st,btn(st),16,16,14,14,f'通用按钮（{st}）；button() / 手机触控按钮')
# 6 关闭按钮（固定尺寸，非九宫格）
c=btn('normal').crop((0,0,40,40)); c=comp_frame(40,40,4,grad(40,40,(92,24,16),(40,10,8)),GOLD,r=5,inner_line=False)
d=ImageDraw.Draw(c); 
for wdt,col in ((6,(30,10,6,255)),(3,(240,200,120,255))): d.line((12,12,28,28),fill=col,width=wdt); d.line((28,12,12,28),fill=col,width=wdt)
save('btn_close',c,0,0,0,0,'面板关闭 ✕（固定尺寸，可 setDisplaySize 等比放大到 48/84）')
# 7 列表行 常态/选中
row=Image.new('RGBA',(128,40),(0,0,0,0)); f=darkfill(128,40,(0.55,0.5,0.5))
save('list_row',comp_frame(128,40,2,f,DGOLD,r=2,inner_line=False,alpha=225),10,10,10,10,'商店/技能/任务/传送/存档 列表行')
f2=Image.blend(grad(128,40,(90,60,20),(40,22,8)),darkfill(128,40),0.3)
save('list_row_sel',comp_frame(128,40,3,f2,GOLD,r=2,inner_line=False),10,10,10,10,'列表行选中/当前存档/已完成高亮')
# 8 标签页
def tab(on):
    w,h=96,36; f=grad(w,h,(110,30,18),(50,12,8)) if on else grad(w,h,(40,30,22),(20,15,12))
    o=comp_frame(w,h+8,4,Image.new('RGB',(w,h+8)) if False else grad(w,h+8,*(((110,30,18),(50,12,8)) if on else ((40,30,22),(20,15,12)))),GOLD if on else DGOLD,r=6,inner_line=False)
    o=o.crop((0,0,w,h))  # 去掉底边：标签与面板相接
    if not on: o.putalpha(o.split()[3].point(lambda v:int(v*0.85)))
    return o
save('tab_on',tab(True),16,16,12,4,'标签页选中（商店 杂货/书店、背包页码、地图分区）')
save('tab_off',tab(False),16,16,12,4,'标签页未选中')
# 9 血蓝条
fr=comp_frame(128,20,3,Image.new('RGB',(128,20),(8,5,4)),GOLD,r=3,inner_line=False); save('bar_frame',fr,10,10,6,6,'血/蓝/经验/读条/训练进度条框')
def fill(top,mid,bot,name,use):
    g=grad(8,14,top,bot); d=ImageDraw.Draw(g); d.line((0,3,8,3),fill=mid); d.line((0,2,8,2),fill=tuple(min(255,c+60) for c in mid))
    save(name,g.convert('RGBA'),2,2,0,0,use)
fill((220,40,30),(255,120,100),(90,6,6),'bar_fill_hp','HP 填充（横向拉伸，宽=当前比例）')
fill((40,90,230),(120,170,255),(8,20,90),'bar_fill_mp','MP 填充')
fill((230,190,50),(255,235,140),(110,80,10),'bar_fill_exp','经验/读条/进度 填充')
# 10 快捷栏格 / 背包格
def slot(sel=False,big=64):
    f=Image.new('RGB',(big,big),(6,5,4)); 
    o=comp_frame(big,big,5 if big>=64 else 4,f,(2.0,1.7,1.0) if sel else DGOLD,r=3)
    if sel:
        gl=Image.new('RGBA',(big,big),(0,0,0,0)); ImageDraw.Draw(gl).rounded_rectangle((5,5,big-6,big-6),3,outline=(255,220,120,200),width=2); o.alpha_composite(gl.filter(ImageFilter.GaussianBlur(1)))
    return o
save('slot',slot(),14,14,14,14,'技能快捷栏格/药品格/背包格/装备格（品质色由代码叠一层细框或 tint）')
save('slot_sel',slot(True),14,14,14,14,'格子选中/可用高亮')
# 11 分隔线、滚动条
dv=Image.new('RGBA',(128,8),(0,0,0,0)); d=ImageDraw.Draw(dv)
for x in range(128):
    k=1-abs(x-63.5)/64; a=int(255*min(1,k*2.2))
    d.point((x,3),(230,190,110,a)); d.point((x,4),(90,50,20,a)); d.point((x,2),(60,30,10,a//2))
gm=Image.new('RGBA',(12,12),(0,0,0,0)); ImageDraw.Draw(gm).polygon([(6,0),(11,6),(6,11),(1,6)],fill=(190,30,24,255),outline=(240,200,120,255)); ImageDraw.Draw(gm).point((5,3),(255,180,160,255))
save('divider_gem',gm,0,0,0,0,'分隔线中央宝石（固定尺寸，代码叠在 divider 中点）')
save('divider',dv,40,40,0,0,'分隔线（横向拉伸，两端渐隐 40px 不拉伸）')
save('scroll_track',comp_frame(12,48,2,Image.new('RGB',(12,48),(20,15,10)),DGOLD,r=3,inner_line=False),0,0,8,8,'滚动条轨道（纵向拉伸）')
save('scroll_thumb',comp_frame(12,32,2,grad(12,32,(230,180,80),(120,80,20)),GOLD,r=3,inner_line=False),0,0,8,8,'滚动条滑块')
# 12 手机圆形触控按钮
def round_btn(d0=112):
    o=Image.new('RGBA',(d0,d0),(0,0,0,0)); m=metal(d0,d0).convert('RGBA'); mk=Image.new('L',(d0,d0),0); dd=ImageDraw.Draw(mk); dd.ellipse((0,0,d0-1,d0-1),fill=255); dd.ellipse((8,8,d0-9,d0-9),fill=0); m.putalpha(mk); 
    inner=grad(d0,d0,(80,22,14),(20,6,4)).convert('RGBA'); mi=Image.new('L',(d0,d0),0); ImageDraw.Draw(mi).ellipse((6,6,d0-7,d0-7),fill=200); inner.putalpha(mi)
    o.alpha_composite(inner); o.alpha_composite(m); dr=ImageDraw.Draw(o); dr.arc((3,3,d0-4,d0-4),200,320,fill=(255,230,160,180),width=2); dr.arc((9,9,d0-10,d0-10),20,160,fill=(0,0,0,160),width=2)
    return o
save('touch_round',round_btn(),0,0,0,0,'手机虚拟摇杆/技能圆钮底（固定比例缩放，图标由代码叠加）')
json.dump(SPEC,open(os.path.join(H,'slices.json'),'w'),ensure_ascii=False,indent=1)
print(len(SPEC),'slices')
