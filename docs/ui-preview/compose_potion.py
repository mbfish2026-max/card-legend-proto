"""预览：12 张药水图标 64 原尺寸 / 36px（×2 放大）/ goods_slot 与背包格 / 现有药瓶对照。"""
from PIL import Image,ImageDraw,ImageFont;import os,glob
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);I='../../public/assets/items/'
fp=[f for f in glob.glob('/usr/share/fonts/**/*.tt*',recursive=True) if 'CJK' in f or 'Noto' in f] or glob.glob('/usr/share/fonts/**/*.tt*',recursive=True);F=lambda s:ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',s)
N=['pot_hp_big','pot_mp_big','pot_sun','pot_sun_big','bundle_hp_small','bundle_mp_small','bundle_hp_mid','bundle_mp_mid','bundle_hp_big','bundle_mp_big','bundle_sun','bundle_sun_big']
ic={n:Image.open(I+n+'.png') for n in N};slot=Image.open('slices/goods_slot_normal.png');bag=Image.open('slices/slot.png')
bg=Image.open('src/tex_dark_256.jpg').convert('RGBA');W,Hh=1300,860
cv=Image.new('RGBA',(W,Hh));[cv.paste(bg,(x,y)) for x in range(0,W,256) for y in range(0,Hh,256)];d=ImageDraw.Draw(cv)
T=lambda x,y,s,z=15,c=(255,224,112):d.text((x,y),s,font=F(z),fill=c)
CW=106
T(16,8,'1) 原尺寸 64×64（文件名）',19)
for k,n in enumerate(N):x=16+k*CW;cv.alpha_composite(ic[n],(x+20,36));T(x,104,n.replace('bundle_','b_'),11,(220,220,220))
T(16,130,'2) 36px 实际显示（再 ×2 最近邻放大便于看）',19)
for k,n in enumerate(N):cv.alpha_composite(ic[n].resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(16+k*CW+14,160))
T(16,245,'3) 36px 原大（深色药水格 56px 内）',19)
for k,n in enumerate(N):
    x=16+k*CW+20;d.rectangle((x,275,x+55,330),fill=(18,12,10),outline=(150,110,50));cv.alpha_composite(ic[n].resize((36,36),Image.LANCZOS),(x+10,285))
T(16,345,'4) goods_slot 80×80 + 背包格',19)
bs=bag.resize((56,56),Image.LANCZOS) if bag.size!=(56,56) else bag
for k,n in enumerate(N):
    x=16+k*CW;cv.alpha_composite(slot.resize((80,80)),(x,375));cv.alpha_composite(ic[n],(x+8,383))
    cv.alpha_composite(bs,(x+12,465));cv.alpha_composite(ic[n].resize((44,44),Image.LANCZOS),(x+18,471))
T(16,535,'5) 与现有药瓶对照（左 6 张为现有 hp/mp small/mid/strong，36px）',19)
old=['hp_small','hp_mid','hp_strong','mp_small','mp_mid','mp_strong']
for k,n in enumerate(old+N[:4]):
    im=Image.open(I+n+'.png').resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST);cv.alpha_composite(im,(16+k*CW+14,565));T(16+k*CW+10,640,n,11,(200,200,200) if k<6 else (255,224,112))
T(16,670,'6) 同色系 36px 并排：红 / 蓝 / 金',19)
for r,g in enumerate([['pot_hp_big','bundle_hp_small','bundle_hp_mid','bundle_hp_big'],['pot_mp_big','bundle_mp_small','bundle_mp_mid','bundle_mp_big'],['pot_sun','pot_sun_big','bundle_sun','bundle_sun_big']]):
    for k,n in enumerate(g):cv.alpha_composite(ic[n].resize((36,36),Image.LANCZOS).resize((72,72),Image.NEAREST),(16+r*420+k*96,705))
cv.convert('RGB').save('preview_potion_icons.jpg',quality=90);print('ok')
