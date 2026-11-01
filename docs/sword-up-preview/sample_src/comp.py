import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
S=float(sys.argv[1]); TX,TY=int(sys.argv[2]),int(sys.argv[3])  # 手图缩放与平移（手图坐标*S+T -> 画布）
FT,FB=380,615   # 手图中拳头上下沿（行）
def keyc(p,thr=60):
    a=np.array(Image.open(p).convert('RGB')).astype(int); bg=np.median(np.concatenate([a[:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]),0)
    d=np.sqrt(((a-bg)**2).sum(-1)); al=np.clip((d-thr*0.5)/(thr*0.5),0,1)
    return a,al
# 手
h,ha=keyc('s_hand.jpg')
yy,xx=np.mgrid[0:1024,0:1024]
cx=570+(yy-100)*(-0.1616)          # 棍中轴
band=np.abs(xx-cx)<30
rodcol=(np.abs(h[...,0]-140)<50)&(np.abs(h[...,1]-85)<45)&(h[...,2]<100)
keep=ha>0
keep&= (xx>=395)&(yy>=330)&(yy<=640)      # 只要拳头+腕
# 腕部斜切：保留 x+y 大于阈值
keep&= (xx+ (yy-330)*1.1) > 470
keep&=~(band&((yy<FT)|(yy>FB)))           # 拳外的棍去掉
keep&=~(band&rodcol)                      # 拳内露出的棍也去掉，让真剑柄透出
keep=nd.binary_opening(keep,iterations=1)
lab,n=nd.label(keep); sz=nd.sum(keep,lab,range(1,n+1)); keep=lab==(np.argmax(sz)+1)
keep=nd.binary_erosion(keep,iterations=1)
alpha=nd.gaussian_filter(keep.astype(float),0.8)*np.clip(ha*1.5-0.5,0,1)
mg=(h[...,0]>h[...,1]+60)&(h[...,2]>h[...,1]+60); h[mg]=[40,25,30]
H=np.dstack([h,alpha*255]).astype(np.uint8)
# 剑：竖直纯剑 -> 旋转到棍的角度、缩放到柄宽
s,sa=keyc('s_sword.jpg',80)
SW=np.dstack([s,sa*255]).astype(np.uint8)
S0=Image.fromarray(SW)
blade=S0.crop((400,30,620,722)); grip=S0.crop((400,740,620,890)); pom=S0.crop((400,890,620,960)); g0=S0.crop((400,722,620,740))
blade=blade.resize((220,int(692*1.35)),Image.LANCZOS)
need=FB-FT+70; k=0.85
gl=int(need/k); G=Image.new('RGBA',(220,gl))
for y in range(0,gl,150): G.alpha_composite(grip.crop((0,0,220,min(150,gl-y))),(0,y))
parts=[blade,g0,G,pom]; Ht=sum(p.height for p in parts)
sw=Image.new('RGBA',(220,Ht)); y=0
for p in parts: sw.alpha_composite(p,(0,y)); y+=p.height
sw=sw.resize((int(220*k),int(Ht*k)),Image.LANCZOS)
guard_y=(blade.height+18)*k; axx=110*k
ang=np.degrees(np.arctan(0.1616))
PAD=800
big=Image.new('RGBA',(1024,1024+PAD),(0,0,0,0))
gy=FT-14                           # 护手下沿放在拳上沿之上
ox=int(570+(gy-100)*(-0.1616)-axx); oy=int(gy-guard_y)+PAD
big.alpha_composite(sw,(ox,oy))
big=big.rotate(-ang,center=(570+(gy-100)*(-0.1616),gy+PAD),resample=Image.BICUBIC)
B=np.array(big)
yy2,xx2=np.mgrid[0:1024+PAD,0:1024]
low=B.copy(); up=B.copy()
# 拳上沿沿柄轴的分界（剑轴坐标），上半在拳外才压在手上
up[...,3]=np.where(yy2<FT+6+PAD,up[...,3],0)
Hn=Image.new('RGBA',(1024,1024+PAD)); Hn.alpha_composite(Image.fromarray(H),(0,PAD))
lay=Image.new('RGBA',(1024,1024+PAD)); lay.alpha_composite(Image.fromarray(low)); lay.alpha_composite(Hn); lay.alpha_composite(Image.fromarray(up))
lay.save('s_handsword.png')
# 缩放到画布
L=lay.resize((int(1024*S),int((1024+PAD)*S)),Image.LANCZOS)
out=Image.new('RGBA',(1024,1024)); big2=Image.new('RGBA',(2048,2048)); big2.alpha_composite(L,(TX+512,TY-int(PAD*S)+512)); out=big2.crop((512,512,1536,1536))
out.save('L_s_warrior_wood.png')
b=Image.open('/workspace/cardlegend/wt-sup/public/assets/equip/warrior/body.png').convert('RGBA')
t=Image.new('RGBA',b.size,(70,70,80,255)); t.alpha_composite(b); t.alpha_composite(out)
t.save('s_full.png'); t.convert('RGB').crop((520,300,760,560)).resize((720,780),Image.LANCZOS).save(sys.argv[4]+'_3x.png')
t.convert('RGB').crop((380,0,900,640)).save(sys.argv[4]+'_v.png')
o=np.array(out).astype(int); r,g,b,a=o[...,0],o[...,1],o[...,2],o[...,3]
sp=(r-g>70)&(b-g>20)&(a>0)   # 紫/洋红溢色
o[sp,0:3]=[45,28,30]
o[...,3]=np.where((a<90),0,a)
out=Image.fromarray(o.astype(np.uint8)); out.save('L_s_warrior_wood.png')
t=Image.new('RGBA',b.shape[::-1] if False else (1024,1024),(70,70,80,255)); t.alpha_composite(Image.open('/workspace/cardlegend/wt-sup/public/assets/equip/warrior/body.png').convert('RGBA')); t.alpha_composite(out)
t.convert('RGB').crop((520,300,760,560)).resize((720,780),Image.LANCZOS).save(sys.argv[4]+'_3x.png')
t.convert('RGB').crop((380,0,900,640)).save(sys.argv[4]+'_v.png')
