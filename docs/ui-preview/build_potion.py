"""药水扩展图标 12 张 64×64（docs/art-requests.md P1）。源图 src/pot_*_src.jpg（GenerateImage 原创，黑底，参考现有 hp/mp 药瓶风格）。"""
from PIL import Image,ImageFilter,ImageEnhance;import numpy as np,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);OUT='../../public/assets/items'
def key(im,t0=16,t1=64):
    a=np.asarray(im.convert('RGB')).astype(float);al=np.clip((a.max(2)-t0)/(t1-t0),0,1)
    rgb=np.where(al[...,None]>0,np.clip(a/np.maximum(al[...,None],0.3),0,255),0)
    return Image.fromarray(np.dstack([rgb,al*255]).astype('uint8'),'RGBA')
def segs(st):
    col=(np.asarray(st)[...,3]>60).sum(0)>4;r=[];i=0
    while i<len(col):
        if col[i]:
            j=i
            while j<len(col) and col[j]:j+=1
            if j-i>30:r.append((i,j))
            i=j
        else:i+=1
    return r
def fit(im,scale=1.0,S=64,pad=2,th=60):
    im=im.crop(im.getchannel('A').point(lambda v:255 if v>th else 0).getbbox())
    k=(S-2*pad)*scale/max(im.size);im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS)
    rgb=ImageEnhance.Sharpness(ImageEnhance.Contrast(im.convert('RGB')).enhance(1.12)).enhance(1.7);im=Image.merge('RGBA',(*rgb.split(),im.getchannel('A')))
    c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,S-pad-im.height),im)
    a=c.getchannel('A').filter(ImageFilter.GaussianBlur(1.2)).point(lambda v:int(v*0.75));sh=Image.new('RGBA',c.size,(0,0,0,0));sh.putalpha(a)
    o=Image.new('RGBA',c.size);o.alpha_composite(sh,(1,1));o.alpha_composite(c);return o
JOBS={'pot_singles':[('pot_hp_big',1.0),('pot_mp_big',1.0),('pot_sun',0.80),('pot_sun_big',1.0)],
 'pot_bundles1':[('bundle_hp_small',0.92),('bundle_mp_small',0.92),('bundle_hp_mid',1.0),('bundle_mp_mid',1.0)],
 'pot_bundles2':[('bundle_hp_big',1.0),('bundle_mp_big',1.0),('bundle_sun',1.0),('bundle_sun_big',1.0)]}
for src,items in JOBS.items():
    st=key(Image.open(f'src/{src}_src.jpg'));sg=segs(st);assert len(sg)==4,(src,sg)
    for (x0,x1),(n,s) in zip(sg,items):
        th=150 if n.endswith('sun_big') else 60  # 光晕不计入尺寸
        c=fit(st.crop((max(0,x0-40),0,min(st.width,x1+40),st.height)),s,th=th);c.save(f'{OUT}/{n}.png',optimize=True);print(n,os.path.getsize(f'{OUT}/{n}.png'))
