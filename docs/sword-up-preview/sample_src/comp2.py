# 分层合成：剑下半 → 拳头 → 拳上沿以上的剑（柄/护手/剑身）。用法：comp2.py <cls> <sword> <out.png> <预览前缀>
import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
cls,sw_name,outp,pre=sys.argv[1:5]
SW={ # 中轴x, 剑尖y, 护手上沿, 柄起, 柄止(剑首起), 末端, 柄宽
 'wood':(511,45,678,740,905,962,61),'iron':(511,15,710,752,955,1008,54),
 'dragon':(511,10,645,758,945,1003,57),'dragonc':(504,20,645,740,915,985,52),
 'tao':(505,15,592,652,812,1015,40)}
AX,TIP,GT,GS,GE,END,GW=SW[sw_name]
S,TX,TY=0.48,380,230; FT,FB=380,615
def keyc(p,thr=60):
    a=np.array(Image.open(p).convert('RGB')).astype(int); bg=np.median(np.concatenate([a[:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]),0)
    d=np.sqrt(((a-bg)**2).sum(-1)); return a,np.clip((d-thr*0.5)/(thr*0.5),0,1)
h,ha=keyc('s_hand.jpg')
yy,xx=np.mgrid[0:1024,0:1024]; cx=570+(yy-100)*(-0.1616); band=np.abs(xx-cx)<30
rodcol=(np.abs(h[...,0]-140)<50)&(np.abs(h[...,1]-85)<45)&(h[...,2]<100)
keep=(ha>0)&(xx>=395)&(yy>=330)&(yy<=640)&((xx+(yy-330)*1.1)>470)
keep&=~(band&((yy<FT)|(yy>FB))); keep&=~(band&rodcol&(yy<FT+45))
keep=nd.binary_opening(keep,iterations=1); lab,n=nd.label(keep); sz=nd.sum(keep,lab,range(1,n+1)); keep=lab==(np.argmax(sz)+1)
keep=nd.binary_erosion(keep,iterations=1)
alpha=nd.gaussian_filter(keep.astype(float),0.8)*np.clip(ha*1.5-0.5,0,1)
mg=(h[...,0]>h[...,1]+60)&(h[...,2]>h[...,1]+60); h[mg]=[40,25,30]
H=np.dstack([h,alpha*255]).astype(np.uint8)
s,sa=keyc(f'sw_{sw_name}.jpg',80)
g=(s[...,1]>s[...,0]+40)&(s[...,1]>s[...,2]+40); s[g&(sa<1)]=[40,30,30]   # 去绿边
S0=Image.fromarray(np.dstack([s,sa*255]).astype(np.uint8))
L0,R0=AX-130,AX+130
k=50.0/GW
blade=S0.crop((L0,TIP,R0,GT)); guard=S0.crop((L0,GT,R0,GS)); grip=S0.crop((L0,GS+8,R0,GE-8)); pom=S0.crop((L0,GE-8,R0,END))
tgt=int(726/k); blade=blade.resize((260,max(tgt,blade.height)),Image.LANCZOS)
need=FB-FT+70; gl=int(need/k); G=Image.new('RGBA',(260,gl))
for y in range(0,gl,grip.height): G.alpha_composite(grip.crop((0,0,260,min(grip.height,gl-y))),(0,y))
parts=[blade,guard,G,pom]; Ht=sum(p.height for p in parts); sw=Image.new('RGBA',(260,Ht)); y=0
for p in parts: sw.alpha_composite(p,(0,y)); y+=p.height
sw=sw.resize((int(260*k),int(Ht*k)),Image.LANCZOS)
guard_y=(blade.height+guard.height)*k; axx=130*k
ang=np.degrees(np.arctan(0.1616)); PAD=900
big=Image.new('RGBA',(1024,1024+PAD)); gy=FT-26; gx=570+(gy-100)*(-0.1616)
big.alpha_composite(sw,(int(gx-axx),int(gy-guard_y)+PAD))
big=big.rotate(-ang,center=(gx,gy+PAD),resample=Image.BICUBIC)
B=np.array(big); yy2=np.mgrid[0:1024+PAD,0:1024][0]
up=B.copy(); up[...,3]=np.where(yy2<FT+6+PAD,up[...,3],0)
Hn=Image.new('RGBA',(1024,1024+PAD)); Hn.alpha_composite(Image.fromarray(H),(0,PAD))
lay=Image.new('RGBA',(1024,1024+PAD)); lay.alpha_composite(big); lay.alpha_composite(Hn); lay.alpha_composite(Image.fromarray(up))
L=lay.resize((int(1024*S),int((1024+PAD)*S)),Image.LANCZOS)
b2=Image.new('RGBA',(2048,2048)); b2.alpha_composite(L,(TX+512,TY-int(PAD*S)+512)); out=b2.crop((512,512,1536,1536))
# 手腕不压袖口：仅在手（非剑）区域，body 上非肤色像素处去掉
body=np.array(Image.open(f'/workspace/cardlegend/wt-sup/public/assets/equip/{cls}/body.png').convert('RGBA')).astype(int)
handonly=Image.new('RGBA',(2048,2048)); handonly.alpha_composite(Hn.resize(L.size,Image.LANCZOS),(TX+512,TY-int(PAD*S)+512)); ho=np.array(handonly.crop((512,512,1536,1536)))[...,3]>0
upc=Image.new('RGBA',(2048,2048)); upc.alpha_composite(Image.fromarray(up).resize(L.size,Image.LANCZOS),(TX+512,TY-int(PAD*S)+512)); upm=np.array(upc.crop((512,512,1536,1536)))[...,3]>20
br,bgc,bb,ba=body[...,0],body[...,1],body[...,2],body[...,3]
skin=(br>170)&(br-bb>60)&(bgc>100)
sleeve=(ba>200)&~skin
sleeve=nd.binary_opening(sleeve,iterations=5)
X=np.mgrid[0:1024,0:1024][1]
cut=ho&sleeve&~upm&(X<615)
o=np.array(out).astype(int); o[cut,3]=0
r,gg,bl,a=o[...,0],o[...,1],o[...,2],o[...,3]
o[((r-gg>70)&(bl-gg>20)&(a>0))|((gg-r>50)&(gg-bl>50)&(a>0)),0:3]=[45,28,30]
o[...,3]=np.where(a<90,0,a)
out=Image.fromarray(o.astype(np.uint8)); out.save(outp)
arm='cloth'
t=Image.new('RGBA',(1024,1024),(70,70,80,255)); t.alpha_composite(Image.fromarray(body.astype(np.uint8))); t.alpha_composite(out)
t.convert('RGB').crop((520,300,760,560)).resize((720,780),Image.LANCZOS).save(pre+'_3x.png')
t.convert('RGB').crop((380,0,900,720)).save(pre+'_v.png')
print(outp,out.getbbox())
