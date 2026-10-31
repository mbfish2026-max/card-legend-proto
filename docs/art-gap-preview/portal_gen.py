import numpy as np
from PIL import Image,ImageDraw,ImageFont
src=np.asarray(Image.open('/cursor/stores/store-e828e451-99b2-413a-83d5-56cd7e35bcec/grok-bot/agents/15805748-cea6-409d-b4f9-ac337f5dc4b3/assets/1ec645187fdb6a3198d1fb25e5d080246dc1a0796a4c34e8a9bee5ea4fb439f3.jpg').convert('RGB')).astype(np.float32)
src=np.clip(src-6,0,None)
h,w,_=src.shape
yy,xx=np.mgrid[:h,:w]; cx,cy,rx,ry=392,508,245,370
inside=((xx-cx)/rx)**2+((yy-cy)/ry)**2
fill=np.clip((0.8-inside)*4,0,1)*0.85
X0,Y0,X1,Y1=100,50,690,1024
def frame(ang,s,br):
    im=Image.fromarray(src.astype(np.uint8)); k=rx/ry
    rot=im.resize((w,int(h*k))).rotate(ang,resample=Image.BICUBIC,center=(cx,cy*k)).resize((w,h))
    m=np.clip((0.7-inside)*5,0,1)[...,None]
    c=np.clip((np.asarray(rot).astype(np.float32)*m+src*(1-m))*br,0,255)
    a=np.maximum(np.clip(c.max(2)/255*1.25,0,1),fill)
    col=np.clip(c/np.maximum(a,1e-3)[...,None],0,255); col[a<0.01]=0
    o=Image.fromarray(np.dstack([col,a*255]).astype(np.uint8),'RGBA').crop((X0,Y0,X1,Y1))
    sc=min(250/(X1-X0),380/(Y1-Y0))*s; W,H=round((X1-X0)*sc),round((Y1-Y0)*sc)
    o=o.resize((W,H),Image.LANCZOS)
    F=Image.new('RGBA',(256,384),(0,0,0,0)); F.alpha_composite(o,((256-W)//2,(384-H)//2)); return F
fr=[frame(a,s,b) for a,s,b in [(0,0.97,1.0),(6,0.985,1.07),(0,1.0,1.13),(-6,0.985,1.07)]]
fr[0].save('public/assets/portal_exit.png')
sh=Image.new('RGBA',(1024,384));[sh.paste(f,(i*256,0)) for i,f in enumerate(fr)];sh.save('public/assets/portal_exit_sheet.png')
P=Image.new('RGB',(1064,840),(40,40,48));d=ImageDraw.Draw(P)
ft=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
for i,f in enumerate(fr):
    P.paste(f,(10+i*260,30),f)
    chk=Image.new('RGB',(256,384),(200,200,200)); g=ImageDraw.Draw(chk)
    for x in range(0,256,16):
        for y in range(0,384,16):
            if (x+y)//16%2: g.rectangle((x,y,x+15,y+15),fill=(150,150,150))
    chk.paste(f,(0,0),f); P.paste(chk,(10+i*260,444)); d.text((10+i*260,5),f'帧{i+1}',fill='white',font=ft)
d.text((10,418),'棋盘格底（检查透明边缘）',fill='white',font=ft)
P.save('docs/art-gap-preview/portal_preview.jpg',quality=90)
for f in fr:
    a=np.asarray(f)[...,3]; print(a[:,0].max(),a[:,-1].max(),a[0].max(),a[-1].max())
