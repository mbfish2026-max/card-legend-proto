"""预览：腰带 7 条（按等级）+ 空栏底图放入装备栏格。"""
from PIL import Image,ImageDraw,ImageFont;import os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);I='../../public/assets/items/';U='../../public/assets/ui/'
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',s)
B=[('belt_hide','兽皮腰带',15),('belt_iron','铁腰带',22),('belt_bronze','青铜腰带',30),('belt_steel','钢铁腰带',35),('belt_leiting','雷霆腰带',45),('belt_lieyan','烈焰腰带',45),('belt_guangmang','光芒腰带',45)]
REF=['gen_bracelet','h_soul_boots','h_gold_bracelet','eq_leiting_boots','eq_guangmang_boots']
CW=150;W=CW*7+40;Hh=640
bg=Image.open('src/tex_dark_256.jpg').convert('RGBA');cv=Image.new('RGBA',(W,Hh));[cv.paste(bg,(x,y)) for x in range(0,W,256) for y in range(0,Hh,256)];d=ImageDraw.Draw(cv)
qf=Image.open('slices/qframe_common.png').convert('RGBA');sl=Image.open('slices/slot.png').convert('RGBA')
T=lambda x,y,s,z=13,c=(255,224,112):d.text((x,y),s,font=F(z),fill=c)
T(16,8,'腰带 7 条（按等级）  行：64 原尺寸 / 36px×2 / 背包格 + qframe_common 40px / 底部：对照 + 空栏底图',16)
for k,(n,cn,lv) in enumerate(B):
    x=20+k*CW;im=Image.open(I+n+'.png');y=40
    cv.alpha_composite(im,(x+40,y));T(x+10,y+68,f'Lv{lv} {cn}',14);T(x+10,y+88,n,11,(200,200,200))
    cv.alpha_composite(im.resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(x+36,y+112))
    cv.alpha_composite(sl.resize((48,48)),(x+14,y+196));cv.alpha_composite(im.resize((40,40),Image.LANCZOS),(x+18,y+200))
    cv.alpha_composite(qf.resize((48,48)),(x+74,y+196));cv.alpha_composite(im.resize((40,40),Image.LANCZOS),(x+78,y+200))
y=310;T(16,y,'现有同类/相邻图标对照（36px×2）：占位 gen_bracelet、h_ 首饰/靴子、eq_ 套装靴',13,(180,180,180))
for k,n in enumerate(REF):
    cv.alpha_composite(Image.open(I+n+'.png').convert('RGBA').resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(20+k*110,y+24));T(20+k*110,y+98,n,10,(160,160,160))
for k,n in enumerate(B):
    cv.alpha_composite(Image.open(I+n[0]+'.png').resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(580+k*76,y+24))
y=440;T(16,y,'空栏底图（60px，叠在装备栏 slot 64 内）：腰带位 / 靴子位；右侧为装上腰带/靴子后的对比；@2x 放大',13,(180,180,180))
for k,n in enumerate(['slot_empty_belt','slot_empty_boots']):
    x=20+k*170;s=sl.copy();s.alpha_composite(Image.open(U+n+'.png'),(2,2));cv.alpha_composite(s,(x,y+30));T(x,y+100,n,11,(200,200,200))
    s2=sl.copy();s2.alpha_composite(Image.open(I+('belt_steel' if k==0 else 'h_soul_boots')+'.png').resize((56,56),Image.LANCZOS),(4,4));cv.alpha_composite(s2,(x+76,y+30))
for k,n in enumerate(['slot_empty_belt','slot_empty_boots']):
    s=sl.resize((128,128));s.alpha_composite(Image.open(U+n+'@2x.png'),(4,4));cv.alpha_composite(s,(400+k*150,y+20))
cv.convert('RGB').save('preview_belt_icons.jpg',quality=88);print(cv.size)
