"""预览合成：把切片按九宫格拉伸到实际尺寸（仅预览，不是游戏代码）。"""
from PIL import Image, ImageDraw, ImageFont
import json,os
H=os.path.dirname(os.path.abspath(__file__)); SP=json.load(open(f'{H}/slices.json')); R='/workspace/card-legend-proto/public/assets'
FONT=ImageFont.truetype([p for p in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc','/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'] if os.path.exists(p)][0],14) if True else None
def F(n):
    return ImageFont.truetype(FONT.path,n)
def nine(name,w,h):
    s=SP[name]; im=Image.open(f'{H}/slices/{name}.png').convert('RGBA'); W0,H0=im.size; l,r,t,b=s['left'],s['right'],s['top'],s['bottom']
    if l+r+t+b==0: return im.resize((w,h),Image.LANCZOS)
    w=max(w,l+r); h=max(h,t+b); o=Image.new('RGBA',(w,h))
    xs=[(0,l,0,l),(l,W0-r,l,w-r),(W0-r,W0,w-r,w)]; ys=[(0,t,0,t),(t,H0-b,t,h-b),(H0-b,H0,h-b,h)]
    for sx0,sx1,dx0,dx1 in xs:
        for sy0,sy1,dy0,dy1 in ys:
            if sx1<=sx0 or sy1<=sy0 or dx1<=dx0 or dy1<=dy0: continue
            o.paste(im.crop((sx0,sy0,sx1,sy1)).resize((dx1-dx0,dy1-dy0),Image.BILINEAR),(dx0,dy0))
    return o
def put(c,name,x,y,w,h): c.alpha_composite(nine(name,w,h),(x,y))
def text(c,x,y,s,n=16,col=(255,232,160),anchor='mm'):
    d=ImageDraw.Draw(c); d.text((x,y),s,font=F(n),fill=col,anchor=anchor,stroke_width=2,stroke_fill=(0,0,0))
def bg(w,h):
    p=f'{R}/ui/bg_dungeon.jpg'; return Image.open(p).convert('RGBA').resize((w,h))
def ico(path,sz):
    try: return Image.open(path).convert('RGBA').resize((sz,sz))
    except: return None
import glob
ICONS=sorted(glob.glob(f'{R}/skills/*.png'))[:8] or sorted(glob.glob(f'{R}/items/*.png'))[:8]
ITEMS=sorted(glob.glob(f'{R}/items/*.png'))[:24]
def screen(W,Hh,k):
    """k: UI 缩放（1280 设计稿=1；844×390 手机等比 390/720≈0.54，但面板按 Panel 手机放大规则示意）"""
    c=bg(W,Hh); S=lambda v:int(v*k)
    # HUD 顶部：血蓝条 + 地图名牌
    for i,(f,lab) in enumerate([('bar_fill_hp','HP 1280/1500'),('bar_fill_mp','MP 300/820')]):
        x,y,w,h=S(16),S(14)+i*S(26),S(280),S(22); put(c,'bar_frame',x,y,w,h); fw=int((w-6)*(0.85 if i==0 else 0.37)); put(c,f,x+3,y+3,fw,h-6); text(c,x+w//2,y+h//2,lab,max(10,S(13)),(255,255,255))
    put(c,'title_plate',W-S(300),S(12),S(270),S(46)); text(c,W-S(165),S(35),'比奇城 · 安全区',max(11,S(18)))
    # 快捷栏
    n=8; sk=S(56); x0=(W-n*(sk+S(6)))//2; y0=Hh-sk-S(14)
    put(c,'dialog_frame',x0-S(16),y0-S(28),n*(sk+S(6))+S(26),sk+S(40))
    put(c,'bar_frame',x0,y0-S(20),n*(sk+S(6))-S(6),S(14)); put(c,'bar_fill_exp',x0+3,y0-S(20)+3,int((n*(sk+S(6))-S(12))*0.62),S(14)-6)
    for i in range(n):
        put(c,'slot_sel' if i==0 else 'slot',x0+i*(sk+S(6)),y0,sk,sk)
        if i<len(ICONS): im=ico(ICONS[i],sk-S(14)); c.alpha_composite(im,(x0+i*(sk+S(6))+S(7),y0+S(7)))
    # 主面板（商店样式）
    pw,ph=S(1000) if W>=1280 else int(W*0.92),S(500) if W>=1280 else int(Hh*0.86)
    px,py=(W-pw)//2,S(70) if W>=1280 else int(Hh*0.05)
    put(c,'panel_frame',px,py,pw,ph); put(c,'title_plate',px+pw//2-S(110),py-S(6),S(220),S(40)); text(c,px+pw//2,py+S(14),'商人 · 杂货铺',max(13,S(22)),(255,210,74))
    put(c,'btn_close',px+pw-S(52),py+S(10),S(40),S(40))
    tx=px+S(40)
    for i,(nm,on) in enumerate([('杂货',True),('书店',False)]): put(c,'tab_on' if on else 'tab_off',tx+i*S(100),py+S(54),S(96),S(34)); text(c,tx+i*S(100)+S(48),py+S(71),nm,max(11,S(16)),(255,232,160) if on else (170,150,120))
    put(c,'divider',px+S(30),py+S(88),pw-S(60),S(8)); dg=nine('divider_gem',S(12)+1,S(12)+1); c.alpha_composite(dg,(px+pw//2-dg.width//2,py+S(86)))
    # 列表（长列表 + 滚动条）
    lx,ly,lw=px+S(36),py+S(102),int(pw*0.46); rh=S(52)
    put(c,'inset_frame',lx-S(6),ly-S(6),lw+S(30),ph-S(124))
    rows=['金创药(小) 30金','魔法药(小) 40金','太阳水 220金','随机传送石 100金','祝福油 1000金','黑铁矿石 1000金','回城卷 50金']
    rows_fit=max(1,(ph-S(140))//(rh+S(4)))
    for i,rw in enumerate(rows[:rows_fit]):
        y=ly+i*(rh+S(4)); put(c,'list_row_sel' if i==1 else 'list_row',lx,y,lw-S(4),rh); text(c,lx+S(16),y+rh//2,rw,max(11,S(16)),anchor='lm')
        bs='btn_disabled' if i==3 else 'btn_pressed' if i==2 else 'btn_hover' if i==1 else 'btn_normal'
        put(c,bs,lx+lw-S(88),y+S(8),S(76),rh-S(16)); text(c,lx+lw-S(50),y+rh//2,'购买',max(11,S(15)),(120,120,120) if i==3 else (255,232,160))
    put(c,'scroll_track',lx+lw+S(6),ly,S(12),ph-S(140)); put(c,'scroll_thumb',lx+lw+S(6),ly+S(20),S(12),S(90))
    # 背包格
    gx=px+int(pw*0.56); gy=py+S(104); g=S(56) if W>=1280 else S(64)
    cols=max(3,(px+pw-S(40)-gx)//(g+S(4)))
    for j in range(cols*min(5,(ph-S(150))//(g+S(4)))):
        x=gx+(j%cols)*(g+S(4)); y=gy+(j//cols)*(g+S(4)); put(c,'slot_sel' if j==4 else 'slot',x,y,g,g)
        if j<len(ITEMS) and j%3!=2: c.alpha_composite(ico(ITEMS[j],g-S(14)),(x+S(7),y+S(7)))
    # 提示框
    tw,th=S(230),S(130); tx2,ty2=gx+g//2+S(30),gy+g+S(10)
    put(c,'tooltip_frame',tx2,ty2,tw,th); text(c,tx2+S(12),ty2+S(18),'裁决之杖',max(12,S(18)),(255,120,80),'lm')
    for i,l in enumerate(['攻击 0-30','需要等级 22','重量 32  持久 25/25']): text(c,tx2+S(12),ty2+S(48)+i*S(24),l,max(10,S(14)),(220,220,220),'lm')
    # 确认弹框
    if W<1280: return mobile_extra(c,W,Hh,S)
    dw,dh=S(380),S(180); dx,dy=W-dw-S(30),Hh-dh-S(120)
    put(c,'dialog_frame',dx,dy,dw,dh); text(c,dx+dw//2,dy+S(54),'传送到 毒蛇山谷？ 花费 200 金',max(12,S(17)))
    put(c,'btn_normal',dx+S(40),dy+dh-S(70),S(130),S(44)); text(c,dx+S(105),dy+dh-S(48),'确定',max(12,S(18)))
    put(c,'btn_normal',dx+dw-S(170),dy+dh-S(70),S(130),S(44)); text(c,dx+dw-S(105),dy+dh-S(48),'取消',max(12,S(18)))
    # 手机触控
    if W<1280:
        for i in range(3):
            d0=S(110); c.alpha_composite(nine('touch_round',d0,d0),(W-d0-S(20)-i*(d0+S(10)),Hh-d0-S(140)))
    return c
def mobile_extra(c,W,Hh,S):
    for i in range(3):
        d0=60; c.alpha_composite(nine('touch_round',d0,d0),(W-d0-8-i*(d0+6),Hh-d0-6))
    for i,l in enumerate(['背包','技能','地图']):
        x=8+i*52; put(c,'btn_normal',x,Hh-50,48,44); text(c,x+24,Hh-28,l,12)
    return c
os.makedirs(f'{H}',exist_ok=True)
screen(1280,720,1.0).convert('RGB').save(f'{H}/preview_1280x720.png')
m=screen(844,390,390/720*1.0); m.convert('RGB').save(f'{H}/preview_844x390.png')
# 汇总图：上 1280×720，下 844×390 + 拉伸对比条
sheet=Image.new('RGBA',(1280,720+30+390+30+560),(18,12,10,255))
a=Image.open(f'{H}/preview_1280x720.png').convert('RGBA'); sheet.alpha_composite(a,(0,30)); b=Image.open(f'{H}/preview_844x390.png').convert('RGBA'); sheet.alpha_composite(b,(0,780))
text(sheet,8,15,'1280×720 桌面（1:1 合成）',16,(255,210,74),'lm'); text(sheet,8,765,'844×390 手机横屏（等比缩到 0.54 合成；手机面板实际会按 Panel 放大规则更大）',16,(255,210,74),'lm')
# 右侧：同一切片拉伸到不同尺寸
xx,yy=860,780
text(sheet,xx,yy,'同一切片多尺寸拉伸',15,(255,210,74),'lm')
for i,(w,h) in enumerate([(120,60),(240,90),(400,40)]):
    put(sheet,'btn_normal',xx,yy+20+i*70 if h<70 else yy+20+i*70,w if w<=400 else 400,min(h,60)); 
put(sheet,'dialog_frame',xx,yy+230,180,140); put(sheet,'panel_frame',xx+190,yy+230,220,330)
text(sheet,8,1200,'底部：切片原图（放大 2×，透明背景显示为棋盘格）',15,(255,210,74),'lm')
x=8;y=1220;rowh=0
for n,s in SP.items():
    im=Image.open(f'{H}/slices/{n}.png').convert('RGBA'); k=2 if im.width<=100 else 1; im=im.resize((im.width*k,im.height*k),Image.NEAREST)
    if x+im.width>1270: x=8; y+=rowh+24; rowh=0
    if y+im.height>sheet.height: break
    cb=Image.new('RGBA',im.size,(60,60,60,255)); dd=ImageDraw.Draw(cb)
    for yy2 in range(0,im.height,8):
        for xx2 in range(0,im.width,8):
            if (xx2//8+yy2//8)%2: dd.rectangle((xx2,yy2,xx2+7,yy2+7),fill=(90,90,90,255))
    cb.alpha_composite(im); sheet.alpha_composite(cb,(x,y)); text(sheet,x,y+im.height+9,n,10,(200,180,140),'lm'); rowh=max(rowh,im.height); x+=max(im.width,90)+10
sheet.convert('RGB').save(f'{H}/preview_all.jpg',quality=88)
print('ok')
