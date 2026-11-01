"""第四轮：按用户灵符商城参考图重做 goods_slot_* / badge_corner，新增 lingfu_icon_xs（16×16）。"""
from PIL import Image,ImageDraw,ImageFilter;import json,os,random
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H)
S=80;SS=4  # 4x 超采样后缩小
tex=Image.open('src/tex_metal_256.jpg').convert('L').resize((S*SS,S*SS))
def frame(pal):
    W=S*SS;im=Image.new('RGBA',(W,W),(0,0,0,0));d=ImageDraw.Draw(im)
    o,b1,b2,line,tri,inner=pal
    d.rectangle((0,0,W-1,W-1),fill=o)                      # 1px 黑外描
    d.rectangle((SS,SS,W-1-SS,W-1-SS),fill=b1)              # 粗边 7px（亮）
    # 右下暗半边：斜面
    d.polygon([(W-SS,SS),(W-SS,W-SS),(SS,W-SS),(8*SS,W-8*SS),(W-8*SS,W-8*SS),(W-8*SS,8*SS)],fill=b2)
    d.rectangle((8*SS,8*SS,W-1-8*SS,W-1-8*SS),fill=line)   # 1px 暗内线
    d.rectangle((9*SS,9*SS,W-1-9*SS,W-1-9*SS),fill=inner)   # 深色内底（不透明）
    t=10*SS;a=9*SS;e=W-1-9*SS                               # 四角三角角饰（腰长 10px）
    for p in ([(a,a),(a+t,a),(a,a+t)],[(e,a),(e-t,a),(e,a+t)],[(a,e),(a+t,e),(a,e-t)],[(e,e),(e-t,e),(e,e-t)]): d.polygon(p,fill=tri)
    # 金属颗粒：仅作用在边框
    m=Image.new('L',(W,W),0);ImageDraw.Draw(m).rectangle((SS,SS,W-1-SS,W-1-SS),fill=255);ImageDraw.Draw(m).rectangle((8*SS,8*SS,W-1-8*SS,W-1-8*SS),fill=0)
    noise=Image.merge('RGBA',[tex,tex,tex,m.point(lambda v:v*45//255)])
    dark=Image.new('RGBA',(W,W),(0,0,0,0));dark.paste((0,0,0,255),mask=Image.composite(Image.eval(tex,lambda v:255-v),Image.new('L',(W,W),0),m).point(lambda v:v*60//255))
    im.alpha_composite(dark)
    hl=Image.new('RGBA',(W,W),(0,0,0,0));hd=ImageDraw.Draw(hl);c=tuple(min(255,int(v*1.25)) for v in b1[:3])
    hd.line([(SS,SS),(W-SS,SS)],fill=c+(255,),width=SS);hd.line([(SS,SS),(SS,W-SS)],fill=c+(255,),width=SS)
    hd.rectangle((7*SS,7*SS,W-1-7*SS,W-1-7*SS),outline=(0,0,0,150),width=SS)
    im.alpha_composite(hl)
    # 内底轻微暗角
    v=Image.new('L',(W,W),0);ImageDraw.Draw(v).rectangle((9*SS,9*SS,W-1-9*SS,W-1-9*SS),fill=70);v=v.filter(ImageFilter.GaussianBlur(10*SS));vv=Image.new('L',(W,W),0);ImageDraw.Draw(vv).rectangle((9*SS,9*SS,W-1-9*SS,W-1-9*SS),fill=255)
    return im.resize((S,S),Image.LANCZOS)
P={'normal':((10,6,3,255),(184,128,58,255),(112,70,28,255),(20,10,4,255),(214,162,70,255),(30,18,12,255)),
   'sel':((14,8,2,255),(255,212,110,255),(186,130,40,255),(60,36,8,255),(255,226,130,255),(36,22,12,255)),
   'soldout':((6,6,7,255),(78,80,84,255),(44,45,48,255),(14,14,16,255),(96,98,102,255),(20,20,22,255))}
for k,p in P.items(): frame(p).save(f'slices/goods_slot_{k}.png',optimize=True)
# 红色斜角丝带 40×40：从上边 x=14 到右边 y=26 的斜带，宽约 8px，透明底
W=40*SS;b=Image.new('RGBA',(W,W),(0,0,0,0));d=ImageDraw.Draw(b)
d.polygon([(12*SS,0),(22*SS,0),(W,18*SS),(W,28*SS)],fill=(12,2,2,230))
d.polygon([(14*SS,0),(21*SS,0),(W,19*SS),(W,26*SS)],fill=(196,28,24,255))
d.line([(15*SS,0),(W,25*SS)],fill=(120,10,8,255),width=SS);d.line([(20*SS,0),(W,20*SS)],fill=(255,110,90,255),width=SS)
b.resize((40,40),Image.LANCZOS).save('slices/badge_corner.png',optimize=True)
# 价格前小灵符 16×16：竖向黄符纸 + 红朱砂纹
W=16*SS;l=Image.new('RGBA',(W,W),(0,0,0,0));d=ImageDraw.Draw(l)
d.rectangle((4*SS,0,11*SS,15*SS),fill=(60,30,6,255));d.rectangle((5*SS,SS,10*SS,14*SS),fill=(246,190,50,255));d.rectangle((5*SS,SS,6*SS,14*SS),fill=(255,230,130,255))
d.line([(7*SS,3*SS),(9*SS,5*SS),(7*SS,8*SS),(9*SS,11*SS)],fill=(190,30,20,255),width=SS)
l.resize((16,16),Image.LANCZOS).save('slices/lingfu_icon_xs.png',optimize=True)
sp=json.load(open('slices.json'))
CN={'normal':'常态','sel':'选中','soldout':'售罄'}
for k in P: sp[f'goods_slot_{k}']={'w':80,'h':80,'left':20,'right':20,'top':20,'bottom':20,'use':f'灵符商城/商店商品格（{CN[k]}）：7px 铜金粗边+四角金三角角饰（10px）+不透明深色内底；对齐用户参考图；图标居中叠加'}
sp['badge_corner']={'w':40,'h':40,'left':0,'right':0,'top':0,'bottom':0,'use':'商品格右上红色斜角丝带（不含文字），按 80 格原尺寸设计；setOrigin(1,0) 贴格子右上角，随格子等比 setDisplaySize(size/2)'}
sp['lingfu_icon_xs']={'w':16,'h':16,'left':0,'right':0,'top':0,'bottom':0,'use':'价格前小灵符（显示 16~20px，与 12~16px 价格字等高）'}
json.dump(sp,open('slices.json','w'),ensure_ascii=False,indent=1);print(len(sp))
