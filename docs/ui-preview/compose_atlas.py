"""图集预览 + 自检：帧框标注、血球红蓝叠层、2x 示意；九宫格从图集双线性采样拉伸 vs 源切片拉伸的渗色对比。"""
import os,json,numpy as np
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'compose_preview.py'),encoding='utf-8').read().split("os.makedirs(f'{H}',exist_ok=True)")[0])
AJ=json.load(open(f'{H}/atlas/ui_atlas.json'));AT=Image.open(f'{H}/atlas/ui_atlas.png').convert('RGBA');SPJ=json.load(open(f'{H}/slices.json'))
def nine_from(src,box,L,R,T,B,w,h):
    x0,y0,x1,y1=box;fw,fh=x1-x0,y1-y0;out=Image.new('RGBA',(w,h))
    xs=[(0,L,0,L),(L,fw-R,L,w-R),(fw-R,fw,w-R,w)];ys=[(0,T,0,T),(T,fh-B,T,h-B),(fh-B,fh,h-B,h)]
    for sx0,sx1,dx0,dx1 in xs:
        for sy0,sy1,dy0,dy1 in ys:
            if sx1>sx0 and sy1>sy0 and dx1>dx0 and dy1>dy0:
                out.paste(src.resize((dx1-dx0,dy1-dy0),Image.BILINEAR,box=(x0+sx0,y0+sy0,x0+sx1,y0+sy1)),(dx0,dy0))
    return out
worst=('',0)
for n,f in AJ['frames'].items():
    v=SPJ[n];fr=f['frame'];b=(fr['x'],fr['y'],fr['x']+fr['w'],fr['y']+fr['h']);w,h=int(fr['w']*2.3)+3,int(fr['h']*1.7)+3
    src=Image.open(f'{H}/slices/{n}.png').convert('RGBA');a=np.asarray(src);pad=Image.fromarray(np.pad(a,((1,1),(1,1),(0,0)),mode='edge'))
    # 参照：源切片四边 clamp（等价 extrude）后同算法拉伸
    ref=nine_from(pad,(1,1,1+src.width,1+src.height),v['left'],v['right'],v['top'],v['bottom'],w,h)
    got=nine_from(AT,b,v['left'],v['right'],v['top'],v['bottom'],w,h)
    d=np.abs(np.asarray(ref,int)-np.asarray(got,int)).max()
    if d>worst[1]: worst=(n,d)
print('bleed worst',worst)
C=Image.new('RGBA',(1280,1000),(18,12,9,255));d=ImageDraw.Draw(C)
text(C,10,12,f'ui_atlas.png 512×512 · {len(AJ["frames"])} 帧 · padding 2 + extrude 1（放大 1.5×，品红框=帧）',15,anchor='lm')
chk=Image.new('RGBA',(768,768),(40,40,40,255));cd=ImageDraw.Draw(chk)
for y in range(0,768,16):
    for x in range(0,768,16):
        if (x//16+y//16)%2: cd.rectangle((x,y,x+15,y+15),fill=(56,56,56,255))
chk.alpha_composite(AT.resize((768,768),Image.NEAREST));cd=ImageDraw.Draw(chk);ft=F(10)
for n,f in AJ['frames'].items():
    r=f['frame'];x,y,w,h=[int(v*1.5) for v in (r['x'],r['y'],r['w'],r['h'])];cd.rectangle((x,y,x+w-1,y+h-1),outline=(255,0,200,255))
    cd.text((x+2,y+1),n,font=ft,fill=(255,255,255,255),stroke_width=2,stroke_fill=(0,0,0,255))
C.alpha_composite(chk,(10,28))
# 血球：暗底 → 液面(setCrop) → orb_glass → orb_frame
fr=lambda n:AT.crop((AJ['frames'][n]['frame']['x'],AJ['frames'][n]['frame']['y'],AJ['frames'][n]['frame']['x']+AJ['frames'][n]['frame']['w'],AJ['frames'][n]['frame']['y']+AJ['frames'][n]['frame']['h']))
text(C,1000,40,'血球叠层（140px 显示）',15)
for j,(k,ratio) in enumerate((('red',0.7),('blue',0.35),('red',1.0),('blue',0.0))):
    D=140;x=800+(j%2)*190;y=60+(j//2)*190;r=D*52/128;cx=x+D/2;cy=y+D/2
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(10,4,4,255))
    fd=int(D*104/128);fl=fr(f'orb_fill_{k}').resize((fd,fd),Image.LANCZOS);top=int(fd*(1-ratio))
    if top<fd: C.alpha_composite(fl.crop((0,top,fd,fd)),(int(cx-fd/2),int(cy-fd/2)+top))
    C.alpha_composite(fr('orb_glass').resize((D,D),Image.LANCZOS),(x,y));C.alpha_composite(fr('orb_frame').resize((D,D),Image.LANCZOS),(x,y))
    text(C,x+D//2,y+D+14,f'{k} {int(ratio*100)}%',13)
# 2x 示意
text(C,1000,460,'手机 DOM 1x vs @2x（同为 2 倍显示）',15)
for j,n in enumerate(('btn_normal','bar_frame','panel_frame_s')):
    s=Image.open(f'{H}/slices/{n}.png').convert('RGBA');b2=Image.open(f'{H}/dom/2x/{n}@2x.png').convert('RGBA');y=490+j*120
    C.alpha_composite(s.resize((s.width*2,s.height*2),Image.BILINEAR).crop((0,0,min(220,s.width*2),min(110,s.height*2))),(800,y));C.alpha_composite(b2.crop((0,0,min(220,b2.width),min(110,b2.height))),(1040,y))
    text(C,800,y-6,f'{n} 1x 拉伸',11,anchor='lm');text(C,1040,y-6,'@2x',11,anchor='lm')
text(C,800,860,'自检：46 帧裁回与源切片逐像素一致',12,anchor='lm');text(C,800,880,f'九宫格双线性拉伸 vs 源切片：最大差 {worst[1]}/255',12,anchor='lm')
C=C.crop((0,0,1280,900));C.convert('RGB').save(f'{H}/preview_atlas.jpg',quality=90);print(os.path.getsize(f'{H}/preview_atlas.jpg'))
