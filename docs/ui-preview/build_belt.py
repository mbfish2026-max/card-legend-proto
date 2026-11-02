"""阶段2 腰带 7 条（64 + @2x 128）+ 空栏底图 slot_empty_belt/boots（60 + @2x 120）。
源图 src/belt{1,2}_src.jpg、src/slot_empty_src.jpg（GenerateImage 原创，黑底）。流程同 build_h_chain.py（含 v2 暗部提亮+有色边缘高光）。"""
from PIL import Image,ImageFilter,ImageEnhance;import numpy as np,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);OUT='../../public/assets/items';UI='../../public/assets/ui'
def key(im,t0=4,t1=18):
    a=np.asarray(im.convert('RGB')).astype(float);al=np.clip((a.max(2)-t0)/(t1-t0),0,1)
    rgb=np.where(al[...,None]>0,np.clip(a/np.maximum(al[...,None],0.35),0,255),0)
    return Image.fromarray(np.dstack([rgb,al*255]).astype('uint8'),'RGBA')
def segs(st,n,th=80):
    col=(np.asarray(st)[...,3]>th).sum(0)>3;r=[];i=0
    while i<len(col):
        if col[i]:
            j=i
            while j<len(col) and (col[j] or (j+12<len(col) and col[j:j+12].any())):j+=1
            if j-i>40:r.append((i,j))
            i=j
        else:i+=1
    assert len(r)==n,r;return r
def brighten(im,rim,S,g=0.7):
    a=np.asarray(im).astype(float);rgb=255*(a[...,:3]/255)**g;al=a[...,3]
    w=max(1,S//64);er=np.asarray(Image.fromarray(al.astype('uint8')).filter(ImageFilter.MinFilter(2*w+1))).astype(float)
    edge=np.clip(al-er,0,255)/255*0.8;sh=np.zeros_like(al);sh[w:,w:]=edge[:-w,:-w];e=np.clip(edge-0.5*sh,0,1)[...,None]
    rgb=rgb*(1-e)+np.array(rim)*e
    return Image.fromarray(np.dstack([np.clip(rgb,0,255),al]).astype('uint8'),'RGBA')
def fit(im,S,pad,th=80,dark=None):
    im=im.crop(im.getchannel('A').point(lambda v:255 if v>th else 0).getbbox())
    k=(S-2*pad)/max(im.size);im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS)
    rgb=ImageEnhance.Sharpness(ImageEnhance.Contrast(im.convert('RGB')).enhance(1.1)).enhance(1.6 if S==64 else 1.2);im=Image.merge('RGBA',(*rgb.split(),im.getchannel('A')))
    c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,(S-im.height)//2),im)
    if dark:c=brighten(c,dark,S)
    a=c.getchannel('A').filter(ImageFilter.GaussianBlur(S/48)).point(lambda v:int(v*0.75));sh=Image.new('RGBA',c.size,(0,0,0,0));sh.putalpha(a)
    o=Image.new('RGBA',c.size);o.alpha_composite(sh,(S//64,S//64));o.alpha_composite(c);return o
# (源图, [(文件名, bbox阈值, 暗部高光色或None)])
JOBS={'belt1':[('belt_hide',80,None),('belt_iron',80,(170,190,230)),('belt_bronze',80,None),('belt_steel',80,None)],
      'belt2':[('belt_leiting',235,None),('belt_lieyan',235,None),('belt_guangmang',235,None)]}
for src,items in JOBS.items():
    st=key(Image.open(f'src/{src}_src.jpg'))
    for (x0,x1),(n,th,dk) in zip(segs(st,len(items),40),items):
        cr=st.crop((max(0,x0-30),0,min(st.width,x1+30),st.height))
        fit(cr,64,2,th,dk).save(f'{OUT}/{n}.png',optimize=True);fit(cr,128,4,th,dk).save(f'{OUT}/{n}@2x.png',optimize=True)
        print(n,os.path.getsize(f'{OUT}/{n}.png'),os.path.getsize(f'{OUT}/{n}@2x.png'))
# 空栏底图：暗纹剪影，透明底，叠在 slot 空格中央；提亮到可辨但保持低调（整体 alpha 0.8）
st=key(Image.open('src/slot_empty_src.jpg'))
for (x0,x1),n in zip(segs(st,2),['slot_empty_belt','slot_empty_boots']):
    cr=st.crop((max(0,x0-30),0,min(st.width,x1+30),st.height))
    for S,suf in((60,''),(120,'@2x')):
        im=cr.crop(cr.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox());k=S*0.72/max(im.size)
        im=im.resize((round(im.width*k),round(im.height*k)),Image.LANCZOS);c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,(S-im.height)//2),im)
        c=brighten(c,(150,120,80),S*64//60,g=0.8);a=np.asarray(c).copy();a[...,3]=(a[...,3]*0.8).astype('uint8')
        Image.fromarray(a,'RGBA').save(f'{UI}/{n}{suf}.png',optimize=True)
    print(n,os.path.getsize(f'{UI}/{n}.png'),os.path.getsize(f'{UI}/{n}@2x.png'))
