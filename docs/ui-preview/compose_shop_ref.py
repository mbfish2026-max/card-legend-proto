"""参考图对照：左=用户参考图，右=新切片按同布局拼的两行十格商城（图标借用 public/assets/items，仅预览）。"""
import os,sys
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'compose_preview.py'),encoding='utf-8').read().split("os.makedirs(f'{H}',exist_ok=True)")[0])
from PIL import ImageOps
REF=sys.argv[1] if len(sys.argv)>1 else None
G=['dungeon_scroll','eq_green_necklace','INV_Misc_Gem_Pearl_01','eq_dragon_ring','eq_armor','INV_Chest_Plate01','INV_Chest_Plate02','eq_fashen_helm','INV_Helmet_02','INV_Helmet_04']
W2,H2=660,360;c=Image.new('RGBA',(W2,H2),(26,14,10,255))
put(c,'divider_v',14,10,8,H2-20)
lf=Image.open(f'{H}/slices/lingfu_icon_xs.png').convert('RGBA')
for j,n in enumerate(G):
    s=108;x=42+(j%5)*120;y=34+(j//5)*150;st='sel' if j==1 else 'soldout' if j==3 else 'normal'
    put(c,f'goods_slot_{st}',x,y,s,s)
    ic=ico(f'{R}/items/{n}.png',s-36)
    if st=='soldout': ic=Image.merge('RGBA',[*ImageOps.grayscale(ic.convert('RGB')).convert('RGB').split(),ic.split()[3].point(lambda v:v//2)])
    c.alpha_composite(ic,(x+18,y+18))
    if j==0: c.alpha_composite(Image.open(f'{H}/slices/badge_corner.png').convert('RGBA').resize((s//2,s//2),Image.LANCZOS),(x+s-s//2,y))
    c.alpha_composite(lf.resize((18,18),Image.LANCZOS),(x+14,y+s+6))
    text(c,x+36,y+s+15,'售罄' if st=='soldout' else str(100*(j+1)),15,(200,200,200) if st=='soldout' else (255,236,190),'lm')
out=Image.new('RGB',(1340,400),(0,0,0))
if REF and os.path.exists(REF):
    r=Image.open(REF).convert('RGB');r.thumbnail((660,360));out.paste(r,(10,30))
text_c=Image.new('RGBA',out.size,(0,0,0,0));text(text_c,340,14,'用户参考图',14);text(text_c,1010,14,'新切片合成（goods_slot_* / badge_corner / lingfu_icon_xs）',14)
out.paste(c.convert('RGB'),(670,30));o=out.convert('RGBA');o.alpha_composite(text_c);o.convert('RGB').save(f'{H}/preview_shop_ref.jpg',quality=90);print(os.path.getsize(f'{H}/preview_shop_ref.jpg'))
