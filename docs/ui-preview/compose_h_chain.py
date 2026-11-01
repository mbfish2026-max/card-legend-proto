"""预览：H 链 29 张，按类别：64 原尺寸+文件名/中文名、36px(×2)、qframe_common 与背包格、现有同类对照。"""
from PIL import Image,ImageDraw,ImageFont;import os
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);I='../../public/assets/items/'
F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',s)
G=[('项链',[('h_gold_necklace','金项链'),('h_black_crystal_necklace','黑色水晶项链'),('h_ebony_necklace','黑檀项链'),('h_yellow_crystal_necklace','黄色水晶项链'),('h_devil_necklace','魔鬼项链'),('h_amber_necklace','琥珀项链'),('h_phoenix_pearl','凤凰明珠'),('h_blue_jade_necklace','蓝翡翠项链')],['eq_green_necklace','eq_ghost_necklace','eq_fashen_necklace','eq_leiting_necklace']),
('手镯',[('h_leather_glove','皮制手套'),('h_steel_bracelet','钢手镯'),('h_big_bracelet','大手镯'),('h_magic_bracelet','魔法手镯'),('h_sturdy_glove','坚固手套'),('h_ebony_bracelet','黑檀手镯'),('h_tao_bracelet','道士手镯'),('h_power_bracelet','魔力手镯'),('h_death_glove','死神手套'),('h_gold_bracelet','金手镯')],['eq_bracelet','eq_ghost_glove','eq_dragon_bracelet','eq_heart_bracelet']),
('戒指',[('h_hex_ring','六角戒指'),('h_glass_ring','玻璃戒指'),('h_horn_ring','牛角戒指'),('h_blue_crystal_ring','蓝色水晶戒指'),('h_black_crystal_ring','黑色水晶戒指'),('h_snake_eye_ring','蛇眼戒指'),('h_pearl_ring','珍珠戒指')],['eq_iron_ring','eq_gold_ring','eq_dragon_ring','eq_fashen_ring']),
('靴子',[('h_cloth_shoes','布鞋'),('h_deer_boots','鹿皮靴'),('h_silk_boots','紫绸靴'),('h_soul_boots','避魂靴')],['eq_leiting_boots','eq_guangmang_boots'])]
CW=124;RH=330;W=CW*10+40;Hh=RH*4+20+430
bg=Image.open('src/tex_dark_256.jpg').convert('RGBA');cv=Image.new('RGBA',(W,Hh));[cv.paste(bg,(x,y)) for x in range(0,W,256) for y in range(0,Hh,256)];d=ImageDraw.Draw(cv)
qf=Image.open('slices/qframe_common.png').convert('RGBA');sl=Image.open('slices/slot.png').convert('RGBA')
T=lambda x,y,s,z=13,c=(255,224,112):d.text((x,y),s,font=F(z),fill=c)
for gi,(cat,items,old) in enumerate(G):
    y0=10+gi*RH;T(16,y0,f'{cat}（{len(items)}）  行：64 原尺寸 / 36px×2 / qframe_common 40 + 背包格 / 现有同类 36px×2',16)
    for k,(n,cn) in enumerate(items):
        x=20+k*CW;im=Image.open(I+n+'.png')
        cv.alpha_composite(im,(x+28,y0+30));T(x,y0+96,cn,13);T(x,y0+112,n,10,(200,200,200))
        cv.alpha_composite(im.resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(x+24,y0+132))
        cv.alpha_composite(sl.resize((48,48)),(x+4,y0+212));cv.alpha_composite(im.resize((40,40),Image.LANCZOS),(x+8,y0+216))
        cv.alpha_composite(qf.resize((48,48)),(x+60,y0+212));cv.alpha_composite(im.resize((40,40),Image.LANCZOS),(x+64,y0+216))
    for k,n in enumerate(old):
        x=20+k*CW;cv.alpha_composite(Image.open(I+n+'.png').convert('RGBA').resize((36,36),Image.LANCZOS).resize((54,54),Image.NEAREST),(x+30,y0+266));T(x+90,y0+300,n,9,(160,160,160))
    T(20+len(old)*CW,y0+285,'← 现有同类（对照）',12,(160,160,160))
# v2 修正前 vs 修正后（修正前取自 4cf047e，存于 /tmp/v1 或 git show）
import subprocess,io
def v1(n):
    return Image.open(io.BytesIO(subprocess.check_output(['git','show',f'4cf047e:public/assets/items/{n}.png']))).convert('RGBA')
y=RH*4+20;T(16,y,'v2 修正前(上) vs 修正后(下)：40px 放入 qframe_common 格 / 右侧为同尺寸现有 eq_* 项链对照',16)
ROWS=[('暗色提亮',['h_black_crystal_necklace','h_ebony_necklace','h_ebony_bracelet','h_death_glove','h_black_crystal_ring']),('项链放大',[n for n,_ in G[0][1]]+['eq_green_necklace','eq_ghost_necklace','eq_fashen_necklace','eq_leiting_necklace']),('手镯造型',['h_steel_bracelet','h_ebony_bracelet'])]
x=20;yy=y+30
for lab,ns in ROWS:
    T(x,yy,lab,13,(200,200,200))
    for k,n in enumerate(ns):
        xx=x+k*56;
        for r,im in enumerate([v1(n) if n.startswith('h_') else None,Image.open(I+n+'.png').convert('RGBA')]):
            if im is None:continue
            cv.alpha_composite(qf.resize((48,48)),(xx,yy+20+r*54));cv.alpha_composite(im.resize((40,40),Image.LANCZOS),(xx+4,yy+24+r*54))
    if lab=='项链放大':yy+=140;x=20
    else:x+=len(ns)*56+30
    if lab=='暗色提亮':pass
cv.convert('RGB').save('preview_h_chain_icons.jpg',quality=88);print(cv.size)
