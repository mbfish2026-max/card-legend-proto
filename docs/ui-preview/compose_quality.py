"""品质框预览：1280×720 + 844×390，背包/装备栏/商店/对比面板（图标仅用于合成预览）。"""
import os,glob
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'compose_preview.py'),encoding='utf-8').read().split("os.makedirs(f'{H}',exist_ok=True)")[0])
EQ=[p for p in sorted(glob.glob(f'{R}/items/eq_*.png')) if '@2x' not in p]
RK=['common','magic','rare'];CN={'common':'普通','magic':'精良','rare':'极品'};HEX={'common':(255,255,255),'magic':(0x5a,0xa8,0xff),'rare':(0xff,0xb0,0x20)}
def cell(c,x,y,s,i,rk,base='slot'):
    put(c,base,x,y,s,s)
    if i is not None: c.alpha_composite(ico(EQ[i%len(EQ)],int(s*0.78)),(x+(s-int(s*0.78))//2,y+(s-int(s*0.78))//2))
    if rk: put(c,f'qframe_{rk}',x,y,s,s)
def layout(W,Hh,k):
    c=bg(W,Hh);S=lambda v:max(1,int(v*k));fr='panel_frame_s' if W<1280 else 'panel_frame'
    # 背包
    bx,by,bw,bh=S(16),S(16),S(420),S(400);put(c,fr,bx,by,bw,bh);text(c,bx+bw//2,by+S(26),'背包',max(12,S(20)))
    cs=S(54);g=S(6)
    for n in range(6*5):
        r,cc=divmod(n,6);rk=RK[(n*7)%5%3] if n<22 else None
        cell(c,bx+S(30)+cc*(cs+g),by+S(50)+r*(cs+g),cs,n if rk else None,rk)
    # 装备栏
    ex,ey,ew,eh=S(452),S(16),S(250),S(400);put(c,fr,ex,ey,ew,eh);text(c,ex+ew//2,ey+S(26),'装备',max(12,S(20)))
    es=S(64)
    for n in range(8):
        r,cc=divmod(n,2);rk=RK[n%3] if n!=5 else None
        cell(c,ex+S(40)+cc*S(106),ey+S(50)+r*S(84),es,n*3 if rk else None,rk,'slot' if rk else 'slot_bloodstone' if n==5 else 'slot')
    # 商店/商城
    sx,sy,sw,sh=S(718),S(16),S(546),S(250);put(c,fr,sx,sy,sw,sh);text(c,sx+sw//2,sy+S(26),'灵符商城',max(12,S(20)))
    gs=S(80)
    for n in range(5):
        x=sx+S(28)+n*S(102);base='goods_slot_soldout' if n==4 else 'goods_slot_normal' if n else 'goods_slot_sel'
        cell(c,x,sy+S(56),gs,n*5+2,RK[(n+1)%3],base)
        text(c,x+gs//2,sy+S(56)+gs+S(16),CN[RK[(n+1)%3]],max(10,S(14)),HEX[RK[(n+1)%3]])
    # 对比面板
    cx,cy,cw,ch=S(718),S(280),S(546),S(136);put(c,fr,cx,cy,cw,ch)
    for j,(t,rk,i) in enumerate((('身上','magic',4),('新获得','rare',9))):
        x=cx+S(26)+j*S(270);cell(c,x,cy+S(36),S(64),i,rk)
        text(c,x+S(76),cy+S(50),t,max(10,S(16)),(200,190,160),'lm');text(c,x+S(76),cy+S(80),CN[rk],max(10,S(16)),HEX[rk],'lm')
        if j==0: put(c,'divider_v',cx+S(266),cy+S(16),S(8),ch-S(32))
    # 小格（列表行 32/40）
    for j,s in enumerate((32,40,48)):
        for n,rk in enumerate(RK): cell(c,S(16)+n*S(70)+j*S(220),S(440)+(0 if W>=1280 else 0),S(s),n+j*3,rk)
    return c
A=layout(1280,720,1.0);B=layout(844,390,390/720*1.0)
# 放大展示原图
Z=Image.new('RGBA',(1280,200),(14,10,8,255))
for n,rk in enumerate(RK):
    z=Image.open(f'{H}/slices/qframe_{rk}.png').resize((128,128),Image.NEAREST);Z.alpha_composite(z,(40+n*200,30));text(Z,104+n*200,180,f'qframe_{rk} 32×32 ×4',14)
out=Image.new('RGB',(1280,720+390+200+20),(0,0,0));out.paste(A.convert('RGB'),(0,0));out.paste(B.convert('RGB'),(0,730));out.paste(Z.convert('RGB'),(0,1130))
out.save(f'{H}/preview_quality.jpg',quality=88);print(out.size,os.path.getsize(f'{H}/preview_quality.jpg'))
