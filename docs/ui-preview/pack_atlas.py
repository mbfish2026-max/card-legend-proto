"""简易 shelf 打包预览 atlas（正式打包建议 TexturePacker/free-tex-packer，padding 2 + extrude 1）。"""
from PIL import Image;import json,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H)
SP=json.load(open('slices.json'));ims=[(n,Image.open(f'slices/{n}.png').convert('RGBA')) for n in SP];tot=sum(os.path.getsize(f'slices/{n}.png') for n in SP)
W=512;x=y=rh=0;pos={}
for n,i in sorted(ims,key=lambda t:(-t[1].height,-t[1].width)):
    if x+i.width+2>W: x=0;y+=rh+2;rh=0
    pos[n]=(x,y);x+=i.width+2;rh=max(rh,i.height)
Hh=y+rh;at=Image.new('RGBA',(W,Hh));d=dict(ims)
for n,p in pos.items(): at.paste(d[n],p)
at.save('atlas_ui_preview.png',optimize=True)
at.save('atlas_ui_preview_lossless.webp',lossless=True); at.save('atlas_ui_preview_q90.webp',quality=90,alpha_quality=95)
json.dump({'frames':{n:{'frame':{'x':p[0],'y':p[1],'w':d[n].width,'h':d[n].height}} for n,p in pos.items()},'meta':{'image':'atlas_ui_preview.png','size':{'w':W,'h':Hh}}},open('atlas_ui_preview.json','w'),indent=0)
print(len(SP),'png',tot,'atlas',W,Hh,os.path.getsize('atlas_ui_preview.png'),'wl',os.path.getsize('atlas_ui_preview_lossless.webp'),'q90',os.path.getsize('atlas_ui_preview_q90.webp'),'gpu',W*Hh*4)
new=0
for n in list(SP)[25:]: new+=os.path.getsize(f'slices/{n}.png')
print('new15',new)
