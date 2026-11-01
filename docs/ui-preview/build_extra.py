"""第二轮补齐切片：先执行 build_slices.py（重建前 25 个），再追加新切片并重写 slices.json。"""
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'build_slices.py'),encoding='utf-8').read())
from PIL import ImageFilter
def keyblack(img,th=18,gain=5):
    img=img.convert('RGB'); a=img.convert('L').point(lambda v:0 if v<th else min(255,(v-th)*gain)); o=img.convert('RGBA'); o.putalpha(a); return o
# 1 血蓝球框 + 玻璃高光
def orb_frame(D=128,ring=12):
    o=Image.new('RGBA',(D,D),(0,0,0,0)); m=metal(D,D).convert('RGBA')
    mk=Image.new('L',(D,D),0); d=ImageDraw.Draw(mk); d.ellipse((0,0,D-1,D-1),fill=255); d.ellipse((ring,ring,D-1-ring,D-1-ring),fill=0); m.putalpha(mk)
    sh=Image.new('L',(D,D),0); ds=ImageDraw.Draw(sh)
    for i in range(ring): ds.ellipse((i,i,D-1-i,D-1-i),outline=int(230-130*i/ring))
    r,g,b,a=m.split(); m=Image.merge('RGBA',[ImageChops.multiply(c,sh.point(lambda v:min(255,v*2))) for c in (r,g,b)]+[a])
    o.alpha_composite(m); dr=ImageDraw.Draw(o)
    dr.arc((2,2,D-3,D-3),200,330,fill=(255,230,160,200),width=2); dr.ellipse((ring-1,ring-1,D-ring,D-ring),outline=(60,10,8,255),width=2)
    for ang in (45,135,225,315):  # 四颗铆钉/宝石
        import math; cx=D/2+math.cos(math.radians(ang))*(D/2-ring/2); cy=D/2+math.sin(math.radians(ang))*(D/2-ring/2)
        dr.ellipse((cx-4,cy-4,cx+4,cy+4),fill=(150,20,16,255),outline=(240,200,120,255)); dr.point((cx-1,cy-2),(255,190,170,255))
    return o
save('orb_frame',orb_frame(),0,0,0,0,'HUD 血球/蓝球外框（固定比例；内圆可用区 圆心(64,64) 半径 52）')
def orb_glass(D=128,ring=12):
    o=Image.new('RGBA',(D,D),(0,0,0,0)); r0=D/2-ring
    hl=Image.new('RGBA',(D,D),(0,0,0,0)); d=ImageDraw.Draw(hl)
    d.ellipse((D*0.27,D*0.17,D*0.62,D*0.42),fill=(255,255,255,120)); hl=hl.filter(ImageFilter.GaussianBlur(5))
    d2=ImageDraw.Draw(hl); d2.arc((ring+5,ring+5,D-ring-6,D-ring-6),110,170,fill=(255,255,255,70),width=3)
    vg=Image.new('RGBA',(D,D),(0,0,0,0)); dv=ImageDraw.Draw(vg)
    for i in range(10): dv.ellipse((ring+i,ring+i,D-1-ring-i,D-1-ring-i),outline=(0,0,0,int(110*(1-i/10))),width=1)
    o.alpha_composite(vg); o.alpha_composite(hl)
    mk=Image.new('L',(D,D),0); ImageDraw.Draw(mk).ellipse((ring,ring,D-1-ring,D-1-ring),fill=255); o.putalpha(ImageChops.multiply(o.split()[3],mk)); return o
save('orb_glass',orb_glass(),0,0,0,0,'血/蓝球玻璃高光层（叠在填充之上、orb_frame 之下或之上均可）')
# 2 竖分隔线
dv=Image.new('RGBA',(8,128),(0,0,0,0)); d=ImageDraw.Draw(dv)
for y in range(128):
    k=1-abs(y-63.5)/64; a=int(255*min(1,k*2.2)); d.point((3,y),(230,190,110,a)); d.point((4,y),(90,50,20,a)); d.point((2,y),(60,30,10,a//2))
save('divider_v',dv,0,0,40,40,'竖分隔线（对比面板两列之间；纵向拉伸，两端 40px 渐隐不拉伸；中点可叠 divider_gem）')
# 3 手机小角饰面板
p=comp_frame(96,96,6,darkfill(96,96),r=3); add_corners(p,24,-1); save('panel_frame_s',p,20,20,20,20,'手机小屏面板/小弹窗：角饰 24px，边距 20，适合 ≤ 390 高的屏幕和半屏面板')
# 4 灵符图标
LF=keyblack(Image.open(f'{H}/src/lingfu_src.png'),14,6)
def fit(img,sz):
    bb=img.getbbox(); img=img.crop(bb); k=sz/max(img.size); img=img.resize((max(1,int(img.width*k)),max(1,int(img.height*k))),Image.LANCZOS)
    o=Image.new('RGBA',(sz,sz),(0,0,0,0)); o.alpha_composite(img,((sz-img.width)//2,(sz-img.height)//2)); return o
def glow(img,col=(255,200,80),rad=3):
    a=img.split()[3].filter(ImageFilter.GaussianBlur(rad)); g=Image.new('RGBA',img.size,col+(0,)); g.putalpha(a.point(lambda v:int(v*0.6))); g.alpha_composite(img); return g
s=Image.new('RGBA',(32,32),(0,0,0,0)); s.alpha_composite(fit(LF,30),(1,1)); save('lingfu_icon_s',glow(s,rad=1),0,0,0,0,'灵符货币小图标 32×32（价格旁、顶栏余额）')
l=Image.new('RGBA',(96,96),(0,0,0,0)); l.alpha_composite(fit(LF,84),(6,6)); save('lingfu_icon_l',glow(l,rad=4),0,0,0,0,'灵符货币大图标 96×96（充值档位卡、获得弹窗）')
# 限时丝带（横向可拉伸，燕尾两端）
def ribbon(w=112,h=28,fork=10):
    o=Image.new('RGBA',(w,h),(0,0,0,0)); body=Image.blend(grad(w,h,(200,36,24),(90,8,6)),darkfill(w,h,(3,1.2,1.2)),0.2).convert('RGBA')
    mk=Image.new('L',(w,h),0); d=ImageDraw.Draw(mk); d.polygon([(0,0),(w-1,0),(w-1-fork,h//2),(w-1,h-1),(0,h-1),(fork,h//2)],fill=255); body.putalpha(mk); o.alpha_composite(body)
    dr=ImageDraw.Draw(o); dr.line((fork+2,3,w-fork-3,3),fill=(255,210,120,230)); dr.line((fork+2,h-4,w-fork-3,h-4),fill=(255,210,120,230)); dr.line((fork+2,4,w-fork-3,4),fill=(120,60,20,160))
    return o
save('ribbon_limited',ribbon(),24,24,0,0,'限时/热卖丝带（横向拉伸，燕尾两端 24px 不拉伸；文字代码渲染）')
def corner_badge(S0=64):
    o=Image.new('RGBA',(S0,S0),(0,0,0,0)); band=Image.blend(grad(S0,S0,(200,36,24),(90,8,6)),darkfill(S0,S0,(3,1.2,1.2)),0.2).convert('RGBA')
    mk=Image.new('L',(S0,S0),0); d=ImageDraw.Draw(mk); d.polygon([(S0*0.30,0),(S0*0.62,0),(S0,S0*0.38),(S0,S0*0.70)],fill=255); band.putalpha(mk); o.alpha_composite(band)
    dr=ImageDraw.Draw(o); dr.line((S0*0.33,1,S0-1,S0*0.67),fill=(255,210,120,230)); dr.line((S0*0.60,1,S0-1,S0*0.40),fill=(255,210,120,230))
    return o
save('badge_corner',corner_badge(),0,0,0,0,'商品/档位卡右上角斜角标（固定尺寸，贴右上角；文字旋转 45° 由代码渲染）')
# 充值档位卡底
def card(state):
    w,h=128,160; f=Image.blend(grad(w,h,(70,20,14),(20,8,6)),darkfill(w,h,(1.6,1.2,1.2)),0.4)
    mul={'normal':DGOLD,'sel':(2.0,1.7,1.0),'rec':RED}[state]
    o=comp_frame(w,h,6,f,mul,r=5); add_corners(o,30,-1)
    if state=='sel':
        g=Image.new('RGBA',(w,h),(0,0,0,0)); ImageDraw.Draw(g).rounded_rectangle((6,6,w-7,h-7),5,outline=(255,220,120,220),width=3); o.alpha_composite(g.filter(ImageFilter.GaussianBlur(1.5)))
    if state=='rec':
        g=Image.new('RGBA',(w,h),(0,0,0,0)); ImageDraw.Draw(g).rounded_rectangle((6,6,w-7,h-7),5,outline=(255,80,50,200),width=3); o.alpha_composite(g.filter(ImageFilter.GaussianBlur(2)))
    return o
for st,nm in (('normal','常态'),('sel','选中'),('rec','推荐')): save(f'recharge_card_{st}',card(st),30,30,30,30,f'充值档位卡底（{nm}）；图标/价格/赠送文字由代码叠加')
# 商品格底
def goods(state):
    w=h=80; f=Image.blend(grad(w,h,(34,14,10),(8,5,4)),darkfill(w,h),0.5)
    o=comp_frame(w,h,5,f,(2.0,1.7,1.0) if state=='sel' else DGOLD,r=4)
    # 四角小三角饰
    d=ImageDraw.Draw(o)
    for (x,y,sx,sy) in ((6,6,1,1),(w-7,6,-1,1),(6,h-7,1,-1),(w-7,h-7,-1,-1)): d.polygon([(x,y),(x+8*sx,y),(x,y+8*sy)],fill=(200,150,70,255))
    if state=='sel':
        g=Image.new('RGBA',(w,h),(0,0,0,0)); ImageDraw.Draw(g).rounded_rectangle((5,5,w-6,h-6),4,outline=(255,220,120,220),width=2); o.alpha_composite(g.filter(ImageFilter.GaussianBlur(1)))
    if state=='soldout':
        o=Image.merge('RGBA',[*ImageOps.grayscale(o.convert('RGB')).point(lambda v:int(v*0.7)).convert('RGB').split(),o.split()[3]])
    return o
for st,nm in (('normal','常态'),('sel','选中'),('soldout','售罄灰态')): save(f'goods_slot_{st}',goods(st),18,18,18,18,f'灵符商城商品格底（{nm}）；卷轴/项链/血石等商品图标由代码叠加')
# 5 血石栏位空槽
def slot_blood():
    o=slot(); gm=keyblack(Image.open(f'{H}/src/bloodgem_src.png'),10,5); gm=fit(gm,38)
    r,g,b,a=gm.split(); gm=Image.merge('RGBA',(r,g,b,a.point(lambda v:min(255,int(v*0.9)))))
    o.alpha_composite(gm,(13,13)); d=ImageDraw.Draw(o); d.rounded_rectangle((5,5,58,58),3,outline=(120,20,16,200)); return o
save('slot_bloodstone',slot_blood(),0,0,0,0,'装备栏血石位空槽（与 slot 同 64 体系；中央暗纹宝石，等比缩放，不走九宫格）')
json.dump(SPEC,open(os.path.join(H,'slices.json'),'w'),ensure_ascii=False,indent=1)
print(len(SPEC),'slices total')
