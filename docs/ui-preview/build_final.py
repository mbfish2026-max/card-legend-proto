"""第五轮：为塞进 512×512 图集，裁短部分九宫格切片的中段（角/边不变），并新增血球液面 orb_fill_red/blue。"""
from PIL import Image,ImageDraw,ImageFilter;import json,os,math
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);sp=json.load(open('slices.json'))
TRIM={'panel_frame':(40,40),'recharge_card_normal':(20,40),'recharge_card_sel':(20,40),'recharge_card_rec':(20,40),'dialog_frame':(24,24)}
def trim(n,cw,ch):
    v=sp[n];im=Image.open(f'slices/{n}.png').convert('RGBA');W,Hh=im.size;L,R,T,B=v['left'],v['right'],v['top'],v['bottom']
    if W==L+cw+R and Hh==T+ch+B: return
    def cut1(img,axis,a,c,b):
        size=img.size[axis];m0=(a+(size-a-b)//2)-c//2
        boxes=[(0,a),(m0,m0+c),(size-b,size)];parts=[img.crop((x0,0,x1,img.height)) if axis==0 else img.crop((0,x0,img.width,x1)) for x0,x1 in boxes]
        out=Image.new('RGBA',(a+c+b,img.height) if axis==0 else (img.width,a+c+b));o=0
        for p in parts: out.paste(p,(o,0) if axis==0 else (0,o));o+=p.size[axis]
        return out
    im=cut1(cut1(im,0,L,cw,R),1,T,ch,B);im.save(f'slices/{n}.png',optimize=True);v['w'],v['h']=im.size
for n,(cw,ch) in TRIM.items(): trim(n,cw,ch)
# 血球液面：64×64 圆盘（半径 32），纵向渐变 + 左上高光，代码按水位 setCrop
for key,(top,bot) in {'red':((236,60,44),(96,6,6)),'blue':((70,130,255),(8,24,110))}.items():
    S=256;im=Image.new('RGBA',(S,S),(0,0,0,0));px=im.load()
    for y in range(S):
        k=y/(S-1);c=tuple(int(top[i]*(1-k)+bot[i]*k) for i in range(3))
        for x in range(S):
            dx,dy=(x-S/2+.5)/(S/2),(y-S/2+.5)/(S/2);r=math.hypot(dx,dy)
            if r<=1: e=1-0.35*r**3;px[x,y]=tuple(int(v*e) for v in c)+(255,)
    hl=Image.new('L',(S,S),0);ImageDraw.Draw(hl).ellipse((S*.22,S*.12,S*.52,S*.32),fill=70);hl=hl.filter(ImageFilter.GaussianBlur(12))
    w=Image.new('RGBA',(S,S),(255,255,255,0));w.putalpha(hl);im.alpha_composite(w);im.putalpha(Image.eval(im.split()[3],lambda a:a))
    im.resize((64,64),Image.LANCZOS).save(f'slices/orb_fill_{key}.png',optimize=True)
    sp[f'orb_fill_{key}']={'w':64,'h':64,'left':0,'right':0,'top':0,'bottom':0,'fixed':True,'use':f'血球液面（{"红/血" if key=="red" else "蓝/魔"}）圆盘，半径 32；显示直径=球显示直径×104/128，按水位 setCrop 从上裁；层序 2'}
for n,v in sp.items(): v['fixed']=v['left']+v['right']+v['top']+v['bottom']==0
json.dump(sp,open('slices.json','w'),ensure_ascii=False,indent=1);print(len(sp))
