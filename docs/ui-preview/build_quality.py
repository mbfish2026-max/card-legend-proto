"""品质框 qframe_<rarity>：细边（2px 主色斜面 + 1px 黑外描 + 1px 暗内线）+ 少量高光，中心透明。key/色值取自 src/ui/Panel.ts RARITY_NUM。"""
from PIL import Image;import json,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H)
# 主色=Panel.ts RARITY_NUM（框色）；common 0x8a8a8a 在暗底偏闷，框上用同色系略提亮的高光
Q={'common':(0x8a,0x8a,0x8a),'magic':(0x3a,0x7a,0xff),'rare':(0xff,0xa0,0x20)}
S=32;M=5
def mix(c,k): return tuple(max(0,min(255,int(v*k))) for v in c)
for key,c in Q.items():
    im=Image.new('RGBA',(S,S),(0,0,0,0));p=im.load()
    for y in range(S):
        for x in range(S):
            d=min(x,y,S-1-x,S-1-y)
            if d==0: p[x,y]=(8,6,4,255)
            elif d in(1,2):
                tl = (x<=2 or y<=2) and not (x>=S-3 or y>=S-3) or (x<=2 and y<=2)
                k=(1.35 if d==1 else 1.0) if tl else (0.95 if d==1 else 0.72)
                if key=='rare' and d==1 and tl: k=1.45
                p[x,y]=mix(c,k)+(255,)
            elif d==3: p[x,y]=(10,8,6,230)
            elif d==4: p[x,y]=c+((40 if key=='common' else 70),)
    # 左上角 1px 亮点（克制的高光）
    for x,y in((1,1),(2,1),(1,2)): p[x,y]=mix(c,1.6 if key!='common' else 1.4)+(255,)
    im.save(f'slices/qframe_{key}.png',optimize=True)
sp=json.load(open('slices.json'))
CN={'common':'普通','magic':'精良','rare':'极品'}
for k in Q: sp[f'qframe_{k}']={'w':S,'h':S,'left':M,'right':M,'top':M,'bottom':M,'use':f'品质框·{CN[k]}（rarity={k}）；细边 3px+内光，中心透明，叠在 slot/goods_slot 或图标之上，任意尺寸 nineslice'}
json.dump(sp,open('slices.json','w'),ensure_ascii=False,indent=1);print(len(sp))
