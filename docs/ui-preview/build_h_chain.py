"""H 链过渡装备 29 张图标：64×64 + @2x 128×128（与现有 eq_* 一致）。源图 src/h_*_src.jpg（GenerateImage 原创，黑底）。"""
from PIL import Image,ImageFilter,ImageEnhance;import numpy as np,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);OUT='../../public/assets/items'
def key(im,t0=4,t1=18):
    a=np.asarray(im.convert('RGB')).astype(float);al=np.clip((a.max(2)-t0)/(t1-t0),0,1)
    rgb=np.where(al[...,None]>0,np.clip(a/np.maximum(al[...,None],0.35),0,255),0)
    return Image.fromarray(np.dstack([rgb,al*255]).astype('uint8'),'RGBA')
def segs(st,n):
    col=(np.asarray(st)[...,3]>80).sum(0)>3;r=[];i=0
    while i<len(col):
        if col[i]:
            j=i
            while j<len(col) and (col[j] or (j+12<len(col) and col[j:j+12].any())):j+=1
            if j-i>40:r.append((i,j))
            i=j
        else:i+=1
    assert len(r)==n,r;return r
# v2：项链只保留下部（裁掉过长链条）使吊坠与 eq_* 项链同占比；暗色图标提亮+轮廓高光
NECK_KEEP=0.62
DARK={'h_black_crystal_necklace':(170,120,255),'h_black_crystal_ring':(150,140,255),'h_ebony_necklace':(225,150,80),'h_ebony_bracelet':(230,160,90),'h_death_glove':(190,100,255)}
def brighten(im,rim,S):
    a=np.asarray(im).astype(float);rgb=255*(a[...,:3]/255)**0.62;al=a[...,3]
    m=Image.fromarray(al.astype('uint8'));w=max(1,S//64)
    er=np.asarray(m.filter(ImageFilter.MinFilter(2*w+1))).astype(float)
    edge=np.clip(al-er,0,255)/255*0.85
    sh=np.zeros_like(al);sh[w:,w:]=edge[:-w,:-w]   # 偏左上的边：用原 edge 减右下偏移，近似光从左上
    e=np.clip(edge-0.5*sh,0,1)[...,None]
    rgb=rgb*(1-e)+np.array(rim)*e
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),al]).astype('uint8'),'RGBA')
def fit(im,S,pad,name=''):
    im=im.crop(im.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox())
    if 'necklace' in name or name=='h_phoenix_pearl': im=im.crop((0,int(im.height*(1-NECK_KEEP)),im.width,im.height)); im=im.crop(im.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox())
    k=(S-2*pad)/max(im.size);im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS)
    rgb=ImageEnhance.Sharpness(ImageEnhance.Contrast(im.convert('RGB')).enhance(1.1)).enhance(1.6 if S==64 else 1.2);im=Image.merge('RGBA',(*rgb.split(),im.getchannel('A')))
    c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,(S-im.height)//2),im)
    a=c.getchannel('A').filter(ImageFilter.GaussianBlur(S/48)).point(lambda v:int(v*0.75));sh=Image.new('RGBA',c.size,(0,0,0,0));sh.putalpha(a)
    if name in DARK:c=brighten(c,DARK[name],S)
    o=Image.new('RGBA',c.size);o.alpha_composite(sh,(S//64,S//64));o.alpha_composite(c);return o
JOBS={'h_neck1':['h_gold_necklace','h_black_crystal_necklace','h_ebony_necklace','h_yellow_crystal_necklace'],
 'h_neck2':['h_devil_necklace','h_amber_necklace','h_phoenix_pearl','h_blue_jade_necklace'],
 'h_br1':['h_leather_glove',None,'h_big_bracelet','h_magic_bracelet'],
 'h_br2':['h_sturdy_glove',None,'h_tao_bracelet','h_power_bracelet'],
 'h_br3':['h_death_glove','h_gold_bracelet'],
 'h_ring1':['h_hex_ring','h_glass_ring','h_horn_ring','h_blue_crystal_ring'],
 'h_ring2':['h_black_crystal_ring','h_snake_eye_ring','h_pearl_ring'],
 'h_br_v2':['h_steel_bracelet','h_ebony_bracelet'],
 'h_boots':['h_cloth_shoes','h_deer_boots','h_silk_boots','h_soul_boots']}
for src,names in JOBS.items():
    st=key(Image.open(f'src/{src}_src.jpg'))
    for (x0,x1),n in zip(segs(st,len(names)),names):
        if n is None:continue
        cr=st.crop((max(0,x0-30),0,min(st.width,x1+30),st.height))
        fit(cr,64,2,n).save(f'{OUT}/{n}.png',optimize=True);fit(cr,128,4,n).save(f'{OUT}/{n}@2x.png',optimize=True)
        print(n,os.path.getsize(f'{OUT}/{n}.png'),os.path.getsize(f'{OUT}/{n}@2x.png'))
