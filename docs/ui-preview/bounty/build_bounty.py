"""悬赏菜单图标（assets-manifest menu_1 → items/INV_Misc_Bag_08.png，同名替换 64×64 RGBA 透明底）。
源图 bounty_src.jpg（GenerateImage 原创：木板钉羊皮纸通缉令，红骷髅+交叉剑+火漆，金币堆）。Hud 会画 r21 金边圆底并以 r18 圆遮罩显示 34px，故内容收在 56px 内。"""
from PIL import Image,ImageEnhance,ImageFilter;import numpy as np,os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H)
a=np.asarray(Image.open('bounty_src.jpg').convert('RGB')).astype(float);al=np.clip((a.max(2)-6)/20,0,1)
im=Image.fromarray(np.dstack([a,al*255]).astype('uint8'),'RGBA');im=im.crop(im.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox())
w,h=im.size;im=im.crop((int(w*.1),int(h*.06),int(w*.9),h))  # 裁掉外圈木板，让羊皮纸占满圆框
S=64;k=60/max(im.size);im=im.resize((round(im.width*k),round(im.height*k)),Image.LANCZOS)
rgb=ImageEnhance.Sharpness(ImageEnhance.Contrast(im.convert('RGB')).enhance(1.12)).enhance(1.6);im=Image.merge('RGBA',(*rgb.split(),im.getchannel('A')))
c=Image.new('RGBA',(S,S));c.paste(im,((S-im.width)//2,(S-im.height)//2),im)
sh=Image.new('RGBA',(S,S),(0,0,0,0));sh.putalpha(c.getchannel('A').filter(ImageFilter.GaussianBlur(1.3)).point(lambda v:int(v*.75)))
o=Image.new('RGBA',(S,S));o.alpha_composite(sh,(1,1));o.alpha_composite(c);o.save('../../../public/assets/items/INV_Misc_Bag_08.png',optimize=True)
print(os.path.getsize('../../../public/assets/items/INV_Misc_Bag_08.png'))
