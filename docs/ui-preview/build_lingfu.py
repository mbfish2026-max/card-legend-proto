"""灵符商城图标：64×64 单图（public/assets/icons/）+ ui_atlas 帧 lingfu_entry（九宫格 56×44，拉伸到 88×44/52×44）。源图 src/lf_*_src.jpg（GenerateImage 原创，黑底）。"""
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance;import numpy as np,json,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);OUT='../../public/assets/icons';os.makedirs(OUT,exist_ok=True)
def key(im,t0=18,t1=70):
    a=np.asarray(im.convert('RGB')).astype(float);m=a.max(2);al=np.clip((m-t0)/(t1-t0),0,1)
    rgb=np.clip(a/np.maximum(al[...,None],1e-3)*np.minimum(al[...,None]*1.0,1),0,255)  # 去黑底预乘
    rgb=np.where(al[...,None]>0,np.clip(a/np.maximum(al[...,None],0.25),0,255),0)
    return Image.fromarray(np.dstack([rgb,al*255]).astype('uint8'),'RGBA')
def fit(im,scale=1.0,S=64,pad=2,th=24):
    bb=im.getchannel('A').point(lambda v:255 if v>th else 0).getbbox();im=im.crop(bb)
    box=(S-2*pad)*scale;k=box/max(im.size);im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS)
    rgb=ImageEnhance.Sharpness(im.convert('RGB')).enhance(1.6);im=Image.merge('RGBA',(*rgb.split(),im.getchannel('A')))
    c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,S-pad-im.height if scale<1 else (S-im.height)//2),im);return c
def shadow(c):
    a=c.getchannel('A').filter(ImageFilter.GaussianBlur(1.5));sh=Image.new('RGBA',c.size,(0,0,0,0));sh.putalpha(a.point(lambda v:int(v*0.7)))
    o=Image.new('RGBA',c.size);o.alpha_composite(sh,(1,1));o.alpha_composite(c);return o
res={}
for n,f in [('shop_summon_scroll','lf_scroll'),('shop_return_stone','lf_return'),('shop_skill_necklace','lf_necklace')]:
    src=Image.open(f'src/{f}_src.jpg')
    if f=='lf_necklace':src=src.crop((200,250,824,980))  # 只留吊坠+短链，避免缩小后太细
    c=shadow(fit(key(src),1.0));c.save(f'{OUT}/{n}.png',optimize=True);res[n]=c
# 血石 4 档：按列空隙切分，体积递增 + 色深递增
st=key(Image.open('src/lf_stones_src.jpg'),22,80);a=np.asarray(st)[...,3];col=(a>40).sum(0)>3
segs=[];i=0
while i<len(col):
    if col[i]:
        j=i
        while j<len(col) and col[j]:j+=1
        if j-i>20:segs.append((i,j))
        i=j
    else:i+=1
assert len(segs)==4,segs
for (x0,x1),n,s in zip(segs,['s','m','l','xl'],[0.56,0.72,0.86,1.0]):
    c=shadow(fit(st.crop((max(0,x0-30),0,min(st.width,x1+30),st.height)),s,th=200 if n=='xl' else 24));c.save(f'{OUT}/bloodstone_{n}.png',optimize=True);res['bloodstone_'+n]=c
# lingfu_entry 九宫格：暗红漆底 + 金边 + 黄符纸芯，四角朱砂符点
# 88 放不下 512 图集；九宫格横向拉到 88
W,Hh=56,44;e=Image.new('RGBA',(W,Hh));d=ImageDraw.Draw(e)
d.rounded_rectangle((0,0,W-1,Hh-1),7,fill=(40,10,8,255),outline=(20,6,4,255))
d.rounded_rectangle((1,1,W-2,Hh-2),6,outline=(150,105,40,255),width=1)
d.rounded_rectangle((2,2,W-3,Hh-3),5,outline=(240,200,110,255),width=1)
d.rounded_rectangle((4,4,W-5,Hh-5),3,fill=(110,24,16,255),outline=(70,14,10,255))
paper=Image.new('RGBA',(W-14,Hh-14));g=np.linspace(0,1,paper.height)[:,None]
arr=np.zeros((paper.height,paper.width,4));arr[...,0]=232-40*g;arr[...,1]=190-50*g;arr[...,2]=92-40*g;arr[...,3]=255
paper=Image.fromarray(arr.astype('uint8'),'RGBA');e.paste(paper,(7,7))
d.rectangle((7,7,W-8,Hh-8),outline=(160,40,24,255))
for x,y in [(10,10),(W-11,10),(10,Hh-11),(W-11,Hh-11)]:d.ellipse((x-2,y-2,x+2,y+2),fill=(190,30,20,255))
d.line((14,8,W-15,8),fill=(255,236,170,255))
os.makedirs('slices',exist_ok=True);e.save('slices/lingfu_entry.png',optimize=True)
sp=json.load(open('slices.json'));sp['lingfu_entry']={'w':W,'h':Hh,'left':18,'right':18,'top':14,'bottom':14,'use':'灵符商城常驻入口按钮（源 56×44，桌面 setSize 88×44；手机 DOM 52×44 CSS，border-image 18/14）；中间叠 lingfu_icon_s + 文字','fixed':False,'dom':True}
json.dump(sp,open('slices.json','w'),ensure_ascii=False,indent=1)
for n,c in res.items():print(n,c.size,os.path.getsize(f'{OUT}/{n}.png'))
