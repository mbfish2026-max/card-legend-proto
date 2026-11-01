"""预览：灵符商城图标原尺寸 / goods_slot 内 1280×720 与 844×390 / 血石四档对比 / lingfu_entry 拉伸。"""
from PIL import Image,ImageDraw,ImageFont;import os,glob
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);I='../../public/assets/icons/'
F=lambda s:ImageFont.truetype(next(iter(glob.glob('/usr/share/fonts/**/*CJK*.tt*',recursive=True)+glob.glob('/usr/share/fonts/**/*.tt*',recursive=True))),s)
N=['shop_summon_scroll','shop_return_stone','shop_skill_necklace','bloodstone_s','bloodstone_m','bloodstone_l','bloodstone_xl']
CN=['召唤直升卷轴','回城石','技巧项链','血石(小)','血石(中)','血石(大)','血石(特)']
ic={n:Image.open(I+n+'.png') for n in N};slot=Image.open('slices/goods_slot_normal.png');ent=Image.open('slices/lingfu_entry.png');lf=Image.open('slices/lingfu_icon_s.png')
bg=Image.open('src/tex_dark_256.jpg').convert('RGBA')
cv=Image.new('RGBA',(1300,820));[cv.paste(bg,(x,y)) for x in range(0,1300,256) for y in range(0,820,256)];d=ImageDraw.Draw(cv)
def T(x,y,s,sz=16,c=(255,224,112)):d.text((x,y),s,font=F(sz),fill=c)
def nine(im,w,h,l,r,t,b):
    o=Image.new('RGBA',(w,h));W,Hh=im.size
    for (sx0,sx1,dx0,dx1) in [(0,l,0,l),(l,W-r,l,w-r),(W-r,W,w-r,w)]:
        for (sy0,sy1,dy0,dy1) in [(0,t,0,t),(t,Hh-b,t,h-b),(Hh-b,Hh,h-b,h)]:
            o.paste(im.crop((sx0,sy0,sx1,sy1)).resize((dx1-dx0,dy1-dy0)),(dx0,dy0))
    return o
T(20,10,'1) 原尺寸 64×64',20)
for k,n in enumerate(N):cv.alpha_composite(ic[n],(20+k*120,40));T(20+k*120,108,CN[k],14,(220,220,220))
T(20,140,'2) goods_slot 1280×720（80×80 槽，图标 64）',20)
for k,n in enumerate(N):x=20+k*100;cv.alpha_composite(slot,(x,170));cv.alpha_composite(ic[n],(x+8,178))
T(20,265,'3) goods_slot 844×390（×0.54：槽 43，图标 35）',20)
s2=slot.resize((43,43),Image.LANCZOS)
for k,n in enumerate(N):x=20+k*56;cv.alpha_composite(s2,(x,295));cv.alpha_composite(ic[n].resize((35,35),Image.LANCZOS),(x+4,299))
T(20,355,'4) 血石四档并排：64 / 48 / 40',20)
for r,sz in enumerate([64,48,40]):
    for k,n in enumerate(N[3:]):cv.alpha_composite(ic[n].resize((sz,sz),Image.LANCZOS),(20+k*(sz+16)+r*330,390))
T(20,470,'5) lingfu_entry 九宫格（源 56×44）→ 桌面 88×44、手机 52×44；原尺寸',20)
for k,w in enumerate([88,52,56]):
    x=20+k*130;cv.alpha_composite(nine(ent,w,44,18,18,14,14),(x,505));cv.alpha_composite(lf.resize((20,20)),(x+8 if w>60 else x+16,517))
    if w>60:T(x+32,515,'灵符',16,(110,20,10))
T(20,570,'6) 放大 ×3 细节',20)
for k,n in enumerate(N):cv.alpha_composite(ic[n].resize((160,160),Image.NEAREST),(20+k*180,600))
cv.convert('RGB').save('preview_lingfu_icons.jpg',quality=90);print('ok')
