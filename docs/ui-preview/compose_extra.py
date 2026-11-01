"""第二轮预览：新切片在 1280×720 / 844×390 的拉伸效果 + 灵符商城示意（仅预览）。"""
import os,glob
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'compose_preview.py'),encoding='utf-8').read().split("os.makedirs(f'{H}',exist_ok=True)")[0])
def img(n,w=None,h=None):
    i=Image.open(f'{H}/slices/{n}.png').convert('RGBA'); return i if w is None else i.resize((w,h),Image.LANCZOS)
def orb(c,x,y,D,ratio,col):
    fillc=Image.new('RGBA',(D,D),(0,0,0,0)); d=ImageDraw.Draw(fillc); r=D*52/128; cx=cy=D/2
    top=int(cy+r-2*r*ratio)
    for yy in range(top,int(cy+r)+1): k=(yy-top)/max(1,2*r); d.line((0,yy,D,yy),fill=tuple(int(v*(1-0.5*k)) for v in col)+(255,))
    mk=Image.new('L',(D,D),0); ImageDraw.Draw(mk).ellipse((cx-r,cy-r,cx+r,cy+r),fill=255); fillc.putalpha(ImageChops.multiply(fillc.split()[3],mk))
    bgc=Image.new('RGBA',(D,D),(0,0,0,0)); ImageDraw.Draw(bgc).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(10,4,4,230))
    for l in (bgc,fillc,img('orb_glass',D,D),img('orb_frame',D,D)): c.alpha_composite(l,(x,y))
from PIL import ImageChops
ITEMS=sorted(glob.glob(f'{R}/items/*.png'))
def pick(*keys):
    out=[]
    for k in keys:
        m=[p for p in ITEMS if k.lower() in os.path.basename(p).lower()]
        if m: out.append(m[0])
    return out
GOODS=pick('scroll','necklace','jewelry_necklace','gem','potion','ring')+ITEMS[:8]
def shop(W,Hh,k):
    c=bg(W,Hh); S=lambda v:max(1,int(v*k)); small=W<1280
    orb(c,S(10),Hh-S(150),S(140),0.72,(220,30,24)); orb(c,W-S(150),Hh-S(150),S(140),0.40,(40,90,230))
    fr='panel_frame_s' if small else 'panel_frame'
    pw,ph=(int(W*0.70),int(Hh*0.80)) if small else (S(940),S(520)); px,py=(W-pw)//2,S(30) if not small else 6
    put(c,fr,px,py,pw,ph); put(c,'title_plate',px+pw//2-S(110),py-S(4),S(220),S(40)); text(c,px+pw//2,py+S(16),'灵符商城',max(13,S(22)),(255,210,74))
    lf=img('lingfu_icon_xs'); c.alpha_composite(img('lingfu_icon_s').resize((S(28),S(28))),(px+pw-S(220),py+S(56))); text(c,px+pw-S(186),py+S(70),'灵符 12,800',max(11,S(16)),anchor='lm')
    # 左：充值档位
    cw,ch=S(150),S(190); x0=px+S(28); y0=py+S(100)
    for i,st in enumerate(['normal','sel','rec']):
        x=x0+(i%2)*(cw+S(10)); y=y0+(i//2)*(ch+S(10))
        if y+ch>py+ph-S(16): break
        put(c,f'recharge_card_{st}',x,y,cw,ch); L=img('lingfu_icon_l',S(72),S(72)); c.alpha_composite(L,(x+(cw-L.width)//2,y+S(24)))
        text(c,x+cw//2,y+ch-S(52),['600 灵符','3000 灵符','6800 灵符'][i],max(11,S(16))); text(c,x+cw//2,y+ch-S(26),['¥6','¥30','¥68'][i],max(11,S(16)),(255,200,120))
        if st=='rec': put(c,'ribbon_limited',x-S(6),y+S(6),S(80),S(24)); text(c,x+S(34),y+S(18),'推荐',max(10,S(13)),(255,240,200))
    # 竖分隔线
    dx=x0+2*(cw+S(10))+S(6); put(c,'divider_v',dx,py+S(96),S(8),ph-S(120)); g=img('divider_gem',S(12),S(12)); c.alpha_composite(g,(dx-S(2),py+S(96)+(ph-S(120))//2))
    # 右：商品格
    gx=dx+S(24); g0=S(84); cols=max(2,(px+pw-S(24)-gx)//(g0+S(8)))
    for j in range(cols*max(1,(ph-S(130))//(g0+S(30)))):
        x=gx+(j%cols)*(g0+S(8)); y=py+S(100)+(j//cols)*(g0+S(30))
        st='soldout' if j==3 else 'sel' if j==1 else 'normal'; put(c,f'goods_slot_{st}',x,y,g0,g0)
        if j<len(GOODS):
            ic=Image.open(GOODS[j]).convert('RGBA').resize((g0-S(28),g0-S(28)))
            if st=='soldout': ic=Image.merge('RGBA',[*ImageOps.grayscale(ic.convert('RGB')).convert('RGB').split(),ic.split()[3].point(lambda v:v//2)])
            c.alpha_composite(ic,(x+S(14),y+S(14)))
        if j==0: c.alpha_composite(img('badge_corner',S(40),S(40)),(x+g0-S(40),y))
        c.alpha_composite(lf.resize((S(16),S(16))),(x+S(12),y+g0+S(4))); text(c,x+S(32),y+g0+S(12),'售罄' if st=='soldout' else str(100*(j+1)),max(9,S(12)),(160,160,160) if st=='soldout' else (255,232,160),'lm')
    return c
from PIL import ImageOps
a=shop(1280,720,1.0); b=shop(844,390,390/720*1.25)
# 拉伸测试区
sheet=Image.new('RGBA',(1280,720+390+60+420),(18,12,10,255)); sheet.alpha_composite(a,(0,30)); sheet.alpha_composite(b,(0,780))
text(sheet,8,15,'灵符商城示意 1280×720（panel_frame）',16,(255,210,74),'lm'); text(sheet,8,765,'844×390 手机（panel_frame_s 小角饰，UI 系数 0.68）',16,(255,210,74),'lm')
xx=860; yy=780; text(sheet,xx,yy,'多尺寸拉伸',15,(255,210,74),'lm')
put(sheet,'panel_frame_s',xx,yy+16,150,110); put(sheet,'panel_frame_s',xx+160,yy+16,250,70)
put(sheet,'recharge_card_rec',xx,yy+136,110,240); put(sheet,'recharge_card_normal',xx+120,yy+136,170,120)
put(sheet,'goods_slot_normal',xx+300,yy+136,60,60); put(sheet,'goods_slot_sel',xx+300,yy+206,110,110)
put(sheet,'ribbon_limited',xx+120,yy+266,170,26); put(sheet,'ribbon_limited',xx+120,yy+300,60,22)
y=1190; text(sheet,8,y,'新切片原图（≤100px 放大 2×）',15,(255,210,74),'lm'); x=8; y+=14; rowh=0
NEW=['orb_frame','orb_glass','divider_v','panel_frame_s','lingfu_icon_s','lingfu_icon_l','ribbon_limited','badge_corner','recharge_card_normal','recharge_card_sel','recharge_card_rec','goods_slot_normal','goods_slot_sel','goods_slot_soldout','slot_bloodstone']
for n in NEW:
    im=img(n); k=2 if im.width<=100 and im.height<=100 else 1; im=im.resize((im.width*k,im.height*k),Image.NEAREST if k>1 else Image.LANCZOS)
    if x+im.width>1270: x=8; y+=rowh+22; rowh=0
    cb=Image.new('RGBA',im.size,(60,60,60,255)); dd=ImageDraw.Draw(cb)
    for a2 in range(0,im.height,8):
        for b2 in range(0,im.width,8):
            if (a2//8+b2//8)%2: dd.rectangle((b2,a2,b2+7,a2+7),fill=(90,90,90,255))
    cb.alpha_composite(im); sheet.alpha_composite(cb,(x,y)); text(sheet,x,y+im.height+9,n,10,(200,180,140),'lm'); rowh=max(rowh,im.height); x+=max(im.width,100)+10
sheet=sheet.crop((0,0,1280,min(sheet.height,y+rowh+30)))
sheet.convert('RGB').save(f'{H}/preview_extra.jpg',quality=88); print(sheet.size)
